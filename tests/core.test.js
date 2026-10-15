const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ports = require('../out/PortSettings');
const {COMMANDS} = require('../out/CommandCatalog');
const trees = require('../out/CommandTrees');
const commands = new Map();
let active;
const notices = [];
class EventEmitter { constructor(){this.event=()=>({dispose(){}});} fire(){} dispose(){} }
class TreeItem { constructor(label,state){this.label=label;this.collapsibleState=state;} }
class MarkdownString { appendText(text){this.value=text;return this;} }
const vscode = {
 languages:{registerCompletionItemProvider:()=>({dispose(){}}),registerHoverProvider:()=>({dispose(){}})},
 EventEmitter, TreeItem, MarkdownString, ThemeColor:class {constructor(id){this.id=id;}}, ThemeIcon:class {constructor(id,color){this.id=id;this.color=color;}},
 TreeItemCollapsibleState:{None:0,Collapsed:1,Expanded:2}, ViewColumn:{One:1,Beside:-2},
 SnippetString:class {constructor(value){this.value=value;}},
 commands:{executeCommand:async()=>{},registerCommand(id,handler){commands.set(id,handler);return {dispose(){}};}},
 window:{createOutputChannel:()=>({appendLine(){},append(){},show(){},dispose(){}}),get activeTextEditor(){return active;},showErrorMessage:m=>notices.push(m),showInformationMessage:m=>notices.push(m),showWarningMessage:m=>notices.push(m),createTreeView(){return {dispose(){}};}},
 ConfigurationTarget:{WorkspaceFolder:3},
 workspace:{onDidChangeWorkspaceFolders:()=>({dispose(){}}),getConfiguration:()=>({get:(_key,fallback)=>fallback,update:async()=>{}})}
};
const originalLoad=Module._load;
Module._load=function(id,...args){if(id==='vscode')return vscode;return originalLoad.call(this,id,...args);};
const {DeviceTreeProvider}=require('../out/DeviceTreeProvider');
const {CommandTreeProvider}=require('../out/CommandTreeProvider');
const files=require('../out/FileOperations');
const {getProgramExamples}=require('../out/getProgramExamples');
const {programExamples}=require('../out/ProgramExamples');
const {getPortConfigurationHtml}=require('../out/PortConfiguration');
const {activate}=require('../out/extension');
const start=ports.SETTINGS_START,end=ports.SETTINGS_END;
const original='import rcu\r\n\r\n'+start+'\r\nLEFT = 1  # устройство подключено на порт Motor 1\r\nLIGHT = 5  # устройство подключено на порт Sensor 5\r\n# мой комментарий\r\n'+end+'\r\n\r\nprint(LEFT)\r\n';
const apply=(text,edit)=>text.slice(0,edit.start)+edit.replacement+text.slice(edit.end);

