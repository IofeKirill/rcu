"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BluetoothTreeProvider = void 0;
const vscode = require("vscode");
const ConnectionIcons_1 = require("./ConnectionIcons");
class BluetoothTreeProvider {
    constructor() {
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.devices = [];
        this.searching = false;
    }
    setSearching(searching, message) { this.searching = searching; this.searchMessage = message; this.changes.fire(); }
    setDevices(devices) { this.devices = devices; this.changes.fire(); }
    setState(state) { this.state = (state === null || state === void 0 ? void 0 : state.address) ? state : undefined; this.changes.fire(); }
    setConnecting(device) { this.connecting = device; this.changes.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) {
        var _a;
        if (element)
            return [];
        const devices = [...this.devices];
        if (this.connecting && !devices.some(d => d.address === this.connecting.address))
            devices.push(this.connecting);
        if (((_a = this.state) === null || _a === void 0 ? void 0 : _a.address) && !devices.some(d => d.address === this.state.address)) {
            devices.unshift({ address: this.state.address, name: this.state.name || 'контроллер' });
        }
        const rows = devices.map(device => {
            var _a, _b;
            const item = new vscode.TreeItem(device.name, vscode.TreeItemCollapsibleState.None);
            const connected = ((_a = this.state) === null || _a === void 0 ? void 0 : _a.address) === device.address;
            const connecting = ((_b = this.connecting) === null || _b === void 0 ? void 0 : _b.address) === device.address;
            const status = connecting ? 'connecting' : connected ? 'connected' : 'disconnected';
            item.id = 'ble:' + device.address;
            item.contextValue = connecting ? 'bluetoothConnecting' : connected ? 'bluetoothConnected' : 'bluetoothDevice';
            const label = connecting ? 'подключение…' : connected ? 'подключён' : 'не подключён';
            item.description = `${device.address} — ${label}${connected && !connecting && this.state.running ? ', программа запущена' : ''}`;
            item.tooltip = `${device.name}\n${device.address}\nBluetooth — ${label}${connected && !connecting ? '\nПрошивка: ' + this.state.version : ''}`;
            item.iconPath = (0, ConnectionIcons_1.connectionIcon)(status);
            item.command = { command: 'extension.connectBluetooth', title: 'Подключить контроллер', arguments: [device] };
            return item;
        });
        const search = new vscode.TreeItem(this.searching ? 'Поиск контроллеров…' : 'Поиск контроллера по Bluetooth', vscode.TreeItemCollapsibleState.None);
        search.id = 'ble:search';
        search.iconPath = new vscode.ThemeIcon(this.searching ? 'loading~spin' : 'search');
        search.description = this.searching ? 'Подождите, идёт сканирование' : this.searchMessage;
        search.tooltip = this.searching ? 'Поиск Bluetooth-контроллеров выполняется. Обычно занимает около 10 секунд.' : this.searchMessage || 'Найти контроллеры Bluetooth';
        if (!this.searching)
            search.command = { command: 'extension.scanBluetooth', title: 'Поиск контроллера по Bluetooth' };
        rows.push(search);
        return rows;
    }
    dispose() { this.changes.dispose(); }
}
exports.BluetoothTreeProvider = BluetoothTreeProvider;
//# sourceMappingURL=BluetoothTreeProvider.js.map