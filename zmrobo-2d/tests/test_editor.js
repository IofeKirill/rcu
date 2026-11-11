const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('media/index.html','utf8'), code=fs.readFileSync('media/task-editor.js','utf8')+'\n'+fs.readFileSync('media/view.js','utf8');
const mockCtx=new Proxy({getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]??(()=>{})});
class El {
    set value(v){this._value=String(v);} get value(){return this._value;}
    constructor(tag){this.tag=tag;this.children=[];this.events={};this.value='';this.width=800;this.height=500;this.clientWidth=800;this.clientHeight=500;this.validity={valid:true};this.dataset={};this.style={};}
    append(e){this.children.push(e);} replaceChildren(){this.children=[];} setAttribute(k,v){this[k]=v;} addEventListener(k,v){const old=this.events[k];this.events[k]=old?e=>{old(e);v(e);}:v;}
    getContext(){return mockCtx;} getBoundingClientRect(){return {left:0,top:0};}
    focus(){} setPointerCapture(){} contains(){return false;}
}
const ids={},tools=[],tabs=[];
for(const m of html.matchAll(/<(\w+)([^>]*)>/g)){
    const id=m[2].match(/\bid="([^"]+)"/)?.[1],tool=m[2].match(/data-tool="([^"]+)"/)?.[1],tab=m[2].match(/data-tab="([^"]+)"/)?.[1];
    if(!id&&!tool&&!tab)continue;
    const el=new El(m[1]);el.value=m[2].match(/value="([^"]*)"/)?.[1]??'';
    el.checked=/\bchecked\b/.test(m[2]);
    if(id)ids[id]=el;
    if(tool){el.dataset.tool=tool;tools.push(el);}
    if(tab){el.dataset.tab=tab;tabs.push(el);}
}
ids.rate.value='1';ids.model.value='E6';
const sent=[], win=new El('window');
const context=vm.createContext({window:win,document:{getElementById:id=>ids[id],createElement:tag=>new El(tag),querySelectorAll:q=>q==='[data-tool]'?tools:q==='[data-tab]'?tabs:[]},
    acquireVsCodeApi:()=>({postMessage:m=>sent.push(m)}),ResizeObserver:class{observe(){}},structuredClone,btoa});
const evalIn=s=>vm.runInContext(s,context);
ids.clawData.textContent=fs.readFileSync('media/claws.json','utf8');
ids.bigTravelData.textContent=fs.readFileSync('media/big-travel.json','utf8');
evalIn(code);
assert.equal(sent[0].kind,'ready');

