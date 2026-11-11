'use strict';
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const required=require('./simulator-files.json');
const root=path.resolve(__dirname,'..');
const command='zmrobo2d.open';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function manifestErrors(manifest) {
    const errors=[];
    if(manifest.name!=='rcu-extension'||manifest.publisher!=='IofeKirill')errors.push('Ожидается расширение IofeKirill.rcu-extension.');
    if(manifest.main!=='./simulator/integrated-host.js')errors.push('Не подключена точка запуска 2D-модели.');
    if(manifest.zmrobo2dOriginalMain!=='./out/extension.js')errors.push('Не сохранена исходная точка запуска расширения.');
    if(!manifest.activationEvents?.includes('onCommand:'+command))errors.push('Нет активации команды 2D-модели.');
    if(!manifest.contributes?.commands?.some(c=>c.command===command))errors.push('Команда 2D-модели не зарегистрирована.');
    return errors;
}
function checkSource() {
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
    const errors=manifestErrors(manifest);
    for(const name of required) {
        const file=path.join(root,'simulator',name);
        if(!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.statSync(file).size)errors.push('Отсутствует файл simulator/'+name);
    }
    if(!fs.existsSync(path.join(root,'out','extension.js')))errors.push('Нет out/extension.js. Сначала выполните npm run compile.');
    return errors;
}
// Read only the ZIP directory and requested entries; do not load the whole Windows runtime.
function zipReader(filename) {
    const fd=fs.openSync(filename,'r');
    function read(offset,length) {
        if(length<0||offset<0)throw Error('Некорректный ZIP.');
        const buffer=Buffer.alloc(length);let done=0;
        while(done<length){const n=fs.readSync(fd,buffer,done,length-done,offset+done);if(!n)throw Error('Обрезанный ZIP.');done+=n;}
        return buffer;
    }
    try {
        const size=fs.fstatSync(fd).size;
        const tail=read(Math.max(0,size-65557),Math.min(size,65557));let end=-1;
        for(let i=tail.length-22;i>=0;i--)if(tail.readUInt32LE(i)===0x06054b50&&i+22+tail.readUInt16LE(i+20)===tail.length){end=i;break;}
        if(end<0)throw Error('Не найдена структура VSIX/ZIP.');
        const count=tail.readUInt16LE(end+10),offset=tail.readUInt32LE(end+16);
        if(count===65535||offset===0xffffffff)throw Error('ZIP64 не поддерживается этой проверкой.');
        const entries=new Map();let cursor=offset;
        for(let i=0;i<count;i++) {
            const h=read(cursor,46);if(h.readUInt32LE(0)!==0x02014b50)throw Error('Повреждён каталог ZIP.');
            const length=h.readUInt16LE(28),extra=h.readUInt16LE(30),comment=h.readUInt16LE(32);
            const name=read(cursor+46,length).toString('utf8');
            if(entries.has(name))throw Error('Повторяется имя файла в ZIP: '+name);
            entries.set(name,{flags:h.readUInt16LE(8),method:h.readUInt16LE(10),compressed:h.readUInt32LE(20),size:h.readUInt32LE(24),offset:h.readUInt32LE(42)});
            cursor+=46+length+extra+comment;
        }
        function bytes(name) {
            const e=entries.get(name);if(!e)throw Error('Нет файла в VSIX: '+name);
            if(e.flags&1)throw Error('Зашифрованный ZIP не поддерживается.');
            if(e.size>20_000_000||e.compressed>20_000_000)throw Error('Слишком большой проверяемый файл: '+name);
            const h=read(e.offset,30);if(h.readUInt32LE(0)!==0x04034b50)throw Error('Повреждён заголовок ZIP.');
            const data=read(e.offset+30+h.readUInt16LE(26)+h.readUInt16LE(28),e.compressed);
            const unpacked=e.method===0?data:e.method===8?zlib.inflateRawSync(data,{maxOutputLength:20_000_000}):null;
            if(!unpacked||unpacked.length!==e.size)throw Error('Не удалось распаковать '+name);
            return unpacked;
        }
        return {entries,bytes,close:()=>fs.closeSync(fd)};
    } catch(error){fs.closeSync(fd);throw error;}
}
function checkVsix(filename) {
    const archive=zipReader(filename);
    try {
        const manifest=JSON.parse(archive.bytes('extension/package.json').toString('utf8'));
        const source=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
        const errors=manifestErrors(manifest);
        if(manifest.version!==source.version)errors.push('Версия VSIX '+manifest.version+' отличается от версии проекта '+source.version+'.');
        if(!archive.entries.get('extension/out/extension.js')?.size)errors.push('В VSIX нет скомпилированного основного расширения.');
        for(const name of required) {
            const entry='extension/simulator/'+name;
            if(!archive.entries.get(entry)?.size){errors.push('В VSIX нет simulator/'+name);continue;}
            if(hash(archive.bytes(entry))!==hash(fs.readFileSync(path.join(root,'simulator',name))))errors.push('В VSIX устаревший или изменённый файл: simulator/'+name);
        }
        return errors;
    } finally{archive.close();}
}
function fail(errors){if(errors.length)throw Error('Проверка 2D-модели не пройдена:\n'+errors.map(e=>'— '+e).join('\n'));}
if(require.main===module) {
    try {
        const args=process.argv.slice(2);
        if(args.length&&!(args.length===2&&args[0]==='--vsix'))throw Error('Использование: node scripts/check-simulator.js [--vsix файл.vsix]');
        fail(args.length?checkVsix(path.resolve(args[1])):checkSource());
        console.log(args.length?'VSIX проверен: версия, точки запуска и все файлы симулятора совпадают с проектом.':'2D-модель: все '+required.length+' файлов и точка запуска на месте.');
    } catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={checkSource,checkVsix,fail,zipReader};
