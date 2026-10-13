import rcu  # Основная библиотека для управления роботом.


def task1():
    # Сначала выполните пример 9, чтобы создать data.txt на контроллере.
    with open("data.txt", "r") as dataFile:
        for row, line in enumerate(dataFile, 1):
            rcu.SetDisplayString(row, line.rstrip("\r\n"), 0xFFE0, 0x0000)


task1()
