import motor
import rcu

speed = 0

def task1():
    global speed
    speed = 20
    for _zm_repeat_0 in range(int(3)):
        motor.SetMotor(1, speed)
        rcu.SetWaitForTime(0.5)
        speed += 10
    motor.SetMotorStop(1)

task1()
