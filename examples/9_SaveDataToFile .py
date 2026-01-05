import os
import rcu

for count in range(10): # повторить 10 раз
    rcu.SetWaitForTime(0.1) # подождать 0.1 секунды
    VAR_x = rcu.GetLightSensor(1) # считать значение с датчика света на порту 1
    with open("data.txt", 'a') as f: # открыть файл data.txt в режиме добавления (если не существует, создает его)
        f.write("{}\n".format(VAR_x)) # записать значение переменной в файл с новой строки