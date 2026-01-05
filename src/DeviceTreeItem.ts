import * as vscode from 'vscode';

export class DeviceTreeItem extends vscode.TreeItem {
    public isSelected: boolean;  

    constructor(
        public readonly label: string,
        public readonly mountpoint: string,
        isSelected: boolean,
        public readonly isUSB?: boolean
    ) {
        super(label, isSelected ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.isSelected = isSelected;
        this.contextValue = 'device';
        this.iconPath = new vscode.ThemeIcon(isSelected ? 'circle-filled' : 'circle-outline');
    }
    
    
}