assert.equal(evalIn('shapeList.length'),0);
assert.ok(html.indexOf('value="empty"')<html.indexOf('value="loop"'));
evalIn("preset('loop')");
assert.equal(evalIn('shapeList.length'),23);
assert.ok(evalIn('shapeList.every((shape,i)=>shape.width===5 && shape.points[1].every((v,j)=>v===shapeList[(i+1)%shapeList.length].points[0][j]))'));
assert.equal(evalIn('active.start[2]'),90);
assert.ok(evalIn('active.sensors[5][2]===-2.5 && active.sensors[6][2]===2.5'));
for(const key of ['maze','ring','macro','snake','checker','contour','narrow','crossings','loop','empty']) {
    assert.ok(html.includes('value="'+key+'"'));
    evalIn(`preset('${key}')`);
    const result=evalIn('scene("run")');
    assert.ok(result.floor.length>0);
    if(key==='maze'){
        assert.equal(result.segments.length,18);
        assert.ok(result.segments.every(([x,y,u,v])=>[x-310,y-160,u-310,v-160].every(n=>n%30===0)));
    }
    if(key==='ring'||key==='macro'){
        const ring=result.shapes[0];
        assert.equal(ring.width,7);
        assert.equal(ring.points[1][0]-ring.points[0][0]+ring.width,key==='ring'?100:150);
    }
    if(key==='narrow') assert.ok(result.shapes.every(s=>s.width===1));
}
assert.ok(!html.includes('value="line"'));
ids.snapGrid.checked=true;assert.equal(evalIn('JSON.stringify(gridPoint([412,256]))'),'[410,260]');
ids.bodySize.value='200';ids.bodySize.onchange();assert.equal(evalIn('active.bodySize'),20);
evalIn("preset('loop')");
console.log('Preset geometry, snapping and body units passed');
ids.memoryGrid.clientWidth=432;ids.memoryGrid.clientHeight=700;
evalIn("showTab('memory')");
assert.equal(ids.cells.children.length,80);
assert.equal(ids.page.textContent,'1–80 / 128');
const cell=ids.cells.children[0].children[0];
cell.value='4095';cell.onchange();
ids.nextPage.onclick();assert.equal(ids.page.textContent,'81–128 / 128');
ids.memoryGrid.clientHeight=400;evalIn('updateMemoryLayout()');
assert.equal(ids.page.textContent,'45–88 / 128');
assert.equal(evalIn('active.cells[1]'),4095);
ids.memoryGrid.clientHeight=1200;evalIn('updateMemoryLayout()');
assert.equal(ids.cells.children.length,128);assert.equal(ids.nextPage.hidden,true);
assert.equal(ids.cells.children[0].children[0].value,'4095');
assert.equal(ids.left.children[0].textContent,'Мотор M1');
assert.equal(ids.right.value,'3');
ids.model.value='E7';ids.model.onchange();assert.equal(ids.left.children.length,8);
ids.left.value='8';ids.model.value='M6';ids.model.onchange();assert.equal(ids.left.value,'1');
const row=evalIn('sensorRows[1]');row.type.value='color';row.type.onchange();assert.equal(row.height.hidden,false);
row.height.value='5';row.height.onchange();assert.equal(evalIn('active.sensors[1][4]'),5);
for(const scale of [0.05,1,20]) {
    assert.ok(Math.abs(evalIn(`scale=${scale};arrow(0,0,0)[0]*scale`)-28)<1e-9);
}
console.log('Memory layout, motor labels, color height and arrow scale passed');
evalIn(`
preset('empty');
const testCenter=pose(active);
const testMouse = (f,r,mods={}) => {
    const [x,y]=robotToField(f,r);
    return {clientX:(x-camera.x)*scale+canvas.width/2,clientY:(y-camera.y)*scale+canvas.height/2,
            button:0,pointerId:5,preventDefault(){},...mods};
};
active.sensors={'1':['sonar',15,0,0]};
canvas.events.pointerdown(testMouse(15,12/scale));
`);
assert.equal(evalIn('drag.type'), 'sensor');
assert.equal(evalIn('drag.turn'), false);
evalIn(`canvas.events.pointerup(testMouse(15,12/scale));
const aim=(angle,mods)=>{
    const q=active.sensors['1'];
    canvas.events.pointerdown(testMouse(...arrow(...q.slice(1,4))));
    if(!drag.turn) throw Error('missing rotation handle');
    const ev=testMouse(q[1]+Math.cos(angle)*28/scale,q[2]+Math.sin(angle)*28/scale,mods);
    canvas.events.pointermove(ev);canvas.events.pointerup(ev);
    return q[3];
};
`);
assert.equal(evalIn('aim(Math.PI/3,{shiftKey:true})'),90);
assert.equal(evalIn('aim(Math.PI/3,{ctrlKey:true})'),45);
evalIn(`$('motorType').value='sport';$('addRobot').onclick();`);
assert.equal(evalIn("$('motorType').value"),'standard');
evalIn('switchRobot(robots[0])');
assert.equal(evalIn('scene("run").robots[0].motorType'),'sport');
console.log('Sensor hit area, angle snapping and per-robot motor settings passed');


