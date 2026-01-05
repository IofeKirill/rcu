import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.

# ---------- Настройки моторов и датчиков ----------
LeftMotor = 1  # устройство подключено на порт Motor 1
ClawMotor = 2  # устройство подключено на порт Motor 2
RightMotor = 3  # устройство подключено на порт Motor 3
# --------------------------------------------------


speed = 30
# Общая скорость робота
kSpeed = 3
# Коэффициент замедления поворота
leftSpeed = 0
# Скорость левого мотора
rightSpeed = 0
# Скорость правого мотора
clawSpeed = 0
# Скорость работы клешни
encoderClaw = 0
# Показания энкодера с захвата
timeLCDClear = 0
# Таймер для экрана



def task1():
  global speed, clawSpeed, kSpeed, leftSpeed, rightSpeed, encoderClaw, timeLCDClear
  # Передаём глобальные переменные в функцию

  while True:
    if (((rcu.GetBTModuleRemoteRocker(0, 1) == 999) and (rcu.GetBTModuleRemoteRocker(0, 0) == 999)) or ((rcu.GetBTModuleRemoteRocker(0, 1) == 0) and (rcu.GetBTModuleRemoteRocker(0, 0) == 0))):
      # Если на левом джойстике показания по обеим осям (Х и У) равны 999 или 0, то он в центре
      leftSpeed = 0
      rightSpeed = 0
      # Поэтому скорость равна 0
    else:
      # Иначе читаем показания с джойстика
      if (rcu.GetBTModuleRemoteRocker(0, 1) > 0):
        if (rcu.GetBTModuleRemoteRocker(0, 0) > 0):
          # Если по обеим осям положительное значение (положение джойстика Справа-Сверху)
          leftSpeed = speed
          rightSpeed = ((rcu.GetBTModuleRemoteRocker(0, 1) - rcu.GetBTModuleRemoteRocker(0, 0)) / kSpeed)
          # То левый мотор включается вперёд с максимальной скоростью, а правый со скоростью разницы осей У и Х
        else:
          # Если ось У положительная, Х отрицательная (положение джойстика Слева-Сверху)
          leftSpeed = ((rcu.GetBTModuleRemoteRocker(0, 1) + rcu.GetBTModuleRemoteRocker(0, 0)) / kSpeed)
          rightSpeed = speed
          # То левый мотор включается со скоростью суммы осей У и Х, а правый с максимальной скоростью
      else:
        if (rcu.GetBTModuleRemoteRocker(0, 0) > 0):
          # Если ось У отрицательная, Х положительная (положение джойстика Справа-Снизу)
          leftSpeed = ((rcu.GetBTModuleRemoteRocker(0, 1) + rcu.GetBTModuleRemoteRocker(0, 0)) / kSpeed)
          rightSpeed = -speed
          # То левый мотор включается со скоростью суммы осей У и Х, а правый с максимальной отрицательной скоростью
        else:
          # Если по обеим осям отрицательное значение (положение джойстика Слева-Снизу)
          leftSpeed = -speed
          rightSpeed = ((rcu.GetBTModuleRemoteRocker(0, 1) - rcu.GetBTModuleRemoteRocker(0, 0)) / kSpeed)
          # То левый мотор включается с максимальной отрицательной скоростью, а правый со скоростью разницы осей У и Х
          
    if (((rcu.GetBTModuleRemoteRocker(1, 1) == 999) and (rcu.GetBTModuleRemoteRocker(1, 0) == 999)) or ((rcu.GetBTModuleRemoteRocker(1, 1) == 0) and (rcu.GetBTModuleRemoteRocker(1, 0) == 0))):
      # Если на правом джойстике показания по обеим осям (Х и У) равны 999 или 0, то он в центре
      clawSpeed = 0
      # Поэтому скорость клешни равна 0
      if (motor.GetMotorCode(3) > encoderClaw):
        # Если показания энкодера на клешне больше, чем целевое
        clawSpeed = -3
        # То медленно разжимаем
      else:
        clawSpeed = 3
        # Иначе медленно сжимаем
    else:
      # Иначе читаем показания с джойстика
      if (rcu.GetBTModuleRemoteRocker(1, 1) > 0):
        # Если джойстик поднят вверх
        clawSpeed = 20
        encoderClaw = motor.GetMotorCode(3)
        # То сжимаем клешню и записываем значение энкодера
      else:
        # Если джойстик опущен вниз
        clawSpeed = -20
        encoderClaw = motor.GetMotorCode(3)
        # То разжимаем клешню и записываем значение энкодера
        
    motor.SetMotor(LeftMotor, leftSpeed)
    motor.SetMotor(RightMotor, rightSpeed)
    motor.SetMotor(ClawMotor, clawSpeed)
    # Подаём рассчитанные значения на моторы
    
    timeLCDClear = timeLCDClear + 1
    if (timeLCDClear == 15):
        rcu.SetLCDClear(0x0000)
        timeLCDClear = 0
    # Очищаем экран каждые 15 циклов
    
    rcu.SetDisplayString(1, str(rcu.GetBTModuleRemoteRocker(0, 0)), 0xFFE0, 0x0000)
    rcu.SetDisplayString(3, str(rcu.GetBTModuleRemoteRocker(0, 1)), 0xFFE0, 0x0000)
    rcu.SetDisplayString(5, str(rcu.GetBTModuleRemoteRocker(1, 1)), 0xFFE0, 0x0000)
    # Выводим на экран показания с джойстиков каждые 15 мс
    
    rcu.SetWaitForTime(0.001)
    # Общий таймер на программу

task1()
