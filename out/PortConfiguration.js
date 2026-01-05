"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortConfigurationHtml = void 0;
function getPortConfigurationHtml(panel) {
    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Настройка портов</title>
            <style>
                :root {
                    /* Использование переменных темы VSCode */
                    --background-color: var(--vscode-editor-background);
                    --foreground-color: var(--vscode-editor-foreground);
                    --border-color: var(--vscode-editorGroup-border);
                    --button-background: var(--vscode-button-background);
                    --button-hover-background: var(--vscode-button-hoverBackground);
                    --button-foreground: var(--vscode-button-foreground);
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    background-color: var(--background-color);
                    color: var(--foreground-color);
                }
                .modal {
                    width: 400px;
                    margin: 50px auto;
                    background-color: var(--background-color);
                    border: 1px solid var(--border-color);
                    border-radius: 5px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                }
                h1 {
                    text-align: center;
                    font-size: 18px;
                    color: var(--foreground-color);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table th, table td {
                    border: 1px solid var(--border-color);
                    padding: 8px;
                    text-align: center;
                }
                table td input[type="text"] {
                    width: 90%;
                    background-color: var(--background-color);
                    color: var(--foreground-color);
                    border: 1px solid var(--border-color);
                }
                .buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
                .buttons button {
                    margin-left: 10px;
                    padding: 5px 10px;
                    background-color: var(--button-background);
                    color: var(--button-foreground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                .buttons button:hover {
                    background-color: var(--button-hover-background);
                }
            </style>
        </head>
        <body>
            <div class="modal">
                <h1>Настройка портов</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Порт</th>
                            <th>Имя</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generatePortRows()}
                    </tbody>
                </table>
                <div class="buttons">
                    <button id="cancel">Отмена</button>
                    <button id="ok">OK</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('ok').addEventListener('click', () => {
                    const ports = {};
                    document.querySelectorAll('tr').forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length > 1) {
                            const port = cells[0].innerText.trim();
                            const name = cells[1].querySelector('input').value.trim();
                            if (name) {
                                ports[name] = port;
                            }
                        }
                    });
                    vscode.postMessage({
                        command: 'savePorts',
                        data: ports
                    });
                    vscode.postMessage({ command: 'close' }); // Мгновенное закрытие окна
                });

                document.getElementById('cancel').addEventListener('click', () => {
                    vscode.postMessage({ command: 'close' });
                });
            </script>
        </body>
        </html>
    `;
}
exports.getPortConfigurationHtml = getPortConfigurationHtml;
function generatePortRows() {
    const motorPorts = ['Motor 1', 'Motor 2', 'Motor 3', 'Motor 4'];
    const sensorPorts = ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8'];
    let html = '';
    motorPorts.forEach(port => {
        html += `
            <tr>
                <td>${port}</td>
                <td><input type="text" placeholder="Имя"></td>
            </tr>
        `;
    });
    // Добавляем пустую строку
    html += `
        <tr>
            <td colspan="2" style="height: 10px; background-color: var(--background-color);"></td>
        </tr>
    `;
    sensorPorts.forEach(port => {
        html += `
            <tr>
                <td>${port}</td>
                <td><input type="text" placeholder="Имя"></td>
            </tr>
        `;
    });
    return html;
}
//# sourceMappingURL=PortConfiguration.js.map