evalIn("preset('empty');selectTool('can')");
evalIn("canvas.events.pointerdown(testMouse(30,0))");
assert.equal(evalIn("props.length"),1);
assert.equal(evalIn("props[0][2]"),'can');
evalIn("selectTool('ball');canvas.events.pointerdown(testMouse(40,10))");
assert.equal(evalIn("props.length"),2);
assert.equal(evalIn("props[1][2]"),'ball');
evalIn("selectTool('pan');canvas.events.pointerdown(testMouse(30,0));canvas.events.pointermove(testMouse(35,0));canvas.events.pointerup(testMouse(35,0))");
assert.equal(evalIn("selectedObject.key"),'prop');
assert.ok(Math.abs(evalIn("props[0][0]")-evalIn("robotToField(35,0)[0]"))<1e-9);
assert.equal(evalIn('scene("save").props.length'),2);
evalIn("propPoses.set(props[0],[200,300]);draw()");
assert.equal(evalIn('scene("run").props[0][0]'),200);
assert.notEqual(evalIn('scene("save").props[0][0]'),200);
evalIn("$('reset').onclick()");
assert.equal(evalIn('propPoses.size'),0);
evalIn("canvas.events.keydown({key:'Delete',preventDefault(){}})");
assert.equal(evalIn('props.length'),1);
evalIn("$('undo').onclick()");
assert.equal(evalIn('props.length'),2);
evalIn("preset('empty')");
assert.equal(evalIn('props.length'),0);
console.log('Can/ball placement, drag, delete, undo, reset and save passed');


for(const id of ['clawForward','clawRight','clawAngle','clawSize']) assert.ok(!html.includes('id="'+id+'"'));
evalIn("preset('empty');$('clawKind').value='large';$('clawKind').onchange()");
assert.equal(evalIn("active.claw.kind"),'large');
assert.doesNotThrow(()=>evalIn("scene('run')"));
evalIn("const grab=clawPolygons(active)[3].reduce((a,p)=>a.map((v,i)=>v+p[i]/clawPolygons(active)[3].length),[0,0]);");
const before=evalIn('structuredClone(active.claw)');
evalIn("canvas.events.pointerdown(testMouse(...grab))");
assert.equal(evalIn('drag.type'),'claw');
assert.equal(evalIn('drag.turn'),false);
evalIn("canvas.events.pointermove(testMouse(grab[0]+2,grab[1]-1));canvas.events.pointerup(testMouse(grab[0]+2,grab[1]-1))");
assert.ok(Math.abs(evalIn('active.claw.forward')-before.forward-2)<1e-9);
assert.ok(Math.abs(evalIn('active.claw.right')-before.right+1)<1e-9);
evalIn("const rotateClaw=(angle,mods={})=>{const q=active.claw;canvas.events.pointerdown(testMouse(...arrow(q.forward,q.right,q.angle)));if(!drag.turn)throw Error('missing claw arrow');const ev=testMouse(q.forward+Math.cos(angle)*28/scale,q.right+Math.sin(angle)*28/scale,mods);canvas.events.pointermove(ev);canvas.events.pointerup(ev);return q.angle;}");
assert.equal(evalIn('rotateClaw(Math.PI/3,{shiftKey:true})'),90);
assert.equal(evalIn('rotateClaw(Math.PI/3,{ctrlKey:true})'),45);
assert.ok(Math.abs(evalIn('rotateClaw(Math.PI/3)')-60)<1e-9);
assert.equal(evalIn("scene('save').robots[0].claw.angle"),evalIn('active.claw.angle'));
evalIn("$('undo').onclick()");
assert.equal(evalIn('active.claw.angle'),45);
evalIn("const cancelled=structuredClone(active.claw);selectedClaw=true;canvas.events.pointerdown(testMouse(...arrow(active.claw.forward,active.claw.right,active.claw.angle)));canvas.events.pointermove(testMouse(active.claw.forward,active.claw.right+28/scale));canvas.events.pointercancel({pointerId:5});");
assert.equal(evalIn('JSON.stringify(active.claw)'),evalIn('JSON.stringify(cancelled)'));
evalIn("$('addRobot').onclick()");
assert.equal(evalIn("active.claw"),null);
evalIn("switchRobot(robots[0])");
assert.equal(evalIn("$('clawKind').value"),'large');
evalIn("$('clawKind').value='narrow';$('clawKind').onchange()");
assert.equal(evalIn("active.claw.kind"),'narrow');
evalIn("$('clawKind').value='';$('clawKind').onchange()");
assert.equal(evalIn("active.claw"),null);
console.log('Claw drag, free/snap rotation, cancellation, undo and launch passed');


