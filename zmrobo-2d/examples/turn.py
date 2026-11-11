import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.

speed = 50

def task1():
    motor.SetMotor(1, speed)
    motor.SetMotor(3, -speed)
    rcu.SetWaitForTime(0.5)
    motor.SetMotorStop(1)
    motor.SetMotorStop(3)


task1()
