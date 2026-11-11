import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from engine import World, CLAWS, polygon_contact, polygon_at, polygons_overlap, box_polygon
from test_simulator import scene
from test_scene import robot, scene as field
from multi_runner import worlds
from scene_xml import parse,serialize

def claw(kind='large',forward=8,right=0,angle=0):
    return dict(kind=kind,forward=forward,right=right,angle=angle)

class ClawTests(unittest.TestCase):
    def test_open_shape_and_scale_come_from_hole_pitch(self):
        for kind,data in CLAWS.items():
            if data.get('mechanism'): continue
            with self.subTest(kind=kind):
                w=World(scene(bodySize=18,claw=claw(kind)))
                # Ahead of the bridge, the centre of the opening is empty.
                if kind!='straight':
                    self.assertFalse(any(polygon_contact(11,0,.7,poly) for poly in w.extra))
                for source,poly in zip(data['polygons'],w.extra):
                    a,b=source[:2]
                    expected=math.dist(a,b)/data['pitch']
                    self.assertAlmostEqual(math.dist(poly[0],poly[1]),expected)
                big=World(scene(bodySize=36,claw=claw(kind)))
                self.assertEqual(w.extra,big.extra)

    def test_claw_hits_walls_and_pushes_a_can_outside_body(self):
        for kind in CLAWS:
            if CLAWS[kind].get('mechanism'): continue
            with self.subTest(kind=kind):
                # A can at this lateral position misses the stock robot.
                lateral=-9 if kind=='straight' else 9
                w=World(scene(bodySize=18,claw=claw(kind),props=[[111,90+lateral,'can']]))
                for p in (1,3):
                    w.motor(p,50)
                for _ in range(85):
                    w.step(.01)
                    w.advance_props(.01)
                    self.assertFalse(w.collides(w.x,w.y,w.heading))
                self.assertGreater(math.hypot(w.props[0].x-111,w.props[0].y-(90+lateral)),1)

                w=World(scene(bodySize=18,claw=claw(kind)))
                # Place an obstacle exactly on a claw finger, beyond the body.
                poly=w.extra[-1]
                a=sum(x for x,y in poly)/len(poly)
                b=sum(y for x,y in poly)/len(poly)
                w.circles=[(w.x+a,w.y+b,.25)]
                self.assertTrue(w.collides(w.x,w.y,0))
                bare=World(scene(bodySize=18))
                bare.circles=w.circles
                self.assertFalse(bare.collides(bare.x,bare.y,0))

    def test_mounting_rotation_and_round_trip(self):
        r=robot('r1',90)
        r['claw']=claw('narrow',16,-3,37)
        saved=parse(serialize(field(r)).decode())['scene']
        self.assertEqual(saved['robots'][0]['claw'],r['claw'])
        w=worlds(dict(saved,floor='////',raster=[0,0,1,1],bounds=[-150,-50,950,550]))['r1']
        base=World(scene(claw=claw('narrow',0,0,0)))
        expected=[polygon_at(poly,16,-3,math.cos(math.radians(37)),math.sin(math.radians(37))) for poly in base.extra]
        for a,b in zip(w.extra,expected):
            for u,v in zip(a,b):
                self.assertAlmostEqual(u[0],v[0])
                self.assertAlmostEqual(u[1],v[1])

    def test_other_robot_sensors_and_collisions_include_long_mount(self):
        a,b=robot('r1',90),robot('r2',150)
        a.update(bodySize=18,start=[90,250,0])
        b.update(bodySize=18,start=[150,250,180],claw=claw(forward=27))
        a['sensors']={'4':['laser',0,0,0]}
        robots=worlds(field(a,b))
        self.assertLess(robots['r1'].read(4,'laser'),400)
        w=robots['r1']
        for p in (1,3):
            w.motor(p,60)
        for _ in range(130):
            w.step(.01)
        self.assertTrue(w.blocked)
        self.assertLess(w.x,122)

if __name__=='__main__':
    unittest.main()
