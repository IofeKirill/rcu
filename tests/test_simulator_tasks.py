"""Integration tests for the visual compiler, judge, inspection and training runner."""
import base64,copy,json,subprocess,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'simulator'))
from engine import World
from task_rules import Judge
from inspect_scene import inspect
from multi_runner import run
from scene_xml import serialize,parse
FLOOR=base64.b64encode(bytes([255,255,255])*800*500).decode()
def region(id,x,y=100,w=40,h=40):return dict(id=id,name=id,kind='rectangle',rect=[x,y,w,h],visible=True,color='#bb55aa')
def robot():return dict(id='r1',name='Робот 1',model='E6',start=[100,120,0],bodySize=18,wheelDiameter=56,motorType='standard',wheels=[1,3],reversed=[False,False],sensors={'5':['light',10,0,0,1]},cells={},claw=None)
def scene():return dict(floor=FLOOR,robots=[robot()],regions=[region('start',80),region('a',200),region('b',300),region('ring',400,100,100,100)],props=[[440,140,'can'],[460,160,'can']],propIds=['c1','c2'],walls=[],segments=[],circles=[],shapes=[])
def model():return dict(version=1,title='Тест',description='',order='sequence',limit=10,timeout='fail',start=None,steps=[],violations=[],finish=dict(mode='all',robot='r1',region='b'))
def step(type='reach',**kwargs):return dict(id='s1',type=type,name='Этап',robot='r1',region='a',regions=['a','b'],routeOrder='sequence',points=10,optional=False,group='can',objects=[],count=0,simultaneous=True,seconds=1,repeat='once',**kwargs)
def compile_model(m,s):
 env=dict(robots=s['robots'],regions=s['regions'],props=[dict(id=id,kind=p[2]) for id,p in zip(s['propIds'],s['props'])])
 code="const T=require('./simulator/media/task-builder.js');const x=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(T.compile(x.m,x.env)));"
 p=subprocess.run(['node','-e',code],cwd=ROOT,input=json.dumps(dict(m=m,env=env)),text=True,capture_output=True)
 if p.returncode:raise ValueError(p.stderr)
 return json.loads(p.stdout)
def judge(m,s=None):
 s=copy.deepcopy(s or scene());s['task']=compile_model(m,s);w=World(dict(s,**s['robots'][0]));return Judge(s,{'r1':w}),w,s
