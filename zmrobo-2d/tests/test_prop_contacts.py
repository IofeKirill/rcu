import math
import unittest

from engine import World, Prop, box_polygon, rotate
from test_simulator import scene

class PropContactTests(unittest.TestCase):
    def assert_separated(self,w):
        self.assertFalse(w.collides(w.x,w.y,w.heading))
        for i,a in enumerate(w.props):
            for b in w.props[i+1:]:
                self.assertGreaterEqual(math.hypot(a.x-b.x,a.y-b.y),a.radius+b.radius-2e-6)

    def test_robot_pushes_a_chain_in_either_list_order(self):
        for reverse in (False,True):
            props=[[106+i*6.6,90,'can'] for i in range(4)]
            if reverse:
                props.reverse()
            w=World(scene(bodySize=18,props=props))
            w.motor(1,60);w.motor(3,60)
            for _ in range(150):
                w.step(.01);w.advance_props(.01)
                self.assert_separated(w)
            self.assertGreater(w.x,125)
            self.assertGreater(min(p.x for p in w.props),135)
            self.assertFalse(w.blocked)

    def test_a_kicked_prop_transfers_motion_to_another(self):
        for kind in ('can','ball'):
            w=World(scene(bodySize=18,props=[[120,90,kind],[126.8,90,kind]]))
            w.props[0].vx=35
            for _ in range(70):
                w.advance_props(.01)
                self.assert_separated(w)
            self.assertGreater(w.props[1].x,127.5)

    def test_wall_blocks_the_entire_chain_without_overlap(self):
        w=World(scene(bodySize=18,props=[[106,90,'can'],[112.6,90,'can']],
                      segments=[[127,50,127,130,2]]))
        w.motor(1,80);w.motor(3,80)
        for _ in range(180):
            w.step(.01);w.advance_props(.01)
            self.assert_separated(w)
            for p in w.props:
                self.assertLessEqual(p.x+p.radius,126+1e-6)
        self.assertTrue(w.blocked)
        before=[(p.x,p.y,p.vx,p.vy) for p in w.props]
        self.assertFalse(w.push_props(w.x+1,w.y,w.heading,0,.01))
        self.assertEqual(before,[(p.x,p.y,p.vx,p.vy) for p in w.props])

    def test_tightly_held_can_follows_translation_and_rotation(self):
        w=World(scene(bodySize=18))
        w.extra=[box_polygon(16,-3.8,12,.5),box_polygon(16,3.3,12,.5),
                 box_polygon(16,-3.8,.1,7.6)]
        w.corners.extend(w.extra)
        w.extent=30
        w.props=[Prop(w.x+19.4,w.y,'can')]
        self.assert_separated(w)
        w.motor(1,55);w.motor(3,50)
        for _ in range(120):
            w.step(.01);w.advance_props(.01)
            self.assert_separated(w)
            p=w.props[0]
            u,v=rotate(p.x-w.x,p.y-w.y,math.cos(w.heading),math.sin(w.heading))
            self.assertAlmostEqual(u,19.4,places=4)
            self.assertAlmostEqual(v,0,places=4)
        self.assertFalse(w.blocked)
        self.assertGreater(w.x,110)
        self.assertGreater(w.heading,.15)

if __name__=='__main__':
    unittest.main()
