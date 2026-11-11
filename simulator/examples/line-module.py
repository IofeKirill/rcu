# В модели установи модуль линии на S5 над трассой.
# Цвета задаются слева направо, элементы 1–7.
import trace

trace.SetTraceV2I2Color(5, 1, 2, 3, 4, 5, 6, 7)
trace.LineSetInitialize(5, 'black', 'wheeledchassis')
print([trace.GetTraceV2I2C(5, i) for i in range(1, 8)])
trace.LineMillisecond(25, 3000)
