import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import ai # Библиотека для работы с камерой.


# ---------- Настройки моторов и датчиков ----------
LeftMotor = 1  # устройство подключено на порт Motor 1
RightMotor = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


kP = 0.22
# коэффициент П-регулятора
kI = 0.0002
# коэффициент И-регулятора
kD = 0.08
# коэффициент Д-регулятора
lastError = 0
# прошлая ошибка для Д-регулятора
iMax = 20
# максимальное значение для И-регулятора
iReg = 0
# начальное значение для И-регулятора
speed = 30
# общая скорость робота
timeClear = 0
# таймер очистки экрана

def sgn(num):
    # Функция возвращает 1, если num положительное, -1, если отрицательное, или оставляет 0
    if(num > 0): return 1
    elif (num < 0): return -1
    else: return 0

def LinePIDCamera():
    global kP, speed, kI, kD, iMax, lastError, iReg, timeClear
    error = ai.GetAICamData(1) - 120
    # Вычисление отклонения от линии по камере
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
    ai.SetAICamLED(1)
    # Включение подсветки на камере
    ai.SetAICamData(5,0)
    # Переключение камеры в режим обнаружения линии
    ai.SetWaitForAICamData(5,0)
    # Ождиание переключения камеры в режим поиска линии
    rcu.SetWaitForTime(1)
    # Задержка перед стартом
    while True:
        LinePIDCamera()
    # Бесконечный запуск движения по линии



task1()