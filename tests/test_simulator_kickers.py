import copy,math,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'simulator'))
import mechanisms
from engine import World,polygon_contact
from scene_xml import serialize,parse
from test_simulator_tasks import scene

def sample(length=None):
 s=scene();s['task']=None;s['props']=[];s['propIds']=[]
 c=dict(kind='kicker',forward=10,right=0,angle=0,motor=2,initialAngle=0)
 if length is not None:c['length']=length
 s['robots'][0]['claw']=c
 return s

class Kickers(unittest.TestCase):
 def test_default_and_increasing_reach(self):
  self.assertEqual(mechanisms.polygons('kicker',0),mechanisms.polygons('kicker',0,kicker_length='short'))
  reaches=[]
  for length in mechanisms.KICKERS:
   w=World(dict(sample(length),**sample(length)['robots'][0]));w.refresh_mechanism(90)
   points=[(x-10,y) for poly in w.tool_polygons[1:] for x,y in poly]
   reaches.append(max(math.hypot(x,y) for x,y in points))
  self.assertEqual(reaches,sorted(reaches));self.assertEqual(len(set(reaches)),4)
 def test_all_lengths_roundtrip_and_old_xml(self):
  for length in mechanisms.KICKERS:
   s=sample(length);s['robots'][0]['claw']['initialAngle']=270
   result=parse(serialize(s).decode())['scene']['robots'][0]['claw']
   self.assertEqual(result['length'],length);self.assertEqual(result['initialAngle'],270)
  old=serialize(sample()).replace(b' length="short"',b'')
  self.assertEqual(parse(old.decode())['scene']['robots'][0]['claw']['length'],'short')
 def test_long_tool_contacts_where_short_does_not(self):
  short=mechanisms.polygons('kicker',0,kicker_length='short')[1:]
  long=mechanisms.polygons('kicker',0,kicker_length='extraLong')[1:]
  self.assertFalse(any(polygon_contact(15,0,.2,p) for p in short))
  self.assertTrue(any(polygon_contact(15,0,.2,p) for p in long))
 def test_extended_kicker_strikes_ball_beyond_short_reach(self):
  positions=[]
  for length in ('short','extraLong'):
   s=sample(length);s['props']=[[125,130,'ball']]
   w=World(dict(s,**s['robots'][0]));self.assertAlmostEqual(w.actuate(60,1),60)
   positions.append((w.props[0].x,w.props[0].y))
  self.assertEqual(positions[0],(125,130))
  self.assertGreater(math.hypot(positions[1][0]-125,positions[1][1]-130),1)
 def test_all_kicker_bends_face_same_side(self):
  for key,data in mechanisms.KICKERS.items():
   self.assertGreater(data['points'][-1][1],0,key)
   if key in ('long','extraLong'):self.assertTrue(data['mirrorY'])
   else:self.assertFalse(data.get('mirrorY',False))
 def test_invalid_length_rejected(self):
  s=sample('bad')
  with self.assertRaises(ValueError):World(dict(s,**s['robots'][0]))
  with self.assertRaises(ValueError):serialize(s)
