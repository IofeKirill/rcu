'use strict';
const $ = id => document.getElementById(id), catalog = globalThis.ZM_CATALOG, reference = globalThis.RC_REFERENCE;
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
RoboBlocks.register(Blockly, reference, catalog);
const media = new URL('vendor/robocode-media/', document.querySelector('link[rel=stylesheet]').href).href;
const workspace = Blockly.inject('workspace', { toolbox: RoboBlocks.toolbox('E6'), media, trashcan: false, scrollbars: true, sounds: false, grid: { spacing: 40, length: 40, colour: '#dce0fa', snap: false }, zoom: { controls: true, wheel: true, startScale: .8, maxScale: 1.6, minScale: .35, scaleSpeed: 1.1 } });
const layout = RoboLayout(workspace, Blockly, vscode);
const navigation = RoboNavigation(workspace,Blockly);
let editingProcedure = null;
let controller = 'E6', loading = false, loadError = false, timer, pending = 0, lastResult;
const actionButtons = ['simulate', 'upload', 'play', 'python', 'export'];
const status = (text, error = false) => { $('status').textContent = text; $('status').classList.toggle('error', error); };
const connections=RoboConnections(vscode,()=>controller,status);
function project() { return { format: 'zmrobo-blocks', version: 1, controller, workspace: { xml: Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)) } }; }
function compile() { const ast = RoboBlocks.workspaceToProgram(workspace, controller); return { ast, ...ZmPython.generate(ast, catalog) }; }
function render() { try {
    lastResult = compile();
    RoboPythonHighlight.render($('code'),lastResult.source);
    const unsupported = lastResult.unsupported;
    $('compatibility').textContent = unsupported.length ? 'В модели пока недоступны: ' + unsupported.join(', ') : '';
    if (lastResult.raw)
        $('compatibility').textContent += ' Строки Python проверяются при выполнении.';
    for (const id of actionButtons)
        $(id).disabled = !!pending;
    status('Готово');
}
catch (e) {
    lastResult = null;
    $('code').textContent = '';
    $('compatibility').textContent = '';
    for (const id of actionButtons)
        $(id).disabled = true;
    status(e.message, true);
    return e;
} }
function changed() { if (loading || loadError)
    return; render(); if (vscode)
    vscode.postMessage({ kind: 'change', project: project() });
else {
    clearTimeout(timer);
    timer = setTimeout(() => { try {
        localStorage.setItem('zmrobo-robocode-project', JSON.stringify(project()));
    }
    catch { } }, 200);
} }
function load(p) { if (!['E6','M6','E7'].includes(p?.controller)) throw Error('В блоках доступны контроллеры E6, M6 и E7.'); if (p?.format !== 'zmrobo-blocks' || p.version !== 1 || !p.workspace)
    throw Error('Неверный файл проекта.'); let migrated = false; if (!p.workspace.xml) {
    p = RoboMigrate(p, reference, catalog);
    migrated = true;
} if (JSON.stringify(p) === JSON.stringify(project())) return; const previous = project(); clearTimeout(timer); loading = true; Blockly.Events.disable(); try {
    workspace.clear();
    controller = p.controller;
    $('controller').value = controller;
    workspace.updateToolbox(RoboBlocks.toolbox(controller));
    RoboBlocks.loadXml(Blockly.Xml.textToDom(p.workspace.xml), workspace);
    workspace.clearUndo();
    RoboBlocks.updatePorts(workspace, controller);
    layout.apply();
    for (const block of workspace.getAllBlocks())
        if (block.type === 'rc_start')
            block.setFieldValue(controller + 'RCU', 'DEVICE');
}
catch (e) {
    workspace.clear();
    controller = previous.controller;
    $('controller').value = controller;
    workspace.updateToolbox(RoboBlocks.toolbox(controller));
    RoboBlocks.loadXml(Blockly.Xml.textToDom(previous.workspace.xml), workspace);
    throw e;
}
finally {
    Blockly.Events.enable();
    loading = false;
} loadError = false; $('save').disabled = $('saveAs').disabled = false; render(); if (migrated) {
    changed();
    status('Проект переведён в вид RoboCode. Сохрани изменения.');
} }
function promptDialog(message, value, callback, confirm = false) { const d = $('prompt'); $('promptLabel').textContent = message; $('promptValue').value = value || ''; $('promptValue').hidden = confirm; d.onclose = () => callback(confirm ? d.returnValue === 'ok' : d.returnValue === 'ok' ? $('promptValue').value : null); d.returnValue = 'cancel'; d.showModal(); if (!confirm)
    $('promptValue').focus(); }
