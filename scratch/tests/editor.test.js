'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const ref = require('../media/robocode-reference.json');
async function editor(settings={}) { const messages=[];let saved=settings.layout?{layout:settings.layout}:{}; const errors = [], c = new VirtualConsole(); c.on('jsdomError', e => errors.push(e.message + ' ' + (e.cause?.stack || ''))); const dom = await JSDOM.fromFile(path.resolve(__dirname, '../media/preview.html'), { resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: c, beforeParse(w) { if(settings.vscode)w.acquireVsCodeApi=()=>({postMessage:m=>messages.push(m),getState:()=>saved,setState:s=>saved=s}); w.ResizeObserver = class {
        observe() { }
        disconnect() { }
    }; w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 30 }); w.SVGElement.prototype.getComputedTextLength = () => 80; w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: s => ({ width: s.length * 8 }) }); w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; w.HTMLDialogElement.prototype.close = function (v) { this.returnValue = v; this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); }; Object.defineProperty(w, 'localStorage', { value: { getItem: key => key==='zmrobo-blocks-layout'&&settings.layout?JSON.stringify(settings.layout):null, setItem() { } } }); } }); await new Promise(r => dom.window.addEventListener('load', () => setTimeout(r, 100))); return { dom, w: dom.window, errors, messages };  }
