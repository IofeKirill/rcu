"""Persistent controller BLE backend. JSON lines on stdin/stdout; no interactive prompts."""
import asyncio
import json
import re
import sys
from bluetooth_protocol import SERVICE, NOTIFY, WRITE, Replies, command, firmware_version, file_header, pages


def emit(message):
    print(json.dumps(message, ensure_ascii=True), flush=True)


def event(event_name, **fields):
    emit({'event': event_name, **fields})


def encode_source(value):
    if not isinstance(value, str) or not value:
        raise ValueError('Откройте непустой Python-файл.')
    try:
        result = value.encode('gbk')
    except UnicodeEncodeError:
        raise ValueError('В коде есть символы, не поддерживаемые кодировкой GBK Робокода. Уберите их для этого теста.')
    if len(result) > 12 * 1024:
        raise ValueError('Bluetooth: пока поддерживается код до 12 KiB. Загрузка больших .mpy будет добавлена отдельно.')
    return result


def validate_filename(name):
    if not isinstance(name, str) or not name.lower().endswith('.py') or re.search(r'[\\/\x00-\x1f]', name):
        raise ValueError('Нужно имя .py без пути и управляющих символов.')
    try:
        encoded = name.encode('gbk')
    except UnicodeEncodeError:
        raise ValueError('Имя файла не поддерживается кодировкой GBK. Используйте другое имя.')
    if len(encoded) > 64 or len(encoded) <= 3:
        raise ValueError('Имя файла должно быть не длиннее 64 байт GBK.')
    return name


