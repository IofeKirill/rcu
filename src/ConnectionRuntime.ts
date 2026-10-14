import * as fs from 'fs';
import * as path from 'path';
import { pythonCommand } from './BluetoothBridge';

export function connectionPython(extensionPath: string, configured: string,
    platform = process.platform, architecture = process.arch,
    exists: (file: string) => boolean = fs.existsSync): string {
    if (configured.trim()) return configured.trim();
    if (platform !== 'win32') return pythonCommand('', platform);
    if (architecture !== 'x64') throw new Error('Встроенная среда подключения рассчитана на Windows x64. Для другой архитектуры укажите путь к совместимому Python в настройках ZMROBO.');
    const executable = path.join(extensionPath, 'runtime', 'win32-x64', 'python.exe');
    if (!exists(executable) || !exists(path.join(path.dirname(executable), 'runtime.json'))) {
        throw new Error('В расширении отсутствует встроенная среда подключения. Переустановите полную сборку ZMROBO.');
    }
    return executable;
}

export function bundledConnectionRuntime(configured: string, platform = process.platform): boolean {
    return platform === 'win32' && !configured.trim();
}
