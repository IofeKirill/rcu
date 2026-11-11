import copy,math,sys,unittest,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'simulator'))
from engine import World
from task_rules import Judge,validate
from multi_runner import worlds
from scene_xml import serialize,parse
from inspect_scene import inspect
from test_simulator_tasks import FLOOR,robot

def tennis():
 a=robot();a.update(start=[300+470*18/1080,269.65,0],sensors={})
 b=copy.deepcopy(a);b.update(id='r2',name='Робот 2',start=[500-470*18/1080,230.35,180])
 return dict(floor=FLOOR,ballDiameter=5.7,robots=[a,b],regions=[],task=dict(kind='tennis',version=1,nodes=[],aliases={},tennis=dict(field=[300,200,200,100],players=['r1','r2']),match=dict(sets=[])),props=[[382.15,y,'ball']for y in(238.25,253.95,269.65)]+[[417.85,y,'ball']for y in(230.35,246.05,261.75)],propIds=['b'+str(i)for i in range(6)],walls=[],segments=[],circles=[],shapes=[])

def judge():
 s=tennis();ws=worlds(s);return Judge(s,ws),ws,s

def moved(j,ws):
 ws['r1'].x+=.2;ws['r2'].x-=.2;j.tick(.1)

class Tennis(unittest.TestCase):
 def test_start_dimensions_and_six_balls(self):
  j,ws,s=judge();self.assertEqual(j.status,'running',j.reason);self.assertTrue(all(p.radius==2.85 for p in ws['r1'].props));self.assertEqual(j.snapshot()['tennis']['scores'],[3,3])
  for rows in (ws['r1'].props[:3],ws['r1'].props[3:]):
   for a,b in zip(rows,rows[1:]):self.assertAlmostEqual(b.y-a.y-a.radius-b.radius,10)
  self.assertAlmostEqual(285-ws['r1'].props[2].y-ws['r1'].props[2].radius,12.5)
  self.assertAlmostEqual(ws['r1'].props[3].y-ws['r1'].props[3].radius-215,12.5)
  self.assertAlmostEqual(ws['r1'].y,ws['r1'].props[2].y);self.assertAlmostEqual(ws['r2'].y,ws['r1'].props[3].y)
 def test_old_centre_based_spacing_is_rejected(self):
  s=tennis()
  for p,y in zip(s['props'],[252.5,262.5,272.5,227.5,237.5,247.5]):p[1]=y
  j=Judge(s,worlds(s));self.assertEqual(j.result,'invalid');self.assertIn('Расстановка',j.reason)
 def test_reject_tool_size_and_bad_starts(self):
  for change,reason in [(lambda r:r.update(claw=dict(kind='kicker',motor=2,forward=7,right=0,angle=0)), 'пиналки'),(lambda r:r.update(bodySize=40),'20 × 20'),(lambda r:r.update(start=[340,250,0]),'старт')]:
   s=tennis();change(s['robots'][0]);j=Judge(s,worlds(s));self.assertEqual(j.result,'invalid');self.assertIn(reason,j.reason.lower()if reason=='старт'else j.reason)
 def test_goals_latched_once_even_if_ball_returns(self):
  j,ws,s=judge();moved(j,ws);p=ws['r1'].props[0];p.x=296;j.tick(1);self.assertEqual(j.goals,[1,0]);p.x=380;j.tick(2);self.assertEqual(j.goals,[1,0]);self.assertEqual(j.tally()[0],[2,3])
 def test_full_ball_must_cross_out(self):
  j,ws,s=judge();moved(j,ws);p=ws['r1'].props[0];p.x=299;j.tick(1);self.assertEqual(j.goals,[0,0]);p.x=297;j.tick(2);self.assertEqual(j.goals,[1,0])
 def test_neutral_and_black_balls_do_not_count(self):
  j,ws,s=judge();moved(j,ws)
  for p,x in zip(ws['r1'].props[:3],[389,400,410]):p.x=x
  j.tick(1);self.assertEqual(j.tally()[:2],([0,3],3));j.finish();self.assertEqual(j.winner,0)
 def test_score_prefers_goals_when_totals_equal(self):
  j,ws,s=judge();moved(j,ws);p=ws['r1'].props;p[0].x=296;p[3].x=400
  # Left concedes one goal, right has one neutral ball. Scores now differ by one.
  j.penalties[1]=1;j.tick(1);self.assertEqual(j.tally()[2],[3,3]);j.finish();self.assertEqual(j.winner,1)
 def test_side_out_uses_last_pusher(self):
  j,ws,s=judge();moved(j,ws);p=ws['r1'].props[0];p.last_touch='r2';p.y=196;j.tick(1);self.assertEqual(j.outs,[0,1])
 def test_unknown_neutral_out_requires_referee(self):
  j,ws,s=judge();moved(j,ws);p=ws['r1'].props[0];p.x=400;j.tick(1);p.y=196;j.tick(2);j.finish();self.assertEqual(j.result,'review');self.assertIsNone(j.winner)
 def test_line_penalty_once_per_entry(self):
  j,ws,s=judge();moved(j,ws);ws['r1'].x=400.5;j.tick(1);j.tick(2);self.assertEqual(j.penalties,[1,0]);ws['r1'].x=330;j.tick(3);ws['r1'].x=400.5;j.tick(4);self.assertEqual(j.penalties,[2,0])
 def test_foreign_field_loses_set(self):
  j,ws,s=judge();moved(j,ws);ws['r1'].x=430;j.tick(1);self.assertEqual((j.result,j.winner),('forfeit',1))
 def test_no_start_and_mutual_no_start(self):
  j,ws,s=judge();ws['r1'].x+=1;j.tick(1);j.tick(5);self.assertEqual((j.result,j.winner),('forfeit',0))
  j,ws,s=judge();j.tick(5);self.assertEqual(j.result,'review');self.assertIsNone(j.winner)
 def test_outside_over_five_seconds(self):
  j,ws,s=judge();moved(j,ws);ws['r1'].x=393;j.tick(1);j.tick(6);self.assertEqual(j.status,'running');j.tick(6.01);self.assertEqual(j.winner,1)
 def test_idle_and_clinch_need_referee(self):
  j,ws,s=judge();moved(j,ws);j.tick(15.2);self.assertEqual(j.result,'review');self.assertIn('15',j.reason)
  j,ws,s=judge();moved(j,ws);ws['r1'].x=392;ws['r1'].y=250;ws['r2'].x=406.833333333;ws['r2'].y=250;j.tick(1);j.tick(1.1);j.tick(6);self.assertEqual(j.result,'review',j.reason);self.assertIn('Клинч',j.reason)
 def test_timeout_and_manual_finish(self):
  j,ws,s=judge();moved(j,ws);ws['r1'].props[0].x=430;j.tick(60);self.assertEqual(j.winner,0);self.assertEqual(j.time,60)
  j,ws,s=judge();j.finish();self.assertEqual(j.result,'draw');self.assertIsNone(j.winner)
 def test_xml_and_checkpoint(self):
  j,ws,s=judge();moved(j,ws);ws['r1'].x=400.5;j.tick(1)
  checkpoint=j.checkpoint();restored=Judge(s,ws,checkpoint);restored.tick(2);self.assertEqual(restored.penalties,[1,0])
  s.pop('floor');data=parse(serialize(s).decode())['scene'];self.assertEqual(data['ballDiameter'],5.7);self.assertEqual(data['task']['kind'],'tennis')
 def test_training_is_unjudged_but_same_ball_size(self):
  s=tennis();s['task']=None;j=Judge(s,worlds(s));self.assertIsNone(j.snapshot());self.assertEqual(worlds(s)['r1'].props[0].radius,2.85)
 def test_runner_keeps_clock_after_programs_exit(self):
  s=tennis();req=dict(scene=s,programs={k:dict(filename=str(ROOT/'tests'/'tennis.py'),source='pass')for k in ('r1','r2')},training=False,rate=8)
  result=subprocess.run([sys.executable,'-I',str(ROOT/'simulator'/'multi_runner.py')],input=json.dumps(req)+'\n',text=True,capture_output=True,timeout=10)
  self.assertEqual(result.returncode,0,result.stderr);rows=[json.loads(r)for r in result.stdout.splitlines()];last=[r for r in rows if r['kind']=='state'][-1]
  self.assertAlmostEqual(last['time'],5,places=6);self.assertEqual(last['task']['tennis']['result'],'review')

