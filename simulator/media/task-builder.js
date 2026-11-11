/* Visual task model and compiler. No DOM dependencies: also used by tests. */
'use strict';
(function(root){
const n=(tag,attrs={},children=[])=>({tag,attrs,children});
const both=cs=>n('conditions',{glue:'and'},cs);
const either=cs=>n('conditions',{glue:'or'},cs);
const no=c=>n('not',{},[c]);
const inside=(objectId,regionId)=>n('inside',{objectId,regionId});
const num=value=>n('double',{value:String(value)});
const variable=name=>n('variableValue',{name});
const points=value=>n('setter',{name:'total_score'},[n('sum',{},[variable('total_score'),num(value)])]);
const done=id=>n('equals',{},[variable('__done_'+id),num(1)]);
const types={reach:'Доехать до зоны',visit:'Посетить несколько зон',deliver:'Доставить предметы',eject:'Вытолкнуть предметы из зоны',stop:'Остановиться в зоне'};
function empty(){return {version:1,title:'Новое задание',description:'',order:'sequence',limit:0,timeout:'fail',start:null,steps:[],violations:[],finish:{mode:'all',robot:'',region:''}};}
function objects(step,env){return step.group?env.props.filter(p=>p.kind===step.group).map(p=>p.id):step.objects||[];}
function validate(m,env){
 const errors=[],rids=new Set(env.regions.map(r=>r.id)),bots=new Set(env.robots.map(r=>r.id)),pids=new Set(env.props.map(p=>p.id));
 const region=(id,label)=>{if(!rids.has(id))errors.push(label+': выберите существующую зону.');};
 const robot=(id,label)=>{if(!bots.has(id))errors.push(label+': выберите робота.');};
 if(!m||m.version!==1)return ['Неизвестная версия конструктора.'];
 if(!m.title?.trim())errors.push('Введите название задания.');
 if(!['sequence','any'].includes(m.order))errors.push('Выберите порядок этапов.');
 if(!Number.isFinite(m.limit)||m.limit<0)errors.push('Лимит времени должен быть неотрицательным числом.');
 if(m.steps.length>60||m.violations.length>30)errors.push('Допускается до 60 этапов и 30 нарушений.');
 if(m.start){robot(m.start.robot,'Перед стартом');region(m.start.region,'Перед стартом');}
 if(!m.steps.length)errors.push('Добавьте хотя бы один этап.');
 if(new Set(m.steps.map(s=>s.id)).size!==m.steps.length)errors.push('У этапов должны быть разные идентификаторы.');
 for(const [i,s]of m.steps.entries()){
  const label='Этап '+(i+1);
  if(!types[s.type]){errors.push(label+': выберите тип условия.');continue;}
  if(!Number.isFinite(s.points)||s.points<0)errors.push(label+': укажите неотрицательное число баллов.');
  if(['reach','visit','stop'].includes(s.type))robot(s.robot,label);
  if(s.type==='visit'){
   if(!s.regions?.length)errors.push(label+': добавьте зоны маршрута.');
   else s.regions.forEach(id=>region(id,label));
  }else region(s.region,label);
  if(['deliver','eject'].includes(s.type)){
   const ids=objects(s,env);
   if(!ids.length)errors.push(label+': на поле нет выбранных предметов.');
   if(ids.some(id=>!pids.has(id)))errors.push(label+': выбранный предмет удалён с поля.');
   if(!Number.isInteger(s.count)||s.count<0||s.count>ids.length)errors.push(label+': количество превышает число выбранных предметов.');
  }
  if(s.type==='stop'&&(!Number.isFinite(s.seconds)||s.seconds<0.1))errors.push(label+': укажите длительность остановки от 0,1 с.');
 }
 for(const v of m.violations){robot(v.robot,'Нарушение');region(v.region,'Нарушение');if(!Number.isFinite(v.penalty)||v.penalty<0)errors.push('Штраф должен быть неотрицательным числом.');}
 if(m.finish.mode==='all'&&!m.steps.some(s=>!s.optional))errors.push('Для завершения нужен хотя бы один обязательный этап.');
 if(m.finish.mode==='zone'){robot(m.finish.robot,'Финиш');region(m.finish.region,'Финиш');}
 if(m.finish.mode==='time'&&!(m.limit>0))errors.push('Для завершения по времени укажите лимит.');
 return [...new Set(errors)];
}
function compile(m,env){
 const errors=validate(m,env);if(errors.length)throw Error(errors.join('\n'));
 const nodes=[n('init',{},[n('setter',{name:'total_score'},[num(0)])])],completion=[],liveFinal=[];
 const event=(id,condition,actions,enabled=true,extra={})=>{nodes.push(n('event',{id,settedUpInitially:String(enabled),dropsOnFire:'true',...extra},[condition.tag==='conditions'?condition:n('condition',{},[condition]),n('triggers',{},[n('setter',{name:'__done_'+id},[num(1)]),...actions])]));};
 if(m.limit>0&&m.finish.mode!=='time'&&m.timeout!=='finish')nodes.push(n('timelimit',{value:String(m.limit*1000)}));
 if(m.start)nodes.push(n('constraint',{checkOnce:'true',failMessage:'Робот должен находиться в стартовой зоне.'},[inside(m.start.robot,m.start.region)]));
 // Violations are evaluated before stages and success, independently of order.
 m.violations.forEach((v,i)=>event('Нарушение '+(i+1),inside(v.robot,v.region),[
  ...(v.penalty?[points(-v.penalty)]:[]),n('message',{text:v.message||'Заезд в запрещённую зону'}),...(v.action==='fail'?[n('fail',{message:v.message||'Заезд в запрещённую зону'})]:[])
 ],true,{priority:'10',dropsOnFire:String(v.repeat!=='entry'),edge:String(v.repeat==='entry')}));
 const stepIds=m.steps.map((s,i)=>'Этап '+(i+1));
 m.steps.forEach((s,i)=>{
  const id=stepIds[i],enabled=true,actions=[n('message',{text:s.message||((s.name||types[s.type])+': выполнено')})];
  const gate=both(m.order==='sequence'?m.steps.slice(0,i).flatMap((prev,j)=>prev.optional?[]:[done(stepIds[j])]):[]);
  let condition;
  if(['deliver','eject'].includes(s.type)){
   const ids=objects(s,env),awards=[];
   ids.forEach((obj,j)=>{
    const aid=id+' · предмет '+(j+1),hit=s.type==='eject'?no(inside(obj,s.region)):inside(obj,s.region);awards.push(aid);
    event(aid,both([gate,hit]),[...(s.points?[points(s.points)]:[]),n('message',{text:(s.name||types[s.type])+': предмет '+(j+1)+' · +'+s.points+' баллов'})],true);
   });
   const hits=ids.map(obj=>s.type==='eject'?no(inside(obj,s.region)):inside(obj,s.region));
   const sum=cs=>n('sum',{},cs);const enough=cs=>n('greater',{},[sum(cs),num((s.count||ids.length)-1)]);
   condition=both([enough(awards.map(done)),...(s.simultaneous!==false?[enough(hits)]:[])]);
   if(s.simultaneous!==false&&!s.optional)liveFinal.push(enough(hits));
  }else if(s.type==='visit'){
   const visits=[];
   s.regions.forEach((rid,j)=>{
    const vid=id+' · точка '+(j+1);visits.push(vid);
    const previous=s.routeOrder!=='any'&&j>0?done(visits[j-1]):gate;
    event(vid,both([previous,inside(s.robot,rid)]),[],true);
   });condition=both(visits.map(done));
   if(s.points)actions.unshift(points(s.points));
  }else{
   condition=inside(s.robot,s.region);
   if(s.type==='stop')condition=n('stationary',{objectId:s.robot,regionId:s.region,seconds:String(s.seconds)});
   if(s.points)actions.unshift(points(s.points));
  }
  // Only one completed stage per card; optional repeating awards remain separate.
  event(id,both([gate,condition]),actions,enabled);
  if(!s.optional)completion.push(done(id));
  if(s.repeat==='entry'&&['reach','stop'].includes(s.type)){
   const armed=id+' · ожидание выхода';
   event(armed,both([done(id),no(inside(s.robot,s.region))]),[]);
   event(id+' · повтор',both([done(armed),condition]),[points(s.points)],true,{edge:'true',dropsOnFire:'false'});
  }
 });
 const finish=[n('message',{text:'Задание полностью выполнено!'}),n('success')];
 if(m.finish.mode==='time'||(m.limit>0&&m.timeout==='finish'))event('Время истекло',n('timer',{timeout:String(m.limit*1000)}),[n('success',{message:'Время вышло. Попытка завершена.'})]);
 if(m.finish.mode!=='time')event('Завершение задания',both([...completion,...liveFinal,...(m.finish.mode==='zone'?[inside(m.finish.robot,m.finish.region)]:[])]),finish);
 return {nodes,aliases:{},builder:structuredClone(m)};
}
function bigTravel(robot,env){
 const m=empty();m.title='Большое путешествие';m.description='Пройдите три части маршрута по порядку, затем вытолкните восемь банок из круга. Максимум — 200 баллов.';m.limit=800;m.start={robot,region:'Start'};
 m.steps=[40,80,40].map((p,i)=>({id:'travel'+i,type:'reach',name:'Часть '+(i+1),robot,region:'Finish'+(i+1),points:p,optional:false}));
 m.steps.push({id:'ring',type:'eject',name:'Кегельринг',objects:env.props.filter(p=>/^\{skittle[1-8]\}$/.test(p.id)).map(p=>p.id),group:'',region:'Finish4',points:5,count:0,simultaneous:true,optional:false});return m;
}
root.TaskBuilder={empty,types,objects,validate,compile,bigTravel};
if(typeof module!=='undefined')module.exports=root.TaskBuilder;
})(globalThis);
