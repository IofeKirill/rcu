import motor
import rcu
import sensor

SPEED = 70
THRESHOLD = 60


def Drive(left, right):
    motor.SetMotor(1, left)
    motor.SetMotor(3, right)


def task1():
    while True:
        left = sensor.GetLightSensor(5)
        right = sensor.GetLightSensor(6)

        if left < THRESHOLD or right < THRESHOLD:
            # Отъехать от разметки
            Drive(-SPEED, -SPEED)
            rcu.SetWaitForTime(0.3)

            # Повернуть и продолжить поиск мячей
            Drive(SPEED, -SPEED)
            rcu.SetWaitForTime(0.4)
        else:
            Drive(SPEED, SPEED)

        rcu.SetWaitForTime(0.02)


task1()