import contextlib
import io
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
class EndExample(Exception):
    pass

class CameraExamplesTests(unittest.TestCase):
    def test_examples_compile_and_use_documented_field_codes(self):
        expected = {
            'aicam_01_probe.py': ('face', 'GetAICam', [(1, field) for field in range(1, 8)]),
            'aicam_02_face.py': ('face', 'GetAICam', [(1, 1)]),
            'aicam_03_qr.py': ('qrcode', 'GetAICamStr', [(1,)]),
            'aicam_04_color.py': ('color', 'GetAICamIDData', [(1, field) for field in (1, 2, 5, 6)]),
            'aicam_05_road.py': ('road', 'GetAICam', [(1, 2), (2, 2)]),
            'aicam_06_human.py': ('human', 'GetAICamIDData', [(10, 1), (10, 2), (11, 1), (11, 2)])
        }
        for filename, (mode, method, fields) in expected.items():
            with self.subTest(filename=filename):
                calls = []
                camera = types.ModuleType('aicam')
                for name in ['SetAICamCmd', 'SetWaitAICamCmd', 'GetAICam', 'GetAICamStr', 'GetAICamIDData']:
                    def record(*args, name=name):
                        calls.append((name, args))
                        return 'run' if name.endswith('Str') else 1
                    setattr(camera, name, record)
                rcu = types.ModuleType('rcu')
                def stop(_seconds):
                    raise EndExample()
                rcu.SetWaitForTime = stop
                code = compile((ROOT/'examples'/filename).read_text(), filename, 'exec')
                with patch.dict(sys.modules, {'rcu': rcu, 'aicam': camera}), contextlib.redirect_stdout(io.StringIO()):
                    with self.assertRaises(EndExample):
                        exec(code, {})
                self.assertEqual(calls[:2], [('SetAICamCmd', (7, mode)), ('SetWaitAICamCmd', (7, mode))])
                selected = [args[1:] for name, args in calls if name == method]
                self.assertEqual(selected, fields)
