import rcu
import sensor

# ============================================================
#  Библиотека gyro для E6-RCU (неофициальная)
#  Автор: Кирилл Иофе
#  Назначение: стабильное вычисление угла поворота по угловой скорости
# ============================================================

class Gyro:
    def __init__(self, port):
        """Инициализация гироскопа"""
        self.port = port
        self.angle = 0.0
        self.gyroDeviation = 0.0
        self.lastTime = 0.0

    # --------------------------------------------------------
    def CalibrateGyro(self, samples=100):
        """
        Калибровка гироскопа — определяет среднее смещение при неподвижном роботе.
        Параметры:
            samples — количество измерений (по умолчанию 100)
        """
        totalAngle = 0.0
        for i in range(samples):
            totalAngle += sensor.GetAHRS(self.port, 9, 0)  # угловая скорость по оси Z
            rcu.SetWaitForTime(0.010)  # 10 мс между измерениями

        self.gyroDeviation = totalAngle / samples  # среднее значение = дрейф
        self.angle = 0.0
        rcu.SetSysTime()  # сбрасываем таймер
        self.lastTime = rcu.GetSysTime()

    # --------------------------------------------------------
    def ReadGyro(self):
        """
        Возвращает рассчитанный угол поворота (в градусах).
        Алгоритм интегрирует угловую скорость по времени.
        """
        currentTime = rcu.GetSysTime()
        dT = (currentTime - self.lastTime) / 1000.0
        self.lastTime = currentTime

        gyroZ = sensor.GetAHRS(self.port, 9, 0)
        corrected_gyro = gyroZ - self.gyroDeviation
        self.angle += corrected_gyro * dT  # интегрируем (см. оригинальный алгоритм)
        return self.angle

    # --------------------------------------------------------
    def ResetAngle(self):
        """Принудительный сброс угла в ноль"""
        self.angle = 0.0
        self.lastTime = rcu.GetSysTime()


# ============================================================
# Пример использования:
# ------------------------------------------------------------
# import rcu
# import gyro
#
# g = gyro.Gyro(4)         # гироскоп на порту 4
# g.CalibrateGyro()        # калибровка
#
# while True:
#     angle = g.ReadGyro()
#     rcu.SetDisplayString(1, "Angle = " + str(round(angle, 1)), 0xFFE0, 0x0000)
#     rcu.SetWaitForTime(0.05)
# ============================================================
