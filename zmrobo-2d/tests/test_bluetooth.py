import json
from pathlib import Path
import subprocess
import sys
import unittest

from multi_runner import worlds
from test_scene import robot,scene
from runner import run

ROOT=Path(__file__).resolve().parents[1]

class BluetoothTests(unittest.TestCase):
    def pair(self):
        return worlds(scene(robot('r1',90),robot('r2',250)))

    def run_programs(self,programs,field=None):
        field=field if field is not None else scene(robot('r1',90),robot('r2',250))
        request=dict(scene=field,rate=8,programs={key:dict(filename=str(ROOT/'examples'/name),source=source)
                                               for key,(name,source) in programs.items()})
        proc=subprocess.run([sys.executable,'-I','-u',str(ROOT/'multi_runner.py')],
                            input=json.dumps(request)+'\n',capture_output=True,text=True,timeout=10,check=True)
        events=list(map(json.loads,proc.stdout.splitlines()))
        self.assertFalse([e for e in events if e['kind']=='error'])
        return events

    def test_pair_has_independent_persistent_numeric_receive_registers(self):
        pair=self.pair();a,b=pair.values()
        self.assertEqual(a.get_bluetooth(),0);self.assertEqual(b.get_bluetooth(),0)
        a.set_bluetooth(17)
        self.assertEqual(a.get_bluetooth(),0)
        self.assertEqual([b.get_bluetooth(),b.get_bluetooth()],[17,17])
        b.set_bluetooth(-3.5)
        self.assertEqual(a.get_bluetooth(),-3.5)
        self.assertEqual(b.get_bluetooth(),17)
        a.set_bluetooth(1);a.set_bluetooth(2);a.set_bluetooth(0)
        self.assertEqual(b.get_bluetooth(),0)
        self.assertEqual(b.snapshot()['bluetooth'],dict(connected=True,peer='r1',sent=-3.5,received=0))

    def test_new_scene_resets_registers_and_disconnected_robots_do_not_echo(self):
        a,b=self.pair().values();a.set_bluetooth(23)
        a,b=self.pair().values()
        self.assertEqual(a.get_bluetooth(),0);self.assertEqual(b.get_bluetooth(),0)
        for n in (1,3):
            group=worlds(scene(*(robot('r'+str(i),90+i*160) for i in range(n))))
            first=next(iter(group.values()));first.set_bluetooth(5)
            for w in group.values():
                self.assertEqual(w.get_bluetooth(),0)
                self.assertFalse(w.snapshot()['bluetooth']['connected'])

    def test_invalid_payloads_do_not_change_received_data(self):
        a,b=self.pair().values();a.set_bluetooth(8)
        for value in (True,None,'hello',[],{},float('nan'),float('inf')):
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError,'число'):a.set_bluetooth(value)
                self.assertEqual(b.get_bluetooth(),8)

    def test_two_python_processes_exchange_and_acknowledge_without_wait_calls(self):
        programs={key:(name,(ROOT/'examples'/name).read_text()) for key,name in
                  [('r1','bluetooth-first.py'),('r2','bluetooth-second.py')]}
        events=self.run_programs(programs)
        logs={key:''.join(e['text'] for e in events if e['kind']=='log' and e['robot']==key) for key in programs}
        self.assertIn('Робот 1 получил: 20',logs['r1'])
        self.assertIn('Обмен завершён',logs['r1'])
        self.assertIn('Робот 2 получил: 10',logs['r2'])
        self.assertIn('Робот 2 получил: 30',logs['r2'])
        frame=[e for e in events if e['kind']=='state'][-1]
        self.assertGreater(frame['time'],0)
        self.assertEqual(frame['robots']['r1']['bluetooth']['received'],40)
        self.assertEqual(frame['robots']['r2']['bluetooth']['received'],30)

    def test_send_only_loop_yields_time_and_peer_can_observe_messages(self):
        events=self.run_programs({
            'r1':('bluetooth-first.py',"import rcu\nfor i in range(1,21): rcu.SetBluetoothData(i)\n"),
            'r2':('bluetooth-second.py',"import rcu\nwhile rcu.GetBluetoothData()!=20: pass\nprint('ok',rcu.GetSysTime())\n")})
        self.assertTrue(any(e['kind']=='log' and 'ok' in e['text'] for e in events))
        frame=[e for e in events if e['kind']=='state'][-1]
        self.assertGreaterEqual(frame['time'],.06-1e-8)
        self.assertEqual(frame['robots']['r2']['bluetooth']['received'],20)

    def test_relay_preset_handoff_starts_second_robot_after_first_stops(self):
        field=json.loads((ROOT/'tests/relay-scene.json').read_text())
        pair=worlds(field)
        for w in pair.values():
            self.assertLess(w.read(5,'light'),3800)
            self.assertLess(w.read(6,'light'),3800)
        programs={
            'r1':('bluetooth-first.py',"import motor, rcu\nmotor.SetMotor(1,25)\nmotor.SetMotor(3,25)\nrcu.SetWaitForTime(.6)\nmotor.SetMotorStop(1)\nmotor.SetMotorStop(3)\nrcu.SetBluetoothData(10)\nwhile rcu.GetBluetoothData()!=20: pass\nprint('ack')\n"),
            'r2':('bluetooth-second.py',"import motor, rcu\nwhile rcu.GetBluetoothData()!=10: pass\nmotor.SetMotor(1,25)\nmotor.SetMotor(3,25)\nrcu.SetWaitForTime(.6)\nmotor.SetMotorStop(1)\nmotor.SetMotorStop(3)\nrcu.SetBluetoothData(20)\n")}
        events=self.run_programs(programs,field)
        frames=[e for e in events if e['kind']=='state']
        self.assertTrue(any(f['robots']['r1']['motors'][0]>0 and f['robots']['r2']['motors'][0]==0 for f in frames))
        self.assertTrue(any(f['robots']['r2']['motors'][0]>0 and f['robots']['r1']['motors'][0]==0 for f in frames))
        self.assertFalse(any(f['robots']['r1']['motors'][0]>0 and f['robots']['r2']['motors'][0]>0 for f in frames))
        final=frames[-1]['robots']
        self.assertAlmostEqual(final['r1']['x'],414.5-6.3,places=4)
        self.assertAlmostEqual(final['r2']['x'],357.5+6.3,places=4)
        self.assertEqual(final['r1']['bluetooth']['received'],20)
        self.assertEqual(final['r2']['bluetooth']['received'],10)
        self.assertTrue(all(not q['blocked'] for q in final.values()))

    def test_single_runner_provides_same_api_without_a_peer(self):
        w=next(iter(worlds(scene(robot('r1',90))).values()))
        request=dict(rate=8,program=dict(filename=str(ROOT/'examples/bluetooth-first.py'),source=(
            "import rcu\nrcu.SetBluetoothData(9)\nprint(rcu.GetBluetoothData())\n")))
        events=[]
        def advance(duration):
            while duration>1e-9:
                dt=min(.01,duration);w.step(dt);duration-=dt
        run(request,lambda kind,**data:events.append(dict(kind=kind,**data)),w,advance)
        self.assertEqual(''.join(e['text'] for e in events if e['kind']=='log').strip(),'0')
        self.assertGreater(w.time,0)

if __name__=='__main__':unittest.main()
