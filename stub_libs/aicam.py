"""Подсказки для редактора VS Code. Не загружайте этот файл на контроллер."""
"""Е7: BE-1756 AI CAM. Полная справка — docs/AICAM_GUIDE.md."""
from typing import Any

def SetAICamCmd(port: int, mode: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def SetWaitAICamCmd(port: int, mode: str) -> Any:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def GetAICam(port: int, target: int, field: int) -> int:
    """field: 1 ID, 2 X, 3 Y, 4 width, 5 height, 6 size, 7 confidence."""
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def GetAICamStr(port: int, target: int) -> str:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def GetAICamIDData(port: int, target_id: int, field: int) -> int:
    """field: 1 X, 2 Y, 3 width, 4 height, 5 size, 6 confidence."""
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
def GetAICamIDStr(port: int, target_id: int) -> str:
    raise RuntimeError("Это подсказка редактора; выполняйте программу на контроллере.")
