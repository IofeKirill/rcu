"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileC = exports.cWrapper = exports.cCode = void 0;
const fs = require("fs");
const path = require("path");
const os = require("os");
const child_process_1 = require("child_process");
const CSDK_1 = require("./CSDK");
function cCode(source) {
    return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, match => match.replace(/[^\r\n]/g, ' '));
}
exports.cCode = cCode;
function cWrapper(source, sourcePath) {
    var _a;
    const code = cCode(source);
    const tasks = [];
    const pattern = /^\s*#\s*define\s+(_TASK_[1-8]_)\s+([01])\b/gm;
    let match;
    while ((match = pattern.exec(code)) !== null)
        tasks.push(match);
    for (const name of CSDK_1.C_UNAVAILABLE)
        if (new RegExp('\\b' + name + '\\b').test(code))
            throw new Error('Команда ' + name + ' не поддерживается этим комплектом C-библиотеки E6.');
    const definitions = tasks.length ? tasks.map(match => '#define ' + match[1] + ' ' + match[2]) : ['#define _TASK_1_ 1'];
    const selected = new Set(CSDK_1.C_SIGNATURES.filter(command => new RegExp('\\b' + command.name + '\\b').test(code)).map(command => command.name));
    for (const name of selected)
        for (const dependency of ((_a = CSDK_1.C_SIGNATURES.find(command => command.name === name)) === null || _a === void 0 ? void 0 : _a.dependencies) || [])
            selected.add(dependency);
    for (const command of CSDK_1.C_SIGNATURES)
        if (selected.has(command.name))
            definitions.push('#define ' + command.macro + ' 1');
    return definitions.join('\n') + '\n#include "JMLib.c"\n#include "' + sourcePath.replace(/\\/g, '/').replace(/"/g, '\\"') + '"\n';
}
exports.cWrapper = cWrapper;
async function compileC(extensionPath, sourcePath, source, log, configuredCompiler = '') {
    if (!/\.c$/i.test(sourcePath))
        throw new Error('Для сборки откройте файл с расширением .c.');
    const bin = configuredCompiler.trim() || (process.platform === 'win32' ? path.join(extensionPath, 'toolchain', 'win32', 'bin') : '');
    const executable = (name) => bin ? path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')) : name;
    const sdk = path.join(extensionPath, 'c-sdk', 'includeRTOSE6');
    const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'zmrobo-c-'));
    const run = (tool, args) => new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(executable(tool), args, { cwd: directory, windowsHide: true, shell: false });
        let output = '';
        const timer = setTimeout(() => { child.kill(); reject(new Error('Компиляция C заняла больше двух минут.')); }, 120000);
        child.stdout.on('data', chunk => { output += chunk.toString(); log(chunk.toString()); });
        child.stderr.on('data', chunk => { output += chunk.toString(); log(chunk.toString()); });
        child.on('error', error => { clearTimeout(timer); reject(new Error('Не удалось запустить компилятор C: ' + error.message)); });
        child.on('close', status => { clearTimeout(timer); status === 0 ? resolve() : reject(new Error('Ошибка сборки C. ' + output.trim().slice(-500))); });
    });
    try {
        const sourceFile = path.join(directory, 'program.c');
        await fs.promises.writeFile(sourceFile, source, 'utf8');
        await fs.promises.writeFile(path.join(directory, 'wrapper.c'), cWrapper(source, sourceFile), 'utf8');
        const flags = ['-mcpu=cortex-m4', '-mthumb', '-mfpu=fpv4-sp-d16', '-mfloat-abi=hard'];
        log('Компиляция C для E6…');
        await run('arm-none-eabi-gcc', ['-I', sdk, '-I', path.dirname(sourcePath), ...flags, '-Os', '-fsigned-char', '-w', '-gdwarf-2', '-ffunction-sections', '-fcommon', '-fgnu89-inline', '-DF_CPU=168000000UL', '-std=gnu99', '-c', 'wrapper.c', '-o', 'program.o']);
        const objects = (await fs.promises.readdir(path.join(sdk, 'o'))).filter(file => file.endsWith('.o') && file !== 'main.o').sort();
        const linkArgs = [...flags, '-specs=nano.specs', '-T', path.join(sdk, 'o', 'STM32F407VGTx_FLASH.ld'), '-Wl,--gc-sections',
            '-Wl,-Map=program.map,-cref', ...objects.map(file => path.join(sdk, 'o', file)), 'program.o', '-lc', '-lm', '-lnosys', '-o', 'program.elf'];
        const quote = (arg) => '"' + arg.replace(/\\/g, '/').replace(/"/g, '\\"') + '"';
        await fs.promises.writeFile(path.join(directory, 'link.rsp'), linkArgs.map(quote).join('\n'), 'utf8');
        await run('arm-none-eabi-gcc', ['@link.rsp']);
        await run('arm-none-eabi-objcopy', ['-O', 'binary', 'program.elf', 'program.bin']);
        const bytes = await fs.promises.readFile(path.join(directory, 'program.bin'));
        if (!bytes.length || bytes.length > 128 * 1024)
            throw new Error('Недопустимый размер программы E6: ' + bytes.length + ' байт.');
        const name = path.basename(sourcePath).replace(/\.c$/i, '.bin');
        const outputDirectory = path.join(path.dirname(sourcePath), '.zmrobo-build');
        await fs.promises.mkdir(outputDirectory, { recursive: true });
        const outputFile = path.join(outputDirectory, name);
        await fs.promises.writeFile(outputFile, bytes);
        log('Готово: ' + name + ' — ' + bytes.length + ' байт.');
        return { name, file: outputFile, bytes };
    }
    finally {
        await fs.promises.rm(directory, { recursive: true, force: true });
    }
}
exports.compileC = compileC;
//# sourceMappingURL=CCompiler.js.map