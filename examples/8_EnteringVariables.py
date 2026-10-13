import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import sensor  # Библиотека для работы с датчиками.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
LEFT_LIGHT = 5  # устройство подключено на порт Sensor 5
RIGHT_LIGHT = 6  # устройство подключено на порт Sensor 6
# --------------------------------------------------

# Порядок меню совпадает с порядком ячеек памяти 1–4.
names = ["speed", "kP", "kI", "kD"]
values = [0, 0, 0, 0]
targetStr = 0
lastDeviation = 0
iReg = 0

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
        rcu.SetDisplayString(n + 1, str(names[n]) + " = " + str(values[n]), 0xFFE0, 0x0000)
    rcu.SetDisplayString(targetStr + 1, "* " + str(names[targetStr]) + " = " + str(values[targetStr]), 0xFFE0, 0x0000)


def ReadButtons(button):
    global targetStr
    # Возвращаем направление изменения; выбор строки сохраняется между вызовами.
    direction = 0
    if button == 1:
        targetStr = (targetStr - 1) % 4
    elif button == 2:
        direction = 1
    elif button == 3:
        targetStr = (targetStr + 1) % 4
    elif button == 4:
        direction = -1
    rcu.SetSysTime()
    return direction


def WriteVars():
    rcu.SetData(1, values[0])
    rcu.SetData(2, values[1] * 10)
    rcu.SetData(3, values[2] * 1000)
    rcu.SetData(4, values[3])


def ReadVars():
    values[0] = rcu.GetData(1)
    values[1] = rcu.GetData(2) / 10
    values[2] = rcu.GetData(3) / 1000
    values[3] = rcu.GetData(4)


def InputVars():
    ReadVars()
    DrawMenu()
    steps = [5, 0.1, 0.001, 0.01]
    # Вправо/влево меняют значение, вверх/вниз выбирают строку.
    while rcu.GetRightButton() != 1:
        button = CheckButtons()
        if button != 0:
            direction = ReadButtons(button)
            values[targetStr] += steps[targetStr] * direction
            DrawMenu()
        rcu.SetWaitForTime(0.001)
    WriteVars()
    # Правая кнопка сохраняет значения и запускает движение.


def ReadLight(port):
    return sensor.GetLightSensor(port) / rcu.GetData(port)
    # Нормируем показание датчика значением ячейки с номером его порта.


def LinePID():
    global lastDeviation, iReg
    # Только изменяемое состояние между вызовами требует global.
    speed = rcu.GetData(1)
    # Общая скорость из ячейки 1.
    kP = rcu.GetData(2) / 10
    # Коэффициент П-регулятора: значение ячейки 2 делим на 10.
    kI = rcu.GetData(3) / 1000
    # Коэффициент И-регулятора: значение ячейки 3 делим на 1000.
    kD = rcu.GetData(4)
    # Коэффициент Д-регулятора из ячейки 4 без делителя.

    leftLight = ReadLight(LEFT_LIGHT)
    rightLight = ReadLight(RIGHT_LIGHT)
    rcu.SetDisplayString(1, str(leftLight), 0xFFE0, 0x0000)
    rcu.SetDisplayString(3, str(rightLight), 0xFFE0, 0x0000)
    deviation = leftLight - rightLight
    # Разность нормированных показаний датчиков света.

    pReg = deviation * kP
    # П-составляющая зависит от текущего отклонения.
    iReg = max(-25, min(25, iReg + deviation * kI))
    # Накапливаем И-составляющую и ограничиваем её от -25 до 25.
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
    InputVars()
    sensor.SetLightSensorLed(LEFT_LIGHT, 1)
    sensor.SetLightSensorLed(RIGHT_LIGHT, 1)
    while True:
        LinePID()
task1()
