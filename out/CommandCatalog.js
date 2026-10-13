"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMANDS = void 0;
const NewCommands_1 = require("./NewCommands");
exports.COMMANDS = {
    ...NewCommands_1.NEW_COMMANDS,
    "motor.SetMotor": {
        "label": "SetMotor()",
        "snippet": "motor.SetMotor(${1:port}, ${2:speed})",
        "description": "Установка скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotor(1, 100)"
    },
    "motor.SetMotorStop": {
        "label": "SetMotorStop()",
        "snippet": "motor.SetMotorStop(${1:port})",
        "description": "Остановка выбранного мотора"
    },
    "motor.SetMotorCode": {
        "label": "SetMotorCode()",
        "snippet": "motor.SetMotorCode(${1:port})",
        "description": "Обнуление энкодера. Параметр - № мотора. Пример: SetMotorCode(1)"
    },
    "motor.GetMotorCode": {
        "label": "GetMotorCode()",
        "snippet": "motor.GetMotorCode(${1:port})",
        "description": "Получение показаний с энкодера. Параметр - № мотора. Пример: GetMotorCode(1)"
    },
    "motor.SetMotorSecond": {
        "label": "SetMotorSecond()",
        "snippet": "motor.SetMotorSecond(${1:port}, ${2:speed}, ${3:secs})",
        "description": "Включение мотора с указанной скоростью на определённое время. Параметры: № мотора, скорость, время. Пример: SetMotorSecond(1, 50, 2)"
    },
    "motor.SetMotorAngleDelay": {
        "label": "SetMotorAngleDelay()",
        "snippet": "motor.SetMotorAngleDelay(${1:port}, ${2:speed}, ${3:angle})",
        "description": "Включение мотора с указанной скоростью до определённого угла поворота с зависанием, пока не достигнут угол. Параметры: № мотора, скорость, угол. Пример: SetMotorAngleDelay(1, 50, 180)"
    },
    "motor.SetMotorConstSpeed": {
        "label": "SetMotorConstSpeed()",
        "snippet": "motor.SetMotorConstSpeed(${1:port}, ${2:speed})",
        "description": "Установка неизменной скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotorConstSpeed(1, 100)"
    },
    "motor.SetMotorAngle": {
        "label": "SetMotorAngle()",
        "snippet": "motor.SetMotorAngle(${1:port}, ${2:speed}, ${3:angle})",
        "description": "Включение мотора с указанной скоростью до определённого угла поворота. Параметры: № мотора, скорость, угол. Пример: SetMotorAngle(1, 50, 180)"
    },
    "motor.SetMotorDirection": {
        "label": "SetMotorDirection()",
        "snippet": "motor.SetMotorDirection(${1:port}, ${2:direction})",
        "description": "Установка вращения мотора в конкретную сторону. Параметры: № мотора, сторона. Пример: SetMotorDirection(1,0)"
    },
    "move.SetMoveRunSecond": {
        "label": "SetMoveRunSecond()",
        "snippet": "move.SetMoveRunSecond(${1:\"forward\"}, ${2:speed}, ${3:secs})",
        "description": "Запуск двух моторов в указанную сторону с выбранной скоростью на определённое время. Пример: SetMoveRunSecond(\"forward\", 50, 1)"
    },
    "move.SetMoveRunAngle": {
        "label": "SetMoveRunAngle()",
        "snippet": "move.SetMoveRunAngle(${1:\"forward\"}, ${2:speed}, ${3:angle})",
        "description": "Запуск двух моторов в указанную сторону с выбранной скоростью на определённый градус поворота. Пример: SetMoveRunAngle(\"forward\", 50, 180)"
    },
    "move.SetMoveRun": {
        "label": "SetMoveRun()",
        "snippet": "move.SetMoveRun(${1:\"forward\"}, ${2:speed})",
        "description": "Запуск двух моторов в указанную сторону с выбранной скоростью. Пример: SetMoveRun(\"forward\", 50)"
    },
    "move.SetMoveStop": {
        "label": "SetMoveStop()",
        "snippet": "move.SetMoveStop()",
        "description": "Остановка моторов. Пример: SetMoveStop( )"
    },
    "move.SetMoveSpeedSecond": {
        "label": "SetMoveSpeedSecond()",
        "snippet": "move.SetMoveSpeedSecond(${1:speedLeft}, ${2:speedRight}, ${3:secs})",
        "description": "Запуск двух моторов с разной скоростью на определённое время. Пример: SetMoveSpeedSecond(30, 50, 1)"
    },
    "move.SetMoveSpeed": {
        "label": "SetMoveSpeed()",
        "snippet": "move.SetMoveSpeed(${1:speedLeft}, ${2:speedRight})",
        "description": "Запуск двух моторов с разной скоростью. Пример: SetMoveSpeed(30, 50)"
    },
    "move.SetMovePower": {
        "label": "SetMovePower()",
        "snippet": "move.SetMovePower(${1:powerLeft}, ${2:powerRight})",
        "description": "Запуск двух моторов с разной мощностью. Пример: SetMovePower(10, 80)"
    },
    "move.SetMotorPower": {
        "label": "SetMotorPower()",
        "snippet": "move.SetMotorPower(${1:power1}, ${2:power2}, ${3:power3}, ${4:power4})",
        "description": "Запуск четырёх моторов с разной мощностью. Пример: SetMotorPower(10, 80, 20, 70)"
    },
    "move.SetMoveInitialize": {
        "label": "SetMoveInitialize()",
        "snippet": "move.SetMoveInitialize(${1:portLeft}, ${2:portRight}, ${3:reversMotors})",
        "description": "Инициализация моторов для использования остальных команд этого раздела. Ставится в начале программы. Параметры: № левого мотора, № правого мотора, реверс. Пример: SetMoveInitialize(1, 2, \"no_reversal\")"
    },
    "servo.SetSeeringEngine": {
        "label": "SetSeeringEngine()",
        "snippet": "servo.SetSeeringEngine(${1:channel}, ${2:angle})",
        "description": "Установить маленький серовпривод в указанное положение. Параметры: канал, угол."
    },
    "servo.SetSeeringEngineTime": {
        "label": "SetSeeringEngineTime()",
        "snippet": "servo.SetSeeringEngineTime(${1:channel}, ${2:angle}, ${3:time})",
        "description": "Установить маленький серовпривод в указанное положение по времени. Параметры: канал, угол, время."
    },
    "servo.SetServoMotor": {
        "label": "SetServoMotor()",
        "snippet": "servo.SetServoMotor(${1:channel}, ${2:angle})",
        "description": "Повернуть маленький серовпривод на определённый угол. Параметры: канал, угол."
    },
    "servo.SetServo": {
        "label": "SetServo()",
        "snippet": "servo.SetServo(${1:channel}, ${2:angle})",
        "description": "Установить обычный серовпривод в указанное положение. Параметры: канал, угол."
    },
    "servo.SetServoTime": {
        "label": "SetServoTime()",
        "snippet": "servo.SetServoTime(${1:channel}, ${2:angle}, ${3:time})",
        "description": "Установить обычный серовпривод в указанное положение по времени. Параметры: канал, угол, время."
    },
    "servo.SetMagneticServoSoftReset": {
        "label": "SetMagneticServoSoftReset()",
        "snippet": "servo.SetMagneticServoSoftReset(${1:port})",
        "description": "Мягкая перезагрузка сервопривода. Параметры: порт"
    },
    "servo.SetMagneticServoState": {
        "label": "SetMagneticServoState()",
        "snippet": "servo.SetMagneticServoState(${1:port}, ${2:res?}, ${3:speed}, ${4:angle})",
        "description": "Установка состояния сервопривода. Параметры: порт, перезапуск при включении(1/0), начальная скорость, начальный угол "
    },
    "servo.SetMagneticServoDegreeTime": {
        "label": "SetMagneticServoDegreeTime()",
        "snippet": "servo.SetMagneticServoDegreeTime(${1:port}, ${2:angle}, ${3:time})",
        "description": "Режим сервопривода. Параметры: порт, угол, время."
    },
    "servo.SetMagneticServoDegreeSpeed": {
        "label": "SetMagneticServoDegreeSpeed()",
        "snippet": "servo.SetMagneticServoDegreeSpeed(${1:port}, ${2:angle}, ${3:speed})",
        "description": "Режим сервопривода. Параметры: порт, угол, скорость."
    },
    "servo.SetMagneticServoCodeMotor": {
        "label": "SetMagneticServoCodeMotor()",
        "snippet": "servo.SetMagneticServoCodeMotor(${1:port}, ${2:angle}, ${3:speed})",
        "description": "Режим управления по энкодеру. Параметры: порт, угол, скорость."
    },
    "servo.SetMagneticServoMotor": {
        "label": "SetMagneticServoMotor()",
        "snippet": "servo.SetMagneticServoMotor(${1:port}, ${2:speed})",
        "description": "Режим мотор-редуктора. Параметры: порт, скорость."
    },
    "servo.SetMagneticServoPowerDown": {
        "label": "SetMagneticServoPowerDown()",
        "snippet": "servo.SetMagneticServoPowerDown(${1:port})",
        "description": "Остановка выходного крутящего момента. Параметры: порт."
    },
    "servo.GetMagneticServoDegree": {
        "label": "GetMagneticServoDegree()",
        "snippet": "servo.GetMagneticServoDegree(${1:port})",
        "description": "Считать угол сервопривода. Параметры: порт."
    },
    "servo.SetMagneticServoEncoder": {
        "label": "SetMagneticServoEncoder()",
        "snippet": "servo.SetMagneticServoEncoder(${1:port})",
        "description": "Сбросить показания энкодера. Параметры: порт."
    },
    "servo.GetMagneticServoEncoder": {
        "label": "GetMagneticServoEncoder()",
        "snippet": "servo.GetMagneticServoEncoder(${1:port})",
        "description": "Прочитать показания энкодера. Параметры: порт."
    },
    "rcu.SetWaitForTime": {
        "label": "Wait()",
        "snippet": "rcu.SetWaitForTime(${1:time})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetLeftButton": {
        "label": "GetLeftButton()",
        "snippet": "rcu.GetLeftButton()",
        "description": "Чтение состояния левой кнопки. Пример: GetLeftButton()"
    },
    "rcu.GetRightButton": {
        "label": "GetRightButton()",
        "snippet": "rcu.GetRightButton()",
        "description": "Чтение состояния правой кнопки. Пример: GetRightButton()"
    },
    "rcu.WaitLeftButtonPressed": {
        "label": "WaitLeftButtonPressed()",
        "snippet": "rcu.WaitLeftButtonPressed()",
        "description": "Ожидание нажатия левой кнопки. Пример: WaitLeftButtonPressed()"
    },
    "rcu.WaitRightButtonPressed": {
        "label": "WaitRightButtonPressed()",
        "snippet": "rcu.WaitRightButtonPressed()",
        "description": "Ожидание нажатия правой кнопки. Пример: WaitRightButtonPressed()"
    },
    "rcu.WaitRightButtonReleased": {
        "label": "WaitRightButtonReleased()",
        "snippet": "rcu.WaitRightButtonReleased()",
        "description": "Ожидание отпускания правой кнопки. Пример: WaitRightButtonReleased()"
    },
    "rcu.WaitLeftButtonReleased": {
        "label": "WaitLeftButtonReleased()",
        "snippet": "rcu.WaitLeftButtonReleased()",
        "description": "Ожидание отпускания левой кнопки. Пример: WaitLeftButtonReleased()"
    },
    "rcu.SetRcuStop": {
        "label": "SetRcuStop()",
        "snippet": "rcu.SetRcuStop()",
        "description": "Остановка всех функций"
    },
    "rcu.GetRandom": {
        "label": "GetRandom()",
        "snippet": "rcu.GetRandom(${1:min}, ${2:max})",
        "description": "Генерация случайного числа в указанном диапазоне"
    },
    "rcu.GetRGB": {
        "label": "GetRGB()",
        "snippet": "rcu.GetRGB(${1:red}, ${2:green}, ${3:blue})",
        "description": " Задайте три цвета в диапазоне от 0 до 255 и получите любой оттенок"
    },
    "rcu.GetMcuID": {
        "label": "GetMcuID()",
        "snippet": "rcu.GetMcuID()",
        "description": "Получить идентификатор чипа контроллера"
    },
    "rcu.GetSysVersion": {
        "label": "GetSysVersion()",
        "snippet": "rcu.GetSysVersion()",
        "description": "Получить номер версии прошивки контроллера"
    },
    "rcu.GetSysLanguage": {
        "label": "GetSysLanguage()",
        "snippet": "rcu.GetSysLanguage()",
        "description": "Получить язык системы контроллера"
    },
    "rcu.SetSysTime": {
        "label": "SetSysTime()",
        "snippet": "rcu.SetSysTime()",
        "description": "Обнуление встроенного таймера программы. Пример: SetSysTime()"
    },
    "rcu.GetSysTime": {
        "label": "GetSysTime()",
        "snippet": "rcu.GetSysTime()",
        "description": "Чтение времени от начала программы. Пример: GetSysTime()"
    },
    "rcu.GetInMic": {
        "label": "GetInMic()",
        "snippet": "rcu.GetInMic()",
        "description": "Чтение уровня громкости микрофона. Пример: GetInMic()"
    },
    "rcu.SetData": {
        "label": "SetData()",
        "snippet": "rcu.SetData(${1:address}, ${2:data})",
        "description": "Запись данных по адресу. Параметры: адрес, данные. Пример: SetData(50, 50)"
    },
    "rcu.GetData": {
        "label": "GetData()",
        "snippet": "rcu.GetData(${1:address})",
        "description": "Чтение данных по адресу. Параметр: адрес. Пример: GetData(50)"
    },
    "rcu.SetUartData": {
        "label": "SetUartData()",
        "snippet": "rcu.SetUartData(${1:port}, ${2:speed})",
        "description": "Отправка Serial-данных. Параметры: данные, скорость в бод. Пример: SetUartData(255, 9600)"
    },
    "rcu.GetUartData": {
        "label": "GetUartData()",
        "snippet": "rcu.GetUartData(${1:speed})",
        "description": "Получение Serial-данных. Параметр: скорость в бод. Пример: GetUartData(9600)"
    },
    "rcu.GetInVotage": {
        "label": "GetInVoltage()",
        "snippet": "rcu.GetInVotage()",
        "description": "Чтение уровня напряжения батареи. Пример: GetInVoltage()"
    },
    "rcu.SetInSound": {
        "label": "SetInSound()",
        "snippet": "rcu.SetInSound(${1:1047}, ${2:5})",
        "description": "Установка частоты звука в Гц. Параметры: частота в Гц, длительность в мс. Пример: SetInSound(512, 500)"
    },
    "rcu.SetInBeep": {
        "label": "SetInBeep()",
        "snippet": "rcu.SetInBeep(${1:0})",
        "description": "Включение/выключение зуммера. Параметр: 0 - выключить, 1 - включить. Пример: SetInBeep(1)"
    },
    "rcu.SoundStartBeep": {
        "label": "SoundStartBeep()",
        "snippet": "rcu.SoundStartBeep(${1:1})",
        "description": "1 - light, 2 - siren, 3 - deep"
    },
    "rcu.SetMp3Play": {
        "label": "SetMp3Play()",
        "snippet": "rcu.SetMp3Play(${1:folder}, ${2:file})",
        "description": "Включение конкретного звука. Параметры: папка, файл. В папке 1 есть 14 встроенных звуков. Можно создавать свои папки и загружать свои звуки. Пример: SetMp3Play(2, 3)"
    },
    "rcu.SoundMp3": {
        "label": "SoundMp3()",
        "snippet": "rcu.SoundMp3(${1:folder}, ${2:file}, ${3:secs})",
        "description": "Включение конкретного звука на указанное время. Параметры: папка, файл, время в секундах"
    },
    "rcu.SetMp3Suspend": {
        "label": "SetMp3Suspend()",
        "snippet": "rcu.SetMp3Suspend()",
        "description": "Остановить музыку. Пример: SetMp3Suspend()"
    },
    "rcu.SetMp3Sound": {
        "label": "SetMp3Sound()",
        "snippet": "rcu.SetMp3Sound(${1:volume})",
        "description": "Установка громкости. Параметр: громкость (0-28). Пример: SetMp3Sound(28)"
    },
    "sensor.Set3CLed": {
        "label": "Set3CLED()",
        "snippet": "sensor.Set3CLed(${1:port}, ${2:color})",
        "description": "Управление лампой. Параметры: порт, цвет (0-7). Цвета: Выкл, Красный, Зеленый, Синий, Жёлтый, Фиолетовый, Голубой, Белый. Пример: Set3CLED(4, 6)"
    },
    "sensor.SetLightSensorLed": {
        "label": "SetLightSensorLED()",
        "snippet": "sensor.SetLightSensorLed(${1:port}, ${2|0,1|})",
        "description": "Включение/выключение подсветки на датчике света. Параметры: порт, 0/1. Пример: SetLightSensorLED(3, 1)"
    },
    "sensor.GetLightSensorData": {
        "label": "GetLightSensorData()",
        "snippet": "sensor.GetLightSensorData(${1:port})",
        "description": "Получение показаний датчика света ниже порогового значения. Параметр: порт. Пример: GetLightSensorData(4)"
    },
    "sensor.GetLightSensor": {
        "label": "GetLightSensor()",
        "snippet": "sensor.GetLightSensor(${1:port})",
        "description": "Получение показаний с датчика света. Параметр: порт. Пример: GetLightSensor(4)"
    },
    "sensor.GetColorSensor": {
        "label": "GetColorSensor()",
        "snippet": "sensor.GetColorSensor(${1:port}, ${2:mode})",
        "description": "Получение показаний с датчика цвета. Параметры: порт, режим. Режимы: 1-G, 2-R, 3-B, 4-Color, 9-Light, 15-Hue, 16-Saturation, 17-Luminance. Пример: GetColorSensor(5, 1)"
    },
    "sensor.GetTouch": {
        "label": "GetTouch()",
        "snippet": "sensor.GetTouch(${1:port})",
        "description": "Проверка нажатия кнопки. Параметр: порт. Пример: GetTouch(2)"
    },
    "sensor.GetUltrasound": {
        "label": "GetUltrasound()",
        "snippet": "sensor.GetUltrasound(${1:port})",
        "description": "Получение показаний с УЗ датчика расстояния (в см). Параметр: порт. Пример: GetUltrasound(5)"
    },
    "sensor.SetUltrasoundled": {
        "label": "SetUltrasoundled()",
        "snippet": "sensor.SetUltrasoundled(${1:port}, ${2:mode})",
        "description": "Установка цвета УЗ датчика расстояния. Параметр: порт, цвет. Пример: SetUltrasoundled(1, 1)"
    },
    "sensor.GetShortIRDist": {
        "label": "GetShortIRDist()",
        "snippet": "sensor.GetShortIRDist(${1:port})",
        "description": "Получение показаний с ИК датчика расстояния. Параметр: порт. Пример: GetShortIRDist(8)"
    },
    "sensor.GetLaserDist": {
        "label": "GetLaserDist()",
        "snippet": "sensor.GetLaserDist(${1:port}, ${2:mode})",
        "description": "Получение показаний с лазерного датчика расстояния (в мм). Параметры: порт, режим (обычный/большая дальность). Пример: GetLaserDist(7)"
    },
    "sensor.SetAHRS": {
        "label": "SetAHRS()",
        "snippet": "sensor.SetAHRS(${1:port}, ${2:mode})",
        "description": "Калибровка гироскопа. Параметры: порт, режим (1/2). Пример: SetAHRS(2, 1)"
    },
    "sensor.GetAHRS": {
        "label": "GetAHRS()",
        "snippet": "sensor.GetAHRS(${1:port}, ${2:mode}, ${3:axis})",
        "description": "Получение показаний с гироскопа. Параметры: порт, режим, пустой. Режимы: 1-крен, 2-наклон, 3-рысканье, 4-aX, 5-aY, 6-aZ, 7-gX, 8-gY, 9-gZ. Пример: GetAHRS(2, 3, 0)"
    },
    "Create_object_gyro": {
        "label": "Create object gyro",
        "snippet": "# === Инициализация гироскопа ===\ngyro = gyro_lib.Gyro(${1:port})\ngyro.CalibrateGyro()\n# ================================\n$0",
        "description": "Создание объекта для управления гироскопом и калибровка гироскопа"
    },
    "gyro.ReadGyro": {
        "label": "ReadGyro()",
        "snippet": "gyro.ReadGyro()",
        "description": "Получение показаний с гироскопа"
    },
    "sensor.GetGesture": {
        "label": "GetGesture()",
        "snippet": "sensor.GetGesture(${1:port})",
        "description": "Определяет жесты и возвращает соответствующее значение."
    },
    "sensor.GetAirPressure": {
        "label": "GetAirPressure()",
        "snippet": "sensor.GetAirPressure(${1:port})",
        "description": "Измеряет давление окружающего воздуха и возвращает соответствующее значение"
    },
    "sensor.GetSht30": {
        "label": "GetSht30()",
        "snippet": "sensor.GetSht30(${1:port}, ${2:mode})",
        "description": "Измеряет температуру и влажность окружающей среды и возвращает соответствующее значение"
    },
    "sensor.GetMagnetic": {
        "label": "GetMagnetic()",
        "snippet": "sensor.GetMagnetic(${1:port}, ${2:mode})",
        "description": "Возвращает силу и направление магнитного поля"
    },
    "sensor.SetSmartEyeMode": {
        "label": "SetSmartEyeMode()",
        "snippet": "sensor.SetSmartEyeMode(${1:port}, ${2:mode}, ${3:color})",
        "description": "Установка режима работы Умного глаза"
    },
    "sensor.SetSmartEyeAllLed": {
        "label": "SetSmartEyeAllLed()",
        "snippet": "sensor.SetSmartEyeAllLed(${1:port}, ${2:color1}, ${3:color2}, ${4:color3}, ${5:color4}, ${6:color5}, ${7:color6}, ${8:color7}, ${9:color8})",
        "description": "Ручная установка цветов на Умном глазе"
    },
    "sensor.SetSmartEyeIRcode": {
        "label": "SetSmartEyeIRcode()",
        "snippet": "sensor.SetSmartEyeIRcode(${1:port}, ${2:code})",
        "description": "Передачи ИК сигнала через Умный глаз"
    },
    "sensor.GetSmartEyeIRcode": {
        "label": "GetSmartEyeIRcode()",
        "snippet": "sensor.GetSmartEyeIRcode(${1:port})",
        "description": "Получение ИК сигнала через Умный глаз"
    },
    "sensor.GetSmartEyeDist": {
        "label": "GetSmartEyeDist()",
        "snippet": "sensor.GetSmartEyeDist(${1:port})",
        "description": "Получение расстояния до объекта, испускающего или получающего ИК сигнал"
    },
    "trace.GetTraceV2I2C": {
        "label": "GetTraceV2I2C()",
        "snippet": "trace.GetTraceV2I2C(${1:port}, ${2:sensor})",
        "description": "Получение показаний с линейки датчиков света. Параметры: порт, целевой датчик  (1-7). Пример: GetTraceV2I2C(7, 1)"
    },
    "trace.GetTraceV2I2CState": {
        "label": "GetTraceV2I2CState()",
        "snippet": "trace.GetTraceV2I2CState(${1:port}, ${2:sensor})",
        "description": "Проверка состояний с линейки датчиков. Параметры: порт, целевой датчик (1-7). Пример: GetTraceV2I2CState(7, 2)"
    },
    "trace.GetTraceV2I2CChxState": {
        "label": "GetTraceV2I2CChxState()",
        "snippet": "trace.GetTraceV2I2CChxState(${1:port}, ${2:state})",
        "description": "Проверка обнаружения чёрной линии различными датчиками. Параметры: порт, состояния. Пример: GetTraceV2I2CChxState(7, 1)"
    },
    "trace.SetTraceV2I2AllColor": {
        "label": "SetTraceV2I2AllColor()",
        "snippet": "trace.SetTraceV2I2AllColor(${1:port}, ${2:color})",
        "description": "Включение подсветки на всей линейке датчиков. Параметры: порт, цвет. Пример: SetTraceV2I2AllColor(7, 3)"
    },
    "trace.SetTraceV2I2Color": {
        "label": "SetTraceV2I2Color()",
        "snippet": "trace.SetTraceV2I2Color(${1:port}, ${2:color1}, ${3:color2}, ${4:color3}, ${5:color4}, ${6:color5}, ${7:color6}, ${8:color7})",
        "description": "Включение подсветки на каждом из датчиков линейки. Параметры: порт, цвета для каждого датчика. Пример: SetTraceV2I2Color(7, 1, 2, 4, 4, 3, 2, 1)"
    },
    "trace.SetTraceV2I2Threshold": {
        "label": "SetTraceV2I2Threshold()",
        "snippet": "trace.SetTraceV2I2Threshold(${1:port}, ${2:time})",
        "description": "Автоматическая установка порога на заданное время. Параметры: порт, время (сек). Пример: SetTraceV2I2Threshold(7, 5)"
    },
    "trace.LineSetInitialize": {
        "label": "LineSetInitialize()",
        "snippet": "trace.LineSetInitialize(${1:port}, ${2:\"black\"}, ${3:\"wheeledchassis\"})",
        "description": "Инициализация линейки датчиков света. Устанавливается в начале программы. Параметры: порт, цвет линии, тип колёс. Пример: LineSetInitialize(1,\"black\",\"wheeledchassis\")"
    },
    "trace.LineIntersectionStop": {
        "label": "LineIntersectionStop()",
        "snippet": "trace.LineIntersectionStop(${1:speed}, ${2:intersectionType})",
        "description": "Движение по линии на заданной скорости до перекрёстка определённого типа. Пример: LineIntersectionStop(70, 17)"
    },
    "trace.LineMillisecond": {
        "label": "LineMillisecond()",
        "snippet": "trace.LineMillisecond(${1:speed}, ${2:time})",
        "description": "Движение по линии на заданной скорости определённое время. Пример: LineMillisecond(70, 1500)"
    },
    "trace.LineForBmp": {
        "label": "LineForBmp()",
        "snippet": "trace.LineForBmp(${1:speed}, ${2:encoder})",
        "description": "Движение по линии на заданной скорости до угла поворота энкодера. Пример: LineMillisecond(70, 360)"
    },
    "trace.LineTurnEncounterline": {
        "label": "LineTurnEncounterline()",
        "snippet": "trace.LineTurnEncounterline(${1:speedLeft}, ${2:speedRight}, ${3:sensorNumber})",
        "description": "Поворот по линейке датчиков, пока конкретный датчик не увидит линию. Параметры: скорость слева, скорость спарва, № датчика. Пример: LineTurnEncounterline(70, 20, 7)"
    },
    "trace.LineBasis": {
        "label": "LineBasis()",
        "snippet": "trace.LineBasis(${1:speed})",
        "description": "Движение по линии на заданной скорости. Параметры: скорость. Пример: LineBasis(70)"
    },
    "ai.SetAICamData": {
        "label": "SetAICamData()",
        "snippet": "ai.SetAICamData(${1:mode}, ${2:0})",
        "description": "Эта функция имеет множество применений. СМ подробную инструкцию."
    },
    "ai.SetWaitForAICamData": {
        "label": "SetWaitForAICamData()",
        "snippet": "ai.SetWaitForAICamData(${1:mode}, ${2:0})",
        "description": "Ожидание переключения камеры в установленный режим."
    },
    "ai.SetAICamLED": {
        "label": "SetAICamLED()",
        "snippet": "ai.SetAICamLED(${1:1})",
        "description": "Включение/выключение подсветки на камере. Пример: SetAICamLED(1)"
    },
    "ai.GetAICamData": {
        "label": "GetAICamData()",
        "snippet": "ai.GetAICamData(${1:mode})",
        "description": "Эта функция имеет множество применений. СМ подробную инструкцию."
    },
    "ai.GetAICamVoice": {
        "label": "GetAICamVoice()",
        "snippet": "ai.GetAICamVoice(${1:commandNumber})",
        "description": "Получить инструкции по распознаванию голоса. Параметр: № инструкции. Пример: GetAICamVoice(1023)"
    },
    "rcu.GetTouchScreen": {
        "label": "GetTouchScreen()",
        "snippet": "rcu.GetTouchScreen()",
        "description": "Проверка касания экрана. Пример: GetTouchScreen()"
    },
    "rcu.GetTouchScreenX": {
        "label": "GetTouchScreenX()",
        "snippet": "rcu.GetTouchScreenX()",
        "description": "Получение X-координаты касания экрана. Пример: GetTouchScreenX()"
    },
    "rcu.GetTouchScreenY": {
        "label": "GetTouchScreenY()",
        "snippet": "rcu.GetTouchScreenY()",
        "description": "Получение Y-координаты касания экрана. Пример: GetTouchScreenY()"
    },
    "rcu.SetLCDClear": {
        "label": "SetLCDClear()",
        "snippet": "rcu.SetLCDClear(${1:0x0000})",
        "description": "Очистка экрана выбранным цветом. Параметр: цвет в шестнадцатиричной системе. Пример: SetLCDClear(0x0000)"
    },
    "rcu.SetFontSize": {
        "label": "SetFontSize()",
        "snippet": "rcu.SetFontSize(${1:0})",
        "description": "Установка размера шрифта. Параметр: размер (0-4). Пример: SetFontSize(2)"
    },
    "rcu.SetDisplayVar": {
        "label": "SetDisplayVar()",
        "snippet": "rcu.SetDisplayVar(${1:line}, ${2:number}, ${3:textColor}, ${4:bgColor})",
        "description": "Вывод числа в строке. Параметры: строка, число, цвет текста, цвет фона. Пример: SetDisplayVar(1, 10, 0xFFE0, 0x0000)"
    },
    "rcu.SetDisplayString": {
        "label": "SetDisplayString()",
        "snippet": "rcu.SetDisplayString(${1:1}, ${2:\"text = \" + str(var)}, ${3:0xFFE0}, ${4:0x0000})",
        "description": "Вывод текста в строке. Параметры: строка, \"текст\", цвет текста, цвет фона. Вместо текста могут быть и числа. Пример: rcu.SetDisplayString(1,str(5 + 3),0xFFE0,0x0000). Пример2 : rcu.SetDisplayString(1,str(\"\".join((\"Speed = \",str(50)))),0xFFE0,0x0000)"
    },
    "rcu.SetDisplayPicture": {
        "label": "SetDisplayPicture()",
        "snippet": "rcu.SetDisplayPicture(${1:x}, ${2:y}, ${3:\"image.jpg\"}, ${4:scale})",
        "description": "Вывод картинки на экран в заданных координатах. Параметры: x, y, картинка, масштаб. Пример: SetDisplayPicture(10, 10, \"a.jpg\", 0)"
    },
    "rcu.SetDisplayVarXY": {
        "label": "SetDisplayVarXY()",
        "snippet": "rcu.SetDisplayVarXY(${1:x}, ${2:y}, ${3:number}, ${4:textColor}, ${5:bgColor})",
        "description": "Вывод числа на экран в заданных координатах. Параметры: x, y, число, цвет текста, цвет фона. Пример: SetDisplayVarXY(1, 1, 10, 0xFFE0, 0x0000)"
    },
    "rcu.SetDisplayStringXY": {
        "label": "SetDisplayStringXY()",
        "snippet": "rcu.SetDisplayStringXY(${1:x}, ${2:y}, ${3:\"text\"}, ${4:textColor}, ${5:bgColor}, ${6:scale})",
        "description": "Вывод текста на экран в заданных координатах. Параметры: x, y, \"текст\", цвет текста, цвет фона. Пример: SetDisplayStringXY(1, 1, \"Hello\", 0xFFE0, 0x0000, 1)"
    },
    "rcu.SetDisplayVarU32": {
        "label": "SetDisplayVarU32()",
        "snippet": "rcu.SetDisplayVarU32(${1:line}, ${2:number}, ${3:textColor}, ${4:bgColor})",
        "description": "Вывод 10-значного числа на экран в строке. Параметры: строка, число, цвет текста, цвет фона. Пример: SetDisplayVarU32(1, 1234567890, 0xFFE0, 0x0000)"
    },
    "rcu.SetLCDDot": {
        "label": "SetLCDDot()",
        "snippet": "rcu.SetLCDDot(${1:x}, ${2:y}, ${3:color})",
        "description": "Нарисовать точку по координатам. Параметры: x, y, цвет. Пример: SetLCDDot(10, 10, 0xFFE0)"
    },
    "rcu.SetLCDSolidCircle": {
        "label": "SetLCDSolidCircle()",
        "snippet": "rcu.SetLCDSolidCircle(${1:x}, ${2:y}, ${3:radius}, ${4:color})",
        "description": "Нарисовать круг по координатам. Параметры: x, y, радиус, цвет. Пример: SetLCDSolidCircle(10, 10, 5, 0xFFE0)"
    },
    "rcu.SetLCDLine": {
        "label": "SetLCDLine()",
        "snippet": "rcu.SetLCDLine(${1:x1}, ${2:y1}, ${3:angle}, ${4:length}, ${5:color})",
        "description": "Нарисовать линию по координатам. Параметры: x, y, угол, длина, цвет. Пример: SetLCDLine(10, 10, 45, 10, 0xFFE0)"
    },
    "rcu.SetLCDFilledRectangle2": {
        "label": "SetLCDFilledRectangle2()",
        "snippet": "rcu.SetLCDFilledRectangle2(${1:x}, ${2:y}, ${3:width}, ${4:height}, ${5:color})",
        "description": "Нарисовать сплошной прямоугольник по координатам. Параметры: x, y, ширина, высота, цвет. Пример: SetLCDFilledRectangle2(10, 10, 50, 50, 0xFFE0)"
    },
    "rcu.SetLCDRectangle2": {
        "label": "SetLCDRectangle2()",
        "snippet": "rcu.SetLCDRectangle2(${1:x}, ${2:y}, ${3:width}, ${4:height}, ${5:thickness}, ${6:color})",
        "description": "Нарисовать прямоугольник по координатам. Параметры: x, y, ширина, высота, толщина линии, цвет. Пример: SetLCDRectangle2(10, 10, 50, 50, 2, 0xFFE0)"
    },
    "rcu.SetBluetoothData": {
        "label": "SetBluetoothData()",
        "snippet": "rcu.SetBluetoothData(${1:data})",
        "description": "Передать данные с контроллера. Параметр: данные. Пример: SetBluetoothData(50)"
    },
    "rcu.GetBluetoothData": {
        "label": "GetBluetoothData()",
        "snippet": "rcu.GetBluetoothData()",
        "description": "Получить данные по Bluetooth. Пример: GetBluetoothData()"
    },
    "rcu.GetBluetoothControl": {
        "label": "GetBluetoothControl()",
        "snippet": "rcu.GetBluetoothControl()",
        "description": "Получить код ключа. Пример: GetBluetoothControl()"
    },
    "rcu.GetBluetoothControlData": {
        "label": "GetBluetoothControlData()",
        "snippet": "rcu.GetBluetoothControlData()",
        "description": "Получить ключ телефона. Пример: GetBluetoothControlData()"
    },
    "rcu.GetBTModuleRemoteButton": {
        "label": "GetBTModuleRemoteButton()",
        "snippet": "rcu.GetBTModuleRemoteButton()",
        "description": "Получить значение ключа Bluetooth-пульта. Пример: GetBTModuleRemoteButton()"
    },
    "rcu.GetBTModuleRemoteCode": {
        "label": "GetBTModuleRemoteCode()",
        "snippet": "rcu.GetBTModuleRemoteCode()",
        "description": "Получить код ключа Bluetooth-пульта. Пример: GetBTModuleRemoteCode()"
    },
    "rcu.GetBTModuleRemoteRocker": {
        "label": "GetBTModuleRemoteRocker()",
        "snippet": "rcu.GetBTModuleRemoteRocker(${1:direction}, ${2:axis})",
        "description": "Получить направление джойстика Bluetooth-пульта. Параметры: джойстик (0/1), ось (0/1). Пример: GetBTModuleRemoteRocker(0, 1)"
    },
    "rcu.GetComVoice": {
        "label": "GetComVoice()",
        "snippet": "rcu.GetComVoice(${1:\"text\"})",
        "description": "Голосовая команда. Параметр: текст. Пример: GetComVoice(\"Hello\")"
    },
    "rcu.SetMotorH": {
        "label": "SetMotor()",
        "snippet": "rcu.SetMotor(${1:port}, ${2:speed})",
        "description": "Установка скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotor(1, 100)"
    },
    "rcu.StopMotorH": {
        "label": "StopMotor()",
        "snippet": "rcu.StopMotor(${1:port})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetMotorCodeH": {
        "label": "SetMotorCode()",
        "snippet": "rcu.SetMotorCode(${1:port})",
        "description": "Обнуление энкодера. Параметр - № мотора. Пример: SetMotorCode(1)"
    },
    "rcu.GetMotorCodeH": {
        "label": "GetMotorCode()",
        "snippet": "rcu.GetMotorCode(${1:port})",
        "description": "Получение показаний с энкодера. Параметр - № мотора. Пример: GetMotorCode(1)"
    },
    "rcu.WaitMotorTo": {
        "label": "WaitMotorTo()",
        "snippet": "rcu.WaitMotorTo(${1:port}, ${2:percent}, ${3:num}, ${4:type})",
        "description": "Ожидание поворота мотора с указанной скоростью на определённое число по одному из параметров(обороты, градусы, секнуды). Параметры: № мотора, скорость, число, параметр. Пример: WaitMotorTo(1, 50, 1, 1)"
    },
    "rcu.SetMotorVByOther": {
        "label": "SetMotorVByOther()",
        "snippet": "rcu.SetMotorVByOther(${1:port}, ${2:percent}, ${3:num}, ${4:type})",
        "description": "Включение мотора с указанной скоростью на определённое число по одному из параметров(обороты, градусы, секнуды). Параметры: № мотора, скорость, число, параметр. Пример: SetMotorVByOther(1, 50, 1, 1)"
    },
    "rcu.GetMotorV": {
        "label": "GetMotorV()",
        "snippet": "rcu.GetMotorV(${1:port})",
        "description": "Получение скорости мотора. Параметры: № мотора. Пример: GetMotorV(1)"
    },
    "rcu.GetMotorAngleH": {
        "label": "GetMotorAngle()",
        "snippet": "rcu.GetMotorAngle(${1:port})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetSteeringAngle": {
        "label": "SetSteeringAngle()",
        "snippet": "rcu.SetSteeringAngle(${1:port}, ${2:type}, ${3:degree}, ${4:seconds})",
        "description": "Установить вращение мотора по указанному направлению. Параметры: № мотора, направление, угол, время. Пример: SetSteeringAngle(1, 2, 50, 3)"
    },
    "rcu.SetStartMotorLorR": {
        "label": "SetStartMotorLorR()",
        "snippet": "rcu.SetStartMotorLorR(${1:portL}, ${2:portR})",
        "description": "Установка портов для робота. Параметры: левый мотор, правый мотор. Пример: SetStartMotorLorR(1, 2)"
    },
    "rcu.SetMotorsByTime": {
        "label": "SetMotorsByTime()",
        "snippet": "rcu.SetMotorsByTime(${1:speed}, ${2:sec})",
        "description": "Движение с заданной скоростью указанное время. Параметры: скорость, время. Пример: SetMotorsByTime(50, 1)"
    },
    "rcu.SetMotors": {
        "label": "SetMotors()",
        "snippet": "rcu.SetMotors(${1:speed})",
        "description": "Движение с заданной скоростью. Параметры: скорость. Пример: SetMotors(70)"
    },
    "rcu.SetMotorsByLength": {
        "label": "SetMotorsByLength()",
        "snippet": "rcu.SetMotorsByLength(${1:speed}, ${2:cm})",
        "description": "Движение с заданной скоростью на указанное расстояние. Параметры: скорость, расстояние. Пример: SetMotorsByLength(50, 100)"
    },
    "rcu.SetOneCircleSize": {
        "label": "SetOneCircleSize()",
        "snippet": "rcu.SetOneCircleSize(${1:SizeWheelInCm})",
        "description": "Установка длины окружности шин. Параметры: см. Пример: SetOneCircleSize(20.7)"
    },
    "rcu.SetMotorsAngle": {
        "label": "SetMotorsAngle()",
        "snippet": "rcu.SetMotorsAngle(${1:speed}, ${2:side(1/2)}, ${3:sec})",
        "description": "Поворот в указанную сторону с указанной скоростью в течении определенного времени. Параметры: скорость, сторона, время. Пример: SetMotorsAngle(50, 1, 2)"
    },
    "rcu.StopMotorRun": {
        "label": "StopMotorRun()",
        "snippet": "rcu.StopMotorRun(${1:speedL}, ${2:speedR}, ${3:sec})",
        "description": "Остановка движения. Пример: StopMotorRun()"
    },
    "rcu.WaitMotorByPercent": {
        "label": "WaitMotorByPercent()",
        "snippet": "rcu.WaitMotorByPercent(${1:speedL}, ${2:speedR})",
        "description": "Движение каждого мотора с указанной скоростью в течении определенного времени. Параметры: скороть правого мотора, скорость левого мотора, время. Пример: WaitMotorByPercent(50, -50, 5)"
    },
    "rcu.SetMotorByPercent": {
        "label": "SetMotorByPercent()",
        "snippet": "rcu.SetMotorByPercent(${1:port}, ${2:speed})",
        "description": "Установка скорости каждого из моторов. Параметры: скороть правого мотора, скорость левого мотора. Пример: SetMotorByPercent(50, 20)"
    },
    "rcu.Set3CLedH": {
        "label": "Set3CLed()",
        "snippet": "rcu.Set3CLed(${1:port}, ${2:color})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLightByRGB": {
        "label": "SetLightByRGB()",
        "snippet": "rcu.SetLightByRGB(${1:port}, ${2:R}, ${3:G}, ${4:B})",
        "description": "Включение подсветки датчика цвета. Параметры: красный, зеленый, синий. Пример: SetLightByRGB(5, 50, 250)"
    },
    "rcu.SetElcLightIfData": {
        "label": "SetElcLightIfData()",
        "snippet": "rcu.SetElcLightIfData(${1:port}, ${2:threshold})",
        "description": "Усановка порога срабатывания для датчика света. Параметры: порт, порог. Пример: SetElcLightIfData(1, 1000)"
    },
    "rcu.WaitNewColor": {
        "label": "WaitNewColor()",
        "snippet": "rcu.WaitNewColor(${1:port})",
        "description": "Ожидание нового цвета. Параметры: порт. Пример: WaitNewColor(1)"
    },
    "rcu.WaitThisColor": {
        "label": "WaitThisColor()",
        "snippet": "rcu.WaitThisColor(${1:port}, ${2:color})",
        "description": "Ожидание конкретного цвета. Параметры: порт, цвет. Пример: WaitThisColor(1, 3)"
    },
    "rcu.GetLightSensorH": {
        "label": "GetLightSensor()",
        "snippet": "rcu.GetLightSensor(${1:port}, ${2:type})",
        "description": "Получение показаний с датчика света. Параметр: порт. Пример: GetLightSensor(4)"
    },
    "rcu.IsColor": {
        "label": "IsColor()",
        "snippet": "rcu.IsColor(${1:port}, ${2:null})",
        "description": "Проверка соответствия цвета заложенному. Параметры: порт, цвет. Пример: IsColor(1, 5)"
    },
    "rcu.GetColorSensorH": {
        "label": "GetColorSensor()",
        "snippet": "rcu.GetColorSensor(${1:port}, ${2:color})",
        "description": "Получение показаний с датчика цвета. Параметры: порт, режим. Режимы: 1-G, 2-R, 3-B, 4-Color, 9-Light, 15-Hue, 16-Saturation, 17-Luminance. Пример: GetColorSensor(5, 1)"
    },
    "rcu.IsUltra": {
        "label": "IsUltra()",
        "snippet": "rcu.IsUltra(${1:port}, ${2:sign}, ${3:dist})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetUltrasound": {
        "label": "GetUltrasound()",
        "snippet": "rcu.GetUltrasound(${1:port})",
        "description": "Получение показаний с УЗ датчика расстояния (в см). Параметр: порт. Пример: GetUltrasound(5)"
    },
    "rcu.GetTouch": {
        "label": "GetTouch()",
        "snippet": "rcu.GetTouch(${1:port})",
        "description": "Проверка нажатия кнопки. Параметр: порт. Пример: GetTouch(2)"
    },
    "rcu.IsElectedData": {
        "label": "IsElectedData()",
        "snippet": "rcu.IsElectedData(${1:port}, ${2:sign}, ${3:value})",
        "description": "Проверка соответствия показания датчика заложенному значению. Параметры: порт, больше/меньше(1/2), значение. Пример: IsElectedData(1, 1, 1000)"
    },
    "rcu.GetTempAndHumData": {
        "label": "GetTempAndHumData()",
        "snippet": "rcu.GetTempAndHumData(${1:port}, ${2:value})",
        "description": "Получения значения с дачтика влажности и температуры. Параметры: порт, режим. Пример: GetTempAndHumData(8, 1)"
    },
    "rcu.GetGyroscopeData": {
        "label": "GetGyroscopeData()",
        "snippet": "rcu.GetGyroscopeData(${1:Axis})",
        "description": "Получение угловой скорости. Параметры: ось. Пример: GetGyroscopeData(1)"
    },
    "rcu.GetAccData": {
        "label": "GetAccData()",
        "snippet": "rcu.GetAccData(${1:Axis})",
        "description": "Получение ускорения. Параметры: ось. Пример: GetAccData(1)"
    },
    "rcu.GetAttitudeData": {
        "label": "GetAttitudeData()",
        "snippet": "rcu.GetAttitudeData(${1:Side})",
        "description": "Получение значения с гироскопа. Параметры: тип данных. Пример: GetAttitudeData(1)"
    },
    "rcu.SetRcuTimeTo0": {
        "label": "SetRcuTimeTo0()",
        "snippet": "rcu.SetRcuTimeTo0()",
        "description": "Обнуление встроенного таймера программы. Пример: SetRcuTimeTo0()"
    },
    "rcu.GetRcuTime": {
        "label": "GetRcuTime()",
        "snippet": "rcu.GetRcuTime()",
        "description": "Чтение времени от начала программы. Пример: GetRcuTime()"
    },
    "rcu.SetDataH": {
        "label": "SetData()",
        "snippet": "rcu.SetData(${1:min}, ${2:max})",
        "description": "Запись данных по адресу. Параметры: адрес, данные. Пример: SetData(50, 50)"
    },
    "rcu.GetDataH": {
        "label": "GetData()",
        "snippet": "rcu.GetData(${1:num})",
        "description": "Чтение данных по адресу. Параметр: адрес. Пример: GetData(50)"
    },
    "rcu.SavePic": {
        "label": "SavePic()",
        "snippet": "rcu.SavePic(${1:FileName})",
        "description": "Сохраниние скриншота экрана. Партаметр: Имя файла. Пример: SavePic(\"FileName\")"
    },
    "rcu.GetHRCUName": {
        "label": "GetHRCUName()",
        "snippet": "rcu.GetHRCUName())",
        "description": "Получение имени контроллера. Пример: GetHRCUName(255, 9600)"
    },
    "rcu.GetChangeValue": {
        "label": "GetChangeValue()",
        "snippet": "rcu.GetChangeValue()",
        "description": "Получение заряда батареи. Пример: GetChangeValue()"
    },
    "rcu.GetMaiVoice": {
        "label": "GetMaiVoice()",
        "snippet": "rcu.GetMaiVoice()",
        "description": "Чтение уровня громкости микрофона. Пример: GetMaiVoice()"
    },
    "rcu.GetCcrrentDate": {
        "label": "GetCcrrentDate()",
        "snippet": "rcu.GetCcrrentDate()",
        "description": "Получение даты и времени. Пример: GetCcrrentDate()"
    },
    "rcu.SetSaveStudyDataToFile": {
        "label": "SetSaveStudyDataToFile()",
        "snippet": "rcu.SetSaveStudyDataToFile(${1:num}, ${2:\"FileName\"})",
        "description": "Запись экспериментальных данных в файл. Параметры: Данные, Имя файла. Пример: SetSaveStudyDataToFile(1, \"FileName\")"
    },
    "rcu.SetShowFileData": {
        "label": "SetShowFileData()",
        "snippet": "rcu.SetShowFileData(${1:\"FileName\"})",
        "description": "Показать эксперементальные данные. Партаметр: Имя файла. Пример: SetShowFileData(\"FileName\")"
    },
    "rcu.SetDeleteStudyFile": {
        "label": "SetDeleteStudyFile()",
        "snippet": "rcu.SetDeleteStudyFile(${1:\"FileName\"})",
        "description": "Удаление файла с эксперементальными данными. Партаметр: Имя файла. Пример: SetDeleteStudyFile(\"FileName\")"
    },
    "rcu.SetEditView": {
        "label": "SetEditView()",
        "snippet": "rcu.SetEditView(${1:x}, ${2:y}, ${3:\"data\"})",
        "description": "Отображение поля ввода на экране контроллера по осям. Параметры: Х, У, описание. Пример: SetEditView(1, 1, \"Text\")"
    },
    "rcu.GetEditViewData": {
        "label": "GetEditViewData()",
        "snippet": "rcu.GetEditViewData()",
        "description": "Получить данные из поля для ввода. Пример: GetEditViewData()"
    },
    "rcu.SetSaveStrToFile": {
        "label": "SetSaveStrToFile()",
        "snippet": "rcu.SetSaveStrToFile(${1:\"text\"}, ${2:\"FileName\"})",
        "description": "Сохранение текста в файл. Параметры: Текст, Имя файла. Пример: SetSaveStrToFile(\"hello\", \"FileName\")"
    },
    "rcu.GetStrForFile": {
        "label": "GetStrForFile()",
        "snippet": "rcu.GetStrForFile(${1:\"FileName\"}, ${2:line})",
        "description": "Получение строки из файла. Параметры: строка, Имя файла. Пример: GetStrForFile(1, \"FileName\")"
    },
    "rcu.ShowGifExpression": {
        "label": "ShowGifExpression()",
        "snippet": "rcu.ShowGifExpression(${1|1,2,3,4,5|})",
        "description": "Установка гифки на экране эмоции. Параметр: Эмоция (1-5). Пример: ShowGifExpression(2)"
    },
    "rcu.GoneGifExpression": {
        "label": "GoneGifExpression()",
        "snippet": "rcu.GoneGifExpression()",
        "description": "Стирание гифку с эмоцией. Пример: GoneGifExpression()"
    },
    "rcu.ShowList": {
        "label": "ShowList()",
        "snippet": "rcu.ShowList(${1:x}, ${2:y}, ${3:length}, ${4:\"title\"})",
        "description": "Показать список. Параметры: Х, У, Размер, Название. Пример: ShowList(1, 2, 2000, \"Title\")"
    },
    "rcu.SetListItem": {
        "label": "SetListItem()",
        "snippet": "rcu.SetListItem(${1:1}, ${2:\"FileName\"})",
        "description": "Установить название указанного элемента списка. Все элементы до него появятся с названием null. Пример: SetListItem(2, \"Hello\")"
    },
    "rcu.InitIot": {
        "label": "InitIot()",
        "snippet": "rcu.InitIot()",
        "description": "Инициализация модуля IoT. Пример: InitIot()"
    },
    "rcu.SetIotDeviceData": {
        "label": "SetIotDeviceData()",
        "snippet": "rcu.SetIotDeviceData(${1:\"Message\"}, ${2:\"-\"})",
        "description": "Отправка данных на устройство. Параметр: число, имя устройства. Пример: SetIotDeviceData(1, \"IoT\")"
    },
    "rcu.ResetIotResult": {
        "label": "ResetIotResult()",
        "snippet": "rcu.ResetIotResult()",
        "description": "Сброс локального кэша модуля IoT. Пример: ResetIotResult()"
    },
    "rcu.IsIotDeviceData": {
        "label": "IsIotDeviceData()",
        "snippet": "rcu.IsIotDeviceData(${1:\"-\"}, ${2:\"0\"})",
        "description": "Сравнение информации с устройства с указанным значением. Параметры: имя устройства, значение. Пример: IsIotDeviceData(\"IoT\", 5)"
    },
    "rcu.GetIotDeviceData": {
        "label": "GetIotDeviceData()",
        "snippet": "rcu.GetIotDeviceData(${1:\"-\"})",
        "description": "Получение информационных данных, отправленных на устрйоство. Параметр: имя устройства. Пример: GetIotDeviceData(\"IoT\")"
    },
    "rcu.SetWifiData": {
        "label": "SetWifiData()",
        "snippet": "rcu.SetWifiData(${1:\"Data\"})",
        "description": "Отправка данных в локальную сеть. Параметр: данные. Пример: SetWifiData(1)"
    },
    "rcu.GetWifiData": {
        "label": "GetWifiData()",
        "snippet": "rcu.GetWifiData()",
        "description": "Получение данных из локальной сети. Параметр: № мотора. Пример: GetWifiData()"
    },
    "rcu.SetRcuBluetoothData": {
        "label": "SetRcuBluetoothData()",
        "snippet": "rcu.SetRcuBluetoothData(${1:\"Data\"})",
        "description": "Передача данных по Bluetooth. Параметр:данные. Пример: SetRcuBluetoothData(1)"
    },
    "rcu.GetRcuBluetoothData": {
        "label": "GetRcuBluetoothData()",
        "snippet": "rcu.GetRcuBluetoothData()",
        "description": "Получение данных по Bluetooth. Параметр - № мотора. Пример: GetRcuBluetoothData()"
    },
    "rcu.OpenCameraForPhone": {
        "label": "OpenCameraForPhone()",
        "snippet": "rcu.OpenCameraForPhone(${1:0/1})",
        "description": "Включение/отключение камеры. Параметры: вкл/выкл. Пример: OpenCameraForPhone(1)"
    },
    "rcu.SendWifiBtnDescribe": {
        "label": "SendWifiBtnDescribe()",
        "snippet": "rcu.SendWifiBtnDescribe(${1:Button}, ${2:\"name\"})",
        "description": "Отправка команды с контроллера для установки описания указанной кнопки, отображаемой в приложении дистанционного управления. Параметры: кнопка (1-4), \"имя\". Пример: SendWifiBtnDescribe(1, \"Up\")"
    },
    "rcu.IsPhoneWiFiYGData": {
        "label": "IsPhoneWiFiYGData()",
        "snippet": "rcu.IsPhoneWiFiYGData(${1:Rocker}, ${2:Position})",
        "description": "Проверка нажатия кнопки в приложении дистанционного управления. Параметры: кнопка. Пример: IsPhoneWiFiYGData(1)"
    },
    "rcu.IsPhoneWiFiBtnData": {
        "label": "IsPhoneWiFiBtnData()",
        "snippet": "rcu.IsPhoneWiFiBtnData(${1:Button})",
        "description": "Проверка, находится ли указанный джойстик в указанном направлении в приложении дистанционного управления. Параметры: джойстик, направление. Пример: IsPhoneWiFiBtnData(1, 1)"
    },
    "rcu.GetPhoneWiFiYGData": {
        "label": "GetPhoneWiFiYGData()",
        "snippet": "rcu.GetPhoneWiFiYGData(${1:Joystik}, ${2:Axis})",
        "description": "Получение координат указанного джойстика, по указанной оси в приложении дистанционного управления. Параметры: джойстик, ось. Пример: GetPhoneWiFiYGData(1, 1)"
    },
    "rcu.StartCamera": {
        "label": "StartCamera()",
        "snippet": "rcu.StartCamera(${1|1,2|}, ${2|1,2,3,4,5,6,7,8,9,10,11,12,13,14|})",
        "description": "Управление камерой. Параметры: вкл/выкл(1/2), режим(1-14). Пример: StartCamera(1, 5)"
    },
    "rcu.SetRoadHsv": {
        "label": "SetRoadHsv()",
        "snippet": "rcu.SetRoadHsv(${1:hue}, ${2:saturation}, ${3:value}, ${4:limit})",
        "description": "Настройка распознавания линии по системе HSV. Устанавливает верхний лимит. Параметры: H(тон), S(насыщенность), V(яркость). Пример: SetRoadHsv(180, 255, 50)"
    },
    "rcu.IsRoadBlack": {
        "label": "IsRoadBlack()",
        "snippet": "rcu.IsRoadBlack()",
        "description": "Проверка. распознаёт ли камера чёрную линию. Пример: IsRoadBlack()"
    },
    "rcu.GetRoadAngle": {
        "label": "GetRoadAngle()",
        "snippet": "rcu.GetRoadAngle()",
        "description": "Получение угла между направлением движения робота и линией. Пример: GetRoadAngle()"
    },
    "rcu.SetFaceRegister": {
        "label": "SetFaceRegister()",
        "snippet": "rcu.SetFaceRegister(${1:\"name\"})",
        "description": "Запись лица для распознания. Параметр: \"Имя\", Пример: SetFaceRegister(\"Kirill\")"
    },
    "rcu.SetCameraShow": {
        "label": "SetCameraShow()",
        "snippet": "rcu.SetCameraShow(${1:show/hide(1/2)})",
        "description": "Включить/отключить демонстрацию изображения с камеры на экран контроллера. Параметры: вкл/выкл(1-2). Пример: SetCameraShow(1)"
    },
    "rcu.SetTTSSpeack": {
        "label": "SetTTSSpeack()",
        "snippet": "rcu.SetTTSSpeack(${1:\"text\"})",
        "description": "Прочитать текст. Параметры: \"Текст\". Пример: SetTTSSpeack(\"Hello\")"
    },
    "rcu.ResetAiResult": {
        "label": "ResetAiResult()",
        "snippet": "rcu.ResetAiResult()",
        "description": "Сбросить все результаты. Пример: ResetAiResult()"
    },
    "rcu.IsColorForCamera": {
        "label": "IsColorForCamera()",
        "snippet": "rcu.IsColorForCamera(${1|1,2,3,4,5,6,7|})",
        "description": "Проверка, соответствует ли цвет на камере указанному. Параметр: цвет. Пример: IsColorForCamera(1)"
    },
    "rcu.GetPoseData": {
        "label": "GetPoseData()",
        "snippet": "rcu.GetPoseData(${1:pose})",
        "description": "Проверка, соответсвует ли жест на камере указанному. Пример: GetPoseData(1)"
    },
    "rcu.GetSimplePoseList": {
        "label": "GetSimplePoseList()",
        "snippet": "rcu.GetSimplePoseList(${1:BodyPart}, ${2:x/y})",
        "description": "Получение координат точек лица для распознования. Параметры: точка, x/y(1/2). Пример: GetSimplePoseList(5, 1)"
    },
    "rcu.GetWeather": {
        "label": "GetWeather()",
        "snippet": "rcu.GetWeather(${1:citi}, ${2:weather})",
        "description": "Получение данных о погоде в указанном городе. Параметры: город, параметр Пример: GetWeather(\"北京\", 1)"
    },
    "rcu.GetAiData": {
        "label": "GetAiData()",
        "snippet": "rcu.GetAiData(${1:data})",
        "description": "Получиение заданных результатов распознания через камеру. Параметр: требуемы результат(1-5). Пример: GetAiData(1)"
    },
    "rcu.GetZxing": {
        "label": "GetZxing()",
        "snippet": "rcu.GetZxing()",
        "description": "Получение результатов чтения QR кода. Пример: GetZxing()"
    },
    "rcu.GetBlackLineData": {
        "label": "GetBlackLineData()",
        "snippet": "rcu.GetBlackLineData()",
        "description": "Получение результатов распознания чёрной линии. Пример: GetBlackLineData()"
    },
    "rcu.StartOnnxCamera": {
        "label": "StartOnnxCamera()",
        "snippet": "rcu.StartOnnxCamera(${1:run/close(1/2)}, ${2:\"model.onnx\"}, ${3:show/hide(1/2)})",
        "description": "Запуск/остановка работы альтернативного алгоритма AI. Параметры: Вкл/выкл(1-2), имя модели, показать/скрыть результат. Пример: StartOnnxCamera(1,\"model.onnx\",1)"
    },
    "rcu.GetOnnxZXD": {
        "label": "GetOnnxZXD()",
        "snippet": "rcu.GetOnnxZXD(${1:ConfidenceLevel})",
        "description": "Установка уровня достоверности результата. Параметр: уровень остоверности. Пример: GetOnnxZXD(1)"
    },
    "rcu.GetOnnxResult": {
        "label": "GetOnnxResult()",
        "snippet": "rcu.GetOnnxResult(${1:Custom/ConfidenceLevel(1/2)})",
        "description": "Получение результатов распознания по альтернативному алгоритму. Параметр: результат/уровень достоверности Пример: GetOnnxResult()"
    },
    "rcu.IsOnnxResult": {
        "label": "IsOnnxResult()",
        "snippet": "rcu.IsOnnxResult(${1:1})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartBDApi": {
        "label": "StartBDApi()",
        "snippet": "rcu.StartBDApi(${1:\"run/close(1/2)\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetTextRecognize": {
        "label": "SetTextRecognize()",
        "snippet": "rcu.SetTextRecognize()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetTextRecognizeResult": {
        "label": "GetTextRecognizeResult()",
        "snippet": "rcu.GetTextRecognizeResult()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartBDVoiceRecognize": {
        "label": "StartBDVoiceRecognize()",
        "snippet": "rcu.StartBDVoiceRecognize(${1:sec})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartBDVoiceRecognizeOnce": {
        "label": "StartBDVoiceRecognizeOnce()",
        "snippet": "rcu.StartBDVoiceRecognizeOnce()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetVoiceData": {
        "label": "GetVoiceData()",
        "snippet": "rcu.GetVoiceData()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.InitXhSDK": {
        "label": "InitXhSDK()",
        "snippet": "rcu.InitXhSDK(${1:\"url\"}, ${2:\"key\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.UseInsetChatUi": {
        "label": "UseInsetChatUi()",
        "snippet": "rcu.UseInsetChatUi()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartDSTTSSpeack": {
        "label": "StartDSTTSSpeack()",
        "snippet": "rcu.StartDSTTSSpeack()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.IsFinishTTS": {
        "label": "IsFinishTTS()",
        "snippet": "rcu.IsFinishTTS()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartChat": {
        "label": "StartChat()",
        "snippet": "rcu.StartChat(${1:\"text\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.AddActionCode": {
        "label": "AddActionCode()",
        "snippet": "rcu.AddActionCode(${1:\"action\"}, ${2:\"code\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.ResetXHCash": {
        "label": "ResetXHCash()",
        "snippet": "rcu.ResetXHCash()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetChatReceive": {
        "label": "GetChatReceive()",
        "snippet": "rcu.GetChatReceive()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetChatListData": {
        "label": "GetChatListData()",
        "snippet": "rcu.GetChatListData()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetChatListSize": {
        "label": "GetChatListSize()",
        "snippet": "rcu.GetChatListSize()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetChatAllReceive": {
        "label": "GetChatAllReceive()",
        "snippet": "rcu.GetChatAllReceive()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetAiDoInstructionSize": {
        "label": "GetAiDoInstructionSize()",
        "snippet": "rcu.GetAiDoInstructionSize()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetAiDoInstruction": {
        "label": "GetAiDoInstruction()",
        "snippet": "rcu.GetAiDoInstruction(${1:num})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetIsTouchH": {
        "label": "GetIsTouch()",
        "snippet": "rcu.GetIsTouch()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetTouchScreenXYH": {
        "label": "GetTouchScreenXY()",
        "snippet": "rcu.GetTouchScreenXY(${1:axis})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDClearH": {
        "label": "SetLCDClear()",
        "snippet": "rcu.SetLCDClear(${1:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetAlphaH": {
        "label": "SetAlpha()",
        "snippet": "rcu.SetAlpha(${1:0.5})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetFontSizeH": {
        "label": "SetFontSize()",
        "snippet": "rcu.SetFontSize(${1:0})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetDisplayStringH": {
        "label": "SetDisplayString()",
        "snippet": "rcu.SetDisplayString(${1:1}, ${2:\"text\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetDisplayStringXYSH": {
        "label": "SetDisplayStringXYS()",
        "snippet": "rcu.SetDisplayStringXYS(${1:X}, ${2:Y}, ${3:\"text\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetZxingH": {
        "label": "SetZxing()",
        "snippet": "rcu.SetZxing(${1:\"text\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetDisplayPictureH": {
        "label": "SetDisplayPicture()",
        "snippet": "rcu.SetDisplayPicture(${1:X}, ${2:Y}, ${3:\"a.jpg\"}, ${4:\"scale\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDDotH": {
        "label": "SetLCDDot()",
        "snippet": "rcu.SetLCDDot(${1:X}, ${2:Y}, ${3:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDLineH": {
        "label": "SetLCDLine()",
        "snippet": "rcu.SetLCDLine(${1:X}, ${2:Y}, ${3:angle}, ${4:length}, ${5:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDSolidCircleH": {
        "label": "SetLCDSolidCircle()",
        "snippet": "rcu.SetLCDSolidCircle(${1:X}, ${2:Y}, ${3:radius}, ${4:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDFilledRectangle2H": {
        "label": "SetLCDFilledRectangle2()",
        "snippet": "rcu.SetLCDFilledRectangle2(${1:X}, ${2:Y}, ${3:width}, ${4:height}, ${5:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetLCDRectangle2H": {
        "label": "SetLCDRectangle2()",
        "snippet": "rcu.SetLCDRectangle2(${1:X}, ${2:Y}, ${3:width}, ${4:height}, ${5:lineWidth}, ${6:\"#F80000\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartMp3ByPaiH": {
        "label": "StartMp3ByPai()",
        "snippet": "rcu.StartMp3ByPai(${1:\"Note\"}, ${2:beat})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.PlayVoiceByNameH": {
        "label": "PlayVoiceByName()",
        "snippet": "rcu.PlayVoiceByName(${1|1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17|})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartMp3ByPathH": {
        "label": "StartMp3ByPath()",
        "snippet": "rcu.StartMp3ByPath(${1:\"music.mp3\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.WaitMp3ByPathH": {
        "label": "WaitMp3ByPath()",
        "snippet": "rcu.WaitMp3ByPath(${1:\"music.mp3\"})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetMp3SuspendH": {
        "label": "SetMp3Suspend()",
        "snippet": "rcu.SetMp3Suspend()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StartRecordH": {
        "label": "StartRecord()",
        "snippet": "rcu.StartRecord(${1:sec})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.PlayRecordH": {
        "label": "PlayRecord()",
        "snippet": "rcu.PlayRecord()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.AddVoiceSpeedH": {
        "label": "AddVoiceSpeed()",
        "snippet": "rcu.AddVoiceSpeed(${1:percent})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetVoiceSpeedH": {
        "label": "SetVoiceSpeed()",
        "snippet": "rcu.SetVoiceSpeed(${1:percent})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.AddVoiceValueH": {
        "label": "AddVoiceValue()",
        "snippet": "rcu.AddVoiceValue(${1:percent})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetVoiceValueH": {
        "label": "SetVoiceValue()",
        "snippet": "rcu.SetVoiceValue(${1:percent})",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.StopAllVoiceH": {
        "label": "StopAllVoice()",
        "snippet": "rcu.StopAllVoice()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetVoiceValueH": {
        "label": "GetVoiceValue()",
        "snippet": "rcu.GetVoiceValue()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.GetVoiceSpeedH": {
        "label": "GetVoiceSpeed()",
        "snippet": "rcu.GetVoiceSpeed()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.SetMecanumwheel": {
        "label": "SetMecanumwheel()",
        "snippet": "rcu.SetMecanumwheel(${1:PortLeftF}, ${2:PortRightF}, ${3:PortLeftB}, ${4:PortRightB})",
        "description": "Установка портов для робота на Mecanum колёсах. Параметры: левое-переднее, правое-переднее, левое-заднее, правое-заднее. Пример: SetMecanumwheel(1, 2, 3, 4)"
    },
    "rcu.SetMecanumSpeed": {
        "label": "SetMecanumSpeed()",
        "snippet": "rcu.SetMecanumSpeed(${1:SpeedLF}, ${2:SpeedRF}, ${3:SpeedLB}, ${4:SpeedRB})",
        "description": "Установка скорости вращения каждого из колёс. Параметры: левое-переднее, правое-переднее, левое-заднее, правое-заднее. Пример: SetMecanumSpeed(50, -50, 50, -50)"
    },
    "rcu.SetMecanumMoveLR": {
        "label": "SetMecanumMoveLR()",
        "snippet": "rcu.SetMecanumMoveLR(${1:Speed}, ${2:Sec}, ${3:Side})",
        "description": "Движение указанное время с указанной скоростью в нужную сторону. Параметры: скорость, сторона, время. Пример: SetMecanumMoveLR(50, 1 , 90)"
    },
    "rcu.SetCarSpeed": {
        "label": "SetCarSpeed()",
        "snippet": "rcu.SetCarSpeed(${1:Speed})",
        "description": "Установка скорости робота. Параметры: скорость. Пример: SetCarSpeed(70)"
    },
    "rcu.SetCarStop": {
        "label": "SetCarStop()",
        "snippet": "rcu.SetCarStop(${1:})",
        "description": "Остановка движения. Пример: SetCarStop()"
    },
    "rcu.SetCarToAngleTime": {
        "label": "SetCarToAngleTime()",
        "snippet": "rcu.SetCarToAngleTime(${1:Deg}, ${2:Sec})",
        "description": "Поворот указанное время на указанное число градусов. Параметры: угол, время. Пример: SetCarToAngleTime(30, 1)"
    },
    "rcu.SetCarToAngle": {
        "label": "SetCarToAngle()",
        "snippet": "rcu.SetCarToAngle(${1:Deg})",
        "description": "Поворот на указанный угол. Параметры:угол . Пример: SetCarToAngle(90)"
    },
    "rcu.SetCarToRLTime": {
        "label": "SetCarToRLTime()",
        "snippet": "rcu.SetCarToRLTime(${1:Side}, ${2:Sec})",
        "description": "Поворот в указанную сторону на определенное время. Параметры: сторона, время. Пример: SetCarToRLTime(1, 30)"
    },
    "rcu.SetCarToRL": {
        "label": "SetCarToRL()",
        "snippet": "rcu.SetCarToRL(${1:Side})",
        "description": "Поворот в указанную сторону. Параметр: сторона. Пример: SetCarToRL(1)"
    },
    "rcu.StartCameraRub": {
        "label": "StartCameraRub()",
        "snippet": "rcu.StartCamera(${1|\"开启\",\"关闭\"|}, ${2:\"魔方颜色识别\"})",
        "description": "Запускает камеру для сборки кубира Рубика. Параметры: Состояние, режим. Пример: StartCameraRub(\"开启\", \"魔方颜色识别\")"
    },
    "rcu.StartMFBtn": {
        "label": "StartMFBtn()",
        "snippet": "rcu.StartMFBtn()",
        "description": "Вставляет шаблон команды. Подробное описание пока не заполнено."
    },
    "rcu.UpdateRcuUi": {
        "label": "UpdateRcuUi()",
        "snippet": "rcu.UpdateRcuUi(${1:Value}, ${2:MaxValue})",
        "description": "Обновить состояние програсса сборки. Параметры: текущее значение, максимум . Пример: UpdateRcuUi(5, 100)"
    },
    "rcu.IsMfConnect": {
        "label": "IsMfConnect()",
        "snippet": "rcu.IsMfConnect()",
        "description": "Проверка, начата ли сборка. Пример: IsMfConnect()"
    },
    "rcu.GetMFExist": {
        "label": "GetMFExist()",
        "snippet": "rcu.GetMFExist()",
        "description": "Проверка, существует ли кубик Рубика. Пример: GetMFExist()"
    },
    "rcu.GetMfChaos": {
        "label": "GetMfChaos()",
        "snippet": "rcu.GetMfChaos()",
        "description": "Проверка, не перемещён ли кубик случайно. Пример: GetMfChaos()"
    },
    "rcu.SeRunNexttCarToRL": {
        "label": "RunNext()",
        "snippet": "rcu.RunNext()",
        "description": "Вставляет вызов rcu.RunNext(). Старый идентификатор команды сохранён для совместимости."
    },
    "rcu.StartMFColor": {
        "label": "StartMFColor()",
        "snippet": "rcu.StartMFColor(${1|1,2,3,4,5,6|})",
        "description": "Определить количество квадратов указанного цвета. Параметр: цвет. Пример: StartMFColor(1)"
    },
    "rcu.MfStepNum": {
        "label": "MfStepNum()",
        "snippet": "rcu.MfStepNum()",
        "description": "Узнать количество выполненных шагов по сборке. Пример: MfStepNum()"
    },
    "rcu.MfUseTime": {
        "label": "MfUseTime()",
        "snippet": "rcu.MfUseTime()",
        "description": "Получить текущее время сборки. Пример: MfUseTime()"
    },
    "control.if": {
        "label": "If",
        "snippet": "if ${1:condition}:\n\t${2:pass}",
        "description": "Выполняет блок, если условие истинно."
    },
    "control.ifelse": {
        "label": "If-Else",
        "snippet": "if ${1:condition}:\n\t${2:pass}\nelse:\n\t${3:pass}",
        "description": "Выбирает один из двух блоков по условию."
    },
    "control.ifelifelse": {
        "label": "If-Elif-Else",
        "snippet": "if ${1:condition}:\n\t${2:pass}\nelif ${3:condition}:\n\t${4:pass}\nelse:\n\t${5:pass}",
        "description": "Проверяет условия по порядку и выполняет первый подходящий блок."
    },
    "control.while": {
        "label": "While",
        "snippet": "while ${1:condition}:\n\t${2:pass}",
        "description": "Повторяет блок, пока условие истинно."
    },
    "control.whiletrue": {
        "label": "While True",
        "snippet": "while True:\n\t${1:pass}",
        "description": "Повторяет блок до явного выхода из цикла."
    },
    "control.for": {
        "label": "For",
        "snippet": "for ${1:count} in range(${2:10}):\n\t${3:pass}",
        "description": "Перебирает значения диапазона."
    },
    "rcu.GetTouchH": {
        "label": "GetTouch()",
        "snippet": "rcu.GetTouch(${1:port})",
        "description": "Команда H-RCU. Вставляет rcu.GetTouch(). Подробное описание пока не заполнено."
    },
    "rcu.GetUltrasoundH": {
        "label": "GetUltrasound()",
        "snippet": "rcu.GetUltrasound(${1:port})",
        "description": "Команда H-RCU. Вставляет rcu.GetUltrasound(). Подробное описание пока не заполнено."
    },
    "rcu.IsUltraH": {
        "label": "IsUltra()",
        "snippet": "rcu.IsUltra(${1:port}, ${2:sign}, ${3:dist})",
        "description": "Команда H-RCU. Вставляет rcu.IsUltra(). Подробное описание пока не заполнено."
    }
};
//# sourceMappingURL=CommandCatalog.js.map