import base64
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from multi_runner import worlds
from scene_xml import serialize,parse

def robot(key,x,model='E6'):
    return dict(id=key,name=key,model=model,start=[x,250,0],wheels=[1,3],reversed=[False,False],
                wheelDiameter=56,motorType='standard',claw=None,wear=0,bodySize=36,sensors={},cells={},program=f'programs/{key}.py')

def scene(*robots):
    return dict(robots=robots,walls=[],segments=[],circles=[],shapes=[],bounds=[-150,-50,950,550],
                raster=[0,0,1,1],floor=base64.b64encode(b'\xff'*3).decode())

class SceneTests(unittest.TestCase):
    def test_xml_preserves_geometry_program_and_memory(self):
        r=robot('r1',90,'M6')
        r.update(sensors={'1':['laser',-2,3,-90],'8':['color',25,0,0]},cells={'128':4095},wheelDiameter=70,motorType='sport')
        r2=robot('r2',180,'E7')
        s=scene(r,r2)
        s['shapes']=[dict(kind='cubicBezier',points=[[12,15],[48,90],[20,60],[27,40]],width=4,stroke='#abcdef',fill=None,dash='solid',guide=False)]
        restored=parse(serialize(s).decode())['scene']
        self.assertEqual(list(s['robots']),restored['robots'])
        self.assertEqual(s['shapes'],restored['shapes'])
        self.assertNotIn(8,worlds(s)['r1'].sensors)
        with self.assertRaises(ValueError):
            worlds(s)['r1'].read(8,'color')

    def test_save_and_load_xml_with_isolated_python(self):
        r=robot('r1',90)
        r.update(name='Робот',motorType='sport')
        original=scene(r)
        original['segments']=[[10,20,50,60,4]]
        original['props']=[[115,250,'can'],[140,250,'ball']]
        command=[sys.executable,'-I','-u',str(ROOT/'scene_xml.py')]
        with tempfile.TemporaryDirectory() as workdir:
            xml=subprocess.run(command+['save'],input=json.dumps(original).encode('utf-8'),
                               cwd=workdir,capture_output=True,check=True,timeout=5).stdout
            restored=subprocess.run(command+['load'],input=xml,
                                    cwd=workdir,capture_output=True,check=True,timeout=5).stdout
        result=json.loads(restored)['scene']
        self.assertEqual(result['robots'],[r])
        self.assertEqual(result['segments'],original['segments'])
        self.assertEqual(result['props'],original['props'])

    def test_robot_distance_and_collision(self):
        r=robot('r1',-70)
        r['sensors']={'1':['laser',18,0,0]}
        robots=worlds(scene(r,robot('r2',30)))
        w=robots['r1']
        self.assertEqual(w.read(1,'laser'),663)
        w.motor(1,100);w.motor(3,100)
        for _ in range(300):
            w.step(.01)
        self.assertTrue(w.blocked)
        # The front case meets the other robot's rear caster, between its wheels.
        self.assertAlmostEqual(w.x,30-(887-70)*36/1080,delta=.05)

    def test_light_calibration_and_footprint(self):
        r=robot('r1',90)
        for height,maximum in enumerate((4000,3200,2400,1600,800),1):
            with self.subTest(height=height):
                r['sensors']={'1':['light',0,0,0,height]}
                field=scene(r)
                field['raster']=[80,240,20,20]
                for value,expected in ((0,0),(255,maximum)):
                    field['floor']=base64.b64encode(bytes([value])*1200).decode()
                    w=worlds(field)['r1']
                    self.assertEqual(w.read(1,'light'),expected)
                field['floor']=base64.b64encode((bytes([0])*30+bytes([255])*30)*20).decode()
                r['sensors']['1'][1]=-.75
                mixed=worlds(field)['r1'].read(1,'light')
                if height==1:
                    self.assertEqual(mixed,0)
                else:
                    self.assertGreater(mixed,0)
                    self.assertLess(mixed,maximum)
                r['sensors']['1'][1]=0
        loaded=parse(serialize(field).decode())['scene']
        self.assertEqual(loaded['robots'][0]['sensors']['1'][-1],5)

    def test_led_changes_color_from_python(self):
        r=robot('r1',90)
        r['sensors']={'3':['led',0,0,0]}
        request=dict(scene=scene(r),programs={'r1':dict(filename=str(ROOT/'examples/wall.py'),
            source="import sensor, rcu\nsensor.Set3CLed(3,2)\nrcu.SetWaitForTime(.12)\nsensor.Set3CLed(3,0)")})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        frames=[e['robots']['r1'] for e in events if e['kind']=='state']
        self.assertIn(2,[f['lamps']['3'] for f in frames])
        self.assertEqual(frames[-1]['lamps']['3'],0)
        self.assertNotIn('3',frames[-1]['sensors'])

    def test_wheel_diameter_changes_travel_not_shaft_angle(self):
        short=robot('r1',90)
        large=dict(short,wheelDiameter=112)
        a,b=[worlds(scene(r))['r1'] for r in (short,large)]
        for w in (a,b):
            w.motor(1,100);w.motor(3,100);w.step(1)
        self.assertAlmostEqual((b.x-90)/(a.x-90),2)
        self.assertEqual(a.encoders,b.encoders)

    def test_programs_share_time_and_have_separate_values(self):
        robots=[robot('r1',90),robot('r2',400)]
        request=dict(scene=scene(*robots),rate=8,programs={})
        with tempfile.TemporaryDirectory() as tmp:
            for index,r in enumerate(robots,1):
                r['cells']={'1':index}
                request['programs'][r['id']] = dict(filename=str(Path(tmp)/'program.py'),
                    source='import rcu, motor\nvalue=rcu.GetData(1)\nmotor.SetMotor(1,100)\nmotor.SetMotor(3,100)\nrcu.SetWaitForTime(value)\nprint(value)')
            proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],input=json.dumps(request)+'\n',
                capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([x for x in events if x['kind']=='error'])
        self.assertEqual({e['robot']:e['values']['value'] for e in events if e['kind']=='variables'}, {'r1':'1','r2':'2'})
        final=[e for e in events if e['kind']=='state'][-1]
        self.assertAlmostEqual(final['time'],2)
        self.assertAlmostEqual(final['robots']['r1']['x'],132)
        self.assertAlmostEqual(final['robots']['r2']['x'],484)

    def test_sport_turn_through_python_motor_api(self):
        r=robot('r1',90)
        r.update(motorType='sport',bodySize=18,reversed=[True,False])
        request=dict(scene=scene(r),rate=8,programs={'r1':dict(
            filename=str(ROOT/'examples/line.py'),source=(
                "import motor, rcu\n"
                "motor.SetMotorAngle(1, 135, 900)\n"
                "motor.SetMotorAngle(3, -135, 900)\n"
                "rcu.SetWaitForTime(.4)"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        last=[e['robots']['r1'] for e in events if e['kind']=='state'][-1]
        self.assertAlmostEqual(last['heading'],math.pi/2)
        self.assertEqual(last['encoders'],[900,0,-900,0])
        self.assertEqual(last['motors'],[0,0,0,0])

    def test_alignment_program_can_press_against_wall_and_back_away(self):
        r=robot('r1',125)
        r.update(start=[125,250,25],bodySize=18)
        field=scene(r)
        field['segments']=[[152,150,152,350,4]]
        request=dict(scene=field,rate=8,programs={'r1':dict(
            filename=str(ROOT/'examples/wall.py'),source=(
                "import motor, rcu\n"
                "motor.SetMotor(1,75)\n"
                "motor.SetMotor(3,75)\n"
                "rcu.SetWaitForTime(2)\n"
                "motor.SetMotor(1,-50)\n"
                "motor.SetMotor(3,-50)\n"
                "rcu.SetWaitForTime(.3)"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        frames=[e['robots']['r1'] for e in events if e['kind']=='state']
        contact=[f for f in frames if f['blocked']]
        self.assertTrue(contact)
        self.assertAlmostEqual(contact[-1]['heading'],0,places=5)
        self.assertAlmostEqual(contact[-1]['x']-frames[-1]['x'],6.3,places=4)
        self.assertFalse(frames[-1]['blocked'])

    def test_shared_props_move_and_are_reported_in_simulation_frames(self):
        r=robot('r1',90)
        r.update(bodySize=18)
        field=scene(r,robot('r2',350))
        field['props']=[[106,250,'ball'],[106,280,'can']]
        a,b=worlds(field).values()
        self.assertIs(a.props,b.props)
        request=dict(scene=field,rate=8,programs={'r1':dict(
            filename=str(ROOT/'examples/wall.py'),source=(
                "import motor, rcu\n"
                "motor.SetMotor(1,80)\n"
                "motor.SetMotor(3,80)\n"
                "rcu.SetWaitForTime(.28)\n"
                "motor.SetMotor(1,0)\n"
                "motor.SetMotor(3,0)\n"
                "rcu.SetWaitForTime(1)"))})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        frames=[e for e in map(json.loads,proc.stdout.splitlines()) if e['kind']=='state']
        self.assertEqual(frames[0]['props'],[[106,250],[106,280]])
        self.assertGreater(frames[-1]['props'][0][0],116)
        self.assertEqual(frames[-1]['props'][1],[106,280])

    def test_stop_interrupts_program_without_wait(self):
        r=robot('r1',90)
        request=dict(scene=scene(r),interactive=True,programs={'r1':dict(
            filename=str(ROOT/'examples/line.py'),source="print('ready')\nwhile True: pass")})
        with subprocess.Popen([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
                stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True) as proc:
            proc.stdin.write(json.dumps(request)+'\n');proc.stdin.flush()
            # Stop immediately, even if the command arrives in the same pipe read as the request.
            out,err=proc.communicate('stop\n',timeout=8)
        self.assertEqual(proc.returncode,0,err)
        self.assertIn('stopped',[json.loads(line)['kind'] for line in out.splitlines()])

if __name__=='__main__':
    unittest.main()
