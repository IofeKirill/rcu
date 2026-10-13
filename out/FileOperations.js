"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openExampleFile = exports.uploadActiveFile = exports.usesGyroLibrary = exports.createPythonTemplate = exports.validFileName = exports.errorMessage = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const ProgramExamples_1 = require("./ProgramExamples");
const PythonImports_1 = require("./PythonImports");
function errorMessage(error) { return error instanceof Error ? error.message : String(error); }
exports.errorMessage = errorMessage;
function validFileName(name) {
    if (!name.trim() || name !== name.trim())
        return 'Введите имя без пробелов в начале и конце.';
    if (/[\\/:*?"<>|\x00-\x1f]/.test(name) || name === '.' || name === '..' || /[. ]$/.test(name))
        return 'Имя не должно содержать разделители пути или запрещённые символы.';
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name))
        return 'Это имя зарезервировано в Windows.';
    return undefined;
}
exports.validFileName = validFileName;
async function createPythonTemplate(_controller) {
    const folders = vscode.workspace.workspaceFolders;
    if (!(folders === null || folders === void 0 ? void 0 : folders.length))
        throw new Error('Откройте папку проекта.');
    let folder = vscode.window.activeTextEditor ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri) : undefined;
    if (!folder)
        folder = folders.length === 1 ? folders[0] : await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Выберите папку проекта' });
    if (!folder)
        return;
    const name = await vscode.window.showInputBox({ prompt: 'Имя нового Python-файла', validateInput: validFileName });
    if (!name)
        return;
    if (folder.uri.scheme !== 'file')
        throw new Error('Создание файла поддерживается на локальном диске.');
    const fileName = /\.py$/i.test(name) ? name : name + '.py';
    const uri = vscode.Uri.joinPath(folder.uri, fileName);
    const content = 'import rcu  # ' + PythonImports_1.LIBRARY_COMMENTS.rcu + '\n\ndef task1():\n    pass\n\ntask1()\n';
    await fs.promises.writeFile(uri.fsPath, content, { encoding: 'utf8', flag: 'wx' });
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
}
exports.createPythonTemplate = createPythonTemplate;
function usesGyroLibrary(text) {
    // Remove comments and strings so examples inside them do not trigger library copying.
    const code = text.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|#[^\n]*/g, '');
    return /\bfrom\s+gyro_lib\s+import\b/.test(code) || /(?:^|[;\n])\s*import\s+[^;\n]*\bgyro_lib\b/m.test(code);
}
exports.usesGyroLibrary = usesGyroLibrary;
async function uploadActiveFile(devices, extensionPath) {
    var _a;
    // Capture this document before any asynchronous operation or dialog changes editor focus.
    const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
    if (!document || document.languageId !== 'python')
        throw new Error('Откройте Python-файл, который нужно загрузить.');
    if (document.isUntitled)
        throw new Error('Сначала сохраните Python-файл в папку проекта, затем повторите загрузку.');
    if (document.isDirty) {
        if (!await document.save())
            throw new Error('Файл не сохранён. Загрузка отменена.');
    }
    if (document.uri.scheme !== 'file')
        throw new Error('Для загрузки сохраните программу на локальном диске.');
    const device = devices.getSelectedDevice();
    if (!device)
        throw new Error('Найдите и выберите устройство в разделе «Устройства USB».');
    const stat = await fs.promises.stat(device.mountpoint);
    if (!stat.isDirectory())
        throw new Error('Выбранное устройство недоступно. Повторите поиск устройств.');
    const destination = path.join(device.mountpoint, path.basename(document.uri.fsPath));
    const samePath = (a, b) => process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b);
    if (samePath(document.uri.fsPath, destination))
        throw new Error('Открытый файл уже находится на выбранном устройстве.');
    if (usesGyroLibrary(document.getText())) {
        const library = path.join(extensionPath, 'stub_libs', 'gyro_lib.py');
        await fs.promises.access(library, fs.constants.R_OK);
        await fs.promises.copyFile(library, path.join(device.mountpoint, 'gyro_lib.py'));
    }
    await fs.promises.copyFile(document.uri.fsPath, destination);
    vscode.window.showInformationMessage('Загружен файл ' + path.basename(document.uri.fsPath) + ' на ' + device.label + ' (' + device.mountpoint + ').');
}
exports.uploadActiveFile = uploadActiveFile;
async function openExampleFile(exampleName, extensionPath) {
    const example = ProgramExamples_1.PROGRAM_EXAMPLES.find(item => item.file === exampleName);
    if (!example)
        throw new Error('Неизвестный пример программы.');
    let file = path.join(extensionPath, 'examples', example.file);
    try {
        await fs.promises.access(file);
    }
    catch (error) {
        if (!example.legacyFile)
            throw error;
        file = path.join(extensionPath, 'examples', example.legacyFile);
    }
    const content = await fs.promises.readFile(file, 'utf8');
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'python', content }));
}
exports.openExampleFile = openExampleFile;
//# sourceMappingURL=FileOperations.js.map