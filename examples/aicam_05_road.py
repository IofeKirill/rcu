# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "road")
    aicam.SetWaitAICamCmd(AI_CAM, "road")
    # На камере настройте одну линию по трём точкам.
    while True:
        upper_x = aicam.GetAICam(AI_CAM, 1, 2)
        lower_x = aicam.GetAICam(AI_CAM, 2, 2)
        print("Line X:", upper_x, lower_x, "difference:", upper_x - lower_x)
        # Моторы пока не включаем: сначала проверьте потерю линии и знак разности.
        rcu.SetWaitForTime(0.2)

task1()