test('Existing names, CRLF and custom comments survive repeated saves',()=>{
 const rows=ports.getPortRows(original);assert.equal(rows[0].names,'LEFT');assert.equal(rows[12].names,'LIGHT');
 const updated=apply(original,ports.buildPortEdit(original,rows));assert.equal(updated,original);
 assert.equal(apply(updated,ports.buildPortEdit(updated,ports.getPortRows(updated))),original);
});
test('Multiple existing aliases on one port survive',()=>{
 const text=start+'\nL = 1  # устройство подключено на порт Motor 1\nLEFT = 1  # устройство подключено на порт Motor 1\n'+end;
 const rows=ports.getPortRows(text);assert.equal(rows[0].names,'L, LEFT');assert.equal(apply(text,ports.buildPortEdit(text,rows)),text);
});
test('Changing one name preserves the other ports and program',()=>{
 const rows=ports.getPortRows(original);rows[0].names='MOTOR_LEFT';const result=apply(original,ports.buildPortEdit(original,rows));
 assert.match(result,/MOTOR_LEFT = 1/);assert.match(result,/LIGHT = 5/);assert.ok(result.endsWith('print(LEFT)\r\n'));
});
test('Explicit blank deletes only that port name',()=>{
 const rows=ports.getPortRows(original);rows[0].names='';const result=apply(original,ports.buildPortEdit(original,rows));assert.doesNotMatch(result,/LEFT = 1/);assert.match(result,/LIGHT = 5/);
});
test('Reject duplicate, keyword and invalid variable names',()=>{
 for(const name of ['LEFT','for','a b','1abc','a,,b']){const rows=ports.getPortRows(original);rows[1].names=name;assert.throws(()=>ports.buildPortEdit(original,rows));}
 const rows=ports.getPortRows('');rows[0].names='левый_мотор';assert.doesNotThrow(()=>ports.buildPortEdit('',rows));
});
test('Reject malformed messages and repeated ports',()=>{
 assert.throws(()=>ports.buildPortEdit('',{}));const rows=ports.getPortRows('');rows[1]={...rows[0]};assert.throws(()=>ports.buildPortEdit('',rows));
});
test('Find matching end after start, reject damaged and duplicate blocks',()=>{
 assert.equal(ports.findSettingsBlock(end+'\n'+start+'\n'+end).start,end.length+1);
 assert.throws(()=>ports.getPortRows(start));assert.throws(()=>ports.getPortRows(start+'\n'+end+'\n'+start+'\n'+end));
});
test('Insert after module docstring and multiline imports',()=>{
 const prefix='#!/usr/bin/python\n"""Module\ndescription\n"""\nfrom x import (\n    a,\n    b,\n)\nimport rcu\n\n';
 const text=prefix+'print(a)\n';const edit=ports.buildPortEdit(text,ports.getPortRows(text));assert.equal(edit.start,prefix.length);assert.equal(edit.end,edit.start);
});
test('Handle import-only file without final newline',()=>{
 const result=apply('import rcu',ports.buildPortEdit('import rcu',ports.getPortRows('')));assert.ok(result.startsWith('import rcu\n'+start));
});
test('Every leaf has a definition; E7 shares E6 plus camera, H stays separate',()=>{
 const walk=nodes=>nodes.flatMap(n=>n.children?walk(n.children):[n]);
 for(const n of [...walk(trees.ERCU_TREE),...walk(trees.HRCU_TREE),...walk(trees.E7_TREE)]){assert.ok(COMMANDS[n.commandId],n.commandId);}
 const provider=new CommandTreeProvider('E7');assert.ok(provider.getChildren().some(n=>n.label==='ИИ-камера'));
 const e6=walk(trees.ERCU_TREE).map(n=>n.commandId),e7=walk(trees.E7_TREE).map(n=>n.commandId);
 for(const id of e6)assert.ok(e7.includes(id),id);
 assert.ok(e7.filter(id=>!e6.includes(id)).every(id=>id.startsWith('aicam.')));
 assert.ok(!walk(trees.HRCU_TREE).some(n=>/^(aicam|rf|iot|display|actuator)\./.test(n.commandId)));
 const p=new CommandTreeProvider();const first=p.getChildren();p.refresh();assert.equal(p.getChildren(),first);
});
test('Correct read snippet, separate SDK tab stops, no unnecessary condition parentheses',()=>{
 assert.equal(COMMANDS['sensor.GetSmartEyeIRcode'].snippet,'sensor.GetSmartEyeIRcode(${1:port})');
 assert.match(COMMANDS['rcu.InitXhSDK'].snippet,/\$\{2:/);
 for(const id of ['control.if','control.ifelse','control.ifelifelse','control.while','control.whiletrue']) assert.doesNotMatch(COMMANDS[id].snippet,/\b(?:if|elif|while) \(/);
});
test('GetData and SetData are second and third controller commands',()=>{
 for(const tree of [trees.ERCU_TREE,trees.HRCU_TREE]){const c=tree.find(n=>n.label==='Контроллер');assert.equal(c.children[1].label,'GetData()');assert.equal(c.children[2].label,'SetData()');}
});
test('Search row cannot be selected; icons and context survive getTreeItem',async()=>{
 const p=new DeviceTreeProvider(async()=>[{isUSB:true,description:'ZM',mountpoints:[{path:'/robot'}]}]);await p.detectDevices();
 assert.equal(p.selectDevice(p.getChildren().at(-1)),false);const d=p.getChildren()[0];assert.equal(p.selectDevice(d),true);assert.equal(p.getTreeItem(d),d);assert.equal(d.contextValue,'deviceItem');assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-green.svg'));
});
test('Refresh restores selection only when mount exists; failure clears stale selection',async()=>{
 let drives=[{isUSB:true,description:'ZM',mountpoints:[{path:'/robot'},{path:'/second'},{path:'/robot'}]}];let fail=false;
 const p=new DeviceTreeProvider(async()=>{if(fail)throw Error('USB error');return drives;});await p.detectDevices();assert.equal(p.getChildren().length,3);p.selectDevice(p.getChildren()[0]);await p.detectDevices();assert.equal(p.getSelectedDevice().mountpoint,'/robot');
 drives=[];await p.detectDevices();assert.equal(p.getSelectedDevice(),undefined);fail=true;await assert.rejects(p.detectDevices());assert.equal(p.getSelectedDevice(),undefined);
});
test('Gyro detection understands aliases and from-import, excludes comments and strings',()=>{
 for(const text of ['import gyro_lib as g','import os, gyro_lib','from gyro_lib import Gyro'])assert.equal(files.usesGyroLibrary(text),true);
 for(const text of ['# import gyro_lib','s="import gyro_lib"','"""import gyro_lib"""','import other_gyro_lib'])assert.equal(files.usesGyroLibrary(text),false);
});
test('Reject paths, reserved Windows names, trailing dots',()=>{
 for(const name of ['../test','C:\\test','CON','test.','a/b'])assert.ok(files.validFileName(name));assert.equal(files.validFileName('программа.py'),undefined);
});
test('Repeated example clicks reuse a single acquired webview API; safe missing help',()=>{
 assert.equal((programExamples('test').match(/acquireVsCodeApi\(/g)||[]).length,1);
 const html=getProgramExamples('missing',path.join(__dirname,'..'),'<unsafe>','H-RCU');assert.match(html,/&lt;unsafe&gt;/);assert.match(html,/не заполнена/);assert.doesNotMatch(html,/<script/);
 const known=getProgramExamples('sensor.GetShortIRDist',path.join(__dirname,'..'));assert.doesNotMatch(known,/пока не заполнена/);
 const form=getPortConfigurationHtml(ports.getPortRows(''),'a<b.py','test');assert.match(form,/a&lt;b.py/);assert.doesNotMatch(form,/Мгновенное закрытие/);
});
test('Activation does not load a native USB binary; all legacy IDs remain registered',async()=>{
 activate({globalState:{get:(k,v)=>v,update:async()=>{}},subscriptions:[],extensionPath:path.join(__dirname,'..')});
 for(const id of Object.keys(COMMANDS))assert.ok(commands.has(id),id);
 for(const id of ['extension.uploadFile','extension.uploadFileToDevice','extension.setE7','rcuSidebar.refresh'])assert.ok(commands.has(id));
 active=undefined;await commands.get('extension.showCommandInfo')();assert.match(notices.at(-1),/конкретную команду/);
});
test('Upload captures original active file even if focus changes during save',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-test-'));const mount=path.join(dir,'robot');fs.mkdirSync(mount);
 const file=path.join(dir,'first.py');fs.writeFileSync(file,'print(1)');
 active={document:{languageId:'python',uri:{scheme:'file',fsPath:file},isDirty:true,isUntitled:false,getText:()=> 'print(1)',save:async()=>{active={document:{uri:{fsPath:'/wrong.py'}}};return true;}}};
 await files.uploadActiveFile({getSelectedDevice:()=>({mountpoint:mount,label:'ZM'})},dir);
 assert.equal(fs.readFileSync(path.join(mount,'first.py'),'utf8'),'print(1)');assert.equal(fs.existsSync(path.join(mount,'wrong.py')),false);fs.rmSync(dir,{recursive:true});
});
test('Missing gyro aborts main file upload and failed save aborts copy',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-test-'));const mount=path.join(dir,'robot');fs.mkdirSync(mount);const file=path.join(dir,'program.py');fs.writeFileSync(file,'import gyro_lib');
 active={document:{languageId:'python',uri:{scheme:'file',fsPath:file},isDirty:false,isUntitled:false,getText:()=> 'import gyro_lib'}};
 await assert.rejects(files.uploadActiveFile({getSelectedDevice:()=>({mountpoint:mount,label:'ZM'})},dir));assert.equal(fs.existsSync(path.join(mount,'program.py')),false);
 active.document.isDirty=true;active.document.save=async()=>false;await assert.rejects(files.uploadActiveFile({getSelectedDevice:()=>({mountpoint:mount,label:'ZM'})},dir));fs.rmSync(dir,{recursive:true});
});
test('Port form writes only the file captured when opened, even after switching editors',async()=>{
 let textA=original;const textB='import rcu\nprint("B")\n';let textBResult=textB;let receiver;
 const uriA={scheme:'file',fsPath:'/project/A.py'},uriB={scheme:'file',fsPath:'/project/B.py'};
 const docA={languageId:'python',isUntitled:false,uri:uriA,getText:()=>textA,positionAt:offset=>offset};
 const docB={languageId:'python',isUntitled:false,uri:uriB,getText:()=>textBResult,positionAt:offset=>offset};
 vscode.Range=class{constructor(start,end){this.start=start;this.end=end;}};
 vscode.WorkspaceEdit=class{replace(uri,range,replacement){this.change={uri,range,replacement};}};
 vscode.window.createWebviewPanel=()=>({webview:{cspSource:'test',onDidReceiveMessage:cb=>{receiver=cb;return {dispose(){}};},postMessage:async()=>true},onDidDispose:()=>({dispose(){}}),dispose(){}});
 vscode.window.showTextDocument=async()=>{};
 vscode.workspace.openTextDocument=async uri=>{assert.equal(uri,uriA);return docA;};
 vscode.workspace.applyEdit=async edit=>{const {uri,range,replacement}=edit.change;assert.equal(uri,uriA);textA=textA.slice(0,range.start)+replacement+textA.slice(range.end);return true;};
 active={document:docA};await commands.get('extension.configurePorts')();active={document:docB};
 const rows=ports.getPortRows(original,4);rows[0].names='NEW_LEFT';receiver({command:'savePorts',rows});
 await new Promise(resolve=>setImmediate(resolve));assert.match(textA,/NEW_LEFT = 1/);assert.equal(textBResult,textB);
});

test("Original 3.0.1 command IDs remain registered except removed folder creation",()=>{
 for(const id of ["rcuCommands.refresh", "extension.setErcu", "extension.setHrcu", "motor.SetMotor", "motor.SetMotorStop", "motor.SetMotorCode", "motor.GetMotorCode", "motor.SetMotorSecond", "motor.SetMotorAngleDelay", "motor.SetMotorConstSpeed", "motor.SetMotorAngle", "motor.SetMotorDirection", "move.SetMoveRunSecond", "move.SetMoveRunAngle", "move.SetMoveRun", "move.SetMoveStop", "move.SetMoveSpeedSecond", "move.SetMoveSpeed", "move.SetMovePower", "move.SetMotorPower", "move.SetMoveInitialize", "servo.SetSeeringEngine", "servo.SetSeeringEngineTime", "servo.SetServoMotor", "servo.SetServo", "servo.SetServoTime", "servo.SetMagneticServoSoftReset", "servo.SetMagneticServoState", "servo.SetMagneticServoDegreeTime", "servo.SetMagneticServoDegreeSpeed", "servo.SetMagneticServoCodeMotor", "servo.SetMagneticServoMotor", "servo.SetMagneticServoPowerDown", "servo.GetMagneticServoDegree", "servo.SetMagneticServoEncoder", "servo.GetMagneticServoEncoder", "rcu.SetWaitForTime", "rcu.GetLeftButton", "rcu.GetRightButton", "rcu.WaitLeftButtonPressed", "rcu.WaitRightButtonPressed", "rcu.WaitRightButtonReleased", "rcu.WaitLeftButtonReleased", "rcu.SetRcuStop", "rcu.GetRandom", "rcu.GetRGB", "rcu.GetMcuID", "rcu.GetSysVersion", "rcu.GetSysLanguage", "rcu.SetSysTime", "rcu.GetSysTime", "rcu.GetInMic", "rcu.SetData", "rcu.GetData", "rcu.SetUartData", "rcu.GetUartData", "rcu.GetInVotage", "rcu.SetInSound", "rcu.SetInBeep", "rcu.SoundStartBeep", "rcu.SetMp3Play", "rcu.SoundMp3", "rcu.SetMp3Suspend", "rcu.SetMp3Sound", "sensor.Set3CLed", "sensor.SetLightSensorLed", "sensor.GetLightSensorData", "sensor.GetLightSensor", "sensor.GetColorSensor", "sensor.GetTouch", "sensor.GetUltrasound", "sensor.SetUltrasoundled", "sensor.GetShortIRDist", "sensor.GetLaserDist", "sensor.SetAHRS", "sensor.GetAHRS", "Create_object_gyro", "gyro.ReadGyro", "sensor.GetGesture", "sensor.GetAirPressure", "sensor.GetSht30", "sensor.GetMagnetic", "sensor.SetSmartEyeMode", "sensor.SetSmartEyeAllLed", "sensor.SetSmartEyeIRcode", "sensor.GetSmartEyeIRcode", "sensor.GetSmartEyeDist", "trace.GetTraceV2I2C", "trace.GetTraceV2I2CState", "trace.GetTraceV2I2CChxState", "trace.SetTraceV2I2AllColor", "trace.SetTraceV2I2Color", "trace.SetTraceV2I2Threshold", "trace.LineSetInitialize", "trace.LineIntersectionStop", "trace.LineMillisecond", "trace.LineForBmp", "trace.LineTurnEncounterline", "trace.LineBasis", "ai.SetAICamData", "ai.SetWaitForAICamData", "ai.SetAICamLED", "ai.GetAICamData", "ai.GetAICamVoice", "rcu.GetTouchScreen", "rcu.GetTouchScreenX", "rcu.GetTouchScreenY", "rcu.SetLCDClear", "rcu.SetFontSize", "rcu.SetDisplayVar", "rcu.SetDisplayString", "rcu.SetDisplayPicture", "rcu.SetDisplayVarXY", "rcu.SetDisplayStringXY", "rcu.SetDisplayVarU32", "rcu.SetLCDDot", "rcu.SetLCDSolidCircle", "rcu.SetLCDLine", "rcu.SetLCDFilledRectangle2", "rcu.SetLCDRectangle2", "rcu.SetBluetoothData", "rcu.GetBluetoothData", "rcu.GetBluetoothControl", "rcu.GetBluetoothControlData", "rcu.GetBTModuleRemoteButton", "rcu.GetBTModuleRemoteCode", "rcu.GetBTModuleRemoteRocker", "rcu.GetComVoice", "rcu.SetMotorH", "rcu.StopMotorH", "rcu.SetMotorCodeH", "rcu.GetMotorCodeH", "rcu.WaitMotorTo", "rcu.SetMotorVByOther", "rcu.GetMotorV", "rcu.GetMotorAngleH", "rcu.SetSteeringAngle", "rcu.SetStartMotorLorR", "rcu.SetMotorsByTime", "rcu.SetMotors", "rcu.SetMotorsByLength", "rcu.SetOneCircleSize", "rcu.SetMotorsAngle", "rcu.StopMotorRun", "rcu.WaitMotorByPercent", "rcu.SetMotorByPercent", "rcu.Set3CLedH", "rcu.SetLightByRGB", "rcu.SetElcLightIfData", "rcu.WaitNewColor", "rcu.WaitThisColor", "rcu.GetLightSensorH", "rcu.IsColor", "rcu.GetColorSensorH", "rcu.IsUltra", "rcu.GetUltrasound", "rcu.GetTouch", "rcu.IsElectedData", "rcu.GetTempAndHumData", "rcu.GetGyroscopeData", "rcu.GetAccData", "rcu.GetAttitudeData", "rcu.SetRcuTimeTo0", "rcu.GetRcuTime", "rcu.SetDataH", "rcu.GetDataH", "rcu.SavePic", "rcu.GetHRCUName", "rcu.GetChangeValue", "rcu.GetMaiVoice", "rcu.GetCcrrentDate", "rcu.SetSaveStudyDataToFile", "rcu.SetShowFileData", "rcu.SetDeleteStudyFile", "rcu.SetEditView", "rcu.GetEditViewData", "rcu.SetSaveStrToFile", "rcu.GetStrForFile", "rcu.ShowGifExpression", "rcu.GoneGifExpression", "rcu.ShowList", "rcu.SetListItem", "rcu.InitIot", "rcu.SetIotDeviceData", "rcu.ResetIotResult", "rcu.IsIotDeviceData", "rcu.GetIotDeviceData", "rcu.SetWifiData", "rcu.GetWifiData", "rcu.SetRcuBluetoothData", "rcu.GetRcuBluetoothData", "rcu.OpenCameraForPhone", "rcu.SendWifiBtnDescribe", "rcu.IsPhoneWiFiYGData", "rcu.IsPhoneWiFiBtnData", "rcu.GetPhoneWiFiYGData", "rcu.StartCamera", "rcu.SetRoadHsv", "rcu.IsRoadBlack", "rcu.GetRoadAngle", "rcu.SetFaceRegister", "rcu.SetCameraShow", "rcu.SetTTSSpeack", "rcu.ResetAiResult", "rcu.IsColorForCamera", "rcu.GetPoseData", "rcu.GetSimplePoseList", "rcu.GetWeather", "rcu.GetAiData", "rcu.GetZxing", "rcu.GetBlackLineData", "rcu.StartOnnxCamera", "rcu.GetOnnxZXD", "rcu.GetOnnxResult", "rcu.IsOnnxResult", "rcu.StartBDApi", "rcu.SetTextRecognize", "rcu.GetTextRecognizeResult", "rcu.StartBDVoiceRecognize", "rcu.StartBDVoiceRecognizeOnce", "rcu.GetVoiceData", "rcu.InitXhSDK", "rcu.UseInsetChatUi", "rcu.StartDSTTSSpeack", "rcu.IsFinishTTS", "rcu.StartChat", "rcu.AddActionCode", "rcu.ResetXHCash", "rcu.GetChatReceive", "rcu.GetChatListData", "rcu.GetChatListSize", "rcu.GetChatAllReceive", "rcu.GetAiDoInstructionSize", "rcu.GetAiDoInstruction", "rcu.GetIsTouchH", "rcu.GetTouchScreenXYH", "rcu.SetLCDClearH", "rcu.SetAlphaH", "rcu.SetFontSizeH", "rcu.SetDisplayStringH", "rcu.SetDisplayStringXYSH", "rcu.SetZxingH", "rcu.SetDisplayPictureH", "rcu.SetLCDDotH", "rcu.SetLCDLineH", "rcu.SetLCDSolidCircleH", "rcu.SetLCDFilledRectangle2H", "rcu.SetLCDRectangle2H", "rcu.StartMp3ByPaiH", "rcu.PlayVoiceByNameH", "rcu.StartMp3ByPathH", "rcu.WaitMp3ByPathH", "rcu.SetMp3SuspendH", "rcu.StartRecordH", "rcu.PlayRecordH", "rcu.AddVoiceSpeedH", "rcu.SetVoiceSpeedH", "rcu.AddVoiceValueH", "rcu.SetVoiceValueH", "rcu.StopAllVoiceH", "rcu.GetVoiceValueH", "rcu.GetVoiceSpeedH", "rcu.SetMecanumwheel", "rcu.SetMecanumSpeed", "rcu.SetMecanumMoveLR", "rcu.SetCarSpeed", "rcu.SetCarStop", "rcu.SetCarToAngleTime", "rcu.SetCarToAngle", "rcu.SetCarToRLTime", "rcu.SetCarToRL", "rcu.StartCameraRub", "rcu.StartMFBtn", "rcu.UpdateRcuUi", "rcu.IsMfConnect", "rcu.GetMFExist", "rcu.GetMfChaos", "rcu.SeRunNexttCarToRL", "rcu.StartMFColor", "rcu.MfStepNum", "rcu.MfUseTime", "control.if", "control.ifelse", "control.ifelifelse", "control.while", "control.whiletrue", "control.for", "extension.createPythonTemplate", "extension.detectDevices", "extension.uploadFile", "extension.uploadFileToDevice", "extension.testDrivelist", "device.select", "extension.openExamples", "extension.configurePorts", "extension.showCommandInfo", "extension.refreshSystemCommands"]) assert.ok(commands.has(id),id);
});

test('All eight motor and sensor ports survive reopening without changing case',()=>{
 const rows=ports.getPortRows('');assert.equal(rows.length,16);
 rows.forEach(row=>{row.names=(row.kind==='Motor'?'m':'s')+row.port;});
 const text=apply('',ports.buildPortEdit('',rows));
 assert.deepEqual(ports.getPortRows(text),rows);
 assert.match(text,/m8 = 8/);assert.match(text,/s8 = 8/);assert.doesNotMatch(text,/M8/);
 const bad=rows.map(row=>({...row}));bad[7].port=9;assert.throws(()=>ports.buildPortEdit('',bad));
});
test('Manual assignments without comments open and save without duplicates',()=>{
 for(const markers of [true,false]){
  const body='m1 = 1\nm2 = 2\nm3 = 3\ns1 = 1\ns2 = 2';
  const text='import rcu\n\n'+(markers?start+'\n':'')+body+(markers?'\n'+end:'')+'\n\nprint(m1)\n';
  const rows=ports.getPortRows(text);assert.equal(rows[0].names,'m1');assert.equal(rows[8].names,'s1');assert.equal(rows[9].names,'s2');
  rows[1].names='MOTOR_RIGHT';const result=apply(text,ports.buildPortEdit(text,rows));
  assert.doesNotMatch(result,/m2 =/);assert.match(result,/MOTOR_RIGHT = 2/);
  assert.equal((result.match(/m1 = 1/g)||[]).length,1);assert.ok(result.endsWith('print(m1)\n'));
  assert.equal(apply(result,ports.buildPortEdit(result,ports.getPortRows(result))),result);
 }
});
test('Names without comments use real calls; unknown settings remain untouched',()=>{
 const text=start+'\nLEFT = 1\nLIGHT = 2\nTHRESHOLD = 7\n'+end+'\nmotor.SetMotor(LEFT, 50)\nsensor.GetLightSensor(LIGHT)\n';
 const rows=ports.getPortRows(text);assert.equal(rows[0].names,'LEFT');assert.equal(rows[9].names,'LIGHT');
 const result=apply(text,ports.buildPortEdit(text,rows));assert.match(result,/THRESHOLD = 7/);
 const comments=start+'\nUNKNOWN = 2\n'+end+'\n# motor.SetMotor(UNKNOWN, 50)\nmessage="sensor.GetLightSensor(UNKNOWN)"';
 assert.ok(ports.getPortRows(comments).every(row=>!row.names));
 const conflict=ports.getPortRows(comments);conflict[0].names='UNKNOWN';assert.throws(()=>ports.buildPortEdit(comments,conflict),/Имя уже есть/);
});
test('Port form contains only requested guidance and all sixteen inputs',()=>{
 const html=getPortConfigurationHtml(ports.getPortRows(''),'test.py','test');
 assert.match(html,/Имена устройств вводите заглавными латинскими буквами/);
 assert.doesNotMatch(html,/Существующие имена уже заполнены|Имена переменных|toUpperCase/);
 assert.equal((html.match(/<input /g)||[]).length,16);
});
test('Folder creation is absent from registered commands, tree, manifest and implementation',()=>{
 const {SystemCommandTreeProvider}=require('../out/SystemCommandTreeProvider');
 assert.equal(commands.has('extension.createProjectFolder'),false);
 assert.equal(files.createProjectFolder,undefined);
 assert.ok(new SystemCommandTreeProvider().getChildren().every(node=>node.label!=='Создать папку проекта'));
 const manifest=fs.readFileSync(path.join(__dirname,'../package.json'),'utf8');assert.doesNotMatch(manifest,/createProjectFolder/);
});
test('New files for all controller sets contain only rcu with a comment',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zmrobo-template-'));
 const uri={scheme:'file',fsPath:dir};
 vscode.Uri={joinPath:(root,name)=>({scheme:'file',fsPath:path.join(root.fsPath,name)})};
 vscode.workspace.workspaceFolders=[{uri}];vscode.workspace.getWorkspaceFolder=()=>({uri});
 const previousOpen=vscode.workspace.openTextDocument;
 vscode.workspace.openTextDocument=async uri=>({uri});active=undefined;
 try {
  for(const controller of ['E-RCU','E7','H-RCU']){
   vscode.window.showInputBox=async()=>controller;
   await files.createPythonTemplate(controller);
   const text=fs.readFileSync(path.join(dir,controller+'.py'),'utf8');
   assert.match(text,/^import rcu  # .+/);assert.equal((text.match(/^import /gm)||[]).length,1);
   assert.match(text,/def task1\(\):\n    pass\n\ntask1\(\)/);
   await assert.rejects(files.createPythonTemplate(controller));
  }
 } finally {vscode.workspace.openTextDocument=previousOpen;fs.rmSync(dir,{recursive:true});}
});

test('Manual block detection ignores device assignments inside strings and functions',()=>{
 const text='"""\nm1 = 1\ns1 = 2\n"""\ndef task():\n    m2 = 2\n';
 assert.equal(ports.findSettingsBlock(text),undefined);
 assert.ok(ports.getPortRows(text).every(row=>!row.names));
 const changed=apply(text,ports.buildPortEdit(text,ports.getPortRows(text)));
 assert.ok(changed.includes('"""\nm1 = 1\ns1 = 2\n"""'));
});

test('Assignment value overrides stale port numbers in comments',()=>{
 for(const markers of [true,false]){
  const body='SENSOR_FRONT2 = 2 # устройство подключено на порт Sensor 1\nMOTOR_RIGHT = 8 # устройство подключено на порт Motor 1';
  const text=(markers?start+'\n':'')+body+(markers?'\n'+end:'')+'\nprint(SENSOR_FRONT2)\n';
  const rows=ports.getPortRows(text);
  assert.equal(rows[9].names,'SENSOR_FRONT2');assert.equal(rows[8].names,'');assert.equal(rows[7].names,'MOTOR_RIGHT');
  const result=apply(text,ports.buildPortEdit(text,rows));
  assert.match(result,/SENSOR_FRONT2 = 2  # устройство подключено на порт Sensor 2/);
  assert.match(result,/MOTOR_RIGHT = 8  # устройство подключено на порт Motor 8/);
  assert.equal((result.match(/SENSOR_FRONT2 =/g)||[]).length,1);
  assert.ok(result.endsWith('print(SENSOR_FRONT2)\n'));
  assert.equal(apply(result,ports.buildPortEdit(result,ports.getPortRows(result))),result);
 }
});
test('Actual out-of-range assignment still fails regardless of a valid comment',()=>{
 for(const value of [0,9])assert.throws(()=>ports.getPortRows(start+'\nSENSOR_FRONT = '+value+' # устройство подключено на порт Sensor 1\n'+end),/Некорректный номер порта/);
});

test('Bluetooth upload captures file A even if save switches active editor to B',async()=>{
 const {captureBluetoothProgram}=require('../out/BluetoothOperations');
 const source='print("A")\n';
 const document={languageId:'python',isUntitled:false,isDirty:true,uri:{fsPath:'/project/A.py'},getText:()=>source,
  save:async()=>{active={document:{languageId:'python',uri:{fsPath:'/project/B.py'},getText:()=> 'print("B")'}};return true;}};
 active={document};assert.deepEqual(await captureBluetoothProgram(true),{name:'A.py',source});
 document.save=async()=>false;active={document};await assert.rejects(captureBluetoothProgram(true),/не сохранён/);
});
test('Bluetooth Play uses editor text including unsaved changes and untitled files',async()=>{
 const {captureBluetoothProgram}=require('../out/BluetoothOperations');
 active={document:{languageId:'python',isUntitled:true,getText:()=> 'print("current")'}};
 assert.deepEqual(await captureBluetoothProgram(false),{name:'program.py',source:'print("current")'});
 await assert.rejects(captureBluetoothProgram(true),/Сначала сохраните/);
});
test('F6 switches between explicitly selected Bluetooth and USB; Stop ignores active editor',async()=>{
 const {BluetoothOperations}=require('../out/BluetoothOperations');
 const {DeviceTreeProvider}=require('../out/DeviceTreeProvider');
 const priorSelect=DeviceTreeProvider.prototype.connectDevice;
 const priorConnect=BluetoothOperations.prototype.connect,priorUpload=BluetoothOperations.prototype.upload,priorStop=BluetoothOperations.prototype.stop;
 const received=[];
 BluetoothOperations.prototype.connect=async function(){this.selected();};
 BluetoothOperations.prototype.upload=async function(program){received.push(program);};
 BluetoothOperations.prototype.stop=async function(){received.push('stop');};
 try{
  const doc={languageId:'python',isUntitled:false,isDirty:false,uri:{scheme:'file',fsPath:'/project/A.py'},getText:()=> 'print("A")'};
  active={document:doc};await commands.get('extension.connectBluetooth')({address:'AA:BB'});
  await commands.get('extension.uploadFileToDevice')();assert.deepEqual(received[0],{name:'A.py',source:'print("A")'});
  active=undefined;await commands.get('extension.stopBluetooth')();assert.equal(received[1],'stop');
  DeviceTreeProvider.prototype.connectDevice=async()=>true;
  await commands.get('device.select')({label:'USB',mountpoint:'/usb'});active={document:doc};
  await commands.get('extension.uploadFileToDevice')();
  assert.equal(received.length,2);assert.match(notices.at(-1),/Найдите и выберите устройство/);
 }finally{DeviceTreeProvider.prototype.connectDevice=priorSelect;BluetoothOperations.prototype.connect=priorConnect;BluetoothOperations.prototype.upload=priorUpload;BluetoothOperations.prototype.stop=priorStop;}
});
test('Bluetooth manifest has generic labels and includes dependency configuration',()=>{
 const manifest=require('../package.json');
 const view=manifest.contributes.views.rcuSidebar.find(view=>view.id==='bluetoothDevices');assert.equal(view.name,'Bluetooth');
 assert.ok(manifest.contributes.configuration.properties['zmrobo.bluetooth.pythonPath']);
 for(const command of manifest.contributes.commands.filter(command=>/Bluetooth/.test(command.command)))assert.doesNotMatch(command.title,/E7/);
 for(const id of ['scanBluetooth','uploadBluetooth','playBluetooth','stopBluetooth','disconnectBluetooth'])assert.ok(commands.has('extension.'+id));
});

test('Bluetooth circles are per address; connecting, failure and disconnect preserve other devices',()=>{
 const {BluetoothTreeProvider}=require('../out/BluetoothTreeProvider');
 const p=new BluetoothTreeProvider();const a={address:'AA',name:'same'},b={address:'BB',name:'same'};
 p.setDevices([a,b]);
 const row=address=>p.getChildren().find(row=>row.id==='ble:'+address);
 const color=address=>row(address).iconPath.light;
 assert.ok(color('AA').endsWith('connection-red.svg'));assert.ok(color('BB').endsWith('connection-red.svg'));
 p.setState({address:'AA',name:'same',version:'1.2.3',running:false});p.setConnecting(b);
 assert.ok(color('AA').endsWith('connection-green.svg'));assert.ok(color('BB').endsWith('connection-yellow.svg'));
 assert.match(row('BB').description,/BB.*подключение/);
 p.setConnecting();assert.ok(color('BB').endsWith('connection-red.svg'));
 p.setState();assert.ok(color('AA').endsWith('connection-red.svg'));
});
test('USB circles transition only after mount validation; failed new selection retains prior target',async()=>{
 let verify,fail=false;
 const p=new DeviceTreeProvider(async()=>[{isUSB:true,description:'USB',mountpoints:[{path:'/a'},{path:'/b'}]}],mount=>new Promise((resolve,reject)=>{verify=()=>fail?reject(Error('unavailable '+mount)):resolve();}));
 await p.detectDevices();const [a,b]=p.getChildren();
 const pending=p.connectDevice(a);assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-yellow.svg'));verify();assert.equal(await pending,true);assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-green.svg'));
 fail=true;const rejected=p.connectDevice(b);assert.ok(p.getChildren()[1].iconPath.light.endsWith('connection-yellow.svg'));verify();await assert.rejects(rejected,/unavailable/);
 assert.equal(p.getSelectedDevice().mountpoint,a.mountpoint);assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-green.svg'));assert.ok(p.getChildren()[1].iconPath.light.endsWith('connection-red.svg'));
 assert.equal(p.getChildren().at(-1).label,'Поиск по USB');
});
test('USB serial rows have independent colors and commands; E6 system panel includes language switching',()=>{
 const {SystemCommandTreeProvider}=require('../out/SystemCommandTreeProvider');
 assert.deepEqual(new SystemCommandTreeProvider().getChildren().map(row=>row.commandId),['extension.createPythonTemplate','extension.configurePorts','extension.openExamples','extension.setCMode']);
 const p=new DeviceTreeProvider(async()=>[]);p.setSerialDevices([{address:'COM5',name:'controller',serialNumber:'123'}]);
 let row=p.getChildren()[0];assert.equal(row.command.command,'extension.connectUSBDevice');assert.ok(row.iconPath.light.endsWith('connection-red.svg'));
 p.setSerialConnecting({address:'COM5',name:'controller'});assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-yellow.svg'));
 p.setSerialState({address:'COM5',name:'controller',version:'1.2.3',running:false});p.setSerialConnecting();row=p.getChildren()[0];assert.ok(row.iconPath.light.endsWith('connection-green.svg'));assert.match(row.tooltip,/123/);
 const manifest=require('../package.json');assert.equal(manifest.contributes.views.rcuSidebar.find(view=>view.id==='connectedDevices').name,'Устройства USB');
 for(const id of ['uploadUSB','playUSB','stopUSB'])assert.ok(manifest.contributes.menus['view/title'].some(item=>item.command==='extension.'+id && item.when.includes('view == connectedDevices')));
});


test('USB disk and COM form one row per physical controller, independent of order',async()=>{
 const p=new DeviceTreeProvider(async()=>[
  {device:'disk2',isUSB:true,description:'Joinmax microSD Flash USB Device',mountpoints:[{path:'F:\\'}]},
  {device:'disk1',isUSB:true,description:'MicroPy ZMROBO FS Card',mountpoints:[{path:'E:\\'}]}
 ]);
 await p.detectDevices();p.setSerialDevices([
  {address:'COM5',name:'generic',physicalId:'usb-1',mountpoints:['e:\\'],diskDevices:['disk1']},
  {address:'COM6',name:'generic',physicalId:'usb-2',mountpoints:['F:\\'],diskDevices:['disk2']}
 ]);
 const rows=p.getChildren().slice(0,-1);assert.equal(rows.length,2);
 assert.equal(rows[0].label,'E7-RCU');assert.equal(rows[0].serialDevice.address,'COM5');assert.equal(rows[0].mountpoint,'E:\\');
 assert.equal(rows[1].label,'E6-RCU');assert.equal(rows[1].serialDevice.address,'COM6');assert.equal(rows[1].mountpoint,'F:\\');
 p.setSerialConnecting(rows[1].serialDevice);assert.ok(p.getChildren()[1].iconPath.light.endsWith('connection-yellow.svg'));
 assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-red.svg'));
 p.setSerialState({address:'COM6',name:'E6-RCU',version:'1.2.3',running:false});p.setSerialConnecting();
 assert.ok(p.getChildren()[1].iconPath.light.endsWith('connection-green.svg'));
 p.setSerialState();assert.ok(p.getChildren()[1].iconPath.light.endsWith('connection-red.svg'));
});
test('USB never guesses disk/COM matching without physical identity',()=>{
 const {groupUsbDevices}=require('../out/UsbDevices');
 const groups=groupUsbDevices([{mountpoint:'E:\\',description:'MicroPy FS Card'}],[{address:'COM5',name:'unknown'}]);
 assert.equal(groups.length,2);assert.ok(groups.every(g=>!(g.disks.length && g.ports.length)));
});
test('New command help contains parameters and examples, guide has complete code',()=>{
 const {NEW_COMMANDS}=require('../out/NewCommands');
 for(const id of Object.keys(NEW_COMMANDS)){
  const info=getProgramExamples(id,path.join(__dirname,'..'));
  assert.doesNotMatch(info,/пока не заполнена/);assert.ok(info.includes('<pre><code>'),id);
 }
 assert.match(getProgramExamples('aicam.GetAICamIDData',path.join(__dirname,'..')),/1 — X, 2 — Y/);
 assert.match(programExamples('test','E7'),/aicam_06_human/);
 assert.doesNotMatch(programExamples('test','E-RCU'),/aicam_01_probe/);
 assert.doesNotMatch(programExamples('test','H-RCU'),/aicam_01_probe/);
});


test('Activation registers each command exactly once, including the camera guide',()=>{
 const originalRegister=vscode.commands.registerCommand;
 const registered=new Set(),errors=[];
 vscode.commands.registerCommand=(id,handler)=>{
  if(registered.has(id))throw Error('command '+id+' already exists');
  registered.add(id);return originalRegister(id,handler);
 };
 const originalError=vscode.window.showErrorMessage;
 vscode.window.showErrorMessage=message=>errors.push(message);
 try{
  activate({globalState:{get:(key,fallback)=>fallback,update:async()=>{}},subscriptions:[],extensionPath:path.join(__dirname,'..')});
  assert.deepEqual(errors,[]);
  for(const id of ['aicam.guide','extension.detectDevices','extension.configurePorts','extension.playUSB'])assert.ok(registered.has(id),id);
 } finally {
  vscode.commands.registerCommand=originalRegister;
  vscode.window.showErrorMessage=originalError;
 }
});


test('USB verified identity survives disconnect, temporarily missing COM and degraded scans',async()=>{
 const p=new DeviceTreeProvider(async()=>[{device:'disk1',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'E:\\'}]}]);
 await p.detectDevices();
 const known={address:'COM5',name:'E7-RCU',physicalId:'physical1',mountpoints:['E:\\'],diskDevices:['disk1'],vid:1,pid:2,serialNumber:'unique1'};
 p.setSerialDevices([known]);p.setSerialState({address:'COM5',name:'E7-RCU',version:'1.2.3',running:false});
 const id=p.getChildren()[0].id;assert.equal(p.getChildren().length,2);
 p.setSerialState();assert.equal(p.getChildren().length,2);assert.equal(p.getChildren()[0].id,id);
 assert.ok(p.getChildren()[0].iconPath.light.endsWith('connection-red.svg'));
 p.setSerialDevices([]);assert.equal(p.getChildren().length,2);assert.equal(p.getChildren()[0].id,id);
 assert.equal(p.getChildren()[0].serialDevices.length,0);
 p.setSerialDevices([{address:'COM5',name:'generic',vid:1,pid:2,serialNumber:'unique1'}]);
 assert.equal(p.getChildren().length,2);assert.equal(p.getChildren()[0].id,id);
 // Same COM number on another robot must not reuse this robot's disk association.
 p.setSerialDevices([{address:'COM5',name:'generic',vid:1,pid:2,serialNumber:'unique2'}]);
 assert.equal(p.getChildren().length,3);
});
test('Autoimport and command insertion target the captured editor and share an undo group',async()=>{
 const {insertCommand}=require('../out/InsertCommand');let text='import rcu\n\ndef task1():\n    pass\n',version=1;
 const calls=[];
 const editor={document:{languageId:'python',getText:()=>text,get version(){return version;},positionAt:n=>n},
  edit:async(callback,options)=>{calls.push(options);callback({insert:(offset,value)=>{text=text.slice(0,offset)+value+text.slice(offset);version++;}});active={document:{languageId:'python',getText:()=>''}};return true;},
  insertSnippet:async(snippet,location,options)=>{calls.push(options);assert.match(snippet.value,/motor.SetMotor/);return true;}};
 active=editor;await insertCommand('motor.SetMotor(${1:1}, ${2:50})');
 assert.match(text,/import motor  # /);assert.deepEqual(calls,[{undoStopBefore:true,undoStopAfter:false},{undoStopBefore:false,undoStopAfter:true}]);
});
test('Python analysis paths preserve existing settings and do not add duplicates',async()=>{
 const {configureLibraryPaths}=require('../out/LibraryPaths');const previous=vscode.workspace.getConfiguration;
 let paths=['/custom/libs'];const updates=[];
 vscode.workspace.getConfiguration=()=>({get:()=>paths,update:async(key,value,target)=>{updates.push([key,value,target]);paths=value;}});
 try {await configureLibraryPaths('/extension/stub_libs');await configureLibraryPaths('/extension/stub_libs');assert.equal(updates.length,1);assert.deepEqual(paths,['/extension/stub_libs','/custom/libs']);}
 finally {vscode.workspace.getConfiguration=previous;}
});

test('Bluetooth scan immediately shows a spinner, blocks duplicate scans and restores search after success/error',async()=>{
 const {BluetoothTreeProvider}=require('../out/BluetoothTreeProvider');
 const {BluetoothOperations}=require('../out/BluetoothOperations');
 const previousProgress=vscode.window.withProgress,previousLocation=vscode.ProgressLocation;
 vscode.window.withProgress=(_options,task)=>task();vscode.ProgressLocation={Window:10};
 const tree=new BluetoothTreeProvider();const backend=new BluetoothOperations(path.join(__dirname,'..'),tree,()=>{});
 let finish;
 backend.bridge={call:()=>new Promise(resolve=>{finish=resolve;}),dispose(){}};
 try{
  const pending=backend.scan();
  let search=tree.getChildren().at(-1);assert.match(search.label,/Поиск контроллеров/);assert.equal(search.iconPath.id,'loading~spin');assert.equal(search.command,undefined);
  await assert.rejects(backend.scan(),/Дождитесь/);
  finish([{name:'E7',address:'AA'}]);await pending;
  search=tree.getChildren().at(-1);assert.equal(search.iconPath.id,'search');assert.match(search.description,/Найдено: 1/);assert.ok(search.command);
  backend.bridge.call=async()=>[];await backend.scan();assert.match(tree.getChildren().at(-1).description,/не найдены/);
  backend.bridge.call=async()=>{throw Error('scan failed');};await assert.rejects(backend.scan(),/scan failed/);
  search=tree.getChildren().at(-1);assert.ok(search.command);assert.equal(search.iconPath.id,'search');assert.match(search.description,/Ошибка поиска/);
 }finally{backend.dispose();vscode.window.withProgress=previousProgress;vscode.ProgressLocation=previousLocation;}
});

test('Camera example opens the working E7 code without changing shared examples',async()=>{
 const previousOpen=vscode.workspace.openTextDocument,previousShow=vscode.window.showTextDocument;
 const seen=[];
 vscode.workspace.openTextDocument=async value=>{seen.push(value.content);return value;};
 vscode.window.showTextDocument=async document=>document;
 try{
  await files.openExampleFile('1_PIDRegLine.py',path.join(__dirname,'..'));
  await files.openExampleFile('aicam_07_line_follow.py',path.join(__dirname,'..'));
  assert.match(seen[0],/SetMotor\(LEFT_MOTOR, leftSpeed\)/);
  assert.match(seen[1],/SetMotor\(LEFT_MOTOR, -leftSpeed\)/);
  assert.match(seen[1],/SetAICamCmd\(AI_CAM, "road"\)/);
 }finally{vscode.workspace.openTextDocument=previousOpen;vscode.window.showTextDocument=previousShow;}
});

test('USB and Bluetooth connection commands disconnect the other transport before connecting',async()=>{
 const {BluetoothOperations}=require('../out/BluetoothOperations');
 const previousConnect=BluetoothOperations.prototype.connect,previousDisconnect=BluetoothOperations.prototype.disconnect;
 const previousScan=BluetoothOperations.prototype.scan,previousView=vscode.window.createTreeView;
 const previousUpload=files.uploadActiveFile;
 const treesById={},events=[];
 let failDisconnect=false,release;
 BluetoothOperations.prototype.connect=async function(device){
  events.push('connect:'+this.transport);
  this.state={address:device.address,name:this.transport==='USB'?'E7-RCU':device.name,version:'1.2.3',running:false};
  this.tree.setState(this.state);this.selected();
 };
 BluetoothOperations.prototype.disconnect=async function(){
  events.push('disconnect:'+this.transport);
  if(failDisconnect && this.transport==='USB')throw Error('cannot disconnect USB');
  if(release && this.transport==='USB')await new Promise(resolve=>{release=resolve;});
  this.state=undefined;this.tree.setState();
 };
 BluetoothOperations.prototype.scan=async function(){events.push('scan:'+this.transport);};
 vscode.window.createTreeView=(id,options)=>{treesById[id]=options.treeDataProvider;return {dispose(){}};};
 const context={globalState:{get:(_k,v)=>v,update:async()=>{}},subscriptions:[],extensionPath:path.join(__dirname,'..')};
 const greenCount=tree=>tree.getChildren().filter(row=>row.iconPath?.light?.endsWith('connection-green.svg')).length;
 try{
  activate(context);
  const usb=treesById.connectedDevices,ble=treesById.bluetoothDevices;
  usb.listDrives=async()=>[{isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'/robot'}]}];
  usb.verifyMountpoint=async()=>{};await usb.detectDevices();
  usb.setSerialDevices([{address:'COM5',name:'E7-RCU'}]);
  ble.setDevices([{address:'AA',name:'E7-RCU'}]);
  await commands.get('device.select')(usb.getChildren().find(row=>row.mountpoint));
  assert.equal(greenCount(usb),1);
  events.length=0;
  await commands.get('extension.connectBluetooth')({address:'AA',name:'E7-RCU'});
  assert.deepEqual(events,['disconnect:USB','connect:Bluetooth']);
  assert.equal(usb.getSelectedDevice(),undefined);assert.equal(greenCount(usb),0);assert.equal(greenCount(ble),1);
  events.length=0;
  await commands.get('extension.connectUSBDevice')({mountpoint:'/robot',serialDevices:[{address:'COM5',name:'E7-RCU'}],serialDevice:{address:'COM5',name:'E7-RCU'}});
  assert.deepEqual(events,['disconnect:Bluetooth','connect:USB']);
  assert.equal(greenCount(ble),0);assert.equal(greenCount(usb),1);
  files.uploadActiveFile=async()=>{events.push('upload:USB');};
  events.length=0;
  await commands.get('extension.uploadUSB')(usb.getChildren().find(row=>row.mountpoint));
  assert.deepEqual(events,['disconnect:Bluetooth','upload:USB']);
  assert.equal(greenCount(usb),1);assert.ok(usb.getSelectedDevice());
  events.length=0;await commands.get('extension.uploadFile')();
  assert.deepEqual(events,['upload:USB']);assert.equal(greenCount(usb),1);
  events.length=0;await commands.get('extension.connectBluetooth')();
  assert.deepEqual(events,['scan:Bluetooth']);assert.equal(greenCount(usb),1);
  failDisconnect=true;events.length=0;
  await commands.get('extension.connectBluetooth')({address:'AA',name:'E7-RCU'});
  assert.deepEqual(events,['disconnect:USB']);assert.equal(greenCount(usb),1);assert.equal(greenCount(ble),0);
  failDisconnect=false;release=true;events.length=0;
  const pending=commands.get('extension.connectBluetooth')({address:'AA',name:'E7-RCU'});
  await commands.get('extension.connectUSBSerial')({address:'COM5'});
  assert.deepEqual(events,['disconnect:USB']);assert.match(notices.at(-1),/переключения/);
  const finish=release;release=undefined;finish();await pending;
  assert.equal(greenCount(ble),1);assert.equal(greenCount(usb),0);
  await commands.get('extension.connectUSBSerial')({address:'COM5',name:'E7-RCU'});
  assert.equal(greenCount(ble),0);assert.equal(greenCount(usb),1);
  await commands.get('extension.disconnectUSB')();assert.equal(greenCount(usb),0);assert.equal(usb.getSelectedDevice(),undefined);
 }finally{
  BluetoothOperations.prototype.connect=previousConnect;BluetoothOperations.prototype.disconnect=previousDisconnect;
  BluetoothOperations.prototype.scan=previousScan;vscode.window.createTreeView=previousView;
  files.uploadActiveFile=previousUpload;
  for(const disposable of context.subscriptions)disposable.dispose();
 }
});
test('Unmatched selected disk does not create a second green USB row while COM is connected',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'/robot'}]}],async()=>{});
 await usb.detectDevices();await usb.connectDevice(usb.getChildren()[0]);
 usb.setSerialDevices([{address:'COM5',name:'E7-RCU'}]);
 usb.setSerialState({address:'COM5',name:'E7-RCU',version:'1.2.3',running:false});
 assert.equal(usb.getChildren().filter(row=>row.iconPath?.light?.endsWith('connection-green.svg')).length,1);
 usb.clearSelection();usb.setSerialState();
 assert.equal(usb.getChildren().filter(row=>row.iconPath?.light?.endsWith('connection-green.svg')).length,0);
});
test('Disconnecting an inactive transport does not start the Python bridge',async()=>{
 const {BluetoothOperations}=require('../out/BluetoothOperations');
 const tree={setDevices(){},setState(){},setConnecting(){}};
 const operation=new BluetoothOperations(path.join(__dirname,'..'),tree,()=>{});
 let calls=0;operation.bridge={call:async()=>{calls++;},dispose(){}};
 try{await operation.disconnect();assert.equal(calls,0);}finally{operation.dispose();}
});
test('An old USB scan cannot restore disk selection after switching to Bluetooth',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'/robot'}]}],async()=>{});
 await usb.detectDevices();await usb.connectDevice(usb.getChildren()[0]);
 let finish;usb.listDrives=()=>new Promise(resolve=>{finish=resolve;});
 const scan=usb.detectDevices();usb.clearSelection();
 finish([{isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'/robot'}]}]);await scan;
 assert.equal(usb.getSelectedDevice(),undefined);
 assert.equal(usb.getChildren().filter(row=>row.iconPath?.light?.endsWith('connection-green.svg')).length,0);
});

