import rcu
import motor
import sensor

LEFT_MOTOR = 1
RIGHT_MOTOR = 3
LEFT_LIGHT = 5
RIGHT_LIGHT = 6
FRONT_SONAR = 4


lastDeviation = 0
# Прошлое отклонение для Д-составляющей.
iReg = 0
# Накопленное значение И-составляющей.

def sgn(value):
    if value > 0:
        return 1
    if value < 0:
        return -1
    return 0

def ReadLight(port):
    return sensor.GetLightSensor(port) / rcu.GetData(port)
    # Нормируем показание датчика значением ячейки с номером его порта.

def RobotMovement(encoder):
    # Знак угла задаёт направление, скорость берётся из ячейки 1.
    motor.SetMotorCode(LEFT_MOTOR)
    while abs(motor.GetMotorCode(LEFT_MOTOR)) < abs(encoder):
        speed = rcu.GetData(1)
        power = speed * sgn(encoder)
        motor.SetMotor(LEFT_MOTOR, power)
        motor.SetMotor(RIGHT_MOTOR, power)
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)

def Arc():
        while ReadLight(RIGHT_LIGHT) > 50:
            speed = rcu.GetData(1)
            motor.SetMotor(LEFT_MOTOR, speed * 0.6)
            motor.SetMotor(RIGHT_MOTOR, speed)
            rcu.SetWaitForTime(0.001)
        motor.SetMotorStop(LEFT_MOTOR)
        motor.SetMotorStop(RIGHT_MOTOR)

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

def Detour():
    RobotRotation(180)
    Arc()
    RobotRotation(180)




def LinePIDLight():
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
    deviation = leftLight - rightLight
    # Разность нормированных показаний датчиков света.

    pReg = deviation * kP
    # П-составляющая зависит от текущего отклонения.
    iReg = max(-25, min(25, iReg + deviation * kI))
    # Накапливаем И-составляющую и ограничиваем её от -25 до 25.
    dReg = sgn(deviation - lastDeviation) * kD
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
    while True:
        if sensor.GetUltrasound(FRONT_SONAR) < 20:
            Detour()
        else:
            LinePIDLight()

task1()
