'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const required=require('../scripts/simulator-files.json');
const crcTable=Array.from({length:256},(_,i)=>{for(let b=0;b<8;b++)i=i&1?(i>>>1)^0xedb88320:i>>>1;return i>>>0;});
function crc32(data){let sum=0xffffffff;for(const b of data)sum=crcTable[(sum^b)&255]^(sum>>>8);return (sum^0xffffffff)>>>0;}
function zip(entries,compress=false) {
    const local=[],central=[];let offset=0;
    for(const [name,content] of entries) {
        const filename=Buffer.from(name),data=Buffer.from(content),bytes=compress?zlib.deflateRawSync(data):data;
        const h=Buffer.alloc(30),c=Buffer.alloc(46),crc=crc32(data);
        h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(compress?8:0,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(bytes.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(filename.length,26);
        c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(compress?8:0,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(filename.length,28);c.writeUInt32LE(offset,42);
        local.push(h,filename,bytes);central.push(c,filename);offset+=h.length+filename.length+bytes.length;
    }
    const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.size,8);end.writeUInt16LE(entries.size,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
    return Buffer.concat([...local,directory,end]);
}
function fixture(t) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-release-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
    fs.cpSync(path.join(root,'simulator'),path.join(dir,'simulator'),{recursive:true});
    fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'out'));
    for(const file of ['check-simulator.js','simulator-files.json','package-with-simulator.js'])fs.copyFileSync(path.join(root,'scripts',file),path.join(dir,'scripts',file));
    fs.copyFileSync(path.join(root,'package.json'),path.join(dir,'package.json'));fs.writeFileSync(path.join(dir,'out','extension.js'),'exports.activate=()=>{};');
    const checker=require(path.join(dir,'scripts','check-simulator.js'));
    const entries=new Map([['extension/package.json',fs.readFileSync(path.join(dir,'package.json'))],['extension/out/extension.js',fs.readFileSync(path.join(dir,'out','extension.js'))]]);
    for(const name of required)entries.set('extension/simulator/'+name,fs.readFileSync(path.join(dir,'simulator',name)));
    const archive=(compress=false)=>{const file=path.join(dir,'test.vsix');fs.writeFileSync(file,zip(entries,compress));return file;};
    return {dir,checker,entries,archive};
}
test('runtime and stored/deflated VSIX pass',t=>{
    const f=fixture(t);assert.deepEqual(f.checker.checkSource(),[]);
    assert.deepEqual(f.checker.checkVsix(f.archive()),[]);assert.deepEqual(f.checker.checkVsix(f.archive(true)),[]);
});
test('missing main and judge are rejected',t=>{
    const f=fixture(t);f.entries.delete('extension/simulator/task_rules.py');f.entries.delete('extension/out/extension.js');
    const errors=f.checker.checkVsix(f.archive(true));assert.ok(errors.some(e=>e.includes('task_rules.py')));assert.ok(errors.some(e=>e.includes('скомпилированного')));
});
test('stale UI asset and wrong release version are rejected',t=>{
    const f=fixture(t);f.entries.set('extension/simulator/media/view.js',Buffer.from('// old UI'));
    const manifest=JSON.parse(f.entries.get('extension/package.json'));manifest.version='4.2.2';f.entries.set('extension/package.json',Buffer.from(JSON.stringify(manifest)));
    const errors=f.checker.checkVsix(f.archive(true));assert.ok(errors.some(e=>e.includes('view.js')));assert.ok(errors.some(e=>e.includes('Версия VSIX')));
});
test('truncated archive fails clearly',t=>{
    const f=fixture(t);const file=f.archive();fs.truncateSync(file,fs.statSync(file).size-30);
    assert.throws(()=>f.checker.checkVsix(file),/VSIX\/ZIP/);
});
test('packaging wrapper rejects a VSIX that omits simulator',t=>{
    const f=fixture(t);f.entries.delete('extension/simulator/task_rules.py');const bytes=zip(f.entries,true);
    fs.writeFileSync(path.join(f.dir,'scripts','package-release.js'),"require('fs').writeFileSync('rcu-extension-4.3.0.vsix',Buffer.from("+JSON.stringify(bytes.toString('base64'))+",'base64'))");
    const result=spawnSync(process.execPath,[path.join(f.dir,'scripts','package-with-simulator.js')],{encoding:'utf8'});
    assert.equal(result.status,1);assert.match(result.stderr,/task_rules.py/);
});
