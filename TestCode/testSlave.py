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



Stop()
rcu.SetBluetoothData(0)

last_number = -1

try:
    while True:
        data = rcu.GetBluetoothData()

        valid = (
            isinstance(data, int)
            and (
                1 <= data <= 49
                or 65 <= data <= 113
            )
        )

        if valid:
            left, right, number = Decode(data)

            # Новую команду выполняем один раз.
            if number != last_number:
                Move(left, right)
                last_number = number

            # Подтверждение повторяем и для уже выполненной команды.
            rcu.SetBluetoothData(200 + number)

        Wait(0.01)
finally:
    Stop()