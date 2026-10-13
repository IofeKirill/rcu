# Е7: простой ПД-регулятор по ИИ-камере BE-1756, режим road.
# Сначала настройте линию по трём точкам на экране камеры.
# Ячейки: 1 — скорость, 2 — kP × 10, 4 — kD; ячейка 3 здесь не используется.
import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import aicam  # Библиотека для работы с ИИ-камерой.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 2  # устройство подключено на порт Motor 2
RIGHT_MOTOR = 4  # устройство подключено на порт Motor 4
AI_CAM = 8  # устройство подключено на порт Sensor 8
# --------------------------------------------------

lastDeviation = 0
# Прошлое отклонение для Д-регулятора.


def LinePDCamera():
    global lastDeviation
    # В global только значение, которое сохраняется между вызовами.
    speed = rcu.GetData(1)
    # Общая скорость из ячейки 1.
    kP = rcu.GetData(2) / 10
    # Коэффициент П-регулятора из ячейки 2 с делителем 10.
    kD = rcu.GetData(4)
    # Коэффициент Д-регулятора из ячейки 4 без делителя.

    deviation = (aicam.GetAICam(AI_CAM, 2, 2) - 320) / 6.4
    # Отклонение нижней точки от середины кадра, нормированное делением на 6.4.
    pReg = deviation * kP
    # П-регулятор реагирует на текущее отклонение.
    dReg = (deviation - lastDeviation) * kD
    # Д-регулятор реагирует на изменение отклонения.
    control = pReg + dReg
    # Итоговое управляющее воздействие ПД-регулятора.
    lastDeviation = deviation
    # Сохраняем отклонение для следующего расчёта.

    leftSpeed = speed + control
    rightSpeed = speed - control
    # Подаём рассчитанные скорости на моторы.
    motor.SetMotor(LEFT_MOTOR, -leftSpeed)
    motor.SetMotor(RIGHT_MOTOR, rightSpeed)
    rcu.SetWaitForTime(0.001)
    # Небольшая пауза между расчётами.


def task1():
    aicam.SetAICamCmd(AI_CAM, "road")
    aicam.SetWaitAICamCmd(AI_CAM, "road")
    # Переключить камеру в режим линии и дождаться переключения.
    while True:
        LinePDCamera()
task1()
