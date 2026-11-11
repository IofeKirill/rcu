import base64
import json
import math
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from engine import World, WIDTH, HEIGHT

def scene(**values):
    config = dict(model='E6',wheels=[1,3],reversed=[False,False],start=[90,90,0],
                  walls=[],floor=base64.b64encode(b'\xff'*(WIDTH*HEIGHT*3)).decode(),
                  sensors={},colors={'green':2,'white':6,'black':1})
    config.update(values)
    return config

def run_file(name, config, timeout=15):
    file = ROOT/'examples'/name
    request = dict(scene=config,rate=8,program=dict(filename=str(file),source=file.read_text()))
    result = subprocess.run([sys.executable,'-I','-u',str(ROOT/'runner.py')],
                            input=json.dumps(request)+'\n',text=True,capture_output=True,timeout=timeout)
    records = [json.loads(line) for line in result.stdout.splitlines()]
    if result.returncode:
        raise AssertionError(records[-1] if records else result.stderr)
    return records

class SimulationTests(unittest.TestCase):
    def test_all_differential_robots_turn_about_the_midpoint_of_the_wheels(self):
        for model,profile,indices in (('E6','standard',(2,3)),('E6','sport',(1,2)),
                                     ('E7','standard',(2,3)),('E7','sport',(1,2)),('M6','standard',(1,2))):
            with self.subTest(model=model,profile=profile):
                w=World(scene(model=model,motorType=profile,bodySize=18,
                              reversed=[profile=='sport',False]))
                wheel_mid=sum(w.parts[i][0]+w.parts[i][2]/2 for i in indices)/2
                self.assertAlmostEqual(w.axle_offset,wheel_mid)
                initial=(w.x+w.axle_offset,w.y)
                w.motor(1,35);w.motor(3,-35)
                for _ in range(40): w.step(.01)
                pivot=(w.x+w.axle_offset*math.cos(w.heading),w.y+w.axle_offset*math.sin(w.heading))
                self.assertAlmostEqual(pivot[0],initial[0])
                self.assertAlmostEqual(pivot[1],initial[1])
                self.assertGreater(math.hypot(w.x-90,w.y-90),1)

    def test_sport_base_requires_left_reverse_for_e6_and_e7(self):
        for model in ('E6','E7'):
            for profile in ('standard','sport'):
                for left_reverse in (False,True):
                    with self.subTest(model=model,profile=profile,reverse=left_reverse):
                        world=World(scene(model=model,motorType=profile,bodySize=18,
                                          wheels=[4,2],reversed=[left_reverse,False]))
                        world.motor(4,50);world.motor(2,50)
                        for _ in range(20): world.step(.01)
                        straight=left_reverse==(profile=='sport')
                        if straight:
                            self.assertAlmostEqual(world.heading,0)
                            self.assertGreater(world.x,94)
                        else:
                            self.assertAlmostEqual(world.x+world.axle_offset*math.cos(world.heading),90+world.axle_offset)
                            self.assertAlmostEqual(world.y+world.axle_offset*math.sin(world.heading),90)
                            self.assertLess(world.heading,-.3)
                        self.assertGreater(world.encoders[4],0)
                        self.assertGreater(world.encoders[2],0)
        # The new physical mounting convention belongs only to E6/E7 sports bases.
        m6=World(scene(model='M6',motorType='sport',bodySize=18))
        m6.motor(1,50);m6.motor(3,50)
        for _ in range(20): m6.step(.01)
        self.assertAlmostEqual(m6.heading,0)
        self.assertGreater(m6.x,94)

    def test_e6_and_e7_base_contours_follow_the_motor_profile(self):
        for profile in ('standard','sport'):
            a=World(scene(model='E6',motorType=profile,bodySize=18))
            b=World(scene(model='E7',motorType=profile,bodySize=18))
            self.assertEqual(a.parts,b.parts)
        ordinary=World(scene(bodySize=18,motorType='standard'))
        sport=World(scene(bodySize=18,motorType='sport'))
        self.assertNotEqual(ordinary.parts,sport.parts)
        self.assertTrue(any(u<0 and u+w>0 and v<0 and v+h>0 for u,v,w,h in ordinary.parts))

    def test_distance_units_and_collision_for_all_models(self):
        for model in ('E6','M6','E7'):
            with self.subTest(model=model):
                world = World(scene(model=model,walls=[[150,40,10,100]], sensors={
                    '4':['laser',20,0,0], '5':['sonar',20,0,0]}))
                self.assertEqual(world.read(4,'laser'),400)
                self.assertEqual(world.read(5,'sonar'),40)
                world.motor(1,100)
                world.motor(3,100)
                for _ in range(300):
                    world.step(.01)
                self.assertTrue(world.blocked)
                self.assertAlmostEqual(world.x,150-max(u+w for u,v,w,h in world.parts),delta=.45)
                self.assertEqual(round(world.encoders[1]),2578)
                self.assertEqual(world.heading,0)

    def test_in_place_turn_uses_wheel_geometry_and_exact_encoder_target(self):
        for profile, target in (('standard',220),('sport',900)):
            for body, diameter, angle in ((18,56,90),(24,56,90),(18,70,112.5)):
                with self.subTest(profile=profile, body=body, diameter=diameter):
                    world = World(scene(bodySize=body,wheelDiameter=diameter,motorType=profile,reversed=[profile=='sport',False]))
                    world.motor(1,135)
                    world.motor(3,-120)
                    self.assertEqual([world.speeds[1],world.speeds[3]],[100,-100])
                    world.targets.update({1:target,3:-target})
                    for _ in range(35):
                        world.step(.01)
                    self.assertAlmostEqual(math.degrees(world.heading),angle)
                    self.assertEqual([world.encoders[1],world.encoders[3]],[target,-target])
                    self.assertAlmostEqual(world.x+world.axle_offset*math.cos(world.heading),90+world.axle_offset)
                    self.assertAlmostEqual(world.y+world.axle_offset*math.sin(world.heading),90)
        for invalid in ('135',float('nan'),float('inf')):
            with self.assertRaises(ValueError):
                world.motor(1,invalid)
        with self.assertRaises(ValueError):
            world.motor(5,135)

    def test_rotated_robot_clears_empty_corner_but_not_solid_parts(self):
        world = World(scene(bodySize=18,motorType='sport',start=[90,90,-45],walls=[[75,60,3,60]]))
        self.assertFalse(world.collides(90,90,world.heading))
        self.assertTrue(world.collides(88,90,world.heading))
        # The gap between the fork arms remains free, even though a solid arm
        # occupies the same forward coordinate a little to the side.
        world = World(scene(bodySize=42,motorType='sport'))
        world.circles=[(100,90,1)]
        self.assertFalse(world.collides(90,90,0))
        world.circles=[(100,89,1)]
        self.assertTrue(world.collides(90,90,0))

    def test_wall_contact_aligns_only_under_power_and_allows_reversing(self):
        for wall_angle, approach in ((0,25),(0,-25),(35,25),(35,-25)):
            with self.subTest(wall_angle=wall_angle,approach=approach):
                a = math.radians(wall_angle)
                c,s = math.cos(a),math.sin(a)
                wall = [150-65*s,110+65*c,150+65*s,110-65*c,4]
                world = World(scene(bodySize=18,start=[150-25*c,110-25*s,wall_angle+approach],
                                    segments=[wall]))

                def power(value):
                    world.motor(1,value)
                    world.motor(3,value)

                power(75)
                initial_angle = world.heading
                for _ in range(110):
                    world.step(.01)
                    self.assertFalse(world.collides(world.x,world.y,world.heading))
                    if world.blocked:
                        break
                self.assertTrue(world.blocked)
                self.assertAlmostEqual(world.heading,initial_angle,delta=.03)
                power(0)
                stopped = world.x,world.y,world.heading
                for _ in range(20):
                    world.step(.01)
                self.assertEqual((world.x,world.y,world.heading),stopped)
                power(75)
                for _ in range(150):
                    world.step(.01)
                    self.assertFalse(world.collides(world.x,world.y,world.heading))
                self.assertTrue(world.blocked)
                self.assertAlmostEqual(world.heading,a,places=5)
                at_wall = world.x,world.y,world.heading
                for _ in range(20):
                    world.step(.01)
                self.assertEqual((world.x,world.y,world.heading),at_wall)
                power(-50)
                for _ in range(30):
                    world.step(.01)
                self.assertFalse(world.blocked)
                self.assertAlmostEqual(world.heading,a,places=5)
                self.assertAlmostEqual(math.hypot(world.x-at_wall[0],world.y-at_wall[1]),6.3)

    def test_can_and_ball_travel_depends_on_impact_speed(self):
        travel = {}
        for kind in ('can','ball'):
            for speed in (25,80):
                w = World(scene(bodySize=18,props=[[106,90,kind]],sensors={'4':['laser',0,0,0]}))
                obj = w.props[0]
                self.assertEqual(w.read(4,'laser'),round((16-obj.radius)*10))
                for p in (1,3):
                    w.motor(p,speed)
                for _ in range(100):
                    w.step(.01)
                    w.advance_props(.01)
                    if obj.vx:
                        break
                self.assertGreater(obj.vx,0)
                start = obj.x
                for p in (1,3):
                    w.motor(p,0)
                for _ in range(400):
                    w.advance_props(.01)
                travel[kind,speed] = obj.x-start
                self.assertFalse(w.collides(w.x,w.y,w.heading))
        for kind in ('can','ball'):
            self.assertGreater(travel[kind,80],2*travel[kind,25])
        self.assertGreater(travel['ball',80],5*travel['can',80])

    def test_wall_stops_can_and_reflects_ball(self):
        for kind in ('can','ball'):
            w = World(scene(bodySize=18,props=[[115,90,kind]],walls=[[120,40,2,100]]))
            obj = w.props[0]
            obj.vx = 35
            for _ in range(15):
                w.advance_props(.01)
                self.assertLessEqual(obj.x+obj.radius,120)
            if kind=='can':
                self.assertEqual(obj.vx,0)
            else:
                self.assertLess(obj.vx,0)

    def test_robot_cannot_push_props_through_a_wall(self):
        for kind in ('can','ball'):
            with self.subTest(kind=kind):
                w = World(scene(bodySize=18,props=[[106,90,kind]],segments=[[121,40,121,140,2]]))
                for p in (1,3):
                    w.motor(p,80)
                for _ in range(220):
                    w.step(.01)
                    w.advance_props(.01)
                    self.assertFalse(w.collides(w.x,w.y,w.heading))
                    self.assertLessEqual(w.props[0].x+w.props[0].radius,120)
                self.assertTrue(w.blocked)
                self.assertGreater(w.props[0].x,115)

    def test_wall_example_runs_through_python_process(self):
        events = run_file('wall.py',scene(walls=[[200,40,8,130],[30,145,210,8]],
                          sensors={'5':['sonar',19,0,0], '4':['laser',19,16,90]}))
        states = [event for event in events if event['kind']=='state']
        last = states[-1]
        self.assertGreater(last['x'],155)
        self.assertLess(last['x'],165)
        self.assertEqual(last['sensors']['4'],390)
        self.assertEqual(last['sensors']['5'],20)
        self.assertEqual(last['motors'],[0,0,0,0])
        self.assertTrue(any(e['kind']=='display' and e['text']=='390 mm' for e in events))

    def test_line_example_follows_curve_and_stops_at_green(self):
        floor=bytearray(b'\xff'*(WIDTH*HEIGHT*3))
        def paint(x,y,color):
            if 0<=x<WIDTH and 0<=y<HEIGHT:
                i=(y*WIDTH+x)*3
                floor[i:i+3]=color
        def stamp(x,y):
            for j in range(-9,10):
                for i in range(-9,10):
                    if i*i+j*j<=81:
                        paint(round(x)+i,round(y)+j,b'\x20'*3)
        for x in range(35,176):
            stamp(x,250)
        for a,b,c,d in [((175,250),(300,250),(290,170),(400,170)),
                        ((400,170),(520,170),(500,300),(630,300))]:
            for i in range(301):
                t=i/300
                stamp(*[a[k]*(1-t)**3+3*b[k]*t*(1-t)**2+3*c[k]*t*t*(1-t)+d[k]*t**3 for k in (0,1)])
        for x in range(630,751):
            stamp(x,300)
        for x in range(730,768):
            for y in range(268,332):
                paint(x,y,bytes((30,184,64)))
        events=run_file('line-light.py',scene(start=[90,250,0],bodySize=18,floor=base64.b64encode(floor).decode(),
                        cells={1:35,2:7},sensors={'5':['light',12,-9,0,3],'6':['light',12,9,0,3],'8':['color',13,0,0]}))
        states=[e for e in events if e['kind']=='state']
        self.assertLess(min(s['y'] for s in states),190)
        self.assertGreater(states[-1]['x'],695)
        self.assertEqual(states[-1]['sensors']['8'],2)
        self.assertTrue(any(e['kind']=='display' and e['text']=='Finish' for e in events))

if __name__ == '__main__':
    unittest.main()
