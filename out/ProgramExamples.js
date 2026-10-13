"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.programExamples = exports.PROGRAM_EXAMPLES = void 0;
const WebviewUtils_1 = require("./WebviewUtils");
exports.PROGRAM_EXAMPLES = [
    { file: "aicam_07_line_follow.py", title: "ИИ-камера: движение по линии с ПД-регулятором", controller: "E7" },
    { "file": "aicam_01_probe.py", "title": "ИИ-камера: проверка связи и всех полей", "controller": "E7" },
    { "file": "aicam_02_face.py", "title": "ИИ-камера: обученное лицо ID1", "controller": "E7" },
    { "file": "aicam_03_qr.py", "title": "ИИ-камера: чтение QR-кода", "controller": "E7" },
    { "file": "aicam_04_color.py", "title": "ИИ-камера: координаты обученного цвета", "controller": "E7" },
    { "file": "aicam_05_road.py", "title": "ИИ-камера: две точки направляющей линии", "controller": "E7" },
    { "file": "aicam_06_human.py", "title": "ИИ-камера: координаты запястий", "controller": "E7" },
    { file: '1_PIDRegLine.py', title: 'ПИД по двум датчикам света — коэффициенты из ячеек', controller: 'E6' },
    { file: '2_PIDRegLineCamera.py', title: 'ПИД по старой камере ai — коэффициенты из ячеек', controller: 'E6' },
    { file: '3_RobotMovement.py', title: 'Движение робота по энкодеру' },
    { file: '4_RobotRotationEncoder.py', title: 'Поворот робота по энкодеру' },
    { file: '5_ClearDisplay.py', title: 'Очистка экрана' },
    { file: '6_BluetoothPult.py', title: 'Управление роботом с Bluetooth-пульта' },
    { file: '7_SyncMove.py', title: 'Движение по таймеру с выравниванием моторов по энкодерам. Автор: Байдин Ярослав' },
    { file: '8_EnteringVariables.py', title: 'Ввод данных с контроллера и движение по линии' },
    { file: '9_SaveDataToFile.py', legacyFile: '9_SaveDataToFile .py', title: 'Создание файла и запись данных' },
    { file: '10_ReadDataFromFile.py', title: 'Чтение данных из файла' }
];
function programExamples(cspSource, controller = 'E-RCU') {
    const token = (0, WebviewUtils_1.nonce)();
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${token}'; script-src 'nonce-${token}';">
<style nonce="${token}">body{font-family:var(--vscode-font-family);color:var(--vscode-editor-foreground);background:var(--vscode-editor-background);padding:20px}li{margin:14px 0}button{color:var(--vscode-textLink-foreground);background:none;border:0;text-align:left;cursor:pointer;font:inherit;padding:0}</style></head><body><h1>Примеры программ</h1><p>Примеры открываются как новые несохранённые документы. При сохранении выберите папку своего проекта.</p><ol>${exports.PROGRAM_EXAMPLES.filter(example => !example.controller || (example.controller === 'E7' ? controller === 'E7' : controller !== 'H-RCU')).map(example => `<li><button data-file="${(0, WebviewUtils_1.escapeHtml)(example.file)}">${(0, WebviewUtils_1.escapeHtml)(example.title)}</button></li>`).join('')}</ol>
<script nonce="${token}">const vscode=acquireVsCodeApi();document.addEventListener('click',event=>{const button=event.target.closest('button[data-file]');if(button)vscode.postMessage({command:'openExample',example:button.dataset.file});});</script></body></html>`;
}
exports.programExamples = programExamples;
//# sourceMappingURL=ProgramExamples.js.map