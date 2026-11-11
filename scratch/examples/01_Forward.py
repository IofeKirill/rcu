import motor
import rcu


def task1():
    motor.SetMotor(1, 50)
    motor.SetMotor(3, 50)
    rcu.SetWaitForTime(1)
    motor.SetMotorStop(1)
    motor.SetMotorStop(3)

task1()
