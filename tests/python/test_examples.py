import ast
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


class ExampleTests(unittest.TestCase):
    def load(self, filename):
        powers, stops, reads, encoder_reads, displays = [], [], [], [], []
        data = {1: 30, 2: 2, 3: 1, 4: 0.08, 5: 80, 6: 40}
        rcu = types.ModuleType('rcu')
        rcu.GetData = lambda index: (reads.append(index), data[index])[1]
        rcu.SetData = lambda index, value: data.__setitem__(index, value)
        rcu.SetWaitForTime = lambda *args: None
        rcu.SetDisplayString = lambda *args: displays.append(args)
        rcu.SetSysTime = lambda: None
        rcu.GetSysTime = lambda: 0
        rcu.GetBTModuleRemoteRocker = lambda *args: 0
        motor = types.ModuleType('motor')
        motor.SetMotor = lambda port, power: powers.append((port, power))
        motor.SetMotorStop = lambda port: stops.append(port)
        motor.SetMotorCode = lambda *args: None
        motor.GetMotorCode = lambda port: (encoder_reads.append(port), 100)[1]
        sensor = types.ModuleType('sensor')
        sensor.GetLightSensor = lambda port: {1: 12, 5: 40, 6: 10}[port]
        sensor.SetLightSensorLed = lambda *args: None
        ai = types.ModuleType('ai')
        ai.GetAICamData = lambda field:130
        ns = {'__name__': 'test'}
        with patch.dict(sys.modules, {'rcu': rcu, 'motor': motor, 'sensor': sensor, 'ai':ai}):
            tree = ast.parse((ROOT/'examples'/filename).read_text(), filename)
            tree.body = tree.body[:-1]  # Последний task1() запускаем отдельно в тестах.
            exec(compile(tree, filename, 'exec'), ns)
        return ns, data, reads, powers, stops, encoder_reads, displays

    def test_all_examples_compile_and_regulator_globals_only_hold_state(self):
        files = list((ROOT/'examples').rglob('*.py'))
        self.assertEqual(len(files), 17)
        for file in files:
            with self.subTest(file=file.name):
                tree = ast.parse(file.read_text(), file.name)
                compile(tree, file.name, 'exec')
                names = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}
                self.assertTrue({'error', 'lastError'}.isdisjoint(names))
                self.assertFalse(any(isinstance(node, ast.Try) for node in ast.walk(tree)))
                self.assertNotIn('__name__', names)
                self.assertIsInstance(tree.body[-1],ast.Expr)
                self.assertEqual(tree.body[-1].value.func.id,'task1')
                for node in ast.walk(tree):
                    if isinstance(node, ast.Global):
                        self.assertTrue(set(node.names) <= {'lastDeviation','iReg','targetStr'})

    def test_encoder_forward_reverse_and_rotation_direction(self):
        for filename, function, sign in [('3_RobotMovement.py', 'RobotMovement', 1),
                                         ('4_RobotRotationEncoder.py', 'RobotRotation', -1)]:
            for target, direction in [(1000, 1), (-500, -1)]:
                with self.subTest(file=filename, target=target):
                    ns, data, reads, powers, stops, _, _ = self.load(filename)
                    positions = iter([0, abs(target)])
                    ns['motor'].GetMotorCode = lambda port: next(positions)
                    ns[function](target)
                    self.assertEqual(reads, [1])
                    self.assertEqual(powers, [(1, 30*direction), (3, 30*direction*sign)])
                    self.assertEqual(stops, [1,3])

    def test_sync_move_reads_speed_and_scaled_proportional_coefficient(self):
        ns, _, reads, powers, stops, _, _ = self.load('7_SyncMove.py')
        times = iter([0, 1500])
        ns['rcu'].GetSysTime = lambda: next(times)
        ns['motor'].GetMotorCode = lambda port: {1:100,3:110}[port]
        ns['SyncMove'](1500)
        self.assertEqual(reads,[1,2])
        self.assertEqual(powers,[(1,32),(3,28)])
        self.assertEqual(stops,[1,3])

    def test_menu_round_trips_new_cell_mapping_and_keeps_pid_state(self):
        ns, data, _, powers, _, _, _ = self.load('8_EnteringVariables.py')
        ns['ReadVars']()
        self.assertEqual(ns['names'], ['speed','kP','kI','kD'])
        self.assertEqual(ns['values'], [30,0.2,0.001,0.08])
        ns['values'][:] = [50,0.7,0.003,0.4]
        ns['WriteVars']()
        self.assertEqual([data[i] for i in range(1,5)],[50,7,3,0.4])
        ns['LinePID']()
        first = ns['iReg']
        powers.clear()
        ns['LinePID']()
        self.assertAlmostEqual(ns['iReg'], first*2)
        self.assertAlmostEqual(ns['lastDeviation'],0.25)
        self.assertAlmostEqual(powers[0][1],50+0.25*0.7+first*2)
        self.assertEqual(ns['ReadButtons'](2),1)
        ns['ReadButtons'](1)
        self.assertEqual(ns['targetStr'],3)

    def test_remote_reads_claw_encoder_and_stops_without_drift(self):
        ns, _, reads, powers, stops, encoder_reads, _ = self.load('6_BluetoothPult.py')
        def interrupt(*args): raise KeyboardInterrupt()
        ns['rcu'].SetWaitForTime = interrupt
        with self.assertRaises(KeyboardInterrupt):ns['task1']()
        self.assertEqual(encoder_reads,[2,2])
        self.assertEqual(reads,[1,2])
        self.assertEqual(powers,[(1,0),(3,0),(2,0)])
        self.assertEqual(stops,[])

    def test_shared_examples_keep_original_motor_sign(self):
        for name, function in [('1_PIDRegLine.py','LinePIDLight'),('2_PIDRegLineCamera.py','LinePIDCamera'),('8_EnteringVariables.py','LinePID')]:
            ns, _, _, powers, _, _, _ = self.load(name)
            ns[function]()
            self.assertGreater(powers[0][1],0)
            self.assertGreater(powers[1][1],0)

    def test_sensor_file_round_trip(self):
        writer, *_ = self.load('9_SaveDataToFile.py')
        reader, _, _, _, _, _, displays = self.load('10_ReadDataFromFile.py')
        # Подменяем open, не меняя рабочую папку других тестов.
        original_open = open
        with tempfile.TemporaryDirectory() as directory:
            def local_open(filename, mode):return original_open(Path(directory)/filename, mode)
            writer['open'] = reader['open'] = local_open
            writer['task1']()
            reader['task1']()
            self.assertEqual(len(displays),10)
            self.assertEqual([row[1] for row in displays],['12']*10)
            self.assertEqual([row[0] for row in displays],list(range(1,11)))
