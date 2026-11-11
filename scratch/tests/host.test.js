'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), Module = require('node:module'), path = require('node:path'), fs = require('node:fs');
const ROOT = path.resolve(__dirname, '../..'), B = require('blockly'), Z = require('../media/blocks'), catalog = require('../media/catalog.json');
Z.register(B, catalog);
test('custom editor persists blocks and sends generated snapshots, never the active file', async () => {
    let provider, receive, onChange, lastResult, viewState;
    const commands = [], posts = [];
    let text = JSON.stringify({ format: 'zmrobo-blocks', version: 1, controller: 'E6', workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'zm_start' }] } } });
    const uri = { fsPath: path.join(ROOT, 'scratch/examples/project.zmblocks'), scheme: 'file', toString: () => '/project.zmblocks' };
    const document = { uri, getText: () => text, get lineCount() { return text.split('\n').length; }, save: async () => true };
    class Edit {
        replace(uri, range, value) { this.value = value; }
    }
    const d = { dispose() { } }, mock = { WorkspaceEdit: Edit, Range: class {
        }, Uri: { file: fsPath => ({ fsPath, toString: () => fsPath }) }, workspace: { isTrusted: true, applyEdit: async (e) => { text = e.value; onChange({ document }); return true; }, onDidChangeTextDocument: f => (onChange = f, d) }, window: { activeTextEditor: { document: { getText: () => { throw Error('Do not use active editor'); } } }, registerCustomEditorProvider: (_id, p) => (provider = p, d) }, commands: { registerCommand: () => d, executeCommand: async (id, p) => { commands.push({ id, p }); } } };
    const old = Module._load;
    Module._load = function (id, ...args) { return id === 'vscode' ? mock : old.call(this, id, ...args); };
    let extension;
    try {
        extension = require('../extension');
    }
    finally {
        Module._load = old;
    }
    extension.activate({ subscriptions: [] });
    const panel = { active: true, onDidChangeViewState: f => (viewState=f,d), onDidDispose: () => d, webview: { cspSource: 'test:', asWebviewUri: u => u, onDidReceiveMessage: f => (receive = f, d), postMessage: m => {
                posts.push(m);
                if (m.kind === 'result'||m.kind==='connectionResult')
                    lastResult?.(m);
                return Promise.resolve(true);
            } } };
    await provider.resolveCustomTextEditor(document, panel);
    assert.equal(commands[0].id,'workbench.action.closeSidebar');commands.length=0;
    panel.active=false;viewState();await Promise.resolve();assert.equal(commands.length,0);
    panel.active=true;viewState();await Promise.resolve();assert.ok(commands.some(c=>c.id==='workbench.action.closeSidebar'));commands.length=0;
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/v1/01_Forward.zmblocks'), 'utf8'));
    const ws = new B.Workspace();
    B.serialization.workspaces.load(project.workspace, ws);
    const ast = Z.workspaceToProgram(ws, catalog, 'E6');
    async function action(kind, p = project, a = ast) { const done = new Promise(resolve => lastResult = resolve); receive({ kind, project: p, ast: a }); return done; }
    let result = await action('upload');
    assert.equal(result.error, undefined);
    assert.equal(commands[0].id, 'extension.uploadProgram');
    assert.match(commands[0].p.source, /motor.SetMotor\(1, 50\)/);
    assert.equal(commands[0].p.name, 'project.py');
    assert.deepEqual(JSON.parse(text), project);
    result = await action('simulate');
    assert.equal(result.error, undefined);
    assert.equal(commands.at(-1).id, 'zmrobo2d.setSource');
    const loads = posts.filter(m=>m.kind==='load').length;
    onChange({document});onChange({document});
    assert.equal(posts.filter(m=>m.kind==='load').length,loads,'delayed self notifications must not reimport the blocks');
    const before = commands.length;
    mock.workspace.isTrusted = false;
    result = await action('play');
    assert.match(result.error, /доверенную/);
    assert.equal(commands.length, before);
    mock.workspace.isTrusted = true;
    const bad = { ...ast, body: [{ type: 'command', id: 'not.exists', args: [] }] };
    result = await action('upload', project, bad);
    assert.match(result.error, /недоступна/);
    assert.equal(commands.length, before);
    const changed = { ...project, controller: 'E7' };
    text = JSON.stringify(changed);
    onChange({ document });
    assert.equal(posts.at(-1).kind, 'load');
    assert.equal(posts.at(-1).project.controller, 'E7');
    const previousText=text;const connected=new Promise(resolve=>lastResult=resolve);receive({kind:'connect',transport:'usb',controller:'E7'});await connected;assert.equal(commands.at(-1).id,'extension.chooseBlockConnection');assert.deepEqual(commands.at(-1).p,{transport:'usb',controller:'E7'});assert.equal(text,previousText);
    ws.dispose();
});
