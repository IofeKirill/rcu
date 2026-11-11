import rcu
import motor
import sensor

LEFT_MOTOR = 1
RIGHT_MOTOR = 3
FRONT_SONAR = 5
RIGHT_LASER = 4

def task1():
    motor.SetMotorCode(LEFT_MOTOR)
    motor.SetMotor(LEFT_MOTOR, 50)
    motor.SetMotor(RIGHT_MOTOR, 50)
    while sensor.GetUltrasound(FRONT_SONAR) > 20:
        rcu.SetWaitForTime(0.02)
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)
    rcu.SetDisplayString(1, str(motor.GetMotorCode(LEFT_MOTOR)), 0xFFFF, 0)
    rcu.SetDisplayString(2, str(sensor.GetLaserDist(RIGHT_LASER)) + " mm", 0xFFFF, 0)

task1()
