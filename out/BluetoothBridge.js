"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BluetoothBridge = exports.pythonCommand = void 0;
const child_process_1 = require("child_process");
const path = require("path");
function pythonCommand(configured, platform = process.platform) {
    return configured.trim() || (platform === 'win32' ? 'py' : 'python3');
}
exports.pythonCommand = pythonCommand;
class BluetoothBridge {
    constructor(executable, extensionPath, log, event, launcher = child_process_1.spawn, pythonScript = 'bluetooth_bridge.py') {
        this.executable = executable;
        this.extensionPath = extensionPath;
        this.log = log;
        this.event = event;
        this.launcher = launcher;
        this.pythonScript = pythonScript;
        this.pending = new Map();
        this.nextId = 1;
        this.closed = false;
    }
    start() {
        if (this.closed)
            return Promise.reject(new Error('Python-клиент подключения закрыт.'));
        if (this.starting)
            return this.starting;
        const command = pythonCommand(this.executable());
        const env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' };
        delete env.PYTHONPATH; // Do not inject controller stub libraries into the desktop BLE runtime.
        delete env.PYTHONHOME;
        this.starting = new Promise((resolve, reject) => {
            const child = this.launcher(command, ['-u', path.join(this.extensionPath, 'python', this.pythonScript)], { env, windowsHide: true, shell: false });
            this.process = child;
            let ready = false;
            let finished = false;
            let buffer = '';
            const startupTimeout = setTimeout(() => {
                fail(new Error('Python не запустил Python-клиент подключения за 15 секунд. Проверьте журнал ZMROBO Bluetooth.'));
                child.kill();
            }, 15000);
            const fail = (error) => {
                if (finished)
                    return;
                finished = true;
                clearTimeout(startupTimeout);
                if (!ready)
                    reject(error);
                for (const item of this.pending.values()) {
                    clearTimeout(item.timer);
                    item.reject(error);
                }
                this.pending.clear();
                if (this.process === child) {
                    this.process = undefined;
                    this.starting = undefined;
                }
                this.event({ event: 'disconnected', message: error.message });
            };
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', (chunk) => {
                buffer += chunk;
                if (buffer.length > 1024 * 1024) {
                    fail(new Error('Некорректный ответ Python-клиент подключенияа.'));
                    child.kill();
                    return;
                }
                let newline;
                while ((newline = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, newline).trim();
                    buffer = buffer.slice(newline + 1);
                    if (!line)
                        continue;
                    let message;
                    try {
                        message = JSON.parse(line);
                    }
                    catch {
                        this.log(line);
                        continue;
                    }
                    if (message.event === 'ready') {
                        ready = true;
                        clearTimeout(startupTimeout);
                        resolve();
                    }
                    else if (message.event === 'fatal') {
                        fail(new Error(message.message));
                        child.kill();
                    }
                    else if (typeof message.id === 'number') {
                        const item = this.pending.get(message.id);
                        if (!item)
                            continue;
                        this.pending.delete(message.id);
                        clearTimeout(item.timer);
                        if (message.ok)
                            item.resolve(message.result);
                        else
                            item.reject(new Error(message.error || 'Ошибка команды подключения.'));
                    }
                    else if (message.event)
                        this.event(message);
                }
            });
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (line) => this.log(line.trim()));
            child.on('error', error => fail(new Error('Не удалось запустить Python: ' + error.message + '. Проверьте настройку zmrobo.bluetooth.pythonPath.')));
            child.on('close', code => fail(new Error('Python-клиент подключения завершён (код ' + code + '). При необходимости остановите программу на контроллере.')));
        });
        // Synchronous spawn error handlers run after the Promise has been assigned.
        return this.starting;
    }
    async call(action, data = {}) {
        await this.start();
        if (this.pending.size)
            throw new Error('Дождитесь завершения текущей команды подключения.');
        const child = this.process;
        if (!child)
            throw new Error('Python-клиент подключения недоступен. Повторите подключение.');
        const id = this.nextId++;
        const timeoutMs = action === 'upload' ? 180000 : action === 'connect' || action === 'play' ? 45000 : action === 'scan' ? 35000 : 15000;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error('Тайм-аут команды подключения ' + action + '. Проверьте журнал; если программа продолжает работать, остановите её на контроллере.'));
                child.kill(); // A timed-out request must not execute later after the UI has reported failure.
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
            child.stdin.write(JSON.stringify({ id, action, ...data }) + '\n', error => {
                if (error) {
                    const item = this.pending.get(id);
                    if (item) {
                        clearTimeout(item.timer);
                        this.pending.delete(id);
                        item.reject(error);
                    }
                }
            });
        });
    }
    dispose() {
        this.closed = true;
        const child = this.process;
        if (child) {
            child.stdin.end(); // EOF lets Python stop a program it owns and close GATT.
            const timer = setTimeout(() => child.kill(), 12000);
            timer.unref();
            child.once('close', () => clearTimeout(timer));
        }
    }
}
exports.BluetoothBridge = BluetoothBridge;
//# sourceMappingURL=BluetoothBridge.js.map