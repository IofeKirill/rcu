import * as vscode from 'vscode';

export class CommandTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children: CommandTreeItem[] = []
    ) {
        super(label, collapsibleState);
        if (commandId) {
            this.command = {
                command: commandId,
                title: this.label,
            };
        }
        this.tooltip = new vscode.MarkdownString(this.getDescription());
    }

    private getDescription(): string {
        switch (this.label) {
            //#region---Команды моторов E6
            case 'SetMotor()':
                return 'Установка скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotor(1, 100)';
            case 'SetMotorStop()':
                return 'Остановка выбранного мотора';
            case 'SetMotorCode()':
                return 'Обнуление энкодера. Параметр - № мотора. Пример: SetMotorCode(1)';
            case 'GetMotorCode()':
                return 'Получение показаний с энкодера. Параметр - № мотора. Пример: GetMotorCode(1)';
            case 'SetMotorSecond()':
                return 'Включение мотора с указанной скоростью на определённое время. Параметры: № мотора, скорость, время. Пример: SetMotorAngle(1, 50, 2)';
            case 'SetMotorAngleDelay()':
                return 'Включение мотора с указанной скоростью до определённого угла поворота с зависанием, пока не достигнут угол. Параметры: № мотора, скорость, угол. Пример: SetMotorAngle(1, 50, 180)';
            case 'SetMotorConstSpeed()':
                return 'Установка неизменной скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotorConstSpeed(1, 100)';
            case 'SetMotorAngle()':
                return 'Включение мотора с указанной скоростью до определённого угла поворота. Параметры: № мотора, скорость, угол. Пример: SetMotorAngle(1, 50, 180)';
            case 'SetMotorDirection()':
                return 'Установка вращения мотора в конкретную сторону. Параметры: № мотора, сторона. Пример: SetMotorDirection(1,0)';
            //#endregion
            //#region---Команды move E6
            case 'SetMoveRunSecond()':
                return 'Запуск двух моторов в указанную сторону с выбранной скоростью на определённое время. Пример: SetMoveRunSecond("forward", 50, 1)';
            case 'SetMoveRunAngle()':
                return 'Запуск двух моторов в указанную сторону с выбранной скоростью на определённый градус поворота. Пример: SetMoveRunAngle("forward", 50, 180)';
            case 'SetMoveRun()':
                return 'Запуск двух моторов в указанную сторону с выбранной скоростью. Пример: SetMoveRun("forward", 50)';
            case 'SetMoveStop()':
                return 'Остановка моторов. Пример: SetMoveStop( )';
            case 'SetMoveSpeedSecond()':
                return 'Запуск двух моторов с разной скоростью на определённое время. Пример: SetMoveSpeedSecond(30, 50, 1)';
            case 'SetMoveSpeed()':
                return 'Запуск двух моторов с разной скоростью. Пример: SetMoveSpeed(30, 50)';
            case 'SetMovePower()':
                return 'Запуск двух моторов с разной мощностью. Пример: SetMovePower(10, 80)';
            case 'SetMotorPower()':
                return 'Запуск четырёх моторов с разной мощностью. Пример: SetMotorPower(10, 80, 20, 70)';
            case 'SetMoveInitialize()':
                return 'Инициализация моторов для использования остальных команд этого раздела. Ставится в начале программы. Параметры: № левого мотора, № правого мотора, реверс. Пример: SetMoveInitialize(1, 2, "no_reversal")';
            //#endregion
            //#region---Команды контроллера E6
            case 'SetInSound()':
                return 'Установка частоты звука в Гц. Параметры: частота в Гц, длительность в мс. Пример: SetInSound(512, 500)';
            case 'SetData()':
                return 'Запись данных по адресу. Параметры: адрес, данные. Пример: SetData(50, 50)';
            case 'GetData()':
                return 'Чтение данных по адресу. Параметр: адрес. Пример: GetData(50)';
            case 'SetUartData()':
                return 'Отправка Serial-данных. Параметры: данные, скорость в бод. Пример: SetUartData(255, 9600)';
            case 'GetUartData()':
                return 'Получение Serial-данных. Параметр: скорость в бод. Пример: GetUartData(9600)';
            case 'GetInMic()':
                return 'Чтение уровня громкости микрофона. Пример: GetInMic()';
            case 'GetInVoltage()':
                return 'Чтение уровня напряжения батареи. Пример: GetInVoltage()';
            case 'GetLeftButton()':
                return 'Чтение состояния левой кнопки. Пример: GetLeftButton()';
            case 'GetRightButton()':
                return 'Чтение состояния правой кнопки. Пример: GetRightButton()';
            case 'WaitLeftButtonPressed()':
                return 'Ожидание нажатия левой кнопки. Пример: WaitLeftButtonPressed()';
            case 'WaitRightButtonPressed()':
                return 'Ожидание нажатия правой кнопки. Пример: WaitRightButtonPressed()';
            case 'WaitRightButtonReleased()':
                return 'Ожидание отпускания правой кнопки. Пример: WaitRightButtonReleased()';
            case 'WaitLeftButtonReleased()':
                return 'Ожидание отпускания левой кнопки. Пример: WaitLeftButtonReleased()';
            case 'GetMcuID()':
                return 'Получить идентификатор чипа контроллера';
            case 'GetSysVersion()':
                return 'Получить номер версии прошивки контроллера';
            case 'GetSysLanguage()':
                return 'Получить язык системы контроллера';
            case 'GetRGB()':
                return ' Задайте три цвета в диапазоне от 0 до 255 и получите любой оттенок';
            case 'GetRandom()':
                return 'Генерация случайного числа в указанном диапазоне';
            case 'SetLCDBack()':
                return 'Включение и отключение экрана';
            case 'SetSysTime()':
                return 'Обнуление встроенного таймера программы. Пример: SetSysTime()';
            case 'GetSysTime()':
                return 'Чтение времени от начала программы. Пример: GetSysTime()';
            case 'Wait':
                return 'Таймер в секундах. 1 мс = 0.001. Пример: SetWaitForTime(0.001)';
            case 'SetRcuStop()':
                return 'Остановка всех функций';
            //#endregion
            //Команды датчиков E6
            //#region---Датчики света
            case 'Set3CLED()':
                return 'Управление лампой. Параметры: порт, цвет (0-7). Цвета: Выкл, Красный, Зеленый, Синий, Жёлтый, Фиолетовый, Голубой, Белый. Пример: Set3CLED(4, 6)';
            case 'SetLightSensorLED()':
                return 'Включение/выключение подсветки на датчике света. Параметры: порт, 0/1. Пример: SetLightSensorLED(3, 1)';
            case 'GetLightSensorData()':
                return 'Получение показаний датчика света ниже порогового значения. Параметр: порт. Пример: GetLightSensorData(4)';
            case 'GetLightSensor()':
                return 'Получение показаний с датчика света. Параметр: порт. Пример: GetLightSensor(4)';
            case 'GetColorSensor()':
                return 'Получение показаний с датчика цвета. Параметры: порт, режим. Режимы: 1-G, 2-R, 3-B, 4-Color, 9-Light, 15-Hue, 16-Saturation, 17-Luminance. Пример: GetColorSensor(5, 1)';
            //#endregion
            //#region---Датчики расстояния
            case 'GetTouch()':
                return 'Проверка нажатия кнопки. Параметр: порт. Пример: GetTouch(2)';
            case 'GetUltrasound()':
                return 'Получение показаний с УЗ датчика расстояния (в см). Параметр: порт. Пример: GetUltrasound(5)';
            case 'SetUltrasoundled()':
                return 'Установка цвета УЗ датчика расстояния. Параметр: порт, цвет. Пример: SetUltrasoundled(1, 1)';
            case 'GetShortIRDist()':
                return 'Получение показаний с ИК датчика расстояния. Параметр: порт. Пример: GetShortIRDist(8)';
            case 'GetLaserDist()':
                return 'Получение показаний с лазерного датчика расстояния (в мм). Параметры: порт, режим (обычный/большая дальность). Пример: GetLaserDist(7)';
            //#endregion
            //#region---Гироскоп
            case 'SetAHRS()':
                return 'Калибровка гироскопа. Параметры: порт, режим (1/2). Пример: SetAHRS(2, 1)';
            case 'GetAHRS()':
                return 'Получение показаний с гироскопа. Параметры: порт, режим, пустой. Режимы: 1-крен, 2-наклон, 3-рысканье, 4-aX, 5-aY, 6-aZ, 7-gX, 8-gY, 9-gZ. Пример: GetAHRS(2, 3, 0)';
            //#endregion
            //#region---Gyro
            case 'Create object gyro':
                return 'Создание объекта для управления гироскопом и калибровка гироскопа';
            case 'ReadGyro()':
                return 'Получение показаний с гироскопа';
            //#endregion
            //#region---Датчик жестов
            case 'GetGesture()':
                return 'Определяет жесты и возвращает соответствующее значение.';
            //#endregion
            //#region---Датчик давления
            case 'GetAirPressure()':
                return 'Измеряет давление окружающего воздуха и возвращает соответствующее значение';
            //#endregion
            //#region---Датчики влажности и температуры
            case 'GetSht30()':
                return 'Измеряет температуру и влажность окружающей среды и возвращает соответствующее значение';
            //#endregion
            //#region---Датчики магнитного поля
            case 'GetMagnetic()':
                return 'Возвращает силу и направление магнитного поля';
            //#endregion
            //#region---Умный глаз
            case 'SetSmartEyeMode()':
                return 'Установка режима работы Умного глаза';
            case 'SetSmartEyeAllLed()':
                return 'Ручная установка цветов на Умном глазе';
            case 'SetSmartEyeIRcode()':
                return 'Передачи ИК сигнала через Умный глаз';
            case 'GetSmartEyeIRcode()':
                return 'Получение ИК сигнала через Умный глаз';
            case 'GetSmartEyeDist()':
                return 'Получение расстояния до объекта, испускающего или получающего ИК сигнал';
            //#endregion
            //#region---Линейка датчиков света
            case 'GetTraceV2I2C()':
                return 'Получение показаний с линейки датчиков света. Параметры: порт, целевой датчик  (1-7). Пример: GetTraceV2I2C(7, 1)';
            case 'GetTraceV2I2CState()':
                return 'Проверка состояний с линейки датчиков. Параметры: порт, целевой датчик (1-7). Пример: GetTraceV2I2CState(7, 2)';
            case 'GetTraceV2I2CChxState()':
                return 'Проверка обнаружения чёрной линии различными датчиками. Параметры: порт, состояния. Пример: GetTraceV2I2CChxState(7, 1)';
            case 'SetTraceV2I2AllColor()':
                return 'Включение подсветки на всей линейке датчиков. Параметры: порт, цвет. Пример: SetTraceV2I2AllColor(7, 3)';
            case 'SetTraceV2I2Color()':
                return 'Включение подсветки на каждом из датчиков линейки. Параметры: порт, цвета для каждого датчика. Пример: SetTraceV2I2Color(7, 1, 2, 4, 4, 3, 2, 1)';
            case 'SetTraceV2I2Threshold()':
                return 'Автоматическая установка порога на заданное время. Параметры: порт, время (сек). Пример: SetTraceV2I2Threshold(7, 5)';
            case 'LineSetInitialize()':
                return 'Инициализация линейки датчиков света. Устанавливается в начале программы. Параметры: порт, цвет линии, тип колёс. Пример: LineSetInitialize(1,"black","wheeledchassis")';
            case 'LineIntersectionStop()':
                return 'Движение по линии на заданной скорости до перекрёстка определённого типа. Пример: LineIntersectionStop(70, 17)';
            case 'LineMillisecond()':
                return 'Движение по линии на заданной скорости определённое время. Пример: LineMillisecond(70, 1500)';
            case 'LineForBmp()':
                return 'Движение по линии на заданной скорости до угла поворота энкодера. Пример: LineMillisecond(70, 360)';
            case 'LineTurnEncounterline()':
                return 'Поворот по линейке датчиков, пока конкретный датчик не увидит линию. Параметры: скорость слева, скорость спарва, № датчика. Пример: LineTurnEncounterline(70, 20, 7)';
            case 'LineBasis()':
                return 'Движение по линии на заданной скорости. Параметры: скорость. Пример: LineBasis(70)';
            //#endregion
            //#region---Команды камеры
            case 'SetAICamData()':
                return 'Эта функция имеет множество применений. СМ подробную инструкцию.';
            case 'GetAICamData()':
                return 'Эта функция имеет множество применений. СМ подробную инструкцию.';
            case 'SetWaitForAICamData()':
                return 'Ожидание переключения камеры в установленный режим.';
            case 'SetAICamLED()':
                return 'Включение/выключение подсветки на камере. Пример: SetAICamLED(1)';
            case 'GetAICamVoice()':
                return 'Получить инструкции по распознаванию голоса. Параметр: № инструкции. Пример: GetAICamVoice(1023)';
            //#endregion

            //#region---Команды звука E6
            case 'SetInSound()':
                return '';
            case 'SoundStartBeep()':
                return '1 - light, 2 - siren, 3 - deep';
            case 'SetInBeep()':
                return 'Включение/выключение зуммера. Параметр: 0 - выключить, 1 - включить. Пример: SetInBeep(1)';
            case 'SoundMp3()':
                return 'Включение конкретного звука на указанное время. Параметры: папка, файл, время в секундах';
            case 'SetMp3Play()':
                return 'Включение конкретного звука. Параметры: папка, файл. В папке 1 есть 14 встроенных звуков. Можно создавать свои папки и загружать свои звуки. Пример: SetMp3Play(2, 3)';
            case 'SetMp3Suspend()':
                return 'Остановить музыку. Пример: SetMp3Suspend()';
            case 'SetMp3Sound()':
                return 'Установка громкости. Параметр: громкость (0-28). Пример: SetMp3Sound(28)';
            //#endregion
            //#region---Команды экрана E6
            case 'GetTouchScreen()':
                return 'Проверка касания экрана. Пример: GetTouchScreen()';
            case 'GetTouchScreenX()':
                return 'Получение X-координаты касания экрана. Пример: GetTouchScreenX()';
            case 'GetTouchScreenY()':
                return 'Получение Y-координаты касания экрана. Пример: GetTouchScreenY()';
            case 'SetLCDClear()':
                return 'Очистка экрана выбранным цветом. Параметр: цвет в шестнадцатиричной системе. Пример: SetLCDClear(0x0000)';
            case 'SetFontSize()':
                return 'Установка размера шрифта. Параметр: размер (0-4). Пример: SetFontSize(2)';
            case 'SetDisplayVar()':
                return 'Вывод числа в строке. Параметры: строка, число, цвет текста, цвет фона. Пример: SetDisplayVar(1, 10, 0xFFE0, 0x0000)';
            case 'SetDisplayString()':
                return 'Вывод текста в строке. Параметры: строка, "текст", цвет текста, цвет фона. Вместо текста могут быть и числа. Пример: rcu.SetDisplayString(1,str(5 + 3),0xFFE0,0x0000). Пример2 : rcu.SetDisplayString(1,str("".join(("Speed = ",str(50)))),0xFFE0,0x0000)';
            case 'SetDisplayPicture()':
                return 'Вывод картинки на экран в заданных координатах. Параметры: x, y, картинка, масштаб. Пример: SetDisplayPicture(10, 10, "a.jpg", 0)';
            case 'SetDisplayVarXY()':
                return 'Вывод числа на экран в заданных координатах. Параметры: x, y, число, цвет текста, цвет фона. Пример: SetDisplayVarXY(1, 1, 10, 0xFFE0, 0x0000)';
            case 'SetDisplayStringXY()':
                return 'Вывод текста на экран в заданных координатах. Параметры: x, y, "текст", цвет текста, цвет фона. Пример: SetDisplayStringXY(1, 1, "Hello", 0xFFE0, 0x0000, 1)';
            case 'SetDisplayVarU32()':
                return 'Вывод 10-значного числа на экран в строке. Параметры: строка, число, цвет текста, цвет фона. Пример: SetDisplayVarU32(1, 1234567890, 0xFFE0, 0x0000)';
            case 'SetLCDDot()':
                return 'Нарисовать точку по координатам. Параметры: x, y, цвет. Пример: SetLCDDot(10, 10, 0xFFE0)';
            case 'SetLCDSolidCircle()':
                return 'Нарисовать круг по координатам. Параметры: x, y, радиус, цвет. Пример: SetLCDSolidCircle(10, 10, 5, 0xFFE0)';
            case 'SetLCDLine()':
                return 'Нарисовать линию по координатам. Параметры: x, y, угол, длина, цвет. Пример: SetLCDLine(10, 10, 45, 10, 0xFFE0)';
            case 'SetLCDFilledRectangle2()':
                return 'Нарисовать сплошной прямоугольник по координатам. Параметры: x, y, ширина, высота, цвет. Пример: SetLCDFilledRectangle2(10, 10, 50, 50, 0xFFE0)';
            case 'SetLCDRectangle2()':
                return 'Нарисовать прямоугольник по координатам. Параметры: x, y, ширина, высота, толщина линии, цвет. Пример: SetLCDRectangle2(10, 10, 50, 50, 2, 0xFFE0)';
            //#endregion
            //#region---Команды Bluetooth E6
            case 'SetBluetoothData()':
                return 'Передать данные с контроллера. Параметр: данные. Пример: SetBluetoothData(50)';
            case 'GetBluetoothData()':
                return 'Получить данные по Bluetooth. Пример: GetBluetoothData()';
            case 'GetBluetoothControl()':
                return 'Получить код ключа. Пример: GetBluetoothControl()';
            case 'GetBluetoothControlData()':
                return 'Получить ключ телефона. Пример: GetBluetoothControlData()';
            case 'GetBTModuleRemoteButton()':
                return 'Получить значение ключа Bluetooth-пульта. Пример: GetBTModuleRemoteButton()';
            case 'GetBTModuleRemoteCode()':
                return 'Получить код ключа Bluetooth-пульта. Пример: GetBTModuleRemoteCode()';
            case 'GetBTModuleRemoteRocker()':
                return 'Получить направление джойстика Bluetooth-пульта. Параметры: джойстик (0/1), ось (0/1). Пример: GetBTModuleRemoteRocker(0, 1)';
            case 'GetComVoice()':
                return 'Голосовая команда. Параметр: текст. Пример: GetComVoice("Hello")';
            //#endregion
            //#region---Системные команды E6
            case 'Примеры программ':
                return 'Открывает страницу с примерами готовых программ.';
            case 'Создать папку проекта':
                return 'Создает папку для проекта. Вы выбираете место для папки, после чего система предлагает ввести ее название.';
            case 'Создать файл для проекта':
                return 'Создает новый файл проекта с готовым шаблоном для работы.';
            case 'Загрузить файл на устройство':
                return 'Загружает файл на подключенное устройство. Для использования этой команды необходимо сначала найти устройство и выбрать его в панели, расположенной под этой.';
            //#endregion
            //#region---Команды сервопривода E6
            //Малый серво
            case 'SetSeeringEngine()':
                return 'Установить маленький серовпривод в указанное положение. Параметры: канал, угол.';
            case 'SetSeeringEngineTime()':
                return 'Установить маленький серовпривод в указанное положение по времени. Параметры: канал, угол, время.';
            case 'SetServoMotor()':
                return 'Повернуть маленький серовпривод на определённый угол. Параметры: канал, угол.';
            //Обычный серво
            case 'SetServo()':
                return 'Установить обычный серовпривод в указанное положение. Параметры: канал, угол.';
            case 'SetServoTime()':
                return 'Установить обычный серовпривод в указанное положение по времени. Параметры: канал, угол, время.';
            //Супер-серво
            case 'SetMagneticServoSoftReset()':
                return 'Мягкая перезагрузка сервопривода. Параметры: порт';
            case 'SetMagneticServoState()':
                return 'Установка состояния сервопривода. Параметры: порт, перезапуск при включении(1/0), начальная скорость, начальный угол ';
            case 'SetMagneticServoDegreeTime()':
                return 'Режим сервопривода. Параметры: порт, угол, время.';
            case 'SetMagneticServoDegreeSpeed()':
                return 'Режим сервопривода. Параметры: порт, угол, скорость.';
            case 'SetMagneticServoCodeMotor()':
                return 'Режим управления по энкодеру. Параметры: порт, угол, скорость.';
            case 'SetMagneticServoMotor()':
                return 'Режим мотор-редуктора. Параметры: порт, скорость.';
            case 'SetMagneticServoPowerDown()':
                return 'Остановка выходного крутящего момента. Параметры: порт.';
            case 'GetMagneticServoDegree()':
                return 'Считать угол сервопривода. Параметры: порт.';
            case 'SetMagneticServoEncoder()':
                return 'Сбросить показания энкодера. Параметры: порт.';
            case 'GetMagneticServoEncoder()':
                return 'Прочитать показания энкодера. Параметры: порт.';
            //#endregion


            //#region---Команды моторов H
            case 'SetMotorH()':
                return 'Установка скорости мотора. Параметры: № мотора, скорость в %. Пример: SetMotor(1, 100)';
            case 'StopMotorH()':
                return 'Остановка выбранного мотора. Параметр: № мотора. Пример: StopMotorH(1)';
            case 'SetMotorCodeH()':
                return 'Обнуление оборотов мотора. Параметр - № мотора. Пример: SetMotorCode(1)';
            case 'GetMotorCodeH()':
                return 'Получение показаний относительного угла поворота. Параметр - № мотора. Пример: GetMotorCode(1)';
            case 'WaitMotorTo()':
                return 'Ожидание поворота мотора с указанной скоростью на определённое число по одному из параметров(обороты, градусы, секнуды). Параметры: № мотора, скорость, число, параметр. Пример: WaitMotorTo(1, 50, 1, 1)';
            case 'SetMotorVByOther()':
                return 'Включение мотора с указанной скоростью на определённое число по одному из параметров(обороты, градусы, секнуды). Параметры: № мотора, скорость, число, параметр. Пример: SetMotorVByOther(1, 50, 1, 1)';
            case 'GetMotorV()':
                return 'Получение скорости мотора. Параметры: № мотора. Пример: GetMotorV(1)';
            case 'GetMotorAngleH()':
                return 'Получение абсолютного угла поворота мотора. Параметр: № мотора. Пример: GetMotorAngleH(1)';
            case 'SetSteeringAngle()':
                return 'Установить вращение мотора по указанному направлению. Параметры: № мотора, направление, угол, время. Пример: SetSteeringAngle(1, 2, 50, 3)';
            //#endregion
            //#region---Команды контроллера H
            case 'SavePic()':
                return 'Сохраниние скриншота экрана. Партаметр: Имя файла. Пример: SavePic("FileName")';
            case 'SetDataH()':
                return 'Запись данных по адресу. Параметры: адрес, данные. Пример: SetDataH(50, 50)';
            case 'GetDataH()':
                return 'Чтение данных по адресу. Параметр: адрес. Пример: GetDataH(50)';
            case 'GetHRCUName()':
                return 'Получение имени контроллера. Пример: GetHRCUName(255, 9600)';
            case 'GetChangeValue()':
                return 'Получение заряда батареи. Пример: GetChangeValue()';
            case 'GetMaiVoice()':
                return 'Чтение уровня громкости микрофона. Пример: GetMaiVoice()';
            case 'GetCcrrentDate()':
                return 'Получение даты и времени. Пример: GetCcrrentDate()';
            case 'SetSaveStudyDataToFile()':
                return 'Запись эксперементальных данных в файл. Параметры: Данные, Имя файла. Пример: SetSaveStudyDataToFile(1, "FileName")';
            case 'SetShowFileData()':
                return 'Показать эксперементальные данные. Партаметр: Имя файла. Пример: SetShowFileData("FileName")';
            case 'SetDeleteStudyFile()':
                return 'Удаление файла с эксперементальными данными. Партаметр: Имя файла. Пример: SetDeleteStudyFile("FileName")';
            case 'SetEditView()':
                return 'Отображение поля ввода на экране контроллера по осям. Параметры: Х, У, описание. Пример: SetEditView(1, 1, "Text")';
            case 'GetEditViewData()':
                return 'Получить данные из поля для ввода. Пример: GetEditViewData()';
            case 'SetSaveStrToFile()':
                return 'Сохранение текста в файл. Параметры: Текст, Имя файла. Пример: SetSaveStrToFile("hello", "FileName")';
            case 'GetStrForFile()':
                return 'Получение строки из файла. Параметры: строка, Имя файла. Пример: GetStrForFile(1, "FileName")';
            case 'ShowGifExpression()':
                return 'Установка гифки на экране эмоции. Параметр: Эмоция (1-5). Пример: ShowGifExpression(2)';
            case 'GoneGifExpression()':
                return 'Стирание гифку с эмоцией. Пример: GoneGifExpression()';
            case 'ShowList()':
                return 'Показать список. Параметры: Х, У, Размер, Название. Пример: ShowList(1, 2, 2000, "Title")';
            case 'SetListItem()':
                return 'Установить название указанного элемента списка. Все элементы до него появятся с названием null. Пример: SetListItem(2, "Hello")';

            case 'SetRcuTimeTo0()':
                return 'Обнуление встроенного таймера программы. Пример: SetRcuTimeTo0()';
            case 'GetRcuTime()':
                return 'Чтение времени от начала программы. Пример: GetRcuTime()';
            //#endregion

            //Команды датчиков H
            //#region---Датчики света/цвета
            case 'Set3CLedH()':
                return 'Включение подсветки датчика света. Параметр: порт . Пример: Set3CLed(1)';
            case 'SetLightByRGB()':
                return 'Включение подсветки датчика цвета. Параметры: красный, зеленый, синий. Пример: SetLightByRGB(5, 50, 250)';
            case 'SetElcLightIfData()':
                return 'Усановка порога срабатывания для датчика света. Параметры: порт, порог. Пример: SetElcLightIfData(1, 1000)';
            case 'IsElectedData()':
                return 'Проверка соответствия показания датчика заложенному значению. Параметры: порт, больше/меньше(1/2), значение. Пример: IsElectedData(1, 1, 1000)';
            case 'WaitNewColor()':
                return 'Ожидание нового цвета. Параметры: порт. Пример: WaitNewColor(1)';
            case 'WaitThisColor()':
                return 'Ожидание конкретного цвета. Параметры: порт, цвет. Пример: WaitThisColor(1, 3)';
            case 'IsColor()':
                return 'Проверка соответствия цвета заложенному. Параметры: порт, цвет. Пример: IsColor(1, 5)';
            case 'GetColorSensorH()':
                return 'Получение показания с датчика цвета. Параметры: порт, режим (цвет/R/G/B). Пример: GetColorSensor(1, 1)';
            case 'GetLightSensorH()':
                return 'Получение показания с датчика света. Параметры: порт, режим. Пример: GetLightSensor(1, 1)';
            //#endregion
            //#region---Датчики расстояния
            case 'GetTouchH()':
                return 'Проверка нажатия на датчик. Параметр: порт. Пример: GetTouch(4)';
            case 'GetUltrasoundH()':
                return 'Чтение показания датчика расстояния. Параметры: порт. Пример: GetUltrasound(3)';
            case 'IsUltraH()':
                return 'Проверка соответствия показания датчика заложенному значению. Параметры: порт, больше/меньше(1/2), расстояние. Пример: IsUltra(3, 1, 15)';
            //#endregion
            //#region---Гироскоп
            case 'GetAttitudeData()':
                return 'Получение значения с гироскопа. Параметры: тип данных. Пример: GetAttitudeData(1)';
            case 'GetAccData()':
                return 'Получение ускорения. Параметры: ось. Пример: GetAccData(1)';
            case 'GetGyroscopeData()':
                return 'Получение угловой скорости. Параметры: ось. Пример: GetGyroscopeData(1)';
            //#endregion
            //#region---Датчик влажности и температуры
            case 'GetTempAndHumData()':
                return 'Получения значения с дачтика влажности и температуры. Параметры: порт, режим. Пример: GetTempAndHumData(8, 1)';
            //#endregion

            //#region---Команды IoT
            case 'InitIot()':
                return 'Инициализация модуля IoT. Пример: InitIot()';
            case 'SetIotDeviceData()':
                return 'Отправка данных на устройство. Параметр: число, имя устройства. Пример: SetIotDeviceData(1, "IoT")';
            case 'ResetIotResult()':
                return 'Сброс локального кэша модуля IoT. Пример: ResetIotResult()';
            case 'IsIotDeviceData()':
                return 'Сравнение информации с устройства с указанным значением. Параметры: имя устройства, значение. Пример: IsIotDeviceData("IoT", 5)';
            case 'GetIotDeviceData()':
                return 'Получение информационных данных, отправленных на устрйоство. Параметр: имя устройства. Пример: GetIotDeviceData("IoT")';
            //#endregion
            //#region---Команды WiFi
            case 'SetWifiData()':
                return 'Отправка данных в локальную сеть. Параметр: данные. Пример: SetWifiData(1)';
            case 'GetWifiData()':
                return 'Получение данных из локальной сети. Параметр: № мотора. Пример: GetWifiData()';
            case 'SetRcuBluetoothData()':
                return 'Передача данных по Bluetooth. Параметр:данные. Пример: SetRcuBluetoothData(1)';
            case 'GetRcuBluetoothData()':
                return 'Получение данных по Bluetooth. Параметр - № мотора. Пример: GetRcuBluetoothData()';
            case 'OpenCameraForPhone()':
                return 'Включение/отключение камеры. Параметры: вкл/выкл. Пример: OpenCameraForPhone(1)';
            case 'SendWifiBtnDescribe()':
                return 'Отправка команды с контроллера для установки описания указанной кнопки, отображаемой в приложении дистанционного управления. Параметры: кнопка (1-4), "имя". Пример: SendWifiBtnDescribe(1, "Up")';
            case 'IsPhoneWiFiYGData()':
                return 'Проверка нажатия кнопки в приложении дистанционного управления. Параметры: кнопка. Пример: IsPhoneWiFiYGData(1)';
            case 'IsPhoneWiFiBtnData()':
                return 'Проверка, находится ли указанный джойстик в указанном направлении в приложении дистанционного управления. Параметры: джойстик, направление. Пример: IsPhoneWiFiBtnData(1, 1)';
            case 'GetPhoneWiFiYGData()':
                return 'Получение координат указанного джойстика, по указанной оси в приложении дистанционного управления. Параметры: джойстик, ось. Пример: GetPhoneWiFiYGData(1, 1)';
            //#endregion
            //#region---Команды AI
            case 'StartCamera()':
                return 'Управление камерой. Параметры: вкл/выкл(1/2), режим(1-14). Пример: StartCamera(1, 5)';
            case 'SetRoadHsv()':
                return 'Настройка распознавания линии по системе HSV. Устанавливает верхний лимит. Параметры: H(тон), S(насыщенность), V(яркость). Пример: SetRoadHsv(180, 255, 50)';
            case 'IsRoadBlack()':
                return 'Проверка. распознаёт ли камера чёрную линию. Пример: IsRoadBlack()';
            case 'GetRoadAngle()':
                return 'Получение угла между направлением движения робота и линией. Пример: GetRoadAngle()';
            case 'SetFaceRegister()':
                return 'Запись лица для распознания. Параметр: "Имя", Пример: SetFaceRegister("Kirill")';
            case 'SetCameraShow()':
                return 'Включить/отключить демонстрацию изображения с камеры на экран контроллера. Параметры: вкл/выкл(1-2). Пример: SetCameraShow(1)';
            case 'SetTTSSpeack()':
                return 'Прочитать текст. Параметры: "Текст". Пример: SetTTSSpeack("Hello")';
            case 'ResetAiResult()':
                return 'Сбросить все результаты. Пример: ResetAiResult()';
            case 'IsColorForCamera()':
                return 'Проверка, соответствует ли цвет на камере указанному. Параметр: цвет. Пример: IsColorForCamera(1)';
            case 'GetPoseData()':
                return 'Проверка, соответсвует ли жест на камере указанному. Пример: GetPoseData(1)';
            case 'GetSimplePoseList()':
                return 'Получение координат точек лица для распознования. Параметры: точка, x/y(1/2). Пример: GetSimplePoseList(5, 1)';
            case 'GetWeather()':
                return 'Получение данных о погоде в указанном городе. Параметры: город, параметр Пример: GetWeather("北京", 1)';
            case 'GetAiData()':
                return 'Получиение заданных результатов распознания через камеру. Параметр: требуемы результат(1-5). Пример: GetAiData(1)';
            case 'GetZxing()':
                return 'Получение результатов чтения QR кода. Пример: GetZxing()';
            case 'GetBlackLineData()':
                return 'Получение результатов распознания чёрной линии. Пример: GetBlackLineData()';
            case 'StartOnnxCamera()':
                return 'Запуск/остановка работы альтернативного алгоритма AI. Параметры: Вкл/выкл(1-2), имя модели, показать/скрыть результат. Пример: StartOnnxCamera(1,"model.onnx",1)';
            case 'GetOnnxZXD()':
                return 'Установка уровня достоверности результата. Параметр: уровень остоверности. Пример: GetOnnxZXD(1)';
            case 'GetOnnxResult()':
                return 'Получение результатов распознания по альтернативному алгоритму. Параметр: результат/уровень достоверности Пример: GetOnnxResult()';
            case 'Проверка, соответсвует ли результат работы альтернативной модели, как указанный. Параметр: реузьтат. Пример: IsOnnxResult(1)':
                return '. Пример: IsOnnxResult()';
            //#endregion

            //#region---Команды AI Cloud
            case 'StartBDApi()':
                return '. Параметры: . Пример: StartBDApi()';
            case 'SetTextRecognize()':
                return '. Параметры: . Пример: SetTextRecognize()';
            case 'GetTextRecognizeResult()':
                return '. Параметры: . Пример: GetTextRecognizeResult()';
            case 'StartBDVoiceRecognize()':
                return '. Параметры: . Пример: StartBDVoiceRecognize()';
            case 'StartBDVoiceRecognizeOnce()':
                return '. Параметры: . Пример: StartBDVoiceRecognizeOnce()';
            case 'GetVoiceData()':
                return '. Параметры: . Пример: GetVoiceData()';
            case 'InitXhSDK()':
                return '. Параметры: . Пример: InitXhSDK()';
            case 'UseInsetChatUi()':
                return '. Параметры: . Пример: UseInsetChatUi()';
            case 'StartDSTTSSpeack()':
                return '. Параметры: . Пример: StartDSTTSSpeack()';
            case 'IsFinishTTS()':
                return '. Параметры: . Пример: IsFinishTTS()';
            case 'StartChat()':
                return '. Параметры: . Пример: StartChat()';
            case 'AddActionCode()':
                return '. Параметры: . Пример: AddActionCode()';
            case 'ResetXHCash()':
                return '. Параметры: . Пример: ResetXHCash()';
            case 'GetChatReceive()':
                return '. Параметры: . Пример: GetChatReceive()';
            case 'GetChatListData()':
                return '. Параметры: . Пример: GetChatListData()';
            case 'GetChatListSize()':
                return '. Параметры: . Пример: GetChatListSize()';
            case 'GetChatAllReceive()':
                return '. Параметры: . Пример: GetChatAllReceive()';
            case 'GetAiDoInstructionSize()':
                return '. Параметры: . Пример: GetAiDoInstructionSize()';
            case 'GetAiDoInstruction()':
                return '. Параметры: . Пример: GetAiDoInstruction()';

            //#endregion
            //#region---Команды экрана H
            case 'SetDisplayString()':
                return '. Параметры: . Пример: SetDisplayString()';
            case 'SetLCDClear()':
                return '. Параметры: . Пример: SetLCDClear()';
            case 'GetIsTouch()':
                return '. Параметры: . Пример: GetIsTouch()';
            case 'GetTouchScreenXY()':
                return '. Параметры: . Пример: GetTouchScreenXY()';
            case 'SetFontSize()':
                return '. Параметры: . Пример: SetFontSize()';
            case 'SetAlpha()':
                return '. Параметры: . Пример: SetAlpha()';
            case 'SetDisplayStringXYS()':
                return '. Параметры: . Пример: SetDisplayStringXYS()';
            case 'SetZxing()':
                return '. Параметры: . Пример: SetZxing()';
            case 'SetDisplayPicture()':
                return '. Параметры: . Пример: SetDisplayPicture()';
            case 'SetLCDDot()':
                return '. Параметры: . Пример: SetLCDDot()';
            case 'SetLCDLine()':
                return '. Параметры: . Пример: SetLCDLine()';
            case 'SetLCDSolidCircle()':
                return '. Параметры: . Пример: SetLCDSolidCircle()';
            case 'SetLCDFilledRectangle2()':
                return '. Параметры: . Пример: SetLCDFilledRectangle2()';
            case 'SetLCDRectangle2()':
                return '. Параметры: . Пример: SetLCDRectangle2()';
            //#endregion
            //#region---Команды звука H
            case 'StartMp3ByPai()':
                return '. Параметры: . Пример: StartMp3ByPai()';
            case 'PlayVoiceByName()':
                return '. Параметры: . Пример: PlayVoiceByName()';
            case 'StartMp3ByPath()':
                return '. Параметры: . Пример: StartMp3ByPath()';
            case 'WaitMp3ByPath()':
                return '. Параметры: . Пример: WaitMp3ByPath()';
            case 'SetMp3Suspend()':
                return '. Параметры: . Пример: SetMp3Suspend()';
            case 'StartRecord()':
                return '. Параметры: . Пример: StartRecord()';
            case 'PlayRecord()':
                return '. Параметры: . Пример: PlayRecord()';
            case 'AddVoiceSpeed()':
                return '. Параметры: . Пример: AddVoiceSpeed()';
            case 'SetVoiceSpeed()':
                return '. Параметры: . Пример: SetVoiceSpeed()';
            case 'AddVoiceValue()':
                return '. Параметры: . Пример: AddVoiceValue()';
            case 'SetVoiceValue()':
                return '. Параметры: . Пример: SetVoiceValue()';
            case 'StopAllVoice()':
                return '. Параметры: . Пример: StopAllVoice()';
            case 'GetVoiceValue()':
                return '. Параметры: . Пример: GetVoiceValue()';
            case 'GetVoiceSpeed()':
                return '. Параметры: . Пример: GetVoiceSpeed()';
            //#endregion
            //#region---Команды Move H
            case 'SetStartMotorLorR()':
                return 'Установка портов для робота. Параметры: левый мотор, правый мотор. Пример: SetStartMotorLorR(1, 2)';
            case 'SetMotorsByTime()':
                return 'Движение с заданной скоростью указанное время. Параметры: скорость, время. Пример: SetMotorsByTime(50, 1)';
            case 'SetMotors()':
                return 'Движение с заданной скоростью. Параметры: скорость. Пример: SetMotors(70)';
            case 'SetMotorsByLength()':
                return 'Движение с заданной скоростью на указанное расстояние. Параметры: скорость, расстояние. Пример: SetMotorsByLength(50, 100)';
            case 'SetOneCircleSize()':
                return 'Установка длины окружности шин. Параметры: см. Пример: SetOneCircleSize(20.7)';
            case 'SetMotorsAngle()':
                return 'Поворот в указанную сторону с указанной скоростью в течении определенного времени. Параметры: скорость, сторона, время. Пример: SetMotorsAngle(50, 1, 2)';
            case 'StopMotorRun()':
                return 'Остановка движения. Пример: StopMotorRun()';
            case 'WaitMotorByPercent()':
                return 'Движение каждого мотора с указанной скоростью в течении определенного времени. Параметры: скороть правого мотора, скорость левого мотора, время. Пример: WaitMotorByPercent(50, -50, 5)';
            case 'SetMotorByPercent()':
                return 'Установка скорости каждого из моторов. Параметры: скороть правого мотора, скорость левого мотора. Пример: SetMotorByPercent(50, 20)';
            //#endregion
            //#region---Команды Mecanum колёс
            case 'SetMecanumwheel()':
                return 'Установка портов для робота на Mecanum колёсах. Параметры: левое-переднее, правое-переднее, левое-заднее, правое-заднее. Пример: SetMecanumwheel(1, 2, 3, 4)';
            case 'SetMecanumSpeed()':
                return 'Установка скорости вращения каждого из колёс. Параметры: левое-переднее, правое-переднее, левое-заднее, правое-заднее. Пример: SetMecanumSpeed(50, -50, 50, -50)';
            case 'SetMecanumMoveLR()':
                return 'Движение указанное время с указанной скоростью в нужную сторону. Параметры: скорость, сторона, время. Пример: SetMecanumMoveLR(50, 1 , 90)';
            case 'SetCarSpeed()':
                return 'Установка скорости робота. Параметры: скорость. Пример: SetCarSpeed(70)';
            case 'SetCarStop()':
                return 'Остановка движения. Пример: SetCarStop()';
            case 'SetCarToAngleTime()':
                return 'Поворот указанное время на указанное число градусов. Параметры: угол, время. Пример: SetCarToAngleTime(30, 1)';
            case 'SetCarToAngle()':
                return 'Поворот на указанный угол. Параметры:угол . Пример: SetCarToAngle(90)';
            case 'SetCarToRLTime()':
                return 'Поворот в указанную сторону на определенное время. Параметры: сторона, время. Пример: SetCarToRLTime(1, 30)';
            case 'SetCarToRL()':
                return 'Поворот в указанную сторону. Параметр: сторона. Пример: SetCarToRL(1)';
            //#endregion
            //#region---Команды кубика Рубика
            case 'StartCameraRub()':
                return 'Запускает камеру для сборки кубира Рубика. Параметры: Состояние, режим. Пример: StartCameraRub("开启", "魔方颜色识别")';
            case 'StartMFBtn()':
                return 'Начало сборки. Пример: StartMFBtn()'
            case 'UpdateRcuUi()':
                return 'Обновить состояние програсса сборки. Параметры: текущее значение, максимум . Пример: UpdateRcuUi(5, 100)';
            case 'IsMfConnect()':
                return 'Проверка, начата ли сборка. Пример: IsMfConnect()';
            case 'GetMFExist()':
                return 'Проверка, существует ли кубик Рубика. Пример: GetMFExist()';
            case 'GetMfChaos()':
                return 'Проверка, не перемещён ли кубик случайно. Пример: GetMfChaos()';
            case 'SeRunNexttCarToRL()':
                return 'Выполнить следующий шаг сборки. Пример: SeRunNexttCarToRL()';
            case 'StartMFColor()':
                return 'Определить количество квадратов указанного цвета. Параметр: цвет. Пример: StartMFColor(1)';
            case 'MfStepNum()':
                return 'Уузнать количество выполненных шагов по сборке. Пример: MfStepNum()';
            case 'MfUseTime()':
                return 'Получить текущее время сборки. Пример: MfUseTime()';
            //#endregion
            default:
                return '';
        }
    }
}