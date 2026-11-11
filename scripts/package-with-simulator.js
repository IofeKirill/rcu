'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {checkVsix,fail}=require('./check-simulator');
const root=path.resolve(__dirname,'..');
const started=Date.now();
// Preserve the project's existing Windows runtime preparation and packaging steps.
const result=spawnSync(process.execPath,[path.join(__dirname,'package-release.js'),...process.argv.slice(2)],{cwd:root,stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exit(1);}
if(result.status!==0)process.exit(result.status||1);
try {
    const found=new Set();
    function scan(directory,depth=0) {
        if(!fs.existsSync(directory))return;
        for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
            const file=path.join(directory,entry.name);
            if(entry.isFile()&&entry.name.toLowerCase().endsWith('.vsix')&&fs.statSync(file).mtimeMs>=started-2000)found.add(file);
            else if(depth<2&&entry.isDirectory()&&['dist','release','releases','build','artifacts','packages'].includes(entry.name))scan(file,depth+1);
        }
    }
    scan(root);
    const at=process.argv.indexOf('--out');
    if(at>=0&&process.argv[at+1]){const file=path.resolve(root,process.argv[at+1]);if(fs.existsSync(file)&&fs.statSync(file).isFile())found.add(file);}
    if(!found.size)throw Error('Упаковка завершилась, но новый VSIX не найден. Проверьте его явно: npm run check:simulator -- --vsix ПУТЬ_К_VSIX');
    for(const file of found){fail(checkVsix(file));require('./check-blocks').checkVsix(file);console.log('Проверен VSIX с 2D-моделью: '+file);}
} catch(error){console.error(error.message);process.exitCode=1;}
