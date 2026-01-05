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

def RobotRotation(encoder, speed):
    # Функция для поворота робота на заданный угол
    motor.SetMotorCode(RightMotor)
    # Сброс показаний энкодера

    while(abs(motor.GetMotorCode(RightMotor)) < abs(encoder)):
        # Пока модуль показаний энкодера меньше, чем модуль заданного значения, продолжаем поворот
        leftSpeed = speed * sgn(encoder)
        # Скорость левого мотора умножаемая на направление движения
        rightSpeed = -speed * sgn(encoder)
        # Скорость правого мотора, противоположная по направлению левому
        motor.SetMotor(LeftMotor, leftSpeed)
        motor.SetMotor(RightMotor, rightSpeed)
        # Подаём рассчитанные скорости на моторы
        rcu.SetWaitForTime(0.001)
        # Небольшая задержка
    motor.SetMotor(LeftMotor, 0)
    motor.SetMotor(RightMotor, 0)
    # Остановка моторов после завершения поворота

def task1():
    RobotRotation(200, 50)
    RobotRotation(-320, 100)

task1()
