import rcu  # Основная библиотека для управления роботом.
import sensor # Библиотека для работы с различными датчиками.

# ---------- Настройки моторов и датчиков ----------
Gyro = 4  # устройство подключено на порт Sensor 1
# --------------------------------------------------

# Параметры фильтра
angle = 0.0              # Переменная для хранения рассчитанного угла поворота
gyroDeviation = 0.0      # Смещение гироскопа (дрейф), определяется при калибровке
lastTime = 0             # Время последнего измерения, используется для расчёта разницы времени (dT)

textColor = 0xFFE0       # Цвет текста для вывода на экран (жёлтый)
bgColor = 0x0000         # Цвет фона для текста на экране (чёрный)

# Функция калибровки гироскопа — определяет среднее смещение при неподвижном роботе
def calibrateGyro(port, samples = 100):
    totalAngle = 0.0
    for i in range(samples):  # Повторяем заданное количество раз (по умолчанию 100)
        totalAngle += sensor.GetAHRS(port, 9, 0)  # Считываем значение гироскопа по оси Z (GyroZ)
        rcu.SetWaitForTime(0.010)  # Ждём 10 мс между измерениями
    return totalAngle / samples  # Возвращаем среднее значение — это и будет смещение

# Функция получения угла поворота
def getAngle(port):
    global angle, lastTime, gyroDeviation

    currentTime = rcu.GetSysTime()  # Получаем текущее время в миллисекундах
    dT = (currentTime - lastTime) / 1000.0  # Вычисляем время между измерениями в секундах
    lastTime = currentTime  # Обновляем время последнего измерения

    gyroZ = sensor.GetAHRS(port, 9, 0)  # Считываем угловую скорость по оси Z (в градусах/сек)
    corrected_gyro = gyroZ - gyroDeviation  # Вычитаем смещение гироскопа
    angle += corrected_gyro * 0.001  # Интегрируем угловую скорость по времени, добавляя к общему углу

    return angle  # Возвращаем рассчитанный угол

# Главная функция
def task1():
    global gyroDeviation, lastTime
    rcu.SetSysTime()  # Обнуляем системное время
    lastTime = rcu.GetSysTime()  # Запоминаем стартовое время
    gyroDeviation = calibrateGyro(Gyro)  # Проводим калибровку гироскопа (измеряем смещение)

    while True:  # Бесконечный цикл
        current_angle = getAngle(Gyro)  # Получаем текущий угол поворота
        text = "Angle = " + str(round(current_angle, 1)) + "     "  # Формируем строку для вывода
        rcu.SetDisplayString(1, text, textColor, bgColor)  # Выводим строку на экран (в строку 1)
        rcu.SetWaitForTime(0.050)  # Делаем паузу 50 мс (примерно 20 обновлений в секунду)

task1()  # Запускаем основную функцию
