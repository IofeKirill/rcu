"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemCommandTreeItem = void 0;
const vscode = require("vscode");
class SystemCommandTreeItem extends vscode.TreeItem {
    constructor(label, commandId) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.commandId = commandId;
        this.id = commandId;
        this.command = { command: commandId, title: label };
        this.tooltip = label;
    }
}
exports.SystemCommandTreeItem = SystemCommandTreeItem;
//# sourceMappingURL=SystemCommandTreeItem.js.map