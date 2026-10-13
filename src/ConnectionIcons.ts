import * as path from 'path';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export function connectionIcon(status: ConnectionStatus): { light: string; dark: string } {
    const color = status === 'connected' ? 'green' : status === 'connecting' ? 'yellow' : 'red';
    const file = path.join(__dirname, '..', 'media', 'connection-' + color + '.svg');
    return { light: file, dark: file };
}