test('original renderer shows precisely the reference categories and the timer', { timeout: 15000 }, async () => { const { dom, w, errors } = await editor(); try {
    assert.ok(w.RoboEditor);
    assert.equal(w.RoboEditor.compile().source, 'def task1():\n    pass\n\ntask1()\n');
    const categories = [...w.document.querySelectorAll('.scratchCategoryMenuItemLabel')].map(x => x.textContent);
    assert.deepEqual(categories, ref.groups.filter(g=>g.id!=='cameraE7').map(g => g.name));
    assert.ok(!categories.includes('Начало'));
    assert.ok(!categories.includes('Текст и вывод'));
    w.RoboEditor.workspace.getToolbox().setSelectedCategoryById('rcu');
    const fly = w.RoboEditor.workspace.getFlyout().getWorkspace();
    const types = fly.getAllBlocks().map(b => b.type);
    assert.ok(types.includes('rc_timer'));
    assert.ok(types.includes('rc_timer_reset'));
    const xml = '<xml><block type="rc_start"><next><block type="rc_timer_reset"><next><block type="rc_print"><value name="VALUE"><block type="rc_timer"/></value></block></next></block></next></block></xml>';
    w.RoboEditor.load({ format: 'zmrobo-blocks', version: 1, controller: 'E6', workspace: { xml } });
    const source = w.RoboEditor.compile().source;
    assert.match(source, /rcu.SetSysTime\(\)/);
    assert.match(source, /print\(rcu.GetSysTime\(\)\)/);
    const p = w.RoboEditor.project();
    w.RoboEditor.load(JSON.parse(JSON.stringify(p)));
    assert.equal(w.RoboEditor.compile().source, source);
    assert.deepEqual(errors, []);
}
finally {
    dom.window.close();
} });
test('all reference hardware blocks have native fields and generate verified calls', { timeout: 15000 }, async () => { const { dom, w, errors } = await editor(); try {
    for (const d of ref.blocks.filter(x => !x.separator)) {
        const block = w.RoboBlocks.blockXml(d);
        const xml = '<xml>' + (d.output && d.output !== 'hat' ? '<block type="rc_print"><value name="VALUE">' + block + '</value></block>' : block) + '</xml>';
        w.RoboEditor.load({ format: 'zmrobo-blocks', version: 1, controller: d.controllers?.[0] || 'E6', workspace: { xml } });
        if (d.requiresOriginalCode)
            assert.throws(() => w.RoboEditor.compile(), /Python|сигнатура|документация/);
        else
            assert.ok(w.RoboEditor.compile().source, d.id);
    }
    assert.deepEqual(errors, []);
}
finally {
    dom.window.close();
} });
test('previous projects migrate without losing generated Python', { timeout: 15000 }, async () => { const { dom, w, errors } = await editor(); try {
    for (const name of ['01_Forward', '02_Line', '03_Variables']) {
        const p = JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/v1/' + name + '.zmblocks'), 'utf8'));
        w.RoboEditor.load(p);
        const expected = fs.readFileSync(path.join(__dirname, '../examples/v1/' + name + '.py'), 'utf8');
        const ast=w.RoboEditor.compile().ast;delete ast.entry;
        assert.equal(w.ZmPython.generate(ast,w.ZM_CATALOG).source,expected.replace(/^item = 0\n/m,''),name);
        assert.equal(typeof w.RoboEditor.project().workspace.xml, 'string');
    }
    assert.deepEqual(errors, []);
}
finally {
    dom.window.close();
} });
test('variables, lists and custom blocks use the original menus', { timeout: 15000 }, async () => { const { dom, w, errors } = await editor(); try {
    const e = w.RoboEditor, ws = e.workspace;
    ws.createVariable('speed', '');
    ws.createVariable('items', 'list');
    ws.getToolbox().setSelectedCategoryById('variables');
    assert.ok(ws.getFlyout().getWorkspace().getAllBlocks().some(b => b.type === 'data_setvariableto'));
    assert.ok(ws.getFlyout().getWorkspace().getAllBlocks().some(b => b.type === 'data_addtolist'));
    e.createProcedure();
    w.document.getElementById('procedureName').value = 'Move';
    w.document.getElementById('procedureArgs').value = 'power';
    w.document.getElementById('procedureCreate').click();
    assert.deepEqual(errors,[],JSON.stringify(e.project()));
    assert.match(e.compile().source, /def Move\(power\)/);
    const prototype=w.Blockly.Procedures.getPrototypeBlock('Move %s',ws);
    e.editProcedure(prototype.mutationToDom(),w.Blockly.Procedures.editProcedureCallbackFactory_(prototype));
    w.document.getElementById('procedureName').value='Drive';
    w.document.getElementById('procedureArgs').value='amount';
    w.document.getElementById('procedureCreate').click();
    assert.match(e.compile().source,/def Drive\(amount\)/,JSON.stringify(errors));

    ws.getToolbox().setSelectedCategoryById('procedures');
    assert.ok(ws.getFlyout().getWorkspace().getAllBlocks().some(b => b.type === 'procedures_call'));
    assert.deepEqual(errors, []);
}
finally {
    dom.window.close();
} });
test('every reference category can be opened, including operator conversions', { timeout: 15000 }, async () => { const { dom, w, errors } = await editor(); try {
    const ws = w.RoboEditor.workspace;
    for (const group of ref.groups.filter(g=>g.id!=='cameraE7')) {
        ws.getToolbox().setSelectedCategoryById(group.id);
        assert.equal(ws.getToolbox().getSelectedCategoryId(), group.id);
    }
    ws.getToolbox().setSelectedCategoryById('operators');
    const types = ws.getFlyout().getWorkspace().getAllBlocks().map(b => b.type);
    assert.ok(types.includes('operator_strToNum'));
    assert.ok(types.includes('operator_numToStr'));
    const xml = '<xml><variables><variable type="" id="speed">speed</variable></variables><block type="rc_start"><next><block type="data_setvariableto"><field name="VARIABLE" id="speed">speed</field><value name="VALUE"><shadow type="text"><field name="TEXT">50</field></shadow></value></block></next></block></xml>';
    w.RoboEditor.load({ format: 'zmrobo-blocks', version: 1, controller: 'E6', workspace: { xml } });
    assert.match(w.RoboEditor.compile().source, /speed = 50/);
    assert.doesNotMatch(w.RoboEditor.compile().source, /speed = "50"/);
    assert.deepEqual(errors, []);
}
finally {
    dom.window.close();
} });
test('M6 replaces H and E7 has a separate camera section',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
    const e=w.RoboEditor,ws=e.workspace;
    assert.deepEqual([...w.document.getElementById('controller').options].map(o=>o.value),['E6','M6','E7']);
    e.load(w.RoboBlocks.defaultProject('M6'));
    ws.getToolbox().setSelectedCategoryById('sensors');
    const ports=ws.getFlyout().getWorkspace().getAllBlocks().flatMap(b=>b.inputList.flatMap(i=>i.fieldRow)).filter(f=>f.getOptions).flatMap(f=>f.getOptions().map(o=>o[0]));
    assert.ok(ports.includes('P5'));assert.ok(!ports.includes('P6'));
    const sample=ref.blocks.find(x=>x.id==='rc_light');
    const sensor=ref.blocks.find(x=>x.call==='sensor.GetLightSensor'&&!x.special);
    assert.ok(sensor);
    const sensorXml='<xml><block type="rc_print"><value name="VALUE"><block type="'+sensor.id+'"><field name="P">6</field></block></value></block></xml>';
    e.load({format:'zmrobo-blocks',version:1,controller:'M6',workspace:{xml:sensorXml}});
    assert.throws(()=>e.compile(),/P1–P5/);
    const sensorBlock=ws.getAllBlocks().find(b=>b.type===sensor.id);sensorBlock.getInputTargetBlock('P').setFieldValue('5','PORT');assert.match(e.compile().source,/sensor.GetLightSensor\(5\)/);
    e.load(w.RoboBlocks.defaultProject('E7'));ws.getToolbox().setSelectedCategoryById('cameraE7');
    assert.equal(ws.getFlyout().getWorkspace().getAllBlocks().filter(b=>b.type.startsWith('rc_e7_')).length,6);
    assert.throws(()=>e.load(w.RoboBlocks.defaultProject('H')),/E6, M6 и E7/);
    assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('layout supports collapsing Python, resizing panes and a dark theme',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
    const d=w.document,e=w.RoboEditor;
    assert.equal(d.getElementById('codePane').hidden,true);assert.equal(w.getComputedStyle(d.getElementById('codePane')).display,'none');
    d.getElementById('toggleCode').click();assert.equal(d.getElementById('codePane').hidden,false);
    d.getElementById('closeCode').click();assert.equal(d.getElementById('codePane').hidden,true);
    assert.ok(d.body.classList.contains('dark'));d.getElementById('toggleTheme').click();assert.ok(!d.body.classList.contains('dark'));d.getElementById('toggleTheme').click();
    e.layout.prefs.category=210;e.layout.prefs.palette=420;e.layout.prefs.code=400;e.layout.apply();
    assert.equal(e.workspace.getToolbox().getWidth(),630);assert.equal(e.workspace.getFlyout().getWidth(),420);
    assert.match(e.workspace.getFlyout().svgGroup_.style.transform,/210px/);
    assert.equal(e.workspace.getToolbox().HtmlDiv.style.width,'210px');
    assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('duplicating variable blocks does not create random variables',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
    const e=w.RoboEditor,B=w.Blockly,ws=e.workspace;
    e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml:'<xml><variables><variable type="" id="speed">speed</variable></variables><block type="rc_start"><next><block type="data_setvariableto"><field name="VARIABLE" id="speed">speed</field><value name="VALUE"><block type="data_variable"><field name="VARIABLE" id="speed">speed</field></block></value></block></next></block></xml>'}});
    const original=ws.getAllBlocks().find(b=>b.type==='data_setvariableto');
    for(let i=0;i<10;i++){const xml=B.Xml.blockToDom(original);for(const el of [xml,...xml.querySelectorAll('block')])el.removeAttribute('id');ws.paste(xml);}
    assert.deepEqual(Array.from(ws.getAllVariables(),v=>v.name),['speed']);
    const source=e.compile().source;assert.match(source,/def task1\(\):\n    global speed/);assert.doesNotMatch(source,/\n[i-m] = /);
    const serialized=e.project();const count=ws.getAllBlocks().length;e.load(w.RoboBlocks.defaultProject());e.load(serialized);assert.equal(ws.getAllBlocks().length,count);
    assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('abs and sgn and returning custom blocks generate executable Python',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
    const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,d=w.document;
    e.createProcedure();d.getElementById('procedureName').value='Sign';d.getElementById('procedureArgs').value='value';d.getElementById('procedureReturns').checked=true;d.getElementById('procedureCreate').click();
    ws.getToolbox().setSelectedCategoryById('procedures');
    assert.ok(ws.getFlyout().getWorkspace().getAllBlocks().some(b=>b.type==='rc_procedure_value'));
    const def=ws.getTopBlocks().find(b=>b.type==='rc_function');const proto=def.getInputTargetBlock('custom_block');
    const mutation=B.Xml.domToText(proto.mutationToDom());
    const defXml=B.Xml.blockToDom(def);const ret=defXml.querySelector('block[type="rc_return"]');ret.querySelector('value').innerHTML='<block type="operator_mathop"><field name="OPERATOR">sgn</field><value name="NUM"><block type="argument_reporter_string_number"><field name="VALUE">value</field></block></value></block>';
    const xml='<xml>'+B.Xml.domToText(defXml)+'<block type="rc_print"><value name="VALUE"><block type="rc_procedure_value">'+mutation+'<value name="arg_0_Sign"><shadow type="math_number"><field name="NUM">-5</field></shadow></value></block></value></block></xml>';
    e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml}});
    const source=e.compile().source;
    assert.match(source,/return sgn\(value\)/);assert.match(source,/print\(Sign\(-5\)\)/);
    const {spawnSync}=require('node:child_process');const run=spawnSync('python3',['-c',source],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(run.stdout.trim(),'-1');
    const prototype=B.Procedures.getPrototypeBlock('Sign %s',ws);
    e.editProcedure(prototype.mutationToDom(),B.Procedures.editProcedureCallbackFactory_(prototype));d.getElementById('procedureName').value='Direction';d.getElementById('procedureArgs').value='number';d.getElementById('procedureCreate').click();
    assert.match(e.compile().source,/return sgn\(number\)/);assert.match(e.compile().source,/print\(Direction\(-5\)\)/);
    const p=e.project();e.load(w.RoboBlocks.defaultProject());e.load(p);assert.match(e.compile().source,/print\(Direction\(-5\)\)/);
    ws.getToolbox().setSelectedCategoryById('operators');const op=ws.getFlyout().getWorkspace().getAllBlocks().find(b=>b.type==='operator_mathop');const opts=Array.from(op.getField('OPERATOR').getOptions(),o=>Array.from(o));
    assert.ok(opts.some(o=>o[0]==='abs'&&o[1]==='abs'));assert.ok(opts.some(o=>o[0]==='sgn'));
    assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('return belongs to its function and sensor ports accept function parameters',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,d=w.document;
 e.createProcedure();d.getElementById('procedureName').value='ReadLight';d.getElementById('procedureArgs').value='port';d.getElementById('procedureReturns').checked=true;d.getElementById('procedureCreate').click();
 const def=ws.getTopBlocks().find(b=>b.type==='rc_function');assert.equal(def.getInput('RETURN'),null);assert.equal(def.getInputTargetBlock('BODY').type,'rc_return');assert.ok(def.getInput('BODY'));assert.equal(def.nextConnection,null);
 const sensor=ref.blocks.find(b=>b.call==='sensor.GetLightSensor'&&!b.special);
 const expr=B.Xml.textToDom('<xml><block type="'+sensor.id+'"><value name="P"><block type="argument_reporter_string_number"><field name="VALUE">port</field></block></value></block></xml>');
 const reading=B.Xml.domToBlock(expr.firstChild,ws);def.getInputTargetBlock('BODY').getInput('VALUE').connection.connect(reading.outputConnection);
 const proto=def.getInputTargetBlock('custom_block'),mutation=B.Xml.domToText(proto.mutationToDom());
 const print=B.Xml.domToBlock(B.Xml.textToDom('<xml><block type="rc_print"><value name="VALUE"><block type="rc_procedure_value">'+mutation+'<value name="arg_0_ReadLight"><shadow type="text"><field name="TEXT">5</field></shadow></value></block></value></block></xml>').firstChild,ws);
 assert.ok(print);const source=e.compile().source;assert.match(source,/return sensor.GetLightSensor\(port\)/);assert.match(source,/print\(ReadLight\(5\)\)/);
 const prelude='import sys, types\nsensor=types.ModuleType("sensor")\nsensor.GetLightSensor=lambda port: port * 10\nsys.modules["sensor"]=sensor\n';
 const {spawnSync}=require('node:child_process'),result=spawnSync(process.env.PYTHON||'python3',['-c',prelude+source],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'50');
 ws.getToolbox().setSelectedCategoryById('procedures');assert.ok(ws.getFlyout().getWorkspace().getAllBlocks().some(b=>b.type==='rc_return'));
 // Use the actual context-menu callback, including return/argument state.
 B.Procedures.editProcedureCallback_(def);assert.equal(d.getElementById('procedureReturns').checked,true);assert.equal(d.getElementById('procedureArgs').value,'port');
 d.getElementById('procedureName').value='ReadSensor';d.getElementById('procedureCreate').click();assert.match(e.compile().source,/return sensor.GetLightSensor\(port\)/);assert.match(e.compile().source,/print\(ReadSensor\(5\)\)/);
 const project=e.project(),before=e.compile().source;e.load(w.RoboBlocks.defaultProject());e.load(project);assert.equal(e.compile().source,before);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('sensor port can be a variable or expression and keeps old selected ports',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,sensor=ref.blocks.find(b=>b.call==='sensor.GetLightSensor'&&!b.special);
 const xml='<xml><variables><variable type="" id="p">port</variable></variables><block type="data_setvariableto"><field name="VARIABLE" id="p">port</field><value name="VALUE"><shadow type="math_number"><field name="NUM">4</field></shadow></value><next><block type="rc_print"><value name="VALUE"><block type="'+sensor.id+'"><value name="P"><block type="operator_add"><value name="NUM1"><block type="data_variable"><field name="VARIABLE" id="p">port</field></block></value><value name="NUM2"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value></block></value></block></next></block></xml>';
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml}});assert.match(e.compile().source,/sensor.GetLightSensor\(\(port \+ 1\)\)/);
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml:'<xml><block type="rc_print"><value name="VALUE"><block type="'+sensor.id+'"><field name="P">8</field></block></value></block></xml>'}});assert.match(e.compile().source,/sensor.GetLightSensor\(8\)/);assert.equal(ws.getAllBlocks().find(b=>b.type===sensor.id).getInputTargetBlock('P').getFieldValue('PORT'),'8');
 assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('sgn is second, palette expands as overlay, map opens and navigates without changing code',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,ws=e.workspace,d=w.document;ws.getToolbox().setSelectedCategoryById('operators');
 const op=ws.getFlyout().getWorkspace().getAllBlocks().find(b=>b.type==='operator_mathop');assert.deepEqual(Array.from(op.getField('OPERATOR').getOptions().slice(0,2),o=>o[1]),['abs','sgn']);
 const fly=ws.getFlyout(),blocks=fly.getWorkspace().getTopBlocks();const width=e.layout.prefs.palette,toolboxWidth=ws.getToolbox().getWidth();
 const target=blocks[0],old=target.getHeightWidth;target.getHeightWidth=()=>({width:900,height:40});const background=fly.svgBackground_.getAttribute('d');e.layout.expandPalette(true);assert.equal(fly.getWidth(),width);assert.equal(fly.svgBackground_.getAttribute('d'),background);assert.ok(parseFloat(fly.clipRect_.getAttribute('width'))>width);fly.clipRect_.setAttribute('width',width+'px');await new Promise(r=>setTimeout(r,0));assert.ok(parseFloat(fly.clipRect_.getAttribute('width'))>width);assert.equal(ws.getToolbox().getWidth(),toolboxWidth);e.layout.expandPalette(false);assert.equal(fly.getWidth(),width);
 fly.svgGroup_.dispatchEvent(new w.Event('pointerenter'));assert.equal(e.layout.paletteExpanded,true);fly.svgGroup_.dispatchEvent(new w.Event('pointerleave'));await new Promise(r=>setTimeout(r,220));assert.equal(e.layout.paletteExpanded,false);target.getHeightWidth=old;
 const before=e.project().workspace.xml;d.getElementById('toggleMap').click();assert.equal(e.navigation.open,true);assert.equal(d.getElementById('projectMap').hidden,false);assert.ok(d.querySelector('#mapSvg .mapViewport'));
 const previousFrame=d.querySelector('#mapSvg .mapViewport').getAttribute('x'),oldScroll=ws.scrollX;ws.scrollX-=50;await new Promise(r=>setTimeout(r,150));assert.notEqual(d.querySelector('#mapSvg .mapViewport').getAttribute('x'),previousFrame);ws.scrollX=oldScroll;
 const original=ws.scrollbar.set;let destination;ws.scrollbar.set=(x,y)=>destination=[x,y];e.navigation.center(500,300);assert.ok(destination.every(Number.isFinite));ws.scrollbar.set=original;
 d.getElementById('closeMap').click();assert.equal(e.navigation.open,false);assert.equal(e.project().workspace.xml,before);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('old function chains migrate into the body and keep the final return expression',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly;
 const mutation='<mutation proccode="Echo %s" argumentids="[&quot;arg_0_Echo&quot;]" argumentnames="[&quot;value&quot;]" argumentdefaults="[&quot;&quot;]" warp="false"/>';
 const xml='<xml><block type="procedures_definition"><data>zm:return</data><statement name="custom_block"><shadow type="procedures_prototype">'+mutation+'</shadow></statement><next><block type="rc_print"><value name="VALUE"><shadow type="text"><field name="TEXT">before</field></shadow></value><next><block type="rc_return"><value name="VALUE"><block type="argument_reporter_string_number"><field name="VALUE">value</field></block></value></block></next></block></next></block><block type="rc_print"><value name="VALUE"><block type="rc_procedure_value">'+mutation+'<value name="arg_0_Echo"><shadow type="math_number"><field name="NUM">12</field></shadow></value></block></value></block></xml>';
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml}});
 const def=e.workspace.getTopBlocks().find(b=>b.type==='rc_function');assert.equal(def.getInputTargetBlock('BODY').type,'rc_print');assert.equal(def.getInputTargetBlock('BODY').getNextBlock().getInputTargetBlock('VALUE').type,'argument_reporter_string_number');assert.equal(def.getDescendants().filter(b=>b.type==='rc_return').length,1);
 const code=e.compile().source;const {spawnSync}=require('node:child_process');const result=spawnSync(process.env.PYTHON||'python3',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,'before\n12\n');
 const p=e.project();e.load(w.RoboBlocks.defaultProject());e.load(p);assert.equal(e.compile().source,code);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('new editors start dark with Python closed and migrate old layout preferences',{timeout:15000},async()=>{
 for(const [layout,dark]of [[{python:true,dark:false,category:200},true],[{defaultsVersion:2,python:true,dark:false,category:200},false]]){
  const {dom,w,errors}=await editor({layout});try{const d=w.document;assert.equal(d.getElementById('codePane').hidden,true);assert.equal(d.body.classList.contains('dark'),dark);assert.equal(w.RoboEditor.layout.prefs.category,200);assert.deepEqual(errors,[]);}finally{dom.window.close();}
 }
});
test('Python preview is highlighted without altering source or interpreting HTML',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const code=w.document.getElementById('code');const source='# comment\nimport sensor\ndef Read(port):\n    text = "<img src=x onerror=bad()>"\n    return sensor.GetLightSensor(port) / 10\n';
 w.RoboPythonHighlight.render(code,source);assert.equal(code.textContent,source);assert.ok(code.querySelector('.py-flow'));assert.ok(code.querySelector('.py-function'));assert.ok(code.querySelector('.py-number'));assert.ok(code.querySelector('.py-string'));assert.ok(code.querySelector('.py-comment'));assert.equal(code.querySelector('img'),null);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('all native navigation controls follow theme changes and undo refreshes',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const controls=()=>Array.from(w.document.querySelectorAll('.blocklyZoom image'),i=>i.getAttributeNS('http://www.w3.org/1999/xlink','href'));
 assert.ok(controls().length>=5);assert.ok(controls().every(p=>p.includes('/controls-dark/')));
 w.document.getElementById('toggleTheme').click();assert.ok(controls().every(p=>p.includes('/vendor/robocode-media/')));
 w.document.getElementById('toggleTheme').click();const b=w.RoboEditor.workspace.newBlock('control_wait');b.initSvg();b.render();await new Promise(r=>setTimeout(r,50));assert.ok(controls().every(p=>p.includes('/controls-dark/')));assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('connection dialog exposes USB and Bluetooth through shared host commands',{timeout:15000},async()=>{const {dom,w,errors,messages}=await editor({vscode:true});try{
 const d=w.document;d.getElementById('connectionButton').click();assert.ok(d.getElementById('connectionDialog').open);assert.equal(d.querySelectorAll('.connectionChoices>button').length,2);
 d.getElementById('connectUSB').click();assert.equal(messages.at(-1).kind,'connect');assert.equal(messages.at(-1).transport,'usb');assert.equal(messages.at(-1).controller,'E6');
 w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'connectionResult',state:{connected:true,transport:'usb',name:'USB COM',address:'COM5',canRun:true},operation:'connect'}}));
 assert.ok(d.getElementById('connectionButton').classList.contains('connected'));assert.equal(d.getElementById('connectionDialog').open,false);
 d.getElementById('connectionButton').click();d.getElementById('disconnectRobot').click();assert.equal(messages.at(-1).kind,'disconnect');
 w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'connectionResult',state:{connected:false,transport:'usb'},operation:'disconnect'}}));d.getElementById('connectBluetooth').click();assert.equal(messages.at(-1).transport,'bluetooth');assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('light comparison, dynamic motor ports and one arithmetic selector generate working Python',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace;
 for(const op of ['<','>','==']){
  const xml='<xml><block type="rc_print"><value name="VALUE"><block type="rc_light_compare"><field name="OP">'+w.RoboBlocks.escape(JSON.stringify(op))+'</field><value name="P"><shadow type="rc_sensor_port"><field name="PORT">5</field></shadow></value><value name="V"><shadow type="math_number"><field name="NUM">50</field></shadow></value></block></value></block></xml>';
  e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml}});assert.ok(e.compile().source.includes('sensor.GetLightSensor(5) '+op+' 50'));
 }
 const variable='<block type="data_variable"><field name="VARIABLE" id="port">port</field></block>';
 const xml='<xml><variables><variable type="" id="port">port</variable></variables><block type="rc_motor_run"><value name="M"><block type="rc_arithmetic"><field name="OP">+</field><value name="NUM1">'+variable+'</value><value name="NUM2"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value><value name="S"><shadow type="math_number"><field name="NUM">50</field></shadow></value></block></xml>';
 e.load({format:'zmrobo-blocks',version:1,controller:'M6',workspace:{xml}});assert.match(e.compile().source,/motor.SetMotor\(\(port \+ 1\), 50\)/);
 const before=e.compile().source,p=e.project();e.load(w.RoboBlocks.defaultProject());e.load(p);assert.equal(e.compile().source,before);
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml:'<xml><block type="rc_motor_run"><field name="M">3</field></block></xml>'}});assert.equal(ws.getTopBlocks()[0].getInputTargetBlock('M').getFieldValue('PORT'),'3');assert.match(e.compile().source,/motor.SetMotor\(3, 50\)/);
 ws.getToolbox().setSelectedCategoryById('operators');const fly=ws.getFlyout().getWorkspace();assert.equal(fly.getAllBlocks().filter(b=>b.type==='rc_arithmetic').length,1);assert.equal(fly.getAllBlocks().find(b=>b.type==='rc_arithmetic').getField('OP').getOptions().find(o=>o[1]==='/')[0],'÷');assert.ok(!fly.getAllBlocks().some(b=>['operator_add','operator_subtract','operator_multiply','operator_divide'].includes(b.type)));
 for(const [op,result]of [['+',7],['-',3],['*',10],['/',2.5]]){
  e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml:'<xml><block type="rc_print"><value name="VALUE"><block type="rc_arithmetic"><field name="OP">'+op+'</field><value name="NUM1"><shadow type="math_number"><field name="NUM">5</field></shadow></value><value name="NUM2"><shadow type="math_number"><field name="NUM">2</field></shadow></value></block></value></block></xml>'}});
  const run=require('node:child_process').spawnSync('python3',['-c',e.compile().source],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(Number(run.stdout.trim()),result);
 }assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('flyout function calls have editable arguments and movable returns work inside conditions',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,d=w.document;
 e.createProcedure();d.getElementById('procedureName').value='ReadLight';d.getElementById('procedureArgs').value='port';d.getElementById('procedureReturns').checked=true;d.getElementById('procedureCreate').click();
 const def=ws.getTopBlocks().find(b=>b.type==='rc_function');const originalReturn=def.getInputTargetBlock('BODY');assert.equal(originalReturn.type,'rc_return');assert.equal(def.getInput('RETURN'),null);
 originalReturn.unplug();const condition=B.Xml.domToBlock(B.Xml.textToDom('<xml><block type="control_if"><value name="CONDITION"><block type="operator_lt"><value name="OPERAND1"><block type="argument_reporter_string_number"><field name="VALUE">port</field></block></value><value name="OPERAND2"><shadow type="text"><field name="TEXT">0</field></shadow></value></block></value></block></xml>').firstChild,ws);def.getInput('BODY').connection.connect(condition.previousConnection);condition.getInput('SUBSTACK').connection.connect(originalReturn.previousConnection);originalReturn.getInputTargetBlock('VALUE').setFieldValue('99','NUM');
 const finalReturn=B.Xml.domToBlock(B.Xml.textToDom('<xml><block type="rc_return"><value name="VALUE"><block type="rc_light_value"><value name="P"><block type="argument_reporter_string_number"><field name="VALUE">port</field></block></value></block></value></block></xml>').firstChild,ws);condition.nextConnection.connect(finalReturn.previousConnection);
 ws.getToolbox().setSelectedCategoryById('procedures');const template=ws.getFlyout().getWorkspace().getAllBlocks().find(b=>b.type==='rc_procedure_value');assert.equal(template.getInputTargetBlock('arg_0_ReadLight').type,'text');
 const call=B.Xml.domToBlock(B.Xml.blockToDom(template),ws);call.getInputTargetBlock('arg_0_ReadLight').setFieldValue('5','TEXT');
 const print=B.Xml.domToBlock(B.Xml.textToDom('<xml><block type="rc_print"/></xml>').firstChild,ws);print.getInput('VALUE').connection.connect(call.outputConnection);
 const code=e.compile().source;assert.match(code,/if .*port < 0/);assert.match(code,/return 99/);assert.match(code,/ReadLight\(5\)/);
 const prelude='import sys,types\nsensor=types.ModuleType("sensor")\nsensor.GetLightSensor=lambda port:port*10\nsys.modules["sensor"]=sensor\n';const run=require('node:child_process').spawnSync('python3',['-c',prelude+code+'\nprint(ReadLight(-1))'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(run.stdout,'50\n99\n');
 const saved=e.project();e.load(w.RoboBlocks.defaultProject());e.load(saved);assert.equal(e.compile().source,code);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('delete and keyboard undo restore exactly one block with its original editable inputs',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,d=w.document;
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml:'<xml><block type="rc_start"><next><block type="rc_motor_run"><field name="M">3</field><value name="S"><shadow type="math_number"><field name="NUM">42</field></shadow></value><next><block type="control_wait"><value name="DURATION"><shadow type="math_positive_number"><field name="NUM">0.1</field></shadow></value></block></next></block></next></block></xml>'}});
 const wait=()=>new Promise(resolve=>setTimeout(resolve,30));await wait();const ids=()=>Array.from(ws.getAllBlocks(),b=>b.id).sort();const before=ids(),code=e.compile().source;ws.clearUndo();let forwarded=0;d.addEventListener('keydown',()=>forwarded++);
 B.Events.setGroup(true);ws.getAllBlocks().find(b=>b.type==='rc_motor_run').dispose(true,true);B.Events.setGroup(false);await wait();
 for(let i=0;i<3;i++){
  const undo=new w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true});d.body.dispatchEvent(undo);await wait();assert.equal(undo.defaultPrevented,true);assert.deepEqual(ids(),before);assert.equal(e.compile().source,code);assert.equal(ws.getAllBlocks().filter(b=>b.type==='rc_motor_run').length,1);
  if(i<2){d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,shiftKey:true,bubbles:true,cancelable:true}));await wait();assert.equal(ws.getAllBlocks().filter(b=>b.type==='rc_motor_run').length,0);}
 }assert.equal(forwarded,0);
 const field=ws.getAllBlocks().find(b=>b.type==='math_number').getField('NUM');field.showEditor_();const input=d.querySelector('.blocklyHtmlInput');assert.ok(input);assert.equal(w.getComputedStyle(input).color,'rgb(32, 36, 49)');assert.equal(w.getComputedStyle(input).backgroundColor,'rgb(255, 255, 255)');B.WidgetDiv.hide();assert.deepEqual(errors,[]);
}finally{dom.window.close();}});
test('4.5.0 fixed return migrates into the body without changing generated Python',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor;const xml='<xml>'+w.RoboBlocks.procedureXml('Answer',[]).replace('</block>','<mutation returns="true"/><value name="RETURN"><shadow type="math_number"><field name="NUM">42</field></shadow></value></block>')+'</xml>';
 e.load({format:'zmrobo-blocks',version:1,controller:'E6',workspace:{xml}});const def=e.workspace.getTopBlocks().find(b=>b.type==='rc_function');assert.equal(def.getInput('RETURN'),null);assert.equal(def.getInputTargetBlock('BODY').type,'rc_return');assert.match(e.compile().source,/return 42/);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});

