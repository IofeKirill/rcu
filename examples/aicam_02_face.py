# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "face")
    aicam.SetWaitAICamCmd(AI_CAM, "face")
    # На камере заранее обучите лицо как ID1 и сохраните через Save.
    while True:
        target_id = aicam.GetAICam(AI_CAM, 1, 1)
        print("First target ID:", target_id)
        if target_id == 1:
            print("ID1 read")
        # Проверьте, исчезает ли ID1 после удаления лица из кадра.
        rcu.SetWaitForTime(0.2)

task1()
