"""Car geometry and a provisional rear-drive tyre model. Lengths are in cm."""
import math
from mechanisms import placed

WIDTH,HEIGHT=1920,1080
# Original artwork faces left. The last two rectangles are the fixed rear tyres.
BODY=((703,355,1370,780),(548,439,710,768),(772,234,1675,356),
      (772,780,1675,918),(1440,126,1765,253),(1440,878,1765,1014),
      (232,216,390,931),(270,540,560,695),(335,460,550,750))
# Source tyre crop, kingpin (source image coordinates); right wheel first.
FRONT=(((132,48,336,154),(300,225)),((132,920,336,160),(300,908)))
STEER_RATIO=3.0
STEER_LIMIT=math.radians(35)

def dimensions(length):
    unit=length/WIDTH
    return dict(unit=unit,wheelbase=1304*unit,rear=-644*unit,rear_track=756*unit)

def body(length):
    u=length/WIDTH
    return [((960-x2)*u,(540-y2)*u,(x2-x1)*u,(y2-y1)*u) for x1,y1,x2,y2 in BODY]

def front_wheels(length,steering):
    d=dimensions(length);u=d['unit'];k=math.tan(steering)/d['wheelbase']
    result=[];angles=[]
    for (x,y,w,h),(px,py) in FRONT:
        f,r=(960-px)*u,(540-py)*u
        angle=math.atan2(d['wheelbase']*k,1-r*k)
        poly=[((px-a)*u,(py-b)*u) for a,b in ((x,y),(x+w,y),(x+w,y+h),(x,y+h))]
        result.append(placed(poly,f,r,angle));angles.append(angle)
    return result,angles

def dynamics(speed,yaw,drive,steering,length,differential,dt):
    """Tyre scrub with a locked axle opposes speed and yaw; coefficients await measurements."""
    d=dimensions(length);curvature=math.tan(steering)/d['wheelbase']
    mismatch=abs(curvature)*d['rear_track']
    locked=0 if differential else mismatch
    desired=drive/(1+2*locked)
    acceleration=200 if abs(desired)<abs(speed) else 100
    speed+=max(-acceleration*dt,min(acceleration*dt,desired-speed))
    # Equal rear wheel speeds resist yaw. The resulting understeer grows with speed.
    curvature/=1+1.7*abs(speed)/45*locked
    target=speed*curvature
    # Finite lateral grip caps yaw at high speed instead of guaranteeing an ideal arc.
    target=max(-160/max(abs(speed),1),min(160/max(abs(speed),1),target))
    yaw+=(target-yaw)*(-math.expm1(-dt/.08))
    if abs(speed)<.005 and abs(desired)<.005:
        speed=yaw=0.
    ground=[speed+yaw*d['rear_track']/2,speed-yaw*d['rear_track']/2]
    wheels=ground if differential else [drive,drive]
    slip=[a-b for a,b in zip(wheels,ground)]
    return speed,yaw,wheels,slip
