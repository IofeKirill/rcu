"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemCommandTreeItem = void 0;
// SystemCommandTreeItem.ts
const vscode = require("vscode");
class SystemCommandTreeItem extends vscode.TreeItem {
    constructor(label, commandId, collapsibleState = vscode.TreeItemCollapsibleState.None) {
        super(label, collapsibleState);
        this.label = label;
        this.commandId = commandId;
        this.collapsibleState = collapsibleState;
        if (commandId) {
            this.command = {
                command: commandId,
                title: label,
            };
        }
        this.tooltip = `${this.label}`;
    }
}
exports.SystemCommandTreeItem = SystemCommandTreeItem;
//# sourceMappingURL=SystemCommandTreeItem.js.map