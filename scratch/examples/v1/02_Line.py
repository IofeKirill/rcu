import motor
import sensor


while True:
    if (sensor.GetLightSensor(5) < 50):
        motor.SetMotor(1, 20)
        motor.SetMotor(3, 50)
    else:
        motor.SetMotor(1, 50)
        motor.SetMotor(3, 20)
