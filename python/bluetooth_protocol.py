"""Binary frames and REPL reply assembly for the desktop Bluetooth backend."""
import asyncio
import re
from datetime import datetime
from pathlib import Path

SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb'
NOTIFY = '0000ffe1-0000-1000-8000-00805f9b34fb'
WRITE = '0000ffe3-0000-1000-8000-00805f9b34fb'


def command(opcode):
    return bytes([0x86, 0xAB, 0x14, 0xE8, opcode] + [0] * 14 + [0xCF])


def firmware_version(frame):
    match = re.search(rb'(?:E[67]|M6)V([0-9]{3})', frame)
    return '.'.join(chr(value) for value in match[1]) if match else None


def file_header(name, content, stamp=None):
    name_bytes = name.encode('gbk')
    stamp = stamp or datetime.now()
    payload = bytes([0x56, 0xAB, 17 + len(name_bytes), 0xE1, 0, 0x1A])
    payload += len(content).to_bytes(3, 'big')
    payload += stamp.year.to_bytes(2, 'big')
    payload += bytes([stamp.month, stamp.day, stamp.hour, stamp.minute, stamp.second])
    return payload + name_bytes + b'\xCF'


def pages(content):
    for index, offset in enumerate(range(0, len(content), 4096)):
        chunk = content[offset:offset + 4096]
        header = bytes([0x56, 0xAB, 10, 0xE1, 0, 0x1B])
        header += index.to_bytes(2, 'big') + bytes([sum(chunk) % 256, 0xCF])
        yield index, header, chunk


def read_upload(filename, remote_name=None):
    name = remote_name or Path(filename).name
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_.-]{0,39}\.py', name):
        raise RuntimeError('Для этого теста нужно короткое латинское имя .py без пути')
    text = Path(filename).read_text(encoding='utf-8-sig')
    try:
        content = text.encode('ascii')
    except UnicodeEncodeError:
        raise RuntimeError('Первый тест поддерживает только ASCII, без русского текста и комментариев')
    if not 0 < len(content) <= 12 * 1024:
        raise RuntimeError('Для первого теста нужен непустой файл не более 12 KiB')
    return name, content


class Replies:
    def __init__(self):
        self.buffer = bytearray()
        self.pending = None
        self.opcode = None
        self.header = b''
        self.size = 20
        self.predicate = None
        self.marker = None
        self.echo = None

    def expect(self, opcode):
        return self.expect_frame(bytes([0x86, 0xAB, 0x14, 0xE8, opcode]), 20)

    def expect_frame(self, header, size, predicate=None):
        if self.pending is not None and not self.pending.done():
            raise RuntimeError('Предыдущий запрос ещё не завершён')
        self.buffer.clear()
        self.header = header
        self.size = size
        self.predicate = predicate
        self.marker = None
        self.pending = asyncio.get_running_loop().create_future()
        return self.pending

    def expect_text(self, marker, echo=None):
        if self.pending is not None and not self.pending.done():
            raise RuntimeError('Предыдущий запрос ещё не завершён')
        self.buffer.clear()
        self.marker = marker
        self.echo = echo
        self.pending = asyncio.get_running_loop().create_future()
        return self.pending

    def feed(self, data):
        if self.pending is None or self.pending.done():
            return
        self.buffer.extend(data)
        if self.marker is not None:
            echo_at = self.buffer.find(self.echo) if self.echo else 0
            if echo_at < 0:
                return
            start = echo_at + len(self.echo) if self.echo else 0
            if self.buffer.find(self.marker, start) >= 0:
                self.pending.set_result(bytes(self.buffer))
            elif len(self.buffer) > 65536:
                self.pending.set_exception(RuntimeError('Слишком много данных без ожидаемого приглашения REPL'))
            return
        header = self.header
        while True:
            index = self.buffer.find(header)
            if index < 0:
                self.buffer[:] = self.buffer[-(len(header) - 1):]
                return
            if index:
                del self.buffer[:index]
            if len(self.buffer) < self.size:
                return
            frame = bytes(self.buffer[:self.size])
            del self.buffer[:self.size]
            if frame[-1] == 0xCF and (self.predicate is None or self.predicate(frame)):
                self.pending.set_result(frame)
                return
