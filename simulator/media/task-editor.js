'use strict';
let regions=[],taskSpec=null,taskState=null;
const propIds=new Map();let objectSerial=0;
const taskEl=id=>document.getElementById(id);
const node=(tag,attrs={},children=[])=>({tag,attrs,children});
let taskDraft=null,taskPick=null,manualPreview=false,previewCheckpoint=null;
function newObjectId(prefix) {
    let id;const used=new Set([...regions.map(r=>r.id),...propIds.values(),...robots.map(r=>r.id)]);
    do{id=prefix+(++objectSerial);}while(used.has(id));return id;
}
function propId(row) {if(!propIds.has(row))propIds.set(row,newObjectId(row[2]));return propIds.get(row);}
function importTaskData(s) {
    regions=structuredClone(s.regions??[]);taskSpec=structuredClone(s.task??null);taskState=null;propIds.clear();
    (s.props??[]).forEach((row,i)=>propIds.set(row,s.propIds?.[i]??newObjectId(row[2])));
    if(taskSpec&&!taskSpec.builder&&JSON.stringify(taskSpec.nodes)===JSON.stringify(BIG_TRAVEL.task.nodes))
        taskSpec.builder=TaskBuilder.bigTravel(robots[0].id,taskEnvironment());
    previewCheckpoint=null;refreshTaskEditor();
}
function taskChange(action) {
    const capture=()=>({regions:regions.map(row=>({row,value:structuredClone(row)})),taskSpec:structuredClone(taskSpec)});
    const before=capture();action();const after=capture();
    const restore=s=>{regions.splice(0,regions.length,...s.regions.map(({row,value})=>{Object.assign(row,structuredClone(value));return row;}));taskSpec=structuredClone(s.taskSpec);selectedObject=undefined;refreshTaskEditor();reset();};
    record(()=>restore(before),()=>restore(after));refreshTaskEditor();reset();
}
function drawRegions() {
    for(const region of regions) {
        const selected=selectedObject?.key==='region'&&selectedObject.row===region;
        if(!taskEl('showRegions').checked||(!region.visible&&taskPick?.kind!=='region'))continue;
        const [x,y,w,h]=region.rect;
        ctx.save();ctx.beginPath();
        if(region.kind==='ellipse')ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);else ctx.rect(x,y,w,h);
        ctx.fillStyle=(region.color??'#bb55aa')+'18';ctx.fill();
        ctx.strokeStyle=region.color??'#bb55aa';ctx.lineWidth=(selected?2:1)/scale;ctx.setLineDash([5/scale,3/scale]);ctx.stroke();
        ctx.clip();ctx.setLineDash([]);ctx.lineWidth=.65/scale;
        for(let at=-h;at<w;at+=10/scale){ctx.beginPath();ctx.moveTo(x+at,y);ctx.lineTo(x+at+h,y+h);ctx.stroke();}
        ctx.restore();ctx.save();ctx.font='12px sans-serif';ctx.translate(x,y);ctx.scale(1/scale,1/scale);ctx.fillStyle='#303030';ctx.fillText(region.name||region.id,3,-5);ctx.restore();
    }
}
function taskEnvironment(){return {robots,regions,props:props.map(row=>({id:propId(row),kind:row[2]}))};}
function compiledTask(){
    if(!taskSpec?.builder)return taskSpec;
    return TaskBuilder.compile(taskSpec.builder,taskEnvironment());
}
function refreshTaskEditor(){
    const list=taskEl('regionList');list.replaceChildren();
    for(const region of regions){
        const row=element('div','',list);row.className='task-row';
        const select=element('button',region.name||region.id,row);select.disabled=busy||fieldLocked;
        select.onclick=()=>{selectTool('pan');selectTarget({obj:{key:'region',list:regions,row:region}});taskEl('showRegions').checked=true;refreshRegionFields();draw();};
        const toggle=element('button',region.visible?'◉':'○',row);toggle.disabled=busy;toggle.title='Показать или скрыть зону';
        toggle.onclick=()=>taskChange(()=>{region.visible=!region.visible;});
    }
    taskEl('editTask').hidden=taskSpec?.kind==='tennis';
    taskEl('taskTitle').textContent=(taskSpec?.kind==='tennis'?'Теннис · регламент':taskSpec?.builder?.title)||'Задание';
    taskEl('taskDescription').textContent=(taskSpec?.kind==='tennis'?tennisDescription:taskSpec?.builder?.description)||(!taskSpec?'Создайте задание или загрузите готовое поле.':'Задание с правилами проверки.');
    taskEl('editTask').disabled=busy;
    taskEl('previewTask').disabled=busy||!taskSpec;
    taskEl('previewTask').setAttribute('aria-pressed',String(manualPreview));
    taskEl('previewHelp').hidden=taskEl('previewControls').hidden=!manualPreview;
    refreshRegionFields();renderTaskResult();
}
function refreshRegionFields(){
    const r=selectedObject?.key==='region'?selectedObject.row:null;taskEl('regionFields').hidden=!r;
    if(r){taskEl('regionName').value=r.name||r.id;taskEl('regionColor').value=r.color??'#bb55aa';taskEl('regionVisible').checked=r.visible;}
}
function renderTaskResult(){
    renderTennisControls();
    const state=taskState,status={running:'Выполняется',success:'Выполнено',failed:'Нарушение',incomplete:'Не завершено'};
    taskEl('taskResult').textContent=training?'Тренировочный режим — без оценки':state?`${manualPreview?'Ручная проверка · ':''}${status[state.status]??state.status} · Баллы: ${state.score} · Время: ${state.time} с`:'Задание не запущено';
    taskEl('taskReason').textContent=training?'':state?.reason??'';
    taskEl('taskMessages').textContent=(state?.messages??[]).map(m=>`${m.time} с · ${m.text}`).join('\n');
    taskEl('taskCounters').textContent=state?Object.entries(state.variables).filter(([k])=>!k.startsWith('__')).map(([k,v])=>k+': '+v).join('\n'):'';
    taskEl('taskEvents').textContent=(state?.events??[]).map(e=>`${e.time} с · ${e.id}${e.object?' · '+e.object:''}`).join('\n');
    if(state?.tennis&&!training){taskEl('taskResult').textContent=`Сет: ${state.tennis.scores.join(' : ')} · ${state.time} / 60 с`;taskEl('taskReason').textContent=state.reason;}
    const progress=taskEl('taskProgress');progress.replaceChildren();
    (taskSpec?.builder?.steps??[]).forEach((s,i)=>element('li',(state?.variables?.['__done_Этап '+(i+1)]?'✓ ':'')+(s.name||TaskBuilder.types[s.type])+(s.optional?' (дополнительный)':''),progress));
}
function ringTask(region){
    const model=TaskBuilder.empty();model.title='Кегельринг';model.description='Вытолкните все банки из круга. За каждую банку — 5 баллов.';
    model.steps=[{id:'ring',name:'Вытолкнуть банки',type:'eject',region:region.id,group:'can',objects:[],count:0,points:5,simultaneous:false,optional:false}];
    return {nodes:[],aliases:{},builder:model};
}
for(const [id,visible]of [['regionsShowAll',true],['regionsHideAll',false]])taskEl(id).onclick=()=>taskChange(()=>{for(const r of regions)r.visible=visible;});
taskEl('showRegions').onchange=()=>draw();
for(const id of ['regionName','regionColor','regionVisible'])taskEl(id).onchange=()=>{
    const r=selectedObject?.key==='region'?selectedObject.row:null;if(!r||(fieldLocked&&id!=='regionVisible'))return;
    taskChange(()=>{r.name=taskEl('regionName').value.trim()||r.id;r.color=taskEl('regionColor').value;r.visible=taskEl('regionVisible').checked;});
};
// Draft fields update only the draft. Save compiles and validates as one undoable change.
const ui=(tag,text,parent)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(parent)parent.append(el);return el;};
function field(parent,title,value,change,type='text'){
    const label=ui('label',title+' ',parent),input=ui('input','',label);input.type=type;input.setAttribute('aria-label',title);
    if(type==='checkbox')input.checked=!!value;else input.value=value??'';
    if(type==='number'){input.step='any';input.min='0';}else if(type==='text')input.maxLength=1000;
    input.onchange=()=>{change(type==='checkbox'?input.checked:type==='number'?Number(input.value):input.value);updateSummaries();};return input;
}
function choice(parent,title,value,options,change){
    const label=ui('label',title+' ',parent),sel=ui('select','',label);sel.setAttribute('aria-label',title);
    for(const [key,text]of options){const o=ui('option',text,sel);o.value=key;}sel.value=value??'';
    sel.onchange=()=>{change(sel.value);renderDraft();};return sel;
}
function button(parent,text,action){const b=ui('button',text,parent);b.type='button';b.onclick=action;return b;}
const robotOptions=()=>[['','Выберите робота'],...robots.map(r=>[r.id,r.name])];
const zoneOptions=()=>[['','Выберите зону'],...regions.map(r=>[r.id,r.name||r.id])];
function zoneField(parent,title,owner,key='region'){
    choice(parent,title,owner[key],zoneOptions(),v=>owner[key]=v);
    const tools=ui('div','',parent);tools.className='card-tools';
    button(tools,'Выбрать зону на поле',()=>startTaskPick('region',id=>{owner[key]=id;}));
    button(tools,'Нарисовать зону',()=>startTaskPick('draw',id=>{owner[key]=id;}));
}
function startTaskPick(kind,apply){
    if(kind==='draw'&&fieldLocked){taskEl('taskDraftErrors').textContent='Чтобы нарисовать зону, сначала снимите блокировку поля.';return;}
    taskPick={kind,apply};taskEl('taskDialog').close();selectTool(kind==='draw'?'regionRect':'pan');
    taskEl('showRegions').checked=true;draw();
    taskEl('status').textContent=kind==='draw'?'Нарисуйте прямоугольную зону. После этого редактор откроется снова.':'Нажмите на '+(kind==='region'?'зону':'предмет')+' на поле. Escape — отмена выбора.';
}
function finishTaskPick(id){const pick=taskPick;taskPick=null;if(id)pick.apply(id);draw();renderDraft();taskEl('taskDialog').showModal();}
function handleTaskPick(x,y){
    if(!taskPick||taskPick.kind==='draw')return false;
    if(taskPick.kind==='region'){
        const r=[...regions].reverse().find(r=>objectHit('region',r,x,y));
        if(r)finishTaskPick(r.id);else taskEl('status').textContent='Здесь нет зоны. Выберите размеченную область.';
    }else{
        const p=[...props].reverse().find(p=>Math.hypot(propPosition(p)[0]-x,propPosition(p)[1]-y)<propRadius(p[2])+3/scale);
        if(p)finishTaskPick(propId(p));else taskEl('status').textContent='Выберите банку или мяч.';
    }return true;
}
function draftStep(type='reach'){
    return {id:'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:TaskBuilder.types[type],type,robot:active.id,region:'',regions:[],routeOrder:'sequence',group:'can',objects:[],count:0,points:0,seconds:1,optional:false,simultaneous:true,repeat:'once',message:''};
}
function summary(s){
    const z=id=>regions.find(r=>r.id===id)?.name||'не выбрана',r=robots.find(r=>r.id===s.robot)?.name||'робот';
    if(['deliver','eject'].includes(s.type)){
        const count=TaskBuilder.objects(s,taskEnvironment()).length;
        return `${s.type==='deliver'?'Доставить в зону':'Вытолкнуть из зоны'} «${z(s.region)}»: ${s.count||count} из ${count} предметов. За каждый — ${s.points} баллов, один раз за предмет.${s.simultaneous?' Для завершения предметы должны одновременно находиться в нужном положении.':''}`;
    }
    if(s.type==='visit')return `${r}: посетить ${s.regions.map(z).join(' → ')||'выбранные зоны'} ${s.routeOrder==='any'?'в любом порядке':'по очереди'}. ${s.points} баллов за весь маршрут.`;
    return `${r}: ${s.type==='stop'?'остановиться на '+s.seconds+' с':'доехать'} в зоне «${z(s.region)}». ${s.points} баллов${s.repeat==='entry'?' за каждый новый вход':' однократно'}.`;
}
function updateSummaries(){document.querySelectorAll('[data-summary]').forEach(el=>{const s=taskDraft?.steps.find(s=>s.id===el.dataset.summary);if(s)el.textContent=summary(s);});}
function template(name){
    const m=TaskBuilder.empty();m.finish.robot=active.id;
    if(name==='travel')return TaskBuilder.bigTravel(active.id,taskEnvironment());
    if(name!=='empty'){
        const type={finish:'reach',route:'visit',delivery:'deliver',ring:'eject'}[name],s=draftStep(type);
        s.points=name==='ring'?5:10;m.steps=[s];m.title={finish:'Доехать до финиша',route:'Маршрут по точкам',delivery:'Доставка предметов',ring:'Кегельринг'}[name];
        if(name==='ring'){s.name='Вытолкнуть банки';s.simultaneous=false;}
    }return m;
}
function renderDraft(){
    const root=taskEl('taskDraftBody');root.replaceChildren();taskEl('taskDraftErrors').textContent='';
    const nav=ui('nav','',root);nav.className='section-links';
    if(!taskDraft){
        ui('p','Это задание использует сложные правила. Они сохранятся при открытии и запуске. Можно отредактировать JSON или создать новое задание вместо существующего.',root);
        button(root,'Создать новое задание вместо существующего',()=>{taskDraft=TaskBuilder.empty();renderDraft();});renderAdvanced(root);return;
    }
    for(const [id,title]of [['description','Описание'],['steps','Этапы'],['violations','Нарушения'],['finish','Завершение']])button(nav,title,()=>taskEl('draft-'+id).scrollIntoView({block:'start'}));
    const a=ui('section','',root);a.id='draft-description';ui('h2','Описание',a);
    const presets=ui('details','',a);ui('summary','Начать с шаблона',presets);ui('p','Выбор шаблона заменит несохранённые настройки задания. Поле и предметы сохранятся.',presets);
    const ts=ui('div','',presets);ts.className='template-buttons';
    for(const [id,title]of [['empty','Пустое задание'],['finish','Доехать до финиша'],['route','Маршрут по точкам'],['delivery','Доставка'],['ring','Кегельринг']])button(ts,title,()=>{taskDraft=template(id);renderDraft();});
    field(a,'Название',taskDraft.title,v=>taskDraft.title=v);
    const label=ui('label','Текст для ученика',a),text=ui('textarea','',label);text.value=taskDraft.description;text.maxLength=10000;text.onchange=()=>taskDraft.description=text.value;
    const before=field(a,'Проверять положение робота перед стартом',!!taskDraft.start,v=>{taskDraft.start=v?{robot:active.id,region:''}:null;renderDraft();},'checkbox');
    if(taskDraft.start){choice(a,'Робот',taskDraft.start.robot,robotOptions(),v=>taskDraft.start.robot=v);zoneField(a,'Стартовая зона',taskDraft.start);}
    const b=ui('section','',root);b.id='draft-steps';ui('h2','Этапы',b);
    choice(b,'Порядок',taskDraft.order,[['sequence','По очереди'],['any','В любом порядке']],v=>taskDraft.order=v);
    taskDraft.steps.forEach((s,i)=>{
        const card=ui('article','',b);card.className='card';const head=ui('div','',card);head.className='card-head';ui('strong','Этап '+(i+1),head);
        const up=button(head,'↑',()=>{[taskDraft.steps[i-1],taskDraft.steps[i]]=[s,taskDraft.steps[i-1]];renderDraft();});up.disabled=i===0;
        const down=button(head,'↓',()=>{[taskDraft.steps[i+1],taskDraft.steps[i]]=[s,taskDraft.steps[i+1]];renderDraft();});down.disabled=i===taskDraft.steps.length-1;
        button(head,'Копировать',()=>{const copy=structuredClone(s);copy.id=draftStep().id;taskDraft.steps.splice(i+1,0,copy);renderDraft();});
        button(head,'Удалить',()=>{taskDraft.steps.splice(i,1);renderDraft();});
        field(card,'Название этапа',s.name,v=>s.name=v);
        choice(card,'Что сделать',s.type,Object.entries(TaskBuilder.types),v=>{const base=draftStep(v);for(const [key,value]of Object.entries(base))if(s[key]===undefined)s[key]=value;s.type=v;});
        if(['reach','visit','stop'].includes(s.type))choice(card,'Робот',s.robot,robotOptions(),v=>s.robot=v);
        if(s.type==='visit'){
            ui('p','Зоны маршрута:',card);
            s.regions.forEach((rid,j)=>{const row=ui('div','',card);choice(row,'Точка '+(j+1),rid,zoneOptions(),v=>s.regions[j]=v);button(row,'Убрать точку',()=>{s.regions.splice(j,1);renderDraft();});});
            button(card,'Добавить точку на поле',()=>startTaskPick('region',id=>s.regions.push(id)));
            choice(card,'Посещать',s.routeOrder,[['sequence','По очереди'],['any','В любом порядке']],v=>s.routeOrder=v);
        }else zoneField(card,'Зона',s);
        if(['deliver','eject'].includes(s.type)){
            choice(card,'Предметы',s.group,[['can','Все банки'],['ball','Все мячи'],['','Выбранные предметы']],v=>s.group=v);
            if(!s.group){
                const names=s.objects.map(id=>{const p=taskEnvironment().props.find(p=>p.id===id);return p?(p.kind==='can'?'Банка ':'Мяч ')+(props.findIndex(row=>propId(row)===id)+1):'Удалённый предмет';});
                ui('p',names.join(', ')||'Предметы не выбраны',card);
                button(card,'Добавить предмет с поля',()=>startTaskPick('prop',id=>{if(!s.objects.includes(id))s.objects.push(id);}));
                button(card,'Очистить выбор предметов',()=>{s.objects=[];renderDraft();});
            }
            field(card,'Сколько предметов (0 — все выбранные)',s.count,v=>s.count=v,'number');
            field(card,'Для завершения предметы должны одновременно находиться в нужном положении',s.simultaneous,v=>s.simultaneous=v,'checkbox');
        }
        if(s.type==='stop')field(card,'Стоять без движения, секунд',s.seconds,v=>s.seconds=v,'number');
        field(card,['deliver','eject'].includes(s.type)?'Баллы за каждый предмет':'Баллы за этап',s.points,v=>s.points=v,'number');
        if(['reach','stop'].includes(s.type))choice(card,'Начислять',s.repeat||'once',[['once','Один раз за задание'],['entry','За каждое повторное выполнение']],v=>s.repeat=v);
        field(card,'Дополнительный этап (не обязателен для завершения)',s.optional,v=>s.optional=v,'checkbox');
        field(card,'Сообщение после выполнения',s.message,v=>s.message=v);
        const desc=ui('p',summary(s),card);desc.className='card-summary';desc.dataset.summary=s.id;
    });
    button(b,'Добавить этап',()=>{taskDraft.steps.push(draftStep());renderDraft();});
    const c=ui('section','',root);c.id='draft-violations';ui('h2','Нарушения',c);ui('p','Эти правила действуют на протяжении всей попытки.',c);
    taskDraft.violations.forEach((v,i)=>{
        const card=ui('article','',c);card.className='card';ui('strong','Запрещённая зона '+(i+1),card);
        choice(card,'Робот',v.robot,robotOptions(),x=>v.robot=x);zoneField(card,'Не заезжать в зону',v);
        choice(card,'При нарушении',v.action,[['fail','Завершить попытку'],['penalty','Снять баллы и продолжить']],x=>v.action=x);
        field(card,'Штраф, баллов',v.penalty,x=>v.penalty=x,'number');
        choice(card,'Применять',v.repeat,[['once','Один раз'],['entry','За каждый новый заезд']],x=>v.repeat=x);
        field(card,'Сообщение',v.message,x=>v.message=x);button(card,'Удалить нарушение',()=>{taskDraft.violations.splice(i,1);renderDraft();});
    });
    button(c,'Добавить запрещённую зону',()=>{taskDraft.violations.push({robot:active.id,region:'',action:'fail',penalty:0,repeat:'once',message:'Заезд в запрещённую зону'});renderDraft();});
    const d=ui('section','',root);d.id='draft-finish';ui('h2','Завершение',d);
    choice(d,'Завершить задание',taskDraft.finish.mode,[['all','После всех обязательных этапов'],['zone','После всех обязательных этапов и приезда на финиш'],['time','Когда закончится время']],v=>taskDraft.finish.mode=v);
    if(taskDraft.finish.mode==='zone'){choice(d,'Робот',taskDraft.finish.robot,robotOptions(),v=>taskDraft.finish.robot=v);zoneField(d,'Финишная зона',taskDraft.finish);}
    field(d,'Общий лимит времени, секунд (0 — без лимита)',taskDraft.limit,v=>taskDraft.limit=v,'number');
    if(taskDraft.finish.mode!=='time')choice(d,'Если время закончилось',taskDraft.timeout,[['fail','Завершить с сообщением о превышении времени'],['finish','Завершить попытку с набранными баллами']],v=>taskDraft.timeout=v);
    renderAdvanced(root);
}
function renderAdvanced(parent){
    const details=ui('details','',parent);ui('summary','Дополнительно: правила JSON',details);
    ui('p','Для импортированных и нестандартных правил. Применение JSON отключает визуальное редактирование, пока не создано новое задание.',details);
    const text=ui('textarea','',details);text.rows=12;text.value=JSON.stringify(taskSpec??{nodes:[],aliases:{}},null,2);
    button(details,'Применить JSON вместо текущих правил',()=>{
        try{const spec=JSON.parse(text.value);if(!Array.isArray(spec.nodes))throw Error('Нужен массив nodes.');delete spec.builder;
            taskChange(()=>{taskSpec=spec;});taskEl('taskDialog').close();taskDraft=null;
        }catch(e){taskEl('taskDraftErrors').textContent=e.message;}
    });
}
function openTaskEditor(){if(busy)return;taskDraft=taskSpec?structuredClone(taskSpec.builder??null):TaskBuilder.empty();renderDraft();taskEl('taskDialog').showModal();}
taskEl('editTask').onclick=openTaskEditor;
for(const id of ['closeTaskDialog','cancelTaskDraft'])taskEl(id).onclick=()=>{taskDraft=null;taskPick=null;taskEl('taskDialog').close();};
taskEl('saveTaskDraft').onclick=()=>{
    if(!taskDraft){taskEl('taskDraftErrors').textContent='Для этого задания используйте JSON или создайте новое задание.';return;}
    try{const spec=TaskBuilder.compile(taskDraft,taskEnvironment());taskChange(()=>{taskSpec=spec;});taskEl('taskDialog').close();taskDraft=null;}
    catch(e){taskEl('taskDraftErrors').textContent=e.message;}
};
taskEl('taskDialog').addEventListener('cancel',()=>{taskDraft=null;taskPick=null;});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&taskPick){e.preventDefault();finishTaskPick();}});
taskEl('previewTask').onclick=()=>{
    if(training){taskEl('status').textContent='Для ручной проверки выключите тренировочный режим.';return;}
    manualPreview=!manualPreview;previewCheckpoint=null;taskState=null;refreshTaskEditor();if(manualPreview)requestInspection(true);
};
taskEl('previewCheck').onclick=()=>requestInspection(true,1);
taskEl('previewReset').onclick=()=>{previewCheckpoint=null;taskState=null;requestInspection(true,0);};
