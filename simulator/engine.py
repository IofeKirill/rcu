"""Simple deterministic geometry for the ZMROBO classroom simulator."""
import base64
import colorsys
import math
import random
import json
from pathlib import Path
import mechanisms
import car_model
from devices import Devices

WIDTH, HEIGHT = 800, 500
MAX_SPEED = 42.0  # cm/s at power 100
WHEEL_RADIUS = 2.8
# The E6 reference turns 90° when both wheels rotate 220° in opposite directions.
E6_TRACK = 2 * WHEEL_RADIUS * 220 / 90
MOTOR_ENCODER_RATIO = {'standard': 1, 'sport': 900 / 220}
M6_TRACK = 8.0  # Previous default for the 18 cm model, pending measurement.
# Solid parts in the 1080 px artwork coordinate system, facing +x.
# Split the E6 fork into two arms so the gap and the corners remain free.
E6_SPORT_PARTS = ((147,173,615,906), (93,58,470,207), (93,874,470,1024),
            (611,247,680,448), (611,632,680,833),
            (611,450,967,510), (611,569,967,629), (845,394,1033,687))
# Ordinary-motor base faces its driven wheels: source image rotated -90°.
E6_STANDARD_PARTS = ((155,298,887,761), (251,239,490,822),
                     (620,798,985,940), (620,131,985,269),
                     (612,236,810,825), (114,376,155,686), (70,449,155,616))
M6_PARTS = ((223,273,747,793), (409,45,836,226), (409,843,836,1020),
            (526,218,724,277), (526,790,724,850), (157,366,232,704))
TICK = 0.01
CONTACT_EPS = 1e-6  # cm

# radius (cm), fraction of impact speed transferred, drag (1/s), wall bounce
PROP_TYPES = {'can': (3.3,.35,9,0), 'ball': (3.35,.95,1.7,.48)}

class Prop:
    def __init__(self, x, y, kind):
        self.x,self.y,self.kind = x,y,kind
        self.radius,self.transfer,self.drag,self.bounce = PROP_TYPES[kind]
        self.vx = self.vy = 0.
        self.held_by = None
        self.inactive = False
        self.last_touch = None
        self.last_touch_position = None
        self.mass = 1.0 if kind=='can' else .45

    def circle(self):
        return self.x,self.y,self.radius


CLAWS = json.loads(Path(__file__).with_name('media').joinpath('claws.json').read_text(encoding='utf8'))

def polygon_at(poly, x, y, c, s):
    return [(x+c*u-s*v,y+s*u+c*v) for u,v in poly]

def box_polygon(a,b,w,h):
    return [(a,b),(a+w,b),(a+w,b+h),(a,b+h)]

def polygons_overlap(a,b):
    for poly in (a,b):
        for (x,y),(xx,yy) in zip(poly,poly[1:]+poly[:1]):
            nx,ny = y-yy,xx-x
            aa = [nx*u+ny*v for u,v in a]
            bb = [nx*u+ny*v for u,v in b]
            if max(aa)<=min(bb) or max(bb)<=min(aa):
                return False
    return True

def polygon_contact(u,v,r,poly):
    closest = None
    inside = True
    for (a,b),(x,y) in zip(poly,poly[1:]+poly[:1]):
        dx,dy = x-a,y-b
        cross = dx*(v-b)-dy*(u-a)
        if cross < 0:
            inside = False
        t = min(1,max(0,((u-a)*dx+(v-b)*dy)/(dx*dx+dy*dy)))
        px,py = a+t*dx,b+t*dy
        distance = math.hypot(u-px,v-py)
        if closest is None or distance < closest[0]:
            size = math.hypot(dx,dy)
            closest = distance,px,py,dy/size,-dx/size
    distance,px,py,nx,ny = closest
    if not inside and distance>=r:
        return None
    if distance and not inside:
        nx,ny = (u-px)/distance,(v-py)/distance
    return r+distance if inside else r-distance,(nx,ny),px,py

def ray_polygon(x,y,dx,dy,poly,limit):
    enter,leave = 0,limit
    for (a,b),(xx,yy) in zip(poly,poly[1:]+poly[:1]):
        ex,ey = xx-a,yy-b
        value = ex*(y-b)-ey*(x-a)
        rate = ex*dy-ey*dx
        if abs(rate)<1e-12:
            if value<0:
                return limit
        elif rate>0:
            enter = max(enter,-value/rate)
        else:
            leave = min(leave,-value/rate)
        if enter>leave:
            return limit
    return min(limit,max(0,enter))

def number(value, lo, hi):
    if not isinstance(value, (float, int)) or not math.isfinite(value) or not lo <= value <= hi:
        raise ValueError(f'Ожидается число от {lo} до {hi}.')
    return value

def motor_power(value):
    if not isinstance(value, (float, int)) or (isinstance(value,float) and not math.isfinite(value)):
        raise ValueError('Скорость мотора должна быть числом.')
    return max(-100,min(100,value))

def port(value, maximum):
    if not isinstance(value, int) or not 1 <= value <= maximum:
        raise ValueError(f'Номер порта должен быть от 1 до {maximum}.')
    return value

def ray_rect(x, y, dx, dy, rect, limit):
    a, b, w, h = rect
    enter, leave = 0.0, limit
    for p, d, lo, hi in ((x, dx, a, a+w), (y, dy, b, b+h)):
        if abs(d) < 1e-12:
            if not lo <= p <= hi:
                return limit
        else:
            s, t = sorted(((lo-p)/d, (hi-p)/d))
            enter, leave = max(enter, s), min(leave, t)
            if enter > leave:
                return limit
    return enter

def overlaps(x, y, angle, rect, half_w, half_h):
    a, b, w, h = rect
    u, v = x-a-w/2, y-b-h/2
    c, s = math.cos(angle), math.sin(angle)
    for ax, ay in ((1,0),(0,1),(c,s),(-s,c)):
        body = half_w*abs(ax*c+ay*s)+half_h*abs(-ax*s+ay*c)
        box = (w*abs(ax)+h*abs(ay))/2
        if abs(ax*u+ay*v) >= body+box:
            return False
    return True

