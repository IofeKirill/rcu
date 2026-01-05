// SystemCommandTreeItem.ts
import * as vscode from 'vscode';

export class SystemCommandTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState);

        if (commandId) {
            this.command = {
                command: commandId,
                title: label,
            };
        }

        this.tooltip = `${this.label}`;
    }
}
