import motor
import rcu


def task1():
    rcu.SetSysTime()
    motor.SetMotor(1, 50)
    motor.SetMotor(3, 50)
    while not (rcu.GetSysTime() > 1000):
        rcu.SetWaitForTime(0.01)
    motor.SetMotorStop(1)
    motor.SetMotorStop(3)

task1()
