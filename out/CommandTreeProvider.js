"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTreeProvider = void 0;
const vscode = require("vscode");
const CommandTreeItem_1 = require("./CommandTreeItem");
const CommandTrees_1 = require("./CommandTrees");
class CommandTreeProvider {
    constructor(controller = 'E-RCU') {
        this.controller = controller;
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.roots = [];
        this.rebuild();
    }
    setController(controller) { this.controller = controller; this.rebuild(); this.refresh(); }
    refresh() { this.changes.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) { return element ? element.children : this.roots; }
    rebuild() {
        const build = (nodes, prefix = '') => nodes.map((node, index) => {
            var _a;
            const id = prefix + '/' + index;
            const item = new CommandTreeItem_1.CommandTreeItem(node.label, node.commandId, ((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, node.children ? build(node.children, id) : [], this.controller);
            item.id = this.controller + id;
            return item;
        });
        this.roots = build(this.controller === 'E7' ? CommandTrees_1.E7_TREE : this.controller === 'H-RCU' ? CommandTrees_1.HRCU_TREE : CommandTrees_1.ERCU_TREE);
    }
    dispose() { this.changes.dispose(); }
}
exports.CommandTreeProvider = CommandTreeProvider;
//# sourceMappingURL=CommandTreeProvider.js.map