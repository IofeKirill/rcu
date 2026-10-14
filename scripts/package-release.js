const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const filename = manifest.name + '-' + manifest.version + '.vsix';
if (process.platform !== 'win32' || process.arch !== 'x64') {
    console.error('Соберите Windows-сборку на Windows x64.'); process.exit(1);
}
// cmd.exe only runs this fixed command on the developer machine; no user input is interpolated.
if (!/^[a-z0-9-]+$/.test(manifest.name) || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw Error('Некорректное имя или версия пакета.');
const result = spawnSync('cmd.exe', ['/d','/s','/c','npx.cmd @vscode/vsce package --out ' + filename], {cwd:root,stdio:'inherit',shell:false});
if (result.error || result.status !== 0) { console.error(result.error?.message || 'Упаковка завершилась с ошибкой.'); process.exit(1); }
const check = spawnSync(process.execPath,[path.join(__dirname,'check-vsix.js'),path.join(root,filename)],{cwd:root,stdio:'inherit',shell:false});
process.exit(check.status === 0 ? 0 : 1);
