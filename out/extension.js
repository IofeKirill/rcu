"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.setCurrentSet = exports.getCurrentSet = void 0;
const vscode = require("vscode");
const drivelist = require("drivelist");
const fs = require("fs");
const path = require("path");
const ProgramExamples_1 = require("./ProgramExamples");
const DeviceTreeProvider_1 = require("./DeviceTreeProvider");
const CommandTreeProvider_1 = require("./CommandTreeProvider");
const getProgramExamples_1 = require("./getProgramExamples");
const PortConfiguration_1 = require("./PortConfiguration");
const SystemCommandTreeProvider_1 = require("./SystemCommandTreeProvider");
let currentPanel = undefined;
let currentSet = "E-RCU";
function getCurrentSet() {
    return currentSet;
}
exports.getCurrentSet = getCurrentSet;
//#region --Создание двух контроллеров
function setCurrentSet(set) {
    currentSet = set;
    vscode.commands.executeCommand("rcuSidebar.refresh"); // обновляем дерево
}
exports.setCurrentSet = setCurrentSet;
//#endregion
//#region --Активация функций
function activate(context) {
    const stubLibsPath = path.join(context.extensionPath, 'stub_libs');
    // Добавляем путь к фиктивным библиотекам в PYTHONPATH
    process.env.PYTHONPATH = [stubLibsPath, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);
    const treeDataProvider = new CommandTreeProvider_1.CommandTreeProvider();
    vscode.window.createTreeView('rcuCommands', { treeDataProvider });
    context.subscriptions.push(vscode.commands.registerCommand("rcuCommands.refresh", () => treeDataProvider.refresh()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.setErcu", () => {
        setCurrentSet("E-RCU");
        vscode.window.showInformationMessage("Выбран набор: E6-RCU");
        vscode.commands.executeCommand("rcuCommands.refresh");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("extension.setHrcu", () => {
        setCurrentSet("H-RCU");
        vscode.window.showInformationMessage("Выбран набор: H-RCU");
        vscode.commands.executeCommand("rcuCommands.refresh");
    }));
    //#endregion
    //------------------Регистрация команд E6-RCU-------------------//
    //#region---Команды моторов E6
    vscode.commands.registerCommand('motor.SetMotor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotor(${1:port}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorStop', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorStop(${1:port})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorCode(${1:port})'));
        }
    });
    vscode.commands.registerCommand('motor.GetMotorCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.GetMotorCode(${1:port})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorSecond', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorSecond(${1:port}, ${2:speed}, ${3:secs})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorAngleDelay', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorAngleDelay(${1:port}, ${2:speed}, ${3:angle})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorConstSpeed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorConstSpeed(${1:port}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorAngle(${1:port}, ${2:speed}, ${3:angle})'));
        }
    });
    vscode.commands.registerCommand('motor.SetMotorDirection', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('motor.SetMotorDirection(${1:port}, ${2:direction})'));
        }
    });
    ///#endregion
    ///#region---Команд move E6
    vscode.commands.registerCommand('move.SetMoveRunSecond', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveRunSecond(${1:"forward"}, ${2:speed}, ${3:secs})'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveRunAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveRunAngle(${1:"forward"}, ${2:speed}, ${3:angle})'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveRun', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveRun(${1:"forward"}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveStop', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveStop()'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveSpeedSecond', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveSpeedSecond(${1:speedLeft}, ${2:speedRight}, ${3:secs})'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveSpeed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveSpeed(${1:speedLeft}, ${2:speedRight})'));
        }
    });
    vscode.commands.registerCommand('move.SetMovePower', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMovePower(${1:powerLeft}, ${2:powerRight})'));
        }
    });
    vscode.commands.registerCommand('move.SetMotorPower', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMotorPower(${1:power1}, ${2:power2}, ${3:power3}, ${4:power4})'));
        }
    });
    vscode.commands.registerCommand('move.SetMoveInitialize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('move.SetMoveInitialize(${1:portLeft}, ${2:portRight}, ${3:reversMotors})'));
        }
    });
    //#endregion
    //#region---Команды сервоприводов E6
    vscode.commands.registerCommand('servo.SetSeeringEngine', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetSeeringEngine(${1:channel}, ${2:angle})'));
        }
    });
    vscode.commands.registerCommand('servo.SetSeeringEngineTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetSeeringEngineTime(${1:channel}, ${2:angle}, ${3:time})'));
        }
    });
    vscode.commands.registerCommand('servo.SetServoMotor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetServoMotor(${1:channel}, ${2:angle})'));
        }
    });
    vscode.commands.registerCommand('servo.SetServo', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetServo(${1:channel}, ${2:angle})'));
        }
    });
    vscode.commands.registerCommand('servo.SetServoTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetServoTime(${1:channel}, ${2:angle}, ${3:time})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoSoftReset', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoSoftReset(${1:port})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoState', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoState(${1:port}, ${2:res?}, ${3:speed}, ${4:angle})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoDegreeTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoDegreeTime(${1:port}, ${2:angle}, ${3:time})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoDegreeSpeed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoDegreeSpeed(${1:port}, ${2:angle}, ${3:speed})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoCodeMotor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoCodeMotor(${1:port}, ${2:angle}, ${3:speed})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoMotor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoMotor(${1:port}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoPowerDown', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoPowerDown(${1:port})'));
        }
    });
    vscode.commands.registerCommand('servo.GetMagneticServoDegree', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.GetMagneticServoDegree(${1:port})'));
        }
    });
    vscode.commands.registerCommand('servo.SetMagneticServoEncoder', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.SetMagneticServoEncoder(${1:port})'));
        }
    });
    vscode.commands.registerCommand('servo.GetMagneticServoEncoder', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('servo.GetMagneticServoEncoder(${1:port})'));
        }
    });
    //#endregion
    //#region---Команды контроллера E6
    vscode.commands.registerCommand('rcu.SetWaitForTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetWaitForTime(${1:time})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetLeftButton', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetLeftButton()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRightButton', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRightButton()'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitLeftButtonPressed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitLeftButtonPressed()'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitRightButtonPressed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitRightButtonPressed()'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitRightButtonReleased', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitRightButtonReleased()'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitLeftButtonReleased', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitLeftButtonReleased()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetRcuStop', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetRcuStop()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRandom', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRandom(${1:min}, ${2:max})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRGB', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRGB(${1:red}, ${2:green}, ${3:blue})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMcuID', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMcuID()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetSysVersion', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetSysVersion()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetSysLanguage', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetSysLanguage()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetSysTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetSysTime()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetSysTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetSysTime()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetInMic', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetInMic()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetData(${1:address}, ${2:data})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetData(${1:address})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetUartData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetUartData(${1:port}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetUartData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetUartData(${1:speed})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetInVotage', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetInVotage()'));
        }
    });
    //#endregion
    //#region---Команды звука E6
    vscode.commands.registerCommand('rcu.SetInSound', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetInSound(${1:1047}, ${2:5})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetInBeep', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetInBeep(${1:0})'));
        }
    });
    vscode.commands.registerCommand('rcu.SoundStartBeep', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SoundStartBeep(${1:1})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMp3Play', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMp3Play(${1:folder}, ${2:file})'));
        }
    });
    vscode.commands.registerCommand('rcu.SoundMp3', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SoundMp3(${1:folder}, ${2:file}, ${3:secs})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMp3Suspend', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMp3Suspend()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMp3Sound', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMp3Sound(${1:volume})'));
        }
    });
    //#endregion
    //Команды датчиков E6:
    //#region--Датчики света
    vscode.commands.registerCommand('sensor.Set3CLed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.Set3CLed(${1:port}, ${2:color})'));
        }
    });
    vscode.commands.registerCommand('sensor.SetLightSensorLed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetLightSensorLed(${1:port}, ${2:on/off})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetLightSensorData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetLightSensorData(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetLightSensor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetLightSensor(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetColorSensor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetColorSensor(${1:port}, ${2:mode})'));
        }
    });
    //#endregion
    //#region--Датчики расстояния
    vscode.commands.registerCommand('sensor.GetTouch', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetTouch(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetUltrasound', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetUltrasound(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.SetUltrasoundled', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetUltrasoundled(${1:port}, ${2:mode})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetShortIRDist', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetShortIRDist(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetLaserDist', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetLaserDist(${1:port}, ${2:mode})'));
        }
    });
    //#endregion
    //#region--Гироскоп
    vscode.commands.registerCommand('sensor.SetAHRS', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetAHRS(${1:port}, ${2:mode})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetAHRS', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetAHRS(${1:port}, ${2:mode}, ${3:axis})'));
        }
    });
    //#endregion
    //#region--Своя библиотека для гироскопа!
    vscode.commands.registerCommand('Create_object_gyro', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const snippet = new vscode.SnippetString(`# === Инициализация гироскопа ===
gyro = gyro_lib.Gyro(\${1:port})
gyro.CalibrateGyro()
# ================================
$0`);
            editor.insertSnippet(snippet);
        }
    });
    vscode.commands.registerCommand('gyro.ReadGyro', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('gyro.ReadGyro()'));
        }
    });
    //#endregion
    //#region--Датчик жестов
    vscode.commands.registerCommand('sensor.GetGesture', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetGesture(${1:port})'));
        }
    });
    //#endregion
    //#region--Барометр
    vscode.commands.registerCommand('sensor.GetAirPressure', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetAirPressure(${1:port})'));
        }
    });
    //#endregion
    //#region--Датчик температуры и влажности
    vscode.commands.registerCommand('sensor.GetSht30', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetSht30(${1:port}, ${2:mode})'));
        }
    });
    //#endregion
    //#region--Датчик магинтного поля
    vscode.commands.registerCommand('sensor.GetMagnetic', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetMagnetic(${1:port}, ${2:mode})'));
        }
    });
    //#endregion
    //#region--Умный глаз
    vscode.commands.registerCommand('sensor.SetSmartEyeMode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetSmartEyeMode(${1:port}, ${2:mode}, ${3:color})'));
        }
    });
    vscode.commands.registerCommand('sensor.SetSmartEyeAllLed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetSmartEyeAllLed(${1:port}, ${2:color 1}, ${3:color 2}, ${4:color 3}, ${5:color 4}, ${6:color 5}, ${7:color 6}, ${8:color 7}, ${9:color 8})'));
        }
    });
    vscode.commands.registerCommand('sensor.SetSmartEyeIRcode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetSmartEyeIRcode(${1:port}, ${2:code})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetSmartEyeIRcode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.SetSmartEyeIRcode(${1:port})'));
        }
    });
    vscode.commands.registerCommand('sensor.GetSmartEyeDist', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('sensor.GetSmartEyeDist(${1:port})'));
        }
    });
    //#endregion
    //#region--Модуль линии
    vscode.commands.registerCommand('trace.GetTraceV2I2C', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.GetTraceV2I2C(${1:port}, ${2:sensor})'));
        }
    });
    vscode.commands.registerCommand('trace.GetTraceV2I2CState', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.GetTraceV2I2CState(${1:port}, ${2:sensor})'));
        }
    });
    vscode.commands.registerCommand('trace.GetTraceV2I2CChxState', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.GetTraceV2I2CChxState(${1:port}, ${2:state})'));
        }
    });
    vscode.commands.registerCommand('trace.SetTraceV2I2AllColor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.SetTraceV2I2AllColor(${1:port}, ${2:color})'));
        }
    });
    vscode.commands.registerCommand('trace.SetTraceV2I2Color', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.SetTraceV2I2Color(${1:port}, ${2:color1}, ${3:color2}, ${4:color3}, ${5:color4}, ${6:color5}, ${7:color6}, ${8:color7})'));
        }
    });
    vscode.commands.registerCommand('trace.SetTraceV2I2Threshold', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.SetTraceV2I2Threshold(${1:port}, ${2:time})'));
        }
    });
    vscode.commands.registerCommand('trace.LineSetInitialize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineSetInitialize(${1:port}, ${2:"black"}, ${3:"wheeledchassis"})'));
        }
    });
    vscode.commands.registerCommand('trace.LineIntersectionStop', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineIntersectionStop(${1:speed}, ${2:type intersection})'));
        }
    });
    vscode.commands.registerCommand('trace.LineMillisecond', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineMillisecond(${1:speed}, ${2:time})'));
        }
    });
    vscode.commands.registerCommand('trace.LineForBmp', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineForBmp(${1:speed}, ${2:encoder})'));
        }
    });
    vscode.commands.registerCommand('trace.LineTurnEncounterline', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineTurnEncounterline(${1:speedLeft}, ${2:speedRight}, ${3:№ sensor})'));
        }
    });
    vscode.commands.registerCommand('trace.LineBasis', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('trace.LineBasis(${1:speed})'));
        }
    });
    //#endregion
    //#region--Камера
    vscode.commands.registerCommand('ai.SetAICamData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('ai.SetAICamData(${1:mode}, ${2:0})'));
        }
    });
    vscode.commands.registerCommand('ai.SetWaitForAICamData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('ai.SetWaitForAICamData(${1:mode}, ${2:0})'));
        }
    });
    vscode.commands.registerCommand('ai.SetAICamLED', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('ai.SetAICamLED(${1:1})'));
        }
    });
    vscode.commands.registerCommand('ai.GetAICamData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('ai.GetAICamData(${1:mode})'));
        }
    });
    vscode.commands.registerCommand('ai.GetAICamVoice', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('ai.GetAICamVoice(${1:commandNumber})'));
        }
    });
    //#endregion
    //#region---Команды для экрана
    vscode.commands.registerCommand('rcu.GetTouchScreen', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTouchScreen()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetTouchScreenX', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTouchScreenX()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetTouchScreenY', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTouchScreenY()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDClear', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDClear(${1:0x0000})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetFontSize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetFontSize(${1:0})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayVar', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayVar(${1:line}, ${2:number}, ${3:textColor}, ${4:bgColor})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayString', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayString(${1:1}, ${2:"text = " + str(var)}, ${3:0xFFE0}, ${4:0x0000})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayPicture', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayPicture(${1:x}, ${2:y}, ${3:"image.jpg"}, ${4:scale})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayVarXY', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayVarXY(${1:x}, ${2:y}, ${3:number}, ${4:textColor}, ${5:bgColor})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayStringXY', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayStringXY(${1:x}, ${2:y}, ${3:"text"}, ${4:textColor}, ${5:bgColor}, ${6:scale})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayVarU32', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayVarU32(${1:line}, ${2:number}, ${3:textColor}, ${4:bgColor})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDDot', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDDot(${1:x}, ${2:y}, ${3:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDSolidCircle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDSolidCircle(${1:x}, ${2:y}, ${3:radius}, ${4:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDLine', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDLine(${1:x1}, ${2:y1}, ${3:angle}, ${4:length}, ${5:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDFilledRectangle2', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDFilledRectangle2(${1:x}, ${2:y}, ${3:width}, ${4:height}, ${5:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDRectangle2', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDRectangle2(${1:x}, ${2:y}, ${3:width}, ${4:height}, ${5:thickness}, ${6:color})'));
        }
    });
    //#endregion
    //#region---Команды Bluetooth
    vscode.commands.registerCommand('rcu.SetBluetoothData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetBluetoothData(${1:data})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBluetoothData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBluetoothData()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBluetoothControl', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBluetoothControl()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBluetoothControlData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBluetoothControlData()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBTModuleRemoteButton', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBTModuleRemoteButton()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBTModuleRemoteCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBTModuleRemoteCode()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBTModuleRemoteRocker', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBTModuleRemoteRocker(${1:direction}, ${2:axis})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetComVoice', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetComVoice(${1:"text"})'));
        }
    });
    //#endregion
    //------------------Регистрация команд H-RCU-------------------//
    //#region---Команды моторов H
    vscode.commands.registerCommand('rcu.SetMotorH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotor(${1:port}, ${2:speed})'));
        }
    });
    vscode.commands.registerCommand('rcu.StopMotorH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StopMotor(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorCodeH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorCode(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMotorCodeH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMotorCode(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitMotorTo', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitMotorTo(${1:port}, ${2:percent}, ${3:num}, ${4:type})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorVByOther', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorVByOther(${1:port}, ${2:percent}, ${3:num}, ${4:type})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMotorV', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMotorV(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMotorAngleH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMotorAngle(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetSteeringAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetSteeringAngle(${1:port}, ${2:type}, ${3:degree}, ${4:seconds})'));
        }
    });
    //#endregion
    //#region---Команды Move
    vscode.commands.registerCommand('rcu.SetStartMotorLorR', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetStartMotorLorR(${1:portL}, ${2:portR})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorsByTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorsByTime(${1:speed}, ${2:sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotors', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotors(${1:speed})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorsByLength', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorsByLength(${1:speed}, ${2:cm})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetOneCircleSize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetOneCircleSize(${1:SizeWheelInCm})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorsAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorsAngle(${1:speed}, ${2:side(1/2)}, ${3:sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.StopMotorRun', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StopMotorRun(${1:speedL}, ${2:speedR}, ${3:sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitMotorByPercent', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitMotorByPercent(${1:speedL}, ${2:speedR})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMotorByPercent', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMotorByPercent(${1:port}, ${2:speed})'));
        }
    });
    //#endregion
    //Команды датчиков H:
    //#region---Датчики света
    vscode.commands.registerCommand('rcu.Set3CLedH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.Set3CLed(${1:port}, ${2:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLightByRGB', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLightByRGB(${1:port}, ${2:R}, ${3:G}, ${4:B})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetElcLightIfData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetElcLightIfData(${1:port}, ${2:threshold})'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitNewColor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitNewColor(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitThisColor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitThisColor(${1:port}, ${2:color})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetLightSensorH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetLightSensor(${1:port}, ${2:type})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsColor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsColor(${1:port}, ${2:null})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetColorSensorH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetColorSensor(${1:port}, ${2:color})'));
        }
    });
    //#endregion
    //#region---Датчики расстояния
    vscode.commands.registerCommand('rcu.IsUltra', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsUltra(${1:port}, ${2:sign}, ${3:dist})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetUltrasound', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetUltrasound(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetTouch', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTouch(${1:port})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsElectedData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsElectedData(${1:port}, ${2:sign}, ${3:value})'));
        }
    });
    //#endregion
    //#region---Датчик температуры и влажности
    vscode.commands.registerCommand('rcu.GetTempAndHumData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTempAndHumData(${1:port}, ${2:value})'));
        }
    });
    //#endregion
    //#region---Гироскоп
    vscode.commands.registerCommand('rcu.GetGyroscopeData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetGyroscopeData(${1:Axis})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetAccData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetAccData(${1:Axis})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetAttitudeData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetAttitudeData(${1:Side})'));
        }
    });
    //#endregion
    //#region---Команды контроллера H-RCU
    vscode.commands.registerCommand('rcu.SetRcuTimeTo0', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetRcuTimeTo0()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRcuTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRcuTime()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDataH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetData(${1:min}, ${2:max})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetDataH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetData(${1:num})'));
        }
    });
    vscode.commands.registerCommand('rcu.SavePic', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SavePic(${1:FileName})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetHRCUName', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetHRCUName())'));
        }
    });
    vscode.commands.registerCommand('rcu.GetChangeValue', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetChangeValue()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMaiVoice', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMaiVoice()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetCcrrentDate', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetCcrrentDate()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetSaveStudyDataToFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetSaveStudyDataToFile(${1:num}, ${2:"FileName"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetShowFileData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetShowFileData(${1:"FileName"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDeleteStudyFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDeleteStudyFile(${1:"FileName"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetEditView', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetEditView(${1:x}, ${2:y}, ${3:"data"})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetEditViewData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetEditViewData()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetSaveStrToFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetSaveStrToFile(${1:"text"}, ${2:"FileName"})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetStrForFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetStrForFile(${1:"FileName"}, ${2:line})'));
        }
    });
    vscode.commands.registerCommand('rcu.ShowGifExpression', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.ShowGifExpression(${1:expression(1-5)})'));
        }
    });
    vscode.commands.registerCommand('rcu.GoneGifExpression', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GoneGifExpression()'));
        }
    });
    vscode.commands.registerCommand('rcu.ShowList', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.ShowList(${1:x}, ${2:y}, ${3:length}, ${4:"title"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetListItem', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetListItem(${1:1}, ${2:"FileName"})'));
        }
    });
    //#endregion
    //#region---Команды Iot
    vscode.commands.registerCommand('rcu.InitIot', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.InitIot()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetIotDeviceData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetIotDeviceData(${1:"Message"}, ${2:"-"})'));
        }
    });
    vscode.commands.registerCommand('rcu.ResetIotResult', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.ResetIotResult()'));
        }
    });
    vscode.commands.registerCommand('rcu.IsIotDeviceData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsIotDeviceData(${1:"-"}, ${2:"0"})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetIotDeviceData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetIotDeviceData(${1:"-"})'));
        }
    });
    //#endregion
    //#region---Команды Wifi
    vscode.commands.registerCommand('rcu.SetWifiData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetWifiData(${1:"Data"})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetWifiData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetWifiData()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetRcuBluetoothData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetRcuBluetoothData(${1:"Data"})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRcuBluetoothData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRcuBluetoothData()'));
        }
    });
    vscode.commands.registerCommand('rcu.OpenCameraForPhone', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.OpenCameraForPhone(${1:0/1})'));
        }
    });
    vscode.commands.registerCommand('rcu.SendWifiBtnDescribe', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SendWifiBtnDescribe(${1:Button}, ${2:"name"})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsPhoneWiFiYGData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsPhoneWiFiYGData(${1:Rocker}, ${2:Position})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsPhoneWiFiBtnData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsPhoneWiFiBtnData(${1:Button})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetPhoneWiFiYGData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetPhoneWiFiYGData(${1:Joystik}, ${2:Axis})'));
        }
    });
    //#endregion
    //#region---Команды AI
    vscode.commands.registerCommand('rcu.StartCamera', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartCamera(${1:state(1/2)}, ${2:mode(1-14)})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetRoadHsv', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetRoadHsv(${1:hue}, ${2:saturation}, ${3:value}, ${4:limit})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsRoadBlack', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsRoadBlack()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetRoadAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetRoadAngle()'));
        }
    });
    vscode.commands.registerCommand('rcu.SetFaceRegister', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetFaceRegister(${1:"name"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCameraShow', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCameraShow(${1:show/hide(1/2)})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetTTSSpeack', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetTTSSpeack(${1:"text"})'));
        }
    });
    vscode.commands.registerCommand('rcu.ResetAiResult', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.ResetAiResult()'));
        }
    });
    vscode.commands.registerCommand('rcu.IsColorForCamera', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsColorForCamera(${1:color(1-7)})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetPoseData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetPoseData(${1:pose})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetSimplePoseList', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetSimplePoseList(${1:BodyPart}, ${2:x/y})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetWeather', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetWeather(${1:citi}, ${2:weather})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetAiData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetAiData(${1:data})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetZxing', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetZxing()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetBlackLineData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetBlackLineData()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartOnnxCamera', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartOnnxCamera(${1:run/close(1/2)}, ${2:"model.onnx"}, ${3:show/hide(1/2)})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetOnnxZXD', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetOnnxZXD(${1:ConfidenceLevel})'));
        }
    });
    vscode.commands.registerCommand('rcu.GetOnnxResult', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetOnnxResult(${1:Custom/ConfidenceLevel(1/2)})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsOnnxResult', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsOnnxResult(${1:1})'));
        }
    });
    //#endregion
    //#region---Команды AI Cloud
    vscode.commands.registerCommand('rcu.StartBDApi', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartBDApi(${1:"run/close(1/2)"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetTextRecognize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetTextRecognize()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetTextRecognizeResult', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTextRecognizeResult()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartBDVoiceRecognize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartBDVoiceRecognize(${1:sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.StartBDVoiceRecognizeOnce', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartBDVoiceRecognizeOnce()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetVoiceData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetVoiceData()'));
        }
    });
    vscode.commands.registerCommand('rcu.InitXhSDK', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.InitXhSDK(${1:"url"}, ${1:"key"})'));
        }
    });
    vscode.commands.registerCommand('rcu.UseInsetChatUi', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.UseInsetChatUi()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartDSTTSSpeack', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartDSTTSSpeack()'));
        }
    });
    vscode.commands.registerCommand('rcu.IsFinishTTS', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsFinishTTS()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartChat', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartChat(${1:"text"})'));
        }
    });
    vscode.commands.registerCommand('rcu.AddActionCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.AddActionCode(${1:"action"}, ${2:"code"})'));
        }
    });
    vscode.commands.registerCommand('rcu.ResetXHCash', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.ResetXHCash()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetChatReceive', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetChatReceive()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetChatListData', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetChatListData()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetChatListSize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetChatListSize()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetChatAllReceive', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetChatAllReceive()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetAiDoInstructionSize', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetAiDoInstructionSize()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetAiDoInstruction', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetAiDoInstruction(${1:num})'));
        }
    });
    //#endregion
    //#region---Команды экрана
    vscode.commands.registerCommand('rcu.GetIsTouchH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetIsTouch()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetTouchScreenXYH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetTouchScreenXY(${1:axis})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDClearH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDClear(${1:"#F80000"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetAlphaH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetAlpha(${1:0-1})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetFontSizeH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetFontSize(${1:0})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayStringH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayString(${1:1}, ${2:"text"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayStringXYSH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayStringXYS(${1:X}, ${2:Y}, ${3:"text"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetZxingH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetZxing(${1:"text"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetDisplayPictureH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetDisplayPicture(${1:X}, ${2:Y}, ${3:"a.jpg"}, ${4:"scale"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDDotH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDDot(${1:X}, ${2:Y}, ${3:"#F80000"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDLineH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDLine(${1:X}, ${2:Y}, ${3:angle}, ${4:length}, ${5:"#F80000"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDSolidCircleH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDSolidCircle(${1:X}, ${2:Y}, ${3:radius}, ${4:"#F80000"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDFilledRectangle2H', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDFilledRectangle2(${1:X}, ${2:Y}, ${3:width}, ${4:height}, ${5:"#F80000"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetLCDRectangle2H', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetLCDRectangle2(${1:X}, ${2:Y}, ${3:width}, ${4:height}, ${5:line width}, ${6:"#F80000"})'));
        }
    });
    //#endregion
    //#region---Команды звука
    vscode.commands.registerCommand('rcu.StartMp3ByPaiH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartMp3ByPai(${1:"Note"}, ${2:beat})'));
        }
    });
    vscode.commands.registerCommand('rcu.PlayVoiceByNameH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.PlayVoiceByName(${1:1-17})'));
        }
    });
    vscode.commands.registerCommand('rcu.StartMp3ByPathH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartMp3ByPath(${1:"music.mp3"})'));
        }
    });
    vscode.commands.registerCommand('rcu.WaitMp3ByPathH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.WaitMp3ByPath(${1:"music.mp3"})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMp3SuspendH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMp3Suspend()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartRecordH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartRecord(${1:sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.PlayRecordH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.PlayRecord()'));
        }
    });
    vscode.commands.registerCommand('rcu.AddVoiceSpeedH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.AddVoiceSpeed(${1:percent})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetVoiceSpeedH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetVoiceSpeed(${1:percent})'));
        }
    });
    vscode.commands.registerCommand('rcu.AddVoiceValueH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.AddVoiceValue(${1:percent})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetVoiceValueH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetVoiceValue(${1:percent})'));
        }
    });
    vscode.commands.registerCommand('rcu.StopAllVoiceH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StopAllVoice()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetVoiceValueH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetVoiceValue()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetVoiceSpeedH', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetVoiceSpeed()'));
        }
    });
    //#endregion
    //#region---Команды колеса Mecanum
    vscode.commands.registerCommand('rcu.SetMecanumwheel', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMecanumwheel(${1:PortLeftF}, ${2:PortRightF}, ${3:PortLeftB}, ${4:PortRightB})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMecanumSpeed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMecanumSpeed(${1:SpeedLF}, ${2:SpeedRF}, ${3:SpeedLB}, ${4:SpeedRB})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetMecanumMoveLR', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetMecanumMoveLR(${1:Speed}, ${2:Sec}, ${3:Side})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarSpeed', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarSpeed(${1:Speed})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarStop', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarStop(${1:})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarToAngleTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarToAngleTime(${1:Deg}, ${2:Sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarToAngle', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarToAngle(${1:Deg})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarToRLTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarToRLTime(${1:Side}, ${2:Sec})'));
        }
    });
    vscode.commands.registerCommand('rcu.SetCarToRL', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.SetCarToRL(${1:Side})'));
        }
    });
    //#endregion
    //#region---Команды кубик Рубика
    vscode.commands.registerCommand('rcu.StartCameraRub', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartCamera(${1:"开启" / "关闭"}, ${2:"魔方颜色识别"})'));
        }
    });
    vscode.commands.registerCommand('rcu.StartMFBtn', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartMFBtn()'));
        }
    });
    vscode.commands.registerCommand('rcu.UpdateRcuUi', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.UpdateRcuUi(${1:Value}, ${2:MaxValue})'));
        }
    });
    vscode.commands.registerCommand('rcu.IsMfConnect', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.IsMfConnect()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMFExist', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMFExist()'));
        }
    });
    vscode.commands.registerCommand('rcu.GetMfChaos', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.GetMfChaos()'));
        }
    });
    vscode.commands.registerCommand('rcu.SeRunNexttCarToRL', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.RunNext()'));
        }
    });
    vscode.commands.registerCommand('rcu.StartMFColor', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.StartMFColor(${1:Color(1-6)})'));
        }
    });
    vscode.commands.registerCommand('rcu.MfStepNum', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.MfStepNum()'));
        }
    });
    vscode.commands.registerCommand('rcu.MfUseTime', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('rcu.MfUseTime()'));
        }
    });
    //#endregion
    //------------------Регистрация общих команд-------------------//
    //#region---Команды управления
    vscode.commands.registerCommand('control.if', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('if (${1:condition}):\n\t${2:pass}'));
        }
    });
    vscode.commands.registerCommand('control.ifelse', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('if (${1:condition}):\n\t${2:pass}\nelse:\n\t${3:pass}'));
        }
    });
    vscode.commands.registerCommand('control.ifelifelse', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('if (${1:condition}):\n\t${2:pass}\nelif (${3:condition}):\n\t${4:pass}\nelse:\n\t${5:pass}'));
        }
    });
    vscode.commands.registerCommand('control.while', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('while (${1:condition}):\n\t${2:pass}'));
        }
    });
    vscode.commands.registerCommand('control.whiletrue', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('while (True):\n\t${1:pass}'));
        }
    });
    vscode.commands.registerCommand('control.for', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString('for ${1:count} in range(${2:10}):\n\t${3:pass}'));
        }
    });
    //#endregion
    //------------------Регистрация системных команд-------------------//
    //#region --Создание папки
    vscode.commands.registerCommand('extension.createProjectFolder', () => __awaiter(this, void 0, void 0, function* () {
        const folderUri = yield vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Выберите папку для создания проекта'
        });
        if (folderUri && folderUri[0]) {
            const folderName = yield vscode.window.showInputBox({ prompt: 'Введите имя новой папки проекта' });
            if (folderName) {
                const newFolderPath = vscode.Uri.file(`${folderUri[0].fsPath}/${folderName}`);
                try {
                    // Создаем новую папку
                    yield vscode.workspace.fs.createDirectory(newFolderPath);
                    vscode.window.showInformationMessage(`Папка '${folderName}' успешно создана по пути ${folderUri[0].fsPath}.`);
                    // Добавляем новую папку в рабочее пространство
                    vscode.workspace.updateWorkspaceFolders(0, null, { uri: newFolderPath });
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Не удалось создать папку: ${error.message}`);
                }
            }
            else {
                vscode.window.showErrorMessage('Имя папки не введено.');
            }
        }
        else {
            vscode.window.showErrorMessage('Папка не выбрана.');
        }
    }));
    //#endregion
    //#region --Создание файла
    vscode.commands.registerCommand('extension.createPythonTemplate', () => __awaiter(this, void 0, void 0, function* () {
        const fileName = yield vscode.window.showInputBox({ prompt: 'Введите имя нового файла' });
        if (fileName) {
            // Получаем текущую папку из рабочего пространства
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                // Выбираем первую папку из рабочего пространства (новую папку проекта)
                const projectFolder = workspaceFolders[0].uri.fsPath;
                const filePath = vscode.Uri.file(`${projectFolder}/${fileName}.py`);
                const initialContent = `
import rcu  # Основная библиотека для управления роботом.
import motor # Библиотека для управления моторами.
import move # Библиотека для работы с колёсной базой робота.
import servo # Библиотека для работы с сервоприводами
import sensor # Библиотека для работы с различными датчиками.
import ai # Библиотека для работы с камерой.
import trace # Библиотека для управления модулем линии.
import os # Библиотека для работы с файлами

def task1():
    pass

task1()
`;
                try {
                    yield vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent));
                    vscode.window.showInformationMessage(`Файл '${fileName}.py' успешно создан!`);
                    vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc));
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Не удалось создать файл: ${error.message}`);
                }
            }
            else {
                vscode.window.showErrorMessage('Откройте рабочее пространство.');
            }
        }
        else {
            vscode.window.showErrorMessage('Имя файла не введено.');
        }
    }));
    const deviceTreeProvider = new DeviceTreeProvider_1.DeviceTreeProvider();
    vscode.window.registerTreeDataProvider('connectedDevices', deviceTreeProvider);
    const deviceTreeView = vscode.window.createTreeView('connectedDevices', {
        treeDataProvider: deviceTreeProvider,
        showCollapseAll: true,
        canSelectMany: false // Разрешаем выбирать только одно устройство
    });
    deviceTreeView.onDidChangeSelection(event => {
        if (event.selection.length > 0) {
            const selectedDevice = event.selection[0];
            vscode.commands.executeCommand('device.select', selectedDevice);
        }
    });
    //#endregion
    //#region --Поиск устройств
    vscode.commands.registerCommand('extension.detectDevices', () => __awaiter(this, void 0, void 0, function* () {
        yield deviceTreeProvider.detectDevices();
    }));
    //#endregion
    //#region --Загрузка файла
    function uploadFileToDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.showInformationMessage('Загружаем файл на устройство...');
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Нет активного файла для загрузки.');
                return;
            }
            const document = editor.document;
            // === Проверяем, есть ли несохранённые изменения ===
            if (document.isDirty) {
                const saved = yield document.save();
                if (!saved) {
                    vscode.window.showErrorMessage('Не удалось сохранить файл перед загрузкой.');
                    return;
                }
            }
            // === Проверяем, выбрано ли устройство ===
            const selectedDevice = deviceTreeProvider.getSelectedDevice();
            if (!selectedDevice) {
                vscode.window.showErrorMessage('Устройство не выбрано.');
                return;
            }
            const mountpoint = selectedDevice.mountpoint;
            if (!fs.existsSync(mountpoint)) {
                vscode.window.showErrorMessage('Робот не подключен.');
                return;
            }
            const filePath = document.uri.fsPath;
            const fileName = path.basename(filePath);
            const destination = path.join(mountpoint, fileName);
            // ============================================================
            // 🔧 Проверяем, нужно ли загрузить библиотеку gyro
            // ============================================================
            try {
                const fileContent = document.getText();
                if (fileContent.includes('import gyro_lib')) {
                    const gyroPath = path.join(__dirname, '..', 'stub_libs', 'gyro_lib.py');
                    const gyroDestination = path.join(mountpoint, 'gyro_lib.py'); // 👈 переименовываем при загрузке
                    vscode.window.showInformationMessage('Найден import gyro_lib');
                    if (fs.existsSync(gyroPath)) {
                        fs.copyFileSync(gyroPath, gyroDestination);
                        console.log(`Библиотека успешно загружена: ${gyroDestination}`);
                    }
                    else {
                        vscode.window.showWarningMessage(`Файл не найден: ${gyroPath}`);
                    }
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('Ошибка при загрузке библиотеки gyro_lib: ' + error.message);
                console.error(error);
            }
            // ============================================================
            // 📦 Загружаем основной файл (последним!)
            // ============================================================
            fs.copyFile(filePath, destination, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Ошибка при копировании файла: ${err.message}`);
                }
                else {
                    vscode.window.showInformationMessage(`Файл успешно загружен на устройство: ${destination}`);
                }
            });
        });
    }
    // === Регистрируем обе команды, использующие одну функцию ===
    vscode.commands.registerCommand('extension.uploadFile', uploadFileToDevice);
    vscode.commands.registerCommand('extension.uploadFileToDevice', uploadFileToDevice);
    //#endregion
    //#region --Тест устройств
    vscode.commands.registerCommand('extension.testDrivelist', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const drives = yield drivelist.list();
            console.log('Доступные устройства:', drives);
            vscode.window.showInformationMessage('Устройства обнаружены. Проверьте консоль разработчика.');
        }
        catch (error) {
            console.error('Ошибка при работе с drivelist:', error);
            vscode.window.showErrorMessage('Ошибка при работе с drivelist. Проверьте консоль разработчика.');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('device.select', (device) => {
        deviceTreeProvider.selectDevice(device); // Выбираем устройство
        vscode.window.showInformationMessage(`Выбрано устройство: ${device.label}`);
    }));
    //#endregion
    //#region --Открытие примеров
    vscode.commands.registerCommand('extension.openExamples', () => {
        const panel = vscode.window.createWebviewPanel('examplePage', 'Примеры программ', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = (0, ProgramExamples_1.programExamples)();
        // Обрабатываем сообщения из webview
        panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            if (message.command === 'openExample') {
                const exampleName = message.example;
                yield openExampleFile(exampleName);
            }
        }));
    });
    //#endregion
    //#region --Настройка портов
    vscode.commands.registerCommand('extension.configurePorts', () => {
        const panel = vscode.window.createWebviewPanel('configurePorts', 'Настройка портов', vscode.ViewColumn.Active, // Открывается поверх активного окна
        { enableScripts: true });
        panel.webview.html = (0, PortConfiguration_1.getPortConfigurationHtml)(panel);
        panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            if (message.command === 'close') {
                panel.dispose();
            }
            if (message.command === 'savePorts') {
                console.log('Данные портов:', message.data);
                const portMappings = message.data;
                const editor = vscode.window.activeTextEditor;
                // Если редактор отсутствует, пытаемся открыть последний документ
                if (!editor) {
                    const openDocuments = vscode.workspace.textDocuments;
                    if (openDocuments.length > 0) {
                        yield vscode.window.showTextDocument(openDocuments[0]);
                    }
                    else {
                        vscode.window.showErrorMessage('Откройте файл перед настройкой портов.');
                        return;
                    }
                }
                // Получаем активный редактор после переключения
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showErrorMessage('Не удалось найти открытый редактор.');
                    return;
                }
                // Формируем новый текст для блока настроек
                let newBlock = '';
                newBlock += `# ---------- Настройки моторов и датчиков ----------\n`;
                for (const [name, port] of Object.entries(portMappings)) {
                    const portNumber = port.replace(/\D/g, '');
                    newBlock += `${name} = ${portNumber}  # устройство подключено на порт ${port}\n`;
                }
                newBlock += `# --------------------------------------------------\n`;
                // Получаем текст документа
                const documentText = activeEditor.document.getText();
                // Определяем блок настроек, если он уже существует
                const settingsStart = '# ---------- Настройки моторов и датчиков ----------';
                const settingsEnd = '# --------------------------------------------------';
                const startIdx = documentText.indexOf(settingsStart);
                const endIdx = documentText.indexOf(settingsEnd);
                let updatedText = documentText;
                if (startIdx !== -1 && endIdx !== -1) {
                    // Заменяем существующий блок
                    const oldBlock = documentText.slice(startIdx, endIdx + settingsEnd.length);
                    updatedText = documentText.replace(oldBlock, newBlock);
                    console.log('Старый блок настроек заменён.');
                }
                else {
                    // Определяем место для вставки нового блока
                    const lines = documentText.split('\n');
                    let importEndLine = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (!lines[i].startsWith('import ') && lines[i].trim() !== '') {
                            importEndLine = i;
                            break;
                        }
                    }
                    // Вставляем новый блок после import
                    const beforeBlock = lines.slice(0, importEndLine).join('\n');
                    const afterBlock = lines.slice(importEndLine).join('\n');
                    updatedText = `${beforeBlock}\n${newBlock}\n${afterBlock}`;
                    console.log('Новый блок настроек добавлен.');
                }
                // Обновляем текст документа
                activeEditor.edit((editBuilder) => {
                    const entireRange = new vscode.Range(activeEditor.document.positionAt(0), activeEditor.document.positionAt(documentText.length));
                    editBuilder.replace(entireRange, updatedText);
                }).then((success) => {
                    if (success) {
                        vscode.window.showInformationMessage('Порты успешно настроены!');
                    }
                    else {
                        vscode.window.showErrorMessage('Не удалось настроить порты.');
                    }
                });
            }
        }));
        panel.onDidDispose(() => {
            vscode.window.showInformationMessage('Окно настройки портов закрыто.');
        });
    });
    function openExampleFile(exampleName) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Получаем путь к установленному расширению
            const extensionPath = (_a = vscode.extensions.getExtension('IofeKirill.rcu-extension')) === null || _a === void 0 ? void 0 : _a.extensionPath;
            if (!extensionPath) {
                vscode.window.showErrorMessage('Не удалось найти путь к расширению.');
                return;
            }
            // Путь к папке с примерами внутри папки "rcu"
            const examplesFolder = path.join(extensionPath, 'examples');
            // Проверяем, существует ли папка "examples"
            if (!fs.existsSync(examplesFolder)) {
                vscode.window.showErrorMessage(`Папка с примерами не найдена: ${examplesFolder}`);
                return;
            }
            const filePath = path.join(examplesFolder, exampleName);
            // Проверяем, существует ли файл
            if (!fs.existsSync(filePath)) {
                vscode.window.showErrorMessage(`Файл ${exampleName} не существует в папке с примерами.`);
                return;
            }
            try {
                const document = yield vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
                vscode.window.showTextDocument(document);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Не удалось открыть файл: ${error.message}`);
            }
        });
    }
    //#endregion
    //#region --Показ информации о командах
    const commandInfoCommand = vscode.commands.registerCommand('extension.showCommandInfo', (node) => {
        const columnToShowIn = vscode.ViewColumn.Beside;
        if (currentPanel) {
            currentPanel.webview.html = (0, getProgramExamples_1.getProgramExamples)(node.commandId);
            // Попытка нормализовать позиционирование панели, заставляя её всегда открываться в заданной колонке
            currentPanel.reveal(vscode.ViewColumn.Two, true); // Вторая колонка, true сохраняет фокус на редакторе
        }
        else {
            currentPanel = vscode.window.createWebviewPanel('commandInfo', 'Информация о команде', vscode.ViewColumn.Two, // Заставляем всегда открываться во второй колонке
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(__dirname, '..', 'instructions'))], // Разрешаем доступ к папке instructions
            });
            currentPanel.webview.html = (0, getProgramExamples_1.getProgramExamples)(node.commandId);
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
    });
    const systemCommandProvider = new SystemCommandTreeProvider_1.SystemCommandTreeProvider();
    vscode.window.createTreeView('systemCommands', { treeDataProvider: systemCommandProvider });
    context.subscriptions.push(vscode.commands.registerCommand('extension.refreshSystemCommands', () => {
        systemCommandProvider.refresh();
    }));
    context.subscriptions.push(commandInfoCommand);
}
exports.activate = activate;
//#endregion
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map