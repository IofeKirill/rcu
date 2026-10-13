import * as vscode from 'vscode';
export class SystemCommandTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly commandId: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.id = commandId;
        this.command = { command: commandId, title: label };
        this.tooltip = label;
    }
}
