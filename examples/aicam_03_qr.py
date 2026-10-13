# Е7: ИИ-камера BE-1756. Проверочный пример без движения моторов.
# Результат при отсутствии цели необходимо проверить на вашей прошивке.
import rcu
import aicam

AI_CAM = 7  # устройство подключено на порт Sensor 7

def task1():
    aicam.SetAICamCmd(AI_CAM, "qrcode")
    aicam.SetWaitAICamCmd(AI_CAM, "qrcode")
    # Для проверки создайте QR-код с текстом run.
    while True:
        text = aicam.GetAICamStr(AI_CAM, 1)
        print("QR:", repr(text))
        if text == "run":
            print("Message run read")
        rcu.SetWaitForTime(0.2)

task1()
