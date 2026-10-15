const fs = require('node:fs'), path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');

function checkEntries(entries, manifest) {
    const present = new Set(entries);
    const required = manifest.files.map(file => 'extension/runtime/win32-x64/' + file.path);
    required.push('extension/runtime/win32-x64/runtime.json', 'extension/python/bluetooth_bridge.py',
        'extension/python/usb_bridge.py', 'extension/python/bluetooth_protocol.py', 'extension/python/usb_identity.py',
        'extension/python/usb_identity.ps1', 'extension/out/ConnectionRuntime.js');
    const cManifest=JSON.parse(fs.readFileSync(path.join(root,'c-toolchain.json'),'utf8'));
    required.push(...cManifest.files.map(file=>'extension/'+file.path),'extension/c-toolchain.json','extension/out/CCompiler.js','extension/examples/C_01_display.c','extension/examples/C_02_motors.c','extension/examples/C_03_line_pd.c');
    const missing = required.filter(file => !present.has(file));
    if (missing.length) throw Error('В VSIX отсутствуют файлы подключения:\n' + missing.join('\n'));
}
module.exports = {checkEntries};
if (require.main === module) {
    try {
        if (process.platform !== 'win32') throw Error('Проверку VSIX выполняйте на Windows.');
        const file = path.resolve(process.argv[2] || '');
        if (!process.argv[2] || !fs.statSync(file).isFile()) throw Error('Укажите собранный VSIX.');
        const result = spawnSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command',
            "[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead($env:ZMROBO_CHECK_VSIX); try { ConvertTo-Json -Compress -InputObject @($z.Entries | ForEach-Object { $_.FullName }) } finally { $z.Dispose() }"],
            {env:{...process.env,ZMROBO_CHECK_VSIX:file},encoding:'utf8',windowsHide:true,shell:false,timeout:30000});
        if (result.error || result.status !== 0) throw Error(result.error?.message || result.stderr);
        checkEntries(JSON.parse(result.stdout.replace(/^\uFEFF/,'')),JSON.parse(fs.readFileSync(path.join(root,'runtime/win32-x64/runtime.json'),'utf8')));
        console.log('VSIX содержит встроенный Python и все библиотеки подключения.');
    } catch (error) { console.error(error.message); process.exitCode=1; }
}
