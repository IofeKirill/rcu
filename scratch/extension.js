'use strict';
const vscode = require('vscode'), path = require('node:path'), fs = require('node:fs'), { randomBytes } = require('node:crypto');
const catalog = require('./media/catalog.json'), { generate } = require('./media/core');
const VIEW = 'zmrobo.blocks';
function defaultProject() {
    return { format: 'zmrobo-blocks', version: 1, controller: 'E6', workspace: { xml: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="rc_start" x="45" y="55"><field name="TASK">1</field></block></xml>' } };
}
function validateProject(p) {
    if (!p || p.format !== 'zmrobo-blocks' || p.version !== 1 || !['E6', 'M6', 'E7'].includes(p.controller) || !p.workspace || typeof p.workspace !== 'object' || JSON.stringify(p).length > 2000000)
        throw Error('Некорректный проект ZMROBO Блоки (не больше 2 МБ).');
    return p;
}
function activate(context) {
    let active;
    const panels = new Map();
    async function hideSidebar() {
        try { await vscode.commands.executeCommand('workbench.action.closeSidebar'); }
        catch { /* A layout command must not prevent opening a program. */ }
    }
    const open = uri => vscode.commands.executeCommand('vscode.openWith', uri, VIEW);
    const initialUri = () => vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || require('node:os').homedir(), 'project.zmblocks'));
    async function create() {
        const uri = await vscode.window.showSaveDialog({ defaultUri: initialUri(), filters: { 'ZMROBO Блоки': ['zmblocks'] } });
        if (!uri)
            return;
        await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(defaultProject(), null, 2) + '\n'));
        await open(uri);
    }
    async function choose() {
        const [uri] = await vscode.window.showOpenDialog({ filters: { 'ZMROBO Блоки': ['zmblocks'] }, canSelectMany: false }) || [];
        if (uri)
            await open(uri);
    }
    const provider = { async resolveCustomTextEditor(document, panel) {
            panels.set(document.uri.toString(), panel);
            active = panel;
            const media = vscode.Uri.file(path.join(__dirname, 'media'));
            const nonce = randomBytes(20).toString('hex');
            panel.webview.options = { enableScripts: true, localResourceRoots: [media] };
            let lastWritten, queue = Promise.resolve(), disposed = false;
            const post = m => !disposed && panel.webview.postMessage(m);
            async function postConnection(){
                try{const state=await vscode.commands.executeCommand('extension.getBlockConnectionState');post({kind:'connectionStatus',state:state||{connected:false}});}
                catch{post({kind:'connectionStatus',state:{connected:false}});}
            }
            const connectionTimer=setInterval(()=>{if(panel.active&&!disposed)void postConnection();},3000);
            connectionTimer.unref?.();
            function load() {
                try {
                    post({ kind: 'load', project: validateProject(JSON.parse(document.getText())) });
                }
                catch (e) {
                    post({ kind: 'error', fatal: true, text: e.message });
                }
            }
            async function update(p) {
                const text = JSON.stringify(validateProject(p), null, 2) + '\n';
                if (text === document.getText())
                    return;
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
                lastWritten = text;
                if (!await vscode.workspace.applyEdit(edit))
                    throw Error('Не удалось обновить проект.');
            }
            const changed = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() === document.uri.toString()) {
                    if (document.getText() === lastWritten) {
                        return;
                    }
                    load();
                }
            });
            panel.onDidChangeViewState(() => {
                if (panel.active) {
                    active = panel;
                    void hideSidebar();
                    void postConnection();
                }
            });
            const listener = panel.webview.onDidReceiveMessage(msg => {
                queue = queue.then(async () => {
                    if (disposed)
                        return;
                    if (msg.kind === 'ready') {
                        load();
                        await postConnection();
                        return;
                    }
                    if (['connect','disconnect','connectionStatus'].includes(msg.kind)) {
                        if(msg.kind==='connectionStatus'){await postConnection();return;}
                        try{
                            let state;
                            if(msg.kind==='connect'){
                                if(!['usb','bluetooth'].includes(msg.transport)||!['E6','M6','E7'].includes(msg.controller))throw Error('Некорректное подключение.');
                                state=await vscode.commands.executeCommand('extension.chooseBlockConnection',{transport:msg.transport,controller:msg.controller});
                            }else state=await vscode.commands.executeCommand('extension.disconnectBlockConnection');
                            post({kind:'connectionResult',state:state||{connected:false},operation:msg.kind});
                        }catch(e){post({kind:'connectionResult',error:e.message||String(e),operation:msg.kind});await postConnection();}
                        return;
                    }
                    if (msg.kind === 'change') {
                        await update(msg.project);
                        return;
                    }
                    if (!['new', 'open', 'save', 'saveAs', 'export', 'python', 'simulate', 'upload', 'play', 'stop'].includes(msg.kind))
                        return;
                    if (msg.project)
                        await update(msg.project);
                    let text = 'Готово';
                    if (msg.kind === 'new')
                        await create();
                    else if (msg.kind === 'open')
                        await choose();
                    else if (msg.kind === 'save') {
                        if (!await document.save())
                            throw Error('Проект не сохранён.');
                        text = 'Проект сохранён';
                    }
                    else if (msg.kind === 'saveAs') {
                        const uri = await vscode.window.showSaveDialog({ defaultUri: document.uri, filters: { 'ZMROBO Блоки': ['zmblocks'] } });
                        if (uri) {
                            if (uri.toString() === document.uri.toString())
                                await document.save();
                            else {
                                await vscode.workspace.fs.writeFile(uri, Buffer.from(document.getText()));
                                await open(uri);
                            }
                            text = 'Копия проекта сохранена';
                        }
                    }
                    else if (msg.kind === 'stop') {
                        await vscode.commands.executeCommand('zmrobo2d.stopSource');
                        await vscode.commands.executeCommand('extension.stopProgram');
                        text = 'Отправлена команда остановки';
                    }
                    else {
                        const p = validateProject(msg.project);
                        if (msg.ast?.controller !== p.controller)
                            throw Error('Контроллер программы не совпадает с проектом.');
                        const result = generate(msg.ast, catalog);
                        const filename = path.join(path.dirname(document.uri.fsPath), path.basename(document.uri.fsPath).replace(/\.zmblocks$/i, '') + '.py');
                        const snapshot = { filename, name: path.basename(filename), source: result.source, controller: p.controller };
                        if (msg.kind === 'python') {
                            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'python', content: result.source }));
                            text = 'Python открыт для просмотра';
                        }
                        else if (msg.kind === 'export') {
                            const uri = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(filename), filters: { Python: ['py'] } });
                            if (uri) {
                                await vscode.workspace.fs.writeFile(uri, Buffer.from(result.source));
                                text = 'Python сохранён';
                            }
                        }
                        else {
                            if (!vscode.workspace.isTrusted)
                                throw Error('Для запуска и загрузки открой доверенную папку.');
                            if (msg.kind === 'simulate') {
                                if (result.unsupported.length)
                                    throw Error('Симулятор пока не поддерживает: ' + result.unsupported.join(', ') + '. Эти блоки можно использовать на настоящем роботе.');
                                await vscode.commands.executeCommand('zmrobo2d.setSource', snapshot);
                                text = 'Симулятор открыт. Для запуска нажми ▶ в его окне';
                            }
                            else {
                                await vscode.commands.executeCommand(msg.kind === 'upload' ? 'extension.uploadProgram' : 'extension.playProgram', snapshot);
                                text = msg.kind === 'upload' ? 'Программа загружена' : 'Программа запущена на роботе';
                            }
                        }
                    }
                    post({ kind: 'result', text });
                }).catch(e => { post({ kind: 'result', error: e.message || String(e) }); });
            });
            panel.onDidDispose(() => {
                disposed = true;
                clearInterval(connectionTimer);
                changed.dispose();
                listener.dispose();
                panels.delete(document.uri.toString());
                if (active === panel)
                    active = undefined;
            });
            panel.webview.html = fs.readFileSync(path.join(__dirname, 'media/index.html'), 'utf8').replaceAll('{{base}}', panel.webview.asWebviewUri(media).toString()).replaceAll('{{source}}', panel.webview.cspSource).replaceAll('{{nonce}}', nonce);
            if (panel.active) await hideSidebar();
        } };
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(VIEW, provider, { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: false }), vscode.commands.registerCommand('zmroboBlocks.new', create), vscode.commands.registerCommand('zmroboBlocks.open', choose), vscode.commands.registerCommand('zmroboBlocks.upload', () => active?.webview.postMessage({ kind: 'action', action: 'upload' })));
}
module.exports = { activate, defaultProject, validateProject };
