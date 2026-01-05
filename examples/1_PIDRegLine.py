import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import sensor # Библиотека для работы с различными датчиками.
import math


# ---------- Настройки моторов и датчиков ----------
LeftMotor = 1  # устройство подключено на порт Motor 1
RightMotor = 3  # устройство подключено на порт Motor 3
LeftLightSensor = 3  # устройство подключено на порт Sensor 3
RightLightSensor = 4  # устройство подключено на порт Sensor 4
# --------------------------------------------------


kP = 0.02
# коэффициент П-регулятора
kI = 0.11
# коэффициент И-регулятора
kD = 0.75
# коэффициент Д-регулятора
lastError = 0
# прошлая ошибка для Д-регулятора
iMax = 25
# максимальное значение для И-регулятора
iReg = 0
# начальное значение для И-регулятора
speed = 50
# общая скорость робота
timeClear = 0
# таймер очистки экрана

def sgn(num):
    # Функция возвращает 1, если num положительное, -1, если отрицательное, или оставляет 0
    if(num > 0): return 1
    elif (num < 0): return -1
    else: return 0

def LinePID():
    global kP, speed, kI, kD, iMax, lastError, iReg, timeClear
    # Объявление глобальных переменных

    # Функция для движения по линии
    rcu.SetDisplayString(1, "LCol = " + str(sensor.GetLightSensor(LeftLightSensor) // 20), 0xFFE0, 0x0000)
    rcu.SetDisplayString(3,"RCol = " + str(sensor.GetLightSensor(RightLightSensor) // 20), 0xFFE0, 0x0000)
    # Вывод показаний с датчиков света на экран. Деление на 20 для приведения чувствительности датчиков в диапазон 0-100.

    
    error = sensor.GetLightSensor(LeftLightSensor) // 20 - sensor.GetLightSensor(RightLightSensor) // 20
    # Вычисление отклонения от линии. Деление на 20 для приведения чувствительности датчиков в диапазон 0-100.
    pReg = error * kP
    # Вычисление П-регулятора
    iReg = iReg + error * kI
    # Вычисление И-регулятора
    dReg = (error - lastError) * kD
    # Вычисление Д-регулятора

    if(abs(iReg) > iMax): iReg = iMax * sgn(iReg)
    # Ограничение значения И-регулятора
    lastError = error
    # Запись текущей ошибки как прошлой

    control = pReg + iReg + dReg
    # Определение итогового управляющего воздействия регулятора

    leftSpeed = speed + control
    # Расчет скорости левого мотора
    rightSpeed = speed - control
    # Расчет скорости правого мотора

    motor.SetMotor(LeftMotor, leftSpeed)
    motor.SetMotor(RightMotor, rightSpeed)
    # Подача скорости на моторы
    rcu.SetWaitForTime(0.001)
    # Небольшая задержка

def task1():
    sensor.SetLightSensorLed(3, 1)
    sensor.SetLightSensorLed(4, 1)
    # включение подсветки на датчиках света
    while True:
        LinePID()
    # Бесконечный запуск движения по линии

task1()