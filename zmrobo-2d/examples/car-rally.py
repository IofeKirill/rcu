import motor
import sensor
import rcu

# Preset 'Ралли: коридор': M1 steering, M3 drive; S1 front, S3 right sonar.
STEER = 1
DRIVE = 3
FRONT = 1
RIGHT = 3

while True:
    front = sensor.GetUltrasound(FRONT)
    right = sensor.GetUltrasound(RIGHT)
    desired = 28 if front < 65 else max(-25, min(28, (right - 40) * 1.1))
    error = desired * 3 - motor.GetMotorCode(STEER)
    motor.SetMotor(STEER, max(-45, min(45, error * 1.5)))
    motor.SetMotor(DRIVE, 25 if front < 90 else 38)
    rcu.SetWaitForTime(0.02)
