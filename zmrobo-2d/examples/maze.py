import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import sensor  # Библиотека для работы с различными датчиками.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 2  # устройство подключено на порт Motor 2
RIGHT_SONAR = 1  # устройство подключено на порт Sensor 1
FRONT_LASER = 2  # устройство подключено на порт Sensor 2
COLOR_SENSOR = 3  # устройство подключено на порт Sensor 3
LED = 4 # устройство подключено на порт Sensor 4
# --------------------------------------------------

speed = rcu.GetData(1)
kEnc = rcu.GetData(2)
kAlig = rcu.GetData(3)
distFIdeal = 110
distR = 30
distF = 300
path = []
there = True

def sgn(value):
    if value > 0:
        return 1
    if value < 0:
        return -1
    return 0

def StopMotor(time = 0.2):
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)
    rcu.SetWaitForTime(time)

def CenterEncoder():
    return (abs(motor.GetMotorCode(LEFT_MOTOR)) + abs(motor.GetMotorCode(RIGHT_MOTOR))) / 2

def MoveRobot(encMove):
    global there
    motor.SetMotorCode(LEFT_MOTOR)
    motor.SetMotorCode(RIGHT_MOTOR)
    sensor.Set3CLed(LED, 1)
    if there:
        path.append(3)

    while CenterEncoder() < abs(encMove):
        dev = abs(motor.GetMotorCode(LEFT_MOTOR)) - abs(motor.GetMotorCode(RIGHT_MOTOR))
        control = dev * kEnc
        leftSpeed = speed - control
        rightSpeed = speed + control

        motor.SetMotor(LEFT_MOTOR, leftSpeed)
        motor.SetMotor(RIGHT_MOTOR, rightSpeed)

        if sensor.GetColorSensor(COLOR_SENSOR, 4) == 2:
            there = False
    StopMotor()

def TurnRobot(encTurn):
    motor.SetMotorCode(LEFT_MOTOR)
    motor.SetMotorCode(RIGHT_MOTOR)

    if there:
        if encTurn > 0:
            path.append(1)
            sensor.Set3CLed(LED, 2)
        else:
            path.append(2)
            sensor.Set3CLed(LED, 3)

    while CenterEncoder() < abs(encTurn):
        leftSpeed = speed * sgn(encTurn) / 2
        rightSpeed = -speed * sgn(encTurn) / 2

        motor.SetMotor(LEFT_MOTOR, leftSpeed)
        motor.SetMotor(RIGHT_MOTOR, rightSpeed)
    StopMotor()

def Alignment():
    sensor.Set3CLed(LED, 4)
    motor.SetMotor(LEFT_MOTOR, speed)
    motor.SetMotor(RIGHT_MOTOR, speed)
    rcu.SetWaitForTime(0.5)

    while sensor.GetLaserDist(FRONT_LASER, 1) < distFIdeal:
        dev = (sensor.GetLaserDist(FRONT_LASER, 1) - distFIdeal) / 10
        control = dev * kAlig

        motor.SetMotor(LEFT_MOTOR, control)
        motor.SetMotor(RIGHT_MOTOR, control)
    StopMotor()

def task1():
    sensor.Set3CLed(LED, 0)
    while there:
        if sensor.GetUltrasound(RIGHT_SONAR) > distR:
            TurnRobot(220)
            MoveRobot(550)
        elif sensor.GetLaserDist(FRONT_LASER, 1) > distF:
            MoveRobot(550)
        else: 
            TurnRobot(-220)
        if sensor.GetLaserDist(FRONT_LASER, 1) < distF:
            Alignment()
    
    rcu.SetDisplayString(1, str(path), 0xFFE0, 0x0000)

task1()
