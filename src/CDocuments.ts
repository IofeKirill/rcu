import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { validFileName } from './FileOperations';
import { compileC, CBuild } from './CCompiler';
import { C_COMMANDS } from './CCommands';
import { escapeHtml } from './WebviewUtils';
import { HELP_STYLE } from './HelpFormatting';
import { C_SIGNATURES } from './CSDK';

export const C_TEMPLATE = '#define _TASK_1_ 1  // Запуск первой задачи.\n#include "zmrobo.h"  // Библиотека команд E6.\n\n// ---------- Настройки моторов и датчиков ----------\n// --------------------------------------------------\n\nvoid task1(void) {\n    // Программа робота.\n}\n';

export async function createCTemplate(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) throw new Error('Откройте папку проекта.');
    const current = vscode.window.activeTextEditor ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri) : undefined;
    const folder = current || (folders.length === 1 ? folders[0] : await vscode.window.showWorkspaceFolderPick({placeHolder:'Выберите папку проекта'}));
    if (!folder) return;
    const name = await vscode.window.showInputBox({prompt:'Имя нового C-файла для E6',validateInput:validFileName});
    if (!name) return;
    if (folder.uri.scheme !== 'file') throw new Error('Создание C-файла поддерживается на локальном диске.');
    const uri = vscode.Uri.joinPath(folder.uri,/\.c$/i.test(name)?name:name+'.c');
    await fs.promises.writeFile(uri.fsPath,C_TEMPLATE,{encoding:'utf8',flag:'wx'});
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
}

export async function insertCCommand(snippet: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'c') throw new Error('Откройте C-файл E6 для вставки команды.');
    if (!await editor.insertSnippet(new vscode.SnippetString(snippet))) throw new Error('Не удалось вставить команду C.');
}

export class CBuildOperations implements vscode.Disposable {
    private readonly output = vscode.window.createOutputChannel('ZMROBO C');
    private busy = false;
    constructor(private readonly extensionPath: string) {}
    async compile(): Promise<CBuild> {
        if (this.busy) throw new Error('Дождитесь завершения сборки C.');
        const document = vscode.window.activeTextEditor?.document;
        if (!document || document.languageId !== 'c') throw new Error('Откройте C-файл E6.');
        if (document.isUntitled || document.uri.scheme !== 'file') throw new Error('Сохраните C-файл в папку проекта.');
        this.busy=true;
        try {
            if (document.isDirty && !await document.save()) throw new Error('C-файл не сохранён.');
            const source=document.getText();
            this.output.show(true);
            return await vscode.window.withProgress({location:vscode.ProgressLocation.Window,title:'Сборка C для E6…'},
                () => compileC(this.extensionPath,document.uri.fsPath,source,message=>this.output.appendLine(message),
                    vscode.workspace.getConfiguration('zmrobo.c').get<string>('compilerPath','')));
        } finally { this.busy=false; }
    }
    showLog(): void { this.output.show(); }
    dispose(): void { this.output.dispose(); }
}

export function cCommandHelp(id: string): string {
    const command=C_COMMANDS[id];
    if (!command) throw new Error('Неизвестная команда C.');
    const example=command.snippet.replace(/\$\{\d+:([^}]*)\}/g,'$1').replace(/\$\{\d+\}/g,'');
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>${HELP_STYLE}</style></head><body><main><h1>${escapeHtml(command.label)} — C / E6</h1><p>${escapeHtml(command.description)}</p><h2>Сигнатура C</h2><pre><code>${escapeHtml(command.signature)}</code></pre><h2>Пример</h2><pre><code>${escapeHtml(example)}</code></pre><p>Общий заголовок библиотеки: <code>#include "zmrobo.h"</code>.</p></main></body></html>`;
}

export async function configureCPaths(extensionPath: string): Promise<void> {
    const folders=vscode.workspace.workspaceFolders;
    if (!folders?.length) return;
    for (const folder of folders) {
        const config=vscode.workspace.getConfiguration('C_Cpp.default',folder.uri);
        const existing=config.get<string[]>('includePath',[]);
        const sdk=path.join(extensionPath,'c-sdk','includeRTOSE6');
        if (!existing.includes(sdk)) await config.update('includePath',[...existing,sdk],vscode.ConfigurationTarget.WorkspaceFolder);
        if (process.platform === 'win32' && !config.get<string>('compilerPath','')) {
            await config.update('compilerPath',path.join(extensionPath,'toolchain','win32','bin','arm-none-eabi-gcc.exe'),vscode.ConfigurationTarget.WorkspaceFolder);
        }
    }
}

export function registerCLanguage(context:vscode.ExtensionContext,enabled:()=>boolean):void {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({language:'c',scheme:'file'},{
        provideCompletionItems:()=> enabled()?C_SIGNATURES.filter(signature=>C_COMMANDS['c.'+signature.name]).map(signature=>{
            const item=new vscode.CompletionItem(signature.name,vscode.CompletionItemKind.Function);
            item.detail=C_COMMANDS['c.'+signature.name].signature+' — E6';
            item.insertText=new vscode.SnippetString(C_COMMANDS['c.'+signature.name].snippet);
            return item;
        }):undefined
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider({language:'c',scheme:'file'},{
        provideHover:(document,position)=>{
            if(!enabled())return undefined;
            const range=document.getWordRangeAtPosition(position);
            if(!range)return undefined;
            const command=C_COMMANDS['c.'+document.getText(range)];
            if(!command)return undefined;
            const text=new vscode.MarkdownString().appendCodeblock(command.signature,'c').appendText(command.description);
            return new vscode.Hover(text,range);
        }
    }));
}
