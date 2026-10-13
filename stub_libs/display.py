"""Подсказки для редактора VS Code. Не загружайте этот файл на контроллер."""
from typing import Any

def SetDisplayLatticePic(port: int, picture: str, brightness: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetDisplayLattice(port: int, text: str, brightness: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetDisplayLatticeXY(port: int, x: int, y: int, state: int, brightness: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetDisplayLatticeString(port: int, text: str, direction: int, speed: int, brightness: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetDisplayLatticeClear(port: int) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
