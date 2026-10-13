import { PortRow } from './PortSettings';
import { escapeHtml, nonce } from './WebviewUtils';

export function getPortConfigurationHtml(rows: PortRow[], fileName: string, cspSource: string): string {
    const token = nonce();
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${token}'; script-src 'nonce-${token}';">
<style nonce="${token}">body{font-family:var(--vscode-font-family);color:var(--vscode-editor-foreground);background:var(--vscode-editor-background);padding:16px}main{max-width:600px;margin:auto}table{width:100%;border-collapse:collapse}td,th{padding:6px;text-align:left;border-bottom:1px solid var(--vscode-panel-border)}input{box-sizing:border-box;width:100%;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,transparent);padding:6px}button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:0;padding:8px 14px;margin:12px 8px 0 0}#error{color:var(--vscode-errorForeground);white-space:pre-wrap}</style></head>
<body><main><h1>Настройка портов</h1><p>Файл: <strong>${escapeHtml(fileName)}</strong></p><p>Имена устройств вводите заглавными латинскими буквами, например MOTOR_LEFT или SENSOR_FRONT.</p><form id="ports"><table><thead><tr><th>Порт</th><th>Имена устройств</th></tr></thead><tbody>
${rows.map(row => `<tr><td>${row.kind === 'Motor' ? 'Мотор' : 'Датчик'} ${row.port}</td><td><input aria-label="${row.kind} ${row.port}" data-kind="${row.kind}" data-port="${row.port}" value="${escapeHtml(row.names)}" autocomplete="off"></td></tr>`).join('')}
</tbody></table><p id="error" role="alert"></p><button id="save" type="submit">Сохранить</button><button id="cancel" type="button">Отмена</button></form></main>
<script nonce="${token}">const vscode=acquireVsCodeApi();const form=document.getElementById('ports');const save=document.getElementById('save');
form.addEventListener('submit',event=>{event.preventDefault();save.disabled=true;document.getElementById('error').textContent='';const rows=Array.from(document.querySelectorAll('input')).map(input=>({kind:input.dataset.kind,port:Number(input.dataset.port),names:input.value}));vscode.postMessage({command:'savePorts',rows});});
document.getElementById('cancel').addEventListener('click',()=>vscode.postMessage({command:'close'}));
window.addEventListener('message',event=>{if(event.data.command==='error'){save.disabled=false;document.getElementById('error').textContent=event.data.message;}});</script></body></html>`;
}
