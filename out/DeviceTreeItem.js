"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTreeItem = void 0;
const vscode = require("vscode");
const ConnectionIcons_1 = require("./ConnectionIcons");
class DeviceTreeItem extends vscode.TreeItem {
    constructor(label, mountpoint, isUSB = true) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.mountpoint = mountpoint;
        this.isUSB = isUSB;
        this.isSelected = false;
        this.id = mountpoint ? 'device:' + mountpoint : 'searchDevices';
        this.contextValue = mountpoint ? 'deviceItem' : 'deviceAction';
        this.command = mountpoint ? { command: 'device.select', title: 'Выбрать устройство', arguments: [this] }
            : { command: 'extension.detectDevices', title: 'Поиск по USB' };
        this.update(false);
    }
    update(selected, connecting = false) {
        this.isSelected = selected;
        const status = connecting ? 'подключение…' : selected ? 'выбрано для загрузки' : 'не выбрано';
        this.description = this.mountpoint ? `${this.mountpoint} — ${status}` : undefined;
        this.tooltip = this.mountpoint ? `${this.label}\n${this.mountpoint}\nUSB — ${status}` : 'Найти подключённые USB-накопители';
        this.iconPath = this.mountpoint ? (0, ConnectionIcons_1.connectionIcon)(connecting ? 'connecting' : selected ? 'connected' : 'disconnected') : new vscode.ThemeIcon('search');
    }
}
exports.DeviceTreeItem = DeviceTreeItem;
//# sourceMappingURL=DeviceTreeItem.js.map