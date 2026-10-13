import * as vscode from 'vscode';
import { connectionIcon } from './ConnectionIcons';

export class DeviceTreeItem extends vscode.TreeItem {
    public isSelected = false;
    public serialDevice?: import("./BluetoothBridge").BluetoothDevice;
    public serialDevices?: import("./BluetoothBridge").BluetoothDevice[];
    constructor(public readonly label: string, public readonly mountpoint: string, public readonly isUSB = true) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.id = mountpoint ? 'device:' + mountpoint : 'searchDevices';
        this.contextValue = mountpoint ? 'deviceItem' : 'deviceAction';
        this.command = mountpoint ? { command: 'device.select', title: 'Выбрать устройство', arguments: [this] }
            : { command: 'extension.detectDevices', title: 'Поиск по USB' };
        this.update(false);
    }
    update(selected: boolean, connecting = false): void {
        this.isSelected = selected;
        const status = connecting ? 'подключение…' : selected ? 'выбрано для загрузки' : 'не выбрано';
        this.description = this.mountpoint ? `${this.mountpoint} — ${status}` : undefined;
        this.tooltip = this.mountpoint ? `${this.label}\n${this.mountpoint}\nUSB — ${status}` : 'Найти подключённые USB-накопители';
        this.iconPath = this.mountpoint ? connectionIcon(connecting ? 'connecting' : selected ? 'connected' : 'disconnected') : new vscode.ThemeIcon('search');
    }
}
