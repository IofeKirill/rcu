"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemCommandTreeProvider = void 0;
// SystemCommandTreeProvider.ts
const vscode = require("vscode");
const SystemCommandTreeItem_1 = require("./SystemCommandTreeItem");
class SystemCommandTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.getSystemCommands());
    }
    getSystemCommands() {
        return [
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Загрузить файл на устройство', 'extension.uploadFile'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Создать папку проекта', 'extension.createProjectFolder'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Создать файл для проекта', 'extension.createPythonTemplate'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Настроить порты', 'extension.configurePorts'),
            new SystemCommandTreeItem_1.SystemCommandTreeItem('Примеры программ', 'extension.openExamples'),
        ];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.SystemCommandTreeProvider = SystemCommandTreeProvider;
//# sourceMappingURL=SystemCommandTreeProvider.js.map