// History is per completed gesture, with a redo branch discarded by a new edit.
evalIn("preset('empty');selectTool('can');canvas.events.pointerdown(testMouse(30,0));");
assert.equal(evalIn('undo.length'),1);
evalIn("selectTool('pan');canvas.events.pointerdown(testMouse(30,0));canvas.events.pointermove(testMouse(31,0));canvas.events.pointermove(testMouse(32,0));canvas.events.pointerup(testMouse(33,0))");
assert.equal(evalIn('undo.length'),2);
const movedX=evalIn('props[0][0]');
const shortcut=(key,extra={})=>win.events.keydown({key,ctrlKey:true,target:ids.world,preventDefault(){},...extra});
shortcut('z');
assert.equal(evalIn('undo.length'),1);
assert.equal(evalIn('redo.length'),1);
assert.notEqual(evalIn('props[0][0]'),movedX);
shortcut('y');
assert.equal(evalIn('props[0][0]'),movedX);
shortcut('z');
shortcut('z');
assert.equal(evalIn('props.length'),0);
shortcut('y');
assert.equal(evalIn('props.length'),1);
evalIn("selectTool('ball');canvas.events.pointerdown(testMouse(50,0));");
assert.equal(evalIn('redo.length'),0);
assert.equal(evalIn("$('redo').disabled"),true);
const historyCount=evalIn('undo.length');
shortcut('z',{target:{tagName:'INPUT'}});
assert.equal(evalIn('undo.length'),historyCount);
evalIn('lock(true)');
shortcut('z');
assert.equal(evalIn('undo.length'),historyCount);
evalIn('lock(false)');
// Sensor creation/removal, start poses, and claw rotations all have redo.
evalIn("preset('empty');sensorRows[5].type.value='light';sensorRows[5].type.onchange()");
assert.equal(evalIn('active.sensors[5][0]'),'light');
shortcut('z');
assert.equal(evalIn('active.sensors[5]'),undefined);
shortcut('y');
assert.equal(evalIn('active.sensors[5][0]'),'light');
evalIn("preset('empty');$('clawKind').value='straight';$('clawKind').onchange()");
assert.equal(evalIn('clawPolygons(active).length'),2);
evalIn('rotateClaw(Math.PI/3,{ctrlKey:true})');
assert.equal(evalIn('active.claw.angle'),45);
shortcut('z');
assert.equal(evalIn('active.claw.angle'),0);
shortcut('y');
assert.equal(evalIn('active.claw.angle'),45);
shortcut('z');shortcut('z');
assert.equal(evalIn('active.claw'),null);
shortcut('y');shortcut('y');
assert.equal(evalIn('active.claw.angle'),45);
// Realism is global while wear is assigned to the current robot.
evalIn("preset('empty');$('realism').onclick()");
assert.equal(evalIn('scene("save").realistic'),true);
assert.equal(evalIn("$('wear').disabled"),false);
evalIn("$('wear').value='85';$('wear').oninput();$('wear').onchange()");
assert.equal(evalIn('active.wear'),85);
assert.equal(evalIn("$('wearValue').textContent"),'85%');
evalIn("$('addRobot').onclick()");
assert.equal(evalIn('active.wear'),0);
evalIn('switchRobot(robots[0])');
assert.equal(evalIn('active.wear'),85);
evalIn("$('realism').onclick()");
assert.equal(evalIn('scene("run").realistic'),false);
assert.equal(evalIn("$('wear').disabled"),true);
assert.equal(evalIn('active.wear'),85);
shortcut('z');
assert.equal(evalIn('realistic'),true);
assert.equal(evalIn('scene("save").robots[0].wear'),85);
console.log('Undo/redo gestures, branch invalidation, editing focus, realism and wear passed');

