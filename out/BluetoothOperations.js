"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BluetoothOperations = exports.captureBluetoothProgram = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
const BluetoothBridge_1 = require("./BluetoothBridge");
const FileOperations_1 = require("./FileOperations");
async function captureBluetoothProgram(save) {
    var _a;
    const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
    if (!document || document.languageId !== 'python')
        throw new Error('Откройте Python-файл для Bluetooth-команды.');
    if (save && document.isUntitled)
        throw new Error('Сначала сохраните Python-файл.');
    if (save && document.isDirty && !await document.save())
        throw new Error('Файл не сохранён. Загрузка отменена.');
    // Use the document captured before save/dialogs can change focus.
    const source = document.getText();
    return { name: document.isUntitled ? 'program.py' : path.basename(document.uri.fsPath), source };
}
exports.captureBluetoothProgram = captureBluetoothProgram;
class BluetoothOperations {
    constructor(extensionPath, tree, selected, options = {}) {
        this.extensionPath = extensionPath;
        this.tree = tree;
        this.selected = selected;
        this.busy = false;
        this.disposed = false;
        this.bridgeGeneration = 0;
        this.transport = options.usb ? 'USB' : 'Bluetooth';
        this.output = vscode.window.createOutputChannel('ZMROBO ' + this.transport);
        this.bridge = this.createBridge();
    }
    executable() { return (0, BluetoothBridge_1.pythonCommand)(vscode.workspace.getConfiguration('zmrobo.bluetooth').get('pythonPath', '')); }
    createBridge() {
        const generation = ++this.bridgeGeneration;
        return new BluetoothBridge_1.BluetoothBridge(() => this.executable(), this.extensionPath, line => { if (!this.disposed && generation === this.bridgeGeneration)
            this.output.appendLine(line); }, event => { if (!this.disposed && generation === this.bridgeGeneration)
            this.handleEvent(event); }, undefined, this.transport === 'USB' ? 'usb_bridge.py' : 'bluetooth_bridge.py');
    }
    handleEvent(event) {
        if (event.event === 'log')
            this.output.appendLine(event.message || '');
        else if (event.event === 'progress')
            this.output.appendLine('Загрузка: ' + event.percent + '%');
        else if (event.event === 'pairing') {
            this.output.appendLine(event.message || '');
            void vscode.window.showInformationMessage(event.message || 'Подтвердите подключение на экране контроллера.');
        }
        else if (event.event === 'state') {
            this.state = event.address ? { address: event.address, name: event.name || null, version: event.version || null, running: !!event.running } : undefined;
            this.tree.setState(this.state);
        }
        else if (event.event === 'disconnected') {
            const wasConnected = !!this.state;
            this.state = undefined;
            this.tree.setState();
            this.output.appendLine(event.message || 'Контроллер отключён.');
            if (wasConnected)
                void vscode.window.showWarningMessage(event.message || 'Контроллер отключён.');
        }
        else if (event.event === 'runtimeError') {
            this.output.appendLine(event.message || 'Ошибка программы на контроллере.');
            void vscode.window.showErrorMessage('Ошибка программы на контроллере. Откройте журнал ZMROBO ' + this.transport + '.');
        }
    }
    async operation(label, task) {
        if (this.busy)
            throw new Error('Дождитесь завершения текущей команды ' + this.transport + '.');
        this.busy = true;
        try {
            return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: label }, task);
        }
        catch (error) {
            this.output.show(true);
            throw error;
        }
        finally {
            this.busy = false;
        }
    }
    async scan() {
        await this.operation('Поиск по ' + this.transport + '…', async () => {
            var _a, _b, _c, _d, _e, _f;
            (_b = (_a = this.tree).setSearching) === null || _b === void 0 ? void 0 : _b.call(_a, true);
            this.output.appendLine('Начат поиск контроллеров по ' + this.transport + '.');
            try {
                const devices = await this.bridge.call('scan');
                this.tree.setDevices(devices);
                const result = devices.length ? 'Найдено: ' + devices.length : 'Контроллеры не найдены';
                (_d = (_c = this.tree).setSearching) === null || _d === void 0 ? void 0 : _d.call(_c, false, result);
                this.output.appendLine('Поиск завершён. ' + result + '.');
                if (!devices.length)
                    void vscode.window.showInformationMessage(this.transport + ': контроллер не найден. Включите его и закройте Робокод.');
            }
            catch (error) {
                (_f = (_e = this.tree).setSearching) === null || _f === void 0 ? void 0 : _f.call(_e, false, 'Ошибка поиска — см. журнал');
                throw error;
            }
        });
    }
    async connect(device) {
        if (!(device === null || device === void 0 ? void 0 : device.address)) {
            await this.scan();
            return;
        }
        await this.operation('Подключение к контроллеру…', async () => {
            this.tree.setConnecting(device);
            try {
                const state = await this.bridge.call('connect', { address: device.address });
                this.state = state;
                this.tree.setState(state);
                this.selected();
                void vscode.window.showInformationMessage('Подключён ' + state.name + ' (' + state.address + '), прошивка ' + state.version + '. ' + this.transport + '.');
            }
            finally {
                this.tree.setConnecting();
            }
        });
    }
    requireConnection() {
        var _a;
        if (!((_a = this.state) === null || _a === void 0 ? void 0 : _a.address))
            throw new Error('Подключитесь к контроллеру в разделе «' + this.transport + '».');
    }
    async upload(program) {
        this.requireConnection();
        await this.operation('Загрузка на контроллер по Bluetooth…', async () => {
            if (this.transport === 'Bluetooth' && (0, FileOperations_1.usesGyroLibrary)(program.source)) {
                const library = await fs.promises.readFile(path.join(this.extensionPath, 'stub_libs', 'gyro_lib.py'), 'utf8');
                await this.bridge.call('upload', { name: 'gyro_lib.py', source: library });
            }
            const result = await this.bridge.call('upload', { name: program.name, source: program.source });
            void vscode.window.showInformationMessage(`На контроллер загружен ${program.name} (${result.bytes} байт).`);
        });
    }
    async play(program) {
        this.requireConnection();
        await this.operation('Запуск программы на контроллер…', async () => {
            if (this.transport === 'Bluetooth' && (0, FileOperations_1.usesGyroLibrary)(program.source)) {
                const library = await fs.promises.readFile(path.join(this.extensionPath, 'stub_libs', 'gyro_lib.py'), 'utf8');
                await this.bridge.call('upload', { name: 'gyro_lib.py', source: library });
            }
            await this.bridge.call('play', { source: program.source });
            this.output.appendLine('Play: Контроллер принял код из ' + program.name + '. Результат выполнения смотрите в журнале/на контроллере.');
            void vscode.window.showInformationMessage('Контроллер принял код из ' + program.name + '.');
        });
    }
    async stop() {
        this.requireConnection();
        await this.operation('Остановка программы контроллера…', async () => {
            await this.bridge.call('stop');
            void vscode.window.showInformationMessage('Stop подтверждён контроллером.');
        });
    }
    async disconnect() {
        var _a;
        // An inactive transport needs no Python process just to switch to another one.
        if (!((_a = this.state) === null || _a === void 0 ? void 0 : _a.address))
            return;
        await this.operation('Отключение контроллера…', async () => {
            await this.bridge.call('disconnect');
            this.state = undefined;
            this.tree.setState();
        });
    }
    showLog() { this.output.show(); }
    async installDependency() {
        var _a;
        if ((_a = this.state) === null || _a === void 0 ? void 0 : _a.address)
            throw new Error('Отключите контроллер перед установкой зависимости.');
        const dependency = this.transport === 'USB' ? 'pyserial' : 'bleak';
        await this.operation('Установка ' + dependency + ' для ' + this.transport + '…', async () => {
            this.output.show(true);
            await new Promise((resolve, reject) => {
                const child = (0, child_process_1.spawn)(this.executable(), ['-m', 'pip', 'install', dependency], { windowsHide: true, shell: false });
                child.stdout.on('data', data => this.output.append(data.toString()));
                child.stderr.on('data', data => this.output.append(data.toString()));
                child.on('error', reject);
                child.on('close', code => code === 0 ? resolve() : reject(new Error('Установка ' + dependency + ' завершилась с кодом ' + code + '. Смотрите журнал.')));
            });
            this.bridge.dispose();
            this.bridge = this.createBridge();
            void vscode.window.showInformationMessage(dependency + ' установлен. Теперь выполните поиск по ' + this.transport + '.');
        });
    }
    dispose() { this.disposed = true; this.bridge.dispose(); this.output.dispose(); }
}
exports.BluetoothOperations = BluetoothOperations;
//# sourceMappingURL=BluetoothOperations.js.map