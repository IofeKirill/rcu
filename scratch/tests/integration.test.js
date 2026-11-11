'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), Module = require('node:module'), path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const ROOT = path.resolve(__dirname, '../..');
function withVscode(mock, load) {
    const original = Module._load;
    Module._load = function (id, ...args) { return id === 'vscode' ? mock : original.call(this, id, ...args); };
    try {
        return load();
    }
    finally {
        Module._load = original;
    }
}
const disposable = { dispose() { } };
test('USB upload writes the explicit snapshot, independent of the active editor', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zm-usb-'));
    try {
        const mock = { window: { activeTextEditor: { document: { getText: () => { throw Error('Must not read active editor'); } } }, showInformationMessage() { } }, workspace: {} };
        const { uploadProgramSnapshot } = withVscode(mock, () => require('../../out/FileOperations'));
        const device = { mountpoint: dir, label: 'Fake robot' }, devices = { getSelectedDevice: () => device };
        await uploadProgramSnapshot(devices, ROOT, { name: 'blocks.py', source: 'print("snapshot")\n' });
        assert.equal(fs.readFileSync(path.join(dir, 'blocks.py'), 'utf8'), 'print("snapshot")\n');
        await assert.rejects(() => uploadProgramSnapshot(devices, ROOT, { name: '../escape.py', source: 'pass' }));
    }
    finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
test('generated source reaches the real multi_runner through the simulator command', { timeout: 20000 }, async () => {
    const commands = new Map(), messages = [];
    let receiver, disposePanel, finish;
    let done = new Promise(resolve => { finish = resolve; });
    const uri = filename => ({ fsPath: filename, scheme: 'file', toString: () => filename });
    const scene = { floor: Buffer.alloc(800 * 500 * 3, 255).toString('base64'), robots: [{ id: 'r1', name: 'Robot', model: 'E6', start: [100, 120, 0], bodySize: 18, wheelDiameter: 56, motorType: 'standard', wheels: [1, 3], reversed: [false, false], sensors: {}, cells: {}, claw: null }], regions: [], props: [], propIds: [], walls: [], segments: [], circles: [], shapes: [], task: null };
    const webview = { cspSource: 'test:', asWebviewUri: u => u, onDidReceiveMessage: f => (receiver = f, disposable), postMessage: m => {
            messages.push(m);
            if (m.kind === 'externalProgram') queueMicrotask(()=>receiver({kind:'bindExternalProgram',requestId:m.requestId,robot:'r1'}));
            if (m.kind === 'externalRun')
                queueMicrotask(() => receiver({ kind: 'run', scene, rate: 8, training: true, externalRequestId: m.requestId, robot: 'r1' }));
            if (m.kind === 'finished' || m.kind === 'stopped')
                finish();
            return Promise.resolve(true);
        } };
    Object.defineProperty(webview, 'html', { set() { queueMicrotask(() => receiver({ kind: 'ready' })); } });
    const panel = { webview, viewColumn: 1, reveal() { }, onDidDispose: f => (disposePanel = f, disposable) };
    const mock = { Uri: { file: uri, joinPath: (u, ...p) => uri(path.join(u.fsPath, ...p)) }, ViewColumn: { Active: 1 }, extensions: { getExtension: () => undefined },
        workspace: { isTrusted: true, workspaceFolders: [{ uri: uri(ROOT) }], getConfiguration: () => ({ get: () => undefined }), fs: { readFile: u => fs.promises.readFile(u.fsPath) } },
        window: { activeTextEditor: { document: { languageId: 'python', uri: uri(path.join(ROOT, 'wrong.py')), fileName: 'wrong.py', getText: () => { throw Error('Wrong source selected'); } } }, onDidChangeActiveTextEditor: () => disposable, createWebviewPanel: () => panel },
        commands: { registerCommand: (id, fn) => (commands.set(id, fn), disposable), executeCommand: (id, ...args) => commands.get(id)(...args) } };
    const sim = withVscode(mock, () => require('../../simulator/extension'));
    const context = { extensionPath: ROOT, subscriptions: [] };
    sim.activate(context);
    const source = fs.readFileSync(path.join(ROOT, 'scratch/examples/01_Forward.py'), 'utf8').replace('SetWaitForTime(1)', 'SetWaitForTime(0.06)');
    await commands.get('zmrobo2d.setSource')({ filename: path.join(ROOT, 'scratch/examples/generated-test.py'), name: 'blocks.py', source });
    assert.ok(messages.some(m=>m.kind==='externalProgram'));
    assert.equal(messages.filter(m=>m.kind==='started').length,0,'opening the simulator must not start Python');
    await receiver({kind:'run',scene,rate:8,training:true});
    await done;
    assert.equal(messages.filter(m => m.kind === 'error').length, 0, JSON.stringify(messages.filter(m => m.kind === 'error')));
    assert.ok(messages.some(m => m.kind === 'started'));
    assert.ok(messages.some(m => m.kind === 'state' && m.robots));
    // Repeating from the model must use the last block snapshot, not the old editor.
    done = new Promise(resolve => { finish = resolve; });
    await receiver({ kind: 'run', scene, rate: 8, training: true });
    await done;
    assert.equal(messages.filter(m => m.kind === 'started').length, 2);
    assert.equal(messages.filter(m => m.kind === 'error').length, 0);
    done = new Promise(resolve => { finish = resolve; });
    const timerSource = fs.readFileSync(path.join(ROOT, 'scratch/examples/04_Timer.py'), 'utf8').replace('> 1000', '> 60');
    await commands.get('zmrobo2d.runSource')({ filename: path.join(ROOT, 'scratch/examples/timer-test.py'), name: 'timer.py', source: timerSource });
    await done;
    assert.equal(messages.filter(m => m.kind === 'error').length, 0);
    disposePanel();
});
