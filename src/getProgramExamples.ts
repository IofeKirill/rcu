import * as fs from 'fs';
import * as path from 'path';
import { COMMANDS } from './CommandCatalog';
import { escapeHtml } from './WebviewUtils';

export function getProgramExamples(commandId: string, extensionPath: string, label?: string, controller?: string): string {
    const definition = COMMANDS[commandId];
    const title = escapeHtml(label || definition?.label || commandId);
    const filePath = path.join(extensionPath, 'commands-info.html');
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        // Sections have unique div IDs and contain no nested divs.
        const escapedId = commandId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp('<div\\s+id="' + escapedId + '"[^>]*>([\\s\\S]*?)</div>'));
        const isH = controller === 'H-RCU';
        const content = match ? match[1] : `<h1>${title}</h1><p>${isH ? 'Подробная справка для H не заполнена.' : 'Подробная справка для этой команды пока не заполнена.'}</p>${definition ? '<pre><code>' + escapeHtml(definition.snippet.replace(/\$\{\d+\|([^}]+)\|\}/g, (_match, choices: string) => choices.split(',')[0]).replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\d+/g, '')) + '</code></pre>' : ''}`;
        const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><title>${title}</title><style>${style}</style></head><body>${content}</body></html>`;
    } catch (error) {
        return `<!DOCTYPE html><html lang="ru"><meta charset="UTF-8"><body><h1>${title}</h1><p>Не удалось прочитать справку: ${escapeHtml(error instanceof Error ? error.message : String(error))}</p></body></html>`;
    }
}
