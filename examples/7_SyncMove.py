import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
авпр = 1  # устройство подключено на порт Motor 1
# --------------------------------------------------

# ---------- Настройки моторов и датчиков ----------
LeftMotor = 1  # устройство подключено на порт Motor 1
RightMotor = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------

# Пример разработал Байдин Ярослав.

speed = 60
# Скорость робота
kEncoder = 0.7
# Коэффициент выравнивания

def SyncMove(timeEncoder):
    global speed, kEncoder
    rcu.SetSysTime()
    # Устанавливаем системное время для отсчета времени работы
    motor.SetMotorCode(LeftMotor)
    motor.SetMotorCode(RightMotor)
    # Сбрасываем показания энкодеров моторов
    
    while(rcu.GetSysTime() < timeEncoder):
        # Пока системное время меньше, чем заданное время движения
        error = motor.GetMotorCode(RightMotor) - motor.GetMotorCode(LeftMotor)
        # Ошибка равна разнице между показаниями энкодеров двух моторов
        control = error * kEncoder
        # Рассчитываем корректирующий сигнал на основе ошибки и коэффициента выравнивания
        leftSpeed = speed + control
        # Находим скорость левого мотора
        rightSpeed = speed - control
        # Находим скорость правого мотора
        motor.SetMotor(LeftMotor, leftSpeed)
        motor.SetMotor(RightMotor, rightSpeed)
        # Устанавливаем скорость для моторов
        rcu.SetWaitForTime(0.001)
        # Задержка в цикле
    motor.SetMotor(LeftMotor, 0)
    motor.SetMotor(RightMotor, 0)
    # Останавливаем моторы после цикла

def task1():
    SyncMove(1500)
    # Запускаем движение вперед на полторы секунды
task1()

