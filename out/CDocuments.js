"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCLanguage = exports.configureCPaths = exports.cCommandHelp = exports.CBuildOperations = exports.insertCCommand = exports.createCTemplate = exports.C_TEMPLATE = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const FileOperations_1 = require("./FileOperations");
const CCompiler_1 = require("./CCompiler");
const CCommands_1 = require("./CCommands");
const WebviewUtils_1 = require("./WebviewUtils");
const HelpFormatting_1 = require("./HelpFormatting");
const CSDK_1 = require("./CSDK");
exports.C_TEMPLATE = '#define _TASK_1_ 1  // Запуск первой задачи.\n#include "zmrobo.h"  // Библиотека команд E6.\n\n// ---------- Настройки моторов и датчиков ----------\n// --------------------------------------------------\n\nvoid task1(void) {\n    // Программа робота.\n}\n';
async function createCTemplate() {
    const folders = vscode.workspace.workspaceFolders;
    if (!(folders === null || folders === void 0 ? void 0 : folders.length))
        throw new Error('Откройте папку проекта.');
    const current = vscode.window.activeTextEditor ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri) : undefined;
    const folder = current || (folders.length === 1 ? folders[0] : await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Выберите папку проекта' }));
    if (!folder)
        return;
    const name = await vscode.window.showInputBox({ prompt: 'Имя нового C-файла для E6', validateInput: FileOperations_1.validFileName });
    if (!name)
        return;
    if (folder.uri.scheme !== 'file')
        throw new Error('Создание C-файла поддерживается на локальном диске.');
    const uri = vscode.Uri.joinPath(folder.uri, /\.c$/i.test(name) ? name : name + '.c');
    await fs.promises.writeFile(uri.fsPath, exports.C_TEMPLATE, { encoding: 'utf8', flag: 'wx' });
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
}
exports.createCTemplate = createCTemplate;
async function insertCCommand(snippet) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'c')
        throw new Error('Откройте C-файл E6 для вставки команды.');
    if (!await editor.insertSnippet(new vscode.SnippetString(snippet)))
        throw new Error('Не удалось вставить команду C.');
}
exports.insertCCommand = insertCCommand;
class CBuildOperations {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.output = vscode.window.createOutputChannel('ZMROBO C');
        this.busy = false;
    }
    async compile() {
        var _a;
        if (this.busy)
            throw new Error('Дождитесь завершения сборки C.');
        const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        if (!document || document.languageId !== 'c')
            throw new Error('Откройте C-файл E6.');
        if (document.isUntitled || document.uri.scheme !== 'file')
            throw new Error('Сохраните C-файл в папку проекта.');
        this.busy = true;
        try {
            if (document.isDirty && !await document.save())
                throw new Error('C-файл не сохранён.');
            const source = document.getText();
            this.output.show(true);
            return await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Сборка C для E6…' }, () => (0, CCompiler_1.compileC)(this.extensionPath, document.uri.fsPath, source, message => this.output.appendLine(message), vscode.workspace.getConfiguration('zmrobo.c').get('compilerPath', '')));
        }
        finally {
            this.busy = false;
        }
    }
    showLog() { this.output.show(); }
    dispose() { this.output.dispose(); }
}
exports.CBuildOperations = CBuildOperations;
function cCommandHelp(id) {
    const command = CCommands_1.C_COMMANDS[id];
    if (!command)
        throw new Error('Неизвестная команда C.');
    const example = command.snippet.replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\{\d+\}/g, '');
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>${HelpFormatting_1.HELP_STYLE}</style></head><body><main><h1>${(0, WebviewUtils_1.escapeHtml)(command.label)} — C / E6</h1><p>${(0, WebviewUtils_1.escapeHtml)(command.description)}</p><h2>Сигнатура C</h2><pre><code>${(0, WebviewUtils_1.escapeHtml)(command.signature)}</code></pre><h2>Пример</h2><pre><code>${(0, WebviewUtils_1.escapeHtml)(example)}</code></pre><p>Общий заголовок библиотеки: <code>#include "zmrobo.h"</code>.</p></main></body></html>`;
}
exports.cCommandHelp = cCommandHelp;
async function configureCPaths(extensionPath) {
    const folders = vscode.workspace.workspaceFolders;
    if (!(folders === null || folders === void 0 ? void 0 : folders.length))
        return;
    for (const folder of folders) {
        const config = vscode.workspace.getConfiguration('C_Cpp.default', folder.uri);
        const existing = config.get('includePath', []);
        const sdk = path.join(extensionPath, 'c-sdk', 'includeRTOSE6');
        if (!existing.includes(sdk))
            await config.update('includePath', [...existing, sdk], vscode.ConfigurationTarget.WorkspaceFolder);
        if (process.platform === 'win32' && !config.get('compilerPath', '')) {
            await config.update('compilerPath', path.join(extensionPath, 'toolchain', 'win32', 'bin', 'arm-none-eabi-gcc.exe'), vscode.ConfigurationTarget.WorkspaceFolder);
        }
    }
}
exports.configureCPaths = configureCPaths;
function registerCLanguage(context, enabled) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'c', scheme: 'file' }, {
        provideCompletionItems: () => enabled() ? CSDK_1.C_SIGNATURES.filter(signature => CCommands_1.C_COMMANDS['c.' + signature.name]).map(signature => {
            const item = new vscode.CompletionItem(signature.name, vscode.CompletionItemKind.Function);
            item.detail = CCommands_1.C_COMMANDS['c.' + signature.name].signature + ' — E6';
            item.insertText = new vscode.SnippetString(CCommands_1.C_COMMANDS['c.' + signature.name].snippet);
            return item;
        }) : undefined
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'c', scheme: 'file' }, {
        provideHover: (document, position) => {
            if (!enabled())
                return undefined;
            const range = document.getWordRangeAtPosition(position);
            if (!range)
                return undefined;
            const command = CCommands_1.C_COMMANDS['c.' + document.getText(range)];
            if (!command)
                return undefined;
            const text = new vscode.MarkdownString().appendCodeblock(command.signature, 'c').appendText(command.description);
            return new vscode.Hover(text, range);
        }
    }));
}
exports.registerCLanguage = registerCLanguage;
//# sourceMappingURL=CDocuments.js.map