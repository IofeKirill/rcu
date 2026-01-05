import * as vscode from 'vscode';
import { DeviceTreeItem } from './DeviceTreeItem';
import * as drivelist from 'drivelist';

export class DeviceTreeProvider implements vscode.TreeDataProvider<DeviceTreeItem> {
    public devices: DeviceTreeItem[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<DeviceTreeItem | undefined | null | void> = new vscode.EventEmitter<DeviceTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DeviceTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private selectedDevice: DeviceTreeItem | null = null
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DeviceTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label);
        treeItem.tooltip = element.label;
    
        // Если элемент — это команда "Обнаружить устройства"
        if (element.label === 'Поиск робота') {
            treeItem.command = {
                command: 'extension.detectDevices',
                title: 'Поиск робота'
            };
        }
    
        // Если элемент — это команда "Загрузить файл на робота"
        if (element.label === 'Загрузить файл на робота') {
            treeItem.command = {
                command: 'extension.uploadFile',
                title: 'Загрузить файл на устройство'
            };
        }
    
        return treeItem;
    }

    getChildren(element?: DeviceTreeItem): Thenable<DeviceTreeItem[]> {
        if (!element) {
            const children = [...this.devices];
    
            // Добавляем команду "Поиск робота"
            children.push(new DeviceTreeItem('Поиск робота', '', true));
    
            return Promise.resolve(children);
        } else {
            return Promise.resolve([]);
        }
    }

    async detectDevices() {
        this.devices = [];  // Очищаем массив устройств перед добавлением новых данных

        const drives = await drivelist.list();
        console.log('Обнаруженные устройства:', drives);

        const uniqueDevices = new Set<string>();

        this.devices = drives
            .filter(d => d.isUSB && d.mountpoints.length > 0)
            .filter(d => {
                const mountpoint = d.mountpoints[0].path;
                if (uniqueDevices.has(mountpoint)) {
                    return false;
                } else {
                    uniqueDevices.add(mountpoint);
                    return true;
                }
            })
            .map((d) => {
                // Проверяем, является ли устройство ZMROBO по описанию
                const isZmrobo = d.description.includes('Joinmax microSD Flash USB Device');
    
                // Создаём объект с пользовательским названием
                return new DeviceTreeItem(
                    isZmrobo ? 'ZMROBO' : d.description, // Если ZMROBO, используем это имя
                    d.mountpoints[0].path,
                    false
                );
            });
    
        this.refresh();
    }
    selectDevice(device: DeviceTreeItem) {
        this.selectedDevice = device;
        this.devices.forEach(d => d.isSelected = false);  // Сбрасываем выделение всех устройств
        device.isSelected = true;  // Выделяем текущее устройство
        console.log(`Выбрано устройство: ${device.label}, точка монтирования: ${device.mountpoint}`);
        this.refresh();  // Обновляем дерево для отображения текущего выбора
}

    getSelectedDevice(): DeviceTreeItem | undefined {
        return this.selectedDevice;  // Возвращаем текущее выбранное устройство
    }
}

