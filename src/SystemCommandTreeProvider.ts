// SystemCommandTreeProvider.ts
import * as vscode from 'vscode';
import { SystemCommandTreeItem } from './SystemCommandTreeItem';

export class SystemCommandTreeProvider implements vscode.TreeDataProvider<SystemCommandTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SystemCommandTreeItem | undefined | null | void> =
        new vscode.EventEmitter<SystemCommandTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SystemCommandTreeItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    getTreeItem(element: SystemCommandTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SystemCommandTreeItem): Thenable<SystemCommandTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        return Promise.resolve(this.getSystemCommands());
    }

    private getSystemCommands(): SystemCommandTreeItem[] {
        return [
            new SystemCommandTreeItem('Загрузить файл на устройство', 'extension.uploadFile'),
            new SystemCommandTreeItem('Создать папку проекта', 'extension.createProjectFolder'),
            new SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
            new SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
            new SystemCommandTreeItem('Примеры программ', 'extension.openExamples'),
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}