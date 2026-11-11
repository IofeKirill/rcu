# Обычная база E6: колёса M1/M3, гироскоп S1.
import rcu
import motor
import gyro_lib

gyro = gyro_lib.Gyro(1)
gyro.CalibrateGyro()
motor.SetMotor(1, 25)
motor.SetMotor(3, -25)
while abs(gyro.ReadGyro()) < 90:
    rcu.SetWaitForTime(0.01)
rcu.SetRcuStop()
print('Угол:', gyro.ReadGyro())
