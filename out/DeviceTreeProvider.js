"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceTreeProvider = void 0;
const vscode = require("vscode");
const DeviceTreeItem_1 = require("./DeviceTreeItem");
const drivelist = require("drivelist");
class DeviceTreeProvider {
    constructor() {
        this.devices = [];
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.selectedDevice = null;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
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
    getChildren(element) {
        if (!element) {
            const children = [...this.devices];
            // Добавляем команду "Поиск робота"
            children.push(new DeviceTreeItem_1.DeviceTreeItem('Поиск робота', '', true));
            return Promise.resolve(children);
        }
        else {
            return Promise.resolve([]);
        }
    }
    detectDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            this.devices = []; // Очищаем массив устройств перед добавлением новых данных
            const drives = yield drivelist.list();
            console.log('Обнаруженные устройства:', drives);
            const uniqueDevices = new Set();
            this.devices = drives
                .filter(d => d.isUSB && d.mountpoints.length > 0)
                .filter(d => {
                const mountpoint = d.mountpoints[0].path;
                if (uniqueDevices.has(mountpoint)) {
                    return false;
                }
                else {
                    uniqueDevices.add(mountpoint);
                    return true;
                }
            })
                .map((d) => {
                // Проверяем, является ли устройство ZMROBO по описанию
                const isZmrobo = d.description.includes('Joinmax microSD Flash USB Device');
                // Создаём объект с пользовательским названием
                return new DeviceTreeItem_1.DeviceTreeItem(isZmrobo ? 'ZMROBO' : d.description, // Если ZMROBO, используем это имя
                d.mountpoints[0].path, false);
            });
            this.refresh();
        });
    }
    selectDevice(device) {
        this.selectedDevice = device;
        this.devices.forEach(d => d.isSelected = false); // Сбрасываем выделение всех устройств
        device.isSelected = true; // Выделяем текущее устройство
        console.log(`Выбрано устройство: ${device.label}, точка монтирования: ${device.mountpoint}`);
        this.refresh(); // Обновляем дерево для отображения текущего выбора
    }
    getSelectedDevice() {
        return this.selectedDevice; // Возвращаем текущее выбранное устройство
    }
}
exports.DeviceTreeProvider = DeviceTreeProvider;
//# sourceMappingURL=DeviceTreeProvider.js.map