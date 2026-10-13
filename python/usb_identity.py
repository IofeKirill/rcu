"""Match Windows disk/COM interfaces by their common physical USB ancestor."""
import json
import subprocess
import sys
from pathlib import Path


def windows_usb_interfaces(addresses=None):
    if addresses is not None and not addresses:
        return []
    if sys.platform != 'win32':
        return []
    try:
        result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
                             '-File', str(Path(__file__).with_name('usb_identity.ps1')),
                             '-PortAddresses', ','.join(addresses or [])],
                            capture_output=True, timeout=25, creationflags=0x08000000)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError('Сопоставление USB-интерфейсов заняло больше 25 секунд.') from error
    if result.returncode:
        raise RuntimeError('Windows не предоставила сведения для сопоставления USB-диска и COM-порта: ' + result.stderr.decode('utf-8-sig', errors='replace')[:500])
    data = json.loads(result.stdout.decode('utf-8-sig'))
    if isinstance(data, dict) and isinstance(data.get('ports'), list):
        return data
    if not isinstance(data, list):
        raise ValueError('Некорректный список интерфейсов USB.')
    return data


def enrich_ports(ports, interfaces):
    result = []
    for port in ports:
        row = dict(port)
        match = next((x for x in interfaces if str(x.get('address', '')).upper() == row['address'].upper()), None)
        if match and match.get('physicalId'):
            row.update(physicalId=match['physicalId'], containerId=match.get('containerId'), matchMethod=match.get('matchMethod'), mountpoints=match.get('mountpoints') or [],
                       diskDevices=match.get('diskDevices') or [])
        result.append(row)
    return result
