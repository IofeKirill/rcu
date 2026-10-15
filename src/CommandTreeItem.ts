import * as vscode from 'vscode';
import { C_COMMANDS } from './CCommands';
import { COMMANDS } from './CommandCatalog';

export class CommandTreeItem extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly commandId: string | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children: CommandTreeItem[] = [], public readonly controller?: string) {
        super(label, collapsibleState);
        if (commandId) {
            this.command = { command: commandId, title: label };
            this.contextValue = 'robotCommand';
            this.tooltip = new vscode.MarkdownString().appendText((COMMANDS[commandId] || C_COMMANDS[commandId])?.description || 'Вставляет шаблон команды.');
        } else {
            this.contextValue = 'commandGroup';
            this.tooltip = label;
        }
    }
}
