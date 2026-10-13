import ast
import contextlib
import io
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]

class RegulatorTests(unittest.TestCase):
    def load(self, filename):
        powers, stops, reads = [], [], []
        data = {1: 30, 2: 2, 3: 1, 4: 0.08, 5: 80, 6: 40}
        rcu = types.ModuleType('rcu')
        def get_data(index):
            reads.append(index)
            return data[index]
        rcu.GetData = get_data
        rcu.SetWaitForTime = lambda seconds: None
        rcu.SetDisplayString = lambda *args: None
        motor = types.ModuleType('motor')
        motor.SetMotor = lambda port, power: powers.append((port, power))
        motor.SetMotorStop = lambda port: stops.append(port)
        sensor = types.ModuleType('sensor')
        sensor.GetLightSensor = lambda port: {5: 40, 6: 10}[port]
        sensor.SetLightSensorLed = lambda *args: None
        ai = types.ModuleType('ai')
        ai.GetAICamData = lambda field: 130
        for method in ['SetAICamLED', 'SetAICamData', 'SetWaitForAICamData']:
            setattr(ai, method, lambda *args: None)
        camera = types.ModuleType('aicam')
        camera.GetAICam = lambda port, target, field: 330
        camera.SetAICamCmd = lambda port, mode: None
        camera.SetWaitAICamCmd = lambda port, mode: None
        ns = {'__name__': 'test'}
        with patch.dict(sys.modules, {'rcu': rcu, 'motor': motor, 'sensor': sensor, 'ai': ai, 'aicam': camera}):
            tree = ast.parse((ROOT/'examples'/filename).read_text(), filename)
            tree.body = tree.body[:-1]  # Последний task1() запускаем отдельно в тестах.
            exec(compile(tree, filename, 'exec'), ns)
        return ns, data, reads, powers, stops

    def test_camera_pd_reads_live_cells_and_uses_deviation(self):
        ns, data, reads, powers, _ = self.load('aicam_07_line_follow.py')
        ns['LinePDCamera']()
        self.assertEqual(reads, [1, 2, 4])
        self.assertEqual(ns['lastDeviation'], 10/6.4)
        self.assertAlmostEqual(powers[0][1], -(30 + (10/6.4)*0.2 + (10/6.4)*0.08))
        data[1], data[2], data[4] = 20, 5, 2
        powers.clear();reads.clear()
        ns['LinePDCamera']()
        self.assertEqual(reads, [1, 2, 4])
        self.assertEqual(powers, [(2,-20.78125), (4,19.21875)])

    def test_light_normalization_pid_cells_and_integral(self):
        ns, _, reads, powers, _ = self.load('1_PIDRegLine.py')
        self.assertEqual(ns['ReadLight'](5), 0.5)
        self.assertEqual(ns['ReadLight'](6), 0.25)
        reads.clear();ns['LinePIDLight']()
        self.assertEqual(reads, [1,2,3,4,5,6])
        self.assertAlmostEqual(ns['lastDeviation'], 0.25)
        self.assertAlmostEqual(ns['iReg'], 0.00025)
        self.assertAlmostEqual(powers[0][1], 30 + 0.05 + 0.00025 + 0.02)

    def test_old_camera_keeps_its_api_and_center(self):
        ns, _, reads, powers, _ = self.load('2_PIDRegLineCamera.py')
        ns['LinePIDCamera']()
        self.assertEqual(reads, [1,2,3,4])
        self.assertEqual(ns['lastDeviation'],10)
        self.assertAlmostEqual(powers[0][1],32.81)

    def test_integral_limits_remain_but_motor_power_is_not_clamped(self):
        for filename, function, limit in [('1_PIDRegLine.py','LinePIDLight',25),('2_PIDRegLineCamera.py','LinePIDCamera',20)]:
            with self.subTest(filename=filename):
                ns, data, _, powers, _ = self.load(filename)
                data[2], data[3], data[4] = 100000, 100000, 100000
                ns[function]()
                self.assertTrue(any(abs(power) > 100 for _, power in powers))
                self.assertLessEqual(abs(ns['iReg']), limit)

    def test_camera_sets_mode_before_wait_and_runs_normalized_pd(self):
        ns, _, _, powers, _ = self.load('aicam_07_line_follow.py')
        calls = []
        ns['aicam'].SetAICamCmd = lambda *args: calls.append(('set', args))
        ns['aicam'].SetWaitAICamCmd = lambda *args: calls.append(('wait', args))
        def interrupt(seconds):
            self.assertEqual(seconds,0.001)
            raise KeyboardInterrupt()
        ns['rcu'].SetWaitForTime = interrupt
        with self.assertRaises(KeyboardInterrupt):ns['task1']()
        self.assertEqual(calls,[('set',(8,'road')),('wait',(8,'road'))])
        self.assertLess(powers[0][1],0)
        self.assertGreater(powers[1][1],0)
