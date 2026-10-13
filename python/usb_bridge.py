"""Persistent USB serial debug transport. File uploads remain on the USB disk."""
import asyncio
import json
import sys
from types import SimpleNamespace
from bluetooth_bridge import ControllerBLE, emit, event
from bluetooth_protocol import Replies, command, firmware_version
from usb_identity import windows_usb_interfaces, enrich_ports


def serial_modules():
    try:
        import serial
        from serial.tools import list_ports
        return serial, list_ports
    except ImportError:
        raise ValueError('Для USB-отладки установите pyserial: команда «Установить USB-зависимость» или py -m pip install pyserial.')


class USBController(ControllerBLE):
    def __init__(self):
        super().__init__(None, None)
        self.serial = None
        self.reader = None
        self.prepare_opcodes = ()  # USB uses SwitchPython 80/10, not Bluetooth-only UI 90.

    async def scan(self):
        _, ports = serial_modules()
        known = {(0x1A86, 0x7523), (0x0483, 0x5740), (0xF055, 0x9800), (0xF055, 0x5740), (0x303A, 0x4012)}
        found = await asyncio.to_thread(ports.comports)
        rows = [{'address': p.device, 'name': p.description or 'USB COM', 'serialNumber': p.serial_number,
                 'vid': p.vid, 'pid': p.pid, 'location': getattr(p, 'location', None), 'present': True}
                for p in found if (p.vid, p.pid) in known or 'zmrobo' in (p.description or '').lower() or 'joinmax' in (p.description or '').lower()]
        try:
            identity = await asyncio.to_thread(windows_usb_interfaces, [row['address'] for row in rows])
            if isinstance(identity, dict):
                event('log', message='Диагностика USB-сопоставления: ' + json.dumps(identity, ensure_ascii=False))
                identity = identity['ports']
            enriched = enrich_ports(rows, identity)
            for item in enriched:
                event('log', message='USB ' + item['address'] + ': disk=' + str(item.get('mountpoints', [])) + ', method=' + str(item.get('matchMethod', 'нет сопоставления')))
            return enriched
        except (OSError, RuntimeError, ValueError, TimeoutError) as error:
            event('log', message='Сопоставление USB-интерфейсов недоступно: ' + str(error))
            return rows

    async def connect(self, address):
        if not isinstance(address, str) or not address:
            raise ValueError('Выберите COM-порт контроллера.')
        if self.serial is not None and self.serial.is_open and self.client is not None and self.client.is_connected and address == self.address:
            return self.info()
        await self.disconnect()
        serial, ports = serial_modules()
        available = await asyncio.to_thread(ports.comports)
        found = next((p for p in available if p.device == address), None)
        if found is None:
            raise ValueError('COM-порт больше не доступен. Повторите поиск по USB.')
        self.serial = await asyncio.to_thread(serial.Serial, port=address, baudrate=115200, timeout=0.1, write_timeout=2)
        self.address = address
        self.name = found.description or 'USB COM'
        self.replies = Replies()
        self.client = SimpleNamespace(is_connected=True)
        self.reader = asyncio.create_task(self.read_loop())
        try:
            await self.switch_python()
            frame = await self.request(0x81, 6)
            self.version = firmware_version(frame)
            if not self.version:
                raise ValueError('COM-порт открыт, но ответ контроллера не распознан. Проверьте выбранный порт.')
            for model in ('E6', 'E7', 'M6'):
                if model.encode() in frame[6:18]:
                    self.name = model + '-RCU'
                    break
            event('state', **self.info())
            return self.info()
        except BaseException:
            await self.disconnect(stop=False)
            raise

    async def switch_python(self):
        packet = bytearray(command(0x80))
        packet[5] = 0x10
        reply = await self.exchange(bytes(packet), b'\x86\xAB\x14\xE8\x80', 20)
        if not any(model in reply[6:18] for model in (b'E6', b'E7', b'M6')) or b'USB' not in reply[6:18]:
            raise ValueError('Выбранный COM-порт не подтвердил USB-режим контроллера.')

    async def play(self, source):
        self.require_connection()
        if self.running or self.raw:
            await self.stop()
        await self.switch_python()
        return await super().play(source)

    async def write(self, data):
        self.require_connection()
        if self.serial is None or not self.serial.is_open:
            raise ConnectionError('USB COM-порт отключён.')
        written = await asyncio.to_thread(self.serial.write, data)
        if written != len(data):
            raise IOError('COM-порт принял не все байты команды.')
        await asyncio.to_thread(self.serial.flush)

    async def read_loop(self):
        try:
            while self.serial is not None and self.serial.is_open:
                data = await asyncio.to_thread(self.serial.read, 256)
                if data:
                    self.notify(None, data)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if self.client is not None:
                self.client.is_connected = False
            self.running = False
            if self.replies.pending is not None and not self.replies.pending.done():
                self.replies.pending.set_exception(ConnectionError('COM-порт отключён: ' + str(error)))
            if not self.closing:
                event('disconnected', address=self.address, message='USB-отладка отключена: ' + str(error))

    async def disconnect(self, stop=True):
        if self.serial is not None:
            if stop and self.client is not None and self.client.is_connected and (self.running or self.raw):
                await self.stop()
            self.closing = True
            try:
                await asyncio.to_thread(self.serial.close)
                if self.reader is not None:
                    self.reader.cancel()
                    await asyncio.gather(self.reader, return_exceptions=True)
            finally:
                self.serial = self.reader = self.client = None
                self.address = self.name = self.version = None
                self.running = self.raw = False
                self.closing = False
                event('state', **self.info())
        return self.info()


async def main():
    backend = USBController()
    event('ready')
    try:
        while True:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                break
            request = {}
            try:
                request = json.loads(line)
                action = request.get('action')
                if action == 'scan':
                    result = await backend.scan()
                elif action == 'connect':
                    result = await backend.connect(request.get('address'))
                elif action == 'play':
                    result = await backend.play(request.get('source'))
                elif action == 'stop':
                    result = await backend.stop()
                elif action == 'disconnect':
                    result = await backend.disconnect()
                else:
                    raise ValueError('Неизвестная команда USB-отладки.')
                emit({'id': request.get('id'), 'ok': True, 'result': result})
            except Exception as error:
                emit({'id': request.get('id') if isinstance(request, dict) else None, 'ok': False, 'error': str(error) or type(error).__name__})
    finally:
        try:
            await backend.disconnect()
        except Exception as error:
            event('log', message='При завершении USB-отладки: ' + str(error))


if __name__ == '__main__':
    asyncio.run(main())
