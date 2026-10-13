# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "color")
    aicam.SetWaitAICamCmd(AI_CAM, "color")
    # На камере заранее обучите цвет как ID1 и сохраните через Save.
    while True:
        x = aicam.GetAICamIDData(AI_CAM, 1, 1)
        y = aicam.GetAICamIDData(AI_CAM, 1, 2)
        size = aicam.GetAICamIDData(AI_CAM, 1, 5)
        confidence = aicam.GetAICamIDData(AI_CAM, 1, 6)
        print("Color ID1:", x, y, size, confidence)
        rcu.SetWaitForTime(0.2)

task1()
