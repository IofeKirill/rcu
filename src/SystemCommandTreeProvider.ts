import * as vscode from 'vscode';
import { SystemCommandTreeItem } from './SystemCommandTreeItem';
export class SystemCommandTreeProvider implements vscode.TreeDataProvider<SystemCommandTreeItem>, vscode.Disposable {
    private readonly changes = new vscode.EventEmitter<SystemCommandTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private cMode = false;
    private e6 = true;
    private readonly commands = [
        new SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
        new SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
        new SystemCommandTreeItem('Примеры программ', 'extension.openExamples')
    ];
    getTreeItem(element: SystemCommandTreeItem): vscode.TreeItem { return element; }
    setCMode(enabled:boolean, e6 = true):void { this.cMode=enabled;this.e6=e6;this.refresh(); }
    getChildren(element?: SystemCommandTreeItem): SystemCommandTreeItem[] { return element ? [] : this.cMode ? [
        new SystemCommandTreeItem('Создать C-файл для E6','extension.createPythonTemplate'),
        new SystemCommandTreeItem('Настроить порты','extension.configurePorts'),
        new SystemCommandTreeItem('Примеры C','extension.openExamples'),
        new SystemCommandTreeItem('Переключиться на Python','extension.setPythonMode')
    ] : [...this.commands, ...(this.e6 ? [new SystemCommandTreeItem('Переключиться на C','extension.setCMode')] : [])]; }
    refresh(): void { this.changes.fire(); }
    dispose(): void { this.changes.dispose(); }
}
