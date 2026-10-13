import asyncio
import queue
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'python'))
import usb_bridge as usb
import bluetooth_bridge as core
from bluetooth_protocol import command


class FakeSerial:
    instances=[]
    accept=True
    def __init__(self, **settings):
        self.settings=settings;self.is_open=True;self.queue=queue.Queue();self.writes=[];self.raw=False
        self.instances.append(self)
    def read(self,size):
        try:return self.queue.get(timeout=0.01)
        except queue.Empty:return b''
    def write(self,data):
        data=bytes(data);self.writes.append(data)
        if data[:4]==b'\x86\xab\x14\xe8':
            result=bytearray(data);result[5]=0x0d
            if data[4]==0x80:result[6:18]=b'E7 USB DEBUG' if self.accept else b'OTHER DEVICE'
            if data[4]==0x81:result[6:18]=b'E7V123 MAIN '
            self.queue.put(bytes(result))
        elif data==b'\x01':self.raw=True;self.queue.put(b'raw REPL; CTRL-B to exit\r\n>')
        elif data==b'\x04':self.queue.put(b'OKUSB_PLAY_STARTED\r\n')
        elif data==b'\x02':self.raw=False;self.queue.put(b'\r\n>>> ')
        elif data==b'\x03':self.queue.put(b'\r\n>>> ')
        elif data.startswith(b'import rcu') and data.endswith(b'\r\n'):self.queue.put(data+b'>>> ')
        return len(data)
    def flush(self):pass
    def close(self):self.is_open=False


class USBTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.port=SimpleNamespace(device='COM5',description='STM32 Virtual COM',serial_number='123',vid=0x0483,pid=0x5740)
        other=SimpleNamespace(device='COM7',description='Other',serial_number=None,vid=None,pid=None)
        self.modules=patch.object(usb,'serial_modules',lambda:(SimpleNamespace(Serial=FakeSerial),SimpleNamespace(comports=lambda:[self.port,other])))
        self.modules.start();FakeSerial.instances=[];FakeSerial.accept=True
        self.events=[]
        self.patches=[patch.object(usb,'windows_usb_interfaces',lambda addresses=None:[]),patch.object(usb,'event',lambda event_name,**fields:self.events.append((event_name,fields))),patch.object(core,'event',lambda event_name,**fields:self.events.append((event_name,fields)))]
        # Event functions receive a device name in fields; use a distinct parameter name.
        for p in self.patches:p.start()
        original=asyncio.sleep
        async def quick_sleep(_):await original(0)
        self.sleep=patch.object(asyncio,'sleep',quick_sleep);self.sleep.start()
        self.backend=usb.USBController()
    def tearDown(self):
        self.modules.stop();self.sleep.stop()
        for p in self.patches:p.stop()
    async def test_serial_scan_filters_candidates_and_keeps_identity(self):
        rows=await self.backend.scan();self.assertEqual(len(rows),1);self.assertEqual(rows[0]['address'],'COM5');self.assertEqual(rows[0]['serialNumber'],'123')
    async def test_usb_handshake_and_play_stop_without_ble_pairing_or_ui90(self):
        state=await self.backend.connect('COM5');self.assertEqual(state['version'],'1.2.3')
        serial=FakeSerial.instances[-1];self.assertEqual(serial.settings['baudrate'],115200);self.assertEqual(serial.writes[0][5],0x10)
        await self.backend.play('import rcu\nwhile True:\n    pass\n');self.assertTrue(self.backend.running)
        await self.backend.stop();self.assertFalse(self.backend.running)
        opcodes=[data[4] for data in serial.writes if data[:4]==b'\x86\xab\x14\xe8'];self.assertNotIn(0xa1,opcodes);self.assertNotIn(0x90,opcodes)
        self.assertTrue(serial.is_open);await self.backend.disconnect();self.assertFalse(serial.is_open)
    async def test_wrong_serial_device_fails_and_closes_port(self):
        FakeSerial.accept=False
        with self.assertRaisesRegex(ValueError,'USB-режим'):await self.backend.connect('COM5')
        self.assertFalse(FakeSerial.instances[-1].is_open)
    async def test_unknown_port_is_not_opened(self):
        with self.assertRaisesRegex(ValueError,'больше не доступен'):await self.backend.connect('COM99')
        self.assertFalse(FakeSerial.instances)


if __name__=='__main__':unittest.main()
