// Build-time only. The installed extension never downloads or installs Python packages.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const https = require('node:https');
const {spawnSync} = require('node:child_process');
const {checkRuntime, digest} = require('./check-runtime');
const root = path.resolve(__dirname, '..');
const lockPath = path.join(root, 'runtime-packages.json');
const target = path.join(root, 'runtime', 'win32-x64');

function download(url, destination, hash, redirects = 0) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, response => {
            if ([301,302,303,307,308].includes(response.statusCode)) {
                response.resume();
                if (redirects >= 5) return reject(Error('Слишком много перенаправлений.'));
                const next = new URL(response.headers.location, url);
                if (next.protocol !== 'https:') return reject(Error('Требуется HTTPS.'));
                return download(next.href, destination, hash, redirects + 1).then(resolve, reject);
            }
            if (response.statusCode !== 200) { response.resume(); return reject(Error('HTTP ' + response.statusCode + ': ' + url)); }
            const output = fs.createWriteStream(destination);
            const fail = error => { output.destroy(); response.destroy(); reject(error); };
            response.on('error', fail); output.on('error', fail);
            output.on('finish', () => output.close(() => {
                if (digest(fs.readFileSync(destination)) !== hash) reject(Error('Не совпал SHA-256: ' + path.basename(destination)));
                else resolve();
            }));
            response.pipe(output);
        });
        req.setTimeout(60000, () => req.destroy(Error('Тайм-аут загрузки: ' + url)));
        req.on('error', reject);
    });
}

function extract(archive, directory) {
    fs.mkdirSync(directory, {recursive:true});
    const result = spawnSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command', "Expand-Archive -LiteralPath $env:ZMROBO_BUILD_ARCHIVE -DestinationPath $env:ZMROBO_BUILD_DESTINATION -Force -ErrorAction Stop"],
        {env:{...process.env,ZMROBO_BUILD_ARCHIVE:archive,ZMROBO_BUILD_DESTINATION:directory},encoding:'utf8',shell:false,windowsHide:true,timeout:120000});
    if (result.error || result.status !== 0) throw Error('Распаковка runtime: ' + (result.error?.message || result.stderr));
}

function files(directory, prefix = '') {
    return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
        const relative = prefix + entry.name;
        return entry.isDirectory() ? files(path.join(directory, entry.name), relative + '/') : [relative];
    }).sort();
}

async function main() {
    try { checkRuntime(false); console.log('Встроенная среда готова; повторная загрузка не требуется.'); return; }
    catch (error) { if (fs.existsSync(target)) throw error; }
    if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('Сборка runtime выполняется на Windows x64. Используйте готовую папку runtime из архива.');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zmrobo-runtime-'));
    const staging = path.join(temporary, 'runtime');
    try {
        console.log('Подготовка встроенного Python и библиотек для VSIX…');
        const pythonZip = path.join(temporary, 'python.zip');
        await download(lock.pythonArchive.url, pythonZip, lock.pythonArchive.sha256);
        extract(pythonZip, staging);
        for (const item of lock.packages) {
            console.log(item.name + ' ' + item.version);
            const archive = path.join(temporary, item.filename + '.zip');
            await download(item.url, archive, item.sha256);
            extract(archive, path.join(staging, 'site-packages'));
        }
        // _pth makes imports independent of PATH, installed Python and controller stubs.
        fs.writeFileSync(path.join(staging, 'python313._pth'), 'python313.zip\n.\nsite-packages\n../../python\nimport site\n');
        for (const name of files(staging).filter(name => /\.md$/i.test(name))) fs.renameSync(path.join(staging,name),path.join(staging,name.replace(/\.md$/i,'.txt')));
        const manifest = {python:lock.python, platform:lock.platform, lockSha256:digest(fs.readFileSync(lockPath)),
            packages:lock.packages.map(({name,version}) => ({name,version})),
            files:files(staging).map(name => ({path:name,sha256:digest(fs.readFileSync(path.join(staging,name)))}))};
        fs.writeFileSync(path.join(staging,'runtime.json'), JSON.stringify(manifest,null,2)+'\n');
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.renameSync(staging,target);
        checkRuntime(false);
    } finally { fs.rmSync(temporary,{recursive:true,force:true}); }
}
module.exports = {download, files};
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode=1; });
