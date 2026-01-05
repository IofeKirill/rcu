"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTreeItem = void 0;
const vscode = require("vscode");
class DeviceTreeItem extends vscode.TreeItem {
    constructor(label, mountpoint, isSelected, isUSB) {
        super(label, isSelected ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.label = label;
        this.mountpoint = mountpoint;
        this.isUSB = isUSB;
        this.isSelected = isSelected;
        this.contextValue = 'device';
        this.iconPath = new vscode.ThemeIcon(isSelected ? 'circle-filled' : 'circle-outline');
    }
}
exports.DeviceTreeItem = DeviceTreeItem;
//# sourceMappingURL=DeviceTreeItem.js.map