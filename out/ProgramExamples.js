"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.programExamples = void 0;
function programExamples() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Примеры программ</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 24px; } 
                h1 { color: #800080; font-size: 40px; }
                .example { margin-bottom: 20px; }
                .example a { text-decoration: none; color: #0066cc; cursor: pointer; font-size: 24px; }
            </style>
            <script>
                function openExample(exampleName) {
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'openExample',
                        example: exampleName
                    });
                }
            </script>
        </head>
        <body>
            <h1>Примеры программ</h1> 
            <div class="example">
                <a onclick="openExample('1_PIDRegLine.py')">1. ПИД регулятор для линии на двух датчика света</a>
            </div>
            <div class="example">
                <a onclick="openExample('2_PIDRegLineCamera.py')">2. ПИД регулятор для линии на камере</a>
            </div>
            </div>
            <div class="example">
                <a onclick="openExample('3_RobotMovement.py')">3. Движение робота по энкодеру</a>
            </div>
            <div class="example">
                <a onclick="openExample('4_RobotRotationEncoder.py')">4. Поворот робота по энкодеру</a>
            </div>
            <div class="example">
                <a onclick="openExample('5_ClearDisplay.py')">5. Очистка экрана</a>
            </div>
            <div class="example">
                <a onclick="openExample('6_BluetoothPult.py')">6. Управление роботом при помощи пульта по Bluetooth</a>
            </div>
            <div class="example">
                <a onclick="openExample('7_SyncMove.py')">7. Движение по таймеру с выравниванием скоростей моторов по энкодерам. Разработал Байдин Ярослав.</a>
            </div>
            <div class="example">
                <a onclick="openExample('8_EnteringVariables.py')">8. Ввод данных с контроллера с последующим движением по линии.</a>
            </div>
            <div class="example">
                <a onclick="openExample('9_SaveDataToFile .py')">9. Создание внешнего файла и запись в него данных.</a>
            </div>
            <div class="example">
                <a onclick="openExample('10_ReadDataFromFile.py')">10. Чтение данных из внешнего файла.</a>
            </div>
        </body>
        </html>
    `;
}
exports.programExamples = programExamples;
//# sourceMappingURL=ProgramExamples.js.map