const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),errors=[];
const exists=file=>fs.existsSync(path.join(root,file));
function check(file){if(!exists(file))errors.push('Отсутствует файл: '+file);}
if(manifest.version!=='4.0.0'||manifest.publisher!=='IofeKirill'||manifest.name!=='rcu-extension')errors.push('Изменены версия, имя или publisher.');
for(const file of [manifest.main,manifest.icon,'README.md','CHANGELOG.md','commands-info.html','python/bluetooth_bridge.py','python/bluetooth_protocol.py','python/usb_bridge.py','python/usb_identity.py','python/usb_identity.ps1','docs/AICAM_GUIDE.html','stub_libs/gyro_lib.py'])check(file);
for(const grammar of manifest.contributes.grammars||[])check(grammar.path);
for(const views of Object.values(manifest.contributes.viewsContainers||{}))for(const view of views)if(view.icon)check(view.icon);
for(const library of ['rcu','motor','move','servo','sensor','ai','trace','display','actuator','rf','iot','aicam'])if(!exists('stub_libs/'+library+'.pyi')&&!exists('stub_libs/'+library+'.py'))errors.push('Отсутствуют подсказки: '+library);
if(exists(manifest.main))for(const item of require(path.join(root,'out','ProgramExamples.js')).PROGRAM_EXAMPLES)check('examples/'+item.file);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Ресурсы релиза 4.0.0 на месте.');