Blockly.prompt = (message, value, callback) => promptDialog(message, value, callback);
Blockly.confirm = (message, callback) => promptDialog(message, '', callback, true);
Blockly.alert = (message, callback) => promptDialog(message, '', () => callback?.(), true);
function newVariable(type) { promptDialog(type === 'list' ? 'Имя списка:' : 'Имя переменной:', '', name => { if (name === null)
    return; if (!ZmPython.identifier(name)) {
    status('Имя должно быть допустимым именем Python без пробелов.', true);
    return;
} if (workspace.getAllVariables().some(v => v.name === name)) {
    status('Такое имя уже существует.', true);
    return;
} workspace.createVariable(name, type); RoboBlocks.refresh(workspace); changed(); }); }
function createProcedure(mutation, callback) { if (!mutation?.getAttribute)
    mutation = null; editingProcedure = mutation ? { mutation, callback } : null; $('procedureError').textContent = ''; $('procedureName').value = mutation ? mutation.getAttribute('proccode').replace(/\s*%[snb]/g, '').trim() : 'MyFunction'; $('procedureArgs').value = mutation ? JSON.parse(mutation.getAttribute('argumentnames') || '[]').join(', ') : ''; $('procedureReturns').checked = mutation ? RoboBlocks.returnsValue(Blockly.Procedures.getDefineBlock(mutation.getAttribute('proccode'),workspace)) : false; $('procedureDialog').showModal(); $('procedureName').focus(); }
$('procedureCancel').onclick = () => $('procedureDialog').close();
$('procedureCreate').onclick = () => {
    const name = $('procedureName').value.trim(), args = $('procedureArgs').value.split(',').map(x => x.trim()).filter(Boolean), all = [name, ...args];
    if (all.some(x => !ZmPython.identifier(x)) || new Set(all).size !== all.length || all.some(x => workspace.getAllVariables().some(v => v.name === x))) {
        $('procedureError').textContent = 'Проверь имена: без пробелов, повторов и совпадений с переменными.';
        return;
    }
    const existing = workspace.getTopBlocks(false).filter(b => b.type === 'rc_function').map(b => b.getInputTargetBlock('custom_block')?.mutationToDom().getAttribute('proccode').replace(/\s*%[snb]/g, '').trim());
    if (existing.includes(name) && (!editingProcedure || editingProcedure.mutation.getAttribute('proccode').replace(/\s*%[snb]/g, '').trim() !== name)) {
        $('procedureError').textContent = 'Блок с таким именем уже есть.';
        return;
    }
    if (editingProcedure) {
        const xml = Blockly.Xml.textToDom('<xml>' + RoboBlocks.procedureXml(name, args) + '</xml>'), mutation = xml.querySelector('mutation'), oldNames = JSON.parse(editingProcedure.mutation.getAttribute('argumentnames') || '[]'), oldIds = JSON.parse(editingProcedure.mutation.getAttribute('argumentids') || '[]');
        const newIds = args.map((_, i) => oldIds[i] || 'arg_' + i + '_' + name);
        mutation.setAttribute('argumentids', JSON.stringify(newIds));
        const oldCode = editingProcedure.mutation.getAttribute('proccode'), prototype = Blockly.Procedures.getPrototypeBlock(oldCode, workspace), def = prototype?.getParent();
        if (def)
            for (const b of def.getDescendants())
                if (b.type.startsWith('argument_reporter_')) {
                    const index = oldNames.indexOf(b.getFieldValue('VALUE'));
                    if (index >= 0 && args[index])
                        b.setFieldValue(args[index], 'VALUE');
                }
        if (def) RoboBlocks.setReturns(def,$('procedureReturns').checked);
        editingProcedure.callback(mutation);
        editingProcedure = null;
    }
    else {
        const xml=Blockly.Xml.textToDom('<xml>' + RoboBlocks.procedureXml(name, args) + '</xml>');
        const m=document.createElement('mutation');m.setAttribute('returns',String($('procedureReturns').checked));xml.firstChild.insertBefore(m,xml.firstChild.firstChild);
        if($('procedureReturns').checked){const body=Blockly.Xml.textToDom('<xml><statement name="BODY"><block type="rc_return"><value name="VALUE"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block></statement></xml>').firstChild;xml.firstChild.appendChild(body);}
        RoboBlocks.loadXml(xml, workspace);
    }
    $('procedureDialog').close();
    RoboBlocks.refresh(workspace);
    changed();
};
RoboBlocks.bind(workspace, { variable: newVariable, procedure: createProcedure });
workspace.addChangeListener(e => { if (e.type !== Blockly.Events.UI && e.type !== 'ui')
    changed(); });
