import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
CLAW_MOTOR = 2  # устройство подключено на порт Motor 2
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


def sgn(num):
    return (num > 0) - (num < 0)


def task1():
    # Ячейка 1 — скорость движения; ячейка 2 / 10 — делитель поворота.
    # Делитель должен быть ненулевым. Здесь он не является П-коэффициентом.
    encoderClaw = motor.GetMotorCode(CLAW_MOTOR)
    timeLCDClear = 0
    while True:
        speed = rcu.GetData(1)
        kSpeed = rcu.GetData(2) / 10
        leftX = rcu.GetBTModuleRemoteRocker(0, 0)
        leftY = rcu.GetBTModuleRemoteRocker(0, 1)
        rightX = rcu.GetBTModuleRemoteRocker(1, 0)
        rightY = rcu.GetBTModuleRemoteRocker(1, 1)

        if (leftX == 999 and leftY == 999) or (leftX == 0 and leftY == 0):
            leftSpeed = rightSpeed = 0
        elif leftY > 0:
            if leftX > 0:
                leftSpeed = speed
                rightSpeed = (leftY - leftX) / kSpeed
            else:
                leftSpeed = (leftY + leftX) / kSpeed
                rightSpeed = speed
        elif leftX > 0:
            leftSpeed = (leftY + leftX) / kSpeed
            rightSpeed = -speed
        else:
            leftSpeed = -speed
            rightSpeed = (leftY - leftX) / kSpeed

        clawPosition = motor.GetMotorCode(CLAW_MOTOR)
        if (rightX == 999 and rightY == 999) or (rightX == 0 and rightY == 0):
            # Удерживаем клешню; при точном совпадении мотор остановлен.
            deviation = encoderClaw - clawPosition
            clawSpeed = 3 * sgn(deviation)
        else:
            clawSpeed = 20 if rightY > 0 else -20
            encoderClaw = clawPosition

        motor.SetMotor(LEFT_MOTOR, leftSpeed)
        motor.SetMotor(RIGHT_MOTOR, rightSpeed)
        motor.SetMotor(CLAW_MOTOR, clawSpeed)
        timeLCDClear += 1
        if timeLCDClear == 15:
            rcu.SetLCDClear(0x0000)
            timeLCDClear = 0
        rcu.SetDisplayString(1, str(leftX), 0xFFE0, 0x0000)
        rcu.SetDisplayString(3, str(leftY), 0xFFE0, 0x0000)
        rcu.SetDisplayString(5, str(rightY), 0xFFE0, 0x0000)
        rcu.SetWaitForTime(0.001)
task1()
