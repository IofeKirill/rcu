import rcu  # Основная библиотека для управления роботом.
import sensor  # Библиотека для работы с датчиками.

# ---------- Настройки моторов и датчиков ----------
LIGHT_SENSOR = 1  # устройство подключено на порт Sensor 1
# --------------------------------------------------


def task1():
    # Дописываем десять показаний датчика в файл на контроллере.
    with open("data.txt", "a") as dataFile:
        for _ in range(10):
            rcu.SetWaitForTime(0.1)
            lightValue = sensor.GetLightSensor(LIGHT_SENSOR)
            dataFile.write(str(lightValue) + "\n")


task1()
