"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E7_TREE = exports.HRCU_TREE = exports.ERCU_TREE = void 0;
exports.ERCU_TREE = [
    {
        label: 'Моторы',
        children: [
            { label: 'SetMotor()', commandId: 'motor.SetMotor' },
            { label: 'SetMotorStop()', commandId: 'motor.SetMotorStop' },
            { label: 'SetMotorCode()', commandId: 'motor.SetMotorCode' },
            { label: 'GetMotorCode()', commandId: 'motor.GetMotorCode' },
            { label: 'SetMotorSecond()', commandId: 'motor.SetMotorSecond' },
            { label: 'SetMotorAngleDelay()', commandId: 'motor.SetMotorAngleDelay' },
            { label: 'SetMotorConstSpeed()', commandId: 'motor.SetMotorConstSpeed' },
            { label: 'SetMotorAngle()', commandId: 'motor.SetMotorAngle' },
            { label: 'SetMotorDirection()', commandId: 'motor.SetMotorDirection' },
        ]
    },
    {
        label: 'Колёсная база',
        children: [
            { label: 'SetMoveInitialize()', commandId: 'move.SetMoveInitialize' },
            { label: 'SetMoveRunSecond()', commandId: 'move.SetMoveRunSecond' },
            { label: 'SetMoveRunAngle()', commandId: 'move.SetMoveRunAngle' },
            { label: 'SetMoveRun()', commandId: 'move.SetMoveRun' },
            { label: 'SetMoveStop()', commandId: 'move.SetMoveStop' },
            { label: 'SetMoveSpeedSecond()', commandId: 'move.SetMoveSpeedSecond' },
            { label: 'SetMoveSpeed()', commandId: 'move.SetMoveSpeed' },
            { label: 'SetMovePower()', commandId: 'move.SetMovePower' },
            { label: 'SetMotorPower()', commandId: 'move.SetMotorPower' },
        ]
    },
    {
        label: 'Сервоприводы',
        children: [
            {
                label: 'Малый сервопривод',
                children: [
                    { label: 'SetSeeringEngine()', commandId: 'servo.SetSeeringEngine' },
                    { label: 'SetSeeringEngineTime()', commandId: 'servo.SetSeeringEngineTime' },
                    { label: 'SetServoMotor()', commandId: 'servo.SetServoMotor' },
                ]
            },
            {
                label: 'Обычный сервопривод',
                children: [
                    { label: 'SetServo()', commandId: 'servo.SetServo' },
                    { label: 'SetServoTime()', commandId: 'servo.SetServoTime' },
                ]
            },
            {
                label: 'Многофункциональный сервопривод',
                children: [
                    { label: 'SetMagneticServoPowerDown()', commandId: 'servo.SetMagneticServoPowerDown' },
                    { label: 'GetMagneticServoDegree()', commandId: 'servo.GetMagneticServoDegree' },
                    { label: 'SetMagneticServoEncoder()', commandId: 'servo.SetMagneticServoEncoder' },
                    { label: 'GetMagneticServoEncoder()', commandId: 'servo.GetMagneticServoEncoder' },
                    { label: 'SetMagneticServoMotor()', commandId: 'servo.SetMagneticServoMotor' },
                    { label: 'SetMagneticServoCodeMotor()', commandId: 'servo.SetMagneticServoCodeMotor' },
                    { label: 'SetMagneticServoDegreeSpeed()', commandId: 'servo.SetMagneticServoDegreeSpeed' },
                    { label: 'SetMagneticServoDegreeTime()', commandId: 'servo.SetMagneticServoDegreeTime' },
                    { label: 'SetMagneticServoState()', commandId: 'servo.SetMagneticServoState' },
                    { label: 'SetMagneticServoSoftReset()', commandId: 'servo.SetMagneticServoSoftReset' },
                ]
            },
        ]
    },
    {
        label: 'Контроллер',
        children: [
            { label: 'Wait()', commandId: 'rcu.SetWaitForTime' },
            { label: 'GetData()', commandId: 'rcu.GetData' },
            { label: 'SetData()', commandId: 'rcu.SetData' },
            { label: 'SetRcuStop()', commandId: 'rcu.SetRcuStop' },
            { label: 'GetRandom()', commandId: 'rcu.GetRandom' },
            { label: 'GetLeftButton()', commandId: 'rcu.GetLeftButton' },
            { label: 'GetRightButton()', commandId: 'rcu.GetRightButton' },
            { label: 'WaitLeftButtonPressed()', commandId: 'rcu.WaitLeftButtonPressed' },
            { label: 'WaitRightButtonPressed()', commandId: 'rcu.WaitRightButtonPressed' },
            { label: 'WaitRightButtonReleased()', commandId: 'rcu.WaitRightButtonReleased' },
            { label: 'WaitLeftButtonReleased()', commandId: 'rcu.WaitLeftButtonReleased' },
            { label: 'SetSysTime()', commandId: 'rcu.SetSysTime' },
            { label: 'GetSysTime()', commandId: 'rcu.GetSysTime' },
            { label: 'GetInVoltage()', commandId: 'rcu.GetInVotage' },
            { label: 'SetInSound()', commandId: 'rcu.SetInSound' },
            { label: 'SetUartData()', commandId: 'rcu.SetUartData' },
            { label: 'GetUartData()', commandId: 'rcu.GetUartData' },
            { label: 'GetInMic()', commandId: 'rcu.GetInMic' },
            { label: 'GetMcuID()', commandId: 'rcu.GetMcuID' },
            { label: 'GetSysVersion()', commandId: 'rcu.GetSysVersion' },
            { label: 'GetSysLanguage()', commandId: 'rcu.GetSysLanguage' },
            { label: 'GetRGB()', commandId: 'rcu.GetRGB' },
        ]
    },
    {
        label: 'Датчики',
        children: [
            {
                label: 'Датчики света/цвета',
                children: [
                    { label: 'Set3CLED()', commandId: 'sensor.Set3CLed' },
                    { label: 'SetLightSensorLED()', commandId: 'sensor.SetLightSensorLed' },
                    { label: 'GetLightSensorData()', commandId: 'sensor.GetLightSensorData' },
                    { label: 'GetLightSensor()', commandId: 'sensor.GetLightSensor' },
                    { label: 'GetColorSensor()', commandId: 'sensor.GetColorSensor' },
                ]
            },
            {
                label: 'Датчики расстояния',
                children: [
                    { label: 'GetTouch()', commandId: 'sensor.GetTouch' },
                    { label: 'GetUltrasound()', commandId: 'sensor.GetUltrasound' },
                    { label: 'SetUltrasoundled()', commandId: 'sensor.SetUltrasoundled' },
                    { label: 'GetShortIRDist()', commandId: 'sensor.GetShortIRDist' },
                    { label: 'GetLaserDist()', commandId: 'sensor.GetLaserDist' },
                ]
            },
            {
                label: 'Камера',
                children: [
                    { label: 'SetAICamData()', commandId: 'ai.SetAICamData' },
                    { label: 'SetWaitForAICamData()', commandId: 'ai.SetWaitForAICamData' },
                    { label: 'SetAICamLED()', commandId: 'ai.SetAICamLED' },
                    { label: 'GetAICamVoice()', commandId: 'ai.GetAICamVoice' },
                    { label: 'GetAICamData()', commandId: 'ai.GetAICamData' },
                ]
            },
            {
                label: 'Модуль линии',
                children: [
                    { label: 'LineSetInitialize()', commandId: 'trace.LineSetInitialize' },
                    { label: 'LineIntersectionStop()', commandId: 'trace.LineIntersectionStop' },
                    { label: 'LineMillisecond()', commandId: 'trace.LineMillisecond' },
                    { label: 'LineForBmp()', commandId: 'trace.LineForBmp' },
                    { label: 'LineTurnEncounterline()', commandId: 'trace.LineTurnEncounterline' },
                    { label: 'LineBasis()', commandId: 'trace.LineBasis' },
                    { label: 'GetTraceV2I2C()', commandId: 'trace.GetTraceV2I2C' },
                    { label: 'GetTraceV2I2CState()', commandId: 'trace.GetTraceV2I2CState' },
                    { label: 'GetTraceV2I2CChxState()', commandId: 'trace.GetTraceV2I2CChxState' },
                    { label: 'SetTraceV2I2AllColor()', commandId: 'trace.SetTraceV2I2AllColor' },
                    { label: 'SetTraceV2I2Color()', commandId: 'trace.SetTraceV2I2Color' },
                    { label: 'SetTraceV2I2Threshold()', commandId: 'trace.SetTraceV2I2Threshold' },
                ]
            },
            {
                label: 'Гироскоп',
                children: [
                    { label: 'SetAHRS()', commandId: 'sensor.SetAHRS' },
                    { label: 'GetAHRS()', commandId: 'sensor.GetAHRS' },
                ]
            },
            {
                label: 'Gyro',
                children: [
                    { label: 'Create object gyro', commandId: 'Create_object_gyro' },
                    { label: 'ReadGyro()', commandId: 'gyro.ReadGyro' },
                ]
            },
            {
                label: 'Датчик жестов',
                children: [
                    { label: 'GetGesture()', commandId: 'sensor.GetGesture' },
                ]
            },
            {
                label: 'Барометр',
                children: [
                    { label: 'GetAirPressure()', commandId: 'sensor.GetAirPressure' },
                ]
            },
            {
                label: 'Датчик температуры и влажности',
                children: [
                    { label: 'GetSht30()', commandId: 'sensor.GetSht30' },
                ]
            },
            {
                label: 'Датчик магнитного поля',
                children: [
                    { label: 'GetMagnetic()', commandId: 'sensor.GetMagnetic' },
                ]
            },
            {
                label: 'Умный глаз',
                children: [
                    { label: 'SetSmartEyeMode()', commandId: 'sensor.SetSmartEyeMode' },
                    { label: 'SetSmartEyeAllLed()', commandId: 'sensor.SetSmartEyeAllLed' },
                    { label: 'SetSmartEyeIRcode()', commandId: 'sensor.SetSmartEyeIRcode' },
                    { label: 'GetSmartEyeIRcode()', commandId: 'sensor.GetSmartEyeIRcode' },
                    { label: 'GetSmartEyeDist()', commandId: 'sensor.GetSmartEyeDist' },
                ]
            },
        ]
    },
    {
        label: 'Звуки',
        children: [
            { label: 'SoundStartBeep()', commandId: 'rcu.SoundStartBeep' },
            { label: 'SetInSound()', commandId: 'rcu.SetInSound' },
            { label: 'SetInBeep()', commandId: 'rcu.SetInBeep' },
            { label: 'SoundMp3()', commandId: 'rcu.SoundMp3' },
            { label: 'SetMp3Play()', commandId: 'rcu.SetMp3Play' },
            { label: 'SetMp3Suspend()', commandId: 'rcu.SetMp3Suspend' },
            { label: 'SetMp3Sound()', commandId: 'rcu.SetMp3Sound' },
        ]
    },
    {
        label: 'Экран',
        children: [
            { label: 'SetLCDClear()', commandId: 'rcu.SetLCDClear' },
            { label: 'SetDisplayString()', commandId: 'rcu.SetDisplayString' },
            { label: 'GetTouchScreen()', commandId: 'rcu.GetTouchScreen' },
            { label: 'GetTouchScreenX()', commandId: 'rcu.GetTouchScreenX' },
            { label: 'GetTouchScreenY()', commandId: 'rcu.GetTouchScreenY' },
            { label: 'SetFontSize()', commandId: 'rcu.SetFontSize' },
            { label: 'SetDisplayVar()', commandId: 'rcu.SetDisplayVar' },
            { label: 'SetDisplayPicture()', commandId: 'rcu.SetDisplayPicture' },
            { label: 'SetDisplayVarXY()', commandId: 'rcu.SetDisplayVarXY' },
            { label: 'SetDisplayStringXY()', commandId: 'rcu.SetDisplayStringXY' },
            { label: 'SetDisplayVarU32()', commandId: 'rcu.SetDisplayVarU32' },
            { label: 'SetLCDDot()', commandId: 'rcu.SetLCDDot' },
            { label: 'SetLCDSolidCircle()', commandId: 'rcu.SetLCDSolidCircle' },
            { label: 'SetLCDLine()', commandId: 'rcu.SetLCDLine' },
            { label: 'SetLCDFilledRectangle2()', commandId: 'rcu.SetLCDFilledRectangle2' },
            { label: 'SetLCDRectangle2()', commandId: 'rcu.SetLCDRectangle2' },
        ]
    },
    {
        label: 'Bluetooth',
        children: [
            { label: 'SetBluetoothData()', commandId: 'rcu.SetBluetoothData' },
            { label: 'GetBluetoothData()', commandId: 'rcu.GetBluetoothData' },
            { label: 'GetBluetoothControl()', commandId: 'rcu.GetBluetoothControl' },
            { label: 'GetBluetoothControlData()', commandId: 'rcu.GetBluetoothControlData' },
            { label: 'GetBTModuleRemoteButton()', commandId: 'rcu.GetBTModuleRemoteButton' },
            { label: 'GetBTModuleRemoteCode()', commandId: 'rcu.GetBTModuleRemoteCode' },
            { label: 'GetBTModuleRemoteRocker()', commandId: 'rcu.GetBTModuleRemoteRocker' },
            { label: 'GetComVoice()', commandId: 'rcu.GetComVoice' },
        ]
    },
    {
        label: 'Циклы и условия',
        children: [
            { label: 'If', commandId: 'control.if' },
            { label: 'If-Else', commandId: 'control.ifelse' },
            { label: 'If-Elif-Else', commandId: 'control.ifelifelse' },
            { label: 'While', commandId: 'control.while' },
            { label: 'While True', commandId: 'control.whiletrue' },
            { label: 'For', commandId: 'control.for' },
            { label: 'sgn() — знак числа', commandId: 'control.sgn' },
        ]
    },
];
exports.HRCU_TREE = [
    {
        label: 'Моторы',
        children: [
            { label: 'SetMotor()', commandId: 'rcu.SetMotorH' },
            { label: 'GetMotorCode()', commandId: 'rcu.GetMotorCodeH' },
            { label: 'SetMotorCode()', commandId: 'rcu.SetMotorCodeH' },
            { label: 'StopMotor()', commandId: 'rcu.StopMotorH' },
            { label: 'WaitMotorTo()', commandId: 'rcu.WaitMotorTo' },
            { label: 'SetMotorVByOther()', commandId: 'rcu.SetMotorVByOther' },
            { label: 'SetSteeringAngle()', commandId: 'rcu.SetSteeringAngle' },
            { label: 'GetMotorAngle()', commandId: 'rcu.GetMotorAngleH' },
            { label: 'GetMotorV()', commandId: 'rcu.GetMotorV' }
        ]
    },
    {
        label: 'Датчики',
        children: [
            {
                label: 'Датчики света/цвета',
                children: [
                    { label: 'Set3CLed()', commandId: 'rcu.Set3CLedH' },
                    { label: 'SetLightByRGB()', commandId: 'rcu.SetLightByRGB' },
                    { label: 'SetElcLightIfData()', commandId: 'rcu.SetElcLightIfData' },
                    { label: 'IsElectedData()', commandId: 'rcu.IsElectedData' },
                    { label: 'WaitNewColor()', commandId: 'rcu.WaitNewColor' },
                    { label: 'WaitThisColor()', commandId: 'rcu.WaitThisColor' },
                    { label: 'IsColor()', commandId: 'rcu.IsColor' },
                    { label: 'GetColorSensor()', commandId: 'rcu.GetColorSensorH' },
                    { label: 'GetLightSensor()', commandId: 'rcu.GetLightSensorH' }
                ]
            },
            {
                label: 'Датчики расстояния',
                children: [
                    { label: 'GetTouch()', commandId: 'rcu.GetTouchH' },
                    { label: 'GetUltrasound()', commandId: 'rcu.GetUltrasoundH' },
                    { label: 'IsUltra()', commandId: 'rcu.IsUltraH' }
                ]
            },
            {
                label: 'Гироскоп',
                children: [
                    { label: 'GetAttitudeData()', commandId: 'rcu.GetAttitudeData' },
                    { label: 'GetAccData()', commandId: 'rcu.GetAccData' },
                    { label: 'GetGyroscopeData()', commandId: 'rcu.GetGyroscopeData' }
                ]
            },
            {
                label: 'Датчик влажности и температуры',
                children: [
                    { label: 'GetTempAndHumData()', commandId: 'rcu.GetTempAndHumData' }
                ]
            }
        ]
    },
    {
        label: 'Контроллер',
        children: [
            { label: 'SetRcuTimeTo0()', commandId: 'rcu.SetRcuTimeTo0' },
            { label: 'GetData()', commandId: 'rcu.GetDataH' },
            { label: 'SetData()', commandId: 'rcu.SetDataH' },
            { label: 'GetRcuTime()', commandId: 'rcu.GetRcuTime' },
            { label: 'SavePic()', commandId: 'rcu.SavePic' },
            { label: 'GetHRCUName()', commandId: 'rcu.GetHRCUName' },
            { label: 'GetChangeValue()', commandId: 'rcu.GetChangeValue' },
            { label: 'GetMaiVoice()', commandId: 'rcu.GetMaiVoice' },
            { label: 'GetCcrrentDate()', commandId: 'rcu.GetCcrrentDate' },
            { label: 'SetSaveStudyDataToFile()', commandId: 'rcu.SetSaveStudyDataToFile' },
            { label: 'SetShowFileData()', commandId: 'rcu.SetShowFileData' },
            { label: 'SetDeleteStudyFile()', commandId: 'rcu.SetDeleteStudyFile' },
            { label: 'SetEditView()', commandId: 'rcu.SetEditView' },
            { label: 'GetEditViewData()', commandId: 'rcu.GetEditViewData' },
            { label: 'SetSaveStrToFile()', commandId: 'rcu.SetSaveStrToFile' },
            { label: 'GetStrForFile()', commandId: 'rcu.GetStrForFile' },
            { label: 'ShowGifExpression()', commandId: 'rcu.ShowGifExpression' },
            { label: 'GoneGifExpression()', commandId: 'rcu.GoneGifExpression' },
            { label: 'ShowList()', commandId: 'rcu.ShowList' },
            { label: 'SetListItem()', commandId: 'rcu.SetListItem' }
        ]
    },
    {
        label: 'Колёсная база',
        children: [
            { label: 'SetStartMotorLorR()', commandId: 'rcu.SetStartMotorLorR' },
            { label: 'SetMotorsByTime()', commandId: 'rcu.SetMotorsByTime' },
            { label: 'SetMotors()', commandId: 'rcu.SetMotors' },
            { label: 'SetMotorsByLength()', commandId: 'rcu.SetMotorsByLength' },
            { label: 'SetOneCircleSize()', commandId: 'rcu.SetOneCircleSize' },
            { label: 'SetMotorsAngle()', commandId: 'rcu.SetMotorsAngle' },
            { label: 'StopMotorRun()', commandId: 'rcu.StopMotorRun' },
            { label: 'WaitMotorByPercent()', commandId: 'rcu.WaitMotorByPercent' },
            { label: 'SetMotorByPercent()', commandId: 'rcu.SetMotorByPercent' }
        ]
    },
    {
        label: 'Iot',
        children: [
            { label: 'InitIot()', commandId: 'rcu.InitIot' },
            { label: 'SetIotDeviceData()', commandId: 'rcu.SetIotDeviceData' },
            { label: 'ResetIotResult()', commandId: 'rcu.ResetIotResult' },
            { label: 'IsIotDeviceData()', commandId: 'rcu.IsIotDeviceData' },
            { label: 'GetIotDeviceData()', commandId: 'rcu.GetIotDeviceData' }
        ]
    },
    {
        label: 'WiFi',
        children: [
            { label: 'SetWifiData()', commandId: 'rcu.SetWifiData' },
            { label: 'GetWifiData()', commandId: 'rcu.GetWifiData' },
            { label: 'SetRcuBluetoothData()', commandId: 'rcu.SetRcuBluetoothData' },
            { label: 'GetRcuBluetoothData()', commandId: 'rcu.GetRcuBluetoothData' },
            { label: 'OpenCameraForPhone()', commandId: 'rcu.OpenCameraForPhone' },
            { label: 'SendWifiBtnDescribe()', commandId: 'rcu.SendWifiBtnDescribe' },
            { label: 'IsPhoneWiFiYGData()', commandId: 'rcu.IsPhoneWiFiYGData' },
            { label: 'IsPhoneWiFiBtnData()', commandId: 'rcu.IsPhoneWiFiBtnData' },
            { label: 'GetPhoneWiFiYGData()', commandId: 'rcu.GetPhoneWiFiYGData' }
        ]
    },
    {
        label: 'AI',
        children: [
            { label: 'StartCamera()', commandId: 'rcu.StartCamera' },
            { label: 'SetRoadHsv()', commandId: 'rcu.SetRoadHsv' },
            { label: 'IsRoadBlack()', commandId: 'rcu.IsRoadBlack' },
            { label: 'GetRoadAngle()', commandId: 'rcu.GetRoadAngle' },
            { label: 'SetFaceRegister()', commandId: 'rcu.SetFaceRegister' },
            { label: 'SetCameraShow()', commandId: 'rcu.SetCameraShow' },
            { label: 'SetTTSSpeack()', commandId: 'rcu.SetTTSSpeack' },
            { label: 'ResetAiResult()', commandId: 'rcu.ResetAiResult' },
            { label: 'IsColorForCamera()', commandId: 'rcu.IsColorForCamera' },
            { label: 'GetPoseData()', commandId: 'rcu.GetPoseData' },
            { label: 'GetSimplePoseList()', commandId: 'rcu.GetSimplePoseList' },
            { label: 'GetWeather()', commandId: 'rcu.GetWeather' },
            { label: 'GetAiData()', commandId: 'rcu.GetAiData' },
            { label: 'GetZxing()', commandId: 'rcu.GetZxing' },
            { label: 'GetBlackLineData()', commandId: 'rcu.GetBlackLineData' },
            { label: 'StartOnnxCamera()', commandId: 'rcu.StartOnnxCamera' },
            { label: 'GetOnnxZXD()', commandId: 'rcu.GetOnnxZXD' },
            { label: 'GetOnnxResult()', commandId: 'rcu.GetOnnxResult' },
            { label: 'IsOnnxResult()', commandId: 'rcu.IsOnnxResult' }
        ]
    },
    {
        label: 'AI Cloud',
        children: [
            { label: 'StartBDApi()', commandId: 'rcu.StartBDApi' },
            { label: 'SetTextRecognize()', commandId: 'rcu.SetTextRecognize' },
            { label: 'GetTextRecognizeResult()', commandId: 'rcu.GetTextRecognizeResult' },
            { label: 'StartBDVoiceRecognize()', commandId: 'rcu.StartBDVoiceRecognize' },
            { label: 'StartBDVoiceRecognizeOnce()', commandId: 'rcu.StartBDVoiceRecognizeOnce' },
            { label: 'GetVoiceData()', commandId: 'rcu.GetVoiceData' },
            { label: 'InitXhSDK()', commandId: 'rcu.InitXhSDK' },
            { label: 'UseInsetChatUi()', commandId: 'rcu.UseInsetChatUi' },
            { label: 'StartDSTTSSpeack()', commandId: 'rcu.StartDSTTSSpeack' },
            { label: 'IsFinishTTS()', commandId: 'rcu.IsFinishTTS' },
            { label: 'StartChat()', commandId: 'rcu.StartChat' },
            { label: 'AddActionCode()', commandId: 'rcu.AddActionCode' },
            { label: 'ResetXHCash()', commandId: 'rcu.ResetXHCash' },
            { label: 'GetChatReceive()', commandId: 'rcu.GetChatReceive' },
            { label: 'GetChatListData()', commandId: 'rcu.GetChatListData' },
            { label: 'GetChatListSize()', commandId: 'rcu.GetChatListSize' },
            { label: 'GetChatAllReceive()', commandId: 'rcu.GetChatAllReceive' },
            { label: 'GetAiDoInstructionSize()', commandId: 'rcu.GetAiDoInstructionSize' },
            { label: 'GetAiDoInstruction()', commandId: 'rcu.GetAiDoInstruction' }
        ]
    },
    {
        label: 'Экран',
        children: [
            { label: 'SetDisplayString()', commandId: 'rcu.SetDisplayStringH' },
            { label: 'SetLCDClear()', commandId: 'rcu.SetLCDClearH' },
            { label: 'GetIsTouch()', commandId: 'rcu.GetIsTouchH' },
            { label: 'GetTouchScreenXY()', commandId: 'rcu.GetTouchScreenXYH' },
            { label: 'SetFontSize()', commandId: 'rcu.SetFontSizeH' },
            { label: 'SetAlpha()', commandId: 'rcu.SetAlphaH' },
            { label: 'SetDisplayStringXYS()', commandId: 'rcu.SetDisplayStringXYSH' },
            { label: 'SetZxing()', commandId: 'rcu.SetZxingH' },
            { label: 'SetDisplayPicture()', commandId: 'rcu.SetDisplayPictureH' },
            { label: 'SetLCDDot()', commandId: 'rcu.SetLCDDotH' },
            { label: 'SetLCDLine()', commandId: 'rcu.SetLCDLineH' },
            { label: 'SetLCDSolidCircle()', commandId: 'rcu.SetLCDSolidCircleH' },
            { label: 'SetLCDFilledRectangle2()', commandId: 'rcu.SetLCDFilledRectangle2H' },
            { label: 'SetLCDRectangle2()', commandId: 'rcu.SetLCDRectangle2H' }
        ]
    },
    {
        label: 'Звуки',
        children: [
            { label: 'StartMp3ByPai()', commandId: 'rcu.StartMp3ByPaiH' },
            { label: 'PlayVoiceByName()', commandId: 'rcu.PlayVoiceByNameH' },
            { label: 'StartMp3ByPath()', commandId: 'rcu.StartMp3ByPathH' },
            { label: 'WaitMp3ByPath()', commandId: 'rcu.WaitMp3ByPathH' },
            { label: 'SetMp3Suspend()', commandId: 'rcu.SetMp3SuspendH' },
            { label: 'StartRecord()', commandId: 'rcu.StartRecordH' },
            { label: 'PlayRecord()', commandId: 'rcu.PlayRecordH' },
            { label: 'AddVoiceSpeed()', commandId: 'rcu.AddVoiceSpeedH' },
            { label: 'SetVoiceSpeed()', commandId: 'rcu.SetVoiceSpeedH' },
            { label: 'AddVoiceValue()', commandId: 'rcu.AddVoiceValueH' },
            { label: 'SetVoiceValue()', commandId: 'rcu.SetVoiceValueH' },
            { label: 'StopAllVoice()', commandId: 'rcu.StopAllVoiceH' },
            { label: 'GetVoiceValue()', commandId: 'rcu.GetVoiceValueH' },
            { label: 'GetVoiceSpeed()', commandId: 'rcu.GetVoiceSpeedH' }
        ]
    },
    {
        label: 'Mecanum колёса',
        children: [
            { label: 'SetMecanumwheel()', commandId: 'rcu.SetMecanumwheel' },
            { label: 'SetMecanumSpeed()', commandId: 'rcu.SetMecanumSpeed' },
            { label: 'SetMecanumMoveLR()', commandId: 'rcu.SetMecanumMoveLR' },
            { label: 'SetCarSpeed()', commandId: 'rcu.SetCarSpeed' },
            { label: 'SetCarStop()', commandId: 'rcu.SetCarStop' },
            { label: 'SetCarToAngleTime()', commandId: 'rcu.SetCarToAngleTime' },
            { label: 'SetCarToAngle()', commandId: 'rcu.SetCarToAngle' },
            { label: 'SetCarToRLTime()', commandId: 'rcu.SetCarToRLTime' },
            { label: 'SetCarToRL()', commandId: 'rcu.SetCarToRL' }
        ]
    },
    {
        label: 'Кубик Рубика',
        children: [
            { label: 'StartCameraRub()', commandId: 'rcu.StartCameraRub' },
            { label: 'StartMFBtn()', commandId: 'rcu.StartMFBtn' },
            { label: 'UpdateRcuUi()', commandId: 'rcu.UpdateRcuUi' },
            { label: 'IsMfConnect()', commandId: 'rcu.IsMfConnect' },
            { label: 'GetMFExist()', commandId: 'rcu.GetMFExist' },
            { label: 'GetMfChaos()', commandId: 'rcu.GetMfChaos' },
            { label: 'RunNext()', commandId: 'rcu.SeRunNexttCarToRL' },
            { label: 'StartMFColor()', commandId: 'rcu.StartMFColor' },
            { label: 'MfStepNum()', commandId: 'rcu.MfStepNum' },
            { label: 'MfUseTime()', commandId: 'rcu.MfUseTime' }
        ]
    },
    {
        label: 'Циклы и условия',
        children: [
            { label: 'If', commandId: 'control.if' },
            { label: 'If-Else', commandId: 'control.ifelse' },
            { label: 'If-Elif-Else', commandId: 'control.ifelifelse' },
            { label: 'While', commandId: 'control.while' },
            { label: 'While True', commandId: 'control.whiletrue' },
            { label: 'For', commandId: 'control.for' },
            { label: 'sgn() — знак числа', commandId: 'control.sgn' },
        ]
    },
];
exports.ERCU_TREE.find(n => n.label === "Датчики").children.push(...[
    {
        "label": "NFC метка",
        "children": [
            {
                "label": "SetNFC()",
                "commandId": "sensor.SetNFC"
            },
            {
                "label": "GetNFCStatus()",
                "commandId": "sensor.GetNFCStatus"
            }
        ]
    },
    {
        "label": "Датчик дождя",
        "children": [
            {
                "label": "GetRainfall()",
                "commandId": "sensor.GetRainfall"
            }
        ]
    },
    {
        "label": "Датчик качества воздуха",
        "children": [
            {
                "label": "GetAirQuality()",
                "commandId": "sensor.GetAirQuality"
            }
        ]
    }
]);
exports.ERCU_TREE.push(...[
    {
        "label": "Матричный экран",
        "children": [
            {
                "label": "SetDisplayLatticePic()",
                "commandId": "display.SetDisplayLatticePic"
            },
            {
                "label": "SetDisplayLattice()",
                "commandId": "display.SetDisplayLattice"
            },
            {
                "label": "SetDisplayLatticeXY()",
                "commandId": "display.SetDisplayLatticeXY"
            },
            {
                "label": "SetDisplayLatticeString()",
                "commandId": "display.SetDisplayLatticeString"
            },
            {
                "label": "SetDisplayLatticeClear()",
                "commandId": "display.SetDisplayLatticeClear"
            }
        ]
    },
    {
        "label": "Исполнительные устройства",
        "children": [
            {
                "label": "SetPump()",
                "commandId": "actuator.SetPump"
            },
            {
                "label": "SetElectromagnet() — вкл/выкл",
                "commandId": "actuator.SetElectromagnet"
            },
            {
                "label": "SetElectromagnet() — мощность",
                "commandId": "actuator.SetElectromagnetPower"
            }
        ]
    },
    {
        "label": "Радиосвязь 2,4 ГГц",
        "children": [
            {
                "label": "GetRFModuleRemoteBit()",
                "commandId": "rf.GetRFModuleRemoteBit"
            },
            {
                "label": "GetRFModuleRemoteButton()",
                "commandId": "rf.GetRFModuleRemoteButton"
            },
            {
                "label": "GetRFModuleRemoteCode()",
                "commandId": "rf.GetRFModuleRemoteCode"
            },
            {
                "label": "GetRFModuleRemoteGravity()",
                "commandId": "rf.GetRFModuleRemoteGravity"
            },
            {
                "label": "GetRFModuleRemoteRocker()",
                "commandId": "rf.GetRFModuleRemoteRocker"
            },
            {
                "label": "GetRFModuleRemoteKnob()",
                "commandId": "rf.GetRFModuleRemoteKnob"
            },
            {
                "label": "GetRFModuleByte()",
                "commandId": "rf.GetRFModuleByte"
            },
            {
                "label": "SetRFPassWord()",
                "commandId": "rf.SetRFPassWord"
            },
            {
                "label": "SetRFModuleByte()",
                "commandId": "rf.SetRFModuleByte"
            },
            {
                "label": "SetRFModuleRemoteKnob()",
                "commandId": "rf.SetRFModuleRemoteKnob"
            }
        ]
    },
    {
        "label": "IoT",
        "children": [
            {
                "label": "SetIOTConfig()",
                "commandId": "iot.SetIOTConfig"
            },
            {
                "label": "SetIOTTopic()",
                "commandId": "iot.SetIOTTopic"
            },
            {
                "label": "SetIOTData()",
                "commandId": "iot.SetIOTData"
            },
            {
                "label": "SetIOTDataStr()",
                "commandId": "iot.SetIOTDataStr"
            },
            {
                "label": "GetIOTData()",
                "commandId": "iot.GetIOTData"
            }
        ]
    }
]);
exports.E7_TREE = [...exports.ERCU_TREE, {
        "label": "ИИ-камера",
        "children": [
            { "label": "Руководство и примеры", "commandId": "aicam.guide" },
            {
                "label": "SetAICamCmd()",
                "commandId": "aicam.SetAICamCmd"
            },
            {
                "label": "SetWaitAICamCmd()",
                "commandId": "aicam.SetWaitAICamCmd"
            },
            {
                "label": "GetAICam()",
                "commandId": "aicam.GetAICam"
            },
            {
                "label": "GetAICamStr()",
                "commandId": "aicam.GetAICamStr"
            },
            {
                "label": "GetAICamIDData()",
                "commandId": "aicam.GetAICamIDData"
            },
            {
                "label": "GetAICamIDStr()",
                "commandId": "aicam.GetAICamIDStr"
            }
        ]
    }];
const SECTION_ORDER = [
    'Контроллер', 'Моторы', 'Датчики', 'Экран', 'Сервоприводы', 'ИИ-камера',
    'Bluetooth', 'Звуки', 'Матричный экран', 'Исполнительные устройства',
    'Радиосвязь', 'IoT', 'Колёсная база', 'Циклы, условия и функции'
];
for (const tree of [exports.ERCU_TREE, exports.E7_TREE, exports.HRCU_TREE]) {
    for (const section of tree) {
        if (section.label === 'Циклы и условия')
            section.label = 'Циклы, условия и функции';
        if (section.label === 'Радиосвязь 2,4 ГГц')
            section.label = 'Радиосвязь';
        if (section.label === 'Iot')
            section.label = 'IoT';
    }
    const position = (label) => {
        if (label === 'Циклы, условия и функции')
            return SECTION_ORDER.length + 1;
        const index = SECTION_ORDER.indexOf(label);
        return index < 0 ? SECTION_ORDER.length : index;
    };
    tree.sort((a, b) => position(a.label) - position(b.label));
}
//# sourceMappingURL=CommandTrees.js.map