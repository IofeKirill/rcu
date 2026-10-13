import rcu  # Основная библиотека для управления роботом.
import sensor  # Библиотека для работы с датчиками.

# ---------- Настройки моторов и датчиков ----------
LIGHT_SENSOR = 3  # устройство подключено на порт Sensor 3
# --------------------------------------------------


def task1():
    timeClear = 0
    while True:
        timeClear += 1
        if timeClear == 15:
            rcu.SetLCDClear(0x0000)
            timeClear = 0
        # Очищаем экран каждые 15 итераций, выводим исходное показание.
        lightValue = sensor.GetLightSensor(LIGHT_SENSOR)
        rcu.SetDisplayString(1, str(lightValue), 0xFFE0, 0x0000)
        rcu.SetWaitForTime(0.001)


task1()