new ResizeObserver(() => Blockly.svgResize(workspace)).observe($('workspace'));
$('controller').onchange = () => { controller = $('controller').value; workspace.updateToolbox(RoboBlocks.toolbox(controller)); for (const b of workspace.getAllBlocks())
    if (b.type === 'rc_start')
        b.setFieldValue(controller + 'RCU', 'DEVICE'); RoboBlocks.updatePorts(workspace,controller);layout.apply();changed(); };
$('fileMenuButton').onclick = () => $('fileMenu').hidden = !$('fileMenu').hidden;
document.addEventListener('click', e => { if (!e.target.closest('.fileMenu'))
    $('fileMenu').hidden = true; });
function action(kind) {
    $('fileMenu').hidden = true;
    if (loadError && !['new', 'open', 'openSimulator', 'stop'].includes(kind))
        return;
    clearTimeout(timer);
    let ast;
    if (actionButtons.includes(kind)) {
        const e = render();
        if (e) {
            if (e.blockId)
                workspace.getBlockById(e.blockId)?.select();
            return;
        }
        ast = compile().ast;
    }
    if (vscode) {
        pending++;
        actionButtons.forEach(id => $(id).disabled = true);
        status('Выполняется…');
        vscode.postMessage({ kind, project: loadError ? undefined : project(), ast });
        return;
    }
    if (kind === 'new') {
        promptDialog('Создать новый проект?', '', yes => { if (yes) {
            load(RoboBlocks.defaultProject(controller));
            changed();
        } }, true);
        return;
    }
    if (['save', 'saveAs', 'export'].includes(kind)) {
        const data = kind === 'export' ? lastResult.source : JSON.stringify(project(), null, 2), a = document.createElement('a'), url = URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
        a.href = url;
        a.download = kind === 'export' ? 'program.py' : 'project.zmblocks';
        a.click();
        URL.revokeObjectURL(url);
        status('Файл подготовлен');
        return;
    }
    if (kind === 'open') {
        const i = document.createElement('input');
        i.type = 'file';
        i.accept = '.zmblocks';
        i.onchange = async () => { try {
            load(JSON.parse(await i.files[0].text()));
            changed();
        }
        catch (e) {
            status(e.message, true);
        } };
        i.click();
        return;
    }
    status('Запуск и загрузка работают внутри расширения VS Code.');
}
for (const kind of ['new', 'open', 'save', 'saveAs', 'python', 'export', 'simulate', 'upload', 'play', 'stop'])
    $(kind).onclick = () => action(kind);
