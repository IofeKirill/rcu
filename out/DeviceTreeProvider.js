"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTreeProvider = void 0;
const vscode = require("vscode");
const DeviceTreeItem_1 = require("./DeviceTreeItem");
const fs = require("fs");
const ConnectionIcons_1 = require("./ConnectionIcons");
const UsbDevices_1 = require("./UsbDevices");
class DeviceTreeProvider {
    constructor(listDrives, verifyMountpoint = async (mountpoint) => {
        if (!(await fs.promises.stat(mountpoint)).isDirectory())
            throw new Error('USB-накопитель недоступен. Повторите поиск по USB.');
    }) {
        this.listDrives = listDrives;
        this.verifyMountpoint = verifyMountpoint;
        this.devices = [];
        this.disks = [];
        this.changes = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changes.event;
        this.searching = false;
        this.selectionRevision = 0;
        this.serialDevices = [];
        this.serialIdentity = new Map();
        this.searchItem = new DeviceTreeItem_1.DeviceTreeItem('Поиск по USB', '', false);
    }
    updateDevices() {
        this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint, d.mountpoint === this.connectingMountpoint));
        this.refresh();
    }
    refresh() { this.changes.fire(); }
    setSerialDevices(devices) {
        this.serialDevices = devices.map(device => {
            var _a, _b;
            const equalId = (a, b) => !!a && !!b && a.toUpperCase() === b.toUpperCase();
            const previous = this.serialIdentity.get(device.address) || (device.physicalId
                ? [...this.serialIdentity.values()].find(known => equalId(known.physicalId, device.physicalId)) : undefined);
            const serialChanged = !!(previous === null || previous === void 0 ? void 0 : previous.serialNumber) && !!device.serialNumber && previous.serialNumber !== device.serialNumber;
            const hardwareChanged = !!previous && ((previous.vid !== undefined && device.vid !== undefined && previous.vid !== device.vid) ||
                (previous.pid !== undefined && device.pid !== undefined && previous.pid !== device.pid) || serialChanged);
            const samePhysical = !hardwareChanged && equalId(previous === null || previous === void 0 ? void 0 : previous.physicalId, device.physicalId);
            const sameHardware = !!previous && !hardwareChanged && previous.vid === device.vid && previous.pid === device.pid &&
                (previous.serialNumber && device.serialNumber
                    ? previous.serialNumber === device.serialNumber
                    : !!device.location && device.location === previous.location);
            const canReuse = !!previous && (samePhysical || (!device.physicalId && sameHardware));
            if (previous && !canReuse)
                this.serialIdentity.delete(device.address);
            // During USB re-enumeration Windows may report the physical ID before disk associations.
            // Preserve a verified association only for the same device and until a new association arrives.
            const hasDiskMapping = !!((_a = device.mountpoints) === null || _a === void 0 ? void 0 : _a.length) || !!((_b = device.diskDevices) === null || _b === void 0 ? void 0 : _b.length);
            const enriched = canReuse ? { ...previous, ...device,
                name: /^E[67]-RCU$/.test((0, UsbDevices_1.controllerLabel)(device.name)) ? (0, UsbDevices_1.controllerLabel)(device.name) : previous.name,
                physicalId: device.physicalId || previous.physicalId,
                mountpoints: hasDiskMapping ? device.mountpoints : previous.mountpoints,
                diskDevices: hasDiskMapping ? device.diskDevices : previous.diskDevices } : device;
            if (enriched.physicalId) {
                if (canReuse && previous.address !== device.address)
                    this.serialIdentity.delete(previous.address);
                this.serialIdentity.set(device.address, { ...enriched });
            }
            return { ...enriched, present: true };
        });
        // Drive letters and PHYSICALDRIVE numbers are reused when another robot is plugged in.
        // A new verified owner invalidates cached associations of the previous controller.
        const normal = (value) => value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
        for (const [address, known] of this.serialIdentity) {
            const superseded = this.serialDevices.some(current => {
                var _a, _b;
                return current.physicalId && known.physicalId &&
                    current.physicalId.toUpperCase() !== known.physicalId.toUpperCase() &&
                    (((_a = current.mountpoints) === null || _a === void 0 ? void 0 : _a.some(m => { var _a; return (_a = known.mountpoints) === null || _a === void 0 ? void 0 : _a.some(old => normal(m) === normal(old)); })) ||
                        ((_b = current.diskDevices) === null || _b === void 0 ? void 0 : _b.some(d => { var _a; return (_a = known.diskDevices) === null || _a === void 0 ? void 0 : _a.some(old => normal(d) === normal(old)); })));
            });
            if (superseded)
                this.serialIdentity.delete(address);
        }
        this.refresh();
    }
    setSerialState(state) {
        this.serialState = (state === null || state === void 0 ? void 0 : state.address) ? state : undefined;
        if ((state === null || state === void 0 ? void 0 : state.address) && state.name) {
            const known = this.serialIdentity.get(state.address);
            if (known)
                known.name = (0, UsbDevices_1.controllerLabel)(state.name);
            const current = this.serialDevices.find(device => device.address === state.address);
            if (current)
                current.name = (0, UsbDevices_1.controllerLabel)(state.name);
        }
        this.refresh();
    }
    setSerialConnecting(device) { this.serialConnecting = device; this.refresh(); }
    getTreeItem(element) { return element; }
    getChildren(element) {
        var _a;
        if (element)
            return [];
        const ports = [...this.serialDevices];
        for (const known of this.serialIdentity.values()) {
            const diskRemains = this.disks.some(d => {
                var _a, _b;
                return ((_a = known.mountpoints) === null || _a === void 0 ? void 0 : _a.some(m => m.replace(/[\\/]+$/, '').toLowerCase() === d.mountpoint.replace(/[\\/]+$/, '').toLowerCase())) ||
                    (d.device && ((_b = known.diskDevices) === null || _b === void 0 ? void 0 : _b.includes(d.device)));
            });
            if (diskRemains && !ports.some(p => p.address === known.address))
                ports.push({ ...known, present: false });
        }
        if (((_a = this.serialState) === null || _a === void 0 ? void 0 : _a.address) && !ports.some(p => p.address === this.serialState.address))
            ports.push({ address: this.serialState.address, name: this.serialState.name || 'USB COM' });
        if (this.serialConnecting && !ports.some(p => p.address === this.serialConnecting.address))
            ports.push(this.serialConnecting);
        const rows = (0, UsbDevices_1.groupUsbDevices)(this.disks, ports).map(group => {
            var _a, _b, _c;
            const connectedPort = group.ports.find(p => { var _a; return p.address === ((_a = this.serialState) === null || _a === void 0 ? void 0 : _a.address); });
            const connectingPort = group.ports.find(p => { var _a; return p.address === ((_a = this.serialConnecting) === null || _a === void 0 ? void 0 : _a.address); });
            const disk = group.disks.find(d => d.mountpoint === this.selectedMountpoint) || group.disks[0];
            const selected = group.disks.some(d => d.mountpoint === this.selectedMountpoint);
            const connecting = !!connectingPort || group.disks.some(d => d.mountpoint === this.connectingMountpoint);
            const connected = !!connectedPort || (!((_a = this.serialState) === null || _a === void 0 ? void 0 : _a.address) && !group.ports.length && selected);
            const label = connectedPort ? (0, UsbDevices_1.controllerLabel)(((_b = this.serialState) === null || _b === void 0 ? void 0 : _b.name) || group.label) : group.label;
            const item = new DeviceTreeItem_1.DeviceTreeItem(label, (disk === null || disk === void 0 ? void 0 : disk.mountpoint) || '');
            item.id = 'usb:' + group.key;
            item.serialDevices = group.ports.filter(p => p.present !== false);
            item.serialDevice = connectingPort || connectedPort || (item.serialDevices.length === 1 ? item.serialDevices[0] : undefined);
            item.contextValue = connecting ? 'usbDebugConnecting' : connectedPort ? 'usbDebugConnected' : disk ? 'deviceItem' : 'usbDebugDevice';
            const status = connecting ? 'подключение…' : connectedPort ? 'подключён' : connected ? 'выбран для загрузки' : 'не подключён';
            const addresses = [...group.disks.map(d => d.mountpoint), ...group.ports.map(p => p.address + (p.present === false ? ' (недоступен)' : ''))].join(' · ');
            item.description = addresses + ' — ' + status;
            item.tooltip = `${label}\n${addresses}\nUSB — ${status}` + (selected ? '\nНакопитель выбран для загрузки' : '') +
                (connectedPort ? '\nCOM-порт подключён для отладки' : '') +
                (((_c = group.ports[0]) === null || _c === void 0 ? void 0 : _c.serialNumber) ? '\nСерийный номер: ' + group.ports[0].serialNumber : '');
            item.iconPath = (0, ConnectionIcons_1.connectionIcon)(connecting ? 'connecting' : connected ? 'connected' : 'disconnected');
            item.command = { command: 'extension.connectUSBDevice', title: 'Подключить USB-контроллер', arguments: [item] };
            return item;
        });
        return [...rows, this.searchItem];
    }
    async detectDevices() {
        if (this.searching)
            return;
        if (this.connectingMountpoint)
            throw new Error('Дождитесь проверки USB-устройства перед поиском.');
        this.searching = true;
        // Old selection cannot remain usable after a failed refresh.
        const previous = this.selectedMountpoint;
        const revision = this.selectionRevision;
        this.selectedMountpoint = undefined;
        this.devices = [];
        this.disks = [];
        this.refresh();
        try {
            const drives = await this.listDrives();
            const seen = new Set();
            for (const drive of drives) {
                if (!drive.isUSB)
                    continue;
                for (const mount of drive.mountpoints) {
                    if (!mount.path || seen.has(mount.path))
                        continue;
                    seen.add(mount.path);
                    const label = (0, UsbDevices_1.controllerLabel)(drive.description);
                    this.disks.push({ device: drive.device, description: drive.description, mountpoint: mount.path });
                    this.devices.push(new DeviceTreeItem_1.DeviceTreeItem(label, mount.path));
                }
            }
            if (revision === this.selectionRevision && previous && this.devices.some(d => d.mountpoint === previous))
                this.selectedMountpoint = previous;
            this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint));
        }
        finally {
            this.searching = false;
            this.refresh();
        }
    }
    selectDevice(device) {
        if (!(device === null || device === void 0 ? void 0 : device.mountpoint) || !this.devices.some(d => d.mountpoint === device.mountpoint))
            return false;
        this.selectionRevision++;
        this.selectedMountpoint = device.mountpoint;
        this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint));
        this.refresh();
        return true;
    }
    async connectDevice(device) {
        if (!(device === null || device === void 0 ? void 0 : device.mountpoint) || !this.devices.some(d => d.mountpoint === device.mountpoint))
            return false;
        if (this.connectingMountpoint)
            throw new Error('Дождитесь проверки выбранного USB-устройства.');
        this.connectingMountpoint = device.mountpoint;
        this.updateDevices();
        try {
            await this.verifyMountpoint(device.mountpoint);
            return this.selectDevice(device);
        }
        finally {
            this.connectingMountpoint = undefined;
            this.updateDevices();
        }
    }
    clearSelection() { this.selectionRevision++; this.selectedMountpoint = undefined; this.updateDevices(); }
    getSelectedDevice() { return this.devices.find(d => d.mountpoint === this.selectedMountpoint); }
    dispose() { this.changes.dispose(); }
}
exports.DeviceTreeProvider = DeviceTreeProvider;
//# sourceMappingURL=DeviceTreeProvider.js.map