// Presets own their robot count and use the requested starting positions.
assert.ok(html.includes('>Эстафета<')&&html.includes('>Слалом<')&&html.includes('>Инверсная линия<'));
evalIn("preset('contour')");
assert.equal(evalIn('robots.length'),2);
assert.equal(evalIn('robots[0].start[2]'),180);
assert.equal(evalIn('robots[1].start[2]'),0);
assert.ok(evalIn('robots[0].start[0]>robots[1].start[0]'));
assert.equal(evalIn('robots[0].start[1]'),evalIn('robots[1].start[1]'));
evalIn("preset('macro')");
assert.equal(evalIn('robots.length'),1);
assert.equal(evalIn('JSON.stringify(active.start)'),'[400,250,0]');
for(const presetName of ['checker','crossings']) {
    evalIn("preset('"+presetName+"')");
    assert.equal(evalIn('robots.length'),1);
    assert.equal(evalIn('active.start[2]'),90);
    assert.ok(evalIn('active.start[0]>450'));
}
evalIn("preset('narrow')");
assert.equal(evalIn('robots.length'),1);
assert.ok(evalIn('active.start[0]>500 && active.start[2]>130 && active.start[2]<150'));
evalIn("preset('empty');active.sensors={};selectTarget({robot:active,kind:'start'})");
evalIn("const startMouse=(x,y,mods={})=>({clientX:(x-camera.x)*scale+canvas.width/2,clientY:(y-camera.y)*scale+canvas.height/2,button:0,pointerId:5,preventDefault(){},...mods});");
evalIn("const turnStart=(angle,mods)=>{const [x,y]=poseArray(active,'start');canvas.events.pointerdown(startMouse(...poseArrow(active,'start')));if(drag?.type!=='pose'||!drag.turn)throw Error('missing start arrow');const event=startMouse(x+35/scale*Math.cos(angle),y+35/scale*Math.sin(angle),mods);canvas.events.pointermove(event);canvas.events.pointerup(event);};turnStart(Math.PI/3,{shiftKey:true});");
assert.equal(evalIn('active.start[2]'),90);
shortcut('z');assert.equal(evalIn('active.start[2]'),0);
shortcut('y');assert.equal(evalIn('active.start[2]'),90);
evalIn("selectTarget({robot:active,kind:'start'});turnStart(Math.PI/3,{ctrlKey:true})");
assert.equal(evalIn('active.start[2]'),45);
console.log('Preset names, starts, robot counts and start-marker angle snapping passed');

