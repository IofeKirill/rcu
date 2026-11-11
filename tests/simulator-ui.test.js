'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'../simulator/media');
function simulator(){
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'').replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/,'');
 for(const [key,file] of [['clawData','claws.json'],['kickerData','kickers.json'],['bigTravelData','big-travel.json']])html=html.replace('{{'+key+'}}',fs.readFileSync(path.join(root,file),'utf8'));
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
 w.structuredClone=structuredClone;w.ResizeObserver=class{observe(){}};w.acquireVsCodeApi=()=>({postMessage(){}});
 w._scaleCalls=[];w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({canvas:this,scale:(...a)=>w._scaleCalls.push(a),measureText:s=>({width:String(s).length*8}),getImageData:(_x,_y,a,b)=>({data:new Uint8ClampedArray(a*b*4),width:a,height:b}),createImageData:(a,b)=>({data:new Uint8ClampedArray(a*b*4),width:a,height:b})},{get:(o,k)=>k in o?o[k]:(()=>{})});};
 w.eval(['task-builder.js','task-editor.js','tennis.js','view.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n')+'\n globalThis.SimTest={preset,scene,mechanismPolygons,get active(){return active;},get robots(){return robots;},syncClaw,acceptTennisState,tennisPrepare,tennisWins,drawMechanism,renderTaskResult,setState(state){taskState=state;},get task(){return taskSpec;}};');
 return {dom,w,s:w.SimTest};
}
test('Rally restores the previous wheeled model on every other template',()=>{const {dom,w,s}=simulator();try{
 for(const name of Array.from(w.document.getElementById('preset').options,o=>o.value).filter(n=>n!=='rally')){
  s.preset('rally');assert.equal(s.active.model,'Car');s.preset(name);assert.equal(s.active.model,'E6',name);assert.notEqual(w.document.getElementById('model').value,'Car',name);assert.equal(s.active.wheelDiameter,56,name);
 }
 s.active.model='M6';s.preset('rally');s.preset('maze');assert.equal(s.active.model,'M6');
}finally{dom.window.close();}});
test('Tennis has facing robots, six balls and regulation markings matching the field',()=>{const {dom,w,s}=simulator();try{
 s.preset('tennis');const scene=s.scene('save');assert.equal(scene.robots.length,2);
 const [a,b]=scene.robots;assert.ok(a.start[0]<b.start[0]);assert.equal(a.start[1],269.65);assert.equal(b.start[1],230.35);assert.equal(a.start[2],0);assert.equal(b.start[2],180);
 assert.equal(scene.props.length,6);assert.equal(scene.ballDiameter,5.7);
 for(const rows of [scene.props.slice(0,3),scene.props.slice(3)])for(let i=1;i<3;i++)assert.ok(Math.abs(rows[i][1]-rows[i-1][1]-scene.ballDiameter-10)<1e-9);
 assert.ok(Math.abs(285-scene.props[2][1]-scene.ballDiameter/2-12.5)<1e-9);assert.ok(Math.abs(scene.props[3][1]-scene.ballDiameter/2-215-12.5)<1e-9);assert.equal(scene.task.kind,'tennis');assert.equal(scene.props[0][2],'ball');assert.equal(scene.segments.length,4);assert.equal(scene.shapes.length,6);
 assert.equal(scene.shapes.filter(x=>x.fill==='#000000').length,2);assert.equal(scene.shapes.filter(x=>x.fill==='#2db432').length,4);
}finally{dom.window.close();}});
test('Kicker length is adjustable and used by the UI collision geometry',()=>{const {dom,w,s}=simulator();try{
 const kind=w.document.getElementById('clawKind');kind.value='kicker';kind.onchange();
 const select=w.document.getElementById('kickerLength');assert.equal(select.options.length,4);assert.equal(select.value,'short');assert.equal(w.document.getElementById('kickerLengthRow').hidden,false);
 const before=s.mechanismPolygons('kicker',0,50,'short');select.value='extraLong';select.onchange();assert.equal(s.scene('save').robots[0].claw.length,'extraLong');
 const after=s.mechanismPolygons('kicker',0,50,'extraLong');const max=ps=>Math.max(...ps.flat().map(p=>Math.hypot(...p)));assert.ok(max(after)>max(before));
}finally{dom.window.close();}});
test('Tennis wins are recorded once, next set resets the six balls, match ends at two wins',()=>{const {dom,w,s}=simulator();try{
 s.preset('tennis');const result=()=>({status:'success',time:60,reason:'Конец сета',score:4,variables:{},messages:[],events:[],tennis:{scores:[4,2],fieldBalls:[2,3],goalsConceded:[0,1],outs:[0,0],penalties:[0,0],neutral:0,winner:0,result:'final',unknown:[]}});
 let state=result();s.setState(state);s.acceptTennisState(state);s.acceptTennisState(state);assert.deepEqual(Array.from(s.tennisWins()),[1,0]);
 s.tennisPrepare();assert.equal(s.scene('save').props.length,6);assert.equal(s.scene('save').task.match.sets.length,1);
 state=result();s.setState(state);s.acceptTennisState(state);s.renderTaskResult();assert.deepEqual(Array.from(s.tennisWins()),[2,0]);assert.ok(w.document.getElementById('run').disabled);assert.match(w.document.getElementById('tennisMatchScore').textContent,/Матч выиграл/);
 s.tennisPrepare(false,true);assert.deepEqual(Array.from(s.tennisWins()),[0,0]);assert.equal(s.scene('save').task.match.sets.length,0);
}finally{dom.window.close();}});
test('Tennis referee can award or replay a disputed set without double scoring',()=>{const {dom,w,s}=simulator();try{
 s.preset('tennis');const state={status:'success',time:10,reason:'Клинч',variables:{},messages:[],events:[],tennis:{scores:[3,3],fieldBalls:[3,3],goalsConceded:[0,0],outs:[0,0],penalties:[0,0],neutral:0,winner:null,result:'review',unknown:[]}};
 s.setState(state);s.acceptTennisState(state);s.renderTaskResult();assert.deepEqual(Array.from(s.tennisWins()),[0,0]);
 w.document.getElementById('tennisDecision').value='1';w.document.getElementById('tennisJudge').click();assert.deepEqual(Array.from(s.tennisWins()),[0,1]);
 w.document.getElementById('tennisDecision').value='draw';w.document.getElementById('tennisJudge').click();assert.deepEqual(Array.from(s.tennisWins()),[0,0]);assert.equal(s.task.match.sets.length,0);
}finally{dom.window.close();}});
test('Tennis template passes the real Python judge and survives XML serialization',()=>{const {dom,w,s}=simulator();try{
 const {spawnSync}=require('node:child_process');s.preset('tennis');const scene=s.scene('save');
 const source="import sys,json,base64;sys.path.insert(0,sys.argv[1]);from multi_runner import worlds;from task_rules import Judge;from scene_xml import serialize,parse;s=json.load(sys.stdin);s['floor']=base64.b64encode(bytes([255,255,255])*800*500).decode();j=Judge(s,worlds(s));assert j.status=='running',j.reason;p=parse(serialize(s).decode())['scene'];assert p['ballDiameter']==5.7;assert p['task']['tennis']['players']==s['task']['tennis']['players']";
 const p=spawnSync(process.env.PYTHON||'python3',['-c',source,path.dirname(root)],{input:JSON.stringify(scene),encoding:'utf8',timeout:10000});assert.equal(p.status,0,p.stderr);
 assert.equal(w.document.querySelector('option[value="loop"]').textContent,'Линия S');
}finally{dom.window.close();}});
test('Long kicker artwork is mirrored consistently with the corrected collision shape',()=>{const {dom,w,s}=simulator();try{
 const d=w.document;d.getElementById('clawKind').value='kicker';d.getElementById('clawKind').onchange();const meta=require('../simulator/media/kickers.json');
 for(const [length,data]of Object.entries(meta)){
  const img=d.getElementById(data.image);Object.defineProperty(img,'naturalWidth',{value:1920,configurable:true});Object.defineProperty(img,'naturalHeight',{value:1080,configurable:true});
  s.active.claw.length=length;w._scaleCalls.length=0;s.drawMechanism(s.active);
  assert.equal(w._scaleCalls.some(a=>a[0]===1&&a[1]===-1),Boolean(data.mirrorY),length);
 }
}finally{dom.window.close();}});
