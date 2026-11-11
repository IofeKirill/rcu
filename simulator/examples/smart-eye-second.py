import sensor
import rcu
sensor.SetSmartEyeAllLed(1, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00,
                        0xFF00FF, 0x00FFFF, 0xFFFFFF, 0xFF8800)
while sensor.GetSmartEyeIRcode(1) != 50:
    rcu.SetWaitForTime(0.02)
sensor.SetSmartEyeIRcode(1, 100)
# Дать второму роботу время прочитать ответ до завершения программы.
rcu.SetWaitForTime(1)
