import * as vscode from 'vscode';
import { CommandTreeItem } from './CommandTreeItem';
import { ControllerSet, NodeDesc, ERCU_TREE, HRCU_TREE, E7_TREE } from './CommandTrees';

export class CommandTreeProvider implements vscode.TreeDataProvider<CommandTreeItem>, vscode.Disposable {
    private readonly changes = new vscode.EventEmitter<CommandTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private roots: CommandTreeItem[] = [];
    constructor(private controller: ControllerSet = 'E-RCU') { this.rebuild(); }
    setController(controller: ControllerSet): void { this.controller = controller; this.rebuild(); this.refresh(); }
    refresh(): void { this.changes.fire(); }
    getTreeItem(element: CommandTreeItem): vscode.TreeItem { return element; }
    getChildren(element?: CommandTreeItem): CommandTreeItem[] { return element ? element.children : this.roots; }
    private rebuild(): void {
        const build = (nodes: NodeDesc[], prefix = ''): CommandTreeItem[] => nodes.map((node, index) => {
            const id = prefix + '/' + index;
            const item = new CommandTreeItem(node.label, node.commandId,
                node.children?.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                node.children ? build(node.children, id) : [], this.controller);
            item.id = this.controller + id;
            return item;
        });
        this.roots = build(this.controller === 'E7' ? E7_TREE : this.controller === 'H-RCU' ? HRCU_TREE : ERCU_TREE);
    }
    dispose(): void { this.changes.dispose(); }
}
