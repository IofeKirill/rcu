"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBlockConnections = void 0;
const vscode = require("vscode");
function registerBlockConnections(context, services) {
    let pending = false;
    const state = () => ({ ...services.state(), busy: pending || services.busy() });
    const guard = () => { if (pending || services.busy())
        throw new Error('Дождись завершения текущей операции с роботом.'); };
    context.subscriptions.push(vscode.commands.registerCommand('extension.getBlockConnectionState', state), vscode.commands.registerCommand('extension.chooseBlockConnection', async (request) => {
        if (!vscode.workspace.isTrusted)
            throw new Error('Открой доверенную папку для подключения к роботу.');
        if (!request || !['usb', 'bluetooth'].includes(request.transport) || !['E6', 'M6', 'E7'].includes(request.controller))
            throw new Error('Некорректные параметры подключения.');
        guard();
        pending = true;
        try {
            const transport = request.transport;
            const choices = await services.scan(transport);
            if (!choices.length)
                throw new Error(transport === 'usb' ? 'USB-контроллеры не найдены. Подключи кабель и включи робота.' : 'Bluetooth-контроллеры не найдены. Включи робота и повтори поиск.');
            const choice = await vscode.window.showQuickPick(choices, { placeHolder: transport === 'usb' ? 'Выбери контроллер USB' : 'Выбери контроллер Bluetooth', ignoreFocusOut: true });
            if (choice) {
                await services.controller(request.controller);
                await services.connect(transport, choice.device);
            }
        }
        finally {
            pending = false;
        }
        return state();
    }), vscode.commands.registerCommand('extension.disconnectBlockConnection', async () => {
        guard();
        pending = true;
        try {
            await services.disconnect(services.state().transport);
        }
        finally {
            pending = false;
        }
        return state();
    }));
}
exports.registerBlockConnections = registerBlockConnections;
//# sourceMappingURL=BlockConnections.js.map