// Active mechanisms use a free motor port and render the joint from telemetry.
evalIn("preset('empty');active.claw=null;$('clawKind').value='gripper';$('clawKind').onchange()");
assert.equal(evalIn('active.claw.motor'),2);
assert.equal(evalIn("$('mechanismPortRow').hidden"),false);
assert.equal(evalIn('clawPolygons(active).length'),4);
const openShape=evalIn('JSON.stringify(clawPolygons(active))');
evalIn("const mq=pose(active);states.set(active.id,{x:mq.x,y:mq.y,heading:mq.heading,encoders:Array(8).fill(0),motors:Array(8).fill(0),sensors:{},mechanism:{angle:60,held:0}});draw()");
assert.notEqual(evalIn('JSON.stringify(clawPolygons(active))'),openShape);
assert.equal(evalIn('scene("save").robots[0].claw.motor'),2);
evalIn("$('mechanismPort').value='4';$('mechanismPort').onchange()");
assert.equal(evalIn('active.claw.motor'),4);
shortcut('z');assert.equal(evalIn('active.claw.motor'),2);
shortcut('y');assert.equal(evalIn('active.claw.motor'),4);
evalIn("$('clawKind').value='kicker';$('clawKind').onchange()");
assert.equal(evalIn('active.claw.motor'),4);
assert.equal(evalIn('clawPolygons(active).length'),3);
evalIn("const kq=pose(active);states.set(active.id,{x:kq.x,y:kq.y,heading:kq.heading,encoders:Array(8).fill(0),motors:Array(8).fill(0),sensors:{},mechanism:{angle:80,held:null}});draw()");
evalIn("$('clawKind').value='small';$('clawKind').onchange()");
assert.equal(evalIn("$('mechanismPortRow').hidden"),true);
assert.equal(evalIn('active.claw.motor'),undefined);
console.log('Active mechanism selection, free motor ports, animated geometry and undo passed');
evalIn("$('model').value='E7';$('model').onchange();$('clawKind').value='gripper';$('clawKind').onchange();$('mechanismPort').value='8';$('mechanismPort').onchange()");
assert.equal(evalIn('active.claw.motor'),8);
evalIn("$('model').value='M6';$('model').onchange()");
assert.ok(evalIn('active.claw.motor>=1 && active.claw.motor<=4 && !active.wheels.includes(active.claw.motor)'));
assert.doesNotThrow(()=>evalIn('scene("run")'));
console.log('Mechanism port stays valid when changing controller');

// Opening stop is saved and survives type changes plus undo/redo.
evalIn("preset('empty');$('clawKind').value='gripper';$('clawKind').onchange()");
assert.equal(evalIn("$('maxOpeningRow').hidden"),false);
assert.equal(evalIn('active.claw.maxOpening'),50);
const beforeOpening=evalIn('JSON.stringify(clawPolygons(active))');
evalIn("$('maxOpening').value='100';$('maxOpening').onchange()");
assert.equal(evalIn('active.claw.maxOpening'),100);
assert.notEqual(evalIn('JSON.stringify(clawPolygons(active))'),beforeOpening);
assert.equal(evalIn('scene("save").robots[0].claw.maxOpening'),100);
evalIn("$('clawKind').value='kicker';$('clawKind').onchange()");
assert.equal(evalIn("$('maxOpeningRow').hidden"),true);
shortcut('z');shortcut('z');assert.equal(evalIn('active.claw.maxOpening'),50);
shortcut('y');assert.equal(evalIn('active.claw.maxOpening'),100);
evalIn("$('maxOpening').value='-5';$('maxOpening').onchange()");
assert.equal(evalIn('active.claw.maxOpening'),100);
const drawnImages=[];
mockCtx.drawImage=(...args)=>drawnImages.push(args);
for(const id of ['beamStraight','beamAngle']) ids[id].naturalWidth=1600;
evalIn('drawMechanism(active)');
assert.ok(drawnImages.some(args=>args[0]===ids.beamStraight));
assert.ok(!html.includes('id="gear24"'));
assert.ok(!code.includes('const gear='));

evalIn("$('clawKind').value='kicker';$('clawKind').onchange();drawMechanism(active)");
assert.ok(drawnImages.some(args=>args[0]===ids.beamAngle));
console.log('Opening limit, cross-type undo/redo and original sprite drawing passed');

