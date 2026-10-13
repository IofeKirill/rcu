import * as vscode from 'vscode';
import { SystemCommandTreeItem } from './SystemCommandTreeItem';
export class SystemCommandTreeProvider implements vscode.TreeDataProvider<SystemCommandTreeItem>, vscode.Disposable {
    private readonly changes = new vscode.EventEmitter<SystemCommandTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private readonly commands = [
        new SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
        new SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
        new SystemCommandTreeItem('Примеры программ', 'extension.openExamples')
    ];
    getTreeItem(element: SystemCommandTreeItem): vscode.TreeItem { return element; }
    getChildren(element?: SystemCommandTreeItem): SystemCommandTreeItem[] { return element ? [] : this.commands; }
    refresh(): void { this.changes.fire(); }
    dispose(): void { this.changes.dispose(); }
}
