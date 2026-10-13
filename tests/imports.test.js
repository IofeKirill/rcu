const test=require('node:test');
const assert=require('node:assert/strict');
const {planCommandImports,LIBRARY_COMMENTS}=require('../out/PythonImports');
const {SETTINGS_START,SETTINGS_END}=require('../out/PortSettings');
const apply=(text,plan)=>text.slice(0,plan.offset)+plan.imports+text.slice(plan.offset);
const snippet='motor.SetMotor(${1:1}, ${2:50})';

test('Autoimports add only the required library with a comment and do not duplicate it',()=>{
 const text='import rcu\n\ndef task1():\n    pass\n';
 const plan=planCommandImports(text,snippet);assert.match(plan.imports,/^import motor  # /);
 const changed=apply(text,plan);assert.equal(planCommandImports(changed,snippet).imports,'');
 assert.equal(changed.match(/^import motor/gm).length,1);assert.doesNotMatch(changed,/import sensor/);
});
test('Module and combined imports respect aliases',()=>{
 for(const text of ['import motor as m\n','import rcu, motor as m, sensor\n']){
  const p=planCommandImports(text,snippet);assert.equal(p.imports,'');assert.match(p.snippet,/^m\.SetMotor\(/);
 }
 assert.equal(planCommandImports('import rcu, motor\n',snippet).imports,'');
});
test('From imports support aliases and multiline lists; unrelated functions need a module binding',()=>{
 let p=planCommandImports('from motor import SetMotor as run\n',snippet);assert.equal(p.imports,'');assert.match(p.snippet,/^run\(/);
 p=planCommandImports('from motor import (\n    SetMotor as run,\n    GetMotorCode,\n)\n',snippet);assert.equal(p.imports,'');assert.match(p.snippet,/^run\(/);
 p=planCommandImports('from motor import GetMotorCode\n',snippet);assert.match(p.imports,/import motor/);
 p=planCommandImports('from motor import *\n',snippet);assert.equal(p.imports,'');assert.match(p.snippet,/^SetMotor\(/);
});
test('Docstrings, commented imports, conditional and function imports do not suppress autoimports',()=>{
 for(const text of ['# import motor\n','"""\nimport motor\n"""\n','s = "import motor"\n','def f():\n    import motor\n','if True:\n    import motor\n']){
  assert.match(planCommandImports(text,snippet).imports,/import motor/);
 }
});
test('Imports follow shebang, encoding, docstring and future imports; stay outside port blocks',()=>{
 const header='#!/usr/bin/python\n# coding: utf-8\n"""Doc\ntext\n"""\nfrom __future__ import annotations\nimport rcu\n\n';
 const text=header+SETTINGS_START+'\nLEFT = 1  # устройство подключено на порт Motor 1\n'+SETTINGS_END+'\n';
 const p=planCommandImports(text,snippet);assert.equal(p.offset,header.length-1);
 assert.ok(apply(text,p).indexOf('import motor')<apply(text,p).indexOf(SETTINGS_START));
});
test('CRLF and import-only files without final newline stay valid',()=>{
 const p=planCommandImports('import rcu',snippet);assert.match(apply('import rcu',p),/^import rcu\nimport motor/);
 const text='import rcu\r\n\r\ndef task1():\r\n    pass\r\n';
 const changed=apply(text,planCommandImports(text,snippet));assert.equal(changed.replace(/\r\n/g,'').includes('\n'),false);
});
test('Control snippets and object methods need no library; quoted code is not rewritten',()=>{
 for(const s of ['if ${1:condition}:\n    pass','def sgn(value):\n    return 0','gyro.ReadGyro()','print("motor.SetMotor(1, 2)")'])assert.equal(planCommandImports('',s).imports,'');
 const p=planCommandImports('import motor as m\n','motor.SetMotor(1, "motor.SetMotor(2, 3)")');
 assert.equal(p.snippet,'m.SetMotor(1, "motor.SetMotor(2, 3)")');
});
test('Every actual library used in catalog snippets has a known import description',()=>{
 const {COMMANDS}=require('../out/CommandCatalog');
 for(const id of Object.keys(COMMANDS)){
  const p=planCommandImports('',COMMANDS[id].snippet);
  if(COMMANDS[id].snippet && /^(motor|sensor|rcu|aicam|iot|actuator|display|rf|move|servo|ai|trace)\./.test(id))assert.ok(p.imports,id);
 }
 assert.match(LIBRARY_COMMENTS.gyro_lib,/гироскоп/);
});


test('Repeated different autoimports form one compact block with the original blank line after it',()=>{
 let text='import rcu  # controller\n\ndef task1():\n    pass\n';
 for(const module of ['motor','sensor','iot'])text=apply(text,planCommandImports(text,module+'.Call()'));
 assert.match(text,/import rcu[^\n]*\nimport motor[^\n]*\nimport sensor[^\n]*\nimport iot[^\n]*\n\ndef/);
 assert.equal(text.split('def task1')[0].match(/\n\n/g).length,1);
});
