'use strict';
let regions=[],taskSpec=null,taskState=null;
const propIds=new Map();let objectSerial=0;
const taskEl=id=>document.getElementById(id);
const node=(tag,attrs={},children=[])=>({tag,attrs,children});
function newObjectId(prefix) {
    let id;const used=new Set([...regions.map(r=>r.id),...propIds.values(),...robots.map(r=>r.id)]);
    do{id=prefix+(++objectSerial);}while(used.has(id));return id;
}
function propId(row) {if(!propIds.has(row))propIds.set(row,newObjectId(row[2]));return propIds.get(row);}
function importTaskData(s) {
    regions=structuredClone(s.regions??[]);taskSpec=structuredClone(s.task??null);taskState=null;propIds.clear();
    (s.props??[]).forEach((row,i)=>propIds.set(row,s.propIds?.[i]??newObjectId(row[2])));
    refreshTaskEditor();
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
        if(!taskEl('showRegions').checked||!region.visible)continue;
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
function refreshTaskEditor() {
    const list=taskEl('regionList');list.replaceChildren();
    for(const region of regions) {
        const row=element('div','',list);row.className='task-row';
        const select=element('button',region.name||region.id,row);select.disabled=busy;
        select.onclick=()=>{selectTool('pan');selectTarget({obj:{key:'region',list:regions,row:region}});taskEl('showRegions').checked=true;refreshRegionFields();draw();};
        const toggle=element('button',region.visible?'◉':'○',row);toggle.title='Показать/скрыть регион';toggle.disabled=busy;
        toggle.onclick=()=>taskChange(()=>{region.visible=!region.visible;});
    }
    const objects=taskEl('ruleObject');const previous=objects.value;objects.replaceChildren();
    for(const robot of robots)element('option',robot.name,objects).value=robot.id;
    for(const [alias,key] of Object.entries(taskSpec?.aliases??{})) if(!robots.some(r=>r.id===alias))element('option',alias,objects).value=alias;
    for(const row of props)element('option',(row[2]==='can'?'Банка ':'Мяч ')+propId(row),objects).value=propId(row);
    element('option','Каждая банка',objects).value='can:*';element('option','Каждый мяч',objects).value='ball:*';if(previous)objects.value=previous;
    const regionSelect=taskEl('ruleRegion'),oldRegion=regionSelect.value;regionSelect.replaceChildren();
    for(const region of regions)element('option',region.name||region.id,regionSelect).value=region.id;
    if(oldRegion&&regions.some(r=>r.id===oldRegion))regionSelect.value=oldRegion;else if(regions[0])regionSelect.value=regions[0].id;
    const events=(taskSpec?.nodes??[]).filter(n=>n.tag==='event');const next=taskEl('ruleNext'),oldNext=next.value;next.replaceChildren();element('option','Не включать',next).value='';
    for(const event of events)element('option',event.attrs.id,next).value=event.attrs.id;if(oldNext)next.value=oldNext;
    const rules=taskEl('ruleList');rules.replaceChildren();
    for(const event of events) {
        const row=element('div','',rules);row.className='task-card';element('strong',event.attrs.id,row);
        const label=element('label','При старте ',row),enabled=element('input','',label);enabled.type='checkbox';enabled.checked=event.attrs.settedUpInitially!=='false';enabled.disabled=busy;
        enabled.onchange=()=>taskChange(()=>{event.attrs.settedUpInitially=String(enabled.checked);});
        const trigger=event.children.find(n=>['trigger','triggers'].includes(n.tag));
        const setter=trigger?.children.find(n=>n.tag==='setter'&&['total_score','score'].includes(n.attrs.name));
        const bonus=setter?.children[0]?.tag==='sum'?setter.children[0].children.find(n=>n.tag==='int'||n.tag==='double'):null;
        if(bonus){const l=element('label','Баллы ',row),input=element('input','',l);input.type='number';input.value=bonus.attrs.value;input.disabled=busy;input.onchange=()=>{if(Number.isFinite(+input.value))taskChange(()=>{bonus.attrs.value=String(+input.value);});};}
        const remove=element('button','Удалить правило',row);remove.disabled=busy;remove.onclick=()=>taskChange(()=>{taskSpec.nodes.splice(taskSpec.nodes.indexOf(event),1);});
    }
    taskEl('taskCode').value=JSON.stringify(taskSpec??{nodes:[],aliases:{}},null,2);
    const limit=(taskSpec?.nodes??[]).find(n=>n.tag==='timelimit');taskEl('taskLimit').value=limit?Number(limit.attrs.value)/1000:0;
    refreshRegionFields();renderTaskResult();
}
function refreshRegionFields() {
    const region=selectedObject?.key==='region'?selectedObject.row:null;
    taskEl('regionFields').hidden=!region;
    if(region){taskEl('regionName').value=region.name||region.id;taskEl('regionColor').value=region.color??'#bb55aa';taskEl('regionVisible').checked=region.visible;taskEl('regionId').textContent=region.id;}
}
function renderTaskResult() {
    const state=taskState;
    const status={running:'Выполняется',success:'Выполнено',failed:'Нарушение',incomplete:'Не завершено'};
    taskEl('taskResult').textContent=state?`${status[state.status]??state.status} · Баллы: ${state.score} · Время: ${state.time} с`:'Задание не запущено';
    taskEl('taskReason').textContent=state?.reason??'';
    taskEl('taskMessages').textContent=(state?.messages??[]).map(m=>`${m.time} с · ${m.text}`).join('\n');
    taskEl('taskCounters').textContent=state?Object.entries(state.variables).map(([k,v])=>k+': '+v).join('\n'):'';
    taskEl('taskEvents').textContent=(state?.events??[]).map(e=>`${e.time} с · ${e.id}${e.object?' · '+e.object:''}`).join('\n');
}
function ensureTask(){taskSpec??={nodes:[],aliases:{}};return taskSpec;}
function ringTask(region) {
    const score=node('setter',{name:'total_score'},[node('sum',{},[node('variableValue',{name:'total_score'}),node('int',{value:'5'})])]);
    const count=node('setter',{name:'выбито'},[node('sum',{},[node('variableValue',{name:'выбито'}),node('int',{value:'1'})])]);
    return {aliases:{},nodes:[node('init',{},[node('setter',{name:'total_score'},[node('int',{value:'0'})]),node('setter',{name:'выбито'},[node('int',{value:'0'})]),node('setter',{name:'всего'},[node('count',{type:'can'})])]),
        node('event',{id:'Выбитая банка',foreach:'can',settedUpInitially:'true',dropsOnFire:'true'},[node('condition',{},[node('not',{},[node('inside',{objectId:'$object',regionId:region.id})])]),node('triggers',{},[score,count,node('message',{text:'Выбито: %выбито% · Баллы: %total_score%'})])]),
        node('event',{id:'Все банки выбиты',settedUpInitially:'true'},[node('conditions',{glue:'and'},[node('greater',{},[node('variableValue',{name:'всего'}),node('int',{value:'0'})]),node('equals',{},[node('variableValue',{name:'выбито'}),node('variableValue',{name:'всего'})])]),node('trigger',{},[node('success')])])]};
}
taskEl('showRegions').onchange=()=>draw();
for(const [id,visible] of [['regionsShowAll',true],['regionsHideAll',false]])taskEl(id).onclick=()=>taskChange(()=>{for(const r of regions)r.visible=visible;});
for(const id of ['regionName','regionColor','regionVisible'])taskEl(id).onchange=()=>{
    const region=selectedObject?.key==='region'?selectedObject.row:null;if(!region)return;
    taskChange(()=>{region.name=taskEl('regionName').value.trim()||region.id;region.color=taskEl('regionColor').value;region.visible=taskEl('regionVisible').checked;});
};
taskEl('ruleAdd').onclick=()=>{
    if(!regions.length){taskEl('taskEditStatus').textContent='Сначала нарисуй регион.';return;}
    const object=taskEl('ruleObject').value,region=taskEl('ruleRegion').value,points=Number(taskEl('rulePoints').value);
    const id=taskEl('ruleName').value.trim()||'Правило '+((taskSpec?.nodes??[]).filter(n=>n.tag==='event').length+1);
    if(!object||!region||!Number.isFinite(points)||(taskSpec?.nodes??[]).some(n=>n.tag==='event'&&n.attrs.id===id)){taskEl('taskEditStatus').textContent='Выбери объект, регион и уникальное имя правила.';return;}
    taskChange(()=>{
        const spec=ensureTask();let condition=node('inside',{objectId:object.endsWith(':*')?'$object':object,regionId:region});
        if(taskEl('ruleCondition').value==='outside')condition=node('not',{},[condition]);
        const actions=[];
        if(points)actions.push(node('setter',{name:'total_score'},[node('sum',{},[node('variableValue',{name:'total_score'}),node('double',{value:String(points)})])]));
        const message=taskEl('ruleMessage').value.trim();if(message)actions.push(node('message',{text:message}));
        if(taskEl('ruleNext').value)actions.push(node('setUp',{id:taskEl('ruleNext').value}));
        if(taskEl('ruleOutcome').value)actions.push(node(taskEl('ruleOutcome').value));
        spec.nodes.push(node('event',{id,settedUpInitially:String(taskEl('ruleEnabled').checked),dropsOnFire:String(taskEl('ruleOnce').checked),edge:String(!taskEl('ruleOnce').checked),...(object.endsWith(':*')?{foreach:object.split(':')[0]}:{})},[node('condition',{},[condition]),node('triggers',{},actions)]));
    });taskEl('taskEditStatus').textContent='Правило добавлено';
};
taskEl('taskLimit').onchange=()=>{
    const value=Number(taskEl('taskLimit').value);if(!Number.isFinite(value)||value<0)return;
    taskChange(()=>{const s=ensureTask();s.nodes=s.nodes.filter(n=>n.tag!=='timelimit');if(value)s.nodes.unshift(node('timelimit',{value:String(value*1000)}));});
};
taskEl('taskApplyCode').onclick=()=>{try{const spec=JSON.parse(taskEl('taskCode').value);if(!Array.isArray(spec.nodes))throw Error('Нужен массив nodes');taskChange(()=>{taskSpec=spec;});taskEl('taskEditStatus').textContent='Правила применены. Проверка ссылок — при запуске.';}catch(e){taskEl('taskEditStatus').textContent=e.message;}};
