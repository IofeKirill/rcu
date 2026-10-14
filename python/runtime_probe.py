"""Check the shipped Windows runtime without scanning or connecting hardware."""
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys


def probe():
    import bleak
    import bleak.backends.winrt.client
    import bleak.backends.winrt.scanner
    import serial
    import serial.serialwin32
    from serial.tools import list_ports
    import usb_bridge
    usb_bridge.serial_modules()
    assert bleak.BleakClient and list_ports.comports and serial.Serial
    directory = Path(__file__).resolve().parent
    environment = dict(os.environ, PATH="")
    for key in ("PYTHONHOME", "PYTHONPATH"):
        environment.pop(key, None)
    for name in ("bluetooth_bridge.py", "usb_bridge.py"):
        child = subprocess.run([sys.executable, "-u", str(directory / name)],
            input='{"id":1,"action":"disconnect"}\n', capture_output=True,
            text=True, encoding="utf-8", timeout=20, env=environment)
        messages = [json.loads(line) for line in child.stdout.splitlines() if line]
        if child.returncode or not any(item.get("event") == "ready" for item in messages):
            raise RuntimeError(name + ": " + child.stdout + child.stderr)
        if not any(item.get("id") == 1 and item.get("ok") for item in messages):
            raise RuntimeError(name + ": disconnect RPC failed: " + child.stdout)
    return {"python": sys.version.split()[0], "bleak": importlib.metadata.version("bleak"),
        "pyserial": importlib.metadata.version("pyserial"), "bridges": "ready", "path": sys.executable}


if __name__ == "__main__":
    print(json.dumps(probe(), ensure_ascii=True))
