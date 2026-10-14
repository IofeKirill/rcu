"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTreeProvider = void 0;
const vscode = require("vscode");
const CommandTreeItem_1 = require("./CommandTreeItem");
const CommandTrees_1 = require("./CommandTrees");
class CommandTreeProvider {
    constructor(controller = 'E-RCU', storage) {
        this.controller = controller;
        this.storage = storage;
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.roots = [];
        this.favorites = new Map();
        this.pendingSave = Promise.resolve();
        this.loadFavorites();
        this.rebuild();
    }
    setController(controller) { this.controller = controller; this.loadFavorites(); this.rebuild(); this.refresh(); }
    loadFavorites() {
        var _a, _b;
        if (this.favorites.has(this.controller))
            return;
        // Keep existing favorites when upgrading from the shared-list preview.
        const saved = (_a = this.storage) === null || _a === void 0 ? void 0 : _a.get('favoriteCommands.' + this.controller, (_b = this.storage) === null || _b === void 0 ? void 0 : _b.get('favoriteCommands', []));
        const available = this.commandDescriptions();
        this.favorites.set(this.controller, Array.isArray(saved)
            ? [...new Set(saved.filter((id) => typeof id === 'string' && available.has(id)))] : []);
    }
    refresh() { this.changes.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) { return element ? element.children : this.roots; }
    addFavorite(commandId) { return this.changeFavorite(commandId, true); }
    removeFavorite(commandId) { return this.changeFavorite(commandId, false); }
    descriptions() { return this.controller === 'E7' ? CommandTrees_1.E7_TREE : this.controller === 'H-RCU' ? CommandTrees_1.HRCU_TREE : CommandTrees_1.ERCU_TREE; }
    commandDescriptions() {
        const result = new Map();
        const visit = (nodes) => {
            for (const node of nodes) {
                if (node.commandId)
                    result.set(node.commandId, node);
                if (node.children)
                    visit(node.children);
            }
        };
        visit(this.descriptions());
        return result;
    }
    changeFavorite(commandId, add) {
        if (!commandId || (add && !this.commandDescriptions().has(commandId)))
            return Promise.reject(new Error('Выберите конкретную команду робота.'));
        const controller = this.controller;
        const save = this.pendingSave.then(async () => {
            const current = this.favorites.get(controller) || [];
            const next = add ? [...new Set([...current, commandId])] : current.filter(id => id !== commandId);
            if (next.length === current.length && next.every((id, index) => id === current[index]))
                return;
            if (this.storage)
                await this.storage.update('favoriteCommands.' + controller, next);
            this.favorites.set(controller, next);
            this.rebuild();
            this.refresh();
        });
        this.pendingSave = save.catch(() => undefined);
        return save;
    }
    rebuild() {
        const build = (nodes, prefix = '') => nodes.map((node, index) => {
            var _a;
            const id = prefix + '/' + index;
            const item = new CommandTreeItem_1.CommandTreeItem(node.label, node.commandId, ((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, node.children ? build(node.children, id) : [], this.controller);
            item.id = this.controller + id;
            return item;
        });
        const available = this.commandDescriptions();
        const favorites = (this.favorites.get(this.controller) || []).flatMap(commandId => {
            const definition = available.get(commandId);
            if (!definition)
                return [];
            const item = new CommandTreeItem_1.CommandTreeItem(definition.label, commandId, vscode.TreeItemCollapsibleState.None, [], this.controller);
            item.id = this.controller + '/favorites/' + commandId;
            item.contextValue = 'favoriteRobotCommand';
            return [item];
        });
        const favoriteGroup = new CommandTreeItem_1.CommandTreeItem('Избранное', undefined, favorites.length ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None, favorites, this.controller);
        favoriteGroup.id = this.controller + '/favorites';
        favoriteGroup.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
        favoriteGroup.description = favorites.length ? 'Команд: ' + favorites.length : 'Пока пусто';
        this.roots = [favoriteGroup, ...build(this.descriptions())];
    }
    dispose() { this.changes.dispose(); }
}
exports.CommandTreeProvider = CommandTreeProvider;
//# sourceMappingURL=CommandTreeProvider.js.map