"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupUsbDevices = exports.controllerLabel = void 0;
const normal = (value) => value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
function controllerLabel(description) {
    if (/E7|MicroPy.*(?:FS|Card)/i.test(description))
        return 'E7-RCU';
    if (/E6|Joinmax|ZMROBO/i.test(description))
        return 'E6-RCU';
    return description || 'USB-контроллер';
}
exports.controllerLabel = controllerLabel;
// Only verified Windows USB ancestry can join disk and COM interfaces. Enumeration order is irrelevant.
function groupUsbDevices(disks, ports) {
    const groups = [];
    for (const port of ports) {
        const key = port.physicalId ? 'physical:' + port.physicalId.toUpperCase() : 'com:' + port.address;
        let group = groups.find(g => g.key === key);
        if (!group) {
            group = { key, label: controllerLabel(port.name), ports: [], disks: [] };
            groups.push(group);
        }
        if (!group.ports.some(p => p.address === port.address))
            group.ports.push(port);
    }
    for (const disk of disks) {
        const candidates = groups.filter(g => g.ports.some(p => {
            var _a, _b;
            return ((_a = p.mountpoints) === null || _a === void 0 ? void 0 : _a.some(m => normal(m) === normal(disk.mountpoint))) ||
                (disk.device && ((_b = p.diskDevices) === null || _b === void 0 ? void 0 : _b.some(d => normal(d) === normal(disk.device))));
        }));
        if (candidates.length === 1) {
            const group = candidates[0];
            group.disks.push(disk);
            if (!/^E[67]-RCU$/.test(group.label))
                group.label = controllerLabel(disk.description);
        }
        else {
            groups.push({ key: 'disk:' + normal(disk.mountpoint), label: controllerLabel(disk.description), disks: [disk], ports: [] });
        }
    }
    return groups;
}
exports.groupUsbDevices = groupUsbDevices;
//# sourceMappingURL=UsbDevices.js.map