# ПИД-регулятор по старой камере с библиотекой ai.
# Ячейки: 1 — скорость, 2 — kP × 10, 3 — kI × 1000, 4 — kD.
import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import ai  # Библиотека для работы со старой камерой.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------

lastDeviation = 0
# Прошлое отклонение для Д-составляющей.
iReg = 0
# Накопленное значение И-составляющей.

def LinePIDCamera():
    global lastDeviation, iReg
    speed = rcu.GetData(1)
    # Общая скорость из ячейки 1.
    kP = rcu.GetData(2) / 10
    # Коэффициент П-регулятора: значение ячейки 2 делим на 10.
    kI = rcu.GetData(3) / 1000
    # Коэффициент И-регулятора: значение ячейки 3 делим на 1000.
    kD = rcu.GetData(4)
    # Коэффициент Д-регулятора из ячейки 4 без делителя.

    deviation = ai.GetAICamData(1) - 120
    # Отклонение линии от середины кадра старой камеры.

    pReg = deviation * kP
    # П-составляющая зависит от текущего отклонения.
    iReg = max(-20, min(20, iReg + deviation * kI))
    # Накапливаем И-составляющую и ограничиваем её от -20 до 20.
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
    ai.SetAICamLED(1)
    # Включить подсветку камеры.
    ai.SetAICamData(5, 0)
    # Переключить старую камеру в режим линии.
    ai.SetWaitForAICamData(5, 0)
    # Дождаться переключения камеры.
    rcu.SetWaitForTime(1)
    while True:
        LinePIDCamera()
task1()
