'use strict';
// Entry point used only by a local copy of the main extension.
const path = require('node:path');
const vscode = require('vscode');
const root = path.dirname(__dirname);
const manifest = require(path.join(root,'package.json'));
const entry = require.resolve(path.resolve(root,manifest.zmrobo2dOriginalMain));
const original = require(entry);
const simulator = require('./extension.js');

// The original extension owns the tree view. Extend its provider before activation
// so its commands, refresh behavior and view options are preserved.
function addSimulatorRow(entryModule) {
    const visited = new Set(), pending = [entryModule];
    while (pending.length) {
        const mod = pending.pop();
        if (!mod || visited.has(mod)) continue;
        visited.add(mod);
        const proto = mod.exports?.SystemCommandTreeProvider?.prototype;
        if (typeof proto?.getChildren !== 'function') {
            pending.push(...mod.children);
            continue;
        }
        const getChildren = proto.getChildren;
        proto.getChildren = async function (element) {
            const rows = await getChildren.call(this,element);
            if (element || !vscode.workspace.isTrusted || !Array.isArray(rows)) return rows;
            const command = 'zmrobo2d.open', title = 'Открыть 2D-модель';
            const existing=rows.find(row => row.command?.command === command);
            if(existing) return [...rows.filter(row=>row.command?.command!==command),existing];
            const item = new vscode.TreeItem(title,vscode.TreeItemCollapsibleState.None);
            item.command = {command,title};
            return [...rows,item];
        };
        return true;
    }
    return false;
}
addSimulatorRow(require.cache[entry]);

exports.activate = async context => {
    const api = await original.activate(context);
    simulator.activate(context);
    return api;
};
exports.deactivate = () => original.deactivate?.();
