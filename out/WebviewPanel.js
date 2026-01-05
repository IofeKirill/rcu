"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewPanel = void 0;
function getWebviewPanel(node) {
    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Информация о команде</title>
        </head>
        <body>
            <h1>${node.label}</h1>
            <p>Description: ${node.description}</p>
            <p>Details: ${node.details}</p>
        </body>
        </html>
    `;
}
exports.getWebviewPanel = getWebviewPanel;
//# sourceMappingURL=WebviewPanel.js.map