import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


def sgn(num):
    return (num > 0) - (num < 0)


def RobotRotation(encoder):
    # Знак угла задаёт направление, скорость берётся из ячейки 1.
    motor.SetMotorCode(RIGHT_MOTOR)
    while abs(motor.GetMotorCode(RIGHT_MOTOR)) < abs(encoder):
        speed = rcu.GetData(1)
        power = speed * sgn(encoder)
        motor.SetMotor(LEFT_MOTOR, power)
        motor.SetMotor(RIGHT_MOTOR, -power)
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)


def task1():
    RobotRotation(200)
    RobotRotation(-320)


task1()
