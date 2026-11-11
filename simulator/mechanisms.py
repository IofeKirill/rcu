"""Planar mechanisms driven by an ordinary motor shaft. Dimensions are in cm."""
import math
import json
from pathlib import Path

KICKERS=json.loads(Path(__file__).with_name("media").joinpath("kickers.json").read_text(encoding="utf8"))

def box(x,y,w,h):
    return [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]

def placed(poly,x,y,angle):
    c,s=math.cos(angle),math.sin(angle)
    return [(x+c*u-s*v,y+s*u+c*v) for u,v in poly]

def beam(start,end,width=1):
    """Convex solid outline of a beam; the mounting holes are not obstacles."""
    angle=math.atan2(end[1]-start[1],end[0]-start[0])
    return [(p[0]+width/2*math.cos(angle+a),p[1]+width/2*math.sin(angle+a))
            for p,base in ((end,-math.pi/2),(start,math.pi/2))
            for a in (base+i*math.pi/6 for i in range(7))]

def limit(kind,max_opening=50):
    return (max_opening/2+35)*1.5 if kind=='gripper' else math.inf

def polygons(kind,joint,max_opening=50,kicker_length="short"):
    motor=box(-3,-2,5,4)
    if kind=='gripper':
        angle=math.radians(max_opening/2-60*joint/90)
        return [motor,beam((.6,-5.5),(.6,5.5)),
                placed(beam((0,0),(8,0)),1,5.5,angle),
                placed(beam((0,0),(8,0)),1,-5.5,-angle)]
    if kicker_length not in KICKERS:
        raise ValueError('Неизвестная длина пиналки.')
    points=KICKERS[kicker_length]['points']
    angle=math.radians(joint)
    return [motor]+[placed(beam(a,b),0,0,angle) for a,b in zip(points,points[1:])]

def mount(poly,claw):
    return placed(poly,claw['forward'],claw['right'],math.radians(claw['angle']))
