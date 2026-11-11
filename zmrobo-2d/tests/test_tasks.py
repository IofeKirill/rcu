import copy
import json
import math
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from task_rules import Judge,union_area,projection,validate
from polygon_import import read_world
from scene_xml import serialize,parse
from multi_runner import worlds
from test_scene import robot,scene


def node(tag,attrs=None,*children):return dict(tag=tag,attrs=attrs or {},children=list(children))
def region(key='zone',rect=None,kind='rectangle'):
    return dict(id=key,name=key,rect=rect or [80,240,20,20],kind=kind,visible=False,color='#bb55aa')
def simple_scene(*props):
    s=scene(robot('r1',50 if props else 90));s['robots'][0]['bodySize']=18
    s.update(regions=[region()],props=list(props),propIds=['p'+str(i) for i in range(len(props))])
    return s

def task(*nodes):return dict(nodes=list(nodes),aliases={})
def event(key,condition,*actions,**attrs):
    return node('event',dict(id=key,**attrs),node('condition',{},condition),node('triggers',{},*actions))
def bonus(value=5):return node('setter',{'name':'total_score'},node('sum',{},node('variableValue',{'name':'total_score'}),node('int',{'value':str(value)})))

class TaskTests(unittest.TestCase):
    def test_union_and_half_projection_with_overlap(self):
        a=[(0,0),(10,0),(10,10),(0,10)]
        b=[(5,0),(15,0),(15,10),(5,10)]
        self.assertAlmostEqual(union_area([a,b]),150)
        s=simple_scene();s['regions']=[region(rect=[90,200,30,100])]
        w=worlds(s)['r1'];w.corners=[[(-10,-10),(10,-10),(10,10),(-10,10)]]
        judge=Judge(s,{'r1':w})
        self.assertTrue(judge.inside('r1','zone')) # Exactly half.
        w.x-=.01;self.assertFalse(judge.inside('r1','zone'))
        w.x+=.02;self.assertTrue(judge.inside('r1','zone'))
        w.heading=math.pi/4;w.x=90;self.assertTrue(judge.inside('r1','zone'))

    def test_projection_includes_sensors_and_mechanism_excludes_cones(self):
        s=simple_scene();s['robots'][0].update(sensors={'1':['sonar',30,0,0]},claw=dict(kind='kicker',forward=20,right=0,angle=0,motor=2,initialAngle=0))
        w=worlds(s)['r1'];polys=projection(w)
        self.assertEqual(len(polys),len(w.corners)+1)
        self.assertGreater(max(x for poly in polys for x,y in poly),w.x+30)
        self.assertLess(max(x for poly in polys for x,y in poly),w.x+40)
        w.sensors={};self.assertLess(len(projection(w)),len(polys))

    def test_ellipse_hidden_and_can_half_membership(self):
        s=simple_scene([90,250,'can']);s['regions']=[region(rect=[80,240,20,20],kind='ellipse')]
        w=worlds(s);j=Judge(s,w)
        self.assertTrue(j.inside('p0','zone'))
        w['r1'].props[0].x=101;self.assertFalse(j.inside('p0','zone'))
        s['regions'][0]['visible']=True
        self.assertFalse(Judge(s,w).inside('p0','zone'))

    def test_bigtravel_full_import_and_stage_scores(self):
        data=read_world((ROOT/'polygons/BigTravel.xml').read_text())
        self.assertEqual(len(data['props']),8);self.assertEqual(len(data['regions']),5)
        self.assertEqual(len(data['segments']),24);self.assertEqual(data['circles'],[])
        self.assertEqual(len(data['task']['nodes']),16)
        self.assertTrue(all(not r['visible'] for r in data['regions']))
        self.assertEqual(data['sensors']['3'][0],'sonar')
        s=scene(robot('r1',90));s.update(data);s['robots'][0].update(start=data['start'],bodySize=data['bodySize'],sensors=data['sensors'])
        ws=worlds(s);w=ws['r1'];j=Judge(s,ws)
        self.assertEqual(j.status,'running');self.assertEqual(j.snapshot()['score'],0)
        zones={r['id']:r for r in data['regions']}
        def visit(key,time):
            x,y,width,height=zones[key]['rect'];w.x=x+width/2;w.y=y+height/2;j.tick(time)
        visit('Finish2',1);self.assertEqual(j.snapshot()['score'],0)
        for key,time,score in [('Finish1',2,40),('Finish2',3,120),('Finish3',4,160)]:
            visit(key,time);self.assertEqual(j.snapshot()['score'],score)
        for i,p in enumerate(w.props):
            p.x=50;p.y=200+i*10;j.tick(5+i)
            self.assertEqual(j.snapshot()['score'],165+5*i)
            if i==0:
                old=p.x;p.x=data['props'][0][0];p.y=data['props'][0][1];j.tick(5.1)
                self.assertEqual(j.snapshot()['score'],165)
                p.x=old;p.y=200;j.tick(5.2);self.assertEqual(j.snapshot()['score'],165)
        self.assertEqual(j.status,'success');self.assertEqual(j.snapshot()['score'],200)
        self.assertEqual(len(j.fired),13)
        self.assertIn('200',j.messages[-2]['text'])
        timed=Judge(s,worlds(s));timed.tick(800);self.assertEqual(timed.status,'failed')
        wrong=copy.deepcopy(s);wrong['robots'][0]['start']=[400,250,0]
        self.assertEqual(Judge(wrong,worlds(wrong)).status,'failed')

    def test_foreach_one_award_per_can_and_repeated_edge(self):
        s=simple_scene([90,250,'can'],[98,251,'can'])
        outside=node('not',{},node('inside',{'objectId':'$object','regionId':'zone'}))
        s['task']=task(event('can',outside,bonus(),foreach='can'))
        ws=worlds(s);j=Judge(s,ws)
        for p in ws['r1'].props:p.x=120
        j.tick(1);self.assertEqual(j.snapshot()['score'],10)
        j.tick(2);self.assertEqual(j.snapshot()['score'],10)
        s['task']=task(event('edge',node('inside',{'objectId':'p0','regionId':'zone'}),bonus(),dropsOnFire='false',edge='true'))
        ws=worlds(s);j=Judge(s,ws);self.assertEqual(j.snapshot()['score'],5)
        j.tick(1);self.assertEqual(j.snapshot()['score'],5)
        ws['r1'].props[0].x=120;j.tick(2)
        ws['r1'].props[0].x=90;j.tick(3);self.assertEqual(j.snapshot()['score'],10)

    def test_task_xml_roundtrip_preserves_rules_and_ids(self):
        s=simple_scene([90,250,'can']);s['task']=task(event('score',node('inside',{'objectId':'p0','regionId':'zone'}),bonus()))
        restored=parse(serialize(s).decode())['scene']
        for name in ('task','regions','propIds','props'):self.assertEqual(s[name],restored[name])
        self.assertEqual(Judge(dict(restored,floor=s['floor'],raster=s['raster']),worlds(dict(restored,floor=s['floor'],raster=s['raster']))).snapshot()['score'],5)

    def test_invalid_rules_fail_before_running(self):
        s=simple_scene();s['regions']*=2
        with self.assertRaisesRegex(ValueError,'уникальные'):Judge(s,worlds(s))
        s=simple_scene();s['task']=task(event('bad',node('inside',{'objectId':'missing','regionId':'zone'}),node('success')))
        with self.assertRaisesRegex(ValueError,'объект'):Judge(s,worlds(s))
        for spec in (task(node('exec',{'code':'print(1)'})),task(event('bad',node('not'),node('success'))),task(node('timelimit',{'value':'NaN'}))):
            with self.assertRaises(ValueError):validate(s['regions'],spec)
        s['task']=task(event('bad',node('inside',{'objectId':'r1','regionId':'zone'}),node('setUp',{'id':'missing'})))
        with self.assertRaisesRegex(ValueError,'событие'):Judge(s,worlds(s))

    def test_multi_task_stops_both_programs_and_motors(self):
        s=scene(robot('r1',90),robot('r2',400));s.update(regions=[],task=task(event('finish',node('timer',{'timeout':'50'}),bonus(12),node('success'))))
        program=dict(filename=str(ROOT/'examples/wall.py'),source='import motor,rcu\nmotor.SetMotor(1,40)\nmotor.SetMotor(3,40)\nwhile True: rcu.SetWaitForTime(.01)')
        request=dict(scene=s,programs={r['id']:program for r in s['robots']})
        result=subprocess.run([sys.executable,'-I',str(ROOT/'multi_runner.py')],input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        records=list(map(json.loads,result.stdout.splitlines()));last=[r for r in records if r['kind']=='state'][-1]
        self.assertEqual(last['task']['status'],'success');self.assertEqual(last['task']['score'],12)
        self.assertLess(last['time'],.07)
        self.assertTrue(all(all(v==0 for v in r['motors']) for r in last['robots'].values()))

    def test_single_runner_reports_time_limit_and_incomplete(self):
        from runner import run
        s=simple_scene();s.update(**s['robots'][0]);s['task']=task(node('timelimit',{'value':'50'}))
        records=[]
        with patch('runner.time.sleep'):
            run(dict(scene=s,program=dict(filename=str(ROOT/'examples/wall.py'),source='import rcu\nrcu.SetWaitForTime(10)')),lambda kind,**v:records.append(dict(kind=kind,**v)))
        last=[r for r in records if r['kind']=='state'][-1]
        self.assertEqual(last['task']['status'],'failed');self.assertLess(last['time'],.07)
        j=Judge(simple_scene(),worlds(simple_scene()));self.assertIsNone(j.snapshot())
        s['task']=task(node('init'));j=Judge(s,worlds(s));j.finish();self.assertEqual(j.status,'incomplete')

if __name__=='__main__':unittest.main()