def move(w,x,y=120):w.x=x;w.y=y
class Tasks(unittest.TestCase):
 def test_sequence_and_once(self):
  m=model();m['steps']=[step(),dict(step(),id='s2',region='b',points=20)]
  j,w,s=judge(m);move(w,320);j.tick(1);self.assertEqual(j.snapshot()['score'],0)
  move(w,220);j.tick(2);self.assertEqual(j.snapshot()['score'],10)
  move(w,100);j.tick(3);move(w,220);j.tick(4);self.assertEqual(j.snapshot()['score'],10)
  move(w,320);j.tick(5);self.assertEqual((j.status,j.snapshot()['score']),('success',30))
 def test_any_order(self):
  m=model();m['order']='any';m['steps']=[step(),dict(step(),id='s2',region='b')]
  j,w,s=judge(m);move(w,320);j.tick(1);self.assertEqual(j.snapshot()['score'],10)
  move(w,220);j.tick(2);self.assertEqual(j.status,'success')
 def test_optional_does_not_block(self):
  m=model();m['steps']=[dict(step(),optional=True),dict(step(),id='s2',region='b')]
  j,w,s=judge(m);move(w,320);j.tick(1);self.assertEqual(j.status,'success')
 def test_object_awards_and_return(self):
  m=model();m['steps']=[dict(step('eject'),region='ring',points=5)]
  j,w,s=judge(m);w.props[0].x=550;j.tick(1);self.assertEqual(j.snapshot()['score'],5)
  w.props[0].x=440;w.props[1].x=560;j.tick(2);self.assertEqual(j.snapshot()['score'],10);self.assertEqual(j.status,'running')
  w.props[0].x=550;j.tick(3);self.assertEqual(j.snapshot()['score'],10);self.assertEqual(j.status,'success')
 def test_cumulative_objects(self):
  m=model();m['steps']=[dict(step('eject'),region='ring',points=5,simultaneous=False)]
  j,w,s=judge(m);w.props[0].x=550;j.tick(1);w.props[0].x=440;w.props[1].x=560;j.tick(2);self.assertEqual(j.status,'success')
 def test_delivery_count(self):
  m=model();m['steps']=[dict(step('deliver'),region='a',points=5,count=1)]
  j,w,s=judge(m);w.props[0].x=220;w.props[0].y=120;j.tick(1);self.assertEqual(j.status,'success');self.assertEqual(j.snapshot()['score'],5)
 def test_start_check(self):
  m=model();m['start']=dict(robot='r1',region='a');m['steps']=[step()]
  j,w,s=judge(m);self.assertEqual(j.status,'failed')
 def test_timeout(self):
  m=model();m['steps']=[step()];j,w,s=judge(m);j.tick(10);self.assertEqual(j.status,'failed')
 def test_timed_finish_keeps_points(self):
  m=model();m['finish']['mode']='time';m['steps']=[step()];j,w,s=judge(m);move(w,220);j.tick(1);self.assertEqual(j.status,'running');j.tick(10);self.assertEqual(j.status,'success');self.assertEqual(j.snapshot()['score'],10)
 def test_violation_priority(self):
  m=model();m['steps']=[step()];m['violations']=[dict(robot='r1',region='a',action='fail',penalty=5,repeat='once',message='Запрет')]
  j,w,s=judge(m);move(w,220);j.tick(1);self.assertEqual(j.status,'failed');self.assertEqual(j.snapshot()['score'],-5)
 def test_penalty_per_entry(self):
  m=model();m['steps']=[dict(step(),region='b')];m['violations']=[dict(robot='r1',region='a',action='penalty',penalty=5,repeat='entry',message='Запрет')]
  j,w,s=judge(m);move(w,220);j.tick(1);j.tick(2);self.assertEqual(j.snapshot()['score'],-5);move(w,100);j.tick(3);move(w,220);j.tick(4);self.assertEqual(j.snapshot()['score'],-10)
 def test_stationary_duration_and_reset(self):
  m=model();m['steps']=[step('stop')];j,w,s=judge(m);move(w,220);j.tick(1);j.tick(1.5);self.assertEqual(j.status,'running')
  move(w,221);j.tick(1.6);j.tick(2);self.assertEqual(j.status,'running');j.tick(2.6);self.assertEqual(j.status,'success')
 def test_route(self):
  m=model();m['steps']=[step('visit')];j,w,s=judge(m);move(w,320);j.tick(1);move(w,220);j.tick(2);self.assertEqual(j.status,'running');move(w,320);j.tick(3);self.assertEqual(j.status,'success')
 def test_repeat_no_double_score(self):
  m=model();m['steps']=[dict(step(),repeat='entry')];m['finish']['mode']='time';j,w,s=judge(m);move(w,220);j.tick(1);j.tick(2);self.assertEqual(j.snapshot()['score'],10);move(w,100);j.tick(3);move(w,220);j.tick(4);j.tick(5);self.assertEqual(j.snapshot()['score'],20)
 def test_xml_roundtrip(self):
  m=model();m['steps']=[step()];j,w,s=judge(m);out=parse(serialize(s).decode())['scene'];self.assertEqual(out['task']['builder'],m);self.assertEqual(out['task']['nodes'],s['task']['nodes'])
 def test_inspect_no_program(self):
  s=scene();s['task']={'nodes':[]};r=inspect(dict(scene=s,program={'source':"raise Exception('MUST NOT RUN')"}));self.assertEqual(r['robots']['r1']['sensors']['5'],4000);self.assertNotIn('task',r)
 def test_inspect_retains_light_led_state(self):
  s=scene();r=inspect(dict(scene=s,deviceStates={'r1':{'light_leds':{'5':False}}}));self.assertEqual(r['robots']['r1']['sensors']['5'],0)
 def test_manual_checkpoint(self):
  m=model();m['steps']=[step(),dict(step(),id='s2',region='b')];s=scene();s['task']=compile_model(m,s)
  r=inspect(dict(scene=s,judge=True));s['robots'][0]['start']=[220,120,0]
  r=inspect(dict(scene=s,judge=True,checkpoint=r['checkpoint'],advance=1));self.assertEqual(r['task']['score'],10)
  s['robots'][0]['start']=[320,120,0];r=inspect(dict(scene=s,judge=True,checkpoint=r['checkpoint'],advance=1));self.assertEqual(r['task']['status'],'success');self.assertEqual(r['task']['score'],20)
 def test_training_bypasses_start_and_limit(self):
  s=scene();m=model();m['start']=dict(robot='r1',region='a');m['limit']=.01;m['steps']=[step()];s['task']=compile_model(m,s)
  frames=[];import multi_runner
  old=multi_runner.send;multi_runner.send=lambda kind,**data:frames.append((kind,data))
  try:run(dict(scene=s,training=True,programs={'r1':{'filename':str(ROOT/'tests'/'training-test.py'),'source':'import rcu\nrcu.SetWaitForTime(.03)'}}))
  finally:multi_runner.send=old
  self.assertTrue(all(data.get('task') is None for kind,data in frames if kind=='state'))
  self.assertGreaterEqual(frames[-1][1]['time'],.03)
 def test_big_travel_matches_legacy(self):
  travel=json.loads((ROOT/'simulator/media/big-travel.json').read_text());s=scene();s.update({k:travel[k] for k in ['regions','props','propIds']});s['robots'][0]['start']=travel['start']
  code="const T=require('./simulator/media/task-builder.js');const s=JSON.parse(require('fs').readFileSync(0,'utf8'));const env={robots:s.robots,regions:s.regions,props:s.props.map((p,i)=>({id:s.propIds[i],kind:p[2]}))};console.log(JSON.stringify(T.compile(T.bigTravel('r1',env),env)));"
  compiled=json.loads(subprocess.check_output(['node','-e',code],cwd=ROOT,input=json.dumps(s),text=True))
  a=copy.deepcopy(s);a['task']=copy.deepcopy(travel['task']);a['task']['aliases']={'robot1':'r1'};b=copy.deepcopy(s);b['task']=compiled
  wa=World(dict(a,**a['robots'][0]));wb=World(dict(b,**b['robots'][0]));ja=Judge(a,{'r1':wa});jb=Judge(b,{'r1':wb})
  def check(t):
   ja.tick(t);jb.tick(t);self.assertEqual((ja.status,ja.snapshot()['score']),(jb.status,jb.snapshot()['score']))
  # Early arrival at later checkpoints gives no points.
  r=next(r for r in s['regions'] if r['id']=='Finish2');move(wa,r['rect'][0]+17,r['rect'][1]+17);move(wb,wa.x,wa.y);check(.1)
  wa.props[0].x=wb.props[0].x=780
  for i in range(1,4):
   r=next(r for r in s['regions'] if r['id']=='Finish'+str(i));move(wa,r['rect'][0]+17,r['rect'][1]+17);move(wb,wa.x,wa.y);check(i)
  wa.props[0].x=wb.props[0].x=691.49
  for i in range(1,8):wa.props[i].x=wb.props[i].x=780;check(4+i*.1)
  self.assertEqual(jb.status,'running')
  wa.props[0].x=wb.props[0].x=780;check(5)
  self.assertEqual(jb.status,'success');self.assertEqual(jb.snapshot()['score'],200)
if __name__=='__main__':unittest.main()