test('USB reconnect preserves verified disk mapping when physical ID is present but associations are empty',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{device:'disk1',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'J:\\'}]}]);
 await usb.detectDevices();
 const known={address:'COM4',name:'E7',physicalId:'usb1',mountpoints:['J:\\'],diskDevices:['disk1']};
 usb.setSerialDevices([known]);assert.equal(usb.getChildren().length,2);
 usb.setSerialState({address:'COM4',name:'E7-RCU',version:'1.2.3'});usb.setSerialState();usb.clearSelection();
 usb.setSerialDevices([]);
 usb.setSerialDevices([{address:'COM4',name:'generic',physicalId:'USB1',mountpoints:[],diskDevices:[]}]);
 usb.setSerialState({address:'COM4',name:'E7-RCU',version:'1.2.3'});
 const rows=usb.getChildren();assert.equal(rows.length,2);assert.equal(rows[0].mountpoint,'J:\\');
 assert.match(rows[0].description,/J:.*COM4/);
 assert.ok(rows[0].iconPath.light.endsWith('connection-green.svg'));
 // A newer verified mapping replaces the cached one.
 usb.listDrives=async()=>[{device:'disk2',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'K:\\'}]}];
 usb.setSerialDevices([{...known,mountpoints:['K:\\'],diskDevices:['disk2']}]);await usb.detectDevices();
 assert.equal(usb.getChildren().length,2);assert.equal(usb.getChildren()[0].mountpoint,'K:\\');
});
test('Changed serial number on the same USB location does not reuse another controller disk',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{device:'disk1',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'J:\\'}]}]);
 await usb.detectDevices();
 usb.setSerialDevices([{address:'COM4',name:'old',physicalId:'USB1',vid:1,pid:2,serialNumber:'old',location:'same',mountpoints:['J:\\'],diskDevices:['disk1']}]);
 usb.setSerialDevices([{address:'COM4',name:'new',physicalId:'USB1',vid:1,pid:2,serialNumber:'new',location:'same',mountpoints:[],diskDevices:[]}]);
 assert.equal(usb.getChildren().length,3);
 assert.equal(usb.getChildren().find(row=>row.serialDevices?.length).mountpoint,'');
});
test('The same physical controller keeps its verified disk when Windows changes its COM number',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{device:'disk1',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'J:\\'}]}]);
 await usb.detectDevices();
 usb.setSerialDevices([{address:'COM4',name:'E7',physicalId:'USB1',mountpoints:['J:\\'],diskDevices:['disk1']}]);
 usb.setSerialDevices([{address:'COM8',name:'E7',physicalId:'USB1',mountpoints:[],diskDevices:[]}]);
 assert.equal(usb.getChildren().length,2);
 assert.match(usb.getChildren()[0].description,/COM8/);assert.doesNotMatch(usb.getChildren()[0].description,/COM4/);
});

