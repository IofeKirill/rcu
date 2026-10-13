import * as vscode from 'vscode';
import * as path from 'path';
import { insertCommand } from './InsertCommand';
import { configureLibraryPaths } from './LibraryPaths';
import { COMMANDS } from './CommandCatalog';
import { CommandTreeItem } from './CommandTreeItem';
import { CommandTreeProvider } from './CommandTreeProvider';
import { ControllerSet } from './CommandTrees';
import { DeviceTreeItem } from './DeviceTreeItem';
import { DeviceTreeProvider, DriveInfo } from './DeviceTreeProvider';
import { SystemCommandTreeProvider } from './SystemCommandTreeProvider';
import { programExamples } from './ProgramExamples';
import { getProgramExamples } from './getProgramExamples';
import { getPortConfigurationHtml } from './PortConfiguration';
import { buildPortEdit, findSettingsBlock, getPortRows } from './PortSettings';
import { createPythonTemplate, errorMessage, openExampleFile, uploadActiveFile } from './FileOperations';
import { BluetoothTreeProvider } from './BluetoothTreeProvider';
import { BluetoothOperations, captureBluetoothProgram } from './BluetoothOperations';
import { BluetoothDevice } from './BluetoothBridge';

export function activate(context: vscode.ExtensionContext): void {
    const stubPath = path.join(context.extensionPath, 'stub_libs');
    const originalPythonPath = process.env.PYTHONPATH;
    const paths = (originalPythonPath || '').split(path.delimiter).filter(Boolean);
    process.env.PYTHONPATH = [stubPath, ...paths.filter(item => item !== stubPath)].join(path.delimiter);
    context.subscriptions.push({ dispose: () => {
        if (originalPythonPath === undefined) delete process.env.PYTHONPATH;
        else process.env.PYTHONPATH = originalPythonPath;
    } });
    void configureLibraryPaths(stubPath).catch(error => vscode.window.showWarningMessage('Не удалось настроить подсказки Python: ' + errorMessage(error)));
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        void configureLibraryPaths(stubPath).catch(error => vscode.window.showWarningMessage(errorMessage(error)));
    }));
    let currentSet: ControllerSet = context.globalState.get<ControllerSet>('controller', 'E-RCU');
    if (!['E-RCU', 'H-RCU', 'E7'].includes(currentSet)) currentSet = 'E-RCU';
    const commands = new CommandTreeProvider(currentSet);
    const systemCommands = new SystemCommandTreeProvider();
    // Load native USB enumeration only on demand; a missing binary cannot hide the command tree.
    const listDrives = async (): Promise<DriveInfo[]> => {
        try {
            const drivelist = require('drivelist') as { list(): Promise<DriveInfo[]> };
            return await drivelist.list();
        } catch (error) { throw new Error('Не удалось найти USB-устройства. Проверьте установку расширения. ' + errorMessage(error)); }
    };
    const devices = new DeviceTreeProvider(listDrives);
    const bluetoothTree = new BluetoothTreeProvider();
    let selectedTransport: 'usb' | 'bluetooth' = 'usb';
    const bluetooth = new BluetoothOperations(context.extensionPath, bluetoothTree, () => { selectedTransport = 'bluetooth'; });
    const usbDebug = new BluetoothOperations(context.extensionPath, {
        setDevices: items => devices.setSerialDevices(items),
        setState: state => devices.setSerialState(state),
        setConnecting: device => devices.setSerialConnecting(device)
    }, () => { selectedTransport = 'usb'; }, { usb: true });
    context.subscriptions.push(usbDebug);
    context.subscriptions.push(bluetooth, bluetoothTree,
        vscode.window.createTreeView('bluetoothDevices', { treeDataProvider: bluetoothTree }));
    context.subscriptions.push(commands, systemCommands, devices,
        vscode.window.createTreeView('rcuCommands', { treeDataProvider: commands }),
        vscode.window.createTreeView('systemCommands', { treeDataProvider: systemCommands }),
        vscode.window.createTreeView('connectedDevices', { treeDataProvider: devices }));

    let changingConnection = false;
    const switchConnection = async (transport: 'usb' | 'bluetooth', connect: () => Promise<void>): Promise<void> => {
        if (changingConnection) throw new Error('Дождитесь завершения переключения подключения.');
        changingConnection = true;
        try {
            if (transport === 'bluetooth') {
                await usbDebug.disconnect();
                devices.clearSelection();
            } else {
                await bluetooth.disconnect();
            }
            await connect();
        } finally { changingConnection = false; }
    };

    const register = (id: string, handler: (...args: any[]) => unknown): void => {
        context.subscriptions.push(vscode.commands.registerCommand(id, async (...args: any[]) => {
            try { return await handler(...args); }
            catch (error) { vscode.window.showErrorMessage(errorMessage(error)); return undefined; }
        }));
    };
    for (const [id, definition] of Object.entries(COMMANDS)) {
        // The guide opens a webview and is registered separately below.
        if (id === 'aicam.guide') continue;
        register(id, () => insertCommand(definition.snippet));
    }
    register('aicam.guide', () => {
        const panel = vscode.window.createWebviewPanel('aicamGuide', 'ИИ-камера — руководство', vscode.ViewColumn.One, { enableScripts: false, localResourceRoots: [] });
        panel.webview.html = getProgramExamples('aicam.guide', context.extensionPath);
        context.subscriptions.push(panel);
    });
    const selectSet = async (set: ControllerSet): Promise<void> => {
        currentSet = set;
        commands.setController(set);
        await context.globalState.update('controller', set);
        vscode.window.showInformationMessage('Выбран набор: ' + (set === 'E-RCU' ? 'E6' : set === 'H-RCU' ? 'H' : 'E7'));
    };
    register('extension.setErcu', () => selectSet('E-RCU'));
    register('extension.setHrcu', () => selectSet('H-RCU'));
    register('extension.setE7', () => selectSet('E7'));
    register('rcuCommands.refresh', () => commands.refresh());
    register('rcuSidebar.refresh', () => commands.refresh()); // Compatibility with older callers.
    register('extension.refreshSystemCommands', () => systemCommands.refresh());
    register('extension.createPythonTemplate', () => createPythonTemplate(currentSet));
    register('extension.detectDevices', async () => {
        const results = await Promise.all([devices.detectDevices(), usbDebug.scan()].map(task => task.then(() => undefined, error => error)));
        for (const result of results) if (result !== undefined) vscode.window.showWarningMessage(errorMessage(result));
        if (devices.getChildren().length === 1) vscode.window.showInformationMessage('Подключённые USB-накопители не найдены.');
    });
    register('device.select', (device: DeviceTreeItem) => switchConnection('usb', async () => {
        await usbDebug.disconnect();
        if (await devices.connectDevice(device)) {
            selectedTransport = 'usb';
            vscode.window.showInformationMessage('Выбрана загрузка по USB: ' + device.label + ' (' + device.mountpoint + ').');
        }
    }));
    let uploading = false;
    const upload = async (transport: 'usb' | 'bluetooth' = selectedTransport): Promise<void> => {
        if (uploading) throw new Error('Дождитесь завершения текущей загрузки.');
        uploading = true;
        try {
            if (transport === 'bluetooth') await bluetooth.upload(await captureBluetoothProgram(true));
            else await uploadActiveFile(devices, context.extensionPath);
        }
        finally { uploading = false; }
    };
    register('extension.uploadFile', () => upload());
    register('extension.uploadFileToDevice', () => upload());
    register('extension.uploadUSB', (device?: DeviceTreeItem) => switchConnection('usb', async () => {
        if (device?.mountpoint) await usbDebug.disconnect();
        if (device?.mountpoint && !devices.selectDevice(device)) throw new Error('Выбранный USB-накопитель больше не доступен. Повторите поиск.');
        selectedTransport = 'usb';
        await upload('usb');
    }));
    register('extension.connectUSBDevice', (device: DeviceTreeItem) => switchConnection('usb', async () => {
        if (!device.mountpoint && !device.serialDevices?.length) throw new Error('Выберите USB-контроллер.');
        if (!device.serialDevices?.length) await usbDebug.disconnect();
        if (device.mountpoint && !await devices.connectDevice(device)) throw new Error('USB-накопитель больше не доступен. Повторите поиск.');
        selectedTransport = 'usb';
        if (device.serialDevices?.length) {
            let port = device.serialDevice;
            if (!port) port = (await vscode.window.showQuickPick(device.serialDevices.map(p => ({ label: p.address, description: p.name, device: p })), { placeHolder: 'Выберите порт этого контроллера' }))?.device;
            if (port) await usbDebug.connect(port);
        }
    }));
    register('extension.connectUSBSerial', (device?: BluetoothDevice) => {
        if (!device?.address) return usbDebug.scan();
        return switchConnection('usb', async () => {
            devices.clearSelection();
            await usbDebug.connect(device);
        });
    });
    register('extension.playUSB', async () => usbDebug.play(await captureBluetoothProgram(false)));
    register('extension.stopUSB', () => usbDebug.stop());
    register('extension.disconnectUSB', async () => {
        await usbDebug.disconnect();
        devices.clearSelection();
    });
    register('extension.showUSBLog', () => usbDebug.showLog());
    register('extension.installUSBDependency', () => usbDebug.installDependency());
    register('extension.scanBluetooth', () => bluetooth.scan());
    register('extension.connectBluetooth', (device?: BluetoothDevice) => {
        if (!device?.address) return bluetooth.scan();
        return switchConnection('bluetooth', () => bluetooth.connect(device));
    });
    register('extension.disconnectBluetooth', () => bluetooth.disconnect());
    register('extension.uploadBluetooth', async () => bluetooth.upload(await captureBluetoothProgram(true)));
    register('extension.playBluetooth', async () => bluetooth.play(await captureBluetoothProgram(false)));
    register('extension.stopBluetooth', () => bluetooth.stop());
    register('extension.showBluetoothLog', () => bluetooth.showLog());
    register('extension.installBluetoothDependency', () => bluetooth.installDependency());
    register('extension.testDrivelist', async () => {
        const drives = await listDrives();
        console.log('USB-устройства ZMROBO:', drives);
        vscode.window.showInformationMessage('Список устройств выведен в консоль расширения.');
    });

    const watchMessages = (panel: vscode.WebviewPanel, handler: (message: any) => Promise<void>): void => {
        const listener = panel.webview.onDidReceiveMessage(message => {
            void handler(message).catch(error => vscode.window.showErrorMessage(errorMessage(error)));
        });
        panel.onDidDispose(() => listener.dispose(), undefined, context.subscriptions);
        context.subscriptions.push(panel);
    };
    register('extension.openExamples', () => {
        const panel = vscode.window.createWebviewPanel('examplePage', 'Примеры программ', vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [] });
        panel.webview.html = programExamples(panel.webview.cspSource, currentSet);
        watchMessages(panel, async message => {
            if (message?.command === 'openExample') await openExampleFile(message.example, context.extensionPath);
        });
    });
    register('extension.configurePorts', () => {
        const target = vscode.window.activeTextEditor?.document;
        if (!target || target.languageId !== 'python') throw new Error('Откройте Python-файл перед настройкой портов.');
        if (target.isUntitled) throw new Error('Сначала сохраните Python-файл, затем откройте настройку портов.');
        const initialBlock = findSettingsBlock(target.getText())?.content;
        const rows = getPortRows(target.getText());
        const uri = target.uri;
        const panel = vscode.window.createWebviewPanel('configurePorts', 'Порты — ' + path.basename(uri.fsPath), vscode.ViewColumn.Beside,
            { enableScripts: true, localResourceRoots: [] });
        panel.webview.html = getPortConfigurationHtml(rows, path.basename(uri.fsPath), panel.webview.cspSource);
        let saving = false;
        watchMessages(panel, async message => {
            if (message?.command === 'close') { if (!saving) panel.dispose(); return; }
            if (message?.command !== 'savePorts' || saving) return;
            saving = true;
            try {
                const document = await vscode.workspace.openTextDocument(uri);
                const text = document.getText();
                if (findSettingsBlock(text)?.content !== initialBlock) throw new Error('Блок портов изменился после открытия окна. Закройте окно и откройте его снова, чтобы сохранить актуальные имена.');
                const change = buildPortEdit(text, message.rows);
                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, new vscode.Range(document.positionAt(change.start), document.positionAt(change.end)), change.replacement);
                if (!await vscode.workspace.applyEdit(edit)) throw new Error('Не удалось изменить блок настроек.');
                await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: false });
                vscode.window.showInformationMessage('Порты обновлены в файле ' + path.basename(uri.fsPath) + '.');
                panel.dispose();
            } catch (error) { await panel.webview.postMessage({ command: 'error', message: errorMessage(error) }); }
            finally { saving = false; }
        });
    });

    let infoPanel: vscode.WebviewPanel | undefined;
    register('extension.showCommandInfo', (node?: CommandTreeItem) => {
        if (!node?.commandId) throw new Error('Нажмите правой кнопкой на конкретную команду и выберите «Информация о команде».');
        if (!infoPanel) {
            infoPanel = vscode.window.createWebviewPanel('commandInfo', 'Информация о команде', vscode.ViewColumn.Beside,
                { enableScripts: false, localResourceRoots: [] });
            infoPanel.onDidDispose(() => { infoPanel = undefined; }, undefined, context.subscriptions);
            context.subscriptions.push(infoPanel);
        }
        infoPanel.webview.html = getProgramExamples(node.commandId, context.extensionPath, node.label, node.controller);
        infoPanel.reveal(vscode.ViewColumn.Beside, true);
    });
}

export function deactivate(): void { /* Disposables are owned by ExtensionContext. */ }
