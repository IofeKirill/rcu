const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
async function checkC(runCompiler=process.platform==='win32') {
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'c-toolchain.json'),'utf8'));
    for(const item of manifest.files) {
        const file=path.resolve(root,item.path);
        if(!file.startsWith(root+path.sep)||hash(fs.readFileSync(file))!==item.sha256)throw Error('Повреждён компонент C: '+item.path);
    }
    if(runCompiler) {
        const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-c-check-'));
        try {
            const {compileC}=require('../out/CCompiler');
            const source=fs.readFileSync(path.join(root,'examples','C_01_display.c'),'utf8');
            const result=await compileC(root,path.join(directory,'test.c'),source,line=>console.log(line),process.platform==='win32'?'':process.env.ZMROBO_TEST_C_COMPILER||'');
            if(result.bytes.readUInt32LE(0)!==0x20020000 || result.bytes.readUInt32LE(4)<0x080e0000)throw Error('Некорректный образ E6.');
        } finally {fs.rmSync(directory,{recursive:true,force:true});}
    }
    return manifest;
}
module.exports={checkC};
if(require.main===module)checkC().then(()=>console.log('Комплект C проверен.')).catch(error=>{console.error(error.message);process.exitCode=1;});