test('Switching E6 to E7 on the same drive replaces the cached owner, including after COM disappears',async()=>{
 const usb=new DeviceTreeProvider(async()=>[{device:'disk1',isUSB:true,description:'Joinmax',mountpoints:[{path:'D:\\'}]}]);
 await usb.detectDevices();
 usb.setSerialDevices([{address:'COM9',name:'USB Serial',physicalId:'E6-ID',mountpoints:['D:\\'],diskDevices:['disk1']}]);
 usb.setSerialState({address:'COM9',name:'E6-RCU',version:'2.0.3'});
 usb.setSerialState();usb.setSerialDevices([]);
 usb.listDrives=async()=>[{device:'disk1',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'D:\\'}]}];
 await usb.detectDevices();
 usb.setSerialDevices([{address:'COM10',name:'USB Serial',physicalId:'E7-ID',mountpoints:['d:/'],diskDevices:['disk1']}]);
 assert.equal(usb.getChildren().length,2);
 assert.match(usb.getChildren()[0].description,/COM10/);
 assert.doesNotMatch(usb.getChildren()[0].description,/COM9/);
 usb.setSerialState({address:'COM10',name:'E7-RCU',version:'1.2.3'});usb.setSerialState();
 usb.setSerialDevices([]);
 const rows=usb.getChildren();assert.equal(rows.length,2);assert.equal(rows[0].label,'E7-RCU');
 assert.equal(rows[0].mountpoint,'D:\\');assert.equal(rows[0].serialDevices.length,0);
 assert.ok(rows[0].iconPath.light.endsWith('connection-red.svg'));
 usb.setSerialDevices([{address:'COM10',name:'USB Serial',physicalId:'E7-ID',mountpoints:[],diskDevices:[]}]);
 assert.equal(usb.getChildren().length,2);assert.equal(usb.getChildren()[0].label,'E7-RCU');
});

