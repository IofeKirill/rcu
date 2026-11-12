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
            let choice;
            if (transport === 'usb') {
                const picker = vscode.window.createQuickPick();
                picker.placeholder = 'Выбери контроллер USB';
                picker.matchOnDescription = true;
                picker.ignoreFocusOut = true;
                picker.busy = true;
                let closed = false, scanFailed = false;
                let scanError;
                let accept = () => { }, hide = () => { };
                const picked = new Promise(resolve => { accept = () => { if (picker.selectedItems[0])
                    resolve(picker.selectedItems[0]); }; hide = () => resolve(undefined); });
                const listeners = [picker.onDidAccept(() => { accept(); picker.hide(); }), picker.onDidHide(hide)];
                picker.show();
                const scan = services.scan(transport, choices => { if (!closed)
                    picker.items = choices; }).then(choices => {
                    if (!closed) {
                        picker.items = choices;
                        picker.busy = false;
                        picker.placeholder = choices.length ? 'Выбери контроллер USB' : 'USB-контроллеры не найдены. Подключи кабель и включи робота.';
                    }
                    return choices;
                }, error => { scanFailed = true; scanError = error; if (!closed)
                    hide(); throw error; });
                // Observe errors even if the user cancels before enumeration finishes.
                void scan.catch(() => { });
                try {
                    choice = await picked;
                    if (scanFailed)
                        throw scanError;
                    closed = true;
                    picker.hide();
                    if (choice) {
                        const choices = await scan;
                        choice = choices.find(item => item.key && item.key === choice.key) || choice;
                    }
                    else if (!picker.busy)
                        await scan;
                }
                finally {
                    closed = true;
                    listeners.forEach(item => item.dispose());
                    picker.dispose();
                }
            }
            else {
                const choices = await services.scan(transport);
                if (!choices.length)
                    throw new Error('Bluetooth-контроллеры не найдены. Включи робота и повтори поиск.');
                choice = await vscode.window.showQuickPick(choices, { placeHolder: 'Выбери контроллер Bluetooth', ignoreFocusOut: true });
            }
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