def rotate(x,y,c,s):
    return c*x+s*y,-s*x+c*y

def segment_box(row):
    x,y,xx,yy,w = row
    a = math.atan2(yy-y,xx-x)
    length = math.hypot(xx-x,yy-y)
    return x,y,a,math.cos(a),math.sin(a),(0,-w/2,length,w)

def circle_hit(x,y,dx,dy,circle,limit):
    cx,cy,r = circle
    u,v = x-cx,y-cy
    q = u*u+v*v-r*r
    if q <= 0:
        return 0
    b = u*dx+v*dy
    d = b*b-q
    if d < 0 or b >= 0:
        return limit
    return min(limit,-b-math.sqrt(d))

def circle_overlap(x,y,angle,circle,half_w,half_h):
    cx,cy,r = circle
    u,v = rotate(cx-x,cy-y,math.cos(angle),math.sin(angle))
    return max(0,abs(u)-half_w)**2+max(0,abs(v)-half_h)**2 < r*r

# Provisional white-field calibration, indexed by height in cm.
LIGHT_WHITE = (4000, 3200, 2400, 1600, 800)
LIGHT_FOOTPRINTS = tuple(tuple((i/2,j/2) for i in range(1-n,n)
                            for j in range(1-n,n) if i*i+j*j < n*n)
                        for n in range(2,11,2))

