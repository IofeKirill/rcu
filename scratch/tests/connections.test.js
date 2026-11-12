'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
const commands=new Map();let pick=choices=>choices[0];
const vscode={workspace:{isTrusted:true},commands:{registerCommand:(name,fn)=>(commands.set(name,fn),{dispose(){}})},window:{showQuickPick:async choices=>pick(choices)}};
let lastPicker;
vscode.window.createQuickPick=()=>{
 let items=[],accept=()=>{},hide=()=>{},closed=false;
 const q={busy:false,selectedItems:[],show(){},dispose(){closed=true;},hide(){hide();},onDidAccept(fn){accept=fn;return {dispose(){}};},onDidHide(fn){hide=fn;return {dispose(){}};},get items(){return items;},set items(value){items=value;queueMicrotask(()=>{if(closed)return;const chosen=pick(items);if(chosen){q.selectedItems=[chosen];accept();}else hide();});}};
 lastPicker=q;return q;
};
const load=Module._load;Module._load=function(id,...args){return id==='vscode'?vscode:load.call(this,id,...args);};let register;
try{register=require('../../out/BlockConnections').registerBlockConnections;}finally{Module._load=load;}
function setup(overrides={}){
 commands.clear();pick=choices=>choices[0];vscode.workspace.isTrusted=true;
 let current={transport:'usb',connected:false,name:'USB',canRun:false};const calls=[];
 const services={state:()=>current,busy:()=>false,scan:async mode=>(calls.push(['scan',mode]),[{label:'Robot',device:{address:mode==='usb'?'COM5':'fake-bt'}}]),controller:async type=>{calls.push(['controller',type]);},connect:async(mode,device)=>{calls.push(['connect',mode,device]);current={transport:mode,connected:true,name:mode,address:device.address,canRun:true};},disconnect:async mode=>{calls.push(['disconnect',mode]);current={...current,connected:false,canRun:false};},...overrides};
 register({subscriptions:[]},services);return {calls,services};
}
test('block connection chooser uses the selected transport and the common current connection',async()=>{
 const {calls}=setup();const choose=commands.get('extension.chooseBlockConnection');
 let state=await choose({transport:'usb',controller:'M6'});assert.equal(state.transport,'usb');assert.equal(state.address,'COM5');assert.equal(state.busy,false);assert.deepEqual(calls[1],['controller','M6']);
 state=await choose({transport:'bluetooth',controller:'E7'});assert.equal(state.transport,'bluetooth');assert.equal(state.connected,true);assert.equal(commands.get('extension.getBlockConnectionState')().address,'fake-bt');
 state=await commands.get('extension.disconnectBlockConnection')();assert.equal(state.connected,false);assert.deepEqual(calls.at(-1),['disconnect','bluetooth']);
});
test('cancelled selection does not change controller or connect anything',async()=>{
 const {calls}=setup();pick=()=>undefined;const state=await commands.get('extension.chooseBlockConnection')({transport:'usb',controller:'E6'});assert.equal(state.connected,false);assert.deepEqual(calls,[['scan','usb']]);assert.equal(state.busy,false);
});
test('connection rejects a third transport, untrusted folders and overlapping operations',async()=>{
 let release;const {calls}=setup({scan:()=>new Promise(resolve=>release=resolve)});const choose=commands.get('extension.chooseBlockConnection');
 await assert.rejects(()=>choose({transport:'bluetooth-direct',controller:'E6'}),/параметры/);
 vscode.workspace.isTrusted=false;await assert.rejects(()=>choose({transport:'usb',controller:'E6'}),/доверенную/);vscode.workspace.isTrusted=true;
 const pending=choose({transport:'usb',controller:'E6'});assert.equal(commands.get('extension.getBlockConnectionState')().busy,true);await assert.rejects(()=>choose({transport:'bluetooth',controller:'E6'}),/Дождись/);release([{label:'Robot',device:{address:'COM5'}}]);await pending;assert.equal(commands.get('extension.getBlockConnectionState')().busy,false);assert.equal(calls.filter(c=>c[0]==='connect').length,1);
});
test('scan errors release the chooser and do not report a false connection',async()=>{
 setup({scan:async()=>{throw Error('scan failed');}});await assert.rejects(()=>commands.get('extension.chooseBlockConnection')({transport:'usb',controller:'E6'}),/scan failed/);const state=commands.get('extension.getBlockConnectionState')();assert.equal(state.busy,false);assert.equal(state.connected,false);
});

test('USB picker shows disk results before the slow COM association completes',async()=>{
 let finish;const disk={key:'E:',label:'E6',device:{address:'disk'}};
 const {calls}=setup({scan:async(mode,publish)=>{publish([disk]);return new Promise(resolve=>finish=()=>resolve([disk]));}});
 const pending=commands.get('extension.chooseBlockConnection')({transport:'usb',controller:'E6'});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(lastPicker.items[0].key,'E:');assert.equal(calls.filter(c=>c[0]==='connect').length,0);
 finish();const state=await pending;assert.equal(state.connected,true);
});
test('USB picker cancellation leaves the old connection while enumeration finishes',async()=>{
 let finish;setup({scan:async()=>new Promise(resolve=>finish=resolve)});
 const pending=commands.get('extension.chooseBlockConnection')({transport:'usb',controller:'E6'});lastPicker.hide();
 const state=await pending;assert.equal(state.connected,false);finish([]);await new Promise(resolve=>setImmediate(resolve));assert.equal(state.busy,false);
});
