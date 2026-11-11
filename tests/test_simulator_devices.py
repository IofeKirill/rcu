import base64,copy,json,math,subprocess,sys,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'simulator'))
from engine import World
from devices import LINE_OFFSETS
from multi_runner import worlds
from runner import run
from inspect_scene import inspect
from scene_xml import serialize,parse
from test_simulator_tasks import scene,robot,FLOOR

def device_scene(kind='line'):
 s=scene();s['task']=None;s['props']=[];s['propIds']=[];s['robots'][0]['sensors']={'1':[kind,10,0,0,1]};return s

def world(s):return World(dict(s,**s['robots'][0]))
def program(source,s):
 req=dict(scene=s,programs={'r1':dict(filename=str(ROOT/'tests'/'device-program.py'),source=source)},training=True)
 p=subprocess.run([sys.executable,'-I',str(ROOT/'simulator/multi_runner.py')],input=json.dumps(req)+'\n',capture_output=True,text=True,timeout=15)
 rows=[json.loads(line) for line in p.stdout.splitlines()];errors=[row for row in rows if row['kind']=='error']
 if p.returncode or errors:raise AssertionError((p.stderr,errors))
 return rows

class Devices(unittest.TestCase):
 def test_ir_distance_and_orientation(self):
  s=device_scene('ir');s['walls']=[[140,80,5,80]];w=world(s);self.assertEqual(w.read(1,'ir'),30)
  w.sensors[1]=('ir',10,0,180);self.assertEqual(w.read(1,'ir'),80)
 def test_touch_front_contact(self):
  s=device_scene('touch');s['walls']=[[112,115,5,10]];w=world(s);self.assertEqual(w.read(1,'touch'),1)
  w.x-=2;self.assertEqual(w.read(1,'touch'),0)
 def test_touch_can_contact(self):
  s=device_scene('touch');s['props']=[[115.1,120,'can']];w=world(s);self.assertEqual(w.read(1,'touch'),1)
 def test_line_offsets_and_channels(self):
  self.assertEqual(LINE_OFFSETS,(-5,-2.5,-1.5,0,1.5,2.5,5))
  w=world(device_scene());samples=[]
  def floor(x,y):samples.append((x,y));return (0,0,0) if abs(y-120)<.4 else (255,255,255)
  w.rgb=floor;values=w.line_values(1);self.assertEqual(values,[100,100,100,0,100,100,100])
  self.assertEqual([samples[i*5][1]-120 for i in range(7)],list(LINE_OFFSETS))
  self.assertEqual(w.device('line_group',1,4),1);self.assertEqual(w.device('line_group',1,8),1)
  self.assertEqual(w.device('line_group',1,1),0)
 def test_line_footprint_height(self):
  w=world(device_scene());samples=[];w.rgb=lambda x,y:(samples.append((x,y)) or (255,255,255))
  w.line_values(1);spread=max(x for x,y in samples)-min(x for x,y in samples)
  w.light_heights[1]=5;samples.clear();w.line_values(1)
  self.assertAlmostEqual(max(x for x,y in samples)-min(x for x,y in samples),spread*5)
 def test_colors_and_threshold(self):
  w=world(device_scene());w.device('line_colors',1,list(range(1,8)));self.assertEqual(w.snapshot()['devices']['lineColors'][1],list(range(1,8)))
  w.device('line_threshold',1,30);self.assertEqual(w.line_thresholds[1],30)
  with self.assertRaises(ValueError):w.device('line_colors',1,[7]*6)
 def test_gyro_motion_reset_and_tenths(self):
  w=world(device_scene('gyro'));w.heading+=math.pi/2;self.assertEqual(w.device('gyro',1,3,0),900)
  w.device('gyro_reset',1,1);self.assertEqual(w.device('gyro',1,3,0),0)
  w.motor(1,30);w.motor(3,-30);before=w.heading;w.step(.01)
  self.assertAlmostEqual(w.device('gyro',1,9,0),math.degrees(w.heading-before)/.01,places=4)
 def test_real_gyro_library_in_worker(self):
  rows=program('''import gyro_lib,rcu,motor,sensor
assert gyro_lib.__file__.endswith('gyro_lib.py')
g=gyro_lib.Gyro(1)
g.CalibrateGyro()
motor.SetMotor(1,30)
motor.SetMotor(3,-30)
for _ in range(100):
    rcu.SetWaitForTime(.01)
    angle=g.ReadGyro()
assert abs(angle)>20,angle
assert abs(angle-sensor.GetAHRS(1,3,0)/10)<2,(angle,sensor.GetAHRS(1,3,0))
g.ResetAngle()
assert g.angle==0
motor.SetMotor(1,0)
motor.SetMotor(3,0)
print('gyro-ok')
''',device_scene('gyro'))
  self.assertTrue(any('gyro-ok' in r.get('text','') for r in rows))
 def test_system_time_milliseconds(self):
  rows=program("import rcu\nrcu.SetSysTime()\nrcu.SetWaitForTime(.1)\nt=rcu.GetSysTime()\nassert 100<=t<110,t",device_scene('gyro'))
  self.assertTrue(rows)
 def eye_worlds(self):
  s=device_scene('eye');s['robots'][0]['start']=[100,120,0];s['robots'][0]['sensors']={'1':['eye',10,0,0]}
  r=robot();r.update(id='r2',name='Робот 2',start=[180,120,180],sensors={'1':['eye',10,0,0]});s['robots'].append(r)
  return s,worlds(s)
 def test_eye_exchange_range_orientation_occlusion(self):
  s,ws=self.eye_worlds();a,b=ws.values();b.device('eye_send',1,50);self.assertEqual(a.device('eye_receive',1),50);self.assertEqual(a.device('eye_distance',1),60)
  b.heading=0;self.assertEqual(a.device('eye_receive',1),0);b.heading=math.pi
  a.walls=[[140,110,5,20]];self.assertEqual(a.device('eye_receive',1),0)
  a.walls=[];b.x=300;self.assertEqual(a.device('eye_receive',1),0)
 def test_eye_two_programs_exchange(self):
  s,ws=self.eye_worlds()
  first=(ROOT/'simulator/examples/smart-eye-first.py').read_text();second=(ROOT/'simulator/examples/smart-eye-second.py').read_text()
  req=dict(scene=s,training=True,programs={key:dict(filename=str(ROOT/'tests'/('eye-'+key+'.py')),source=code) for key,code in [('r1',first),('r2',second)]})
  p=subprocess.run([sys.executable,'-I',str(ROOT/'simulator/multi_runner.py')],input=json.dumps(req)+'\n',capture_output=True,text=True,timeout=15)
  rows=[json.loads(line) for line in p.stdout.splitlines()]
  self.assertFalse([r for r in rows if r['kind']=='error']);self.assertTrue(any('Ответ принят' in r.get('text','') for r in rows))
 def test_line_calibration_duration(self):
  rows=program("import trace,rcu\nrcu.SetSysTime()\ntrace.SetTraceV2I2Threshold(1,.1)\nt=rcu.GetSysTime()\nassert 100<=t<120,t",device_scene())
  self.assertTrue(rows)
 def test_eye_rgb_mode_manual_override(self):
  w=world(device_scene('eye'));w.device('eye_mode',1,9,0xff00ff);self.assertEqual(w.eye_modes[1],9)
  w.device('eye_colors',1,[0xff0000]*8);self.assertEqual(w.eye_modes[1],0);self.assertEqual(w.snapshot()['devices']['eyeColors'][1],[0xff0000]*8)
  with self.assertRaises(ValueError):w.device('eye_mode',1,10,0)
 def test_sound_expiry_and_stop(self):
  w=world(device_scene());w.device('sound','tone',.2);self.assertTrue(w.snapshot()['devices']['sound']['active']);w.time=.2;self.assertFalse(w.snapshot()['devices']['sound']['active'])
  w.device('sound','beep',None);w.time=100;self.assertTrue(w.snapshot()['devices']['sound']['active']);w.device('sound','beep',0);self.assertFalse(w.snapshot()['devices']['sound']['active'])
 def test_sound_commands_worker(self):
  rows=program('''import rcu
rcu.SetInSound(1047,.1)
rcu.SoundStartBeep(1)
rcu.SoundMp3(1,1,.1)
rcu.SetMp3Play(1,1)
rcu.SetWaitForTime(.05)
rcu.SetMp3Sound(0)
rcu.SetMp3Suspend()
rcu.SetInBeep(1)
rcu.SetWaitForTime(.05)
rcu.SetInBeep(0)
''',device_scene())
  frames=[r for r in rows if r['kind']=='state'];self.assertTrue(any(r['robots']['r1']['devices']['sound']['active'] for r in frames));self.assertFalse(frames[-1]['robots']['r1']['devices']['sound']['active'])
 def test_line_autonomous_commands_worker(self):
  rows=program('''import trace,rcu
trace.LineSetInitialize(1,'black','wheeledchassis')
trace.SetTraceV2I2Color(1,1,2,3,4,5,6,7)
trace.LineMillisecond(20,100)
trace.LineForBmp(20,20)
trace.LineBasis(20)
rcu.SetWaitForTime(.1)
rcu.SetRcuStop()
''',device_scene())
  final=[r for r in rows if r['kind']=='state'][-1]['robots']['r1'];self.assertGreater(final['x'],100);self.assertEqual(final['devices']['lineColors']['1'],list(range(1,8)))
 def test_xml_new_types_settings_lock_and_caps(self):
  s=device_scene();s['fieldLocked']=True;s['robots'][0]['sensors']={str(i+1):[kind,10,i*3,0,2] for i,kind in enumerate(['line','eye','gyro','ir','touch'])};s['robots'][0]['deviceSettings']={'1':{'lineColors':[1,2,3,4,5,6,7],'lineThreshold':45},'2':{'eyeMode':9,'eyeColor':0x123456,'eyeColors':[0]*8}}
  s['shapes']=[dict(kind='line',points=[[0,0],[10,10]],width=3,stroke='#000000',lineCap='round')]
  out=parse(serialize(s).decode())['scene'];self.assertTrue(out['fieldLocked']);self.assertEqual(out['robots'][0]['deviceSettings'],s['robots'][0]['deviceSettings']);self.assertEqual(out['shapes'][0]['lineCap'],'round');self.assertEqual(out['robots'][0]['sensors']['1'][-1],2)
 def test_inspection_new_sensor_types_without_program(self):
  s=device_scene();s['robots'][0]['sensors']={str(i+1):[kind,10,i*3,0,1] for i,kind in enumerate(['line','eye','gyro','ir','touch'])};r=inspect(dict(scene=s));self.assertEqual(len(r['robots']['r1']['sensors']),5)
 def test_bad_settings_rejected(self):
  s=device_scene();s['robots'][0]['deviceSettings']={'1':{'lineColors':[8]*7}}
  with self.assertRaises(ValueError):world(s)
if __name__=='__main__':unittest.main()
