# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "face")
    aicam.SetWaitAICamCmd(AI_CAM, "face")
    print("id x y width height size confidence; text")
    while True:
        values = [aicam.GetAICam(AI_CAM, 1, field) for field in range(1, 8)]
        print(values, repr(aicam.GetAICamStr(AI_CAM, 1)))
        rcu.SetWaitForTime(0.2)

task1()