assert.equal(evalIn("$('initialAngleRow').hidden"),false);
assert.equal(evalIn('active.claw.initialAngle'),0);
const forwardKick=evalIn('JSON.stringify(clawPolygons(active))');
evalIn("$('initialAngle').value='120';$('initialAngle').onchange()");
assert.equal(evalIn('active.claw.initialAngle'),120);
assert.notEqual(evalIn('JSON.stringify(clawPolygons(active))'),forwardKick);
assert.equal(evalIn('scene("save").robots[0].claw.initialAngle'),120);
shortcut('z');assert.equal(evalIn('active.claw.initialAngle'),0);
shortcut('y');assert.equal(evalIn('active.claw.initialAngle'),120);
evalIn("$('initialAngle').value='361';$('initialAngle').onchange()");
assert.equal(evalIn('active.claw.initialAngle'),120);
evalIn("$('clawKind').value='gripper';$('clawKind').onchange()");
assert.equal(evalIn("$('initialAngleRow').hidden"),true);
for(const model of ['E6','E7']) {
    evalIn(`$('model').value='${model}';$('model').onchange();$('motorType').value='standard';$('motorType').onchange()`);
    assert.equal(evalIn('robotArtworkId(active)'), 'robotE6Standard');
    const reverses=evalIn('JSON.stringify(active.reversed)');
    evalIn("$('motorType').value='sport';$('motorType').onchange()");
    assert.equal(evalIn('robotArtworkId(active)'), 'robotE6');
    assert.equal(evalIn('JSON.stringify(active.reversed)'),reverses);
    shortcut('z');assert.equal(evalIn('robotArtworkId(active)'),'robotE6Standard');
    shortcut('y');assert.equal(evalIn('robotArtworkId(active)'),'robotE6');
}
assert.equal(evalIn("robotArtworkId({model:'M6',motorType:'sport'})"),'robotM6');
console.log('Kicker initial pose, profile artwork, manual reverse and undo/redo passed');

// Car configuration, differential, animated tyres and axle-based editing.
evalIn("$('model').value='Car';$('model').onchange()");
assert.equal(evalIn('active.model'),'Car');
assert.equal(evalIn('active.bodySize'),39.2);
assert.equal(evalIn("$('leftLabel').textContent"),'Рулевой мотор');
assert.equal(evalIn("$('carOptions').hidden"),false);
assert.equal(evalIn('robotArtworkId(active)'),'robotCar');
evalIn("$('differential').onclick()");
assert.equal(evalIn('active.differential'),false);
assert.equal(evalIn('scene("save").robots[0].differential'),false);
shortcut('z');assert.equal(evalIn('active.differential'),true);
shortcut('y');assert.equal(evalIn('active.differential'),false);
const rotations=[];mockCtx.rotate=a=>rotations.push(a);ids.robotCar.naturalWidth=1920;
evalIn("states.set(active.id,{...pose(active),encoders:[0,0,0,0],sensors:{},car:{steering:.3,wheelAngles:[.4,.25],speed:12}});drawCar(active)");
assert.ok(rotations.includes(.4)&&rotations.includes(.25));
assert.ok(drawnImages.some(args=>args[0]===ids.robotCar&&args.length===9));
evalIn("preset('rally')");
assert.equal(evalIn('active.model'),'Car');
assert.equal(evalIn('walls.length'),8);
assert.equal(evalIn('active.start[2]'),-90);
assert.equal(evalIn('active.sensors[1][0]'),'sonar');
assert.equal(evalIn('active.sensors[3][0]'),'sonar');
assert.ok(html.indexOf('value="empty"')<html.indexOf('value="rally"'));
for(const [model,motorType] of [['E6','standard'],['E6','sport'],['E7','standard'],['M6','standard'],['Car','standard']]) {
    evalIn(`active.model='${model}';active.motorType='${motorType}';active.start=[300,250,0];currentPoses.clear();states.clear()`);
    const pivot=evalIn("poseArray(active,'start').slice(0,2)");
    evalIn("{const aq=poseArray(active,'start');setPose(active,'start',[aq[0],aq[1],90]);}");
    const after=evalIn("poseArray(active,'start').slice(0,2)");
    assert.ok(Math.hypot(after[0]-pivot[0],after[1]-pivot[1])<1e-9);
    assert.notEqual(evalIn('active.start[0]'),300);
}
assert.ok(code.includes("ctx.rotate(-Math.PI/2)"));
assert.ok(code.includes("const BUILD_VERSION='0.15'"));
console.log('Car settings, original tyre sprites, differential and axle pivots passed');

