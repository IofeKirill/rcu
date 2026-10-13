"""Подсказки для редактора VS Code. Не загружайте этот файл на контроллер."""
from typing import Any

def SetIOTConfig(port: int, ssid: str, wifi_password: str, iot_id: str, iot_password: str, server: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetIOTTopic(port: int, topic: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetIOTData(port: int, topic: str, value: float) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetIOTDataStr(port: int, topic: str, text: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def GetIOTData(port: int, topic: str, text: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
