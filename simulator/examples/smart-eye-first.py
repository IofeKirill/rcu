# Два робота стоят глазами друг к другу не дальше 120 см.
# На каждом установлен «Умный глаз» на S1.
import sensor
import rcu
sensor.SetSmartEyeMode(1, 4, 0x00AAFF)
sensor.SetSmartEyeIRcode(1, 50)
while sensor.GetSmartEyeIRcode(1) != 100:
    rcu.SetWaitForTime(0.02)
print('Ответ принят. Расстояние:', sensor.GetSmartEyeDist(1))
