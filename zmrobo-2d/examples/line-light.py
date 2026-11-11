import rcu
import motor
import sensor

LEFT_MOTOR = 1
RIGHT_MOTOR = 3
LEFT_LIGHT = 5
RIGHT_LIGHT = 6

speed = rcu.GetData(1)
kP = rcu.GetData(2) / 10

def task1():
    while sensor.GetColorSensor(8, 4) != 2:
        deviation = (sensor.GetLightSensor(LEFT_LIGHT) - sensor.GetLightSensor(RIGHT_LIGHT)) / 24
        control = deviation * kP
        motor.SetMotor(LEFT_MOTOR, max(-100, min(100, speed + control)))
        motor.SetMotor(RIGHT_MOTOR, max(-100, min(100, speed - control)))
        rcu.SetWaitForTime(0.02)
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)
    rcu.SetDisplayString(1, "Finish", 0xFFFF, 0)

task1()
