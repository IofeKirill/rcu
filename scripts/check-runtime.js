const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const runtime = path.join(root, 'runtime', 'win32-x64');
const digest = data => crypto.createHash('sha256').update(data).digest('hex');

function checkRuntime(runProbe = process.platform === 'win32', directory = runtime) {
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'runtime-packages.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'runtime.json'), 'utf8'));
    if (manifest.lockSha256 !== digest(fs.readFileSync(path.join(root, 'runtime-packages.json')))) throw Error('Изменился список библиотек встроенной среды. Пересоберите runtime.');
    if (manifest.python !== lock.python || manifest.platform !== 'win32-x64' || !Array.isArray(manifest.files) || !manifest.files.length) throw Error('Некорректный runtime.json.');
    for (const file of manifest.files) {
        const absolute = path.resolve(directory, file.path);
        if (!absolute.startsWith(path.resolve(directory) + path.sep)) throw Error('Некорректный путь runtime: ' + file.path);
        if (digest(fs.readFileSync(absolute)) !== file.sha256) throw Error('Повреждён файл встроенной среды: ' + file.path);
    }
    for (const required of ['python.exe','python313.dll','python313.zip','python313._pth','site-packages/bleak/__init__.py','site-packages/serial/__init__.py']) {
        if (!manifest.files.some(file => file.path === required)) throw Error('Отсутствует компонент runtime: ' + required);
    }
    const exe = fs.readFileSync(path.join(directory, 'python.exe'));
    const pe = exe.readUInt32LE(0x3c);
    if (exe.toString('ascii', 0, 2) !== 'MZ' || exe.toString('ascii', pe, pe + 2) !== 'PE' || exe.readUInt16LE(pe + 4) !== 0x8664) throw Error('Python должен быть Windows x64.');
    if (runProbe) {
        if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('Проверку запуска выполняйте на Windows x64.');
        const env = {...process.env, PATH:'', PYTHONIOENCODING:'utf-8'};
        delete env.PYTHONHOME; delete env.PYTHONPATH;
        const result = spawnSync(path.join(directory, 'python.exe'), ['-u', path.join(root, 'python', 'runtime_probe.py')], {env, encoding:'utf8', windowsHide:true, shell:false, timeout:50000});
        if (result.error || result.status !== 0) throw Error('Проверка встроенного Python не прошла: ' + (result.error?.message || result.stderr || result.stdout));
        console.log('Встроенная среда: ' + result.stdout.trim());
    }
    return manifest;
}
module.exports = {checkRuntime, digest};
if (require.main === module) {
    try { const result = checkRuntime(); console.log('Runtime проверен: ' + result.files.length + ' файлов.'); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}
