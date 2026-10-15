import * as vscode from 'vscode';
import { CommandTreeItem } from './CommandTreeItem';
import { C_TREE } from './CCommands';
import { ControllerSet, NodeDesc, ERCU_TREE, HRCU_TREE, E7_TREE } from './CommandTrees';

export class CommandTreeProvider implements vscode.TreeDataProvider<CommandTreeItem>, vscode.Disposable {
    private readonly changes = new vscode.EventEmitter<CommandTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private roots: CommandTreeItem[] = [];
    private readonly favorites = new Map<string, string[]>();
    private pendingSave: Promise<void> = Promise.resolve();
    constructor(private controller: ControllerSet = 'E-RCU', private readonly storage?: vscode.Memento, private language: 'python' | 'c' = 'python') {
        this.loadFavorites();
        this.rebuild();
    }
    setController(controller: ControllerSet): void { this.controller = controller; if(controller !== 'E-RCU') this.language='python'; this.loadFavorites(); this.rebuild(); this.refresh(); }
    setLanguage(language: 'python' | 'c'): void { this.language = this.controller === 'E-RCU' ? language : 'python'; this.loadFavorites(); this.rebuild(); this.refresh(); }
    private scope(): string { return this.controller + (this.language === 'c' ? '.c' : ''); }
    private loadFavorites(): void {
        if (this.favorites.has(this.scope())) return;
        // Keep existing favorites when upgrading from the shared-list preview.
        const saved = this.storage?.get<unknown>('favoriteCommands.' + this.scope(),
            this.storage?.get<unknown>('favoriteCommands', []));
        const available = this.commandDescriptions();
        this.favorites.set(this.scope(), Array.isArray(saved)
            ? [...new Set(saved.filter((id): id is string => typeof id === 'string' && available.has(id)))] : []);
    }
    refresh(): void { this.changes.fire(); }
    getTreeItem(element: CommandTreeItem): vscode.TreeItem { return element; }
    getChildren(element?: CommandTreeItem): CommandTreeItem[] { return element ? element.children : this.roots; }
    addFavorite(commandId?: string): Promise<void> { return this.changeFavorite(commandId, true); }
    removeFavorite(commandId?: string): Promise<void> { return this.changeFavorite(commandId, false); }
    private descriptions(): NodeDesc[] { return this.controller === 'E-RCU' && this.language === 'c' ? C_TREE : this.controller === 'E7' ? E7_TREE : this.controller === 'H-RCU' ? HRCU_TREE : ERCU_TREE; }
    private commandDescriptions(): Map<string, NodeDesc> {
        const result = new Map<string, NodeDesc>();
        const visit = (nodes: NodeDesc[]): void => {
            for (const node of nodes) {
                if (node.commandId) result.set(node.commandId, node);
                if (node.children) visit(node.children);
            }
        };
        visit(this.descriptions());
        return result;
    }
    private changeFavorite(commandId: string | undefined, add: boolean): Promise<void> {
        if (!commandId || (add && !this.commandDescriptions().has(commandId))) return Promise.reject(new Error('Выберите конкретную команду робота.'));
        const controller = this.scope();
        const save = this.pendingSave.then(async () => {
            const current = this.favorites.get(controller) || [];
            const next = add ? [...new Set([...current, commandId])] : current.filter(id => id !== commandId);
            if (next.length === current.length && next.every((id, index) => id === current[index])) return;
            if (this.storage) await this.storage.update('favoriteCommands.' + controller, next);
            this.favorites.set(controller, next);
            this.rebuild();
            this.refresh();
        });
        this.pendingSave = save.catch(() => undefined);
        return save;
    }
    private rebuild(): void {
        const build = (nodes: NodeDesc[], prefix = ''): CommandTreeItem[] => nodes.map((node, index) => {
            const id = prefix + '/' + index;
            const item = new CommandTreeItem(node.label, node.commandId,
                node.children?.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                node.children ? build(node.children, id) : [], this.controller);
            item.id = this.scope() + id;
            return item;
        });
        const available = this.commandDescriptions();
        const favorites = (this.favorites.get(this.scope()) || []).flatMap(commandId => {
            const definition = available.get(commandId);
            if (!definition) return [];
            const item = new CommandTreeItem(definition.label, commandId, vscode.TreeItemCollapsibleState.None, [], this.controller);
            item.id = this.scope() + '/favorites/' + commandId;
            item.contextValue = 'favoriteRobotCommand';
            return [item];
        });
        const favoriteGroup = new CommandTreeItem('Избранное', undefined,
            favorites.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, favorites, this.controller);
        favoriteGroup.id = this.scope() + '/favorites';
        favoriteGroup.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));
        favoriteGroup.description = favorites.length ? 'Команд: ' + favorites.length : 'Пока пусто';
        this.roots = [favoriteGroup, ...build(this.descriptions())];
    }
    dispose(): void { this.changes.dispose(); }
}
