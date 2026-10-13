# ПИД-регулятор по двум датчикам света.
# До запуска заполните ячейки 1–4; ячейки 5 и 6 — значения нормировки датчиков.
# Значения нормировки должны быть ненулевыми.
import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import sensor  # Библиотека для работы с датчиками.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
LEFT_LIGHT = 5  # устройство подключено на порт Sensor 5
RIGHT_LIGHT = 6  # устройство подключено на порт Sensor 6
# --------------------------------------------------

lastDeviation = 0
# Прошлое отклонение для Д-составляющей.
iReg = 0
# Накопленное значение И-составляющей.

def ReadLight(port):
    return sensor.GetLightSensor(port) / rcu.GetData(port)
    # Нормируем показание датчика значением ячейки с номером его порта.


def LinePIDLight():
    global lastDeviation, iReg
    # Только изменяемое состояние между вызовами требует global.
    speed = rcu.GetData(1)
    # Общая скорость из ячейки 1.
    kP = rcu.GetData(2) / 10
    # Коэффициент П-регулятора: значение ячейки 2 делим на 10.
    kI = rcu.GetData(3) / 1000
    # Коэффициент И-регулятора: значение ячейки 3 делим на 1000.
    kD = rcu.GetData(4)
    # Коэффициент Д-регулятора из ячейки 4 без делителя.

    leftLight = ReadLight(LEFT_LIGHT)
    rightLight = ReadLight(RIGHT_LIGHT)
    rcu.SetDisplayString(1, str(leftLight), 0xFFE0, 0x0000)
    rcu.SetDisplayString(3, str(rightLight), 0xFFE0, 0x0000)
    deviation = leftLight - rightLight
    # Разность нормированных показаний датчиков света.

    pReg = deviation * kP
    # П-составляющая зависит от текущего отклонения.
    iReg = max(-25, min(25, iReg + deviation * kI))
    # Накапливаем И-составляющую и ограничиваем её от -25 до 25.
    dReg = (deviation - lastDeviation) * kD
    # Д-составляющая зависит от изменения отклонения.
    control = pReg + iReg + dReg
    # Итоговое управляющее воздействие ПИД-регулятора.
    lastDeviation = deviation
    # Сохраняем отклонение для следующего вызова.

    leftSpeed = speed + control
    rightSpeed = speed - control
    # Подаём рассчитанные скорости на моторы.
    motor.SetMotor(LEFT_MOTOR, leftSpeed)
    motor.SetMotor(RIGHT_MOTOR, rightSpeed)
    rcu.SetWaitForTime(0.001)
    # Небольшая пауза между расчётами.


def task1():
    sensor.SetLightSensorLed(LEFT_LIGHT, 1)
    sensor.SetLightSensorLed(RIGHT_LIGHT, 1)
    while True:
        LinePIDLight()
task1()
