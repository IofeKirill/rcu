import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'python'))
from usb_identity import enrich_ports

class IdentityTests(unittest.TestCase):
    def test_two_devices_reversed_order(self):
        ports = [{'address': 'COM5', 'name': 'E7'}, {'address': 'COM6', 'name': 'E6'}]
        identities = [{'address': 'com6', 'physicalId': 'USB2', 'mountpoints': ['F:\\'], 'diskDevices': ['disk2']},
                      {'address': 'COM5', 'physicalId': 'USB1', 'mountpoints': ['E:\\'], 'diskDevices': ['disk1']}]
        rows = enrich_ports(ports, identities)
        self.assertEqual(rows[0]['physicalId'], 'USB1')
        self.assertEqual(rows[1]['mountpoints'], ['F:\\'])
        self.assertNotIn('physicalId', ports[0])

    def test_missing_identity_does_not_guess(self):
        rows = enrich_ports([{'address': 'COM5', 'name': 'Unknown'}], [])
        self.assertNotIn('mountpoints', rows[0])

class ContainerTests(unittest.TestCase):
    def test_container_mapping_keeps_disk_and_method(self):
        ports=[{'address':'COM4','name':'E7'}]
        identity=[{'address':'COM4','physicalId':'CONTAINER:UNIQUE','containerId':'UNIQUE','matchMethod':'ContainerId',
                   'mountpoints':['J:\\'],'diskDevices':['disk3']}]
        row=enrich_ports(ports,identity)[0]
        self.assertEqual(row['mountpoints'],['J:\\'])
        self.assertEqual(row['matchMethod'],'ContainerId')
        self.assertEqual(row['containerId'],'UNIQUE')

class WindowsQueryTests(unittest.TestCase):
    def test_only_detected_controller_ports_are_requested(self):
        import json
        import usb_identity
        from types import SimpleNamespace
        from unittest.mock import patch
        data={'ports':[], 'elapsedMs':120}
        with patch.object(usb_identity.sys,'platform','win32'), patch.object(usb_identity.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout=json.dumps(data).encode())) as run:
            self.assertEqual(usb_identity.windows_usb_interfaces(['COM4','COM8']),data)
            self.assertEqual(run.call_args.args[0][-2:],['-PortAddresses','COM4,COM8'])
            self.assertEqual(run.call_args.kwargs['timeout'],25)

    def test_no_ports_skips_slow_windows_enumeration(self):
        import usb_identity
        from unittest.mock import patch
        with patch.object(usb_identity.subprocess,'run') as run:
            self.assertEqual(usb_identity.windows_usb_interfaces([]),[])
            run.assert_not_called()

    def test_timeout_is_reported_with_current_limit(self):
        import usb_identity
        from unittest.mock import patch
        with patch.object(usb_identity.sys,'platform','win32'), patch.object(usb_identity.subprocess,'run',side_effect=usb_identity.subprocess.TimeoutExpired('powershell',25)):
            with self.assertRaisesRegex(RuntimeError,'25 секунд'):
                usb_identity.windows_usb_interfaces(['COM4'])
