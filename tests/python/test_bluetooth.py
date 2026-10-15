import asyncio
import base64
import contextlib
import io
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'python'))
import bluetooth_bridge as bridge
import bluetooth_protocol as protocol


class Scanner:
    results = {}
    @classmethod
    async def discover(cls, **kwargs):
        return cls.results
    @classmethod
    async def find_device_by_address(cls, address, **kwargs):
        return next((device for device, _ in cls.results.values() if device.address == address), None)


class Client:
    has_ffe3 = True
    rx_writable = False
    version_bytes = None
    silent_writers = set()
    approval_status = 0x0D
    silent_opcodes = set()
    instances = []
    reject_data = False
    fail_stop = False
    delayed_interrupt = False
    def __init__(self, device, disconnected_callback, **kwargs):
        self.device = device
        self.callback_disconnected = disconnected_callback
        self.is_connected = False
        self.writes = []
        self.raw = False
        self.current_page = 0
        self.rx = SimpleNamespace(uuid=bridge.NOTIFY, properties=['notify', 'write', 'write-without-response'] if not self.has_ffe3 or self.rx_writable else ['notify'])
        self.tx = SimpleNamespace(uuid=bridge.WRITE, properties=['write-without-response'], max_write_without_response_size=197) if self.has_ffe3 else self.rx
        if 'write-without-response' in self.rx.properties:
            self.rx.max_write_without_response_size = 197
        self.services = SimpleNamespace(get_service=lambda uuid: SimpleNamespace(characteristics=[self.rx, self.tx]) if uuid == bridge.SERVICE else None)
        self.instances.append(self)
    async def connect(self):
        self.is_connected = True
    async def disconnect(self):
        self.is_connected = False
        self.callback_disconnected(self)
    async def start_notify(self, char, callback):
        self.callback = callback
    async def write_gatt_char(self, char, packet, **kwargs):
        packet = bytes(packet)
        self.writes.append((char.uuid, packet))
        if char.uuid in self.silent_writers:
            return
        if packet[:4] == b'\x86\xAB\x14\xE8':
            if packet[4] in self.silent_opcodes:
                return
            reply = bytearray(packet)
            reply[5] = 0x0D
            if packet[4] == 0xA1:
                reply[5] = self.approval_status
            if packet[4] == 0x81:
                reply[6:12] = self.version_bytes or (b'E6V203' if self.device.name.startswith('E6') or not self.has_ffe3 else b'E7V123')
            self.callback(self.rx, reply[:8])
            self.callback(self.rx, reply[8:])
        elif packet[:4] == b'\x56\xAB' + packet[2:3] + b'\xE1':
            opcode = packet[5]
            if opcode == 0x1B: self.current_page = int.from_bytes(packet[6:8], 'big')
            page = self.current_page if opcode == 0x1B else 0
            self.callback(self.rx, bytes([0x56, 0xAB, 10, 0xE1, 0, opcode, page >> 8, page & 255, 1, 0xCF]))
        elif packet == b'\x01':
            self.raw = True
            self.callback(self.rx, b'raw REPL; CTRL-B to exit\r\n>')
        elif packet == b'\x04':
            self.callback(self.rx, b'OKRUNNING\r\n')
        elif packet == b'\x02':
            self.raw = False
            interrupted = b'\x04Traceback (most recent call last):\r\nKeyboardInterrupt: \r\n\x04>' if self.delayed_interrupt else b''
            self.callback(self.rx, interrupted + b'\r\n>>> ')
        elif packet == b'\x03':
            self.callback(self.rx, b'\r\n>>> ')
        elif packet.startswith(b'import rcu') and packet.endswith(b'\r\n'):
            suffix = b'Traceback: failure\r\n>>> ' if self.fail_stop and b'SetRcuStop' in packet else b'>>> '
            self.callback(self.rx, packet + suffix)
        elif not self.raw and len(packet) > 20:
            self.callback(self.rx, bytes([0x56, 0xAB, 10, 0xE1, 0, 0x1C, self.current_page >> 8, self.current_page & 255, 0 if self.reject_data else 1, 0xCF]))


class BackendTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        device = SimpleNamespace(address='AA:BB', name='E7-Test')
        adv = SimpleNamespace(local_name='E7-Test', service_uuids=[bridge.SERVICE])
        Scanner.results = {'AA:BB': (device, adv)}
        Client.instances = []
        Client.has_ffe3 = True
        Client.rx_writable = False
        Client.version_bytes = None
        Client.silent_writers = set()
        Client.approval_status = 0x0D
        Client.silent_opcodes = set()
        Client.reject_data = Client.fail_stop = Client.delayed_interrupt = False
        self.events = []
        self.real_event = bridge.event
        self.event_patch = patch.object(bridge, 'event', lambda event_name, **fields: self.events.append({'event': event_name, **fields}))
        self.event_patch.start()
        original = asyncio.sleep
        async def fast_sleep(_seconds):
            await original(0)
        self.sleep_patch = patch.object(asyncio, 'sleep', fast_sleep)
        self.sleep_patch.start()
        self.backend = bridge.ControllerBLE(Scanner, Client)
    def tearDown(self):
        self.event_patch.stop()
        self.sleep_patch.stop()
    async def connected(self):
        await self.backend.scan()
        return await self.backend.connect('AA:BB')

    async def test_ffe3_controller_requires_a1_and_stays_connected_for_play_stop(self):
        state = await self.connected()
        self.assertEqual(state['version'], '1.2.3')
        client = Client.instances[-1]
        self.assertEqual(client.writes[0][1][4], 0xA1)
        await self.backend.play('import rcu\nwhile True:\n    rcu.SetWaitForTime(1)\n')
        self.assertTrue(self.backend.running)
        self.assertTrue(client.is_connected)
        await self.backend.stop()
        self.assertFalse(self.backend.running)
        self.assertTrue(client.is_connected)
        self.assertEqual(client.writes[-1][1], b'import rcu; rcu.SetRcuStop()\r\n')
        await self.backend.disconnect()
        self.assertFalse(client.is_connected)

    async def test_e6_202_play_continues_after_silent_90_and_can_stop(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'E6-RCU'
        Client.version_bytes = b'E6V202'
        await self.connected()
        Client.silent_opcodes = {0x90}
        request = self.backend.request
        async def quick_request(opcode, timeout=5):
            return await request(opcode, 0.02)
        self.backend.request = quick_request
        result = await self.backend.play('print("PLAY E6 202")\n')
        self.assertTrue(result['accepted'])
        packets = [p for _, p in self.backend.client.writes]
        opcodes = [p[4] for p in packets if p[:4] == b'\x86\xab\x14\xe8']
        self.assertEqual(opcodes[-2:], [0x90, 0x87])
        self.assertIn(b'\x04', packets)
        self.assertTrue(any('90 нет ответа' in e.get('message', '') for e in self.events))
        await self.backend.stop()
        self.assertFalse(self.backend.running)
        self.assertTrue(self.backend.client.is_connected)
        await self.backend.disconnect()

    async def test_missing_87_reply_does_not_send_or_execute_program(self):
        await self.connected()
        Client.silent_opcodes = {0x87}
        request = self.backend.request
        async def quick_request(opcode, timeout=5):
            return await request(opcode, 0.02)
        self.backend.request = quick_request
        with self.assertRaisesRegex(TimeoutError, 'команда 87'):
            await self.backend.play('print("MUST NOT RUN")\n')
        packets = [p for _, p in self.backend.client.writes]
        self.assertNotIn(b'\x04', packets)
        self.assertFalse(any(b'MUST NOT RUN' in p for p in packets))
        self.assertFalse(self.backend.running)
        await self.backend.disconnect()

    async def test_ffe1_controller_uses_ffe1_without_a1(self):
        Client.has_ffe3 = False
        state = await self.connected()
        self.assertEqual(state['version'], '2.0.3')
        self.assertEqual(Client.instances[-1].writes[0][1][4], 0x81)
        self.assertTrue(all(uuid == bridge.NOTIFY for uuid, _ in Client.instances[-1].writes))
        await self.backend.disconnect()

    async def test_e6_with_ffe3_connects_without_screen_approval(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'E6-RCU-0041'
        state = await self.connected()
        client = Client.instances[-1]
        self.assertEqual(state['version'], '2.0.3')
        self.assertTrue(client.is_connected)
        self.assertEqual(client.writes[0][1][4], 0x81)
        self.assertTrue(all(packet[4] != 0xA1 for _, packet in client.writes))
        self.assertEqual(client.writes[0][0], bridge.WRITE)
        self.assertFalse(any(e['event'] == 'pairing' for e in self.events))
        await self.backend.play('import rcu\nprint("E6")\n')
        await self.backend.stop()
        self.assertTrue(client.is_connected)
        await self.backend.disconnect()

    async def test_generic_named_e6_with_writable_ffe1_is_identified_by_firmware(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'ZMROBO'
        Client.rx_writable = True
        Client.version_bytes = b'E6V203'
        state = await self.connected()
        self.assertEqual(state['version'], '2.0.3')
        self.assertIn('E6-RCU', state['name'])
        self.assertFalse(any(e['event'] == 'pairing' for e in self.events))
        self.assertEqual([packet[4] for _, packet in self.backend.client.writes], [0x81])
        await self.backend.play('print("E6 generic")\n')
        await self.backend.stop()
        self.assertTrue(self.backend.client.is_connected)
        await self.backend.disconnect()

    async def test_generic_advertisement_does_not_hide_the_system_e6_name(self):
        device, adv = Scanner.results['AA:BB']
        device.name = 'E6-RCU-0041'
        adv.local_name = 'Bluetooth Device'
        state = await self.connected()
        self.assertEqual(state['version'], '2.0.3')
        self.assertFalse(any(e['event'] == 'pairing' for e in self.events))
        await self.backend.disconnect()

    async def test_generic_e6_uses_ffe1_when_ffe3_does_not_reply(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'Bluetooth Device'
        Client.rx_writable = True
        Client.version_bytes = b'E6V203'
        Client.silent_writers = {bridge.WRITE}
        request = self.backend.request
        async def quick_request(opcode, timeout=5):
            return await request(opcode, 0.02)
        self.backend.request = quick_request
        await self.connected()
        self.assertEqual(self.backend.tx.uuid, bridge.NOTIFY)
        self.assertEqual([uuid for uuid, _ in self.backend.client.writes], [bridge.WRITE, bridge.NOTIFY])
        self.assertFalse(any(e['event'] == 'pairing' for e in self.events))
        await self.backend.play('print("E6 FFE1")\n')
        await self.backend.stop()
        self.assertTrue(self.backend.client.is_connected)
        await self.backend.disconnect()

    async def test_known_e7_with_writable_ffe1_still_requires_a1_first(self):
        Client.rx_writable = True
        await self.connected()
        self.assertEqual(self.backend.client.writes[0][1][4], 0xA1)
        await self.backend.disconnect()

    async def test_generic_device_identified_as_e7_cannot_skip_rejected_approval(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'Bluetooth Device'
        Client.rx_writable = True
        Client.approval_status = 0x0A
        with self.assertRaisesRegex(ValueError, 'отклонил'):
            await self.connected()
        self.assertEqual([packet[4] for _, packet in Client.instances[-1].writes], [0x81, 0xA1])
        self.assertFalse(Client.instances[-1].is_connected)

    async def test_missing_firmware_replies_never_reports_a_successful_connection(self):
        device, adv = Scanner.results['AA:BB']
        device.name = adv.local_name = 'Bluetooth Device'
        Client.rx_writable = True
        Client.silent_writers = {bridge.WRITE, bridge.NOTIFY}
        request = self.backend.request
        async def quick_request(opcode, timeout=5):
            return await request(opcode, 0.02)
        self.backend.request = quick_request
        with self.assertRaisesRegex(ConnectionError, 'FFE3 и FFE1'):
            await self.connected()
        self.assertFalse(Client.instances[-1].is_connected)
        self.assertFalse(any(e['event'] == 'state' and e.get('address') for e in self.events))

    async def test_upload_acknowledged_and_same_session_reusable(self):
        await self.connected()
        result = await self.backend.upload('probe.py', 'import rcu\nprint("Bluetooth upload")\n')
        self.assertEqual(result['fileName'], 'probe.py')
        self.assertTrue(self.backend.client.is_connected)
        self.assertTrue(any(event.get('percent') == 100 for event in self.events))
        await self.backend.disconnect()

    async def test_binary_upload_preserves_arbitrary_bytes_and_uses_same_file_protocol(self):
        await self.connected()
        self.backend.name = 'E6-Test'
        content = bytes(range(256)) * 40
        result = await self.backend.upload_binary('c_test.bin', base64.b64encode(content).decode())
        self.assertEqual(result['fileName'], 'c_test.bin')
        self.assertEqual(result['bytes'], len(content))
        packets = [packet for _, packet in Client.instances[-1].writes]
        self.assertTrue(any(b'c_test.bin' in packet for packet in packets))
        self.assertTrue(any(b'\x00\x01\x02\x03' in packet for packet in packets))
        await self.backend.disconnect()

    async def test_binary_upload_rejects_e7_wrong_names_and_invalid_encoding(self):
        await self.connected()
        with self.assertRaisesRegex(ValueError, 'E6'):
            await self.backend.upload_binary('test.bin', 'AA==')
        self.backend.name = 'E6-Test'
        for name, content in [('test.py', 'AA=='), ('../test.bin', 'AA=='), ('test.bin', '%%%'), ('test.bin', '')]:
            with self.assertRaises(ValueError):
                await self.backend.upload_binary(name, content)
        await self.backend.disconnect()

    async def test_bad_data_ack_fails_and_recovers_python(self):
        await self.connected()
        Client.reject_data = True
        with self.assertRaisesRegex(ValueError, 'страницу'):
            await self.backend.upload('probe.py', 'import rcu\nprint("Bluetooth upload")\n')
        self.assertEqual(Client.instances[-1].writes[-1][1][4], 0x87)
        await self.backend.disconnect()

    async def test_delayed_keyboard_interrupt_is_expected_on_stop(self):
        await self.connected()
        Client.delayed_interrupt = True
        await self.backend.stop()
        self.assertFalse(self.backend.running)
        await self.backend.disconnect()

    async def test_stop_error_is_not_reported_as_success(self):
        await self.connected()
        Client.fail_stop = True
        with self.assertRaisesRegex(ValueError, 'Ошибка Python'):
            await self.backend.stop()
        Client.fail_stop = False
        await self.backend.disconnect()

    async def test_disconnect_cancels_waiting_reply(self):
        await self.connected()
        future = self.backend.replies.expect(0x87)
        client = self.backend.client
        client.is_connected = False
        self.backend.disconnected(client, self.backend.session)
        with self.assertRaises(ConnectionError):
            await future
        self.assertFalse(self.backend.running)
        self.assertTrue(any(event['event'] == 'disconnected' for event in self.events))
        await self.backend.disconnect()

    async def test_finished_program_clears_running_and_error_is_separate_event(self):
        await self.connected()
        self.backend.running = True
        self.backend.notify(None, b'OKdone\r\n\x04\x04>')
        self.assertFalse(self.backend.running)
        self.backend.running = True
        self.backend.notify(None, b'\x04Traceback (most recent call last):\r\nValueError\r\n\x04>')
        self.assertFalse(self.backend.running)
        self.assertTrue(any(event['event'] == 'runtimeError' for event in self.events))
        await self.backend.disconnect()

    def test_encoding_and_limits(self):
        source = '# Русский комментарий\nprint(1)\n'
        self.assertEqual(bridge.encode_source(source).decode('gbk'), source)
        for source in ['', 'a' * 12289, 'print("😀")']:
            with self.assertRaises(ValueError):
                bridge.encode_source(source)
        for name in ['../program.py', 'program.txt', 'a' * 65 + '.py']:
            with self.assertRaises(ValueError):
                bridge.validate_filename(name)

    def test_state_event_serializes_device_name_without_parameter_collision(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.real_event('state', **self.backend.info())
        message = json.loads(output.getvalue())
        self.assertEqual(message['event'], 'state')
        self.assertIn('name', message)

    async def test_scan_does_not_disturb_running_program(self):
        self.backend.running = True
        with self.assertRaises(ValueError):
            await self.backend.scan()

    async def test_disconnecting_owned_program_sends_stop_before_gatt_disconnect(self):
        await self.connected()
        await self.backend.play('import rcu\nwhile True:\n    pass\n')
        client = self.backend.client
        await self.backend.disconnect()
        self.assertFalse(client.is_connected)
        self.assertEqual(client.writes[-1][1], b'import rcu; rcu.SetRcuStop()\r\n')


if __name__ == '__main__':
    unittest.main()
