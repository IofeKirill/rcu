import motor
import rcu

# Select 'Пиналка', assign M2 and put an object just ahead of its paddle.
KICKER_MOTOR = 2

motor.SetMotor(KICKER_MOTOR, 80)
rcu.SetWaitForTime(0.3)
motor.SetMotorStop(KICKER_MOTOR)
rcu.SetWaitForTime(0.3)

# Return the paddle to its resting position.
motor.SetMotor(KICKER_MOTOR, -40)
rcu.SetWaitForTime(0.4)
motor.SetMotorStop(KICKER_MOTOR)
rcu.SetWaitForTime(1)
