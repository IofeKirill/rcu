import rcu  # Основная библиотека для управления роботом.
import gyro_lib  # Библиотека для работы с гироскопом.
import motor  # Библиотека для управления моторами.

# === Инициализация гироскопа ===

gyro = gyro_lib.Gyro(1)
gyro.CalibrateGyro()
# ================================

speed = 70

def task1():
    while gyro.ReadGyro() < 90:
        motor.SetMotor(1, speed / 2)
        motor.SetMotor(3, -speed / 2)
        rcu.SetWaitForTime(0.001)
    motor.SetMotorStop(1)
    motor.SetMotorStop(3)

task1()