class TennisClock(unittest.TestCase):
 def test_busy_programs_without_robot_api_still_time_out(self):
  s=tennis();req=dict(scene=s,programs={k:dict(filename=str(ROOT/'tests'/'tennis-busy.py'),source='while True:\n    pass\n')for k in ('r1','r2')},training=False,rate=8)
  p=subprocess.run([sys.executable,'-I',str(ROOT/'simulator'/'multi_runner.py')],input=json.dumps(req)+'\n',text=True,capture_output=True,timeout=10)
  self.assertEqual(p.returncode,0,p.stderr);rows=[json.loads(r)for r in p.stdout.splitlines()];last=[r for r in rows if r['kind']=='state'][-1]
  self.assertAlmostEqual(last['task']['time'],5,places=6);self.assertEqual(last['task']['tennis']['result'],'review')

 def test_memory_polling_does_not_freeze_clock(self):
  s=tennis();req=dict(scene=s,programs={k:dict(filename=str(ROOT/'tests'/'tennis-poll.py'),source='import rcu\nwhile True:\n    rcu.GetData(1)\n')for k in ('r1','r2')},training=False,rate=8)
  p=subprocess.run([sys.executable,'-I',str(ROOT/'simulator'/'multi_runner.py')],input=json.dumps(req)+'\n',text=True,capture_output=True,timeout=10)
  self.assertEqual(p.returncode,0,p.stderr);rows=[json.loads(r)for r in p.stdout.splitlines()];last=[r for r in rows if r['kind']=='state'][-1]
  self.assertAlmostEqual(last['task']['time'],5,places=6);self.assertEqual(last['task']['tennis']['result'],'review')
