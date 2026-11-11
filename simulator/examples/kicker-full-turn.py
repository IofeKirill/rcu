import motor
import rcu

# Select 'Пиналка', assign free motor M2, and leave room for its whole circle.
# Mechanical position starts at the configured initial angle; encoder starts at zero.
KICKER = 2
motor.SetMotorAngleDelay(KICKER, 60, 720)
print('Вперёд, энкодер:', motor.GetMotorCode(KICKER))
rcu.SetWaitForTime(0.5)
motor.SetMotorAngleDelay(KICKER, -60, 1080)
print('Назад, энкодер:', motor.GetMotorCode(KICKER))
rcu.SetWaitForTime(0.5)
