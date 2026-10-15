import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { C_COMMANDS } from './CCommands';
import { CBuildOperations, createCTemplate, insertCCommand, cCommandHelp, configureCPaths, registerCLanguage } from './CDocuments';
import { getCPortRows, buildCPortEdit, cSettingsBlock } from './CPortSettings';
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
    let cMode = currentSet === 'E-RCU' && context.globalState.get<string>('e6Language','python') === 'c';
    const commands = new CommandTreeProvider(currentSet, context.globalState, cMode ? 'c' : 'python');
    const cBuild = new CBuildOperations(context.extensionPath);
    context.subscriptions.push(cBuild);
    registerCLanguage(context,()=>cMode);
    const systemCommands = new SystemCommandTreeProvider();
    let commandView: vscode.TreeView<CommandTreeItem> | undefined;
    const updateMode = (): void => {
        commands.setLanguage(cMode ? 'c' : 'python'); systemCommands.setCMode(cMode, currentSet === 'E-RCU');
        if(commandView)commandView.description = cMode ? 'E6 · C' : (currentSet === 'E-RCU' ? 'E6' : currentSet === 'E7' ? 'E7' : 'H')+' · Python';
        void vscode.commands.executeCommand('setContext','zmrobo.cMode',cMode);
        void vscode.commands.executeCommand('setContext','zmrobo.controller',currentSet);
        if(cMode) void configureCPaths(context.extensionPath).catch(error=>vscode.window.showWarningMessage(errorMessage(error)));
    };
    updateMode();
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
    commandView = vscode.window.createTreeView('rcuCommands', { treeDataProvider: commands });
    updateMode();
    context.subscriptions.push(commands, systemCommands, devices,
        commandView,
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
    for(const [id,definition] of Object.entries(C_COMMANDS)) register(id,()=>{
        if(!cMode || currentSet !== 'E-RCU') throw new Error('Выберите E6 и режим C.');
        return insertCCommand(definition.snippet);
    });
    register('aicam.guide', () => {
        const panel = vscode.window.createWebviewPanel('aicamGuide', 'ИИ-камера — руководство', vscode.ViewColumn.One, { enableScripts: false, localResourceRoots: [] });
        panel.webview.html = getProgramExamples('aicam.guide', context.extensionPath);
        context.subscriptions.push(panel);
    });
    const selectSet = async (set: ControllerSet): Promise<void> => {
        currentSet = set;
        cMode = set === 'E-RCU' && context.globalState.get<string>('e6Language','python') === 'c';
        commands.setController(set);
        updateMode();
        await context.globalState.update('controller', set);
        vscode.window.showInformationMessage('Выбран набор: ' + (set === 'E-RCU' ? 'E6' : set === 'H-RCU' ? 'H' : 'E7'));
    };
    const selectLanguage = async(enabled:boolean):Promise<void> => {
        if(currentSet !== 'E-RCU') throw new Error('Режим C доступен только для E6.');
        await context.globalState.update('e6Language',enabled?'c':'python'); cMode=enabled; updateMode();
        vscode.window.showInformationMessage('E6: выбран '+(cMode?'C':'Python')+'.');
    };
    register('extension.setCMode',()=>selectLanguage(true));
    register('extension.setPythonMode',()=>selectLanguage(false));
    register('extension.compileC',async()=>{if(!cMode)throw new Error('Выберите режим C для E6.');const result=await cBuild.compile();vscode.window.showInformationMessage('Собран '+result.name+' ('+result.bytes.length+' байт).');});
    register('extension.showCLog',()=>cBuild.showLog());
    register('extension.setErcu', () => selectSet('E-RCU'));
    register('extension.setHrcu', () => selectSet('H-RCU'));
    register('extension.setE7', () => selectSet('E7'));
    register('extension.addFavorite', (node?: CommandTreeItem) => commands.addFavorite(node?.commandId));
    register('extension.removeFavorite', (node?: CommandTreeItem) => commands.removeFavorite(node?.commandId));
    register('rcuCommands.refresh', () => commands.refresh());
    register('rcuSidebar.refresh', () => commands.refresh()); // Compatibility with older callers.
    register('extension.refreshSystemCommands', () => systemCommands.refresh());
    register('extension.createPythonTemplate', () => cMode ? createCTemplate() : createPythonTemplate(currentSet));
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
            if(cMode) {
                const disk = transport === 'usb' ? devices.getSelectedDevice() : undefined;
                const address = transport === 'bluetooth' ? bluetooth.connectedAddress : undefined;
                if(transport === 'bluetooth' && !address)throw new Error('Подключитесь к E6 по Bluetooth.');
                if(transport === 'usb' && !disk)throw new Error('Выберите USB-накопитель E6.');
                if(disk && /E7|H-RCU/i.test(String(disk.label)))throw new Error('Программы C поддерживаются только для E6.');
                const result=await cBuild.compile();
                if(!cMode || currentSet !== 'E-RCU')throw new Error('Режим изменился во время сборки. Загрузка отменена.');
                if(transport==='bluetooth')await bluetooth.uploadBinary(result.name,result.bytes,address);
                else {
                    if(devices.getSelectedDevice()!==disk)throw new Error('USB-устройство изменилось во время сборки.');
                    if(!(await fs.promises.stat(disk!.mountpoint)).isDirectory())throw new Error('USB-накопитель недоступен.');
                    await fs.promises.writeFile(path.join(disk!.mountpoint,result.name),result.bytes);
                    vscode.window.showInformationMessage('Загружен '+result.name+'. Запустите файл в меню E6.');
                }
            }
            else if (transport === 'bluetooth') await bluetooth.upload(await captureBluetoothProgram(true));
            else await uploadActiveFile(devices, context.extensionPath);
        }
        finally { uploading = false; }
    };
    register('extension.uploadFile', () => upload());
    register('extension.uploadFileToDevice', () => upload());
    register('extension.uploadUSB', (device?: DeviceTreeItem) => switchConnection('usb', async () => {
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
    register('extension.playUSB', async () => {if(cMode)throw new Error('Запустите собранный .bin в меню E6.');return usbDebug.play(await captureBluetoothProgram(false));});
    register('extension.stopUSB', () => {if(cMode)throw new Error('Остановите C-программу кнопкой контроллера.');return usbDebug.stop();});
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
    register('extension.uploadBluetooth', async () => upload('bluetooth'));
    register('extension.playBluetooth', async () => {if(cMode)throw new Error('Запустите собранный .bin в меню E6.');return bluetooth.play(await captureBluetoothProgram(false));});
    register('extension.stopBluetooth', () => {if(cMode)throw new Error('Остановите C-программу кнопкой контроллера.');return bluetooth.stop();});
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
    register('extension.openExamples', async () => {
        const language = cMode ? 'c' : 'python';
        const panel = vscode.window.createWebviewPanel('examplePage', 'Примеры программ', vscode.ViewColumn.One,
            { enableScripts: true, localResourceRoots: [] });
        panel.webview.html = programExamples(panel.webview.cspSource, currentSet, language);
        watchMessages(panel, async message => {
            if (message?.command === 'openExample') await openExampleFile(message.example, context.extensionPath, language);
        });
    });
    register('extension.configurePorts', () => {
        const target = vscode.window.activeTextEditor?.document;
        if (!target || target.languageId !== (cMode ? 'c' : 'python')) throw new Error('Откройте файл выбранного языка перед настройкой портов.');
        if (target.isUntitled) throw new Error('Сначала сохраните файл, затем откройте настройку портов.');
        const portCMode=cMode;
        const motorPorts = currentSet === 'E-RCU' ? 4 : 8;
        const settingsBlock=portCMode?cSettingsBlock:findSettingsBlock;
        const portRows=portCMode?getCPortRows:(text: string)=>getPortRows(text, motorPorts);
        const portEdit=portCMode?buildCPortEdit:(text: string, rows: unknown)=>buildPortEdit(text, rows, motorPorts);
        const initialBlock = settingsBlock(target.getText())?.content;
        const rows = portRows(target.getText());
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
                if (settingsBlock(text)?.content !== initialBlock) throw new Error('Блок портов изменился после открытия окна. Закройте окно и откройте его снова, чтобы сохранить актуальные имена.');
                const change = portEdit(text, message.rows);
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
        infoPanel.webview.html = node.commandId.startsWith('c.') ? cCommandHelp(node.commandId) : getProgramExamples(node.commandId, context.extensionPath, node.label, node.controller);
        infoPanel.reveal(vscode.ViewColumn.Beside, true);
    });
}

export function deactivate(): void { /* Disposables are owned by ExtensionContext. */ }