let fullscreen=false;
function fullscreenStatus(enabled){
    fullscreen=!!enabled;const button=$('toggleFullscreen');
    button.setAttribute('aria-pressed',String(fullscreen));
    button.setAttribute('aria-label',fullscreen?'Выйти из полного экрана':'На весь экран');
    button.title=fullscreen?'Вернуть окна VS Code · Esc':'На весь экран · Esc — выйти';
    button.querySelector('span').textContent=fullscreen?'Вернуть окна':'На весь экран';
}
function setFullscreen(enabled){
    if(vscode)vscode.postMessage({kind:'fullscreen',enabled});
    else if(enabled&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(e=>status(e.message,true));
    else if(!enabled&&document.exitFullscreen)document.exitFullscreen().catch(e=>status(e.message,true));
    else status('Полноэкранный режим доступен в расширении VS Code.');
}
$('toggleFullscreen').onclick=()=>setFullscreen(!fullscreen);
document.addEventListener('fullscreenchange',()=>fullscreenStatus(!!document.fullscreenElement));
document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&fullscreen&&!document.querySelector('dialog[open]')&&!Blockly.DropDownDiv.isVisible?.()&&!Blockly.WidgetDiv.isVisible?.()){
        e.preventDefault();e.stopImmediatePropagation();setFullscreen(false);
    }
},true);
// Handle block undo once, before native Blockly and the VS Code host see the key.
// HTML text editors keep the browser's own character-level undo.
document.addEventListener('keydown', e => {
    if(!(e.ctrlKey||e.metaKey)||!['z','y'].includes(e.key.toLowerCase()))return;
    if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(document.querySelector('dialog[open]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    Blockly.Events.fireNow_?.();
    workspace.undo(e.shiftKey||e.key.toLowerCase()==='y');
},true);
document.addEventListener('keydown', e => { if (e.key === 'F6' && !vscode) {
    e.preventDefault();
    action('upload');
}
else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    action(e.shiftKey ? 'saveAs' : 'save');
} });
function fatal(text) { loadError = true; clearTimeout(timer); for (const id of [...actionButtons, 'save', 'saveAs'])
    $(id).disabled = true; status(text, true); }
let deferredLoad;
function incoming(p) {
    if (workspace.isDragging?.()) { deferredLoad=p;return; }
    load(p);
}
workspace.addChangeListener(() => {if (deferredLoad && !workspace.isDragging?.()) {const p=deferredLoad;deferredLoad=null;try{load(p);}catch(e){fatal(e.message);}}});
window.addEventListener('message', ({ data: m }) => {
if(m.kind==='fullscreenStatus'){fullscreenStatus(m.enabled);return;}
if(m.kind==='compileRequest'){
    try{
        if(loadError)throw Error('Проект блоков не удалось открыть.');
        Blockly.Events.fireNow_?.();
        const result=compile();
        vscode?.postMessage({kind:'compileResult',requestId:m.requestId,project:project(),ast:result.ast});
    }catch(e){vscode?.postMessage({kind:'compileResult',requestId:m.requestId,error:e.message});}
    return;
}
if (m.kind === 'load') {
    try {
        incoming(m.project);
    }
    catch (e) {
        fatal(e.message);
    }
}
else if (m.kind === 'result') {
    pending = Math.max(0, pending - 1);
    render();
    status(m.error || m.text || 'Готово', !!m.error);
}
else if (m.kind === 'action')
    action(m.action);
else if (m.kind === 'error') {
    if (m.fatal)
        fatal(m.text);
    else
        status(m.text, true);
} });
load(RoboBlocks.defaultProject());
if (vscode)
    vscode.postMessage({ kind: 'ready' });
else {
    try {
        const data = localStorage.getItem('zmrobo-robocode-project');
        if (data)
            load(JSON.parse(data));
    }
    catch (e) {
        status(e.message, true);
    }
}
globalThis.RoboEditor = { layout, navigation, connections, workspace, project, compile, load, action, createProcedure, editProcedure: createProcedure };
