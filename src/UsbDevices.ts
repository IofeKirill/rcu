import { BluetoothDevice } from './BluetoothBridge';

export interface UsbDisk { device?: string; description: string; mountpoint: string; }
export interface UsbController { key: string; label: string; disks: UsbDisk[]; ports: BluetoothDevice[]; }
const normal = (value: string): string => value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
export function controllerLabel(description: string): string {
    if (/E7|MicroPy.*(?:FS|Card)/i.test(description)) return 'E7-RCU';
    if (/E6|Joinmax|ZMROBO/i.test(description)) return 'E6-RCU';
    return description || 'USB-контроллер';
}
// Only verified Windows USB ancestry can join disk and COM interfaces. Enumeration order is irrelevant.
export function groupUsbDevices(disks: UsbDisk[], ports: BluetoothDevice[]): UsbController[] {
    const groups: UsbController[] = [];
    for (const port of ports) {
        const key = port.physicalId ? 'physical:' + port.physicalId.toUpperCase() : 'com:' + port.address;
        let group = groups.find(g => g.key === key);
        if (!group) { group = { key, label: controllerLabel(port.name), ports: [], disks: [] }; groups.push(group); }
        if (!group.ports.some(p => p.address === port.address)) group.ports.push(port);
    }
    for (const disk of disks) {
        const candidates = groups.filter(g => g.ports.some(p =>
            p.mountpoints?.some(m => normal(m) === normal(disk.mountpoint)) ||
            (disk.device && p.diskDevices?.some(d => normal(d) === normal(disk.device!)))));
        if (candidates.length === 1) {
            const group = candidates[0]; group.disks.push(disk);
            if (!/^E[67]-RCU$/.test(group.label)) group.label = controllerLabel(disk.description);
        } else {
            groups.push({ key: 'disk:' + normal(disk.mountpoint), label: controllerLabel(disk.description), disks: [disk], ports: [] });
        }
    }
    return groups;
}
