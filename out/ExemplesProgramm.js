"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = void 0;
function getWebviewContent() {
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
                <a onclick="openExample('1_PIDRegLine.py')">1. ПИД регулятор для линии</a>
            </div>
            </div>
            <div class="example">
                <a onclick="openExample('2_RobotMovement.py')">2. Движение робота</a>
            </div>
            <div class="example">
                <a onclick="openExample('3_RobotRotationEncoder.py')">3. Поворот робота по энкодеру</a>
            </div>
            <div class="example">
                <a onclick="openExample('4_ClearDisplay.py')">4. Очистка экрана</a>
            </div>
            <div class="example">
                <a onclick="openExample('5_BluetoothPult.py')">5. Управление роботом при помощи пульта по Bluetooth</a>
            </div>
        </body>
        </html>
    `;
}
exports.getWebviewContent = getWebviewContent;
//# sourceMappingURL=ExemplesProgramm.js.map