import * as vscode from 'vscode';
import { DeviceTreeItem } from './DeviceTreeItem';
import * as fs from 'fs';
import { BluetoothDevice, BluetoothState } from './BluetoothBridge';
import { connectionIcon } from './ConnectionIcons';
import { groupUsbDevices, controllerLabel, UsbDisk } from './UsbDevices';

export interface DriveInfo { device?: string; isUSB: boolean; description: string; mountpoints: { path: string }[]; }
export class DeviceTreeProvider implements vscode.TreeDataProvider<DeviceTreeItem>, vscode.Disposable {
    private devices: DeviceTreeItem[] = [];
    private disks: UsbDisk[] = [];
    private readonly changes = new vscode.EventEmitter<DeviceTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this.changes.event;
    private selectedMountpoint: string | undefined;
    private searching = false;
    private selectionRevision = 0;
    private connectingMountpoint?: string;
    private serialDevices: BluetoothDevice[] = [];
    private readonly serialIdentity = new Map<string, BluetoothDevice>();
    private serialState?: BluetoothState;
    private serialConnecting?: BluetoothDevice;
    private readonly searchItem = new DeviceTreeItem('Поиск по USB', '', false);
    constructor(private readonly listDrives: () => Promise<DriveInfo[]>,
        private readonly verifyMountpoint: (mountpoint: string) => Promise<void> = async mountpoint => {
            if (!(await fs.promises.stat(mountpoint)).isDirectory()) throw new Error('USB-накопитель недоступен. Повторите поиск по USB.');
        }) {}
    private updateDevices(): void {
        this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint, d.mountpoint === this.connectingMountpoint));
        this.refresh();
    }
    refresh(): void { this.changes.fire(); }
    setSerialDevices(devices: BluetoothDevice[]): void {
        this.serialDevices = devices.map(device => {
            const equalId = (a?: string, b?: string): boolean => !!a && !!b && a.toUpperCase() === b.toUpperCase();
            const previous = this.serialIdentity.get(device.address) || (device.physicalId
                ? [...this.serialIdentity.values()].find(known => equalId(known.physicalId, device.physicalId)) : undefined);
            const serialChanged = !!previous?.serialNumber && !!device.serialNumber && previous.serialNumber !== device.serialNumber;
            const hardwareChanged = !!previous && ((previous.vid !== undefined && device.vid !== undefined && previous.vid !== device.vid) ||
                (previous.pid !== undefined && device.pid !== undefined && previous.pid !== device.pid) || serialChanged);
            const samePhysical = !hardwareChanged && equalId(previous?.physicalId, device.physicalId);
            const sameHardware = !!previous && !hardwareChanged && previous.vid === device.vid && previous.pid === device.pid &&
                (previous.serialNumber && device.serialNumber
                    ? previous.serialNumber === device.serialNumber
                    : !!device.location && device.location === previous.location);
            const canReuse = !!previous && (samePhysical || (!device.physicalId && sameHardware));
            if (previous && !canReuse) this.serialIdentity.delete(device.address);
            // During USB re-enumeration Windows may report the physical ID before disk associations.
            // Preserve a verified association only for the same device and until a new association arrives.
            const hasDiskMapping = !!device.mountpoints?.length || !!device.diskDevices?.length;
            const enriched = canReuse ? { ...previous, ...device,
                physicalId: device.physicalId || previous!.physicalId,
                mountpoints: hasDiskMapping ? device.mountpoints : previous!.mountpoints,
                diskDevices: hasDiskMapping ? device.diskDevices : previous!.diskDevices } : device;
            if (enriched.physicalId) {
                if (canReuse && previous!.address !== device.address) this.serialIdentity.delete(previous!.address);
                this.serialIdentity.set(device.address, { ...enriched });
            }
            return { ...enriched, present: true };
        });
        this.refresh();
    }
    setSerialState(state?: BluetoothState): void { this.serialState = state?.address ? state : undefined; this.refresh(); }
    setSerialConnecting(device?: BluetoothDevice): void { this.serialConnecting = device; this.refresh(); }
    getTreeItem(element: DeviceTreeItem): vscode.TreeItem { return element; }
    getChildren(element?: DeviceTreeItem): DeviceTreeItem[] {
        if (element) return [];
        const ports = [...this.serialDevices];
        for (const known of this.serialIdentity.values()) {
            const diskRemains = this.disks.some(d => known.mountpoints?.some(m => m.replace(/[\\/]+$/, '').toLowerCase() === d.mountpoint.replace(/[\\/]+$/, '').toLowerCase()) ||
                (d.device && known.diskDevices?.includes(d.device)));
            if (diskRemains && !ports.some(p => p.address === known.address)) ports.push({ ...known, present: false });
        }
        if (this.serialState?.address && !ports.some(p => p.address === this.serialState!.address)) ports.push({ address: this.serialState.address, name: this.serialState.name || 'USB COM' });
        if (this.serialConnecting && !ports.some(p => p.address === this.serialConnecting!.address)) ports.push(this.serialConnecting);
        const rows = groupUsbDevices(this.disks, ports).map(group => {
            const connectedPort = group.ports.find(p => p.address === this.serialState?.address);
            const connectingPort = group.ports.find(p => p.address === this.serialConnecting?.address);
            const disk = group.disks.find(d => d.mountpoint === this.selectedMountpoint) || group.disks[0];
            const selected = group.disks.some(d => d.mountpoint === this.selectedMountpoint);
            const connecting = !!connectingPort || group.disks.some(d => d.mountpoint === this.connectingMountpoint);
            const connected = !!connectedPort || (!this.serialState?.address && !group.ports.length && selected);
            const label = connectedPort ? controllerLabel(this.serialState?.name || group.label) : group.label;
            const item = new DeviceTreeItem(label, disk?.mountpoint || '');
            item.id = 'usb:' + group.key;
            item.serialDevices = group.ports.filter(p => p.present !== false);
            item.serialDevice = connectingPort || connectedPort || (item.serialDevices.length === 1 ? item.serialDevices[0] : undefined);
            item.contextValue = connecting ? 'usbDebugConnecting' : connectedPort ? 'usbDebugConnected' : disk ? 'deviceItem' : 'usbDebugDevice';
            const status = connecting ? 'подключение…' : connectedPort ? 'подключён' : connected ? 'выбран для загрузки' : 'не подключён';
            const addresses = [...group.disks.map(d => d.mountpoint), ...group.ports.map(p => p.address + (p.present === false ? ' (недоступен)' : ''))].join(' · ');
            item.description = addresses + ' — ' + status;
            item.tooltip = `${label}\n${addresses}\nUSB — ${status}` + (selected ? '\nНакопитель выбран для загрузки' : '') +
                (connectedPort ? '\nCOM-порт подключён для отладки' : '') +
                (group.ports[0]?.serialNumber ? '\nСерийный номер: ' + group.ports[0].serialNumber : '');
            item.iconPath = connectionIcon(connecting ? 'connecting' : connected ? 'connected' : 'disconnected');
            item.command = { command: 'extension.connectUSBDevice', title: 'Подключить USB-контроллер', arguments: [item] };
            return item;
        });
        return [...rows, this.searchItem];
    }
    async detectDevices(): Promise<void> {
        if (this.searching) return;
        if (this.connectingMountpoint) throw new Error('Дождитесь проверки USB-устройства перед поиском.');
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
            const seen = new Set<string>();
            for (const drive of drives) {
                if (!drive.isUSB) continue;
                for (const mount of drive.mountpoints) {
                    if (!mount.path || seen.has(mount.path)) continue;
                    seen.add(mount.path);
                    const label = controllerLabel(drive.description);
                    this.disks.push({device: drive.device, description: drive.description, mountpoint: mount.path});
                    this.devices.push(new DeviceTreeItem(label, mount.path));
                }
            }
            if (revision === this.selectionRevision && previous && this.devices.some(d => d.mountpoint === previous)) this.selectedMountpoint = previous;
            this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint));
        } finally { this.searching = false; this.refresh(); }
    }
    selectDevice(device: DeviceTreeItem): boolean {
        if (!device?.mountpoint || !this.devices.some(d => d.mountpoint === device.mountpoint)) return false;
        this.selectionRevision++;
        this.selectedMountpoint = device.mountpoint;
        this.devices.forEach(d => d.update(d.mountpoint === this.selectedMountpoint));
        this.refresh();
        return true;
    }
    async connectDevice(device: DeviceTreeItem): Promise<boolean> {
        if (!device?.mountpoint || !this.devices.some(d => d.mountpoint === device.mountpoint)) return false;
        if (this.connectingMountpoint) throw new Error('Дождитесь проверки выбранного USB-устройства.');
        this.connectingMountpoint = device.mountpoint;
        this.updateDevices();
        try {
            await this.verifyMountpoint(device.mountpoint);
            return this.selectDevice(device);
        } finally {
            this.connectingMountpoint = undefined;
            this.updateDevices();
        }
    }
    clearSelection(): void { this.selectionRevision++; this.selectedMountpoint = undefined; this.updateDevices(); }
    getSelectedDevice(): DeviceTreeItem | undefined { return this.devices.find(d => d.mountpoint === this.selectedMountpoint); }
    dispose(): void { this.changes.dispose(); }
}
