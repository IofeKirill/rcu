import json
import math
from pathlib import Path
import subprocess
import sys
import unittest

from engine import World
import car_model
from test_simulator import scene
from test_scene import robot,scene as shared_scene
from scene_xml import serialize,parse

ROOT=Path(__file__).resolve().parents[1]

def car(**values):
    return World(scene(model='Car',bodySize=39.2,wheelDiameter=65,**values))

def tick(w,n):
    for _ in range(n): w.step(.01);w.advance_props(.01)

class CarTests(unittest.TestCase):
    def test_steering_moves_wheels_without_spinning_chassis_and_holds_after_stop(self):
        w=car();w.motor(1,40);tick(w,30)
        self.assertEqual((w.x,w.y,w.heading),(90,90,0))
        self.assertGreater(w.car_steer,.5)
        self.assertGreater(w.car_angles[0],w.car_angles[1])
        self.assertGreater(w.car_angles[1],0)
        before=w.car_steer;w.motor(1,0);tick(w,20)
        self.assertEqual(w.car_steer,before)
        w.encoders[1]=0
        self.assertEqual(w.car_steer,before)

    def test_steering_has_mechanical_limits_and_can_reverse_from_stop(self):
        w=car();w.motor(1,80);tick(w,70)
        self.assertAlmostEqual(w.car_steer,car_model.STEER_LIMIT)
        self.assertAlmostEqual(w.encoders[1],105)
        w.motor(1,-80);tick(w,140)
        self.assertAlmostEqual(w.car_steer,-car_model.STEER_LIMIT)
        self.assertAlmostEqual(w.encoders[1],-105)

    def test_drive_forward_reverse_acceleration_and_braking(self):
        w=car();w.motor(3,60);tick(w,1)
        first=w.car_speed;self.assertTrue(0<first<2)
        tick(w,70);self.assertGreater(w.car_speed,first);self.assertGreater(w.x,100)
        self.assertAlmostEqual(w.y,90);self.assertAlmostEqual(w.heading,0)
        w.motor(3,0);before=w.x;tick(w,1)
        self.assertGreater(w.x,before)  # finite braking distance
        tick(w,40);self.assertEqual(w.car_speed,0)
        before=w.x;w.motor(3,-40);tick(w,80)
        self.assertLess(w.x,before);self.assertAlmostEqual(w.heading,0)

    def test_rear_axle_follows_a_circle_and_reverse_changes_yaw_direction(self):
        for drive,sign in ((40,1),(-40,-1)):
            w=car();w.motor(1,40);w.targets[1]=60;tick(w,40)
            w.motor(3,drive);tick(w,120)
            self.assertGreater(w.heading*sign,.2)
            self.assertGreater(abs(w.y-90),.5)
            d=car_model.dimensions(39.2)
            expected=w.car_speed*math.tan(w.car_steer)/d['wheelbase']
            self.assertAlmostEqual(w.car_yaw,expected,delta=.001)

    def test_differential_allows_different_wheel_speeds_and_locked_axle_scrubs(self):
        runs=[]
        for enabled in (True,False):
            w=car(differential=enabled)
            w.motor(1,50);w.targets[1]=90;tick(w,40)
            w.motor(3,80);tick(w,100)
            runs.append(w)
        open_diff,locked=runs
        self.assertNotAlmostEqual(*open_diff.car_wheel_speeds)
        self.assertEqual(locked.car_wheel_speeds[0],locked.car_wheel_speeds[1])
        self.assertAlmostEqual(sum(abs(x) for x in open_diff.car_slip),0)
        self.assertGreater(sum(abs(x) for x in locked.car_slip),5)
        self.assertLess(locked.car_speed,open_diff.car_speed)
        self.assertLess(abs(locked.car_yaw/locked.car_speed),abs(open_diff.car_yaw/open_diff.car_speed))

    def test_car_stops_at_walls_without_penetration_and_backs_away(self):
        w=car(walls=[[145,40,3,100]])
        w.motor(3,70);tick(w,220)
        self.assertTrue(w.blocked)
        self.assertFalse(w.collides(w.x,w.y,w.heading))
        before=w.x;w.motor(3,-40);tick(w,80)
        self.assertLess(w.x,before-5);self.assertFalse(w.blocked)

    def test_turned_wheel_outline_is_used_for_collision(self):
        w=car();rest=[list(poly) for poly in w.car_wheels]
        w.motor(1,50);tick(w,40)
        self.assertNotEqual(w.car_wheels,rest)
        self.assertEqual(w.extra[:2],w.car_wheels)
        for poly in w.car_wheels:
            x=sum(p[0] for p in poly)/4;y=sum(p[1] for p in poly)/4
            w.circles=[(w.x+x,w.y+y,1)]
            self.assertTrue(w.collides(w.x,w.y,w.heading))

    def test_xml_and_python_motor_api(self):
        r=robot('r1',90);r.update(model='Car',bodySize=39.2,wheelDiameter=65,differential=False)
        loaded=parse(serialize(shared_scene(r)).decode())['scene']
        self.assertEqual(loaded['robots'][0],r)
        request=dict(scene=dict(shared_scene(r),robots=loaded['robots']),rate=8,programs={'r1':dict(filename=str(ROOT/'examples/car.py'),source=(
            "import motor, rcu\n"
            "motor.SetMotorAngleDelay(1,35,60)\n"
            "motor.SetMotor(3,40)\nrcu.SetWaitForTime(1)\n"
            "motor.SetMotorStop(3)\nrcu.SetWaitForTime(.5)\n"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        last=[e['robots']['r1'] for e in events if e['kind']=='state'][-1]
        self.assertGreater(last['heading'],.1)
        self.assertAlmostEqual(last['car']['steering'],math.radians(20))
        self.assertFalse(last['car']['differential'])
        self.assertEqual(last['car']['speed'],0)

    def test_rally_example_drives_the_corridor_with_real_sensor_api(self):
        r=robot('r1',120)
        r.update(model='Car',start=[120,250,-90],bodySize=39.2,wheelDiameter=65,differential=True,
                 sensors={'1':['sonar',18,0,0],'2':['sonar',12,-8,-90],'3':['sonar',12,8,90]})
        field=shared_scene(r)
        field['walls']=[[70,60,660,3],[70,437,660,3],[70,60,3,380],[727,60,3,380],
                        [170,160,460,3],[170,337,460,3],[170,160,3,180],[627,160,3,180]]
        source=(ROOT/'examples/car-rally.py').read_text().replace('while True:','while rcu.GetSysTime() < 25:')
        request=dict(scene=field,rate=8,programs={'r1':dict(filename=str(ROOT/'examples/car-rally.py'),source=source)})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=15,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        frames=[e['robots']['r1'] for e in events if e['kind']=='state']
        self.assertFalse(any(f['blocked'] for f in frames))
        self.assertLess(min(f['y'] for f in frames),130)
        self.assertGreater(max(f['x'] for f in frames),300)

if __name__=='__main__': unittest.main()
