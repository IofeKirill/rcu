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


names = ["kP", "kI", "kD", "speed"]
vars = [0.7, 0.003, 15, 70]
targetStr = 0
otherSgn = 0
end = True

def sgn(num):
    # Функция возвращает 1, если num положительное, -1, если отрицательное, или оставляет 0
    if(num > 0): return 1
    elif (num < 0): return -1
    else: return 0

def CheckButtons():
    # функция читает нажатие в области, где нарисованы кнопки, и возвращает число, соответствующее нажатой кнопке
    if (rcu.GetTouchScreenX() > 80 and rcu.GetTouchScreenX() < 160 and rcu.GetTouchScreenY() > 0 and rcu.GetTouchScreenY() < 40 and rcu.GetSysTime() > 400):
        return 1
    elif (rcu.GetTouchScreenX() > 200 and rcu.GetTouchScreenX() < 240 and rcu.GetTouchScreenY() > 120 and rcu.GetTouchScreenY() < 200 and rcu.GetSysTime() > 300):
        return 2
    elif (rcu.GetTouchScreenX() > 80 and rcu.GetTouchScreenX() < 160 and rcu.GetTouchScreenY() > 280 and rcu.GetTouchScreenY() < 320 and rcu.GetSysTime() > 400):
        return 3
    elif (rcu.GetTouchScreenX() > 0 and rcu.GetTouchScreenX() < 40 and rcu.GetTouchScreenY() > 120 and rcu.GetTouchScreenY() < 160 and rcu.GetSysTime() > 300):
        return 4
    else: 
        return 0

def DrawMenu():
    # функция рисует кнопки и меню на экране
    global targetStr, vars, names

    rcu.SetLCDClear(0x0000)
    rcu.SetLCDRectangle2(80, 0, 80, 40, 2, 0x001F)
    rcu.SetLCDLine(120, 0, 270, 40, 0xF01F)
    rcu.SetLCDLine(120, 0, 235, 20, 0xF01F)
    rcu.SetLCDLine(120, 0, 305, 20, 0xF01F)

    rcu.SetLCDRectangle2(200, 120, 40, 80, 2, 0x001F)
    rcu.SetLCDLine(240, 160, 180, 40, 0xF01F)
    rcu.SetLCDLine(240, 160, 145, 20, 0xF01F)
    rcu.SetLCDLine(240, 160, 215, 20, 0xF01F)

    rcu.SetLCDRectangle2(80, 280, 80, 40, 2, 0x001F)
    rcu.SetLCDLine(120, 320, 90, 40, 0xF01F)
    rcu.SetLCDLine(120, 320, 55, 20, 0xF01F)
    rcu.SetLCDLine(120, 320, 125, 20, 0xF01F)

    rcu.SetLCDRectangle2(0, 120, 40, 80, 2, 0x001F)
    rcu.SetLCDLine(0, 160, 0, 40, 0xF01F)
    rcu.SetLCDLine(0, 160, 35, 20, 0xF01F)
    rcu.SetLCDLine(0, 160, 325, 20, 0xF01F)

    for n in range(4):
        rcu.SetDisplayString(n + 1, str(names[n]) + " = " + str(vars[n]), 0xFFE0, 0x0000)
    rcu.SetDisplayString(targetStr + 1, "* " + str(names[targetStr]) + " = " + str(vars[targetStr]), 0xFFE0, 0x0000)

def ReadButtons():
    # функция проверяет нажатие на кнопки и выполняет соответствующие действия
    global targetStr, otherSgn

    if (CheckButtons() == 1):
        targetStr -= 1
        if (targetStr < 0): targetStr = 3

    elif (CheckButtons() == 2):
        otherSgn = 1

    elif (CheckButtons() == 3):
        targetStr += 1
        if (targetStr > 3): targetStr = 0

    elif (CheckButtons() == 4):
        otherSgn = -1

    rcu.SetSysTime()

def WriteVars():
    # функция записи введенных переменных в память робота
    global vars
    rcu.SetData(1, vars[0] * 100)
    rcu.SetData(2, vars[1] * 1000)
    rcu.SetData(3, vars[2] * 100)
    rcu.SetData(4, vars[3])

def ReadVars():
    # функция чтения введенных переменных из памяти робота
    global vars
    vars[0] = rcu.GetData(1) / 100
    vars[1] = rcu.GetData(2) / 1000
    vars[2] = rcu.GetData(3) / 100
    vars[3] = rcu.GetData(4)

def InputVars():
    # функция для изменения значений переменных при нажатии на кнопки
    global targetStr, otherSgn, vars, end

    ReadVars()
    DrawMenu()

    while end:
        if (rcu.GetRightButton() == 1): end = False
        if (CheckButtons() != 0):
            ReadButtons()
            if (targetStr == 0): vars[0] += 0.01 * otherSgn
            elif (targetStr == 1): vars[1] += 0.001 * otherSgn
            elif (targetStr == 2): vars[2] += 0.01 * otherSgn
            elif (targetStr == 3): vars[3] += 5 * otherSgn

            otherSgn = 0
            DrawMenu()
            rcu.SetWaitForTime(0.001)
    WriteVars()

def LinePID():
    # функция для движения по линии
    global vars

    lastError = 0
    iMax = 25
    iReg = 0
    # Объявление глобальных переменных
    error = sensor.GetLightSensor(LeftLightSensor) // 20 - sensor.GetLightSensor(RightLightSensor) // 20
    # Вычисление отклонения от линии. Деление на 20 для приведения чувствительности датчиков в диапазон 0-100.
    pReg = error * vars[0]
    # Вычисление П-регулятораs
    iReg = iReg + error * vars[1]
    # Вычисление И-регулятора
    dReg = (error - lastError) * vars[2]
    # Вычисление Д-регулятора

    if(abs(iReg) > iMax): iReg = iMax * sgn(iReg)
    # Ограничение значения И-регулятора
    lastError = error
    # Запись текущей ошибки как прошлой

    control = pReg + iReg + dReg
    # Определение итогового управляющего воздействия регулятора

    leftSpeed = vars[3] + control
    # Расчет скорости левого мотора
    rightSpeed = vars[3] - control
    # Расчет скорости правого мотора

    motor.SetMotor(LeftMotor, leftSpeed)
    motor.SetMotor(RightMotor, rightSpeed)
    # Подача скорости на моторы
    rcu.SetWaitForTime(0.001)
    # Небольшая задержка

def task1():
    InputVars()
    sensor.SetLightSensorLed(LeftLightSensor, 1)
    sensor.SetLightSensorLed(RightLightSensor, 1)
    while True: LinePID()

task1()