test('adding a function parameter supplies editable fields in existing statement and value calls',{timeout:15000},async()=>{const {dom,w,errors}=await editor();try{
 const e=w.RoboEditor,B=w.Blockly,ws=e.workspace,d=w.document;
 e.createProcedure();d.getElementById('procedureName').value='ReadLight';d.getElementById('procedureArgs').value='port';d.getElementById('procedureReturns').checked=true;d.getElementById('procedureCreate').click();
 ws.getToolbox().setSelectedCategoryById('procedures');const fly=ws.getFlyout().getWorkspace();
 for(const type of ['procedures_call','rc_procedure_value']){const call=B.Xml.domToBlock(B.Xml.blockToDom(fly.getAllBlocks().find(b=>b.type===type)),ws);call.getInputTargetBlock('arg_0_ReadLight').setFieldValue('5','TEXT');}
 const def=ws.getTopBlocks().find(b=>b.type==='rc_function');B.Procedures.editProcedureCallback_(def);d.getElementById('procedureArgs').value='port, divisor';d.getElementById('procedureCreate').click();
 for(const call of ws.getAllBlocks().filter(b=>['procedures_call','rc_procedure_value'].includes(b.type))){assert.equal(call.getInputTargetBlock('arg_0_ReadLight').getFieldValue('TEXT'),'5');const added=call.getInputTargetBlock('arg_1_ReadLight');assert.ok(added);assert.equal(added.type,'text');added.setFieldValue('10','TEXT');}
 const p=e.project(),count=ws.getAllBlocks().length;e.load(w.RoboBlocks.defaultProject());e.load(p);assert.equal(ws.getAllBlocks().length,count);assert.deepEqual(errors,[]);
}finally{dom.window.close();}});

