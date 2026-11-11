import motor
import rcu

# Select 'Автомобиль (E6)'. M1 = steering, M3 = rear axle drive.
# Steering gearbox: 3 motor degrees per 1 degree at the road wheels.
STEER = 1
DRIVE = 3

motor.SetMotorAngleDelay(STEER, 35, 60)  # about 20 degrees to the right
motor.SetMotor(DRIVE, 40)
rcu.SetWaitForTime(2)
motor.SetMotorStop(DRIVE)
rcu.SetWaitForTime(0.5)

motor.SetMotorAngleDelay(STEER, -35, 60)  # straighten the wheels
motor.SetMotor(DRIVE, -25)
rcu.SetWaitForTime(1)
motor.SetMotorStop(DRIVE)
rcu.SetWaitForTime(0.5)
