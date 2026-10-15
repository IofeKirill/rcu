"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemCommandTreeProvider = void 0;
const vscode = require("vscode");
const SystemCommandTreeItem_1 = require("./SystemCommandTreeItem");
class SystemCommandTreeProvider {
    constructor() {
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.cMode = false;
        this.e6 = true;
        this.commands = [
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Примеры программ', 'extension.openExamples')
        ];
    }
    getTreeItem(element) { return element; }
    setCMode(enabled, e6 = true) { this.cMode = enabled; this.e6 = e6; this.refresh(); }
    getChildren(element) {
        return element ? [] : this.cMode ? [
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Создать C-файл для E6', 'extension.createPythonTemplate'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Примеры C', 'extension.openExamples'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Переключиться на Python', 'extension.setPythonMode')
        ] : [...this.commands, ...(this.e6 ? [new SystemCommandTreeItem_1.SystemCommandTreeItem('Переключиться на C', 'extension.setCMode')] : [])];
    }
    refresh() { this.changes.fire(); }
    dispose() { this.changes.dispose(); }
}
exports.SystemCommandTreeProvider = SystemCommandTreeProvider;
//# sourceMappingURL=SystemCommandTreeProvider.js.map