test('Different live USB controllers on different disks remain separate',async()=>{
 const usb=new DeviceTreeProvider(async()=>[
  {device:'disk1',isUSB:true,description:'Joinmax',mountpoints:[{path:'D:\\'}]},
  {device:'disk2',isUSB:true,description:'MicroPy FS Card',mountpoints:[{path:'E:\\'}]}]);
 await usb.detectDevices();usb.setSerialDevices([
  {address:'COM9',name:'E6-RCU',physicalId:'E6-ID',mountpoints:['D:\\'],diskDevices:['disk1']},
  {address:'COM10',name:'E7-RCU',physicalId:'E7-ID',mountpoints:['E:\\'],diskDevices:['disk2']}]);
 usb.setSerialDevices([]);
 assert.equal(usb.getChildren().length,3);
 assert.deepEqual(usb.getChildren().slice(0,2).map(row=>row.label),['E6-RCU','E7-RCU']);
});

test('Command sections follow the release order with functions last and E7 camera in its own position',()=>{
 const expected=['Контроллер','Моторы','Датчики','Экран','Сервоприводы','ИИ-камера','Bluetooth','Звуки','Матричный экран','Исполнительные устройства','Радиосвязь','IoT','Колёсная база','Циклы, условия и функции'];
 assert.deepEqual(trees.E7_TREE.map(node=>node.label),expected);
 assert.deepEqual(trees.ERCU_TREE.map(node=>node.label),expected.filter(label=>label!=='ИИ-камера'));
 assert.equal(trees.HRCU_TREE[0].label,'Контроллер');
 assert.equal(trees.HRCU_TREE.at(-1).label,'Циклы, условия и функции');
 assert.ok(trees.HRCU_TREE.some(node=>node.label==='Mecanum колёса'));
 assert.ok(trees.HRCU_TREE.some(node=>node.label==='AI Cloud'));
});

