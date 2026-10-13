const {spawnSync}=require('node:child_process');
const executable=process.env.ZMROBO_TEST_PYTHON||(process.platform==='win32'?'py':'python3');
const result=spawnSync(executable,['-m','unittest','discover','-s','tests/python','-v'],{stdio:'inherit',shell:false});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exit(result.status===null?1:result.status);
