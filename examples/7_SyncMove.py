# Автор исходного примера: Байдин Ярослав.
import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


def SyncMove(timeEncoder):
    # Продолжительность в миллисекундах; синхронизация по энкодерам.
    rcu.SetSysTime()
    motor.SetMotorCode(LEFT_MOTOR)
    motor.SetMotorCode(RIGHT_MOTOR)
    while rcu.GetSysTime() < timeEncoder:
        speed = rcu.GetData(1)
        kP = rcu.GetData(2) / 10
        deviation = motor.GetMotorCode(RIGHT_MOTOR) - motor.GetMotorCode(LEFT_MOTOR)
        pReg = deviation * kP
        control = pReg
        motor.SetMotor(LEFT_MOTOR, speed + control)
        motor.SetMotor(RIGHT_MOTOR, speed - control)
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)


def task1():
    SyncMove(1500)


task1()
