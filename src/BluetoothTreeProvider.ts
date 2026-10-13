import * as vscode from 'vscode';
import { BluetoothDevice, BluetoothState } from './BluetoothBridge';
import { connectionIcon } from './ConnectionIcons';
export class BluetoothTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
    private readonly changes = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private devices: BluetoothDevice[] = [];
    private state?: BluetoothState;
    private connecting?: BluetoothDevice;
    private searching = false;
    private searchMessage?: string;
    setSearching(searching: boolean, message?: string): void { this.searching = searching; this.searchMessage = message; this.changes.fire(); }
    setDevices(devices: BluetoothDevice[]): void { this.devices = devices; this.changes.fire(); }
    setState(state?: BluetoothState): void { this.state = state?.address ? state : undefined; this.changes.fire(); }
    setConnecting(device?: BluetoothDevice): void { this.connecting = device; this.changes.fire(); }
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem { return element; }
    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
        if (element) return [];
        const devices = [...this.devices];
        if (this.connecting && !devices.some(d => d.address === this.connecting!.address)) devices.push(this.connecting);
        if (this.state?.address && !devices.some(d => d.address === this.state!.address)) {
            devices.unshift({ address: this.state.address, name: this.state.name || 'контроллер' });
        }
        const rows = devices.map(device => {
            const item = new vscode.TreeItem(device.name, vscode.TreeItemCollapsibleState.None);
            const connected = this.state?.address === device.address;
            const connecting = this.connecting?.address === device.address;
            const status = connecting ? 'connecting' : connected ? 'connected' : 'disconnected';
            item.id = 'ble:' + device.address;
            item.contextValue = connecting ? 'bluetoothConnecting' : connected ? 'bluetoothConnected' : 'bluetoothDevice';
            const label = connecting ? 'подключение…' : connected ? 'подключён' : 'не подключён';
            item.description = `${device.address} — ${label}${connected && !connecting && this.state!.running ? ', программа запущена' : ''}`;
            item.tooltip = `${device.name}\n${device.address}\nBluetooth — ${label}${connected && !connecting ? '\nПрошивка: ' + this.state!.version : ''}`;
            item.iconPath = connectionIcon(status);
            item.command = { command: 'extension.connectBluetooth', title: 'Подключить контроллер', arguments: [device] };
            return item;
        });
        const search = new vscode.TreeItem(this.searching ? 'Поиск контроллеров…' : 'Поиск контроллера по Bluetooth', vscode.TreeItemCollapsibleState.None);
        search.id = 'ble:search'; search.iconPath = new vscode.ThemeIcon(this.searching ? 'loading~spin' : 'search');
        search.description = this.searching ? 'Подождите, идёт сканирование' : this.searchMessage;
        search.tooltip = this.searching ? 'Поиск Bluetooth-контроллеров выполняется. Обычно занимает около 10 секунд.' : this.searchMessage || 'Найти контроллеры Bluetooth';
        if (!this.searching) search.command = { command: 'extension.scanBluetooth', title: 'Поиск контроллера по Bluetooth' };
        rows.push(search);
        return rows;
    }
    dispose(): void { this.changes.dispose(); }
}
