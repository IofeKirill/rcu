import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import sensor # Библиотека для работы с различными датчиками.

# ---------- Настройки моторов и датчиков ----------
SPEED_MOTOR = 3  # устройство подключено на порт Motor 3
RULE_MOTOR = 1  # устройство подключено на порт Motor 4
LEFT_SONAR = 2  # устройство подключено на порт Sensor 5
RIGHT_SONAR = 3  # устройство подключено на порт Sensor 7
# --------------------------------------------------

center = 0
speed = 100
step = 7
kSpeedRule = 5
lastLeftDist = 0
lastRightDist = 0
targetAngle = 0

def sgn(value):
    if value > 0:
        return 1
    if value < 0:
        return -1
    return 0

def Calibration():
    global center, targetAngle
    motor.SetMotor(RULE_MOTOR, -20)
    rcu.SetWaitForTime(1)
    motor.SetMotorStop(RULE_MOTOR)
    motor.SetMotorCode(RULE_MOTOR)

    motor.SetMotor(RULE_MOTOR, 20)
    rcu.SetWaitForTime(2)
    motor.SetMotorStop(RULE_MOTOR)
    center = motor.GetMotorCode(RULE_MOTOR) / 2

    while (motor.GetMotorCode(RULE_MOTOR) > center):
        motor.SetMotor(RULE_MOTOR, -20)
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(RULE_MOTOR)
    targetAngle = center


def FilterSensors():
    global leftDist, rightDist, lastLeftDist, lastRightDist
    maxDist = 200

    leftDist = sensor.GetUltrasound(LEFT_SONAR)
    rightDist = sensor.GetUltrasound(RIGHT_SONAR) 

    if (leftDist > maxDist):
        leftDist = lastLeftDist
    lastLeftDist = leftDist

    if (rightDist > maxDist):
        rightDist = lastRightDist
    lastRightDist = rightDist

def MovementInCorridor():
    global center, speed, step, kSpeedRule, leftDist, rightDist, targetAngle
    FilterSensors()
    error =  rightDist - leftDist

    angle = max(0, min(2 * center, center + error * 3))
    targetAngle += max(-step, min(step, angle - targetAngle))
    speedRule = (targetAngle - motor.GetMotorCode(RULE_MOTOR)) * kSpeedRule

    motor.SetMotor(RULE_MOTOR, speedRule)
    motor.SetMotor(SPEED_MOTOR, speed)
    rcu.SetWaitForTime(0.01)

def task1():
    Calibration()
    while True:
        MovementInCorridor()

task1()