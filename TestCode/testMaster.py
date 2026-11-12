import rcu  # Основная библиотека для управления роботом.
import motor  # Библиотека для управления моторами.
import sensor  # Библиотека для работы с различными датчиками.

LEFT_MOTOR = 1
RIGHT_MOTOR = 2

LEFT_SIGN = 1
RIGHT_SIGN = 1

STEP_TIME = 0.5

# Здесь предполагается, что SetWaitForTime принимает секунды.
# Если в твоей версии нужны миллисекунды — поставь 1000.
WAIT_SCALE = 1


def Wait(seconds):
    rcu.SetWaitForTime(seconds * WAIT_SCALE)


def Stop():
    motor.SetMotorStop(LEFT_MOTOR)
    motor.SetMotorStop(RIGHT_MOTOR)


def Drive(left, right):
    motor.SetMotor(LEFT_MOTOR, left * LEFT_SIGN)
    motor.SetMotor(RIGHT_MOTOR, right * RIGHT_SIGN)


def Move(left, right):
    try:
        Drive(left, right)
        Wait(STEP_TIME)
    finally:
        Stop()


def Encode(left, right, number):
    left_code = left // 25 + 3
    right_code = right // 25 + 3

    return 1 + number * 64 + left_code * 7 + right_code


def Decode(data):
    value = data - 1
    number = value // 64
    pair = value % 64

    left = (pair // 7 - 3) * 25
    right = (pair % 7 - 3) * 25

    return left, right, number

def SendAndMove(left, right, number):
    data = Encode(left, right, number)
    confirmation = 200 + number

    rcu.SetBluetoothData(data)

    # Ведущий выполняет переданное движение.
    Move(left, right)

    # Ожидаем завершения движения ведомого.
    # При необходимости повторяем отправку той же команды.
    for attempt in range(100):
        if rcu.GetBluetoothData() == confirmation:
            return

        rcu.SetBluetoothData(data)
        Wait(0.05)

    raise RuntimeError("Нет подтверждения от ведомого")


# Каждая строка — движение продолжительностью STEP_TIME.
route = [
    (50, 50),     # Вперёд
    (50, 50),     # Ещё вперёд: проверяем одинаковые команды подряд
    (50, -50),    # Поворот на месте
    (50, 50),     # Вперёд
    (-50, 50),    # Поворот в другую сторону
    (50, 50),     # Вперёд
    (50, -50),    # Ещё один поворот
    (50, 50),     # Вперёд
    (0, 0),       # Остановка
]

Stop()
rcu.SetBluetoothData(0)

# Даём время запустить программу ведомого.
Wait(3)

number = 0

try:
    for left, right in route:
        SendAndMove(left, right, number)
        number = 1 - number
finally:
    Stop()
