"""Additional classroom sensors. Distances and effects are explicit model approximations."""
import math

LINE_OFFSETS=(-5,-2.5,-1.5,0,1.5,2.5,5)
PALETTE=(0,0xff0000,0x00ff00,0x0000ff,0xffff00,0xff00ff,0x00ffff,0xffffff)

def finite(v,lo,hi):
    if type(v) not in (int,float) or not math.isfinite(v) or not lo<=v<=hi:raise ValueError('Значение вне допустимого диапазона.')
    return v

def integer(v,lo,hi):
    if type(v) is not int or not lo<=v<=hi:raise ValueError('Ожидается целое число от '+str(lo)+' до '+str(hi)+'.')
    return v

class Devices:
    def init_devices(self,scene):
        self.device_settings=validate_settings(scene.get('deviceSettings',{}),scene['sensors'])
        self.gyro_zero={p:self.heading for p,s in self.sensors.items() if s[0]=='gyro'}
        self.angular_rate=0.;self.planar_accel=[0.,0.];self.last_velocity=(0.,0.)
        self.line_colors={};self.line_thresholds={};self.line_follow=None;self.line_color='black'
        self.eye_colors={};self.eye_modes={};self.eye_color={};self.eye_tx={}
        self.sound_channels={};self.mp3_volume=20
        for p,row in self.sensors.items():
            cfg=self.device_settings.get(str(p),{})
            if row[0]=='line':
                self.line_colors[p]=[integer(c,0,7) for c in cfg.get('lineColors',[7]*7)]
                if len(self.line_colors[p])!=7:raise ValueError('У линейки должно быть семь цветов.')
                self.line_thresholds[p]=finite(cfg.get('lineThreshold',50),0,100)
            if row[0]=='eye':
                self.eye_colors[p]=[integer(c,0,0xffffff) for c in cfg.get('eyeColors',[0]*8)]
                if len(self.eye_colors[p])!=8:raise ValueError('У глаза должно быть восемь цветов.')
                self.eye_modes[p]=integer(cfg.get('eyeMode',0),0,9)
                self.eye_color[p]=integer(cfg.get('eyeColor',0xff0000),0,0xffffff)
                self.eye_tx[p]=None
    def require_device(self,p,kind):
        p=integer(p,1,self.sensor_count)
        if self.sensors.get(p,('',))[0]!=kind:raise ValueError(f'На S{p} не настроен датчик {kind}.')
        return p
    def distance_ray(self,x,y,heading,limit,skip=None):
        from engine import ray_rect,rotate,circle_hit,ray_polygon
        dx,dy=math.cos(heading),math.sin(heading);nearest=limit
        for rect in self.walls:nearest=min(nearest,ray_rect(x,y,dx,dy,rect,nearest))
        for a,b,_,c,s,rect in self.segments:nearest=min(nearest,ray_rect(*rotate(x-a,y-b,c,s),*rotate(dx,dy,c,s),rect,nearest))
        for circle in self.circles:nearest=min(nearest,circle_hit(x,y,dx,dy,circle,nearest))
        for obj in self.props:
            if not obj.inactive:nearest=min(nearest,circle_hit(x,y,dx,dy,obj.circle(),nearest))
        for other in self.others:
            if other is skip:continue
            c,s=math.cos(other.heading),math.sin(other.heading)
            origin=rotate(x-other.x,y-other.y,c,s);direction=rotate(dx,dy,c,s)
            for rect in other.parts:nearest=min(nearest,ray_rect(*origin,*direction,rect,nearest))
            for poly in other.extra:nearest=min(nearest,ray_polygon(*origin,*direction,poly,nearest))
        a,b,c,d=self.bounds
        for pos,direction,lower,upper in ((x,dx,a,c),(y,dy,b,d)):
            if abs(direction)>1e-12:
                edge=((upper if direction>0 else lower)-pos)/direction
                if 0<=edge<nearest:nearest=edge
        return nearest
    def line_values(self,p):
        p=self.require_device(p,'line');_,x,y,a=self.sensor_pose(p)
        h=self.light_heights[p];radius=.18*h
        values=[]
        for offset in LINE_OFFSETS:
            cx=x-math.sin(a)*offset;cy=y+math.cos(a)*offset
            pixels=[self.rgb(cx+u*radius,cy+v*radius) for u,v in ((0,0),(-.7,0),(.7,0),(0,-.7),(0,.7))]
            value=sum(.2126*r+.7152*g+.0722*b for r,g,b in pixels)/len(pixels)/255*100
            if self.realistic:value+=self.sensor_error(p)*(1+5*self.wear)
            values.append(round(max(0,min(100,value))))
        return values
    def line_states(self,p):return [int(v<self.line_thresholds[p]) for v in self.line_values(p)]
    def eye_peer(self,p):
        self.require_device(p,'eye');_,x,y,a=self.sensor_pose(p);candidates=[]
        def aligned(direction,bearing):return abs(math.atan2(math.sin(direction-bearing),math.cos(direction-bearing)))<=math.pi/4
        for other in self.others:
            for q,code in other.eye_tx.items():
                if code is None:continue
                _,xx,yy,b=other.sensor_pose(q);dx,dy=xx-x,yy-y;distance=math.hypot(dx,dy)
                bearing=math.atan2(dy,dx)
                if distance>120 or not aligned(a,bearing) or not aligned(b,bearing+math.pi):continue
                if self.distance_ray(x,y,bearing,distance,skip=other)+.01<distance:continue
                candidates.append((distance,other,q,code))
        return min(candidates,key=lambda row:row[0]) if candidates else None
    def device(self,op,*args):
        if op=='gyro_reset':
            p,mode=args;self.require_device(p,'gyro');integer(mode,1,2);self.gyro_zero[p]=self.heading;return
        if op=='gyro':
            p,mode,axis=args;self.require_device(p,'gyro');integer(mode,1,9)
            # Flat field: yaw in 0.1 degrees, rates in degrees/second; planar acceleration in m/s².
            yaw=math.degrees(self.heading-self.gyro_zero[p])*10
            bias=self.sensor_bias[p]*(.4+2*self.wear) if self.realistic else 0
            return round({1:0,2:0,3:yaw,4:self.planar_accel[0],5:self.planar_accel[1],6:9.81,7:0,8:0,9:self.angular_rate+bias}[mode],6)
        if op=='line_read':
            p,index=args;return self.line_values(p)[integer(index,1,7)-1]
        if op=='line_state':
            p,index=args;return self.line_states(p)[integer(index,1,7)-1]
        if op=='line_group':
            p,mode=args;states=self.line_states(p);integer(mode,1,11)
            return int((states[0] or states[6]) if mode==1 else any(states[:3]) if mode==2 else any(states[4:]) if mode==3 else states[3] if mode==4 else states[mode-5])
        if op=='line_colors':
            p,colors=args;self.require_device(p,'line')
            if len(colors)!=7:raise ValueError('Нужно семь цветов.')
            self.line_colors[p]=[integer(c,0,7) for c in colors];return
        if op=='line_threshold':
            p,value=args;self.require_device(p,'line');self.line_thresholds[p]=finite(value,0,100);return
        if op=='line_auto':
            p,speed,color=args;self.require_device(p,'line');finite(speed,-100,100)
            if color not in ('black','white'):raise ValueError('Цвет линии: black или white.')
            self.line_follow=(p,speed,color);return
        if op=='line_off':self.line_follow=None;return
        if op=='eye_mode':
            p,mode,color=args;self.require_device(p,'eye');self.eye_modes[p]=integer(mode,1,9);self.eye_color[p]=integer(color,0,0xffffff);return
        if op=='eye_colors':
            p,colors=args;self.require_device(p,'eye')
            if len(colors)!=8:raise ValueError('Нужно восемь цветов.')
            self.eye_colors[p]=[integer(c,0,0xffffff) for c in colors];self.eye_modes[p]=0;return
        if op=='eye_send':
            p,code=args;self.require_device(p,'eye');self.eye_tx[p]=integer(code,0,65535);return
        if op in ('eye_receive','eye_distance'):
            peer=self.eye_peer(args[0]);return (peer[3] if op=='eye_receive' else round(peer[0],1)) if peer else 0
        if op=='sound':
            channel,duration=args
            if channel not in ('beep','mp3','tone','preset'):raise ValueError('Неизвестный источник звука.')
            if duration==0:self.sound_channels.pop(channel,None)
            else:self.sound_channels[channel]=None if duration is None else self.time+finite(duration,0,3600)
            return
        if op=='volume':self.mp3_volume=integer(args[0],0,28);return
        raise ValueError('Неизвестная команда устройства: '+op)
    def read_device(self,p,mode=None):
        kind,x,y,a=self.sensor_pose(p)
        if kind=='ir':
            value=self.distance_ray(x,y,a,80)
            if self.realistic:value=max(0,min(80,value+self.sensor_error(p)*(.3+value*.015)))
            return round(value,1)
        if kind=='touch':
            # Front of the 3 cm case plus the red plunger; a small contact tolerance avoids missed tangency.
            x+=1.7*math.cos(a);y+=1.7*math.sin(a)
            return int(any(self.distance_ray(x-math.sin(a)*r,y+math.cos(a)*r,a,.35)<.35 for r in (-.6,0,.6)))
        if kind=='gyro':return self.device('gyro',p,3,0)
        if kind=='line':return self.line_values(p)
        if kind=='eye':return dict(code=self.device('eye_receive',p),distance=self.device('eye_distance',p))
    def devices_before_step(self):
        if not self.line_follow:return
        p,speed,color=self.line_follow;values=self.line_values(p)
        weights=[100-v if color=='black' else v for v in values];total=sum(weights)
        error=sum(offset*w for offset,w in zip(LINE_OFFSETS,weights))/total if total>1e-6 else 0
        turn=max(-abs(speed),min(abs(speed),error*abs(speed)*.35))
        for i,power in enumerate((speed+turn,speed-turn)):
            sign=(self.left_mount_sign if i==0 else 1)*(-1 if self.reversed[i] else 1)
            self.speeds[(self.left,self.right)[i]]=max(-100,min(100,power))*sign
    def devices_after_step(self,previous,dt):
        x,y,a=previous;self.angular_rate=math.degrees(self.heading-a)/dt
        velocity=((self.x-x)/dt,(self.y-y)/dt)
        self.planar_accel=[(velocity[i]-self.last_velocity[i])/dt/100 for i in range(2)]
        self.last_velocity=velocity
    def device_snapshot(self):
        channels=[key for key,end in self.sound_channels.items() if (end is None or self.time<end) and (key!='mp3' or self.mp3_volume>0)]
        return dict(lineColors=self.line_colors,lineThresholds=self.line_thresholds,eyeColors=self.eye_colors,
                    eyeModes=self.eye_modes,eyeColor=self.eye_color,eyeTx=self.eye_tx,
                    gyroZero=self.gyro_zero,sound=dict(active=bool(channels),channels=channels),angularRate=round(self.angular_rate,4))

def validate_settings(settings,sensors):
    if not isinstance(settings,dict):raise ValueError('Некорректные настройки датчиков.')
    if len(settings)>8:raise ValueError('Допускается до восьми настроек датчиков.')
    for key,cfg in settings.items():
        if not str(key).isdigit() or not 1<=int(key)<=8 or not isinstance(cfg,dict):raise ValueError('Некорректные настройки порта.')
        for name,count,maximum in [('lineColors',7,7),('eyeColors',8,0xffffff)]:
            if name in cfg:
                values=cfg[name]
                if not isinstance(values,list) or len(values)!=count:raise ValueError('Некорректное число цветов.')
                for value in values:integer(value,0,maximum)
        if 'lineThreshold' in cfg:finite(cfg['lineThreshold'],0,100)
        if 'eyeMode' in cfg:integer(cfg['eyeMode'],0,9)
        if 'eyeColor' in cfg:integer(cfg['eyeColor'],0,0xffffff)
    return settings
