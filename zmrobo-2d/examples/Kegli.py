import rcu  # Основная библиотека для управления роботом.
import sensor  # Библиотека для работы с различными датчиками.
import motor  # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
LEFT_MOTOR = 1  # устройство подключено на порт Motor 1
RIGHT_MOTOR = 3  # устройство подключено на порт Motor 3
LIGHT = 1  # устройство подключено на порт Sensor 1
SONAR = 2  # устройство подключено на порт Sensor 2
LED = 3 # устройство подключено на порт Sensor 3
# --------------------------------------------------

speed = rcu.GetData(1)

def task1():
    while True:
        while sensor.GetLightSensor(LIGHT) > 2000:
            sensor.Set3CLed(LED, 1)
            motor.SetMotor(LEFT_MOTOR, speed)
            motor.SetMotor(RIGHT_MOTOR, speed)
            rcu.SetWaitForTime(0.001)
        rcu.SetWaitForTime(0.2)
        motor.SetMotor(LEFT_MOTOR, -speed)
        motor.SetMotor(RIGHT_MOTOR, -speed)
        sensor.Set3CLed(LED, 2)
        rcu.SetWaitForTime(0.35)
        motor.SetMotor(LEFT_MOTOR, speed / 2)
        motor.SetMotor(RIGHT_MOTOR, -speed / 2)
        while sensor.GetUltrasound(SONAR) < 28:
            sensor.Set3CLed(LED, 3)
            rcu.SetWaitForTime(0.01)
        motor.SetMotorCode(LEFT_MOTOR)
        while sensor.GetUltrasound(SONAR) > 50:
            sensor.Set3CLed(LED, 4)
            rcu.SetWaitForTime(0.01)
            if motor.GetMotorCode(LEFT_MOTOR) > 300:
                return
        rcu.SetWaitForTime(0.1)

task1()
