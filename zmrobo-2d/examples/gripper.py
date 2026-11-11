import motor
import rcu

# Select 'Моторный захват', assign M2 and place a can/ball between its open beams.
LEFT_MOTOR = 1
RIGHT_MOTOR = 3
GRIPPER_MOTOR = 2

# Close until the two beams physically clamp the object, then hold.
motor.SetMotor(GRIPPER_MOTOR, 35)
rcu.SetWaitForTime(0.5)
motor.SetMotorStop(GRIPPER_MOTOR)

motor.SetMotor(LEFT_MOTOR, 30)
motor.SetMotor(RIGHT_MOTOR, 30)
rcu.SetWaitForTime(0.7)
motor.SetMotorStop(LEFT_MOTOR)
motor.SetMotorStop(RIGHT_MOTOR)
rcu.SetWaitForTime(0.1)

# Reverse the same motor to open and release.
motor.SetMotor(GRIPPER_MOTOR, -35)
rcu.SetWaitForTime(0.5)
motor.SetMotorStop(GRIPPER_MOTOR)
