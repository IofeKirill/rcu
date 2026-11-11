import motor
import rcu

# Ordinary motors: M2 mechanism, M1/M3 drive wheels.
# Put a ball/can in the sweep of the angled beam, clear of its initial pose.
KICKER_MOTOR = 2

# The beam starts pointing forward unless its initial angle was configured.
# It can rotate through any number of full turns in either direction.
motor.SetMotorAngleDelay(KICKER_MOTOR, 80, 90)
rcu.SetWaitForTime(0.3)

# Return by the same amount. A wall can block an angle command, as on hardware.
motor.SetMotorAngleDelay(KICKER_MOTOR, -40, 90)
rcu.SetWaitForTime(1)