class ControllerBLE:
    def __init__(self, scanner, client_class):
        self.scanner = scanner
        self.client_class = client_class
        self.client = None
        self.tx = None
        self.rx = None
        self.response = False
        self.replies = Replies()
        self.address = None
        self.name = None
        self.running = False
        self.raw = False
        self.closing = False
        self.session = 0
        self.scan_results = {}
        self.version = None
        self.prepare_opcodes = (0x90, 0x87)
        self.runtime_tail = bytearray()

    def info(self):
        return {'address': self.address, 'name': self.name, 'version': self.version, 'running': self.running}

    async def scan(self):
        if self.running:
            raise ValueError('Остановите программу перед новым поиском Bluetooth-устройств.')
        found = await self.scanner.discover(timeout=8, return_adv=True)
        self.scan_results = {device.address: (device, adv) for device, adv in found.values()
                             if SERVICE in [value.lower() for value in adv.service_uuids]
                             or re.search(r'e[67]', (adv.local_name or device.name or '').lower())}
        return [{'address': device.address, 'name': adv.local_name or device.name or 'контроллер', 'services': adv.service_uuids}
                for device, adv in self.scan_results.values()]

    def notify(self, _sender, data):
        event('log', message='RX: ' + bytes(data).hex(' '))
        self.replies.feed(data)
        if self.running:
            # Runtime diagnostics only: OK does not imply successful program completion.
            self.runtime_tail.extend(data)
            completed = b'\x04>' in self.runtime_tail
            if b'\x04Traceback (most recent call last)' in self.runtime_tail:
                event('runtimeError', message=bytes(self.runtime_tail).decode('gbk', errors='backslashreplace'))
                self.runtime_tail.clear()
            if len(self.runtime_tail) > 2048:
                del self.runtime_tail[:-512]
            if completed:
                self.running = False
                event('state', **self.info())

    def disconnected(self, client, session):
        if session != self.session or client is not self.client:
            return
        self.running = False
        self.raw = False
        if self.replies.pending is not None and not self.replies.pending.done():
            self.replies.pending.set_exception(ConnectionError('Bluetooth-соединение с контроллером потеряно.'))
        if not self.closing:
            event('disconnected', address=self.address, message='Соединение с контроллером потеряно. Повторно подключитесь вручную.')

    def require_connection(self):
        if self.client is None or not self.client.is_connected:
            raise ConnectionError('Подключитесь к контроллеру в разделе Bluetooth.')

    async def connect(self, address):
        if not isinstance(address, str) or not address:
            raise ValueError('Не указан адрес контроллера.')
        if self.client is not None and self.client.is_connected and address == self.address:
            return self.info()
        await self.disconnect()
        pair = self.scan_results.get(address)
        device = pair[0] if pair else await self.scanner.find_device_by_address(address, timeout=8)
        if device is None:
            raise ValueError('Контроллер не найден. Повторите поиск.')
        self.session += 1
        session = self.session
        client = self.client_class(device, timeout=20,
                                  disconnected_callback=lambda current: self.disconnected(current, session))
        self.client = client
        self.address = address
        self.name = (pair[1].local_name if pair else None) or device.name or 'контроллер'
        self.replies = Replies()
        try:
            await asyncio.wait_for(client.connect(), 25)
            service = client.services.get_service(SERVICE)
            if service is None:
                raise ValueError('У устройства нет сервиса FFE0.')
            self.rx = next((c for c in service.characteristics if c.uuid.lower() == NOTIFY), None)
            dedicated_writer = next((c for c in service.characteristics if c.uuid.lower() == WRITE), None)
            self.tx = dedicated_writer or self.rx
            if self.rx is None or self.tx is None:
                raise ValueError('Не найдены характеристики Bluetooth для записи и уведомлений.')
            if not {'notify', 'indicate'}.intersection(self.rx.properties):
                raise ValueError('FFE1 не поддерживает уведомления.')
            self.response = 'write-without-response' not in self.tx.properties
            if self.response and 'write' not in self.tx.properties:
                raise ValueError('FFE3 не поддерживает запись.')
            await client.start_notify(self.rx, self.notify)
            # RoboCode uses separate FFE3 + A1 approval on E7; E6 writes FFE1.
            if dedicated_writer is not None:
                event('pairing', message='Подтвердите подключение на экране контроллера, если появится запрос.')
                approval = await self.request(0xA1, 20)
                if approval[5] != 0x0D:
                    raise ValueError(f'Контроллер отклонил подключение: 0x{approval[5]:02X}.')
            frame = await self.request(0x81, 6)
            self.version = firmware_version(frame)
            if not self.version:
                raise ValueError('Ответ версии контроллера не распознан; смотрите журнал Bluetooth.')
            event('state', **self.info())
            return self.info()
        except BaseException:
            await self.disconnect(stop=False)
            raise

    async def write(self, data):
        self.require_connection()
        limit = min(197, self.tx.max_write_without_response_size) if not self.response else 197
        for offset in range(0, len(data), limit):
            await asyncio.wait_for(self.client.write_gatt_char(self.tx, data[offset:offset + limit], response=self.response), 6)
            await asyncio.sleep(0.005)

    async def exchange(self, packet, header, size, timeout=5, predicate=None):
        future = self.replies.expect_frame(header, size, predicate)
        event('log', message='TX: ' + (packet.hex(' ') if len(packet) <= 100 else f'{len(packet)} bytes'))
        try:
            await self.write(packet)
            return await asyncio.wait_for(future, timeout)
        finally:
            if not future.done():
                future.cancel()

    async def request(self, opcode, timeout=5):
        return await self.exchange(command(opcode), bytes([0x86, 0xAB, 0x14, 0xE8, opcode]), 20, timeout)

    async def text_request(self, packet, marker, echo=None, timeout=5):
        future = self.replies.expect_text(marker, echo)
        event('log', message='TX REPL: ' + repr(packet))
        try:
            await self.write(packet)
            result = await asyncio.wait_for(future, timeout)
            # A delayed raw-REPL KeyboardInterrupt belongs to the Stop we requested.
            expected_interrupt = packet == b'\x02' and b'KeyboardInterrupt' in result
            if b'Traceback' in result and not expected_interrupt:
                raise ValueError('Ошибка Python на контроллере: ' + repr(result))
            return result
        finally:
            if not future.done():
                future.cancel()

    async def stop(self):
        self.require_connection()
        self.running = False  # KeyboardInterrupt is expected for the stop we requested.
        self.runtime_tail.clear()
        await self.write(b'\x03')
        await asyncio.sleep(0.05)
        await self.write(b'\x03')
        await asyncio.sleep(0.1)
        await self.text_request(b'\x02', b'>>> ')
        self.raw = False
        await self.text_request(b'import rcu; rcu.SetRcuStop()\r\n', b'>>> ', echo=b'rcu.SetRcuStop()')
        event('state', **self.info())
        return self.info()

    async def play(self, source):
        content = encode_source(source)
        self.require_connection()
        if self.running or self.raw:
            await self.stop()
        try:
            for opcode in self.prepare_opcodes:
                await self.request(opcode)
                await asyncio.sleep(0.05)
            await self.write(b'\x03')
            await asyncio.sleep(0.2)
            await self.text_request(b'import rcu\r\n', b'>>> ', echo=b'import rcu')
            await self.write(bytes([0x86, 0xAB, 0x14, 0xEE, 0xEF] + [0] * 14 + [0xCF]))
            await asyncio.sleep(0.05)
            await self.text_request(b'\x01', b'\r\n>', echo=b'raw REPL')
            self.raw = True
            for offset in range(0, len(content), 512):
                await self.write(content[offset:offset + 512])
                await asyncio.sleep(0.02)
            self.runtime_tail.clear()
            self.running = True
            await self.text_request(b'\x04', b'OK')
            event('state', **self.info())
            return {'accepted': True, **self.info()}
        except BaseException:
            try:
                await self.stop()
            except Exception:
                event('log', message='После ошибки Play остановку подтвердить не удалось. Остановите программу на контроллере.')
            raise

    async def upload(self, name, source):
        content = encode_source(source)
        name = validate_filename(name)
        self.require_connection()
        if self.running or self.raw:
            await self.stop()
        else:
            await self.write(b'\x03')
            await asyncio.sleep(0.02)
            await self.write(b'\x03')
            await asyncio.sleep(0.05)
        reply = await self.request(0x80)
        if reply[5] not in (0x0D, 0x01):
            raise ValueError('Контроллер не подтвердил режим загрузки.')
        try:
            ack = await self.exchange(file_header(name, content), b'\x56\xAB\x0A\xE1', 10)
            if ack[5] != 0x1A or ack[8] != 1:
                raise ValueError('Контроллер не подтвердил заголовок файла.')
            for index, header, chunk in pages(content):
                for opcode, packet in ((0x1B, header), (0x1C, chunk)):
                    ack = await self.exchange(packet, b'\x56\xAB\x0A\xE1', 10,
                        predicate=lambda frame, op=opcode, page=index: frame[5] == op and int.from_bytes(frame[6:8], 'big') == page)
                    if ack[8] != 1:
                        raise ValueError(f'Контроллер не принял страницу {index + 1}: статус {ack[8]:02X}.')
                event('progress', percent=round(min((index + 1) * 4096, len(content)) * 100 / len(content)))
            reply = await self.request(0x87)
            if reply[5] != 0x0D:
                raise ValueError('Файл передан, но Контроллер не подтвердил восстановление Python.')
            return {'fileName': name, 'bytes': len(content)}
        except BaseException:
            try:
                await self.request(0x87)
            except Exception:
                event('log', message='После ошибки загрузки режим Python не восстановлен.')
            raise

    async def disconnect(self, stop=True):
        client = self.client
        if client is not None:
            if stop and client.is_connected and (self.running or self.raw):
                await self.stop()
            self.closing = True
            try:
                await asyncio.wait_for(client.disconnect(), 6)
            finally:
                self.closing = False
                self.client = None
                self.address = self.name = self.version = None
                self.running = self.raw = False
                event('state', **self.info())
        return self.info()


async def main():
    try:
        from bleak import BleakScanner, BleakClient
    except ImportError:
        event('fatal', message='Не установлен bleak. Выполните команду «Установить Bluetooth-зависимость» в VS Code.')
        return
    backend = ControllerBLE(BleakScanner, BleakClient)
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
                elif action == 'upload':
                    result = await backend.upload(request.get('name'), request.get('source'))
                elif action == 'play':
                    result = await backend.play(request.get('source'))
                elif action == 'stop':
                    result = await backend.stop()
                elif action == 'disconnect':
                    result = await backend.disconnect()
                else:
                    raise ValueError('Неизвестная Bluetooth-команда.')
                emit({'id': request.get('id'), 'ok': True, 'result': result})
            except Exception as error:
                emit({'id': request.get('id') if isinstance(request, dict) else None, 'ok': False,
                      'error': str(error) or type(error).__name__})
    finally:
        try:
            await backend.disconnect()
        except Exception as error:
            event('log', message='При завершении Bluetooth: ' + str(error))


if __name__ == '__main__':
    asyncio.run(main())
