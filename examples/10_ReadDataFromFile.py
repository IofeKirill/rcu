import os
import rcu

with open (r"data.txt",'r') as f: # открываем файл data.txt в режиме чтения
    f = list(f) # читаем строки файла и преобразуем их в список
for i in range (len(f)): # проходим по всем строкам списка
    rcu.SetDisplayString(i+1, str(f[i]), 0xFFE0, 0x0000)# выводим каждую строку на экран, начиная с первой строки