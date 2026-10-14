"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const InsertCommand_1 = require("./InsertCommand");
const LibraryPaths_1 = require("./LibraryPaths");
const CommandCatalog_1 = require("./CommandCatalog");
const CommandTreeProvider_1 = require("./CommandTreeProvider");
const DeviceTreeProvider_1 = require("./DeviceTreeProvider");
const SystemCommandTreeProvider_1 = require("./SystemCommandTreeProvider");
const ProgramExamples_1 = require("./ProgramExamples");
const getProgramExamples_1 = require("./getProgramExamples");
const PortConfiguration_1 = require("./PortConfiguration");
const PortSettings_1 = require("./PortSettings");
const FileOperations_1 = require("./FileOperations");
const BluetoothTreeProvider_1 = require("./BluetoothTreeProvider");
const BluetoothOperations_1 = require("./BluetoothOperations");
function activate(context) {
    const stubPath = path.join(context.extensionPath, 'stub_libs');
    const originalPythonPath = process.env.PYTHONPATH;
    const paths = (originalPythonPath || '').split(path.delimiter).filter(Boolean);
    process.env.PYTHONPATH = [stubPath, ...paths.filter(item => item !== stubPath)].join(path.delimiter);
    context.subscriptions.push({ dispose: () => {
            if (originalPythonPath === undefined)
                delete process.env.PYTHONPATH;
            else
                process.env.PYTHONPATH = originalPythonPath;
        } });
    void (0, LibraryPaths_1.configureLibraryPaths)(stubPath).catch(error => vscode.window.showWarningMessage('Не удалось настроить подсказки Python: ' + (0, FileOperations_1.errorMessage)(error)));
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        void (0, LibraryPaths_1.configureLibraryPaths)(stubPath).catch(error => vscode.window.showWarningMessage((0, FileOperations_1.errorMessage)(error)));
    }));
    let currentSet = context.globalState.get('controller', 'E-RCU');
    if (!['E-RCU', 'H-RCU', 'E7'].includes(currentSet))
        currentSet = 'E-RCU';
    const commands = new CommandTreeProvider_1.CommandTreeProvider(currentSet, context.globalState);
    const systemCommands = new SystemCommandTreeProvider_1.SystemCommandTreeProvider();
    // Load native USB enumeration only on demand; a missing binary cannot hide the command tree.
    const listDrives = async () => {
        try {
            const drivelist = require('drivelist');
            return await drivelist.list();
        }
        catch (error) {
            throw new Error('Не удалось найти USB-устройства. Проверьте установку расширения. ' + (0, FileOperations_1.errorMessage)(error));
        }
    };
    const devices = new DeviceTreeProvider_1.DeviceTreeProvider(listDrives);
    const bluetoothTree = new BluetoothTreeProvider_1.BluetoothTreeProvider();
    let selectedTransport = 'usb';
    const bluetooth = new BluetoothOperations_1.BluetoothOperations(context.extensionPath, bluetoothTree, () => { selectedTransport = 'bluetooth'; });
    const usbDebug = new BluetoothOperations_1.BluetoothOperations(context.extensionPath, {
        setDevices: items => devices.setSerialDevices(items),
        setState: state => devices.setSerialState(state),
        setConnecting: device => devices.setSerialConnecting(device)
    }, () => { selectedTransport = 'usb'; }, { usb: true });
    context.subscriptions.push(usbDebug);
    context.subscriptions.push(bluetooth, bluetoothTree, vscode.window.createTreeView('bluetoothDevices', { treeDataProvider: bluetoothTree }));
    context.subscriptions.push(commands, systemCommands, devices, vscode.window.createTreeView('rcuCommands', { treeDataProvider: commands }), vscode.window.createTreeView('systemCommands', { treeDataProvider: systemCommands }), vscode.window.createTreeView('connectedDevices', { treeDataProvider: devices }));
    let changingConnection = false;
    const switchConnection = async (transport, connect) => {
        if (changingConnection)
            throw new Error('Дождитесь завершения переключения подключения.');
        changingConnection = true;
        try {
            if (transport === 'bluetooth') {
                await usbDebug.disconnect();
                devices.clearSelection();
            }
            else {
                await bluetooth.disconnect();
            }
            await connect();
        }
        finally {
            changingConnection = false;
        }
    };
    const register = (id, handler) => {
        context.subscriptions.push(vscode.commands.registerCommand(id, async (...args) => {
            try {
                return await handler(...args);
            }
            catch (error) {
                vscode.window.showErrorMessage((0, FileOperations_1.errorMessage)(error));
                return undefined;
            }
        }));
    };
    for (const [id, definition] of Object.entries(CommandCatalog_1.COMMANDS)) {
        // The guide opens a webview and is registered separately below.
        if (id === 'aicam.guide')
            continue;
        register(id, () => (0, InsertCommand_1.insertCommand)(definition.snippet));
    }
    register('aicam.guide', () => {
        const panel = vscode.window.createWebviewPanel('aicamGuide', 'ИИ-камера — руководство', vscode.ViewColumn.One, { enableScripts: false, localResourceRoots: [] });
        panel.webview.html = (0, getProgramExamples_1.getProgramExamples)('aicam.guide', context.extensionPath);
        context.subscriptions.push(panel);
    });
    const selectSet = async (set) => {
        currentSet = set;
        commands.setController(set);
        await context.globalState.update('controller', set);
        vscode.window.showInformationMessage('Выбран набор: ' + (set === 'E-RCU' ? 'E6' : set === 'H-RCU' ? 'H' : 'E7'));
    };
    register('extension.setErcu', () => selectSet('E-RCU'));
    register('extension.setHrcu', () => selectSet('H-RCU'));
    register('extension.setE7', () => selectSet('E7'));
    register('extension.addFavorite', (node) => commands.addFavorite(node === null || node === void 0 ? void 0 : node.commandId));
    register('extension.removeFavorite', (node) => commands.removeFavorite(node === null || node === void 0 ? void 0 : node.commandId));
    register('rcuCommands.refresh', () => commands.refresh());
    register('rcuSidebar.refresh', () => commands.refresh()); // Compatibility with older callers.
    register('extension.refreshSystemCommands', () => systemCommands.refresh());
    register('extension.createPythonTemplate', () => (0, FileOperations_1.createPythonTemplate)(currentSet));
    register('extension.detectDevices', async () => {
        const results = await Promise.all([devices.detectDevices(), usbDebug.scan()].map(task => task.then(() => undefined, error => error)));
        for (const result of results)
            if (result !== undefined)
                vscode.window.showWarningMessage((0, FileOperations_1.errorMessage)(result));
        if (devices.getChildren().length === 1)
            vscode.window.showInformationMessage('Подключённые USB-накопители не найдены.');
    });
    register('device.select', (device) => switchConnection('usb', async () => {
        await usbDebug.disconnect();
        if (await devices.connectDevice(device)) {
            selectedTransport = 'usb';
            vscode.window.showInformationMessage('Выбрана загрузка по USB: ' + device.label + ' (' + device.mountpoint + ').');
        }
    }));
    let uploading = false;
    const upload = async (transport = selectedTransport) => {
        if (uploading)
            throw new Error('Дождитесь завершения текущей загрузки.');
        uploading = true;
        try {
            if (transport === 'bluetooth')
                await bluetooth.upload(await (0, BluetoothOperations_1.captureBluetoothProgram)(true));
            else
                await (0, FileOperations_1.uploadActiveFile)(devices, context.extensionPath);
        }
        finally {
            uploading = false;
        }
    };
    register('extension.uploadFile', () => upload());
    register('extension.uploadFileToDevice', () => upload());
    register('extension.uploadUSB', (device) => switchConnection('usb', async () => {
        if (device === null || device === void 0 ? void 0 : device.mountpoint)
            await usbDebug.disconnect();
        if ((device === null || device === void 0 ? void 0 : device.mountpoint) && !devices.selectDevice(device))
            throw new Error('Выбранный USB-накопитель больше не доступен. Повторите поиск.');
        selectedTransport = 'usb';
        await upload('usb');
    }));
    register('extension.connectUSBDevice', (device) => switchConnection('usb', async () => {
        var _a, _b, _c, _d;
        if (!device.mountpoint && !((_a = device.serialDevices) === null || _a === void 0 ? void 0 : _a.length))
            throw new Error('Выберите USB-контроллер.');
        if (!((_b = device.serialDevices) === null || _b === void 0 ? void 0 : _b.length))
            await usbDebug.disconnect();
        if (device.mountpoint && !await devices.connectDevice(device))
            throw new Error('USB-накопитель больше не доступен. Повторите поиск.');
        selectedTransport = 'usb';
        if ((_c = device.serialDevices) === null || _c === void 0 ? void 0 : _c.length) {
            let port = device.serialDevice;
            if (!port)
                port = (_d = (await vscode.window.showQuickPick(device.serialDevices.map(p => ({ label: p.address, description: p.name, device: p })), { placeHolder: 'Выберите порт этого контроллера' }))) === null || _d === void 0 ? void 0 : _d.device;
            if (port)
                await usbDebug.connect(port);
        }
    }));
    register('extension.connectUSBSerial', (device) => {
        if (!(device === null || device === void 0 ? void 0 : device.address))
            return usbDebug.scan();
        return switchConnection('usb', async () => {
            devices.clearSelection();
            await usbDebug.connect(device);
        });
    });
    register('extension.playUSB', async () => usbDebug.play(await (0, BluetoothOperations_1.captureBluetoothProgram)(false)));
    register('extension.stopUSB', () => usbDebug.stop());
    register('extension.disconnectUSB', async () => {
        await usbDebug.disconnect();
        devices.clearSelection();
    });
    register('extension.showUSBLog', () => usbDebug.showLog());
    register('extension.installUSBDependency', () => usbDebug.installDependency());
    register('extension.scanBluetooth', () => bluetooth.scan());
    register('extension.connectBluetooth', (device) => {
        if (!(device === null || device === void 0 ? void 0 : device.address))
            return bluetooth.scan();
        return switchConnection('bluetooth', () => bluetooth.connect(device));
    });
    register('extension.disconnectBluetooth', () => bluetooth.disconnect());
    register('extension.uploadBluetooth', async () => bluetooth.upload(await (0, BluetoothOperations_1.captureBluetoothProgram)(true)));
    register('extension.playBluetooth', async () => bluetooth.play(await (0, BluetoothOperations_1.captureBluetoothProgram)(false)));
    register('extension.stopBluetooth', () => bluetooth.stop());
    register('extension.showBluetoothLog', () => bluetooth.showLog());
    register('extension.installBluetoothDependency', () => bluetooth.installDependency());
    register('extension.testDrivelist', async () => {
        const drives = await listDrives();
        console.log('USB-устройства ZMROBO:', drives);
        vscode.window.showInformationMessage('Список устройств выведен в консоль расширения.');
    });
    const watchMessages = (panel, handler) => {
        const listener = panel.webview.onDidReceiveMessage(message => {
            void handler(message).catch(error => vscode.window.showErrorMessage((0, FileOperations_1.errorMessage)(error)));
        });
        panel.onDidDispose(() => listener.dispose(), undefined, context.subscriptions);
        context.subscriptions.push(panel);
    };
    register('extension.openExamples', () => {
        const panel = vscode.window.createWebviewPanel('examplePage', 'Примеры программ', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
        panel.webview.html = (0, ProgramExamples_1.programExamples)(panel.webview.cspSource, currentSet);
        watchMessages(panel, async (message) => {
            if ((message === null || message === void 0 ? void 0 : message.command) === 'openExample')
                await (0, FileOperations_1.openExampleFile)(message.example, context.extensionPath);
        });
    });
    register('extension.configurePorts', () => {
        var _a, _b;
        const target = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        if (!target || target.languageId !== 'python')
            throw new Error('Откройте Python-файл перед настройкой портов.');
        if (target.isUntitled)
            throw new Error('Сначала сохраните Python-файл, затем откройте настройку портов.');
        const initialBlock = (_b = (0, PortSettings_1.findSettingsBlock)(target.getText())) === null || _b === void 0 ? void 0 : _b.content;
        const rows = (0, PortSettings_1.getPortRows)(target.getText());
        const uri = target.uri;
        const panel = vscode.window.createWebviewPanel('configurePorts', 'Порты — ' + path.basename(uri.fsPath), vscode.ViewColumn.Beside, { enableScripts: true, localResourceRoots: [] });
        panel.webview.html = (0, PortConfiguration_1.getPortConfigurationHtml)(rows, path.basename(uri.fsPath), panel.webview.cspSource);
        let saving = false;
        watchMessages(panel, async (message) => {
            var _a;
            if ((message === null || message === void 0 ? void 0 : message.command) === 'close') {
                if (!saving)
                    panel.dispose();
                return;
            }
            if ((message === null || message === void 0 ? void 0 : message.command) !== 'savePorts' || saving)
                return;
            saving = true;
            try {
                const document = await vscode.workspace.openTextDocument(uri);
                const text = document.getText();
                if (((_a = (0, PortSettings_1.findSettingsBlock)(text)) === null || _a === void 0 ? void 0 : _a.content) !== initialBlock)
                    throw new Error('Блок портов изменился после открытия окна. Закройте окно и откройте его снова, чтобы сохранить актуальные имена.');
                const change = (0, PortSettings_1.buildPortEdit)(text, message.rows);
                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, new vscode.Range(document.positionAt(change.start), document.positionAt(change.end)), change.replacement);
                if (!await vscode.workspace.applyEdit(edit))
                    throw new Error('Не удалось изменить блок настроек.');
                await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
                vscode.window.showInformationMessage('Порты обновлены в файле ' + path.basename(uri.fsPath) + '.');
                panel.dispose();
            }
            catch (error) {
                await panel.webview.postMessage({ command: 'error', message: (0, FileOperations_1.errorMessage)(error) });
            }
            finally {
                saving = false;
            }
        });
    });
    let infoPanel;
    register('extension.showCommandInfo', (node) => {
        if (!(node === null || node === void 0 ? void 0 : node.commandId))
            throw new Error('Нажмите правой кнопкой на конкретную команду и выберите «Информация о команде».');
        if (!infoPanel) {
            infoPanel = vscode.window.createWebviewPanel('commandInfo', 'Информация о команде', vscode.ViewColumn.Beside, { enableScripts: false, localResourceRoots: [] });
            infoPanel.onDidDispose(() => { infoPanel = undefined; }, undefined, context.subscriptions);
            context.subscriptions.push(infoPanel);
        }
        infoPanel.webview.html = (0, getProgramExamples_1.getProgramExamples)(node.commandId, context.extensionPath, node.label, node.controller);
        infoPanel.reveal(vscode.ViewColumn.Beside, true);
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map