import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import sensor # Библиотека для работы с различными датчиками.
import ai # Библиотека для работы с камерой.
import os # Библиотека для работы с файлами

# ---------- Настройки моторов и датчиков ----------
Motor1 = 1  # устройство подключено на порт Motor 1
Motor2 = 4  # устройство подключено на порт Motor 4
Lamp = 6
# --------------------------------------------------

speed = 70

def sgn(num):
    # Функция возвращает 1, если num положительное, -1, если отрицательное, или оставляет 0
    if(num > 0): return 1
    elif (num < 0): return -1
    else: return 0

def Blink(color, interval1, interval2):
    sensor.Set3CLed(Lamp, color)
    rcu.SetWaitForTime(interval1)
    sensor.Set3CLed(Lamp, 0)
    rcu.SetWaitForTime(interval2)


def ConvMove(moveSpeed, enc):
    motor.SetMotorCode(Motor1)
    motor.SetMotorCode(Motor2)
    while abs(motor.GetMotorCode(Motor1)) < abs(enc):
        motor.SetMotor(Motor1, -moveSpeed * sgn(moveSpeed))
        motor.SetMotor(Motor2, moveSpeed * sgn(moveSpeed))
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(Motor1)
    motor.SetMotorStop(Motor2)



def task1():
    ai.SetAICamData(3, 0)
    ai.SetWaitForAICamData(3, 0)
    
    while rcu.GetBluetoothData() != 42:
        Blink(1, 0.5, 0.5)

    while ai.GetAICamData(3, 1) != 1:
        motor.SetMotor(Motor1, -speed) # вместо обычного запуска моторов должна быть функция ConvMove, но интерпретатор на нее тоже жаловался
        motor.SetMotor(Motor2, speed)
        rcu.SetWaitForTime(0.001)
    ConvMove(speed, 200)
    rcu.SetBluetoothData(5)


task1()