// Header and shortcuts across keyboard layouts.
assert.ok(html.indexOf('id="apply"')<html.indexOf('id="realism"'));
assert.ok(!html.includes('bluetoothReadings'));
assert.ok(!html.includes('2D 0.14'));
assert.ok(html.includes('>Скорость <select'));
assert.ok(html.includes('<span>Время</span>'));
evalIn("preset('empty');$('motorType').value='sport';$('motorType').onchange()");
shortcut('я',{code:'KeyZ'});assert.equal(evalIn('active.motorType'),'standard');
shortcut('н',{code:'KeyY'});assert.equal(evalIn('active.motorType'),'sport');
shortcut('я',{code:'KeyZ'});shortcut('я',{code:'KeyZ',shiftKey:true});assert.equal(evalIn('active.motorType'),'sport');
shortcut('я',{code:'KeyZ',target:{tagName:'TEXTAREA'}});assert.equal(evalIn('active.motorType'),'sport');
shortcut('z',{code:'KeyW'});assert.equal(evalIn('active.motorType'),'sport');
shortcut('я',{code:'KeyZ',ctrlKey:false,metaKey:true});assert.equal(evalIn('active.motorType'),'standard');
console.log('Russian-layout shortcuts and header cleanup passed');

// Draw regions; metadata edits retain identity across undo/redo.
evalIn(`preset('empty');selectTool('regionRect');
canvas.events.pointerdown(testMouse(80,80));canvas.events.pointermove(testMouse(120,130));canvas.events.pointerup(testMouse(120,130));`);
assert.equal(evalIn('regions.length'),1);
assert.equal(evalIn('selectedObject.key'),'region');
const regionId=evalIn('regions[0].id');
evalIn("$('regionName').value='Старт';$('regionName').onchange()");
assert.equal(evalIn('regions[0].name'),'Старт');
shortcut('я',{code:'KeyZ'});assert.equal(evalIn('regions[0].name'),'Регион 1');
shortcut('я',{code:'KeyZ'});assert.equal(evalIn('regions.length'),0);
shortcut('н',{code:'KeyY'});shortcut('н',{code:'KeyY'});
assert.equal(evalIn('regions[0].id'),regionId);
assert.equal(evalIn('regions[0].name'),'Старт');
evalIn("$('regionsHideAll').onclick()");assert.equal(evalIn('regions[0].visible'),false);
shortcut('я',{code:'KeyZ'});assert.equal(evalIn('regions[0].visible'),true);
evalIn("moveObject({key:'region',row:regions[0]},structuredClone(regions[0]),1,20,30,0,0)");
assert.equal(evalIn('regions[0].rect[2]'),60);
evalIn("selectTarget({obj:{key:'region',row:regions[0],list:regions}});canvas.events.keydown({key:'Delete',preventDefault(){}})");
assert.equal(evalIn('regions.length'),0);shortcut('z');assert.equal(evalIn('regions[0].id'),regionId);
evalIn(`$('ruleObject').value=active.id;$('ruleRegion').value=regions[0].id;$('rulePoints').value='10';$('ruleEnabled').checked=true;$('ruleOnce').checked=true;$('ruleAdd').onclick()`);
assert.equal(evalIn("taskSpec.nodes.filter(n=>n.tag==='event').length"),1);
evalIn("props.push([600,200,'can']);refreshTaskEditor()");
const canId=evalIn('scene("save").propIds[0]');
assert.equal(evalIn('scene("run").propIds[0]'),canId);
evalIn("preset('ring')");assert.equal(evalIn('regions.length'),1);assert.equal(evalIn("taskSpec.nodes.filter(n=>n.tag==='event').length"),2);
evalIn("preset('bigtravel')");
assert.equal(evalIn('regions.length'),5);assert.equal(evalIn('props.length'),8);assert.equal(evalIn('segments.length'),24);
assert.equal(evalIn("taskSpec.nodes.filter(n=>n.tag==='event').length"),13);
assert.equal(evalIn('taskSpec.aliases.robot1'),evalIn('active.id'));
assert.ok(evalIn('regions.every(r=>r.visible===false)'));
console.log('Regions, visual rules, stable IDs and BigTravel preset passed');
