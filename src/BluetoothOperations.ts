import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { BluetoothDevice, BridgeEvent, BluetoothBridge, BluetoothState } from './BluetoothBridge';
import { bundledConnectionRuntime, connectionPython } from './ConnectionRuntime';
import { usesGyroLibrary } from './FileOperations';

export interface ProgramSnapshot { name: string; source: string; }
export interface ConnectionTree {
    setDevices(devices: BluetoothDevice[]): void;
    setState(state?: BluetoothState): void;
    setConnecting(device?: BluetoothDevice): void;
    setSearching?(searching: boolean, message?: string): void;
}
export async function captureBluetoothProgram(save: boolean): Promise<ProgramSnapshot> {
    const document = vscode.window.activeTextEditor?.document;
    if (!document || document.languageId !== 'python') throw new Error('Откройте Python-файл для Bluetooth-команды.');
    if (save && document.isUntitled) throw new Error('Сначала сохраните Python-файл.');
    if (save && document.isDirty && !await document.save()) throw new Error('Файл не сохранён. Загрузка отменена.');
    // Use the document captured before save/dialogs can change focus.
    const source = document.getText();
    return { name: document.isUntitled ? 'program.py' : path.basename(document.uri.fsPath), source };
}

export class BluetoothOperations implements vscode.Disposable {
    private readonly output: vscode.OutputChannel;
    private readonly transport: 'Bluetooth' | 'USB';
    private bridge: BluetoothBridge;
    private state?: BluetoothState;
    private busy = false;
    private disposed = false;
    private bridgeGeneration = 0;
    constructor(private readonly extensionPath: string, private readonly tree: ConnectionTree,
        private readonly selected: () => void, options: { usb?: boolean } = {}) {
        this.transport = options.usb ? 'USB' : 'Bluetooth';
        this.output = vscode.window.createOutputChannel('ZMROBO ' + this.transport);
        this.bridge = this.createBridge();
    }
    private configuredPython(): string { return vscode.workspace.getConfiguration('zmrobo.bluetooth').get<string>('pythonPath', ''); }
    private executable(): string { return connectionPython(this.extensionPath, this.configuredPython()); }
    private createBridge(): BluetoothBridge {
        const generation = ++this.bridgeGeneration;
        return new BluetoothBridge(() => this.executable(), this.extensionPath,
            line => { if (!this.disposed && generation === this.bridgeGeneration) this.output.appendLine(line); },
            event => { if (!this.disposed && generation === this.bridgeGeneration) this.handleEvent(event); },
            undefined, this.transport === 'USB' ? 'usb_bridge.py' : 'bluetooth_bridge.py');
    }
    private handleEvent(event: BridgeEvent): void {
        if (event.event === 'log') this.output.appendLine(event.message || '');
        else if (event.event === 'progress') this.output.appendLine('Загрузка: ' + event.percent + '%');
        else if (event.event === 'pairing') {
            this.output.appendLine(event.message || '');
            void vscode.window.showInformationMessage(event.message || 'Подтвердите подключение на экране контроллера.');
        } else if (event.event === 'state') {
            this.state = event.address ? { address: event.address, name: event.name || null, version: event.version || null, running: !!event.running } : undefined;
            this.tree.setState(this.state);
        } else if (event.event === 'disconnected') {
            const wasConnected = !!this.state;
            this.state = undefined; this.tree.setState();
            this.output.appendLine(event.message || 'Контроллер отключён.');
            if (wasConnected) void vscode.window.showWarningMessage(event.message || 'Контроллер отключён.');
        } else if (event.event === 'runtimeError') {
            this.output.appendLine(event.message || 'Ошибка программы на контроллере.');
            void vscode.window.showErrorMessage('Ошибка программы на контроллере. Откройте журнал ZMROBO ' + this.transport + '.');
        }
    }
    private async operation<T>(label: string, task: () => Promise<T>): Promise<T> {
        if (this.busy) throw new Error('Дождитесь завершения текущей команды ' + this.transport + '.');
        this.busy = true;
        try {
            return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: label }, task);
        } catch (error) { this.output.show(true); throw error; }
        finally { this.busy = false; }
    }
    async scan(): Promise<void> {
        await this.operation('Поиск по ' + this.transport + '…', async () => {
            this.tree.setSearching?.(true);
            this.output.appendLine('Начат поиск контроллеров по ' + this.transport + '.');
            try {
                const devices = await this.bridge.call<BluetoothDevice[]>('scan');
                this.tree.setDevices(devices);
                const result = devices.length ? 'Найдено: ' + devices.length : 'Контроллеры не найдены';
                this.tree.setSearching?.(false, result);
                this.output.appendLine('Поиск завершён. ' + result + '.');
                if (!devices.length) void vscode.window.showInformationMessage(this.transport + ': контроллер не найден. Включите его и закройте Робокод.');
            } catch (error) {
                this.tree.setSearching?.(false, 'Ошибка поиска — см. журнал');
                throw error;
            }
        });
    }
    async connect(device?: BluetoothDevice): Promise<void> {
        if (!device?.address) {
            await this.scan();
            return;
        }
        await this.operation('Подключение к контроллеру…', async () => {
            this.tree.setConnecting(device);
            try {
                const state = await this.bridge.call<BluetoothState>('connect', { address: device.address });
                this.state = state; this.tree.setState(state); this.selected();
                void vscode.window.showInformationMessage('Подключён ' + state.name + ' (' + state.address + '), прошивка ' + state.version + '. ' + this.transport + '.');
            } finally { this.tree.setConnecting(); }
        });
    }
    private requireConnection(): void {
        if (!this.state?.address) throw new Error('Подключитесь к контроллеру в разделе «' + this.transport + '».');
    }
    async upload(program: ProgramSnapshot): Promise<void> {
        this.requireConnection();
        await this.operation('Загрузка на контроллер по Bluetooth…', async () => {
            if (this.transport === 'Bluetooth' && usesGyroLibrary(program.source)) {
                const library = await fs.promises.readFile(path.join(this.extensionPath, 'stub_libs', 'gyro_lib.py'), 'utf8');
                await this.bridge.call('upload', { name: 'gyro_lib.py', source: library });
            }
            const result = await this.bridge.call<{ bytes: number }>('upload', { name: program.name, source: program.source });
            void vscode.window.showInformationMessage(`На контроллер загружен ${program.name} (${result.bytes} байт).`);
        });
    }
    async play(program: ProgramSnapshot): Promise<void> {
        this.requireConnection();
        await this.operation('Запуск программы на контроллер…', async () => {
            if (this.transport === 'Bluetooth' && usesGyroLibrary(program.source)) {
                const library = await fs.promises.readFile(path.join(this.extensionPath, 'stub_libs', 'gyro_lib.py'), 'utf8');
                await this.bridge.call('upload', { name: 'gyro_lib.py', source: library });
            }
            await this.bridge.call('play', { source: program.source });
            this.output.appendLine('Play: Контроллер принял код из ' + program.name + '. Результат выполнения смотрите в журнале/на контроллере.');
            void vscode.window.showInformationMessage('Контроллер принял код из ' + program.name + '.');
        });
    }
    async stop(): Promise<void> {
        this.requireConnection();
        await this.operation('Остановка программы контроллера…', async () => {
            await this.bridge.call('stop');
            void vscode.window.showInformationMessage('Stop подтверждён контроллером.');
        });
    }
    async disconnect(): Promise<void> {
        // An inactive transport needs no Python process just to switch to another one.
        if (!this.state?.address) return;
        await this.operation('Отключение контроллера…', async () => {
            await this.bridge.call('disconnect');
            this.state = undefined; this.tree.setState();
        });
    }
    showLog(): void { this.output.show(); }
    async installDependency(): Promise<void> {
        if (this.state?.address) throw new Error('Отключите контроллер перед установкой зависимости.');
        if (bundledConnectionRuntime(this.configuredPython())) {
            this.executable();
            void vscode.window.showInformationMessage('Библиотеки Bluetooth и USB входят в сборку ZMROBO. Выполните поиск контроллера.');
            return;
        }
        const dependency = this.transport === 'USB' ? 'pyserial' : 'bleak';
        await this.operation('Установка ' + dependency + ' для ' + this.transport + '…', async () => {
            this.output.show(true);
            await new Promise<void>((resolve, reject) => {
                const child = spawn(this.executable(), ['-m', 'pip', 'install', dependency], { windowsHide: true, shell: false });
                child.stdout.on('data', data => this.output.append(data.toString()));
                child.stderr.on('data', data => this.output.append(data.toString()));
                child.on('error', reject);
                child.on('close', code => code === 0 ? resolve() : reject(new Error('Установка ' + dependency + ' завершилась с кодом ' + code + '. Смотрите журнал.')));
            });
            this.bridge.dispose(); this.bridge = this.createBridge();
            void vscode.window.showInformationMessage(dependency + ' установлен. Теперь выполните поиск по ' + this.transport + '.');
        });
    }
    dispose(): void { this.disposed = true; this.bridge.dispose(); this.output.dispose(); }
}
