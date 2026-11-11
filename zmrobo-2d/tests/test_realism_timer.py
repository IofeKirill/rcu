import json
import math
import subprocess
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from engine import World
from test_simulator import scene
from test_scene import robot,scene as shared_scene
from scene_xml import parse,serialize

class RealismTests(unittest.TestCase):
    def test_off_is_ideal_at_any_wear(self):
        worlds=[World(scene(bodySize=18,wear=wear,realistic=False,_seed=11)) for wear in (0,100)]
        for w in worlds:
            w.motor(1,50);w.motor(3,50)
            for _ in range(100):
                w.step(.01)
        self.assertEqual(worlds[0].snapshot(),worlds[1].snapshot())
        self.assertAlmostEqual(worlds[0].x,111)
        self.assertAlmostEqual(worlds[0].heading,0)

    def test_wear_increases_motor_and_sensor_errors(self):
        low=World(scene(bodySize=18,realistic=True,wear=0,_seed=11,
                        walls=[[150,40,2,100]],sensors={'4':['laser',0,0,0],'5':['sonar',0,0,0]}))
        high=World(scene(bodySize=18,realistic=True,wear=100,_seed=11,
                         walls=[[150,40,2,100]],sensors={'4':['laser',0,0,0],'5':['sonar',0,0,0]}))
        ideal=World(scene(bodySize=18,walls=[[150,40,2,100]],sensors={'4':['laser',0,0,0],'5':['sonar',0,0,0]}))
        for w in (low,high):
            self.assertNotEqual(w.motor_gain[1],w.motor_gain[3])
        self.assertGreater(abs(high.motor_gain[1]-1),abs(low.motor_gain[1]-1)*10)
        for port,kind in ((4,'laser'),(5,'sonar')):
            errors=[]
            for w in (low,high):
                samples=[]
                for step in range(100):
                    w.time=step*.03
                    a=w.read(port,kind)
                    self.assertEqual(a,w.read(port,kind))
                    samples.append(abs(a-ideal.read(port,kind)))
                errors.append(sum(samples))
            self.assertGreater(errors[1],errors[0]*3)
        for w in (low,high):
            w.motor(1,70);w.motor(3,70)
            for _ in range(50):
                w.step(.01)
        self.assertNotEqual(low.heading,0)
        self.assertGreater(abs(high.heading),abs(low.heading))

    def test_color_white_remains_white_and_light_stays_in_range(self):
        for wear in (0,100):
            w=World(scene(realistic=True,wear=wear,_seed=11,
                          sensors={'1':['color',0,0,0,1],'2':['light',0,0,0,5]}))
            for i in range(100):
                w.time=i*.03
                self.assertEqual(w.read(1,'color'),6)
                self.assertTrue(0<=w.read(2,'light')<=800)
        with self.assertRaises(ValueError):
            World(scene(realistic=True,wear=101))

    def test_realism_and_individual_wear_round_trip(self):
        a,b=robot('r1',90),robot('r2',300)
        a['wear']=0;b['wear']=86
        field=shared_scene(a,b)
        field['realistic']=True
        restored=parse(serialize(field).decode())['scene']
        self.assertTrue(restored['realistic'])
        self.assertEqual([r['wear'] for r in restored['robots']],[0,86])

class TimerTests(unittest.TestCase):
    def test_timers_use_model_time_and_reset_separately_in_worker(self):
        a,b=robot('r1',90),robot('r2',300)
        programs={
            'r1':"import rcu\nrcu.SetWaitForTime(.2)\nrcu.SetSysTime()\nwhile rcu.GetSysTime()<.06: pass\nprint('timer',rcu.GetSysTime())",
            'r2':"import rcu\nrcu.SetWaitForTime(.4)\nprint('timer',rcu.GetSysTime())"
        }
        request=dict(scene=shared_scene(a,b),rate=8,programs={k:dict(
            filename=str(ROOT/'examples/wall.py'),source=source) for k,source in programs.items()})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        logs={key:''.join(e['text'] for e in events if e['kind']=='log' and e['robot']==key) for key in programs}
        self.assertAlmostEqual(float(logs['r1'].split()[-1]),.063,places=6)
        self.assertAlmostEqual(float(logs['r2'].split()[-1]),.403,places=6)
        final=[e for e in events if e['kind']=='state'][-1]
        self.assertAlmostEqual(final['time'],.403,places=6)

    def test_timer_also_works_in_standalone_runner(self):
        request=dict(scene=scene(),rate=8,program=dict(filename=str(ROOT/'examples/wall.py'),
            source="import rcu\nrcu.SetWaitForTime(.1)\nrcu.SetSysTime()\nrcu.SetWaitForTime(.025)\nprint(rcu.GetSysTime())"))
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'runner.py')],
            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        text=''.join(e['text'] for e in events if e['kind']=='log')
        self.assertAlmostEqual(float(text.strip()),.028,places=6)

if __name__=='__main__':
    unittest.main()
