import json
import math
from pathlib import Path
import subprocess
import sys
import unittest

from engine import World,polygon_contact,rotate
import mechanisms
from test_simulator import scene
from test_scene import robot,scene as shared_scene
from scene_xml import serialize,parse

ROOT=Path(__file__).resolve().parents[1]

def tool(kind='gripper',motor=2):
    return dict(kind=kind,forward=9,right=0,angle=0,motor=motor,**({'initialAngle':0} if kind=='kicker' else {}))

def tick(w,n):
    for _ in range(n):
        w.step(.01);w.advance_props(.01)

class MechanismTests(unittest.TestCase):
    def test_actual_bilateral_contact_holds_and_opening_releases(self):
        for kind in ('can','ball'):
            with self.subTest(kind=kind):
                w=World(scene(bodySize=18,claw=tool(),props=[[106,90,kind]]))
                obj=w.props[0]
                w.motor(2,35)
                tick(w,45)
                self.assertIs(w.held,obj)
                self.assertTrue(w.grip_contacts(obj))
                self.assertTrue(0<w.joint<90)
                self.assertAlmostEqual(w.encoders[2],w.joint)
                w.motor(2,0);w.motor(1,50);w.motor(3,45)
                local=w.held_local
                tick(w,40)
                self.assertIs(w.held,obj)
                u,v=rotate(obj.x-w.x,obj.y-w.y,math.cos(w.heading),math.sin(w.heading))
                self.assertAlmostEqual(u,local[0],places=6)
                self.assertAlmostEqual(v,local[1],places=6)
                w.motor(1,0);w.motor(3,0);tick(w,5);w.motor(2,-35)
                tick(w,45)
                self.assertIsNone(w.held)
                self.assertIsNone(obj.held_by)
                self.assertAlmostEqual(w.joint,0)
                before=obj.x,obj.y
                w.motor(2,0);w.motor(1,-40);w.motor(3,-40)
                tick(w,40)
                self.assertLess(w.x,95)
                self.assertLess(math.dist(before,(obj.x,obj.y)),.2)

    def test_no_capture_at_distance_or_without_two_fingers(self):
        for pos in ((120,90),(106,105)):
            w=World(scene(bodySize=18,claw=tool(),props=[[*pos,'can']]))
            w.motor(2,35);tick(w,50)
            self.assertIsNone(w.held)

    def test_held_object_cannot_go_through_a_wall(self):
        w=World(scene(bodySize=18,claw=tool(),props=[[106,90,'can']],walls=[[125,50,2,80]]))
        w.motor(2,35);tick(w,50)
        w.motor(2,0);w.motor(1,70);w.motor(3,70)
        tick(w,130)
        self.assertIsNotNone(w.held)
        self.assertTrue(w.blocked)
        self.assertLessEqual(w.held.x+w.held.radius,125+1e-6)

    def test_kick_strength_scales_with_motor_speed(self):
        distances={}
        for power in (20,80):
            w=World(scene(bodySize=18,claw=tool('kicker'),props=[[103,96,'ball']]))
            w.motor(2,power)
            # Both runs sweep the same 90 degree arc, at different speeds.
            w.targets[2]=90
            tick(w,90)
            w.motor(2,0);tick(w,100)
            distances[power]=math.hypot(w.props[0].x-103,w.props[0].y-96)
            self.assertAlmostEqual(w.joint,90)
        self.assertGreater(distances[80],distances[20]*1.7)

    def test_kicker_rotates_rigidly_about_the_motor_shaft(self):
        rest=mechanisms.polygons('kicker',0)
        for degrees in (15,45,90):
            moved=mechanisms.polygons('kicker',degrees)
            self.assertEqual(moved[0],rest[0])
            c,s=math.cos(math.radians(degrees)),math.sin(math.radians(degrees))
            for before,after in zip(rest[1:],moved[1:]):
                for (x,y),(u,v) in zip(before,after):
                    self.assertAlmostEqual(u,c*x-s*y)
                    self.assertAlmostEqual(v,s*x+c*y)
                    self.assertAlmostEqual(math.hypot(u,v),math.hypot(x,y))

    def test_kicker_stops_at_a_wall_and_can_reverse(self):
        w=World(scene(bodySize=18,claw=tool('kicker'),walls=[[103,93,2,5]]))
        w.motor(2,40);tick(w,100)
        self.assertTrue(0<w.joint<90)
        self.assertAlmostEqual(w.encoders[2],w.joint)
        self.assertFalse(w.collides(w.x,w.y,w.heading))
        w.motor(2,-40);w.targets[2]=0;tick(w,50)
        self.assertAlmostEqual(w.joint,0)

    def test_kicker_has_unlimited_turns_and_ignores_own_body_and_sensors(self):
        claw=tool('kicker');claw.update(forward=0,initialAngle=45)
        w=World(scene(bodySize=18,claw=claw,sensors={'1':['sonar',4,0,0]}))
        self.assertAlmostEqual(w.joint,45)
        self.assertEqual(w.encoders[2],0)
        w.motor(2,80);tick(w,120)
        self.assertGreater(w.joint,765)
        self.assertAlmostEqual(w.joint-45,w.encoders[2])
        w.motor(2,-80);tick(w,240)
        self.assertLess(w.joint,-675)
        self.assertAlmostEqual(w.joint-45,w.encoders[2])

    def test_full_turn_sweep_cannot_skip_a_thin_wall(self):
        w=World(scene(bodySize=18,claw=tool('kicker'),walls=[[103,93,1,1]]))
        actual=w.actuate(720,.5)
        self.assertTrue(0<actual<90)
        self.assertFalse(w.collides(w.x,w.y,w.heading))
        self.assertAlmostEqual(w.actuate(-actual,.5),-actual,places=5)

    def test_kicker_initial_angle_roundtrips_and_does_not_set_encoder(self):
        for angle in (0,120,360):
            claw=tool('kicker');claw['initialAngle']=angle
            r=robot('r1',90);r.update(bodySize=18,claw=claw)
            loaded=parse(serialize(shared_scene(r)).decode())['scene']['robots'][0]['claw']
            self.assertEqual(loaded,claw)
            w=World(scene(bodySize=18,claw=loaded))
            self.assertEqual(w.joint,angle)
            self.assertEqual(w.encoders[2],0)
            reset=World(scene(bodySize=18,claw=loaded))
            self.assertEqual(reset.joint,angle)
        for invalid in (-1,361,float('nan')):
            claw=tool('kicker');claw['initialAngle']=invalid
            with self.assertRaises(ValueError):
                World(scene(bodySize=18,claw=claw))
            r=robot('r1',90);r.update(bodySize=18,claw=claw)
            with self.assertRaises(ValueError):
                parse(serialize(shared_scene(r)).decode())

    def test_python_angle_commands_can_make_multiple_turns_from_initial_pose(self):
        claw=tool('kicker');claw['initialAngle']=60
        r=robot('r1',90);r.update(bodySize=18,claw=claw)
        request=dict(scene=shared_scene(r),rate=8,programs={'r1':dict(filename=str(ROOT/'examples/kicker.py'),source=(
            "import motor, rcu\n"
            "motor.SetMotorAngleDelay(2,70,810)\nprint(motor.GetMotorCode(2))\n"
            "rcu.SetWaitForTime(.35)\n"
            "motor.SetMotorAngleDelay(2,-70,1170)\nprint(motor.GetMotorCode(2))\n"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        logs=''.join(e['text'] for e in events if e['kind']=='log')
        self.assertEqual(logs.strip().split(),['810','-360'])
        frames=[e['robots']['r1']['mechanism']['angle'] for e in events if e['kind']=='state']
        self.assertGreater(max(frames),850)
        self.assertAlmostEqual(frames[-1],-300)


    def test_opening_limit_sets_initial_pose_stop_and_roundtrips(self):
        for opening in (0,20,50,100,180):
            with self.subTest(opening=opening):
                claw=tool();claw['maxOpening']=opening
                w=World(scene(bodySize=18,claw=claw))
                jaw=mechanisms.polygons('gripper',0,opening)[2]
                tip=tuple(sum(p[k] for p in jaw[:7])/7 for k in (0,1))
                self.assertAlmostEqual(math.degrees(math.atan2(tip[1]-5.5,tip[0]-1)),opening/2)
                w.motor(2,60);tick(w,100)
                self.assertAlmostEqual(w.joint,mechanisms.limit('gripper',opening))
                w.motor(2,-60);tick(w,100)
                self.assertAlmostEqual(w.joint,0)
                self.assertAlmostEqual(w.encoders[2],0)
                r=robot('r1',90);r.update(bodySize=18,claw=claw)
                loaded=parse(serialize(shared_scene(r)).decode())['scene']
                self.assertEqual(loaded['robots'][0]['claw']['maxOpening'],opening)
        for invalid in (-1,181,float('nan')):
            claw=tool();claw['maxOpening']=invalid
            with self.assertRaises(ValueError):
                World(scene(bodySize=18,claw=claw))
            r=robot('r1',90);r.update(bodySize=18,claw=claw)
            with self.assertRaises(ValueError):
                parse(serialize(shared_scene(r)).decode())

    def test_port_validation_and_xml(self):
        with self.assertRaisesRegex(ValueError,'свободный порт'):
            World(scene(bodySize=18,claw=tool(motor=1)))
        r=robot('r1',90);r.update(bodySize=18,claw=tool('kicker'))
        restored=parse(serialize(shared_scene(r)).decode())['scene']
        self.assertEqual(restored['robots'][0]['claw'],r['claw'])

    def test_angle_commands_and_encoder_reset_preserve_physical_joint(self):
        r=robot('r1',90);r.update(bodySize=18,start=[90,250,0],claw=tool('kicker'))
        request=dict(scene=shared_scene(r),rate=8,programs={'r1':dict(filename=str(ROOT/'examples/kicker.py'),
            source="import motor, rcu\nmotor.SetMotorAngleDelay(2,60,90)\nprint(motor.GetMotorCode(2))\nmotor.SetMotorCode(2)\nprint(motor.GetMotorCode(2))\nrcu.SetWaitForTime(.35)\nmotor.SetMotorAngleDelay(2,-40,90)\nprint(motor.GetMotorCode(2))")})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        logs=''.join(e['text'] for e in events if e['kind']=='log')
        self.assertEqual(logs.strip().split(),['90','0','-90'])
        frames=[e for e in events if e['kind']=='state']
        self.assertAlmostEqual(frames[-1]['robots']['r1']['mechanism']['angle'],0)
        self.assertTrue(any(f['robots']['r1']['encoders'][1]==0 and f['robots']['r1']['mechanism']['angle']>89 for f in frames))

    def test_python_motor_api_drives_mechanism_and_reports_animation(self):
        r=robot('r1',90);r.update(bodySize=18,start=[90,250,0],claw=tool())
        field=shared_scene(r);field['props']=[[106,250,'can']]
        request=dict(scene=field,rate=8,programs={'r1':dict(filename=str(ROOT/'examples/gripper.py'),source=(
            "import motor, rcu\n"
            "motor.SetMotor(2,35)\nrcu.SetWaitForTime(.4)\nmotor.SetMotorStop(2)\n"
            "motor.SetMotor(1,40)\nmotor.SetMotor(3,40)\nrcu.SetWaitForTime(.3)\n"
            "motor.SetMotorStop(1)\nmotor.SetMotorStop(3)\n"
            "motor.SetMotor(2,-35)\nrcu.SetWaitForTime(.4)\n"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        frames=[e for e in events if e['kind']=='state']
        angles=[f['robots']['r1']['mechanism']['angle'] for f in frames]
        self.assertGreater(max(angles),50)
        self.assertTrue(any(f['robots']['r1']['mechanism']['held']==0 for f in frames))
        self.assertAlmostEqual(angles[-1],0)
        self.assertIsNone(frames[-1]['robots']['r1']['mechanism']['held'])
        self.assertGreater(frames[-1]['props'][0][0],110)

if __name__=='__main__':
    unittest.main()
