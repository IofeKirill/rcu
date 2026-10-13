const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {PassThrough}=require('node:stream');
const {BluetoothBridge,pythonCommand}=require('../out/BluetoothBridge');
function fixture(handler){
 const events=[],logs=[],children=[];
 const launch=(executable,args,options)=>{
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.stdin={write(line,callback){handler(child,JSON.parse(line));if(callback)callback();},end(){setImmediate(()=>child.emit('close',0));}};
  child.send=message=>child.stdout.write(JSON.stringify(message)+'\n');
  child.kill=()=>{setImmediate(()=>child.emit('close',1));return true;};children.push(child);
  child.launch={executable,args,options};setImmediate(()=>child.send({event:'ready'}));return child;
 };
 const bridge=new BluetoothBridge(()=>'', '/extension',line=>logs.push(line),event=>events.push(event),launch);
 return {bridge,children,events,logs};
}
test('Python executable fallback respects Windows and explicit paths',()=>{
 assert.equal(pythonCommand('','win32'),'py');assert.equal(pythonCommand('','linux'),'python3');
 assert.equal(pythonCommand('C:\\Python\\python.exe','win32'),'C:\\Python\\python.exe');
});
test('RPC correlates responses, ignores unknown IDs and keeps process for next command',async()=>{
 const f=fixture((child,message)=>{child.send({id:999,ok:true});child.send({id:message.id,ok:true,result:message.action});});
 assert.equal(await f.bridge.call('scan'),'scan');assert.equal(await f.bridge.call('stop'),'stop');assert.equal(f.children.length,1);
 const launch=f.children[0].launch;assert.equal(launch.options.shell,false);assert.equal(launch.options.env.PYTHONPATH,undefined);
 assert.ok(launch.args.at(-1).endsWith('python/bluetooth_bridge.py'));f.bridge.dispose();
});
test('Concurrent RPC is rejected, backend failure propagates and channel remains reusable',async()=>{
 let awaiting;
 const f=fixture((child,message)=>{awaiting={child,message};});
 const first=f.bridge.call('scan');await new Promise(resolve=>setImmediate(resolve));
 await assert.rejects(f.bridge.call('stop'),/Дождитесь/);
 awaiting.child.send({id:awaiting.message.id,ok:false,error:'scan failed'});await assert.rejects(first,/scan failed/);
 const second=f.bridge.call('stop');await new Promise(resolve=>setImmediate(resolve));
 awaiting.child.send({id:awaiting.message.id,ok:true,result:'stopped'});assert.equal(await second,'stopped');f.bridge.dispose();
});
test('Process death rejects outstanding request and emits disconnected state',async()=>{
 const f=fixture(child=>setImmediate(()=>child.emit('close',1)));
 await assert.rejects(f.bridge.call('connect'),/завершён/);assert.ok(f.events.some(event=>event.event==='disconnected'));f.bridge.dispose();
});
test('Events interleaved with replies do not complete unrelated requests',async()=>{
 const f=fixture((child,message)=>{child.send({event:'progress',percent:50});child.send({id:message.id,ok:true,result:{bytes:72}});});
 assert.deepEqual(await f.bridge.call('upload'),{bytes:72});assert.equal(f.events[0].percent,50);f.bridge.dispose();
});
