import * as vscode from 'vscode';
export interface BlockConnectionChoice { label: string; description?: string; device: unknown; }
export interface BlockConnectionState { transport: 'usb'|'bluetooth'; connected: boolean; name: string; address?: string; canRun: boolean; busy?: boolean; }
export interface BlockConnectionServices {
    state(): BlockConnectionState;
    busy(): boolean;
    scan(transport: 'usb'|'bluetooth'): Promise<BlockConnectionChoice[]>;
    connect(transport: 'usb'|'bluetooth', device: unknown): Promise<void>;
    disconnect(transport: 'usb'|'bluetooth'): Promise<void>;
    controller(controller: 'E6'|'M6'|'E7'): Promise<void>;
}
export function registerBlockConnections(context: vscode.ExtensionContext, services: BlockConnectionServices): void {
    let pending=false;
    const state=():BlockConnectionState=>({...services.state(),busy:pending||services.busy()});
    const guard=():void=>{if(pending||services.busy())throw new Error('Дождись завершения текущей операции с роботом.');};
    context.subscriptions.push(vscode.commands.registerCommand('extension.getBlockConnectionState',state),
        vscode.commands.registerCommand('extension.chooseBlockConnection',async(request:{transport:string;controller:string})=>{
            if(!vscode.workspace.isTrusted)throw new Error('Открой доверенную папку для подключения к роботу.');
            if(!request||!['usb','bluetooth'].includes(request.transport)||!['E6','M6','E7'].includes(request.controller))throw new Error('Некорректные параметры подключения.');
            guard();pending=true;
            try {
                const transport=request.transport as 'usb'|'bluetooth';
                const choices=await services.scan(transport);
                if(!choices.length)throw new Error(transport==='usb'?'USB-контроллеры не найдены. Подключи кабель и включи робота.':'Bluetooth-контроллеры не найдены. Включи робота и повтори поиск.');
                const choice=await vscode.window.showQuickPick(choices,{placeHolder:transport==='usb'?'Выбери контроллер USB':'Выбери контроллер Bluetooth',ignoreFocusOut:true});
                if(choice){await services.controller(request.controller as 'E6'|'M6'|'E7');await services.connect(transport,choice.device);}
            } finally {pending=false;}
            return state();
        }),vscode.commands.registerCommand('extension.disconnectBlockConnection',async()=>{
            guard();pending=true;
            try{await services.disconnect(services.state().transport);}finally{pending=false;}
            return state();
        }));
}
