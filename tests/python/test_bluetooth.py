import asyncio
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
        self.rx = SimpleNamespace(uuid=bridge.NOTIFY, properties=['notify', 'write'] if not self.has_ffe3 else ['notify'])
        self.tx = SimpleNamespace(uuid=bridge.WRITE, properties=['write-without-response'], max_write_without_response_size=197) if self.has_ffe3 else self.rx
        if self.tx is self.rx:
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
        if packet[:4] == b'\x86\xAB\x14\xE8':
            reply = bytearray(packet)
            reply[5] = 0x0D
            if packet[4] == 0x81:
                reply[6:12] = b'E7V123' if self.has_ffe3 else b'E6V203'
            self.callback(self.rx, reply[:8])
            self.callback(self.rx, reply[8:])
        elif packet[:4] == b'\x56\xAB' + packet[2:3] + b'\xE1':
            opcode = packet[5]
            self.callback(self.rx, bytes([0x56, 0xAB, 10, 0xE1, 0, opcode, 0, 0, 1, 0xCF]))
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
            self.callback(self.rx, bytes([0x56, 0xAB, 10, 0xE1, 0, 0x1C, 0, 0, 0 if self.reject_data else 1, 0xCF]))


class BackendTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        device = SimpleNamespace(address='AA:BB', name='E7-Test')
        adv = SimpleNamespace(local_name='E7-Test', service_uuids=[bridge.SERVICE])
        Scanner.results = {'AA:BB': (device, adv)}
        Client.instances = []
        Client.has_ffe3 = True
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

    async def test_ffe1_controller_uses_ffe1_without_a1(self):
        Client.has_ffe3 = False
        state = await self.connected()
        self.assertEqual(state['version'], '2.0.3')
        self.assertEqual(Client.instances[-1].writes[0][1][4], 0x81)
        self.assertTrue(all(uuid == bridge.NOTIFY for uuid, _ in Client.instances[-1].writes))
        await self.backend.disconnect()

    async def test_upload_acknowledged_and_same_session_reusable(self):
        await self.connected()
        result = await self.backend.upload('probe.py', 'import rcu\nprint("Bluetooth upload")\n')
        self.assertEqual(result['fileName'], 'probe.py')
        self.assertTrue(self.backend.client.is_connected)
        self.assertTrue(any(event.get('percent') == 100 for event in self.events))
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
