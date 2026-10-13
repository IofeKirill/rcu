"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTreeItem = void 0;
const vscode = require("vscode");
const CommandCatalog_1 = require("./CommandCatalog");
class CommandTreeItem extends vscode.TreeItem {
    constructor(label, commandId, collapsibleState, children = [], controller) {
        var _a;
        super(label, collapsibleState);
        this.label = label;
        this.commandId = commandId;
        this.collapsibleState = collapsibleState;
        this.children = children;
        this.controller = controller;
        if (commandId) {
            this.command = { command: commandId, title: label };
            this.contextValue = 'robotCommand';
            this.tooltip = new vscode.MarkdownString().appendText(((_a = CommandCatalog_1.COMMANDS[commandId]) === null || _a === void 0 ? void 0 : _a.description) || 'Вставляет шаблон команды.');
        }
        else {
            this.contextValue = 'commandGroup';
            this.tooltip = label;
        }
    }
}
exports.CommandTreeItem = CommandTreeItem;
//# sourceMappingURL=CommandTreeItem.js.map