test('context menus translate both dictionary entries and original hard-coded collapse labels', {timeout:15000}, async()=>{
 const {dom,w,errors}=await editor();try{
  const block=w.RoboEditor.workspace.getTopBlocks()[0];
  block.showContextMenu_(new w.MouseEvent('contextmenu',{clientX:50,clientY:50}));
  let text=w.Blockly.WidgetDiv.DIV.textContent;
  assert.doesNotMatch(text,/Duplicate|收起|展开/);assert.match(text,/Дублировать/);assert.match(text,/Свернуть/);
  w.Blockly.ContextMenu.hide();block.setCollapsed(true);
  block.showContextMenu_(new w.MouseEvent('contextmenu',{clientX:50,clientY:50}));
  text=w.Blockly.WidgetDiv.DIV.textContent;assert.match(text,/Развернуть/);assert.doesNotMatch(text,/展开/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('fullscreen has a visible exit and a single simulator transfer button', {timeout:15000}, async()=>{
 const {dom,w,messages,errors}=await editor({vscode:true});try{
  const button=w.document.getElementById('toggleFullscreen');button.click();
  assert.equal(messages.at(-1).kind,'fullscreen');assert.equal(messages.at(-1).enabled,true);
  w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'fullscreenStatus',enabled:true}}));
  assert.equal(button.getAttribute('aria-pressed'),'true');assert.match(button.textContent,/Вернуть окна/);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(messages.at(-1).kind,'fullscreen');assert.equal(messages.at(-1).enabled,false);
  assert.equal(w.document.getElementById('openSimulator'),null);
  w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'result'}}));
  w.document.getElementById('simulate').click();assert.equal(messages.at(-1).kind,'simulate');assert.equal(messages.at(-1).ast.controller,'E6');
  w.dispatchEvent(new w.MessageEvent('message',{data:{kind:'compileRequest',requestId:'tennis-left'}}));
  assert.equal(messages.at(-1).kind,'compileResult');assert.equal(messages.at(-1).requestId,'tennis-left');assert.equal(messages.at(-1).ast.controller,'E6');
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
