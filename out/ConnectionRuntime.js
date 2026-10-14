"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundledConnectionRuntime = exports.connectionPython = void 0;
const fs = require("fs");
const path = require("path");
const BluetoothBridge_1 = require("./BluetoothBridge");
function connectionPython(extensionPath, configured, platform = process.platform, architecture = process.arch, exists = fs.existsSync) {
    if (configured.trim())
        return configured.trim();
    if (platform !== 'win32')
        return (0, BluetoothBridge_1.pythonCommand)('', platform);
    if (architecture !== 'x64')
        throw new Error('Встроенная среда подключения рассчитана на Windows x64. Для другой архитектуры укажите путь к совместимому Python в настройках ZMROBO.');
    const executable = path.join(extensionPath, 'runtime', 'win32-x64', 'python.exe');
    if (!exists(executable) || !exists(path.join(path.dirname(executable), 'runtime.json'))) {
        throw new Error('В расширении отсутствует встроенная среда подключения. Переустановите полную сборку ZMROBO.');
    }
    return executable;
}
exports.connectionPython = connectionPython;
function bundledConnectionRuntime(configured, platform = process.platform) {
    return platform === 'win32' && !configured.trim();
}
exports.bundledConnectionRuntime = bundledConnectionRuntime;
//# sourceMappingURL=ConnectionRuntime.js.map