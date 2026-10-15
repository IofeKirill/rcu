const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {cCode,cWrapper,compileC}=require('../out/CCompiler');
const {C_COMMANDS,C_TREE}=require('../out/CCommands');
const {C_SIGNATURES}=require('../out/CSDK');
const {getCPortRows,buildCPortEdit,cSettingsBlock}=require('../out/CPortSettings');
const root=path.resolve(__dirname,'..');
test('C wrapper enables used SDK functions while ignoring comments and literals',()=>{
 const source='#define _TASK_1_ 1\n#include "zmrobo.h"\nvoid task1(void){ SetMotor(1,30); } // GetIR(1)\nconst char *s="GetGesture(1)";';
 const wrapper=cWrapper(source,'C:\\Project\\program.c');
 assert.match(wrapper,/#define _SETMOTOR_ 1/);assert.doesNotMatch(wrapper,/#define _GETIR_/);assert.doesNotMatch(wrapper,/#define _GETGESTURE_/);
 assert.match(wrapper,/#include "C:\/Project\/program.c"/);assert.equal(cCode('"SetMotor"\n// GetData').split('\n').length,2);
});
test('C catalog uses actual SDK signatures and each tree leaf is registered',()=>{
 const walk=nodes=>nodes.flatMap(n=>[n,...walk(n.children||[])]);
 for(const item of walk(C_TREE).filter(n=>n.commandId))assert.ok(C_COMMANDS[item.commandId]);
 assert.equal(C_SIGNATURES.length,271);
 assert.equal(Object.keys(C_COMMANDS).filter(id=>/^c\.[A-Z]/.test(id)).length,251);
 assert.equal(C_COMMANDS['c.GetGesture'],undefined);
 assert.throws(()=>cWrapper('void task1(void){GetGesture(1);}','probe.c'),/не поддерживается/);
 assert.match(cWrapper('void task1(void){GetIOTData(1,0,0);}','probe.c'),/#define _SETIOTCONFIG_ 1/);
 assert.match(C_COMMANDS['c.SetMotor'].signature,/uint8_t which,int speed/);
 assert.match(C_COMMANDS['c.GetData'].signature,/uint16_t/);
 assert.ok(C_COMMANDS['c.SetMotor'].snippet.endsWith(';'));
 assert.equal(C_TREE.at(-1).label,'Циклы, условия и функции');
});
test('C ports round-trip four motors and eight sensors, aliases and case without Python syntax',()=>{
 const text='#define _TASK_1_ 1\n#include "zmrobo.h"\n// ---------- Настройки моторов и датчиков ----------\n#define LeftMotor 1  // устройство подключено на порт Motor 1\n#define LIGHT 6  // устройство подключено на порт Sensor 5\n#define SPEED 30\n// моя заметка\n// --------------------------------------------------\nvoid task1(void){}\n';
 const rows=getCPortRows(text);assert.equal(rows.length,12);assert.equal(rows[0].names,'LeftMotor');assert.equal(rows[9].names,'LIGHT');
 rows[3].names='MOTOR_FOUR';rows[11].names='SENSOR_EIGHT';rows[0].names='LeftMotor, M1';
 const edit=buildCPortEdit(text,rows);const updated=text.slice(0,edit.start)+edit.replacement+text.slice(edit.end);
 assert.match(updated,/#define MOTOR_FOUR 4/);assert.match(updated,/#define SENSOR_EIGHT 8/);assert.match(updated,/#define M1 1/);
 assert.match(updated,/#define SPEED 30/);assert.match(updated,/моя заметка/);assert.match(updated,/void task1/);
 assert.equal(getCPortRows(updated)[0].names,'LeftMotor, M1');assert.ok(cSettingsBlock(updated));
});
test('Invalid C source reports compile errors instead of producing an uploadable binary',{skip:process.platform!=='win32'&&!process.env.ZMROBO_TEST_C_COMPILER},async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-c-error-'));
 try {await assert.rejects(compileC(root,path.join(directory,'bad.c'),'void task1(void) { syntax error }',()=>{},process.env.ZMROBO_TEST_C_COMPILER||''),/Ошибка сборки C/);assert.equal(fs.existsSync(path.join(directory,'.zmrobo-build/bad.bin')),false);}
 finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('Actual compiler links the E6 SDK for display, motors and sensor reads',{skip:process.platform!=='win32'&&!process.env.ZMROBO_TEST_C_COMPILER},async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-c-real-'));
 try {
  const source='#define _TASK_1_ 1\n#include "zmrobo.h"\nvoid task1(void) { SetDisplayString(1,(int8_t*)"C TEST",65535,0); SetMotor(1,GetData(1)); GetLightSensor(5); SetWaitForTime(0.1); SetMotorStop(1); }\n';
  const result=await compileC(root,path.join(directory,'test.c'),source,()=>{},process.env.ZMROBO_TEST_C_COMPILER||'');
  assert.equal(result.name,'test.bin');assert.ok(result.bytes.length>1024&&result.bytes.length<=131072);
  assert.deepEqual(fs.readFileSync(result.file),result.bytes);
  const initialStack=result.bytes.readUInt32LE(0),reset=result.bytes.readUInt32LE(4);
  assert.equal(initialStack,0x20020000);assert.ok(reset>=0x080e0000&&reset<0x08100000);
 } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
