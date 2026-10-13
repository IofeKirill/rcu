"""Подсказки для редактора VS Code. Не загружайте этот файл на контроллер."""
from typing import Any

def SetPump(port: int, state: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetElectromagnet(port: int, value: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