class World(Devices):
    def __init__(self, scene, props=None):
        self.robot_id=scene.get('id')
        self.half = number(scene.get('bodySize',36),10,70)/2
        realistic = scene.get('realistic',False)
        if type(realistic) is not bool:
            raise ValueError('Некорректный режим реалистичности.')
        self.realistic = realistic
        self.wear = number(scene.get('wear',0),0,100)/100
        rng = random.Random(str(scene.get('_seed',random.getrandbits(64)))+':'+str(scene.get('id','robot')))
        strength = .01+.11*self.wear
        self.motor_gain = [1+rng.uniform(-strength,strength) for _ in range(9)]
        self.motor_phase = [rng.uniform(0,2*math.pi) for _ in range(9)]
        self.motor_actual = [0.0]*9
        self.sensor_bias = [rng.uniform(-1,1) for _ in range(9)]
        self.sensor_phase = [rng.uniform(0,2*math.pi) for _ in range(9)]
        self.wheel_radius = number(scene.get('wheelDiameter',56),20,200)/20
        self.bounds = scene.get('bounds',[0,0,WIDTH,HEIGHT])
        self.raster = scene.get('raster',[0,0,WIDTH,HEIGHT])
        self.others = []
        self.bluetooth_peer=None
        self.bluetooth_peer_key=None
        self.bluetooth_received=0
        self.bluetooth_sent=None
        self.model = scene['model']
        if self.model not in ('E6','M6','E7','Car'):
            raise ValueError('2D доступна для E6, M6, E7 и автомобиля.')
        self.track = M6_TRACK if self.model == 'M6' else E6_TRACK
        profile = scene.get('motorType','standard')
        if not isinstance(profile,str) or profile not in MOTOR_ENCODER_RATIO:
            raise ValueError('Неизвестный тип моторов.')
        self.encoder_ratio = MOTOR_ENCODER_RATIO[profile]
        self.left_mount_sign = -1 if self.model in ('E6','E7') and profile=='sport' else 1
        unit = self.half / 540
        self.axle_offset=(82.5 if self.model=='M6' else -258.5 if profile=='sport' else 262.5)*unit
        if self.model=='Car': self.axle_offset=car_model.dimensions(self.half*2)['rear']
        self.parts = [((x-540)*unit,(y-540)*unit,(xx-x)*unit,(yy-y)*unit)
                      for x,y,xx,yy in (M6_PARTS if self.model == 'M6' else E6_SPORT_PARTS if profile=='sport' else E6_STANDARD_PARTS)]
        if self.model=='Car':
            self.parts=car_model.body(self.half*2)
        self.car_steer=self.car_speed=self.car_yaw=0.
        self.car_wheel_speeds=[0.,0.]
        self.car_slip=[0.,0.]
        self.differential=scene.get('differential',True)
        if type(self.differential) is not bool:
            raise ValueError('Некорректный режим дифференциала.')
        self.car_wheels,self.car_angles=car_model.front_wheels(self.half*2,0) if self.model=='Car' else ([],[])
        self.corners = [((x,y),(x+w,y),(x+w,y+h),(x,y+h)) for x,y,w,h in self.parts]
        self.extra = list(self.car_wheels)
        self.claw = scene.get('claw')
        self.joint = 0.
        self.mechanism_port = None
        self.held = None
        self.held_local = None
        self.body_corners = list(self.corners)
        claw = self.claw
        if claw:
            if not isinstance(claw,dict) or claw.get('kind') not in CLAWS:
                raise ValueError('Неизвестная клешня.')
            forward = number(claw['forward'],-100,100)
            right = number(claw['right'],-100,100)
            angle = math.radians(number(claw['angle'],-180,180))
            item = CLAWS[claw['kind']]
            if item.get('mechanism'):
                self.max_opening=number(claw.get('maxOpening',50),0,180)
                if claw['kind']=='kicker':
                    self.joint=number(claw.get('initialAngle',0),0,360)
                    if claw.get('length','short') not in mechanisms.KICKERS:
                        raise ValueError('Неизвестная длина пиналки.')
                self.extra = self.car_wheels+[mechanisms.mount(poly,claw) for poly in mechanisms.polygons(claw['kind'],self.joint,self.max_opening,claw.get('length','short'))]
            else:
                ax,ay = item['anchor']
                pitch = item['pitch']
                angle += math.radians(item.get('orientation',0))
                for poly in item['polygons']:
                    points = [((y-ay)/pitch,-(x-ax)/pitch) for x,y in poly]
                    self.extra.append(polygon_at(points,forward,right,math.cos(angle),math.sin(angle)))
        self.tool_polygons=self.extra[len(self.car_wheels):]
        self.corners.extend(self.extra)
        self.extent = max(math.hypot(x,y) for poly in self.corners for x,y in poly)
        self.count = 8 if self.model == 'E7' else 4
        self.sensor_count = 5 if self.model == 'M6' else 8
        self.left, self.right = (port(x, self.count) for x in scene['wheels'])
        if self.left == self.right:
            raise ValueError('У колёс должны быть разные порты.')
        if claw and CLAWS[claw['kind']].get('mechanism'):
            self.mechanism_port = port(claw['motor'],self.count)
            if self.mechanism_port in (self.left,self.right):
                raise ValueError('Мотор механизма должен использовать свободный порт, отдельно от колёс.')
        self.reversed = [bool(x) for x in scene['reversed']]
        self.x, self.y, heading = scene['start']
        self.x, self.y = number(self.x,-5000,5000), number(self.y,-5000,5000)
        self.heading = math.radians(number(heading,-360,360))
        walls = scene['walls']
        segments, circles = scene.get('segments',[]),scene.get('circles',[])
        rows = scene.get('props',[])
        if len(rows)>64:
            raise ValueError('На поле допускается до 64 подвижных объектов.')
        if len(walls)+len(segments)+len(circles) > 200:
            raise ValueError('На поле допускается до 200 препятствий.')
        self.walls = [(number(x,-5000,5000), number(y,-5000,5000), number(w,1,WIDTH), number(h,1,HEIGHT))
                      for x,y,w,h in walls]
        self.segments = [segment_box((number(x,-5000,5000),number(y,-5000,5000),number(xx,-5000,5000),number(yy,-5000,5000),number(w,1,WIDTH)))
                         for x,y,xx,yy,w in segments]
        self.circles = [(number(x,-5000,5000),number(y,-5000,5000),number(r,1,WIDTH)) for x,y,r in circles]
        self.props = props if props is not None else []
        if props is None:
            for x,y,kind in rows:
                if not isinstance(kind,str) or kind not in PROP_TYPES:
                    raise ValueError('Неизвестный подвижный объект.')
                obj=Prop(number(x,-5000,5000),number(y,-5000,5000),kind)
                if kind=='ball':obj.radius=number(scene.get('ballDiameter',6.7),5.6,6.7)/2
                self.props.append(obj)
            for obj in self.props:
                if self.prop_blocked(obj,obj.x,obj.y):
                    raise ValueError('Банка или мяч пересекает препятствие или край поля.')
        self.floor = scene.get('_pixels') or base64.b64decode(scene['floor'], validate=True)
        if len(self.floor) != self.raster[2]*self.raster[3]*3:
            raise ValueError('Некорректный размер изображения поля.')
        self.sensors = {}
        self.light_heights = {}
        self.lamps = {}
        self.light_leds = {}
        for key, item in scene['sensors'].items():
            if port(int(key),8) > self.sensor_count:
                continue
            kind, forward, right, angle = item[:4]
            if kind not in ('light','color','laser','sonar','led','touch','ir','gyro','line','eye'):
                raise ValueError('Неизвестный тип датчика.')
            self.sensors[port(int(key),8)] = (kind,number(forward,-100,100),
                number(right,-100,100),number(angle,-360,360))
            p = int(key)
            if kind in ('light','line'):
                self.light_heights[p] = port(item[4] if len(item)>4 else 1,5)
                self.light_leds[p] = True
            elif kind == 'led':
                self.lamps[p] = 0
        self.cells = {int(k): number(v,-1e9,1e9) for k,v in scene.get('cells',{}).items()}
        self.light_min = number(scene.get('black', 100),0,65535)
        self.light_max = number(scene.get('white', 1000),self.light_min,65535)
        self.color_codes = {str(k): int(v) for k,v in scene.get('colors',dict(black=1,white=6,red=5,green=2,blue=3,yellow=4)).items()}
        self.speeds = [0.0]*(self.count+1)
        self.encoders = [0.0]*(self.count+1)
        self.targets = {}
        self.time = 0.0
        self.blocked = False
        self.init_devices(scene)
        if self.collides(self.x,self.y,self.heading):
            raise ValueError('На старте тележка пересекает препятствие или край поля.')

    def collides(self,x,y,heading,include_props=True):
        c,s = math.cos(heading),math.sin(heading)
        left,top,right,bottom = self.bounds
        nearby = [o for o in self.others
                  if math.hypot(x-o.x,y-o.y) < self.extent+o.extent]
        for u,v,w,h in self.parts:
            hw,hh = w/2,h/2
            dx,dy = rotate(u+hw,v+hh,c,-s)
            px,py = x+dx,y+dy
            ex,ey = abs(c)*hw+abs(s)*hh,abs(s)*hw+abs(c)*hh
            if not (left+ex <= px <= right-ex and top+ey <= py <= bottom-ey):
                return True
            if any(a < px+ex and a+bw > px-ex and b < py+ey and b+bh > py-ey
                   and overlaps(px,py,heading,(a,b,bw,bh),hw,hh)
                   for a,b,bw,bh in self.walls):
                return True
            if any(overlaps(*rotate(px-a,py-b,cs,sn),heading-angle,rect,hw,hh)
                   for a,b,angle,cs,sn,rect in self.segments):
                return True
            if any(circle_overlap(px,py,heading,r,hw,hh) for r in self.circles):
                return True
            if include_props and any(circle_overlap(px,py,heading,(obj.x,obj.y,obj.radius-CONTACT_EPS),hw,hh) for obj in self.props if not obj.inactive and obj.held_by is not self):
                return True
            for o in nearby:
                ox,oy = rotate(px-o.x,py-o.y,math.cos(o.heading),math.sin(o.heading))
                if any(overlaps(ox,oy,heading-o.heading,r,hw,hh) for r in o.parts):
                    return True
                poly = polygon_at(box_polygon(u,v,w,h),x,y,c,s)
                local = [rotate(a-o.x,b-o.y,math.cos(o.heading),math.sin(o.heading)) for a,b in poly]
                if any(polygons_overlap(local,other) for other in o.extra):
                    return True
        for poly in self.extra:
            points = polygon_at(poly,x,y,c,s)
            if any(not (left<=u<=right and top<=v<=bottom) for u,v in points):
                return True
            if any(polygons_overlap(points,box_polygon(*r)) for r in self.walls):
                return True
            for a,b,_,cs,sn,rect in self.segments:
                local = [rotate(u-a,v-b,cs,sn) for u,v in points]
                if polygons_overlap(local,box_polygon(*rect)):
                    return True
            circles = self.circles+([(obj.x,obj.y,obj.radius-CONTACT_EPS) for obj in self.props if not obj.inactive and obj.held_by is not self] if include_props else [])
            if any(polygon_contact(a,b,r,points) for a,b,r in circles):
                return True
            for o in nearby:
                local = [rotate(a-o.x,b-o.y,math.cos(o.heading),math.sin(o.heading)) for a,b in points]
                if any(polygons_overlap(local,other) for other in o.corners):
                    return True
        return False

    def prop_blocked(self, obj, x, y, robots=(),include_props=True):
        r = obj.radius
        left,top,right,bottom = self.bounds
        if not (left+r <= x <= right-r and top+r <= y <= bottom-r):
            return True
        circle = x,y,r
        for a,b,w,h in self.walls:
            if circle_overlap(a+w/2,b+h/2,0,circle,w/2,h/2):
                return True
        for a,b,angle,c,s,(u,v,w,h) in self.segments:
            px,py = rotate(x-a,y-b,c,s)
            if circle_overlap(u+w/2,v+h/2,0,(px,py,r),w/2,h/2):
                return True
        if any((x-a)**2+(y-b)**2 < (r+rr)**2 for a,b,rr in self.circles):
            return True
        if include_props and any(not o.inactive and o is not obj and (x-o.x)**2+(y-o.y)**2 < (r+o.radius-CONTACT_EPS)**2 for o in self.props):
            return True
        for robot in robots:
            u,v = rotate(x-robot.x,y-robot.y,math.cos(robot.heading),math.sin(robot.heading))
            if any(circle_overlap(a+w/2,b+h/2,0,(u,v,r-CONTACT_EPS),w/2,h/2) for a,b,w,h in robot.parts):
                return True
            if any(polygon_contact(u,v,r-CONTACT_EPS,poly) for poly in robot.extra):
                return True
        return False

    def prop_states(self):
        return [(obj,obj.x,obj.y,obj.vx,obj.vy,obj.last_touch,obj.last_touch_position) for obj in self.props]

    @staticmethod
    def restore_props(states):
        for obj,x,y,vx,vy,touch,pos in states:
            obj.x,obj.y,obj.vx,obj.vy,obj.last_touch,obj.last_touch_position = x,y,vx,vy,touch,pos

    def translate_prop(self, obj, x, y, robots, path=None, rolling=False):
        """Move a contact chain as one transaction; the caller owns rollback."""
        path = set() if path is None else path
        if (obj.held_by is not None and obj.held_by is not self) or obj in path or self.prop_blocked(obj,x,y,robots,include_props=False):
            return False
        path = path|{obj}
        obj.x,obj.y = x,y
        for other in self.props:
            if other is obj or other.inactive:
                continue
            dx,dy = other.x-x,other.y-y
            distance = math.hypot(dx,dy)
            depth = obj.radius+other.radius-distance
            if depth <= CONTACT_EPS:
                continue
            if distance <= CONTACT_EPS:
                return False
            nx,ny = dx/distance,dy/distance
            closing = max(0,(obj.vx-other.vx)*nx+(obj.vy-other.vy)*ny)
            if rolling:
                impulse = (1+min(obj.bounce,other.bounce))*closing/(1/obj.mass+1/other.mass)
                obj.vx -= impulse/obj.mass*nx
                obj.vy -= impulse/obj.mass*ny
                other.vx += impulse/other.mass*nx
                other.vy += impulse/other.mass*ny
            else:
                speed = closing*other.transfer
                other.vx += speed*nx
                other.vy += speed*ny
            before=(other.x,other.y)
            if not self.translate_prop(other,other.x+(depth+CONTACT_EPS)*nx,
                                       other.y+(depth+CONTACT_EPS)*ny,robots,path,rolling):
                return False
            if rolling and closing>0 and obj.last_touch:
                other.last_touch=obj.last_touch;other.last_touch_position=before
        return True

    def robot_prop_contact(self, u, v, radius):
        contact = None
        for a,b,w,h in self.parts:
            px,py = min(a+w,max(a,u)),min(b+h,max(b,v))
            du,dv = u-px,v-py
            distance = math.hypot(du,dv)
            if distance >= radius-CONTACT_EPS:
                continue
            if distance:
                normal = du/distance,dv/distance
            else:
                distance,normal = min((u-a,(-1,0)),(a+w-u,(1,0)),
                                      (v-b,(0,-1)),(b+h-v,(0,1)))
                distance = -distance
            depth = radius-distance
            if contact is None or depth>contact[0]:
                contact = depth,normal,px,py
        for poly in self.extra:
            hit = polygon_contact(u,v,radius-CONTACT_EPS,poly)
            if hit and (contact is None or hit[0]>contact[0]):
                contact = hit
        return contact

    def push_props(self, x, y, heading, turn, dt,extra_motion=0,tool_velocity=(0,0),striking=False):
        saved = self.prop_states()
        c,s = math.cos(heading),math.sin(heading)
        dx,dy = x-self.x,y-self.y
        limit = math.hypot(dx,dy)+abs(turn)*(self.extent+7)+5*CONTACT_EPS+extra_motion
        # Prefer free sliding. If a prop is held between several robot parts,
        # try the rigid motion that preserves its previous, valid local pose.
        for carry in (False,True):
            self.restore_props(saved)
            valid = True
            for obj in self.props:
                if obj.inactive or obj.held_by is self:
                    continue
                u,v = rotate(obj.x-x,obj.y-y,c,s)
                hit = self.robot_prop_contact(u,v,obj.radius)
                if hit is None:
                    continue
                _,(nu,nv),px,py = hit
                nx,ny = rotate(nu,nv,c,-s)
                rx,ry = rotate(px,py,c,-s)
                tool_vx,tool_vy=tool_velocity[:2]
                if len(tool_velocity)>2:
                    omega=tool_velocity[2]
                    tool_vx-=omega*ry
                    tool_vy+=omega*rx
                contact_speed=((dx-turn*ry)*nx+(dy+turn*rx)*ny)/dt+tool_vx*nx+tool_vy*ny
                speed=max(0,contact_speed)*((1+obj.bounce) if striking else obj.transfer)
                impulse = max(0,speed-obj.vx*nx-obj.vy*ny)
                obj.vx += impulse*nx
                obj.vy += impulse*ny
                if carry:
                    old_c,old_s = math.cos(self.heading),math.sin(self.heading)
                    local = rotate(obj.x-self.x,obj.y-self.y,old_c,old_s)
                    ox,oy = rotate(*local,c,-s)
                    tx,ty = x+ox,y+oy
                else:
                    original = u,v
                    for _ in range(12):
                        hit = self.robot_prop_contact(u,v,obj.radius)
                        if hit is None:
                            break
                        depth,(a,b),_,_ = hit
                        u += (depth+CONTACT_EPS)*a
                        v += (depth+CONTACT_EPS)*b
                    if hit is not None and self.robot_prop_contact(u,v,obj.radius) is not None:
                        valid = False
                        break
                    ox,oy = rotate(u,v,c,-s)
                    tx,ty = x+ox,y+oy
                    if math.hypot(u-original[0],v-original[1])>limit:
                        valid = False
                        break
                if not self.translate_prop(obj,tx,ty,self.others):
                    valid = False
                    break
            if valid and not self.collides(x,y,heading):
                if self.robot_id:
                    for obj,ox,oy,vx,vy,_,_ in saved:
                        if math.hypot(obj.x-ox,obj.y-oy)>1e-8 or math.hypot(obj.vx-vx,obj.vy-vy)>1e-8:
                            obj.last_touch=self.robot_id;obj.last_touch_position=(ox,oy)
                return True
        self.restore_props(saved)
        return False

    def advance_props(self, dt):
        robots = [self,*self.others]
        for obj in self.props:
            if obj.inactive or obj.held_by is not None or not (obj.vx or obj.vy):
                continue
            count = max(1,math.ceil(math.hypot(obj.vx,obj.vy)*dt))
            for _ in range(count):
                for axis in ('x','y'):
                    velocity = 'v'+axis
                    speed = getattr(obj,velocity)
                    if not speed:
                        continue
                    saved = self.prop_states()
                    target = getattr(obj,axis)+speed*dt/count
                    x,y = (target,obj.y) if axis=='x' else (obj.x,target)
                    if not self.translate_prop(obj,x,y,robots,rolling=True):
                        self.restore_props(saved)
                        setattr(obj,velocity,-speed*obj.bounce)
            decay = math.exp(-obj.drag*dt)
            obj.vx *= decay
            obj.vy *= decay
            if math.hypot(obj.vx,obj.vy)<.12:
                obj.vx = obj.vy = 0.

    def wall_contact(self, x, y, heading, dist, turn):
        """Find the wall face and contact points that the drive is pressing into."""
        c,s = math.cos(heading),math.sin(heading)
        reach = self.extent+CONTACT_EPS
        best = None
        boxes = ((a,b,1,0,(0,0,w,h)) for a,b,w,h in self.walls)
        segments = ((a,b,cs,sn,rect) for a,b,_,cs,sn,rect in self.segments)
        for a,b,cs,sn,(u,v,w,h) in (*boxes,*segments):
            ox,oy = rotate(x-a,y-b,cs,sn)
            if not (u-reach <= ox <= u+w+reach and v-reach <= oy <= v+h+reach):
                continue
            fx,fy = rotate(c,s,cs,sn)
            parts = [[(ox+fx*px-fy*py,oy+fy*px+fx*py) for px,py in part]
                     for part in self.corners]
            for axis,sign,edge,lo,hi in ((0,1,u,v,v+h),(0,-1,u+w,v,v+h),
                                         (1,1,v,u,u+w),(1,-1,v+h,u,u+w)):
                push = dist*(fx,fy)[axis]*sign
                if push <= CONTACT_EPS or (best and push <= best[0]):
                    continue
                extreme = max(p[axis]*sign for part in parts for p in part)
                if abs(extreme-edge*sign) > CONTACT_EPS:
                    continue
                contacts = []
                for part in parts:
                    face = [p[1-axis] for p in part if abs(p[axis]*sign-extreme) <= CONTACT_EPS]
                    if face:
                        first,last = max(lo,min(face)),min(hi,max(face))
                        if first <= last:
                            contacts.extend((first,last))
                if not contacts:
                    continue
                # Signed lever arms relative to the direction the motors drive.
                points = [((edge,t) if axis == 0 else (t,edge)) for t in contacts]
                levers = [fx*(py-oy)-fy*(px-ox) for px,py in points]
                low,high = min(levers),max(levers)
                if low <= CONTACT_EPS and high >= -CONTACT_EPS:
                    # The drive line is supported by both sides: the wall holds
                    # the robot square, unless the wheels are commanding a turn.
                    if abs(turn) <= CONTACT_EPS:
                        best = (push,None)
                        continue
                    tangent_sign = sign if axis == 0 else -sign
                    index = min(range(len(points)), key=lambda i: contacts[i]*tangent_sign*turn)
                    lever = 0
                else:
                    index = min(range(len(points)), key=lambda i: abs(levers[i]))
                    lever = levers[index]
                px,py = rotate(*points[index],cs,-sn)
                rx,ry = a+px-x,b+py-y
                # Turning the centre around the held corner consumes some of
                # the commanded travel; no steering is added without drive.
                angle = turn+dist*lever/max(1,rx*rx+ry*ry)
                best = (push,(rx,ry,angle))
        return best

    def advance_until_blocked(self, pose):
        """Return the largest safe prefix of a short movement into contact."""
        lo,hi = 0,1
        for _ in range(24):
            mid = (lo+hi)/2
            if self.collides(*pose(mid)):
                hi = mid
            else:
                lo = mid
        return lo

    def move(self, dist, turn, dt, rear_offset=0, wall_align=True):
        if not (dist or turn):
            self.blocked = False
            if self.held:
                self.held.vx=self.held.vy=0.
            return
        x,y,h = self.x,self.y,self.heading
        held_saved = self.prop_states() if self.held else None

        def drive(fraction):
            if not fraction:
                return x,y,h
            angle = turn*fraction
            mid = h+angle/2
            travel = dist*fraction
            return (x+rear_offset*math.cos(h)+math.cos(mid)*travel-rear_offset*math.cos(h+angle),
                    y+rear_offset*math.sin(h)+math.sin(mid)*travel-rear_offset*math.sin(h+angle),
                    (h+angle+math.pi)%(2*math.pi)-math.pi)

        target = drive(1)
        self.blocked = self.collides(*target)
        if (self.blocked and self.props and not self.collides(*target,include_props=False)
                and self.push_props(*target,turn,dt)):
            self.blocked = False
        if self.blocked:
            contact = self.wall_contact(x,y,h,dist,turn) if wall_align else None
            fraction = 0 if contact else self.advance_until_blocked(drive)
            target = drive(fraction)
            if fraction and wall_align:
                contact = self.wall_contact(*target,dist,turn)
            if contact and contact[1]:
                px,py,angle = contact[1]
                angle *= 1-fraction
                tx,ty,th = target

                def pivot(f):
                    if not f:
                        return tx,ty,th
                    rx,ry = rotate(px,py,math.cos(angle*f),-math.sin(angle*f))
                    return tx+px-rx,ty+py-ry,(th+angle*f+math.pi)%(2*math.pi)-math.pi

                turned = pivot(1)
                if self.collides(*turned):
                    turned = pivot(self.advance_until_blocked(pivot))
                target = turned
        if self.held:
            tx,ty,th=target
            ox,oy=rotate(*self.held_local,math.cos(th),-math.sin(th))
            obj=self.held
            old_x,old_y=obj.x,obj.y
            if not self.translate_prop(obj,tx+ox,ty+oy,self.others) or self.collides(*target):
                self.restore_props(held_saved)
                target=x,y,h
                self.blocked=True
            else:
                obj.vx,obj.vy=(obj.x-old_x)/dt,(obj.y-old_y)/dt
        self.x,self.y,self.heading = target

    def refresh_mechanism(self, joint):
        self.joint=joint
        self.tool_polygons=[mechanisms.mount(poly,self.claw) for poly in mechanisms.polygons(self.claw['kind'],joint,self.max_opening,self.claw.get('length','short'))]
        self.extra=self.car_wheels+self.tool_polygons
        self.corners=self.body_corners+self.extra
        self.extent=max(math.hypot(x,y) for poly in self.corners for x,y in poly)

    def grip_contacts(self, obj, margin=3e-5):
        if obj.inactive:return False
        if obj.held_by is not None and obj.held_by is not self:
            return False
        u,v=rotate(obj.x-self.x,obj.y-self.y,math.cos(self.heading),math.sin(self.heading))
        f,r=rotate(u-self.claw['forward'],v-self.claw['right'],
                   math.cos(math.radians(self.claw['angle'])),math.sin(math.radians(self.claw['angle'])))
        if not (1<f<10 and abs(r)<6):
            return False
        return all(polygon_contact(u,v,obj.radius+margin,poly) for poly in self.extra[-2:])

    def actuate(self, change, dt):
        # Sweep the beam in small arcs, including when it completes a full turn.
        # This prevents skipping a thin wall or a prop between shaft positions.
        steps=max(1,math.ceil(abs(change)/2)) if self.claw['kind']=='kicker' else 1
        increment=change/steps
        total=0.
        for _ in range(steps):
            actual=self.actuate_part(increment,dt/steps)
            total+=actual
            if abs(actual-increment)>1e-6:
                break
        return total

    def actuate_part(self, change, dt):
        old=self.joint
        requested=old+change if self.claw['kind']=='kicker' else max(0,min(mechanisms.limit('gripper',self.max_opening),old+change))
        if requested==old:
            return 0.
        opening_held=self.held
        opening_local=self.held_local
        if self.held:
            if change<0:
                self.held.held_by=None
                self.held=None
                self.held_local=None
            else:
                return 0.
        saved=self.prop_states()
        pivot_x,pivot_y=rotate(self.claw['forward'],self.claw['right'],math.cos(self.heading),-math.sin(self.heading))
        def attempt(fraction):
            self.restore_props(saved)
            joint=old+(requested-old)*fraction
            self.refresh_mechanism(joint)
            if self.collides(self.x,self.y,self.heading,include_props=False):
                return False
            if self.claw['kind']=='gripper' and change>0:
                if any(self.grip_contacts(obj,0) for obj in self.props):
                    return False
            radius=max(math.hypot(x-self.claw['forward'],y-self.claw['right']) for poly in self.tool_polygons for x,y in poly)
            travel=abs(math.radians(joint-old))*radius
            velocity=(0,0)
            if self.claw['kind']=='kicker':
                # v = angular velocity x (contact - shaft), in world coordinates.
                omega=math.radians(joint-old)/dt
                velocity=(omega*pivot_y,-omega*pivot_x,omega)
            if not self.collides(self.x,self.y,self.heading):
                return True
            return self.push_props(self.x,self.y,self.heading,0,dt,travel,velocity,self.claw['kind']=='kicker')
        if not attempt(1):
            lo,hi=0.,1.
            for _ in range(18):
                mid=(lo+hi)/2
                if attempt(mid):lo=mid
                else:hi=mid
            attempt(lo)
        if opening_held is not None and self.joint>=old-1e-6:
            self.held=opening_held
            self.held.held_by=self
            self.held_local=opening_local
        if self.claw['kind']=='gripper' and change>0:
            obj=next((obj for obj in self.props if self.grip_contacts(obj)),None)
            if obj is not None:
                self.held=obj
                obj.held_by=self
                self.held_local=rotate(obj.x-self.x,obj.y-self.y,math.cos(self.heading),math.sin(self.heading))
                obj.vx=obj.vy=0.
        return self.joint-old

    def refresh_car_steering(self, steering):
        self.car_steer=steering
        self.car_wheels,self.car_angles=car_model.front_wheels(self.half*2,steering)
        self.extra=self.car_wheels+self.tool_polygons
        self.corners=self.body_corners+self.extra
        self.extent=max(math.hypot(x,y) for poly in self.corners for x,y in poly)

    def steer(self, shaft_degrees):
        sign=-1 if self.reversed[0] else 1
        old=self.car_steer
        requested=max(-car_model.STEER_LIMIT,min(car_model.STEER_LIMIT,
            old+math.radians(shaft_degrees)*sign/car_model.STEER_RATIO))
        steps=max(1,math.ceil(abs(requested-old)/math.radians(2)))
        for i in range(steps):
            previous=self.car_steer
            target=old+(requested-old)*(i+1)/steps
            self.refresh_car_steering(target)
            if self.collides(self.x,self.y,self.heading):
                lo,hi=0.,1.
                for _ in range(20):
                    mid=(lo+hi)/2
                    self.refresh_car_steering(previous+(target-previous)*mid)
                    if self.collides(self.x,self.y,self.heading): hi=mid
                    else: lo=mid
                self.refresh_car_steering(previous+(target-previous)*lo)
                break
        return math.degrees(self.car_steer-old)*car_model.STEER_RATIO/sign

    def step(self, dt):
        previous=(self.x,self.y,self.heading)
        self.devices_before_step()
        # Use the same wheel rotation for encoders and motion, including the last
        # fraction of a step when a motor reaches a requested encoder position.
        delta = [0.0]*(self.count+1)
        steer_goal=self.targets.get(self.left)
        steer_speed=self.speeds[self.left]
        mechanism_goal=self.targets.get(self.mechanism_port)
        mechanism_speed=self.speeds[self.mechanism_port] if self.mechanism_port else 0
        for p in range(1,self.count+1):
            speed = self.speeds[p]
            if self.realistic:
                tau = .025+.15*self.wear
                self.motor_actual[p] += (speed-self.motor_actual[p])*(-math.expm1(-dt/tau))
                phase = self.motor_phase[p]
                jitter = (.003+.037*self.wear)*math.sin(self.time*11+phase)
                speed = self.motor_actual[p]*(self.motor_gain[p]+jitter)
            delta[p] = math.degrees(speed/100*MAX_SPEED*dt/WHEEL_RADIUS)*self.encoder_ratio
            goal = self.targets.get(p)
            if goal is not None and speed and (self.encoders[p]+delta[p]-goal)*speed >= 0:
                delta[p] = goal-self.encoders[p]
                self.encoders[p] = goal
                self.speeds[p] = 0
                self.motor_actual[p] = 0
                del self.targets[p]
            else:
                # Wheels can still spin when the chassis is blocked.
                self.encoders[p] += delta[p]
        if self.mechanism_port:
            p=self.mechanism_port
            requested=delta[p]
            actual=self.actuate(requested/self.encoder_ratio,dt)*self.encoder_ratio
            self.encoders[p]+=actual-requested
            delta[p]=actual
            if mechanism_goal is not None and abs(actual-requested)>1e-6:
                self.targets[p]=mechanism_goal
                self.speeds[p]=mechanism_speed
        if self.model=='Car':
            requested=delta[self.left]
            actual=self.steer(requested/self.encoder_ratio)*self.encoder_ratio
            self.encoders[self.left]+=actual-requested
            if steer_goal is not None and abs(actual-requested)>1e-6:
                self.targets[self.left]=steer_goal
                self.speeds[self.left]=steer_speed
            drive=math.radians(delta[self.right]/self.encoder_ratio)*self.wheel_radius/dt*(-1 if self.reversed[1] else 1)
            self.car_speed,self.car_yaw,self.car_wheel_speeds,self.car_slip=car_model.dynamics(
                self.car_speed,self.car_yaw,drive,self.car_steer,self.half*2,self.differential,dt)
            self.move(self.car_speed*dt,self.car_yaw*dt,dt,
                      car_model.dimensions(self.half*2)['rear'],wall_align=False)
            if self.blocked:
                self.car_speed=self.car_yaw=0.
            self.time+=dt
            self.devices_after_step(previous,dt)
            return
        dl = math.radians(delta[self.left]/self.encoder_ratio)*self.wheel_radius*self.left_mount_sign*(-1 if self.reversed[0] else 1)
        dr = math.radians(delta[self.right]/self.encoder_ratio)*self.wheel_radius*(-1 if self.reversed[1] else 1)
        self.move((dl+dr)/2,(dl-dr)/self.track,dt,self.axle_offset)
        self.time += dt
        self.devices_after_step(previous,dt)

    def set_bluetooth(self, data):
        if type(data) not in (int,float) or (type(data) is float and not math.isfinite(data)):
            raise ValueError('По Bluetooth можно передавать только конечное число.')
        self.bluetooth_sent=data
        if self.bluetooth_peer is not None:
            self.bluetooth_peer.bluetooth_received=data

    def get_bluetooth(self):
        return self.bluetooth_received

    def system_time(self):
        return self.time

    def sensor_error(self, p):
        phase = self.sensor_phase[p]
        return .6*self.sensor_bias[p]+.4*math.sin(self.time*23+phase)

    def motor(self,p,speed):
        p = port(p,self.count)
        self.line_follow=None
        self.speeds[p] = motor_power(speed)
        self.targets.pop(p,None)

    def set_lamp(self,p,color):
        p = port(p,self.sensor_count)
        if p not in self.lamps:
            raise ValueError(f'На S{p} не установлен светодиод.')
        if type(color) is not int or not 0 <= color <= 7:
            raise ValueError('Цвет светодиода должен быть целым числом от 0 до 7.')
        self.lamps[p] = color

    def set_light_led(self,p,state):
        p = port(p,self.sensor_count)
        if p not in self.light_leds:
            raise ValueError(f'На S{p} не настроен датчик света.')
        self.light_leds[p] = bool(state)

    def light_threshold(self,p):
        return LIGHT_WHITE[self.light_heights[p]-1]/2

    def sensor_pose(self, p):
        kind, f, r, angle = self.sensors[p]
        c,s = math.cos(self.heading),math.sin(self.heading)
        return kind,self.x+c*f-s*r,self.y+s*f+c*r,self.heading+math.radians(angle)

    def rgb(self,x,y):
        ox,oy,w,h = self.raster
        x,y = math.floor(x-ox),math.floor(y-oy)
        if not (0<=x<w and 0<=y<h):
            return (255,255,255)
        i = (y*w+x)*3
        return tuple(self.floor[i:i+3])

    def read(self,p,kind,mode=None):
        p = port(p,self.sensor_count)
        if p not in self.sensors or self.sensors[p][0] != kind:
            raise ValueError(f'На S{p} не настроен датчик типа {dict(light="свет",color="цвет",laser="лазер",sonar="сонар").get(kind,kind)}.')
        if kind in ('touch','ir','gyro','line','eye'):return self.read_device(p,mode)
        _,x,y,heading = self.sensor_pose(p)
        if kind in ('laser','sonar'):
            if kind == 'laser' and mode not in (None,1,2):
                raise ValueError('Режим лазера должен быть 1 или 2.')
            limit = (400 if mode == 2 else 200) if kind == 'laser' else 250
            # Narrow laser ray; five rays approximate the sonar beam.
            angles = (0,) if kind == 'laser' else (-15,-7.5,0,7.5,15)
            nearest = limit
            for offset in angles:
                a = heading+math.radians(offset)
                dx,dy = math.cos(a),math.sin(a)
                for rect in self.walls:
                    nearest = min(nearest,ray_rect(x,y,dx,dy,rect,nearest))
                for a,b,_,c,s,rect in self.segments:
                    nearest = min(nearest,ray_rect(*rotate(x-a,y-b,c,s),*rotate(dx,dy,c,s),rect,nearest))
                for circle in self.circles:
                    nearest = min(nearest,circle_hit(x,y,dx,dy,circle,nearest))
                for obj in self.props:
                    if obj.inactive:continue
                    nearest = min(nearest,circle_hit(x,y,dx,dy,obj.circle(),nearest))
                for o in self.others:
                    c,s = math.cos(o.heading),math.sin(o.heading)
                    origin = rotate(x-o.x,y-o.y,c,s)
                    direction = rotate(dx,dy,c,s)
                    for rect in o.parts:
                        nearest = min(nearest,ray_rect(*origin,*direction,rect,nearest))
                    for poly in o.extra:
                        nearest = min(nearest,ray_polygon(*origin,*direction,poly,nearest))
                a,b,c,d = self.bounds
                for pos, direction, lower, bound in ((x,dx,a,c),(y,dy,b,d)):
                    if abs(direction) > 1e-12:
                        edge = ((bound if direction > 0 else lower)-pos)/direction
                        if 0 <= edge < nearest:
                            nearest = edge
            if self.realistic and nearest<limit:
                absolute = (.1+.5*self.wear) if kind=='laser' else (.4+1.5*self.wear)
                relative = (.002+.02*self.wear) if kind=='laser' else (.005+.035*self.wear)
                nearest = max(0,min(limit,nearest+self.sensor_error(p)*(absolute+relative*nearest)))
            return round(nearest*(10 if kind=='laser' else 1))
        if kind == 'light':
            height = self.light_heights[p]
            if not self.light_leds[p]:
                return 0
            # Sample the circular footprint at half-centimetre intervals.
            pixels = [self.rgb(x+i,y+j) for i,j in LIGHT_FOOTPRINTS[height-1]]
            mean = sum(.2126*r+.7152*g+.0722*b for r,g,b in pixels)/len(pixels)
            value = LIGHT_WHITE[height-1]*mean/255
            if self.realistic:
                value += LIGHT_WHITE[height-1]*(.008+.085*self.wear)*self.sensor_error(p)
            return round(max(0,min(LIGHT_WHITE[height-1],value)))
        pixels = [self.rgb(x+i,y+j) for i in (-2,0,2) for j in (-2,0,2)]
        r,g,b = (sum(px[k] for px in pixels)/len(pixels) for k in range(3))
        if self.realistic:
            amplitude = 2+20*self.wear
            r,g,b = (max(0,min(255,value+amplitude*self.sensor_error((p+i)%8+1)))
                     for i,value in enumerate((r,g,b)))
        light = round(self.light_min+(self.light_max-self.light_min)*(0.2126*r+0.7152*g+0.0722*b)/255)
        h,l,s = colorsys.rgb_to_hls(r/255,g/255,b/255)
        if mode in (None,4):
            hue = h*360
            neutral = s < .20 or (self.realistic and max(r,g,b)-min(r,g,b)<35)
            color = ('black' if l < .22 else 'white' if neutral and l > .65 else
                'unknown' if neutral else 'red' if hue < 25 or hue >= 345 else
                'yellow' if hue < 72 else 'green' if hue < 165 else
                'blue' if hue < 285 else 'unknown')
            return self.color_codes.get(color,0)
        values = {1:g,2:r,3:b,9:light,15:h*360,16:s*100,17:l*100}
        if mode not in values:
            raise ValueError('Неизвестный режим датчика цвета.')
        return round(values[mode])

    def snapshot(self):
        return dict(x=self.x,y=self.y,heading=self.heading,time=self.time,devices=self.device_snapshot(),
                    mechanism=dict(angle=self.joint,held=self.props.index(self.held) if self.held else None) if self.mechanism_port else None,
                    blocked=self.blocked,motors=self.speeds[1:],encoders=[round(x) for x in self.encoders[1:]],
                    bluetooth=dict(connected=self.bluetooth_peer is not None,peer=self.bluetooth_peer_key,
                                   sent=self.bluetooth_sent,received=self.bluetooth_received),
                    car=dict(steering=self.car_steer,wheelAngles=self.car_angles,speed=self.car_speed,
                             yaw=self.car_yaw,wheelSpeeds=self.car_wheel_speeds,slip=self.car_slip,
                             differential=self.differential) if self.model=='Car' else None,
                    lamps=self.lamps,light_leds=self.light_leds,
                    sensors={str(p): self.read(p, row[0]) for p,row in self.sensors.items() if row[0]!='led'})