function favoriteStorage(initial=[]){
 const data=new Map([['favoriteCommands',initial]]);
 return {get:(key,fallback)=>data.has(key)?data.get(key):fallback,update:async(key,value)=>data.set(key,value),data};
}
function regularCommand(provider,id){
 const walk=nodes=>nodes.flatMap(node=>[node,...walk(node.children||[])]);
 return walk(provider.getChildren().slice(1)).find(node=>node.commandId===id);
}
test('Favorites is an empty first section and preserves the existing section order',()=>{
 const provider=new CommandTreeProvider('E7');
 const roots=provider.getChildren();assert.equal(roots[0].label,'Избранное');
 assert.equal(roots[0].commandId,undefined);assert.equal(roots[0].contextValue,'commandGroup');
 assert.deepEqual(provider.getChildren(roots[0]),[]);
 assert.deepEqual(roots.slice(1).map(node=>node.label),trees.E7_TREE.map(node=>node.label));
});
test('Favorite addition persists, ignores duplicates and retains the normal command entry',async()=>{
 const storage=favoriteStorage();const provider=new CommandTreeProvider('E7',storage);
 const regular=regularCommand(provider,'motor.SetMotor');
 await Promise.all([provider.addFavorite(regular.commandId),provider.addFavorite(regular.commandId),provider.addFavorite('rcu.GetData')]);
 const favorites=provider.getChildren()[0];
 assert.equal(favorites.collapsibleState,vscode.TreeItemCollapsibleState.Collapsed);
 assert.deepEqual(favorites.children.map(node=>node.commandId),['motor.SetMotor','rcu.GetData']);
 assert.equal(favorites.children[0].contextValue,'favoriteRobotCommand');
 assert.deepEqual(favorites.children[0].command,regular.command);
 assert.equal(regularCommand(provider,'motor.SetMotor').contextValue,'robotCommand');
 assert.deepEqual(new CommandTreeProvider('E7',storage).getChildren()[0].children.map(node=>node.commandId),['motor.SetMotor','rcu.GetData']);
});
test('Removing favorites preserves the original command and persists an empty favorites section',async()=>{
 const storage=favoriteStorage(['motor.SetMotor']);const provider=new CommandTreeProvider('E-RCU',storage);
 await provider.removeFavorite('motor.SetMotor');
 assert.deepEqual(provider.getChildren()[0].children,[]);
 assert.ok(regularCommand(provider,'motor.SetMotor'));
 assert.deepEqual(new CommandTreeProvider('E-RCU',storage).getChildren()[0].children,[]);
 await provider.removeFavorite('motor.SetMotor');assert.deepEqual(storage.data.get('favoriteCommands.E-RCU'),[]);
});
test('Favorites are independent for each controller and restore when returning to E7',async()=>{
 const provider=new CommandTreeProvider('E7',favoriteStorage());
 await provider.addFavorite('aicam.GetAICam');await provider.addFavorite('motor.SetMotor');
 provider.setController('E-RCU');assert.deepEqual(provider.getChildren()[0].children,[]);
 await provider.addFavorite('motor.SetMotor');await provider.removeFavorite('motor.SetMotor');
 provider.setController('H-RCU');assert.deepEqual(provider.getChildren()[0].children,[]);
 provider.setController('E7');assert.deepEqual(provider.getChildren()[0].children.map(node=>node.commandId),['aicam.GetAICam','motor.SetMotor']);
 assert.equal(provider.getChildren()[0].children[0].controller,'E7');
});
test('Invalid entries and persistence failures do not corrupt favorites or prevent the next save',async()=>{
 const storage=favoriteStorage(['motor.SetMotor','motor.SetMotor',null,32,'nonexistent']);
 const provider=new CommandTreeProvider('E-RCU',storage);
 assert.equal(provider.getChildren()[0].children.length,1);
 await assert.rejects(provider.addFavorite(),/конкретную/);
 await assert.rejects(provider.addFavorite('aicam.GetAICam'),/конкретную/);
 const update=storage.update;storage.update=async()=>{throw Error('write failed');};
 await assert.rejects(provider.removeFavorite('motor.SetMotor'),/write failed/);
 assert.equal(provider.getChildren()[0].children.length,1);
 storage.update=update;await provider.removeFavorite('motor.SetMotor');assert.equal(provider.getChildren()[0].children.length,0);
});
test('Both favorite context actions are registered and information is available in both locations',async()=>{
 const previousView=vscode.window.createTreeView;let provider;
 vscode.window.createTreeView=(id,options)=>{if(id==='rcuCommands')provider=options.treeDataProvider;return {dispose(){}};};
 const context={globalState:favoriteStorage(),subscriptions:[],extensionPath:path.join(__dirname,'..')};
 try{
  activate(context);
  await commands.get('extension.addFavorite')(regularCommand(provider,'motor.SetMotor'));
  assert.equal(provider.getChildren()[0].children[0].commandId,'motor.SetMotor');
  await commands.get('extension.removeFavorite')(provider.getChildren()[0].children[0]);
  assert.deepEqual(provider.getChildren()[0].children,[]);
  const menu=require('../package.json').contributes.menus['view/item/context'];
  assert.equal(menu.find(item=>item.command==='extension.addFavorite').when,'view == rcuCommands && viewItem == robotCommand');
  assert.equal(menu.find(item=>item.command==='extension.removeFavorite').when,'view == rcuCommands && viewItem == favoriteRobotCommand');
  const info=menu.find(item=>item.command==='extension.showCommandInfo').when;
  assert.match(info,/robotCommand/);assert.match(info,/favoriteRobotCommand/);
 }finally{vscode.window.createTreeView=previousView;for(const disposable of context.subscriptions)disposable.dispose();}
});

