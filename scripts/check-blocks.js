'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), required = require('./blocks-files.json');
function checkManifest(m) { if (!m.contributes?.customEditors?.some(e => e.viewType === 'zmrobo.blocks'))
    throw Error('Не зарегистрирован редактор блоков.'); }
function checkSource() { checkManifest(require('../package.json')); for (const p of required)
    if (!fs.existsSync(path.join(root, p)))
        throw Error('Отсутствует файл блоков: ' + p); return true; }
function checkVsix(file) { const { zipReader } = require('./check-simulator'), z = zipReader(file), hash = b => crypto.createHash('sha256').update(b).digest('hex'); try {
    checkManifest(JSON.parse(z.bytes('extension/package.json')));
    for (const p of required)
        if (hash(z.bytes('extension/' + p)) !== hash(fs.readFileSync(path.join(root, p))))
            throw Error('В VSIX другая версия файла ' + p);
}
finally {
    z.close();
} }
module.exports = { checkSource, checkVsix };
if (require.main === module) {
    try {
        if (process.argv[2])
            checkVsix(path.resolve(process.argv[2]));
        else
            checkSource();
        console.log('Блоки: все файлы и регистрация редактора на месте.');
    }
    catch (e) {
        console.error(e.message);
        process.exitCode = 1;
    }
}
