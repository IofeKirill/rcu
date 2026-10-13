"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemCommandTreeProvider = void 0;
const vscode = require("vscode");
const SystemCommandTreeItem_1 = require("./SystemCommandTreeItem");
class SystemCommandTreeProvider {
    constructor() {
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.commands = [
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Примеры программ', 'extension.openExamples')
        ];
    }
    getTreeItem(element) { return element; }
    getChildren(element) { return element ? [] : this.commands; }
    refresh() { this.changes.fire(); }
    dispose() { this.changes.dispose(); }
}
exports.SystemCommandTreeProvider = SystemCommandTreeProvider;
//# sourceMappingURL=SystemCommandTreeProvider.js.map