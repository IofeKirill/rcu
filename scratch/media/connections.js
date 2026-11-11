/* Both transports share the main extension's selected robot and connection. */
(function(root){
'use strict';
root.RoboConnections=function(vscode,getController,status){
 const $=id=>document.getElementById(id);let state={connected:false},pending=false;
 const buttons=[$('connectUSB'),$('connectBluetooth'),$('disconnectRobot')];
 function render(){
  const busy=pending||!!state.busy;
  $('connectionButton').classList.toggle('connected',!!state.connected);
  $('connectionButton').classList.toggle('connecting',busy);
  $('connectionLabel').textContent=busy?'Подключение…':state.connected?(state.transport==='bluetooth'?'Bluetooth':'USB'):'Подключить';
  $('connectionButton').title=state.connected?`${state.name||'Робот'} · ${state.address||''}`:'Подключение к роботу';
  $('connectionState').textContent=!vscode?'Подключение доступно внутри VS Code.':busy?'Поиск или подключение к роботу…':state.connected?`${state.name||'Робот'} · ${state.address||''}${state.canRun?'':' · запуск из меню робота'}`:'Робот не подключён. Выбери способ подключения.';
  buttons.forEach(b=>b.disabled=!vscode||busy);$('disconnectRobot').hidden=!state.connected;$('controller').disabled=busy;
 }
 function connect(transport){if(!vscode||pending)return;pending=true;render();vscode.postMessage({kind:'connect',transport,controller:getController()});}
 $('connectionButton').onclick=()=>{$('connectionDialog').showModal();if(vscode)vscode.postMessage({kind:'connectionStatus'});render();};
 $('closeConnection').onclick=()=>$('connectionDialog').close();
 $('connectUSB').onclick=()=>connect('usb');$('connectBluetooth').onclick=()=>connect('bluetooth');
 $('disconnectRobot').onclick=()=>{if(!vscode||pending)return;pending=true;render();vscode.postMessage({kind:'disconnect'});};
 window.addEventListener('message',({data:m})=>{
  if(!['connectionStatus','connectionResult'].includes(m?.kind))return;
  if(m.state)state=m.state;
  if(m.kind==='connectionResult'){
   pending=false;render();
   if(m.error)status(m.error,true);
   else if(state.connected){$('connectionDialog').close();status('Подключено: '+(state.name||'Робот')+' · '+(state.address||''));}
   else status(m.operation==='disconnect'?'Робот отключён':'Подключение не изменено');
  }else render();
 });
 render();return {connect,get state(){return state;}};
};
})(globalThis);