test('Switching controllers during a queued save keeps favorites with the originating controller',async()=>{
 const storage=favoriteStorage();const provider=new CommandTreeProvider('E7',storage);
 const saving=provider.addFavorite('motor.SetMotor');provider.setController('E-RCU');
 await saving;assert.deepEqual(provider.getChildren()[0].children,[]);
 assert.deepEqual(storage.data.get('favoriteCommands.E7'),['motor.SetMotor']);
 await provider.addFavorite('rcu.GetData');
 assert.deepEqual(new CommandTreeProvider('E-RCU',storage).getChildren()[0].children.map(n=>n.commandId),['rcu.GetData']);
 provider.setController('E7');assert.deepEqual(provider.getChildren()[0].children.map(n=>n.commandId),['motor.SetMotor']);
});

test('Bluetooth and USB scans use the shipped Windows runtime and dependency commands install nothing',async()=>{
 const {BluetoothOperations}=require('../out/BluetoothOperations');
 const {BluetoothBridge}=require('../out/BluetoothBridge');
 const platform=Object.getOwnPropertyDescriptor(process,'platform');
 const priorCall=BluetoothBridge.prototype.call,priorProgress=vscode.window.withProgress,priorLocation=vscode.ProgressLocation;
 const childProcess=require('node:child_process'),priorSpawn=childProcess.spawn;
 const launches=[],operations=[];
 try {
  Object.defineProperty(process,'platform',{...platform,value:'win32'});
  vscode.window.withProgress=(_options,task)=>task();vscode.ProgressLocation={Window:10};
  childProcess.spawn=()=>{throw Error('No installation process should run');};
  BluetoothBridge.prototype.call=async function(action){launches.push({executable:this.executable(),script:this.pythonScript,action});return [];};
  const tree={setDevices(){},setState(){},setConnecting(){}};
  for(const usb of [false,true]){
   const operation=new BluetoothOperations(path.join(__dirname,'..'),tree,()=>{},{usb});operations.push(operation);
   await operation.scan();await operation.installDependency();
  }
  assert.deepEqual(launches.map(row=>row.script),['bluetooth_bridge.py','usb_bridge.py']);
  assert.ok(launches.every(row=>row.executable===path.join(__dirname,'..','runtime','win32-x64','python.exe')));
 }finally{
  operations.forEach(operation=>operation.dispose());Object.defineProperty(process,'platform',platform);
  BluetoothBridge.prototype.call=priorCall;childProcess.spawn=priorSpawn;vscode.window.withProgress=priorProgress;vscode.ProgressLocation=priorLocation;
 }
});

