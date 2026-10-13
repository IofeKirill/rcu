"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEW_COMMANDS = void 0;
exports.NEW_COMMANDS = {
    "aicam.guide": { "label": "Руководство ИИ-камеры", "snippet": "", "description": "Подключение, режимы, параметры, обучение и шесть полных примеров для Е7." },
    "sensor.SetNFC": {
        "label": "SetNFC()",
        "snippet": "sensor.SetNFC(${1:1})",
        "description": "Запустить операцию NFC. Параметры: Порт датчика (1–8). Пример: sensor.SetNFC(1)"
    },
    "sensor.GetNFCStatus": {
        "label": "GetNFCStatus()",
        "snippet": "sensor.GetNFCStatus(${1:1})",
        "description": "Получить статус операции NFC. Параметры: Порт датчика (1–8). Пример: sensor.SetNFC(1)\nstatus = sensor.GetNFCStatus(1)\nif status == 1:\n    print(\"NFC: успешно\")"
    },
    "sensor.GetRainfall": {
        "label": "GetRainfall()",
        "snippet": "sensor.GetRainfall(${1:1})",
        "description": "Считать значение датчика дождя. Параметры: Порт датчика (1–8). Пример: value = sensor.GetRainfall(1)\nprint(value)"
    },
    "sensor.GetAirQuality": {
        "label": "GetAirQuality()",
        "snippet": "sensor.GetAirQuality(${1:1})",
        "description": "Считать значение датчика качества воздуха. Параметры: Порт датчика (1–8). Пример: value = sensor.GetAirQuality(1)\nprint(value)"
    },
    "display.SetDisplayLatticePic": {
        "label": "SetDisplayLatticePic()",
        "snippet": "display.SetDisplayLatticePic(${1:1}, ${2:\"00003c3c6666424242420000000000000000000004200c301818f00f00000000\"}, ${3:10})",
        "description": "Показать изображение на матричном экране. Параметры: Порт; строка изображения в шестнадцатеричном формате; яркость. Пример: display.SetDisplayLatticePic(1, \"00003c3c6666424242420000000000000000000004200c301818f00f00000000\", 10)"
    },
    "display.SetDisplayLattice": {
        "label": "SetDisplayLattice()",
        "snippet": "display.SetDisplayLattice(${1:1}, ${2:\"A\"}, ${3:10})",
        "description": "Показать текст на матричном экране. Параметры: Порт; строка; яркость. Пример: display.SetDisplayLattice(1, \"A\", 10)"
    },
    "display.SetDisplayLatticeXY": {
        "label": "SetDisplayLatticeXY()",
        "snippet": "display.SetDisplayLatticeXY(${1:1}, ${2:10}, ${3:10}, ${4:1}, ${5:10})",
        "description": "Управлять точкой матричного экрана. Параметры: Порт; координата X; координата Y; состояние точки; яркость. Пример использует состояние 1. Пример: display.SetDisplayLatticeXY(1, 10, 10, 1, 10)"
    },
    "display.SetDisplayLatticeString": {
        "label": "SetDisplayLatticeString()",
        "snippet": "display.SetDisplayLatticeString(${1:1}, ${2:\"hello\"}, ${3:0}, ${4:100}, ${5:10})",
        "description": "Показать движущуюся строку на матричном экране. Параметры: Порт; текст; направление (0 — влево, 1 — вправо, 2 — вверх, 3 — вниз); скорость; яркость. Пример: display.SetDisplayLatticeString(1, \"hello\", 0, 100, 10)"
    },
    "display.SetDisplayLatticeClear": {
        "label": "SetDisplayLatticeClear()",
        "snippet": "display.SetDisplayLatticeClear(${1:1})",
        "description": "Очистить матричный экран. Параметры: Порт экрана. Пример: display.SetDisplayLatticeClear(1)"
    },
    "actuator.SetPump": {
        "label": "SetPump()",
        "snippet": "actuator.SetPump(${1:1}, ${2:1})",
        "description": "Управлять насосом. Параметры: Порт; состояние (пример: 1 — включение). Пример: actuator.SetPump(1, 1)"
    },
    "actuator.SetElectromagnet": {
        "label": "SetElectromagnet() — вкл/выкл",
        "snippet": "actuator.SetElectromagnet(${1:1}, ${2:1})",
        "description": "Включить или выключить электромагнит. Параметры: Порт; состояние: 1 — включить, 0 — выключить. Пример: actuator.SetElectromagnet(1, 1)\n# Для выключения:\nactuator.SetElectromagnet(1, 0)"
    },
    "actuator.SetElectromagnetPower": {
        "label": "SetElectromagnet() — мощность",
        "snippet": "actuator.SetElectromagnet(${1:1}, ${2:100})",
        "description": "Установить мощность электромагнита. Параметры: Порт; мощность в процентах (0–100). Пример: actuator.SetElectromagnet(1, 100)"
    },
    "rf.GetRFModuleRemoteBit": {
        "label": "GetRFModuleRemoteBit()",
        "snippet": "rf.GetRFModuleRemoteBit(${1:1}, ${2:1})",
        "description": "Проверить кнопку радиопульта. Параметры: Порт; номер кнопки. Пример: pressed = rf.GetRFModuleRemoteBit(1, 1)\nif pressed == 1:\n    print(\"Кнопка нажата\")"
    },
    "rf.GetRFModuleRemoteButton": {
        "label": "GetRFModuleRemoteButton()",
        "snippet": "rf.GetRFModuleRemoteButton(${1:1})",
        "description": "Получить значение кнопки радиопульта. Параметры: Порт. Пример: button = rf.GetRFModuleRemoteButton(1)"
    },
    "rf.GetRFModuleRemoteCode": {
        "label": "GetRFModuleRemoteCode()",
        "snippet": "rf.GetRFModuleRemoteCode(${1:1})",
        "description": "Получить код кнопок радиопульта. Параметры: Порт. Пример: code = rf.GetRFModuleRemoteCode(1)"
    },
    "rf.GetRFModuleRemoteGravity": {
        "label": "GetRFModuleRemoteGravity()",
        "snippet": "rf.GetRFModuleRemoteGravity(${1:1}, ${2:0})",
        "description": "Считать компоненту наклона радиопульта. Параметры: Порт; ось: X — 0, Y — 1, Z — 2. Пример: x = rf.GetRFModuleRemoteGravity(1, 0)"
    },
    "rf.GetRFModuleRemoteRocker": {
        "label": "GetRFModuleRemoteRocker()",
        "snippet": "rf.GetRFModuleRemoteRocker(${1:1}, ${2:0}, ${3:0})",
        "description": "Получить значение оси джойстика радиопульта. Параметры: Порт; джойстик: 0 — левый, 1 — правый; ось: 0 — X, 1 — Y. Пример: left_x = rf.GetRFModuleRemoteRocker(1, 0, 0)\nleft_y = rf.GetRFModuleRemoteRocker(1, 0, 1)\nright_x = rf.GetRFModuleRemoteRocker(1, 1, 0)\nright_y = rf.GetRFModuleRemoteRocker(1, 1, 1)"
    },
    "rf.GetRFModuleRemoteKnob": {
        "label": "GetRFModuleRemoteKnob()",
        "snippet": "rf.GetRFModuleRemoteKnob(${1:1})",
        "description": "Получить значение энкодера радиопульта. Параметры: Порт. Пример: value = rf.GetRFModuleRemoteKnob(1)"
    },
    "rf.GetRFModuleByte": {
        "label": "GetRFModuleByte()",
        "snippet": "rf.GetRFModuleByte(${1:1})",
        "description": "Получить данные от радиомодуля. Параметры: Порт. Пример: value = rf.GetRFModuleByte(1)"
    },
    "rf.SetRFPassWord": {
        "label": "SetRFPassWord()",
        "snippet": "rf.SetRFPassWord(${1:1}, ${2:1234567})",
        "description": "Задать пароль радиомодуля. Параметры: Порт; пароль. Пример: rf.SetRFPassWord(1, 1234567)"
    },
    "rf.SetRFModuleByte": {
        "label": "SetRFModuleByte()",
        "snippet": "rf.SetRFModuleByte(${1:1}, ${2:255})",
        "description": "Отправить данные через радиомодуль. Параметры: Порт; передаваемое значение. Пример: rf.SetRFModuleByte(1, 255)"
    },
    "rf.SetRFModuleRemoteKnob": {
        "label": "SetRFModuleRemoteKnob()",
        "snippet": "rf.SetRFModuleRemoteKnob(${1:1}, ${2:0})",
        "description": "Установить значение энкодера радиопульта. Параметры: Порт; новое значение. Пример: rf.SetRFModuleRemoteKnob(1, 0)"
    },
    "iot.SetIOTConfig": {
        "label": "SetIOTConfig()",
        "snippet": "iot.SetIOTConfig(${1:1}, ${2:\"\"}, ${3:\"\"}, ${4:\"\"}, ${5:\"\"}, ${6:\"iot.zmrobo.com\"})",
        "description": "Настроить подключение модуля IoT. Параметры: Порт; имя Wi-Fi (SSID); пароль Wi-Fi; Iot_id; Iot_pwd; сервер. Пример: iot.SetIOTConfig(1, \"WIFI_NAME\", \"WIFI_PASSWORD\", \"IOT_ID\", \"IOT_PASSWORD\", \"iot.zmrobo.com\")"
    },
    "iot.SetIOTTopic": {
        "label": "SetIOTTopic()",
        "snippet": "iot.SetIOTTopic(${1:1}, ${2:\"topic\"})",
        "description": "Задать тему обмена IoT. Параметры: Порт; строка темы. Topic_0–Topic_9 в Робокоде — слоты настройки; в Python передаётся строка темы. Пример: iot.SetIOTTopic(1, \"class/robot\")"
    },
    "iot.SetIOTData": {
        "label": "SetIOTData()",
        "snippet": "iot.SetIOTData(${1:1}, ${2:\"topic\"}, ${3:10})",
        "description": "Отправить число в тему IoT. Параметры: Порт; строка темы; число. Пример: iot.SetIOTData(1, \"class/robot\", 10)"
    },
    "iot.SetIOTDataStr": {
        "label": "SetIOTDataStr()",
        "snippet": "iot.SetIOTDataStr(${1:1}, ${2:\"topic\"}, ${3:\"hello\"})",
        "description": "Отправить строку в тему IoT. Параметры: Порт; строка темы; строка сообщения. Пример: iot.SetIOTDataStr(1, \"class/robot\", \"hello\")"
    },
    "iot.GetIOTData": {
        "label": "GetIOTData()",
        "snippet": "iot.GetIOTData(${1:1}, ${2:\"topic\"}, ${3:\"run\"})",
        "description": "Проверить получение указанного сообщения IoT. Параметры: Порт; строка темы; ожидаемая строка сообщения. Пример: if iot.GetIOTData(1, \"class/robot\", \"run\"):\n    print(\"Получено run\")"
    },
    "aicam.SetAICamCmd": {
        "label": "SetAICamCmd()",
        "snippet": "aicam.SetAICamCmd(${1:7}, ${2:\"camera\"})",
        "description": "Переключить ИИ-камеру в выбранный режим после её загрузки. Параметры: Порт P7 или P8; режим — строка в кавычках, в нижнем регистре. camera — камера; face — лица; apriltag — метки AprilTag; qrcode — QR-коды; detector — объекты; color — цвета; road — дорога; gesture — жесты; human — ключевые точки тела; classifier — классификация объектов; image — классификация изображений. Пример: aicam.SetAICamCmd(7, \"face\")"
    },
    "aicam.SetWaitAICamCmd": {
        "label": "SetWaitAICamCmd()",
        "snippet": "aicam.SetWaitAICamCmd(${1:7}, ${2:\"camera\"})",
        "description": "Дождаться загрузки ИИ-камеры и переключения в выбранный режим. Команда блокирует дальнейшее выполнение до завершения переключения. Параметры: Порт P7 или P8; режим — строка в кавычках, в нижнем регистре. camera — камера; face — лица; apriltag — метки AprilTag; qrcode — QR-коды; detector — объекты; color — цвета; road — дорога; gesture — жесты; human — ключевые точки тела; classifier — классификация объектов; image — классификация изображений. Пример: aicam.SetWaitAICamCmd(7, \"face\")"
    },
    "aicam.GetAICam": {
        "label": "GetAICam()",
        "snippet": "aicam.GetAICam(${1:7}, ${2:1}, ${3:1})",
        "description": "Получить числовой параметр цели по её номеру на экране. Параметры: Порт 7/8; номер цели 1–20 (слева направо); параметр: 1 — ID, 2 — X, 3 — Y, 4 — ширина, 5 — высота, 6 — размер, 7 — уверенность. Пример: target_id = aicam.GetAICam(7, 1, 1)\nx = aicam.GetAICam(7, 1, 2)"
    },
    "aicam.GetAICamStr": {
        "label": "GetAICamStr()",
        "snippet": "aicam.GetAICamStr(${1:7}, ${2:1})",
        "description": "Получить строку цели по её номеру на экране. Параметры: Порт 7/8; номер цели 1–20 (слева направо). Пример: name = aicam.GetAICamStr(7, 1)\nprint(name)"
    },
    "aicam.GetAICamIDData": {
        "label": "GetAICamIDData()",
        "snippet": "aicam.GetAICamIDData(${1:7}, ${2:1}, ${3:1})",
        "description": "Получить числовой параметр цели с заданным ID. Параметры: Порт 7/8; ID цели (в таблице руководства: 1–20); параметр: 1 — X, 2 — Y, 3 — ширина, 4 — высота, 5 — размер, 6 — уверенность. Для AprilTag руководство отдельно указывает ID 0–255; доступ к ним через эту команду требует проверки. Пример: x = aicam.GetAICamIDData(7, 1, 1)\ny = aicam.GetAICamIDData(7, 1, 2)"
    },
    "aicam.GetAICamIDStr": {
        "label": "GetAICamIDStr()",
        "snippet": "aicam.GetAICamIDStr(${1:7}, ${2:1})",
        "description": "Получить строку цели с заданным ID. Параметры: Порт 7/8; ID цели (в таблице руководства: 1–20). Пример: name = aicam.GetAICamIDStr(7, 1)\nprint(name)"
    },
    "control.sgn": {
        "label": "sgn() — знак числа",
        "snippet": "def sgn(${1:value}):\n\tif ${1:value} > 0:\n\t\treturn 1\n\tif ${1:value} < 0:\n\t\treturn -1\n\treturn 0",
        "description": "Вставить определение функции знака: положительное число → 1, отрицательное → -1, ноль → 0. Определите функцию один раз перед её использованием."
    }
};
//# sourceMappingURL=NewCommands.js.map