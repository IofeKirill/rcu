# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "human")
    aicam.SetWaitAICamCmd(AI_CAM, "human")
    while True:
        left_x = aicam.GetAICamIDData(AI_CAM, 10, 1)
        left_y = aicam.GetAICamIDData(AI_CAM, 10, 2)
        right_x = aicam.GetAICamIDData(AI_CAM, 11, 1)
        right_y = aicam.GetAICamIDData(AI_CAM, 11, 2)
        print("Left wrist:", left_x, left_y, "Right wrist:", right_x, right_y)
        rcu.SetWaitForTime(0.2)

task1()