test('E6 language switch changes commands and system actions; other controllers stay Python',async()=>{
 const storage=favoriteStorage(),previousView=vscode.window.createTreeView;let provider,system;
 vscode.window.createTreeView=(id,options)=>{if(id==='rcuCommands')provider=options.treeDataProvider;if(id==='systemCommands')system=options.treeDataProvider;return {dispose(){}};};
 const context={extensionPath:path.join(__dirname,'..'),globalState:storage,subscriptions:[]};
 try {
  activate(context);await provider.addFavorite('motor.SetMotor');
  assert.equal(system.getChildren().at(-1).label,'Переключиться на C');
  await commands.get('extension.setCMode')();
  assert.equal(storage.data.get('e6Language'),'c');assert.ok(regularCommand(provider,'c.SetMotor'));assert.equal(regularCommand(provider,'motor.SetMotor'),undefined);
  assert.equal(system.getChildren()[0].label,'Создать C-файл для E6');
  assert.equal(system.getChildren().at(-1).label,'Переключиться на Python');
  assert.ok(!system.getChildren().some(row=>['extension.compileC','extension.showCLog'].includes(row.command.command)));
  assert.deepEqual(provider.getChildren()[0].children,[]);await provider.addFavorite('c.SetMotor');
  await commands.get('extension.setPythonMode')();assert.deepEqual(provider.getChildren()[0].children.map(n=>n.commandId),['motor.SetMotor']);
  await commands.get('extension.setCMode')();assert.deepEqual(provider.getChildren()[0].children.map(n=>n.commandId),['c.SetMotor']);
  await commands.get('extension.setE7')();assert.ok(regularCommand(provider,'aicam.GetAICam'));assert.equal(regularCommand(provider,'c.SetMotor'),undefined);
  assert.equal(system.getChildren().length,3);
  const count=notices.length;await commands.get('extension.setCMode')();assert.ok(notices.slice(count).some(message=>/только для E6/.test(message)));
  await commands.get('extension.setErcu')();assert.ok(regularCommand(provider,'c.SetMotor'));
 }finally{vscode.window.createTreeView=previousView;context.subscriptions.forEach(item=>item.dispose());}
});

test('E6 Python ports save four motors and eight sensors and reject hidden motor ports',()=>{
 const rows=ports.getPortRows('',4);assert.equal(rows.length,12);
 rows[3].names='RIGHT_MOTOR';rows[11].names='SENSOR_EIGHT';
 const edit=ports.buildPortEdit('import rcu\n',rows,4);
 assert.match(edit.replacement,/RIGHT_MOTOR = 4/);assert.match(edit.replacement,/SENSOR_EIGHT = 8/);
 assert.deepEqual(ports.getPortRows(edit.replacement,4),rows);
 const bad=rows.map(row=>({...row}));bad[3].port=5;
 assert.throws(()=>ports.buildPortEdit('',bad,4),/данные портов/);
 assert.equal(ports.getPortRows('',8).length,16);
});

test('C examples use the examples page and open C documents from a validated catalog',async()=>{
 const html=programExamples('vscode-test','E-RCU','c');
 assert.match(html,/data-file="C_03_line_pd.c"/);assert.doesNotMatch(html,/aicam_01_probe.py/);
 const originalOpen=vscode.workspace.openTextDocument,originalShow=vscode.window.showTextDocument;
 let opened;
 vscode.workspace.openTextDocument=async options=>{opened=options;return options;};
 vscode.window.showTextDocument=async()=>{};
 try {
  await files.openExampleFile('C_03_line_pd.c',path.join(__dirname,'..'),'c');
  assert.equal(opened.language,'c');assert.match(opened.content,/void LinePD\(void\)/);
  await assert.rejects(files.openExampleFile('../package.json',path.join(__dirname,'..'),'c'),/Неизвестный пример/);
 }finally{vscode.workspace.openTextDocument=originalOpen;vscode.window.showTextDocument=originalShow;}
});
