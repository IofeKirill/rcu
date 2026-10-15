const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {connectionPython, bundledConnectionRuntime} = require('../out/ConnectionRuntime');
const {checkRuntime, digest} = require('../scripts/check-runtime');
const root = path.resolve(__dirname, '..');

test('Clean Windows selects the shipped executable by absolute path, including spaces and Cyrillic', () => {
    const folder = path.join(os.tmpdir(), 'ZMROBO чистый компьютер');
    const result = connectionPython(folder, '', 'win32', 'x64', () => true);
    assert.equal(result, path.join(folder, 'runtime', 'win32-x64', 'python.exe'));
    assert.ok(path.isAbsolute(result));
    assert.equal(bundledConnectionRuntime('', 'win32'), true);
});
test('A missing Windows bundle fails visibly and never falls back to installed Python', () => {
    assert.throws(() => connectionPython(root, '', 'win32', 'x64', () => false), /встроенная среда/);
    assert.throws(() => connectionPython(root, '', 'win32', 'arm64', () => true), /Windows x64/);
});
test('An explicit external interpreter remains available and other platforms retain their runtime', () => {
    assert.equal(connectionPython(root, ' C:\\Custom Python\\python.exe ', 'win32', 'x64', () => false), 'C:\\Custom Python\\python.exe');
    assert.equal(connectionPython(root, '', 'linux', 'x64', () => false), 'python3');
    assert.equal(bundledConnectionRuntime('/custom/python', 'win32'), false);
});
test('The real shipped runtime contains all locked libraries and matching binary hashes', () => {
    const result = checkRuntime(false);
    assert.equal(result.platform, 'win32-x64');
    const names = result.packages.map(item => item.name);
    assert.ok(names.includes('bleak')); assert.ok(names.includes('pyserial')); assert.ok(names.includes('winrt-runtime'));
    const pth = fs.readFileSync(path.join(root,'runtime/win32-x64/python313._pth'),'utf8').trim().split(/\r?\n/);
    assert.deepEqual(pth,['python313.zip','.','site-packages','../../python','import site']);
    assert.ok(result.files.some(file => /\.pyd$/.test(file.path) && file.path.includes('winrt')));
});
test('Corrupted runtime files and stale dependency manifests stop packaging', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-corrupt-'));
    try {
        const manifest = JSON.parse(fs.readFileSync(path.join(root,'runtime/win32-x64/runtime.json'),'utf8'));
        manifest.files = [{path:'broken.dll',sha256:digest(Buffer.from('expected'))}];
        fs.writeFileSync(path.join(directory,'broken.dll'),'corrupt');
        fs.writeFileSync(path.join(directory,'runtime.json'),JSON.stringify(manifest));
        assert.throws(() => checkRuntime(false,directory), /Повреждён/);
        manifest.lockSha256='outdated';fs.writeFileSync(path.join(directory,'runtime.json'),JSON.stringify(manifest));
        assert.throws(() => checkRuntime(false,directory), /Изменился список/);
    } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});

const {checkEntries}=require('../scripts/check-vsix');
test('Final VSIX validation rejects an omitted standard library zip or native dependency',()=>{
 const manifest=checkRuntime(false);
 const entries=manifest.files.map(f=>'extension/runtime/win32-x64/'+f.path);
 entries.push('extension/runtime/win32-x64/runtime.json','extension/python/bluetooth_bridge.py','extension/python/usb_bridge.py','extension/python/bluetooth_protocol.py','extension/python/usb_identity.py','extension/python/usb_identity.ps1','extension/out/ConnectionRuntime.js');
 const cManifest=require('../c-toolchain.json');
 entries.push(...cManifest.files.map(f=>'extension/'+f.path),'extension/c-toolchain.json','extension/out/CCompiler.js','extension/examples/C_01_display.c','extension/examples/C_02_motors.c','extension/examples/C_03_line_pd.c');
 assert.doesNotThrow(()=>checkEntries(entries,manifest));
 assert.throws(()=>checkEntries(entries.filter(e=>!e.endsWith('/python313.zip')),manifest),/python313.zip/);
 const native=entries.find(e=>e.includes('winrt')&&e.endsWith('.pyd'));
 assert.throws(()=>checkEntries(entries.filter(e=>e!==native),manifest),/отсутствуют/);
});
