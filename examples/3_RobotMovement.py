import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import math


# ---------- Настройки моторов и датчиков ----------
LeftMotor = 1  # устройство подключено на порт Motor 1
RightMotor = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


def sgn(num):
    # Функция возвращает 1, если num положительное, -1, если отрицательное, или оставляет 0
    if(num > 0): return 1
    elif (num < 0): return -1
    else: return 0

def RobotMovement(encoder, speed):
    # В функцию передаются два параметра: желаемый угол поворота энкодера и скорость движения
    motor.SetMotorCode(LeftMotor)
    # Сброс показаний энкодера

    while(abs(motor.GetMotorCode(LeftMotor)) < abs(encoder)):
        # Пока модуль показаний энкодера меньше, чем модуль желаемого угла поворота энкодера, двигайся
        leftSpeed = speed * sgn(encoder)
        rightSpeed = speed * sgn(encoder)
        # Находим скорость моторов как базовую скорость, умноженную на направление движения

        motor.SetMotor(LeftMotor, leftSpeed)
        motor.SetMotor(RightMotor, rightSpeed)
        # Подача скорости на моторы
        rcu.SetWaitForTime(0.001)
        # Небольшая задержка
    motor.SetMotor(LeftMotor, 0)
    motor.SetMotor(RightMotor, 0)
    # Обязательная остановка моторов после цикла

def task1():
    RobotMovement(1000, 50)
    RobotMovement(-500, 100)

task1()
