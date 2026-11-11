'use strict';
const BUILD_VERSION='0.18';
const CAR_LENGTH=39.2;
const vscode = acquireVsCodeApi();
const $ = id => document.getElementById(id);
const CLAWS=JSON.parse($('clawData').textContent);
const KICKERS=JSON.parse($('kickerData').textContent);
const rallyVehicles=new Map();
const BIG_TRAVEL=JSON.parse($('bigTravelData').textContent);
const canvas = $('world'), ctx = canvas.getContext('2d');
const floor = document.createElement('canvas');
floor.width = canvas.width; floor.height = canvas.height;
const ground = floor.getContext('2d', {willReadFrequently:true});
const W = canvas.width, H = canvas.height;
const states=new Map(), outputs=new Map(), variables=new Map();
const currentPoses=new Map(), propPoses=new Map();
const PROP_RADIUS={can:3.3,ball:3.35};
const propPosition=row=>propPoses.get(row)??row;
const START_COLORS=['#175fc4','#b71c33','#00816a','#9725ac','#9a5000','#496000','#00758b','#4948a1'];
const DEFAULT_BODY=18;
const GRID_CM=10;
let ballDiameter=6.7;
const propRadius=kind=>kind==='ball'?ballDiameter/2:PROP_RADIUS[kind];
let serial=0, selectedClaw=false, selectedSensor, selectedObject, selectedPose, memoryOffset=0, memorySize=0, elapsed=0;
const newRobot = (start=[90,250,0]) => ({id:'r'+(++serial),name:'Робот '+serial,model:'E6',bodySize:DEFAULT_BODY,
    wheelDiameter:56,motorType:'standard',wheels:[1,3],reversed:[false,false],start,sensors:{},cells:{},claw:null,wear:0,program:'',deviceSettings:{}});
let robots=[newRobot()], active=robots[0];
let fitSize, background=false, shapeList=[], camera={x:400,y:250}, scale=1;
let tool='pan', zoom=1, pan, bodySize=DEFAULT_BODY;
let start = [90,250,0], walls = [], segments = [], circles = [], props = [], drag, busy = false, error = false;
const undo = [], redo = [];
let realistic=false,training=false,pendingTraining=null,fieldLocked=false;
let inspectionSerial=0,inspectionPending=null,inspectionEpoch=0,inspectionQueued=null;
const kinds = {none:'Нет',light:'Свет',color:'Цвет',laser:'Лазер',sonar:'Сонар',led:'Светодиод',touch:'Нажатие',ir:'ИК расстояния',gyro:'Гироскоп',line:'Модуль линии',eye:'Умный глаз'};
// Source rectangles exclude transparent margins. Destination dimensions are in cm.
const sensorArt={
    light:['deviceLight',[241,376,540,377],[-2,-1,3,2],0],
    laser:['deviceLaser',[300,90,469,927],[-1,-2,2,3],-Math.PI/2],
    sonar:['deviceSonar',[94,112,866,765],[-3,-2.5,6,5],-Math.PI/2],
    led:['deviceLed',[254,196,571,798],[-1,-1,2,3],Math.PI/2]
};
sensorArt.color=sensorArt.light;
sensorArt.touch=['deviceTouch',[563,329,856,408],[-1.5,-1,3.21,2],0];
sensorArt.ir=['deviceIr',[139,331,802,408],[-1.5,-1,3,2],0];
sensorArt.gyro=['deviceGyro',[261,46,511,1014],[-1,-1.5,2,3],Math.PI/2];
sensorArt.line=['deviceLine',[74,550,1772,149],[-6.5,-.5,13,1],Math.PI/2];
sensorArt.eye=['deviceEye',[123,122,817,818],[-2,-2,4,4],0];
const LINE_OFFSETS=[-5,-2.5,-1.5,0,1.5,2.5,5];
const hasHeight=kind=>kind==='light'||kind==='color'||kind==='line';
const lampColors=['','#ff3737','#31db54','#396bff','#ffdc40','#d94cff','#48deff','#ffffff'];
const lampNames=['Выкл.','Красный','Зелёный','Синий','Жёлтый','Фиолетовый','Голубой','Белый'];
const sensorRows = {};
function element(tag, text, parent) {
    const el = document.createElement(tag);
    el.textContent = text;
    parent.append(el);
    return el;
}
function numeric(parent, value, min, max) {
    const el = element('input','',parent);
    el.type = 'number'; el.min = min; el.max = max; el.value = value;
    return el;
}
for (let p=1; p<=8; p++) {
    const tr = element('tr','',$('sensors'));
    element('td','S'+p,tr);
    const type = element('select','',element('td','',tr));
    for (const [key,label] of Object.entries(kinds)) {
        const opt = element('option',label,type); opt.value = key;
    }
    type.setAttribute('aria-label','Тип датчика S'+p);
    const height=element('select','',element('td','',tr));
    height.setAttribute('aria-label','Высота датчика S'+p+', см');
    for (let cm=1;cm<=5;cm++) element('option',String(cm),height).value=String(cm);
    height.onchange=()=>{
        const robot=active,before=[...robot.sensors[p]];
        robot.sensors[p][4]=Number(height.value);
        const after=[...robot.sensors[p]];
        record(()=>{robot.sensors[p]=[...before];},()=>{robot.sensors[p]=[...after];});reset();
    };
    sensorRows[p] = {type,tr,height};
    type.onchange=()=>{
        const robot=active,before=structuredClone(active.sensors[p]);
        if (type.value==='none') {
            delete active.sensors[p]; selectedSensor=undefined;
        } else {
            active.sensors[p]=[type.value,...(active.sensors[p]?.slice(1,4)??[bodySize/2+5,((p-1)%4-1.5)*7,0]),...(hasHeight(type.value)?[active.sensors[p]?.[4]??1]:[])];
            selectTool('pan'); selectedSensor=String(p);
        }
        const after=structuredClone(active.sensors[p]);
        const restore=value=>{if(value)robot.sensors[p]=[...value];else delete robot.sensors[p];};
        record(()=>restore(before),()=>restore(after));
        refreshSensors();reset();
    };
}
const telemetry = {};
for (const [prefix,count] of [['S',8],['M',8]]) for (let p=1;p<=count;p++) {
    const row=element('tr','',$('telemetry'));
    element('td',prefix+p,row);
    telemetry[prefix+p]={row,device:element('td','',row),value:element('td','—',row)};
}
function showTab(id) {
    for (const button of document.querySelectorAll('[data-tab]')) {
        const active=button.dataset.tab===id;
        button.setAttribute('aria-pressed',String(active)); $(button.dataset.tab).hidden=!active;
    }
    if(id==='memory') updateMemoryLayout();
    if(id==='task') refreshTaskEditor();
}
for (const button of document.querySelectorAll('[data-tab]')) button.onclick=()=>showTab(button.dataset.tab);
function changeBody(size, rescale=false) {
    if (!Number.isFinite(size) || size<10 || size>70) return;
    if (rescale) for (const row of Object.values(active.sensors)) {
        for (const i of [1,2]) row[i]=clamp(row[i]*size/bodySize,-100,100);
    }
    active.bodySize=bodySize=size; $('bodySize').value=String(size*10);
}
const hints={pan:'Щелчок выделяет. Тяни объект или пустое поле. Ctrl + колесо — масштаб.',
    wall:'Протяни стену. Shift — шаг 90°, Ctrl — шаг 45°.',
    line:'Протяни линию. Shift — шаг 90°, Ctrl — шаг 45°.',
    curve:'Протяни от начала до конца. Для правки выбери кривую инструментом перемещения.',
    can:'Щёлкни на поле, чтобы поставить банку.',ball:'Щёлкни на поле, чтобы поставить мячик.',
    regionRect:'Протяни прямоугольный регион. Настрой его во вкладке «Задание».',regionEllipse:'Протяни эллиптический регион. Настрой его во вкладке «Задание».',
    paint:'Протяни прямоугольную цветную область.',ellipse:'Протяни рамку цветного эллипса.'};
function refreshOptions(sync=false) {
    const sel=tool==='pan'?selectedObject:null, shape=sel?.key==='shape'?sel.row:null;
    $('paintOption').hidden=!(shape||['line','curve','paint','ellipse'].includes(tool));
    $('widthOption').hidden=!(shape||sel?.key==='segment'||['line','curve','wall'].includes(tool));
    $('radiusOption').hidden=sel?.key!=='circle';
    $('width').max=sel?'800':'50';
    $('width').min=shape?'.2':'1';
    $('width').step=sel?'any':'1';
    if (sync && shape) { $('paint').value=shape.stroke.slice(0,7); $('width').value=shape.width; }
    if (sync && sel?.key==='segment') $('width').value=sel.row[4];
    if (sync && sel?.key==='circle') $('radius').value=sel.row[2];
    for(const id of ['paint','width','radius'])$(id).disabled=busy||fieldLocked;
}
function selectTool(id) {
    if(fieldLocked&&id!=='pan'){$('status').textContent='Поле заблокировано.';return;}
    selectedClaw=false;selectedObject=selectedSensor=selectedPose=undefined;
    tool=id; canvas.dataset.tool=id;
    $('hint').textContent=hints[id];
    refreshOptions();
    for (const button of document.querySelectorAll('[data-tool]')) button.setAttribute('aria-pressed',String(button.dataset.tool===id));
    draw();
}
for (const button of document.querySelectorAll('[data-tool]')) button.onclick=()=>selectTool(button.dataset.tool);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function syncRealism() {
    $('realism').setAttribute('aria-pressed',String(realistic));
    $('wear').value=active.wear??0;
    $('wearValue').textContent=(active.wear??0)+'%';
    $('wear').disabled=busy||!realistic;
}
$('realism').onclick=()=>{
    if(busy) return;
    const before=realistic;
    realistic=!realistic;
    record(()=>{realistic=before;syncRealism();},()=>{realistic=!before;syncRealism();});
    syncRealism();reset();
};
$('wear').oninput=()=>{
    $('wearValue').textContent=$('wear').value+'%';
};
$('wear').onchange=()=>{
    const robot=active,before=robot.wear??0,after=clamp(Number($('wear').value)||0,0,100);
    robot.wear=after;
    if(before!==after) record(()=>{robot.wear=before;},()=>{robot.wear=after;});
    syncRealism();reset();
};
function mechanismPolygons(kind,joint,maxOpening=50,kickerLength='short') {
    const box=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
    const placed=(poly,x,y,a)=>poly.map(([u,v])=>[x+Math.cos(a)*u-Math.sin(a)*v,y+Math.sin(a)*u+Math.cos(a)*v]);
    const beam=(start,end,width=1)=>{
        const angle=Math.atan2(end[1]-start[1],end[0]-start[0]),points=[];
        for(const [p,base] of [[end,-Math.PI/2],[start,Math.PI/2]])
            for(let i=0;i<=6;i++) points.push([p[0]+width/2*Math.cos(angle+base+i*Math.PI/6),p[1]+width/2*Math.sin(angle+base+i*Math.PI/6)]);
        return points;
    };
    const motor=box(-3,-2,5,4);
    if(kind==='gripper') {
        const angle=(maxOpening/2-60*joint/90)*Math.PI/180;
        return [motor,beam([.6,-5.5],[.6,5.5]),
            placed(beam([0,0],[8,0]),1,5.5,angle),placed(beam([0,0],[8,0]),1,-5.5,-angle)];
    }
    const points=(KICKERS[kickerLength]??KICKERS.short).points,angle=joint*Math.PI/180;
    return [motor,...points.slice(1).map((p,i)=>placed(beam(points[i],p),0,0,angle))];
}
function drawMechanism(robot) {
    const claw=robot.claw,state=states.get(robot.id)?.mechanism,joint=state?.angle??(claw.kind==='kicker'?(claw.initialAngle??0):0);
    ctx.save();ctx.translate(claw.forward,claw.right);ctx.rotate(claw.angle*Math.PI/180);
    const polys=mechanismPolygons(claw.kind,joint,claw.maxOpening??50,claw.length??'short');
    // Draw the motor and mounting frame; the supplied top views are rigid sprites.
    for(let i=0;i<(claw.kind==='gripper'?2:1);i++) {
        const poly=polys[i];ctx.beginPath();poly.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
        ctx.fillStyle=i===0?'#bcc3c7':'#eeece7';ctx.strokeStyle='#5c6870';ctx.lineWidth=.14;ctx.fill();ctx.stroke();
    }
    ctx.fillStyle='#737e85';ctx.fillRect(-3,-2,.9,4);
    const kicker=KICKERS[claw.length??'short']??KICKERS.short;
    const beamImage=$(claw.kind==='gripper'?'beamStraight':kicker.image);
    if(beamImage.naturalWidth) {
        if(claw.kind==='gripper') {
            // Two overlapping nine-hole beams keep the same 10 mm pitch.
            for(const r of [-5.5,-2.5]) {
                ctx.save();ctx.translate(.6,r);ctx.rotate(Math.PI/2);
                ctx.drawImage(beamImage,-124/169,-450/169,1600/169,900/169);ctx.restore();
            }
            const angle=((claw.maxOpening??50)/2-60*joint/90)*Math.PI/180;
            for(const side of [-1,1]) {
                ctx.save();ctx.translate(1,side*5.5);ctx.rotate(side*angle);
                ctx.drawImage(beamImage,-124/169,-450/169,1600/169,900/169);ctx.restore();
            }
        } else {
            ctx.save();ctx.rotate(Math.PI+joint*Math.PI/180);
            if(kicker.mirrorY)ctx.scale(1,-1);
            const [ax,ay]=kicker.anchor,pitch=kicker.pitch;
            ctx.drawImage(beamImage,-ax/pitch,-ay/pitch,beamImage.naturalWidth/pitch,beamImage.naturalHeight/pitch);ctx.restore();
        }
    } else {
        for(const poly of polys.slice(claw.kind==='gripper'?2:1)) {
            ctx.beginPath();poly.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
            ctx.fillStyle='#eeece7';ctx.fill();ctx.stroke();
        }
    }
    // Cross axle on top of the rotating beam.
    ctx.save();ctx.rotate(joint*Math.PI/180);
    ctx.beginPath();ctx.arc(0,0,.31,0,Math.PI*2);ctx.fillStyle='#ce2a16';ctx.fill();
    ctx.strokeStyle='#721408';ctx.lineWidth=.13;ctx.beginPath();ctx.moveTo(-.23,0);ctx.lineTo(.23,0);ctx.moveTo(0,-.23);ctx.lineTo(0,.23);ctx.stroke();ctx.restore();
    ctx.restore();
}
for(const id of ['beamStraight','beamAngle','kickerMedium','kickerLong','kickerExtraLong']) $(id).addEventListener('load',()=>draw());
function clawPolygons(robot) {
    const claw=robot.claw;
    if(!claw) return [];
    const item=CLAWS[claw.kind],angle=(claw.angle+(item.orientation??0))*Math.PI/180;
    const c=Math.cos(angle),s=Math.sin(angle);
    if(item.mechanism) {
        const joint=states.get(robot.id)?.mechanism?.angle??(claw.kind==='kicker'?(claw.initialAngle??0):0);
        return mechanismPolygons(claw.kind,joint,claw.maxOpening??50,claw.length??'short').map(poly=>poly.map(([f,r])=>
            [claw.forward+c*f-s*r,claw.right+s*f+c*r]));
    }
    const [ax,ay]=item.anchor,pitch=item.pitch;
    return item.polygons.map(poly=>poly.map(([x,y])=>{
        const f=(y-ay)/pitch,r=-(x-ax)/pitch;
        return [claw.forward+c*f-s*r,claw.right+s*f+c*r];
    }));
}
function syncClaw() {
    const claw=active.claw;
    $('clawKind').value=claw?.kind??'';
    const enabled=!!(claw&&CLAWS[claw.kind].mechanism);
    $('mechanismPortRow').hidden=!enabled;
    $('maxOpeningRow').hidden=claw?.kind!=='gripper';
    $('maxOpening').value=String(claw?.maxOpening??50);
    $('kickerLengthRow').hidden=claw?.kind!=='kicker';
    $('kickerLength').value=claw?.length??'short';
    $('initialAngleRow').hidden=claw?.kind!=='kicker';
    $('initialAngle').value=String(claw?.initialAngle??0);
    $('mechanismPort').replaceChildren();
    if(enabled) {
        for(let p=1;p<=(active.model==='E7'?8:4);p++)
            if(!active.wheels.includes(p)) element('option','Мотор M'+p,$('mechanismPort')).value=String(p);
        $('mechanismPort').value=String(claw.motor);
    }
}
$('clawKind').onchange=()=>{
    const robot=active,before=structuredClone(active.claw);
    const kind=$('clawKind').value;
    active.claw=kind?{kind,forward:active.claw?.forward??active.bodySize*(active.model==='M6'?.24:.43),
        right:active.claw?.right??0,angle:active.claw?.angle??0}:null;
    if(active.claw&&CLAWS[kind].mechanism) {
        const wheels=[+$('left').value,+$('right').value];
        const available=Array.from({length:active.model==='E7'?8:4},(_,i)=>i+1).filter(p=>!wheels.includes(p));
        active.claw.motor=available.includes(before?.motor)?before.motor:available[0];
        if(kind==='gripper') active.claw.maxOpening=before?.maxOpening??50;
        if(kind==='kicker') {active.claw.initialAngle=before?.initialAngle??0;active.claw.length=before?.length??'short';}
    }
    const after=structuredClone(active.claw);
    record(()=>{robot.claw=structuredClone(before);},()=>{robot.claw=structuredClone(after);});
    selectedClaw=!!active.claw;selectedObject=selectedPose=selectedSensor=undefined;syncClaw();reset();
};
for(const wheel of ['left','right']) $(wheel).addEventListener('change',()=>{
    if(!active.claw||!CLAWS[active.claw.kind].mechanism) return;
    const wheels=[+$('left').value,+$('right').value];
    if(wheels[0]===wheels[1]) return;
    const robot=active,before=[...active.wheels],oldMotor=active.claw.motor;
    active.wheels=wheels;
    const max=active.model==='E7'?8:4;
    if(wheels.includes(active.claw.motor)) active.claw.motor=Array.from({length:max},(_,i)=>i+1).find(p=>!wheels.includes(p));
    const newMotor=active.claw.motor;
    record(()=>{robot.wheels=[...before];robot.claw.motor=oldMotor;},
           ()=>{robot.wheels=[...wheels];robot.claw.motor=newMotor;});
    syncClaw();reset();
});
$('mechanismPort').onchange=()=>{
    if(!active.claw) return;
    const robot=active,before=active.claw.motor,after=+$('mechanismPort').value;
    robot.claw.motor=after;
    record(()=>{robot.claw.motor=before;},()=>{robot.claw.motor=after;});reset();
};
$('maxOpening').onchange=()=>{
    if(active.claw?.kind!=='gripper') return;
    const input=$('maxOpening'),after=Number(input.value);
    if(input.value===''||!input.validity.valid||!Number.isFinite(after)||after<0||after>180) {syncClaw();return;}
    const robot=active,before=robot.claw.maxOpening??50;
    robot.claw.maxOpening=after;
    if(before!==after) record(()=>{robot.claw.maxOpening=before;},()=>{robot.claw.maxOpening=after;});
    syncClaw();reset();
};
$('kickerLength').onchange=()=>{
    if(active.claw?.kind!=='kicker'||!KICKERS[$('kickerLength').value])return;
    const robot=active,before=robot.claw.length??'short',after=$('kickerLength').value;
    robot.claw.length=after;
    if(before!==after)record(()=>{robot.claw.length=before;},()=>{robot.claw.length=after;});
    syncClaw();reset();
};
$('initialAngle').onchange=()=>{
    if(active.claw?.kind!=='kicker') return;
    const input=$('initialAngle'),after=Number(input.value);
    if(input.value===''||!input.validity.valid||!Number.isFinite(after)||after<0||after>360) {syncClaw();return;}
    const robot=active,before=robot.claw.initialAngle??0;
    robot.claw.initialAngle=after;
    if(before!==after) record(()=>{robot.claw.initialAngle=before;},()=>{robot.claw.initialAngle=after;});
    syncClaw();reset();
};
function syncVehicle() {
    const car=active.model==='Car';
    $('carOptions').hidden=!car;
    $('bodySizeLabel').textContent=car?'Длина модели':'Сторона корпуса';
    $('leftLabel').textContent=car?'Рулевой мотор':'Левое колесо';
    $('rightLabel').textContent=car?'Привод задней оси':'Правое колесо';
    $('invertL').setAttribute('aria-label',car?'Реверс рулевого мотора':'Реверс левого колеса');
    $('invertR').setAttribute('aria-label',car?'Реверс привода':'Реверс правого колеса');
    const differential=active.differential??true;
    $('differential').textContent='Дифференциал: '+(differential?'включён':'выключен');
    $('differential').setAttribute('aria-pressed',String(differential));
}
$('differential').onclick=()=>{
    if(active.model!=='Car') return;
    const robot=active,before=robot.differential??true,after=!before;
    robot.differential=after;
    record(()=>{robot.differential=before;},()=>{robot.differential=after;});
    syncVehicle();reset();
};
function drawCar(robot) {
    const image=$('robotCar'),u=robot.bodySize/1920;
    const angles=states.get(robot.id)?.car?.wheelAngles??[0,0];
    const fronts=[[[132,48,336,154],[300,225]],[[132,920,336,160],[300,908]]];
    ctx.save();ctx.rotate(Math.PI);ctx.scale(u,u);ctx.translate(-960,-540);
    ctx.save();ctx.beginPath();ctx.rect(0,0,1920,1080);
    for(const [[x,y,w,h]] of fronts) ctx.rect(x,y,w,h);
    ctx.clip('evenodd');ctx.drawImage(image,0,0,1920,1080);ctx.restore();ctx.restore();
    for(let i=0;i<fronts.length;i++) {
        const [[x,y,w,h],[px,py]]=fronts[i];
        ctx.save();ctx.translate((960-px)*u,(540-py)*u);ctx.rotate(angles[i]);ctx.rotate(Math.PI);
        ctx.drawImage(image,x,y,w,h,(x-px)*u,(y-py)*u,w*u,h*u);ctx.restore();
    }
    // The tie rod follows the two steering knuckles.
    const joints=fronts.map(([, [px,py]],i)=>[(960-px)*u+Math.cos(angles[i])*.85,(540-py)*u+Math.sin(angles[i])*.85]);
    ctx.strokeStyle='#777e83';ctx.lineWidth=.23;ctx.beginPath();ctx.moveTo(...joints[0]);ctx.lineTo(...joints[1]);ctx.stroke();
}
function drawingBounds(margin=1.5, includeRobots=true) {
    const bounds=[Infinity,Infinity,-Infinity,-Infinity];
    function box(x,y,w=0,h=w) {
        bounds[0]=Math.min(bounds[0],x-w); bounds[1]=Math.min(bounds[1],y-h);
        bounds[2]=Math.max(bounds[2],x+w); bounds[3]=Math.max(bounds[3],y+h);
    }
    if (background) {const [x,y,w,h]=background;box(x,y);box(x+w,y+h);}
    if(includeRobots) for(const region of regions){const [x,y,w,h]=region.rect;box(x,y);box(x+w,y+h);}
    for (const [x,y,w,h] of walls) {box(x,y);box(x+w,y+h);}
    for (const [x,y,xx,yy,w] of segments) {box(x,y,w/2);box(xx,yy,w/2);}
    for (const [x,y,r] of circles) box(x,y,r);
    for (const shape of shapeList) for (const [x,y] of shape.points) box(x,y,shape.width/2);
    if (includeRobots) for (const row of props) box(...propPosition(row).slice(0,2),propRadius(row[2]));
    if (includeRobots) for (const robot of robots) {
        box(...robot.start.slice(0,2),robot.bodySize);
        const q=pose(robot);
        box(q.x,q.y,robot.bodySize);
        for(const poly of clawPolygons(robot)) for(const [f,r] of poly) {
            const c=Math.cos(q.heading),s=Math.sin(q.heading);
            box(q.x+c*f-s*r,q.y+s*f+c*r);
            const a=robot.start[2]*Math.PI/180;
            box(robot.start[0]+Math.cos(a)*f-Math.sin(a)*r,robot.start[1]+Math.sin(a)*f+Math.cos(a)*r);
        }
    }
    if (!Number.isFinite(bounds[0])) return [0,0,W,H];
    const dx=(Math.max(200,(bounds[2]-bounds[0])*margin)-(bounds[2]-bounds[0]))/2;
    const dy=(Math.max(150,(bounds[3]-bounds[1])*margin)-(bounds[3]-bounds[1]))/2;
    return [Math.floor(bounds[0]-dx),Math.floor(bounds[1]-dy),Math.ceil(bounds[2]+dx),Math.ceil(bounds[3]+dy)];
}
function resizeField() {
    const viewport=$('viewport');
    canvas.width=Math.max(1,viewport.clientWidth); canvas.height=Math.max(1,viewport.clientHeight);
    draw();
}
function changeZoom(factor) {
    if (!factor) {
        const [a,b,c,d]=drawingBounds();
        camera={x:(a+c)/2,y:(b+d)/2}; fitSize=[c-a,d-b];
        zoom=1;
    } else zoom=clamp(zoom*factor,.2,12);
    draw();
}
new ResizeObserver(resizeField).observe($('viewport'));
$('zoomOut').onclick=()=>changeZoom(1/1.3);
$('zoomIn').onclick=()=>changeZoom(1.3);
$('fit').onclick=()=>changeZoom(0);
$('chooseImage').onclick=()=>{if(!fieldLocked)$('image').click();};
$('grid').onchange=draw;
function robotArtworkId(robot) {
    return robot.model==='Car'?'robotCar':robot.model==='M6'?'robotM6':robot.motorType==='sport'?'robotE6':'robotE6Standard';
}
$('motorType').onchange=()=>{
    const robot=active,before=robot.motorType,after=$('motorType').value;
    robot.motorType=after;
    if(before!==after) record(()=>{robot.motorType=before;},()=>{robot.motorType=after;});
    reset();
};
$('bodySize').onchange=()=>{
    if(!$('bodySize').validity.valid||!$('bodySize').value) return;
    const robot=active,before={size:robot.bodySize,sensors:structuredClone(robot.sensors)};
    changeBody(+$('bodySize').value/10,true);
    const after={size:robot.bodySize,sensors:structuredClone(robot.sensors)};
    const restore=value=>{robot.bodySize=value.size;robot.sensors=structuredClone(value.sensors);};
    if(before.size!==after.size) record(()=>restore(before),()=>restore(after));
    reset();
};
function grid() {
    if (!$('grid').checked) return;
    const x0=camera.x-canvas.width/(2*scale), y0=camera.y-canvas.height/(2*scale);
    const x1=2*camera.x-x0,y1=2*camera.y-y0, step=GRID_CM, major=Math.max(1,Math.ceil(46/(step*scale)))*step;
    ctx.save();
    ctx.strokeStyle='#66778b36'; ctx.lineWidth=1/scale;
    ctx.fillStyle='#40556e';ctx.font=11/scale+'px sans-serif';
    ctx.beginPath();
    for(let x=W/2+Math.ceil((x0-W/2)/step)*step;x<=x1;x+=step) {
        ctx.moveTo(x,y0);ctx.lineTo(x,y1);if((x-W/2)%major===0) ctx.fillText(x-W/2,x+3/scale,y0+14/scale);
    }
    for(let y=H/2+Math.ceil((y0-H/2)/step)*step;y<=y1;y+=step) {
        ctx.moveTo(x0,y);ctx.lineTo(x1,y);if((y-H/2)%major===0) ctx.fillText(y-H/2,x0+3/scale,y-3/scale);
    }
    ctx.stroke(); ctx.strokeStyle='#576e8c80'; ctx.setLineDash([5/scale,4/scale]);
    ctx.beginPath();ctx.moveTo(x0,H/2);ctx.lineTo(x1,H/2);ctx.moveTo(W/2,y0);ctx.lineTo(W/2,y1);ctx.stroke();
    ctx.restore();
}
function sensors(robot=active) {
    return Object.fromEntries(Object.entries(robot.sensors).filter(([p])=>robot.model!=='M6'||+p<=5));
}
function configureSensors(config) {
    active.sensors=structuredClone(config);
    refreshSensors();
}
function refreshSensors() {
    for (const [p,row] of Object.entries(sensorRows)) {
        row.tr.hidden=active.model==='M6'&&+p>5;
        row.type.value=active.sensors[p]?.[0]||'none';
        row.height.hidden=!hasHeight(row.type.value);
        row.height.value=String(active.sensors[p]?.[4]??1);
    }
    refreshDeviceSettings();
}
function pose(robot) {
    const [x,y,a]=currentPoses.get(robot.id)??robot.start;
    return states.get(robot.id) || {x,y,heading:a*Math.PI/180};
}
function robotToField(f,r,robot=active) {
    const {x,y,heading}=pose(robot),c=Math.cos(heading),s=Math.sin(heading);
    return [x+c*f-s*r,y+s*f+c*r];
}
function fieldToRobot(x,y) {
    const p=pose(active), c=Math.cos(p.heading),s=Math.sin(p.heading);
    return [(x-p.x)*c+(y-p.y)*s,-(x-p.x)*s+(y-p.y)*c];
}
function arrow(f,r,a) {
    const rad=a*Math.PI/180,len=28/scale;
    return [f+len*Math.cos(rad),r+len*Math.sin(rad)];
}
function drawProp(row) {
    const [x,y]=propPosition(row),kind=row[2],r=propRadius(kind);
    ctx.save();if(taskState?.tennis?.scored?.[String(props.indexOf(row))])ctx.globalAlpha=.35;ctx.translate(x,y);ctx.scale(r,r);
    const disk=(size,fill,stroke,width)=> {
        ctx.beginPath();ctx.arc(0,0,size,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
        if(stroke) {ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
    };
    ctx.fillStyle='#162f3b30';ctx.beginPath();ctx.ellipse(.14,.22,1.04,.98,0,0,Math.PI*2);ctx.fill();
    if(kind==='can') {
        disk(1,'#a92532');
        disk(.91,'#dfe6ea','#697880',.07);
        disk(.75,'#b3c2c9','#f9fcfd',.06);
        ctx.beginPath();ctx.ellipse(0,.14,.27,.47,-.14,0,Math.PI*2);
        ctx.fillStyle='#edf4f6';ctx.strokeStyle='#526771';ctx.lineWidth=.09;ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.arc(0,.33,.13,0,Math.PI*2);ctx.fillStyle='#657980';ctx.fill();
    } else {
        disk(1,'#a5ca2e','#627f1d',.04);
        ctx.beginPath();ctx.arc(0,0,.98,0,Math.PI*2);ctx.clip();
        ctx.beginPath();ctx.moveTo(-1,-.19);ctx.bezierCurveTo(-.3,-.85,-.17,.61,.41,.55);
        ctx.bezierCurveTo(.81,.51,1,.05,.83,-.57);
        ctx.strokeStyle='#f7ffd9';ctx.lineWidth=.14;ctx.stroke();
    }
    ctx.restore();
}
function draw() {
    const [a,b,c,d]=drawingBounds();
    // Zoom is relative to the last fit; editing does not move the pointer beneath the cursor.
    if (!fitSize) fitSize=[c-a,d-b];
    scale=Math.max(.02,Math.min(canvas.width/fitSize[0],canvas.height/fitSize[1])*zoom);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,canvas.width/2-camera.x*scale,canvas.height/2-camera.y*scale);
    if (background) ctx.drawImage(floor,...background);
    for (const shape of shapeList) drawShape(ctx,shape);
    grid();
    ctx.fillStyle = '#cf6317';
    for (const rect of walls) ctx.fillRect(...rect);
    ctx.strokeStyle = ctx.fillStyle;
    for (const [x,y,xx,yy,w] of segments) {
        ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(xx,yy); ctx.stroke();
    }
    for (const [x,y,r] of circles) {
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    for(const row of props) drawProp(row);
    drawRegions();
    const selectedCurve=selectedObject?.key==='shape' && selectedObject.row.kind==='cubicBezier'?selectedObject.row:null;
    if (selectedCurve) {
        const [a,b,c,d]=selectedCurve.points;
        ctx.save();ctx.strokeStyle='#877149';ctx.lineWidth=1/scale;ctx.setLineDash([4/scale,3/scale]);
        ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...c);ctx.moveTo(...b);ctx.lineTo(...d);ctx.stroke();
        ctx.setLineDash([]);
        selectedCurve.points.forEach(([x,y],i)=>{
            ctx.beginPath();ctx.arc(x,y,5/scale,0,Math.PI*2);ctx.fillStyle=i<2?'#2e72b9':'#ffca53';ctx.fill();ctx.stroke();
        });ctx.restore();
    }
    drawObjectSelection(selectedCurve);
    if (drag?.tool) {
        ctx.strokeStyle = '#1774d2'; ctx.lineWidth = 2;
        const {x,y,toX,toY,tool:kind}=drag;
        if (['wall','line','curve'].includes(kind)) {
            ctx.beginPath(); ctx.moveTo(x,y);ctx.lineTo(toX,toY);ctx.stroke();
        } else if (kind==='ellipse'||kind==='regionEllipse') {
            ctx.beginPath();ctx.ellipse((x+toX)/2,(y+toY)/2,Math.abs(toX-x)/2,Math.abs(toY-y)/2,0,0,Math.PI*2);ctx.stroke();
        } else ctx.strokeRect(x,y,toX-x,toY-y);
    }

    for (const robot of [...robots.filter(r=>r!==active),active]) {
    const {x,y,heading,blocked} = pose(robot), robotState=states.get(robot.id),bodySize=robot.bodySize;
    ctx.save(); ctx.translate(x,y); ctx.rotate(heading);
    ctx.fillStyle = blocked ? '#ac2737' : robot===active?'#1967c2':'#23866d';
    const h=bodySize/2;
    const artwork=$(robotArtworkId(robot));
    if (artwork.naturalWidth) {
        if(robot.model==='Car') drawCar(robot);
        else {ctx.save();if(robot.model==='M6')ctx.rotate(Math.PI/2);else if(robot.motorType!=='sport')ctx.rotate(-Math.PI/2);
        ctx.drawImage(artwork,-h,-h,bodySize,bodySize);ctx.restore();}
        if (blocked || robot===active) {
            ctx.strokeStyle=blocked?'#ac2737':'#1967c2';ctx.lineWidth=1.5/scale;
            ctx.strokeRect(-h,-h*(robot.model==='Car'?1080/1920:1),bodySize,bodySize*(robot.model==='Car'?1080/1920:1));
        }
    } else {
        ctx.fillRect(-h,-h,bodySize,bodySize);
        ctx.fillStyle='#fff';
        ctx.beginPath();ctx.moveTo(h*.8,0);ctx.lineTo(0,-h*.42);ctx.lineTo(0,h*.42);ctx.closePath();ctx.fill();
    }
    if(robot.claw) {
        const claw=robot.claw,item=CLAWS[claw.kind];
        if(item.mechanism) drawMechanism(robot);
        else {
        const image=$({small:'clawSmall',large:'clawLarge',narrow:'clawNarrow',straight:'clawStraight'}[claw.kind]);
        ctx.save();ctx.translate(claw.forward,claw.right);ctx.rotate((claw.angle+(item.orientation??0))*Math.PI/180-Math.PI/2);
        if(image.naturalWidth) ctx.drawImage(image,-item.anchor[0]/item.pitch,-item.anchor[1]/item.pitch,
            1600/item.pitch,900/item.pitch);
        ctx.restore();
        }
        if(robot===active && selectedClaw && !busy) {
            const [tx,ty]=arrow(claw.forward,claw.right,claw.angle);
            ctx.strokeStyle='#1739ad';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2/scale;
            ctx.beginPath();ctx.moveTo(claw.forward,claw.right);ctx.lineTo(tx,ty);ctx.stroke();
            ctx.beginPath();ctx.arc(claw.forward,claw.right,4/scale,0,Math.PI*2);ctx.fill();
            ctx.save();ctx.translate(tx,ty);ctx.rotate(claw.angle*Math.PI/180);
            ctx.beginPath();ctx.moveTo(2/scale,0);ctx.lineTo(-8/scale,-5/scale);ctx.lineTo(-8/scale,5/scale);ctx.fill();ctx.restore();
        }
    }
    ctx.fillStyle='#173651';ctx.font=11/scale+'px sans-serif';
    ctx.textAlign='center';ctx.fillText(robot.name,0,-h*(robot.model==='Car'?1080/1920:1)-5/scale);
    for (const [p,[kind,f,r,a,height=1]] of Object.entries(sensors(robot))) {
        const angle = a*Math.PI/180;
        ctx.fillStyle = {light:'#222',color:'#a31da4',laser:'#d11',sonar:'#008966',led:'#56616b'}[kind];
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5;
        const distance = robotState?.sensors[p];
        const aiming=robot===active && selectedSensor===p;
        if ((distance!==undefined||aiming) && (kind==='laser'||kind==='sonar'||kind==='ir')) {
            const len=distance===undefined?(kind==='sonar'?250:kind==='ir'?80:200):kind==='laser'?distance/10:distance;
            ctx.save();ctx.lineWidth=1/scale;
            if(kind==='sonar') {
                const half=Math.PI/12;
                ctx.fillStyle='#00896626';ctx.strokeStyle='#00896680';
                ctx.beginPath();ctx.moveTo(f,r);ctx.arc(f,r,len,angle-half,angle+half);ctx.closePath();ctx.fill();ctx.stroke();
            } else {
                ctx.strokeStyle='#dd111199';ctx.beginPath();ctx.moveTo(f,r);
                ctx.lineTo(f+len*Math.cos(angle),r+len*Math.sin(angle));ctx.stroke();
            }
            ctx.restore();
        }
        const radius=kind==='sonar'?3:1.5;
        const [imageId,source,destination,rotation]=sensorArt[kind];
        const device=$(imageId);
        if (device.naturalWidth) {
            ctx.save();ctx.translate(f,r);ctx.rotate(angle+rotation);
            if(kind==='line')drawLineArtwork(device);else ctx.drawImage(device,...source,...destination);ctx.restore();
        } else {
            ctx.beginPath();ctx.arc(f,r,radius,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#fff';ctx.lineWidth=1/scale;ctx.stroke();
        }
        drawDeviceEffects(robot,p,kind,f,r,angle,height,robotState);
        if (kind==='light' && robotState?.light_leds?.[p]!==false) {
            ctx.beginPath();ctx.arc(f,r,height,0,Math.PI*2);
            ctx.fillStyle='#ffdb3540';ctx.fill();
            ctx.strokeStyle='#bc8900';ctx.lineWidth=.75/scale;ctx.stroke();
        }
        const glow=kind==='led' && lampColors[robotState?.lamps?.[p]??0];
        if (glow) {
            const gradient=ctx.createRadialGradient(f,r,0,f,r,radius*2);
            gradient.addColorStop(0,glow);gradient.addColorStop(1,glow+'00');
            ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(f,r,radius*2,0,Math.PI*2);ctx.fill();
        }
        ctx.fillStyle='#222';ctx.fillText('S'+p,f,r+radius+11/scale);
        if (robot===active && selectedSensor===p && !busy) {
            const [tx,ty]=arrow(f,r,a);
            ctx.strokeStyle='#1739ad';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2/scale;
            ctx.beginPath();ctx.moveTo(f,r);ctx.lineTo(tx,ty);ctx.stroke();
            ctx.save();ctx.translate(tx,ty);ctx.rotate(angle);ctx.beginPath();
            ctx.moveTo(2/scale,0);ctx.lineTo(-8/scale,-5/scale);ctx.lineTo(-8/scale,5/scale);ctx.fill();ctx.restore();
        }
    }
    drawSoundEffect(robot,robotState);
    ctx.restore();
    }
    drawPoses();
    const state=states.get(active.id);
    $('carReadings').hidden=active.model!=='Car';
    const carState=state?.car;
    $('carReadings').textContent=active.model==='Car'?`Руль: ${((carState?.steering??0)*180/Math.PI).toFixed(1)}° · Скорость: ${(carState?.speed??0).toFixed(1)} см/с`:'';
    const configured=sensors(), motorCount=$('model').value==='E7'?8:4;
    for (let p=1;p<=8;p++) {
        const sensor=telemetry['S'+p], enc=telemetry['M'+p], kind=configured[p]?.[0];
        sensor.row.hidden=!kind; enc.row.hidden=p>motorCount;
        if (kind) {
            const v=state?.sensors[p];
            sensor.device.textContent=kinds[kind];
            sensor.value.textContent=kind==='led'?lampNames[state?.lamps?.[p]??0]:v===undefined?'—':kind==='line'?v.map((x,i)=>(i+1)+': '+x).join(' · '):kind==='eye'?'Код: '+v.code+' · '+v.distance+' см':kind==='gyro'?(v/10)+'°':v+({laser:' мм',sonar:' см',ir:' см'}[kind]||'');
        }
        enc.device.textContent=active.claw?.motor===p?{gripper:'Захват',kicker:'Пиналка'}[active.claw.kind]:'Энкодер';
        if(active.model==='Car') {if(p===active.wheels[0])enc.device.textContent='Руль';if(p===active.wheels[1])enc.device.textContent='Привод';}
        enc.value.textContent=(state?.encoders[p-1]??0)+'°';
    }
}
function blank() { ground.fillStyle = '#fff'; ground.fillRect(0,0,W,H); }
function preset(name) {
    if(fieldLocked){$('status').textContent='Сначала снимите блокировку поля.';return;}
    const vehicleKeys=['model','bodySize','wheelDiameter','motorType','wheels','reversed','differential'];
    if(name==='rally'&&active.model!=='Car')rallyVehicles.set(active.id,Object.fromEntries(vehicleKeys.filter(k=>k in active).map(k=>[k,structuredClone(active[k])])));
    if(name!=='rally'&&active.model==='Car'){
        const previous=rallyVehicles.get(active.id)??{model:'E6',bodySize:DEFAULT_BODY,wheelDiameter:56,motorType:'standard',wheels:[1,3],reversed:[false,false]};
        delete active.differential;Object.assign(active,structuredClone(previous));rallyVehicles.delete(active.id);switchRobot(active,true);
    }
    ballDiameter=name==='tennis'?5.7:6.7;
    if(name==='bigtravel'){robots=[active];variables.clear();outputs.clear();$('preset').value=name;loadPolygon(structuredClone(BIG_TRAVEL));refreshPicker();refreshProgram();return;}
    robots=[active];variables.clear();outputs.clear();
    $('preset').value=name;
    undo.length=0;redo.length=0;historyButtons(); blank(); background=false; walls=[];segments=[];circles=[];props=[];propPoses.clear();shapeList=[];
    importTaskData({});
    start=active.start=[90,250,0];changeBody(active.model==='Car'?CAR_LENGTH:DEFAULT_BODY);selectedClaw=false;selectedObject=selectedSensor=selectedPose=undefined;currentPoses.clear();
    const shape=(kind,points,width=18,stroke='#202020',fill=null)=>shapeList.push({kind,points,width,stroke,fill});
    if(name==='rally') {
        active.model='Car';active.bodySize=CAR_LENGTH;active.wheelDiameter=65;active.motorType='standard';
        active.wheels=[1,3];active.reversed=[false,false];active.differential??=true;
        start=active.start=[120,250,-90];
        walls=[[70,60,660,3],[70,437,660,3],[70,60,3,380],[727,60,3,380],
               [170,160,460,3],[170,337,460,3],[170,160,3,180],[627,160,3,180]];
        configureSensors({1:['sonar',18,0,0],2:['sonar',12,-8,-90],3:['sonar',12,8,90]});
        switchRobot(active,true);
    } else if(name==='tennis') {
        segments=[[249.5,199.5,550.5,199.5,1],[550.5,199.5,550.5,300.5,1],[550.5,300.5,249.5,300.5,1],[249.5,300.5,249.5,199.5,1]];
        for(const [left,right]of [[300,387.5],[412.5,500]])for(const [top,bottom]of [[200,215],[285,300]])shape('rectangle',[[left,top],[right,bottom]],0,'#2db432','#2db432');
        for(const x of [387.5,407.5])shape('rectangle',[[x,200],[x+5,300]],0,'#000000','#000000');
        active.claw=null;changeBody(18);
        configureSensors(active.model==='M6'?{4:['light',7,0,0,2],5:['sonar',7,0,0]}:{5:['light',7,-3,0,2],6:['light',7,3,0,2],7:['sonar',7,0,0]});
        const second=newRobot();
        for(const key of ['model','bodySize','wheelDiameter','motorType','wheels','reversed','sensors','claw'])second[key]=structuredClone(active[key]);
        robots.push(second);taskSpec=tennisTask(active.id,second.id);tennisResetPositions();
        regions=[{id:'tennis-left',name:'Левая половина',kind:'rectangle',rect:[300,200,87.5,100],color:'#175fc4',visible:false},
            {id:'tennis-neutral',name:'Нейтральная зона',kind:'rectangle',rect:[392.5,200,15,100],color:'#777777',visible:false},
            {id:'tennis-right',name:'Правая половина',kind:'rectangle',rect:[412.5,200,87.5,100],color:'#b71c33',visible:false}];
    } else if (name==='loop') {
        const origin=[466,320], factor=.4;
        const world=([x,y])=>[400+(x-origin[0])*factor,250+(y-origin[1])*factor];
        const line=(a,b)=>shape('line',[a,b].map(world),5,'#111111');
        const curve=(a,b,c,d)=>shape('cubicBezier',[a,b,c,d].map(world),5,'#111111');
        // Cubic curves share their endpoints with the adjacent editable segments.
        line([75,182],[75,400]);
        curve([75,400],[222,553],[75,493],[142,553]);
        line([222,553],[354,553]);
        curve([354,553],[480,490],[413,553],[453,526]);
        line([480,490],[659,256]);
        curve([659,256],[829,285],[724,177],[816,228]);
        curve([829,285],[768,386],[840,331],[810,370]);
        curve([768,386],[712,467],[735,401],[712,434]);
        curve([712,467],[805,553],[712,516],[756,553]);
        line([805,553],[833,553]);
        curve([833,553],[957,430],[900,539],[944,487]);
        line([957,430],[957,211]);
        curve([957,211],[816,64],[957,126],[890,70]);
        line([816,64],[668,64]);
        curve([668,64],[544,139],[611,64],[572,101]);
        line([544,139],[372,361]);
        curve([372,361],[292,400],[352,386],[325,400]);
        curve([292,400],[201,316],[242,400],[201,367]);
        curve([201,316],[263,231],[201,282],[224,249]);
        curve([263,231],[320,150],[300,214],[317,183]);
        curve([320,150],[232,64],[320,99],[284,64]);
        line([232,64],[195,64]);
        curve([195,64],[75,182],[133,76],[90,122]);
        start=active.start=[...world([75,270]),90];
        if (!Object.keys(active.cells).length) active.cells={1:25,2:7,5:3200,6:3200};
        const ports=active.model==='M6'?[4,5]:[5,6];
        configureSensors({[ports[0]]:['light',10,-2.5,0,2],[ports[1]]:['light',10,2.5,0,2]});
    } else if (name==='maze') {
        const ox=310,oy=160,cell=30;
        const wall=(a,b,c,d)=>segments.push([ox+a*cell,oy+b*cell,ox+c*cell,oy+d*cell,3]);
        for(const segment of [[0,0,5,0],[5,0,5,5],[5,5,0,5],[0,5,0,0],
            [0,1,1,1],[2,0,2,2],[1,2,2,2],[2,1,3,1],[3,1,3,2],
            [4,1,5,1],[4,1,4,2],[0,4,1,4],[1,3,1,4],[2,3,2,4],
            [2,4,3,4],[3,3,3,5],[3,3,4,3],[4,4,5,4]]) wall(...segment);
        start=active.start=[ox+4.5*cell,oy+4.5*cell,180];
        shape('rectangle',[[ox+1.5,oy+1.5],[ox+cell-1.5,oy+cell-1.5]],.2,'#1eb840','#1eb840');
        configureSensors(active.model==='M6'?{4:['sonar',0,9,90],5:['sonar',9,0,0]}:{6:['sonar',0,9,90],7:['sonar',9,0,0],8:['color',9,0,0]});
    } else if (name==='ring'||name==='macro') {
        const diameter=name==='ring'?100:150,r=diameter/2,ink='#171717';
        const mark=(x,y,size)=>shape('ellipse',[[400+x-size,250+y-size],[400+x+size,250+y+size]],.5,'#edb900');
        const region={id:newObjectId('region'),name:'Кегельринг',kind:'ellipse',rect:[400-r,250-r,diameter,diameter],color:'#bb55aa',visible:false};
        regions.push(region);taskSpec=ringTask(region);
        const edge=r-3.5;
        shape('ellipse',[[400-edge,250-edge],[400+edge,250+edge]],7,ink);
        if(name==='ring') {
            for(let i=0;i<8;i++) mark(35*Math.cos(i*Math.PI/4),35*Math.sin(i*Math.PI/4),3);
            for(const x of [388,412]) shape('line',[[x,238],[x,262]],.8,'#da3535');
            start=active.start=[400,250,0];
        } else {
            for(const [x,y] of [[-24,-59],[24,-59],[-59,-24],[59,-24],[-59,24],[59,24],[-24,59],[24,59],
                [0,-37],[-23,-28],[26,-26],[-35,0],[35,0],[-26,24],[26,24],[0,35]]) mark(x,y,3.5);
            shape('rectangle',[[390,240],[410,260]],.6,'#edb900');
            start=active.start=[400,250,0];
        }
        configureSensors(active.model==='M6'?{4:['light',10,0,0,2],5:['sonar',9,0,0]}:{5:['light',10,-3,0,2],6:['light',10,3,0,2],7:['sonar',9,0,0]});
    } else if (['snake','checker','crossings','narrow','contour'].includes(name)) {
        const factor={snake:5/11,checker:5/9,crossings:5/18,narrow:.5,contour:.5}[name];
        const width=name==='narrow'?1:5, ink='#161616';
        const world=([x,y])=>[400+(x-350)*factor,250+(y-250)*factor];
        const l=(a,b,color=ink,w=width)=>shape('line',[a,b].map(world),w,color);
        const c=(a,b,p,q,color=ink)=>shape('cubicBezier',[a,b,p,q].map(world),width,color);
        const rect=(a,b,fill=null)=>shape('rectangle',[a,b].map(world),.3,fill??'#d1a200',fill);
        const path=(first,commands)=>{
            let point=first;
            for(const [end,p,q] of commands) {
                if(p) c(point,end,p,q);else l(point,end);
                point=end;
            }
        };
        let spawn,heading=0;
        if(name==='snake') {
            rect([25,367],[114,456]);rect([592,78],[681,167]);
            path([114,412],[[[514,412]],[[587,340],[554,412],[587,380]],[[514,267],[587,300],[554,267]],
                [[193,267]],[[120,195],[153,267],[120,235]],[[193,123],[120,155],[153,123]],[[592,123]]]);
            spawn=[65,412];
        } else if(name==='checker') {
            const xs=[33,187,342,496,651],ys=[30,180,329,479],white='#fff';
            for(let y=0;y<3;y++)for(let x=0;x<4;x++)if((x+y)%2)rect([xs[x],ys[y]],[xs[x+1],ys[y+1]],ink);
            c([110,180],[187,105],[110,139],[145,105]);l([187,105],[342,105],white);l([342,105],[496,105]);
            c([496,105],[573,180],[538,105],[573,139],white);l([573,180],[573,329]);
            c([573,329],[496,404],[573,370],[538,404],white);c([496,404],[419,329],[454,404],[419,370]);
            c([419,329],[342,254],[419,288],[384,254],white);c([342,254],[265,329],[300,254],[265,288]);
            c([265,329],[187,404],[265,370],[229,404],white);c([187,404],[110,329],[145,404],[110,370]);
            l([110,329],[110,180],white);spawn=[573,254];heading=90;
        } else if(name==='crossings') {
            path([106,178],[[[258,137],[106,93],[207,62]],[[452,137],[302,213],[409,211]],
                [[606,178],[505,62],[606,93]],[[606,338]],[[506,440],[606,394],[561,440]],
                [[206,440]],[[106,338],[151,440],[106,394]],[[106,178]]]);
            for(const y of [260,294])l([56,y],[156,y],ink,3);
            l([556,277],[656,277],ink,3);
            for(const x of [256,323,389,456])l([x,389],[x,493],ink,3);
            spawn=[606,277];heading=90;
        } else if(name==='contour') {
            path([125,528],[[[71,410],[62,528],[45,472]],[[196,128]],[[300,83],[217,77],[258,64]],
                [[395,125]],[[336,261],[483,161],[424,296]],[[230,346],[264,230],[212,291]],
                [[387,372],[251,416],[348,427]],[[553,343],[431,315],[482,312]],
                [[488,528],[643,387],[620,528]],[[125,528]]]);
            for(const x of [239,405])l([x,490],[x,569],ink,4);
            spawn=[379,528];heading=180;
        } else {
            path([47,299],[[[47,260],[47,282],[43,278]],[[48,225],[55,241],[43,236]],[[50,199],[43,213],[48,207]],
                [[49,178],[55,188],[46,184]],[[48,143],[40,159],[41,157]],[[44,104],[58,128],[50,117]],
                [[69,50],[28,82],[52,62]],[[106,56],[86,39],[104,43]],[[100,112],[106,69],[99,93]],
                [[153,187],[98,156],[122,186]],[[194,137],[181,186],[202,162]],[[159,105],[189,119],[176,108]],
                [[160,58],[146,102],[160,84]],[[188,38],[161,42],[169,36]],[[331,104],[230,34],[305,84]],
                [[378,122],[350,118],[364,123]],[[404,174],[393,123],[402,149]],[[434,202],[406,196],[419,208]],
                [[510,225],[459,193],[482,197]],[[537,218],[521,237],[526,227]],[[561,199]],
                [[562,168],[572,191],[567,178]],[[456,115],[542,129],[500,119]],[[416,84],[442,111],[430,96]],
                [[415,48],[396,71],[401,53]],[[479,46],[430,44],[461,50]],[[522,37],[494,43],[509,35]],
                [[561,87],[540,41],[532,84]],[[609,81],[577,89],[593,84]],[[621,93],[616,80],[621,85]],
                [[642,215]],[[637,225],[643,220],[641,222]],[[536,309]],[[514,305],[529,315],[520,311]],
                [[455,270],[495,288],[477,268]],[[373,334],[431,270],[397,305]],[[342,327],[363,345],[343,342]],
                [[342,209]],[[238,194],[342,150],[255,135]],[[268,260],[230,225],[245,250]],
                [[280,288],[291,268],[291,273]],[[171,343],[251,330],[212,349]],[[163,307],[151,340],[158,322]],
                [[171,242],[169,290],[201,253]],[[128,243],[155,236],[142,234]],[[96,316],[111,254],[103,292]],
                [[77,340],[90,333],[85,341]],[[47,299],[65,341],[48,321]]]);
            l([583,221],[599,240],ink,1);l([616,259],[632,278],ink,1);
            spawn=[606,251];heading=Math.atan2(84,-101)*180/Math.PI;
        }
        start=active.start=[...world(spawn),heading];
        const [a,b]=active.model==='M6'?[4,5]:[5,6],offset=width/2;
        configureSensors({[a]:['light',10,-offset,0,1],[b]:['light',10,offset,0,1]});
        if(name==='contour') {
            const second=newRobot([...world([265,528]),0]);
            Object.assign(second,{model:active.model,bodySize:active.bodySize,wheelDiameter:active.wheelDiameter,
                motorType:active.motorType,wheels:[...active.wheels],reversed:[...active.reversed],
                sensors:structuredClone(active.sensors)});
            robots.push(second);
        }
    } else configureSensors({});
    switchRobot(active,true);refreshPicker();refreshProgram();refreshOptions();refreshTaskEditor();reset();changeZoom(0);
}
function reset() {
    inspectionEpoch++;previewCheckpoint=null;states.clear();taskState=null;renderTaskResult(); elapsed=0; renderTimer(); $('status').textContent='Готово · 2D '+BUILD_VERSION;draw();
}
function renderTimer() { $('timer').textContent=elapsed.toFixed(3).replace('.',',')+' с'; }
function lock(value) {
    busy = value;
    for (const el of document.querySelectorAll('.setup input, .setup select, .setup button, .setup textarea, input.setup')) el.disabled = value;
    $('run').disabled = $('reset').disabled = $('rate').disabled = value;
    $('stop').disabled = !value;
    $('readSensors').disabled=value||!!inspectionPending;
    $('previewCheck').disabled=value||!!inspectionPending;
    for (const el of document.querySelectorAll('.edit-tool')) el.disabled=value;
    if (value) selectTool('pan');
    refreshPicker();refreshProgram();syncClaw();syncRealism();historyButtons();refreshTaskEditor();syncFieldLock();renderTennisControls();
}
function point(ev) {
    const b=canvas.getBoundingClientRect();
    return [camera.x+(ev.clientX-b.left-canvas.width/2)/scale,camera.y+(ev.clientY-b.top-canvas.height/2)/scale];
}
function sensorHit(f,r,[kind,x,y,a]) {
    const angle=a*Math.PI/180+sensorArt[kind][3],c=Math.cos(angle),s=Math.sin(angle);
    const df=f-x,dr=r-y,u=c*df+s*dr,v=-s*df+c*dr;
    const [left,top,w,h]=sensorArt[kind][2];
    const dx=Math.max(left-u,0,u-left-w),dy=Math.max(top-v,0,v-top-h);
    return Math.hypot(df,dr)*scale<=14 || Math.hypot(dx,dy)*scale<=5;
}
function near(x,y,p,r=10) {return Math.hypot(x-p[0],y-p[1])<=r/scale;}
function distSegment(x,y,a,b,c,d) {
    const dx=c-a,dy=d-b,t=clamp(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(x-a-t*dx,y-b-t*dy);
}
function controlsFor({key,row}) {
    if(key==='region'){const [x,y,w,h]=row.rect;return [[x,y],[x+w,y+h]];}
    if(key==='shape') return row.points;
    if(key==='segment') return [row.slice(0,2),row.slice(2,4)];
    if(key==='prop') return [];
    if(key==='circle') return [[row[0]+row[2],row[1]]];
    return [[row[0],row[1]],[row[0]+row[2],row[1]+row[3]]];
}
function objectHit(key,row,x,y) {
    const t=6/scale;
    if(key==='region'){
        if(!$('showRegions').checked||(!row.visible&&taskPick?.kind!=='region'))return false;
        const [a,b,w,h]=row.rect;return row.kind==='ellipse'?((x-a-w/2)/(w/2+t))**2+((y-b-h/2)/(h/2+t))**2<=1:x>=a-t&&y>=b-t&&x<=a+w+t&&y<=b+h+t;
    }
    if(key==='wall'||key==='image') return x>=row[0]-t&&y>=row[1]-t&&x<=row[0]+row[2]+t&&y<=row[1]+row[3]+t;
    if(key==='segment') return distSegment(x,y,...row.slice(0,4))<=t+row[4]/2;
    if(key==='prop') {const [a,b]=propPosition(row);return Math.hypot(x-a,y-b)<=propRadius(row[2])+t;}
    if(key==='circle') return Math.hypot(x-row[0],y-row[1])<=row[2]+t;
    const [a,b,c,d]=row.points, limit=t+row.width/2;
    if(row.kind==='ellipse'||row.kind==='rectangle') {
        const w=Math.abs(b[0]-a[0])/2,h=Math.abs(b[1]-a[1])/2;
        const u=Math.abs(x-(a[0]+b[0])/2),v=Math.abs(y-(a[1]+b[1])/2);
        const outer=row.kind==='ellipse'?(u/(w+limit))**2+(v/(h+limit))**2<=1:u<=w+limit&&v<=h+limit;
        const inner=w>limit&&h>limit&&(row.kind==='ellipse'?(u/(w-limit))**2+(v/(h-limit))**2<1:u<w-limit&&v<h-limit);
        return outer&&(row.fill||!inner);
    }
    if(row.kind!=='cubicBezier') return distSegment(x,y,...a,...b)<=limit;
    const steps=clamp(Math.ceil(scale*(Math.hypot(c[0]-a[0],c[1]-a[1])+Math.hypot(d[0]-c[0],d[1]-c[1])+Math.hypot(b[0]-d[0],b[1]-d[1]))/8),12,192);
    let last=a;
    for(let i=1;i<=steps;i++) {
        const t=i/steps,u=1-t;
        const q=a.map((n,j)=>n*u**3+3*c[j]*u*u*t+3*d[j]*u*t*t+b[j]*t**3);
        if(distSegment(x,y,...last,...q)<=limit) return true;
        last=q;
    }
    return false;
}
function drawObjectSelection(curve) {
    if(!selectedObject||curve||(selectedObject.key==='region'&&(!$('showRegions').checked||!selectedObject.row.visible))) return;
    const {key,row}=selectedObject, points=controlsFor(selectedObject);
    ctx.save();ctx.strokeStyle='#1774d2';ctx.fillStyle='#1774d2';ctx.lineWidth=1.5/scale;
    const [a,b]=points;
    ctx.beginPath();
    if(key==='prop') ctx.arc(...propPosition(row).slice(0,2),propRadius(row[2]),0,Math.PI*2);
    else if(key==='circle') ctx.arc(row[0],row[1],row[2],0,Math.PI*2);
    else if(key==='wall'||key==='image'||(['shape','region'].includes(key)&&row.kind==='rectangle')) ctx.rect(...a,b[0]-a[0],b[1]-a[1]);
    else if(['shape','region'].includes(key)&&row.kind==='ellipse') ctx.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(a[0]-b[0])/2,Math.abs(a[1]-b[1])/2,0,0,Math.PI*2);
    else {ctx.moveTo(...a);ctx.lineTo(...b);}
    ctx.stroke();
    for(const [x,y] of points) {ctx.beginPath();ctx.arc(x,y,4/scale,0,Math.PI*2);ctx.fill();}
    ctx.restore();
}
function axleOffset(robot) {
    if(robot.model==='Car') return -644*robot.bodySize/1920;
    return (robot.model==='M6'?82.5:robot.motorType==='sport'?-258.5:262.5)*robot.bodySize/1080;
}
function poseArray(robot,kind) {
    const [x,y,a]=kind==='start'?robot.start:(()=>{const q=pose(robot);return [q.x,q.y,q.heading*180/Math.PI];})();
    const offset=axleOffset(robot),angle=a*Math.PI/180;
    return [x+offset*Math.cos(angle),y+offset*Math.sin(angle),a];
}
function poseArrow(robot,kind) {
    const [x,y,a]=poseArray(robot,kind), len=(kind==='start'?29:33)/scale+(kind==='start'?0:robot.bodySize/2);
    return [x+len*Math.cos(a*Math.PI/180),y+len*Math.sin(a*Math.PI/180)];
}
function drawPoses() {
    ctx.save();
    robots.forEach((robot,i)=>{
        const [x,y]=poseArray(robot,'start'),d=7/scale;
        const color=START_COLORS[i];
        ctx.lineWidth=4/scale;ctx.strokeStyle='#fff';
        ctx.beginPath();ctx.moveTo(x-d,y);ctx.lineTo(x+d,y);ctx.moveTo(x,y-d);ctx.lineTo(x,y+d);ctx.stroke();
        ctx.lineWidth=2/scale;ctx.strokeStyle=color;ctx.stroke();
        if(!busy&&selectedPose?.robot===robot) {
            const k=selectedPose.kind,[a,b]=poseArray(robot,k),[tx,ty]=poseArrow(robot,k);
            ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(tx,ty);ctx.stroke();
            ctx.fillStyle=color;ctx.save();ctx.translate(tx,ty);ctx.rotate(Math.atan2(ty-b,tx-a));
            ctx.beginPath();ctx.moveTo(3/scale,0);ctx.lineTo(-8/scale,-5/scale);ctx.lineTo(-8/scale,5/scale);ctx.closePath();ctx.fill();ctx.restore();
        }
    });ctx.restore();
}
function selectTarget({obj,robot,kind,p,claw=false}={}) {
    selectedClaw=claw;
    selectedObject=obj;
    selectedPose=kind?{robot,kind}:undefined;
    selectedSensor=p;
    refreshOptions(true);refreshRegionFields();draw();
}
function gridPoint([x,y]) {
    return $('snapGrid').checked?[W/2+Math.round((x-W/2)/GRID_CM)*GRID_CM,H/2+Math.round((y-H/2)/GRID_CM)*GRID_CM]:[x,y];
}
function snapPoint(ev) {
    const [x,y]=point(ev);
    if(!drag||!['wall','line'].includes(drag.tool)||(!ev.shiftKey&&!ev.ctrlKey)) return gridPoint([x,y]);
    const step=ev.shiftKey?Math.PI/2:Math.PI/4, dx=x-drag.x,dy=y-drag.y;
    const a=Math.round(Math.atan2(dy,dx)/step)*step;
    const len=Math.max(0,dx*Math.cos(a)+dy*Math.sin(a));
    return gridPoint([drag.x+len*Math.cos(a),drag.y+len*Math.sin(a)]);
}
function moveObject(obj,old,handle,dx,dy,x,y) {
    const {row,key}=obj;
    if(key==='region') {
        const [a,b,w,h]=old.rect;
        if(handle===-1)row.rect=[a+dx,b+dy,w,h];
        else {const first=[a+(handle===0?dx:0),b+(handle===0?dy:0)],last=[a+w+(handle===1?dx:0),b+h+(handle===1?dy:0)];
            row.rect=[Math.min(first[0],last[0]),Math.min(first[1],last[1]),Math.max(1,Math.abs(last[0]-first[0])),Math.max(1,Math.abs(last[1]-first[1]))];}
    } else if(key==='shape') {
        row.points=old.points.map(([a,b],i)=>handle===-1?[a+dx,b+dy]:handle===i?[a+dx,b+dy]:[a,b]);
    } else if(key==='segment') {
        for(const i of [0,2]) if(handle===-1||handle===i/2) {row[i]=old[i]+dx;row[i+1]=old[i+1]+dy;}
    } else if(handle===-1) {
        row[0]=old[0]+dx;row[1]=old[1]+dy;
    } else if(key==='circle') row[2]=clamp(Math.hypot(x-row[0],y-row[1]),1,800);
    else {
        const [a,b,c,d]=old;
        const first=[a+(handle===0?dx:0),b+(handle===0?dy:0)];
        const last=[a+c+(handle===1?dx:0),b+d+(handle===1?dy:0)];
        row[0]=Math.min(first[0],last[0]);row[1]=Math.min(first[1],last[1]);
        row[2]=Math.max(1,Math.abs(last[0]-first[0]));row[3]=Math.max(1,Math.abs(last[1]-first[1]));
    }
}
canvas.addEventListener('wheel',ev=>{
    if(!ev.ctrlKey||!ev.deltaY) return;
    ev.preventDefault();
    if(drag||pan) return;
    const [x,y]=point(ev);
    zoom=clamp(zoom*Math.exp(-Math.sign(ev.deltaY)*.18),.2,12);
    const next=Math.max(.02,Math.min(canvas.width/fitSize[0],canvas.height/fitSize[1])*zoom);
    camera={x:x+(camera.x-x)*scale/next,y:y+(camera.y-y)*scale/next};draw();
},{passive:false});
canvas.addEventListener('pointerdown',ev=>{
    if(ev.button!==0||drag||pan) return;
    $('fieldMenu').hidden=true;canvas.focus();
    const [x,y]=point(ev), base={x,y,pointerId:ev.pointerId};
    if(!busy&&handleTaskPick(x,y))return;
    canvas.setPointerCapture(ev.pointerId);
    if(!busy&&Object.hasOwn(PROP_RADIUS,tool)) {
        if(props.length>=64) {$('status').textContent='На поле допускается до 64 подвижных объектов.';return;}
        const row=[...gridPoint([x,y]),tool],list=props;
        list.push(row);propId(row);record(()=>list.splice(list.indexOf(row),1),()=>list.push(row));refreshTaskEditor();draw();return;
    }
    if(tool!=='pan'&&!busy) {const [sx,sy]=gridPoint([x,y]);drag={...base,x:sx,y:sy,toX:sx,toY:sy,tool};return;}
    if(!busy) {
        if(selectedClaw && active.claw && !ev.altKey) {
            const [f,r]=fieldToRobot(x,y),q=active.claw;
            if(near(f,r,arrow(q.forward,q.right,q.angle),11)) {
                drag={...base,type:'claw',robot:active,turn:true,old:{...q}};return;
            }
        }
        if(selectedPose&&near(x,y,poseArrow(selectedPose.robot,selectedPose.kind),9)) {
            const {robot,kind}=selectedPose;
            drag={...base,type:'pose',robot,kind,turn:true,old:poseArray(robot,kind)};return;
        }
        if(selectedObject&&(!fieldLocked||selectedObject.key==='prop')) {
            const handle=controlsFor(selectedObject).findIndex(p=>near(x,y,p,8));
            if(handle!==-1) {drag={...base,type:'object',obj:selectedObject,handle,old:structuredClone(selectedObject.row)};return;}
        }
        const rows=sensors(),[f,r]=fieldToRobot(x,y),sel=rows[selectedSensor];
        let p=!ev.altKey&&sel&&near(f,r,arrow(...sel.slice(1,4)),11)?selectedSensor:undefined;
        const turn=!!p;
        if(!p&&!ev.altKey) {
            const hits=Object.entries(rows).filter(([,row])=>sensorHit(f,r,row)).map(([id])=>id);
            if(hits.length) p=hits[(hits.indexOf(selectedSensor)+1)%hits.length];
        }
        if(p) {selectTarget({p});drag={...base,type:'sensor',robot:active,p,turn,old:[...rows[p]]};return;}
        if(!ev.altKey) {
            const robot=[...robots].reverse().find(robot=>{
                const q=pose(robot),c=Math.cos(q.heading),s=Math.sin(q.heading),dx=x-q.x,dy=y-q.y;
                const f=dx*c+dy*s,r=-dx*s+dy*c;
                return clawPolygons(robot).some(poly=>poly.every(([a,b],i)=>{
                    const [u,v]=poly[(i+1)%poly.length];return (u-a)*(r-b)-(v-b)*(f-a)>=0;
                }));
            });
            if(robot) {
                if(robot!==active) switchRobot(robot);
                if(robot!==active) return;
                selectTarget({claw:true});
                drag={...base,type:'claw',robot,turn:false,old:{...robot.claw}};return;
            }
        }
        const marker=ev.altKey?undefined:[...robots].reverse().find(r=>{
            const [a,b]=poseArray(r,'start');
            const dx=Math.abs(x-a)*scale,dy=Math.abs(y-b)*scale;
            return Math.max(dx,dy)<=8&&Math.min(dx,dy)<=3;
        });
        const body=[...robots].reverse().find(robot=>{
            const q=pose(robot),c=Math.cos(q.heading),s=Math.sin(q.heading),dx=x-q.x,dy=y-q.y;
            const f=dx*c+dy*s,r=-dx*s+dy*c;
            return (Math.abs(f)<=robot.bodySize/2&&Math.abs(r)<=robot.bodySize/2*(robot.model==='Car'?1080/1920:1)) ||
                clawPolygons(robot).some(poly=>poly.every(([a,b],i)=>{
                    const [u,v]=poly[(i+1)%poly.length];return (u-a)*(r-b)-(v-b)*(f-a)>=0;
                }));
        });
        const robot=marker??body;
        if(robot) {
            if(robot!==active) switchRobot(robot);
            if(robot!==active) return;
            const kind=marker?'start':'robot';
            selectTarget({robot,kind});drag={...base,type:'pose',robot,kind,old:poseArray(robot,kind)};return;
        }
        for(const [key,list] of [['prop',props],['circle',circles],['segment',segments],['wall',walls],['shape',shapeList],['region',regions]]) {
            if(fieldLocked&&key!=='prop')continue;
            const row=[...list].reverse().find(row=>objectHit(key,row,x,y));
            if(!row) continue;
            const obj={key,list,row};selectTarget({obj});
            drag={...base,type:'object',obj,handle:-1,old:structuredClone(row),live:propPoses.get(row)};return;
        }
        if(!fieldLocked&&background&&objectHit('image',background,x,y)) {
            const obj={key:'image',row:background};selectTarget({obj});
            drag={...base,type:'object',obj,handle:-1,old:[...background]};return;
        }
        selectTarget();
    }
    pan={x:ev.clientX,y:ev.clientY,camera:{...camera},pointerId:ev.pointerId};
});
function setPose(robot,kind,value) {
    const [x,y,a]=value,angle=a*Math.PI/180,offset=axleOffset(robot);
    value=[x-offset*Math.cos(angle),y-offset*Math.sin(angle),a];
    if(kind==='robot') states.delete(robot.id);
    if(kind==='start') {
        // Freeze the current pose before changing a marker the robot is standing on.
        if(!currentPoses.has(robot.id)) currentPoses.set(robot.id,[...robot.start]);
        robot.start=value;
        if(robot===active) start=value;
    } else currentPoses.set(robot.id,value);
}
function updateDrag(ev) {
    const [x,y]=point(ev),dx=x-drag.x,dy=y-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)*scale<3) return;
    drag.moved=true;
    if(drag.tool) [drag.toX,drag.toY]=snapPoint(ev);
    else if(drag.type==='object') {
        const {obj,old,live}=drag;
        if(obj.key==='prop') propPoses.delete(obj.row);
        moveObject(obj,live??old,drag.handle,dx,dy,x,y);
    }
    else if(drag.type==='pose') {
        const [a,b,c]=drag.old;
        const angle=Math.atan2(y-b,x-a)*180/Math.PI,step=ev.shiftKey?90:ev.ctrlKey?45:0;
        setPose(drag.robot,drag.kind,drag.turn?[a,b,step?Math.round(angle/step)*step:angle]:[a+dx,b+dy,c]);
    } else if(drag.type==='claw') {
        const q=drag.robot.claw,[f,r]=fieldToRobot(x,y),[f0,r0]=fieldToRobot(drag.x,drag.y);
        if(drag.turn) {
            const angle=Math.atan2(r-q.right,f-q.forward)*180/Math.PI,step=ev.shiftKey?90:ev.ctrlKey?45:0;
            q.angle=step?Math.round(angle/step)*step:angle;
        } else {
            q.forward=clamp(drag.old.forward+f-f0,-100,100);
            q.right=clamp(drag.old.right+r-r0,-100,100);
        }
    } else if(drag.type==='sensor') {
        const q=drag.robot.sensors[drag.p], [f,r]=fieldToRobot(x,y),[f0,r0]=fieldToRobot(drag.x,drag.y);
        if(drag.turn) {
            const angle=Math.atan2(r-q[2],f-q[1])*180/Math.PI,step=ev.shiftKey?90:ev.ctrlKey?45:0;
            q[3]=step?Math.round(angle/step)*step:angle;
        }
        else {q[1]=clamp(drag.old[1]+f-f0,-100,100);q[2]=clamp(drag.old[2]+r-r0,-100,100);}
    }
}
function captureDrag(d) {
    if(d.type==='object') return {row:structuredClone(d.obj.row),live:propPoses.get(d.obj.row)};
    if(d.type==='pose') return [...poseArray(d.robot,d.kind)];
    if(d.type==='sensor') return [...d.robot.sensors[d.p]];
    if(d.type==='claw') return {...d.robot.claw};
}
function restoreDrag(d,value) {
    if(d.type==='object') {
        Object.assign(d.obj.row,structuredClone(value.row));
        if(value.live) propPoses.set(d.obj.row,value.live);
        else propPoses.delete(d.obj.row);
    } else if(d.type==='pose') setPose(d.robot,d.kind,[...value]);
    else if(d.type==='sensor') d.robot.sensors[d.p]=[...value];
    else if(d.type==='claw') d.robot.claw={...value};
}
function revertDrag(d) {
    if(d.type==='object') {Object.assign(d.obj.row,structuredClone(d.old));if(d.live)propPoses.set(d.obj.row,d.live);}
    else if(d.type==='pose') setPose(d.robot,d.kind,[...d.old]);
    else if(d.type==='sensor') d.robot.sensors[d.p]=[...d.old];
    else if(d.type==='claw') d.robot.claw={...d.old};
}
canvas.addEventListener('pointermove',ev=>{
    if(pan?.pointerId===ev.pointerId) {
        camera={x:pan.camera.x-(ev.clientX-pan.x)/scale,y:pan.camera.y-(ev.clientY-pan.y)/scale};draw();
    } else if(drag?.pointerId===ev.pointerId) {updateDrag(ev);draw();}
});
canvas.addEventListener('pointercancel',ev=>{
    if(drag?.pointerId===ev.pointerId) {if(drag.moved)revertDrag(drag);drag=undefined;}
    if(pan?.pointerId===ev.pointerId) {camera=pan.camera;pan=undefined;}
    draw();
});
canvas.addEventListener('pointerup',ev=>{
    if(pan?.pointerId===ev.pointerId) {pan=undefined;return;}
    if(!drag||drag.pointerId!==ev.pointerId) return;
    updateDrag(ev);const d=drag;drag=undefined;
    if(!d.moved) {draw();return;}
    if(!d.tool) {
        const after=captureDrag(d);
        record(()=>revertDrag(d),()=>restoreDrag(d,after));
        refreshOptions(true);refreshTaskEditor();draw();return;
    }
    const [x,y]=[d.toX,d.toY],kind=d.tool,width=clamp(Number($('width').value)||4,1,50);
    if(Math.hypot(x-d.x,y-d.y)<2) {draw();return;}
    if(kind==='wall') {
        if(walls.length+segments.length+circles.length<200) {
            const list=segments,row=[d.x,d.y,x,y,width];list.push(row);record(()=>list.splice(list.indexOf(row),1),()=>list.push(row));
        }
    } else if(['regionRect','regionEllipse'].includes(kind)) {
        if(regions.length>=100){$('status').textContent='Допускается до 100 регионов.';draw();return;}
        const row={id:newObjectId('region'),name:'Регион '+(regions.length+1),kind:kind==='regionEllipse'?'ellipse':'rectangle',rect:[Math.min(x,d.x),Math.min(y,d.y),Math.abs(x-d.x),Math.abs(y-d.y)],color:'#bb55aa',visible:true},list=regions;
        list.push(row);record(()=>list.splice(list.indexOf(row),1),()=>list.push(row));
        $('showRegions').checked=true;selectTool('pan');selectTarget({obj:{key:'region',list,row}});refreshTaskEditor();showTab('task');
        if(taskPick?.kind==='draw'){finishTaskPick(row.id);}
    } else if(shapeList.length<4000) {
        const ink=$('paint').value, points=[[d.x,d.y],[x,y]];
        const shape={kind:kind==='curve'?'cubicBezier':kind==='paint'?'rectangle':kind,points,
            width:['curve','line'].includes(kind)?width:1,stroke:ink,fill:['paint','ellipse'].includes(kind)?ink:null};
        if(kind==='curve') {
            const dx=x-d.x,dy=y-d.y;
            points.push([d.x+dx/3-dy/5,d.y+dy/3+dx/5],[x-dx/3+dy/5,y-dy/3-dx/5]);
        }
        const list=shapeList;list.push(shape);record(()=>list.splice(list.indexOf(shape),1),()=>list.push(shape));
        if(kind==='curve') {selectTool('pan');selectTarget({obj:{key:'shape',list,row:shape}});}
    }
    draw();
});
canvas.addEventListener('keydown',ev=>{
    if(ev.key!=='Delete'||busy||drag) return;
    if(selectedSensor&&active.sensors[selectedSensor]) {
        ev.preventDefault();
        const robot=active,p=selectedSensor,before=structuredClone(robot.sensors[p]);
        const hadSettings=Object.hasOwn(robot.deviceSettings??{},p);
        const settings=hadSettings?structuredClone(robot.deviceSettings[p]):undefined;
        const remove=()=>{delete robot.sensors[p];if(robot.deviceSettings)delete robot.deviceSettings[p];};
        const restore=()=>{robot.sensors[p]=structuredClone(before);if(hadSettings){robot.deviceSettings??={};robot.deviceSettings[p]=structuredClone(settings);}};
        remove();record(restore,remove);selectTarget();refreshSensors();reset();return;
    }
    if(selectedClaw&&active.claw) {
        ev.preventDefault();
        const robot=active,before=structuredClone(robot.claw);
        robot.claw=null;record(()=>{robot.claw=structuredClone(before);},()=>{robot.claw=null;});
        selectTarget();syncClaw();reset();return;
    }
    if(!selectedObject)return;
    const {list,row,key}=selectedObject;
    if(fieldLocked&&key!=='prop')return;
    if(key==='image') {
        ev.preventDefault();background=false;record(()=>{background=row;},()=>{background=false;});selectTarget();return;
    }
    const i=list.indexOf(row);
    if(i===-1) return;
    ev.preventDefault();list.splice(i,1);record(()=>list.splice(i,0,row),()=>list.splice(i,1));selectTarget();refreshTaskEditor();
});
for(const id of ['paint','width','radius']) $(id).onchange=()=>{
    const sel=tool==='pan'?selectedObject:null;
    if(!sel||fieldLocked) return;
    const {row,key}=sel,old=structuredClone(row);
    if(id==='paint'&&key==='shape') {row.stroke=$(id).value;if(row.fill)row.fill=row.stroke;}
    if(id==='width'&&key==='shape') row.width=clamp(+$(id).value||1,.2,800);
    if(id==='width'&&key==='segment') row[4]=clamp(+$(id).value||1,1,800);
    if(id==='radius'&&key==='circle') row[2]=clamp(+$(id).value||1,1,800);
    const after=structuredClone(row);
    record(()=>Object.assign(row,structuredClone(old)),()=>Object.assign(row,structuredClone(after)));refreshOptions(true);draw();
};
function historyButtons() {
    $('undo').disabled=busy||fieldLocked||!undo.length;
    $('redo').disabled=busy||fieldLocked||!redo.length;
}
function record(back,forward) {
    undo.push({back,forward});
    if(undo.length>50) undo.shift();
    redo.length=0;historyButtons();
}
function travelHistory(back) {
    if(busy||fieldLocked||drag||pan) return;
    const from=back?undo:redo,to=back?redo:undo,entry=from.pop();
    if(!entry) return;
    entry[back?'back':'forward']();
    to.push(entry);
    selectedClaw=false;selectedObject=selectedSensor=selectedPose=undefined;
    switchRobot(active,true);refreshOptions(true);syncRealism();historyButtons();refreshTaskEditor();syncFieldLock();reset();
}
$('undo').onclick=()=>travelHistory(true);
$('redo').onclick=()=>travelHistory(false);
window.addEventListener('keydown',ev=>{
    const tag=(ev.target?.tagName??'').toLowerCase();
    if($('taskDialog').open||['input','textarea','select'].includes(tag)||ev.target?.isContentEditable) return;
    if(!(ev.ctrlKey||ev.metaKey)||ev.altKey) return;
    const key=ev.code==='KeyZ'?'z':ev.code==='KeyY'?'y':ev.code?'':(ev.key??'').toLowerCase();
    if(key==='z'||key==='y') {
        if(busy||fieldLocked||drag||pan) return;
        ev.preventDefault();travelHistory(key==='z'&&!ev.shiftKey);
    }
});
$('apply').onclick=()=>preset($('preset').value);
function wheelLimits(values=[$('left').value,$('right').value]) {
    const max=active.model==='E7'?8:4;
    const valid=n=>Number.isInteger(+n)&&+n>=1&&+n<=max;
    const left=valid(values[0])?+values[0]:1;
    const right=valid(values[1])&&+values[1]!==left?+values[1]:left===3?1:3;
    for(const [id,value] of [['left',left],['right',right]]) {
        const select=$(id);
        select.replaceChildren();
        for(let i=1;i<=max;i++) element('option','Мотор M'+i,select).value=String(i);
        select.value=String(value);
    }
}
$('model').onchange=()=>{
    const previous=active.model;
    active.model=$('model').value;selectedSensor=undefined;
    if(active.model==='Car'&&previous!=='Car') {
        changeBody(CAR_LENGTH);active.wheelDiameter=65;$('wheelDiameter').value='65';active.motorType='standard';$('motorType').value='standard';active.differential??=true;
    } else if(previous==='Car'&&active.model!=='Car') {changeBody(DEFAULT_BODY);active.wheelDiameter=56;$('wheelDiameter').value='56';}
    wheelLimits();
    active.wheels=[+$('left').value,+$('right').value];
    if(active.claw&&CLAWS[active.claw.kind].mechanism) {
        const available=Array.from({length:active.model==='E7'?8:4},(_,i)=>i+1).filter(p=>!active.wheels.includes(p));
        if(!available.includes(active.claw.motor)) active.claw.motor=available[0];
    }
    syncClaw();syncVehicle();refreshSensors();reset();
};
$('image').onchange=async ev=>{
    const file=ev.target.files[0];
    ev.target.value='';
    if (!file || busy || fieldLocked) return;
    try {
        if (file.size>12*1024*1024) throw new Error('Выбери картинку до 12 МБ.');
        const img=await createImageBitmap(file);
        if (busy||fieldLocked) { img.close(); return; }
        const previous=ground.getImageData(0,0,W,H), had=background;
        blank();
        const scale=Math.min(W/img.width,H/img.height);
        const w=img.width*scale,h=img.height*scale;
        ground.drawImage(img,(W-w)/2,(H-h)/2,w,h); background=[0,0,W,H];img.close();
        const after=ground.getImageData(0,0,W,H),rect=[...background];
        record(()=>{ground.putImageData(previous,0,0);background=had;},
               ()=>{ground.putImageData(after,0,0);background=[...rect];});
        selectTarget();reset();changeZoom(0);
    } catch (err) { $('status').textContent=err.message; }
};
function rasterize() {
    let [a,b,c,d]=drawingBounds(1,false), w=c-a,h=d-b;
    if (w*h>2_200_000 || w>4000 || h>4000) throw new Error('Рисунок слишком большой. Сблизь фигуры или уменьши поле.');
    const bitmap=document.createElement('canvas');bitmap.width=w;bitmap.height=h;
    const ink=bitmap.getContext('2d',{willReadFrequently:true});
    ink.fillStyle='#fff';ink.fillRect(0,0,w,h);ink.translate(-a,-b);
    if (background) ink.drawImage(floor,...background);
    for (const shape of shapeList) if (!shape.guide) drawShape(ink,shape);
    const data=ink.getImageData(0,0,w,h).data,chunks=[];
    let chunk='';
    for (let i=0;i<data.length;i+=4) {
        chunk+=String.fromCharCode(data[i],data[i+1],data[i+2]);
        if (chunk.length>=8192) {chunks.push(chunk);chunk='';}
    }
    return {raster:[a,b,w,h],floor:btoa(chunks.join('')+chunk),bounds:drawingBounds()};
}
function stash(validate=true) {
    for (const id of ['bodySize','wheelDiameter','left','right']) {
        const el=$(id);
        if (!el.value||!el.validity.valid) {
            if (validate) throw new Error('Проверь значение: '+(el.closest('label')?.textContent.trim()||id));
            return false;
        }
    }
    if ($('left').value===$('right').value) {
        if (validate) throw new Error('У колёс должны быть разные порты.');
        return false;
    }
    const name=$('robotName').value.trim()||active.name;
    Object.assign(active,{name,start,bodySize,wheelDiameter:+$('wheelDiameter').value,
        motorType:$('motorType').value,wheels:[+$('left').value,+$('right').value],reversed:[$('invertL').checked,$('invertR').checked]});
    return true;
}
function scene(kind,checkTask=true) {
    stash();
    const runRobots=kind==='run'?robots.map(robot=>{
        const q=pose(robot);
        return {...robot,start:[q.x,q.y,q.heading*180/Math.PI]};
    }):robots;
    const result={ballDiameter,realistic,fieldLocked,regions,task:checkTask&&!(kind==='run'&&training)?compiledTask():taskSpec,propIds:props.map(propId),robots:runRobots,walls,segments,circles,props:kind==='run'?props.map(row=>[...propPosition(row).slice(0,2),row[2]]):props,shapes:shapeList};
    return kind==='run'?{...result,...rasterize()}:{...result,background:background?floor.toDataURL('image/png').split(',')[1]:'',backgroundRect:background||undefined};
}
function refreshPicker() {
    $('activeRobot').replaceChildren();
    for (const r of robots) element('option',r.name,$('activeRobot')).value=r.id;
    $('activeRobot').value=active.id;
    $('addRobot').disabled=busy||robots.length>=8;$('removeRobot').disabled=busy||robots.length===1;
}
function refreshProgram() {
    $('program').textContent=active.program?active.program.split(/[\/]/).pop():active.blockProgramName?'Блоки: '+active.blockProgramName:'Выбрать файл…';
    $('clearProgram').disabled=busy||!active.program;
}
function switchRobot(robot,force=false) {
    if (!robot) return;
    if (!force && !busy && !stash(false)) {
        $('status').textContent='Исправь настройки выбранного робота.';$('activeRobot').value=active.id;return;
    }
    active=robot;start=active.start;changeBody(active.bodySize);selectedSensor=undefined;selectedClaw=false;
    $('robotName').value=active.name;$('model').value=active.model;$('wheelDiameter').value=active.wheelDiameter;
    $('motorType').value=active.motorType;
    syncRealism();syncVehicle();
    [$('invertL').checked,$('invertR').checked]=active.reversed;
    wheelLimits(active.wheels);refreshSensors();refreshPicker();refreshProgram();syncClaw();
    showMemory();showVariables();showOutput();draw();
}
$('activeRobot').onchange=()=>switchRobot(robots.find(r=>r.id===$('activeRobot').value));
$('robotName').onchange=()=>{if(stash(false)) refreshPicker();draw();};
$('addRobot').onclick=()=>{
    if (!stash(false)) return;
    let x=active.start[0]+active.bodySize+25,y=active.start[1];
    while (robots.some(r=>Math.hypot(r.start[0]-x,r.start[1]-y)<r.bodySize+15)) x+=100;
    const r=newRobot([x,y,0]),previous=active;robots.push(r);
    record(()=>{robots.splice(robots.indexOf(r),1);active=previous;},
           ()=>{robots.push(r);active=r;});
    switchRobot(r,true);reset();changeZoom(0);
};
$('removeRobot').onclick=()=>{
    if(robots.length<=1) return;
    const r=active,index=robots.indexOf(r),position=currentPoses.get(r.id);
    currentPoses.delete(r.id);selectedPose=undefined;robots.splice(index,1);
    const next=robots[0];
    record(()=>{robots.splice(index,0,r);if(position)currentPoses.set(r.id,position);active=r;},
           ()=>{robots.splice(robots.indexOf(r),1);currentPoses.delete(r.id);active=next;});
    switchRobot(next,true);reset();changeZoom(0);
};
$('program').onclick=()=>vscode.postMessage({kind:'chooseProgram',robot:active.id});
$('clearProgram').onclick=()=>{active.program='';refreshProgram();};
const MEMORY_COUNT=128;
function updateMemoryLayout() {
    const area=$('memoryGrid');
    if($('memory').hidden||!area.clientWidth||!area.clientHeight||$('cells').contains(document.activeElement)) return;
    const columns=Math.max(1,Math.floor((area.clientWidth+8)/98));
    const rows=Math.max(1,Math.floor((area.clientHeight+5)/35));
    const size=Math.min(MEMORY_COUNT,columns*rows);
    $('cells').style.gridTemplateColumns='repeat('+columns+', minmax(0,1fr))';
    if(size!==memorySize) {
        memoryOffset=Math.floor(memoryOffset/size)*size;
        memorySize=size;
        showMemory();
    }
}
function showMemory() {
    const size=memorySize||MEMORY_COUNT;
    const end=Math.min(memoryOffset+size,MEMORY_COUNT);
    $('page').textContent=(memoryOffset+1)+'–'+end+' / '+MEMORY_COUNT;
    $('prevPage').hidden=$('nextPage').hidden=size>=MEMORY_COUNT;
    $('prevPage').disabled=memoryOffset===0;$('nextPage').disabled=end>=MEMORY_COUNT;
    const grid=$('cells');grid.replaceChildren();
    const owner=active;
    for (let i=memoryOffset+1;i<=end;i++) {
        const label=element('label',String(i),grid), cell=numeric(label,owner.cells[i]??0,0,4095);
        cell.step='1';cell.disabled=busy;cell.setAttribute('aria-label','Ячейка '+i);
        cell.onchange=()=>{
            if (cell.value===''||!cell.validity.valid||!Number.isInteger(+cell.value)) {
                cell.value=owner.cells[i]??0;
                $('status').textContent='Ячейка '+i+': нужно целое число от 0 до 4095.';
            } else if (+cell.value) owner.cells[i]=+cell.value;
            else delete owner.cells[i];
        };
    }
}
$('prevPage').onclick=()=>{if(memorySize&&memoryOffset>0) {memoryOffset-=memorySize;showMemory();}};
$('nextPage').onclick=()=>{if(memorySize&&memoryOffset+memorySize<MEMORY_COUNT) {memoryOffset+=memorySize;showMemory();}};
$('cells').addEventListener('focusout',()=>requestAnimationFrame(updateMemoryLayout));
new ResizeObserver(updateMemoryLayout).observe($('memoryGrid'));
function showVariables() {
    const rows=$('variableRows');rows.replaceChildren();
    const entries=Object.entries(variables.get(active.id)||{}).sort(([a],[b])=>a.localeCompare(b));
    $('noVariables').hidden=entries.length>0;
    for(const [name,value] of entries) {
        const row=element('tr','',rows);element('td',name,row);element('td',value,row);
    }
}
async function load(s) {
    ballDiameter=s.ballDiameter??6.7;tennisRoundId++;tennisRecorded=null;
    let bitmap;
    if (s.background) {
        const raw=atob(s.background);
        bitmap=await createImageBitmap(new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:'image/png'}));
        if (bitmap.width!==W||bitmap.height!==H) {bitmap.close();throw new Error('Неверный размер изображения поля.');}
    }
    if (busy) {bitmap?.close();return;}
    undo.length=0;redo.length=0;historyButtons();blank();background=bitmap?(s.backgroundRect??[0,0,W,H]):false;
    if (bitmap) {ground.drawImage(bitmap,0,0);bitmap.close();}
    realistic=!!s.realistic;fieldLocked=!!s.fieldLocked;syncRealism();syncFieldLock();
    walls=s.walls;segments=s.segments;circles=s.circles;props=s.props??[];propPoses.clear();shapeList=s.shapes;robots=s.robots;
    importTaskData(s);
    serial=Math.max(serial,...robots.map(r=>/^r\d+$/.test(r.id)?Number(r.id.slice(1)):0));
    selectedObject=selectedPose=undefined;currentPoses.clear();refreshOptions();variables.clear();outputs.clear();switchRobot(robots[0],true);
    reset();changeZoom(0);
}
function drawShape(target,shape) {
    const [[x,y],[xx,yy]] = shape.points;
    target.save(); target.beginPath();
    target.strokeStyle=shape.stroke;
    target.lineWidth=Math.max(.2,shape.width);target.lineCap=shape.lineCap??'butt';
    const dashes={dot:[1,2],dash:[4,2],dashdot:[4,2,1,2],dashdotdot:[4,2,1,2,1,2]};
    target.setLineDash((Object.hasOwn(dashes,shape.dash)?dashes[shape.dash]:[]).map(x=>x*target.lineWidth));
    if (shape.kind==='ellipse') {
        target.ellipse((x+xx)/2,(y+yy)/2,Math.abs(x-xx)/2,Math.abs(y-yy)/2,0,0,Math.PI*2);
    } else if (shape.kind==='rectangle') target.rect(x,y,xx-x,yy-y);
    else {
        target.moveTo(x,y);
        if (shape.kind==='cubicBezier') target.bezierCurveTo(...shape.points[2],...shape.points[3],xx,yy);
        else target.lineTo(xx,yy);
    }
    if (shape.fill) {target.fillStyle=shape.fill; target.fill();}
    if(shape.width!==0||!shape.fill)target.stroke(); target.restore();
}
function loadPolygon(data) {
    ballDiameter=data.ballDiameter??6.7;
    fieldLocked=false;syncFieldLock();
    if (!stash(false)) throw new Error('Сначала исправь настройки робота.');
    undo.length=0;redo.length=0;historyButtons();blank();background=false;walls=[];segments=data.segments;circles=data.circles;props=data.props??[];propPoses.clear();shapeList=data.shapes;
    importTaskData(data);if(taskSpec){taskSpec.aliases??={};taskSpec.aliases.robot1=active.id;}
    start=active.start=data.start;currentPoses.delete(active.id);changeBody(data.bodySize??17.5,true);selectedObject=selectedPose=selectedSensor=undefined;refreshOptions();
    if(data.sensors)configureSensors(data.sensors);
    refreshTaskEditor();reset();changeZoom(0);
    $('status').textContent='Полигон открыт · стен: '+segments.length+' · объектов: '+props.length+' · регионов: '+regions.length+
        (data.reduced?' · большой рисунок уменьшен при импорте':'')+
        (data.skipped.length?' · пропущено: '+data.skipped.join(', '):'');
}
function sendScene(kind,externalRequestId) {
    try {
        if(externalRequestId && busy)throw new Error('Сначала останови программу в модели.');
        if(kind==='run'&&taskSpec?.kind==='tennis'&&!training){
            if(tennisWins().some(n=>n>=2))throw Error('Матч завершён. Начни новый матч.');
            if(taskState?.tennis&&taskState.status!=='running')throw Error('Подготовь следующий сет или переигровку во вкладке «Задание».');
            tennisRoundId++;tennisRecorded=null;
        }
        const data=scene(kind);
        if (kind==='run') {
            manualPreview=false;previewCheckpoint=null;
            variables.clear();outputs.clear();showVariables();showOutput();
            for (const robot of data.robots) currentPoses.set(robot.id,robot.start);
            reset();error=false;lock(true);$('status').textContent='Запуск…';
        }
        vscode.postMessage({kind,scene:data,rate:+$('rate').value,training,externalRequestId,robot:active.id});
    } catch (err) { $('status').textContent=err.message;if(externalRequestId)vscode.postMessage({kind:'externalRunError',requestId:externalRequestId,text:err.message}); }
}
$('run').onclick=()=>sendScene('run');
$('stop').onclick=()=>vscode.postMessage({kind:'stop'});
$('save').onclick=()=>{$('fieldMenu').hidden=true;sendScene('save');};
$('load').onclick=()=>{$('fieldMenu').hidden=true;vscode.postMessage({kind:'load'});};
$('reset').onclick=()=>{currentPoses.clear();propPoses.clear();reset();};
function openMenu(x,y) {
    if (busy) return;
    const m=$('fieldMenu'), v=$('viewport');
    m.hidden=false;m.style.left=clamp(x,0,Math.max(0,v.clientWidth-m.offsetWidth))+'px';
    m.style.top=clamp(y,0,Math.max(0,v.clientHeight-m.offsetHeight))+'px';
    m.querySelector('button').focus();
}
canvas.addEventListener('contextmenu',ev=>{
    ev.preventDefault();
    const r=canvas.getBoundingClientRect();openMenu(ev.clientX-r.left,ev.clientY-r.top);
});
canvas.addEventListener('keydown',ev=>{
    if (ev.key==='ContextMenu'||(ev.shiftKey&&ev.key==='F10')) {ev.preventDefault();openMenu(10,10);}
});
window.addEventListener('pointerdown',ev=>{if(!$('fieldMenu').contains(ev.target))$('fieldMenu').hidden=true;});
window.addEventListener('keydown',ev=>{if(ev.key==='Escape')$('fieldMenu').hidden=true;});
function output(robot=active.id) {
    if (!outputs.has(robot)) outputs.set(robot,{log:'',display:new Map()});
    return outputs.get(robot);
}
function showOutput() {
    const o=output();
    $('log').textContent=o.log;
    $('display').textContent=[...o.display].sort((a,b)=>Number(a[0])-Number(b[0])).map(([r,t])=>r+': '+t).join('\n');
}
window.addEventListener('message',async ({data:m})=>{
    switch(m.kind) {
        case 'externalProgram': active.program='';active.blockProgramName=m.name;refreshProgram();$('source').textContent='Блоки: '+m.name;$('status').textContent='Программа готова. Нажми ▶ для запуска.';vscode.postMessage({kind:'bindExternalProgram',requestId:m.requestId,robot:active.id});break;
        case 'externalRun': active.program='';active.blockProgramName=m.name;refreshProgram();$('source').textContent='Блоки: '+m.name;sendScene('run',m.requestId);break;
        case 'source': $('source').textContent='Открыт: '+m.name; break;
        case 'program': {
            const r=robots.find(r=>r.id===m.robot);if(r){r.program=m.path;delete r.blockProgramName;}
            refreshProgram();break;
        }
        case 'saved': $('status').textContent='Полигон сохранён';break;
        case 'started': $('status').textContent='Модель запущена';break;
        case 'inspection':
        case 'inspectionError': {
            if(!inspectionPending||m.requestId!==inspectionPending.id)break;
            const pending=inspectionPending;inspectionPending=null;
            $('readSensors').disabled=busy;$('previewCheck').disabled=busy;
            if(!busy&&pending.epoch===inspectionEpoch){
                if(m.kind==='inspectionError'){$('sensorStatus').textContent=m.text;$('status').textContent=m.text;}
                else{
                    for(const [id,s]of Object.entries(m.robots)){
                        const previous=states.get(id);states.set(id,{...s,...previous,sensors:s.sensors,lamps:s.lamps});
                    }
                    if(pending.judge&&manualPreview){taskState=m.task;previewCheckpoint=m.checkpoint;renderTaskResult();}
                    $('sensorStatus').textContent='Показания обновлены';draw();
                }
            }
            if(inspectionQueued){const queued=inspectionQueued;inspectionQueued=null;requestInspection(queued.judge,queued.advance);}break;
        }
        case 'state':
            if (!busy) break;
            for (const [id,s] of Object.entries(m.robots)) {states.set(id,s);currentPoses.set(id,[s.x,s.y,s.heading*180/Math.PI]);}
            m.props?.forEach((position,i)=>{if(props[i])propPoses.set(props[i],position);});
            taskState=m.task??null;acceptTennisState(taskState);renderTaskResult();
            elapsed=m.time;renderTimer();draw();
            if(taskState&&['success','failed'].includes(taskState.status))showTab('task');
            if (!error) $('status').textContent=states.get(active.id)?.blocked?'Упор в препятствие':'Модель запущена';
            break;
        case 'variables': variables.set(m.robot,m.values);if (m.robot===active.id)showVariables();break;
        case 'log': {
            const o=output(m.robot);o.log=(o.log+m.text).slice(-18000);
            if (m.robot===active.id)showOutput();break;
        }
        case 'display': output(m.robot).display.set(m.row,m.text);if (m.robot===active.id)showOutput();break;
        case 'error': {
            error=true;
            if(m.robot&&m.robot!==active.id) switchRobot(robots.find(r=>r.id===m.robot),true);
            const o=output();o.log=(o.log+m.text+'\n').slice(-18000);
            showOutput();showTab('output');$('status').textContent='Ошибка — смотри вывод';break;
        }
        case 'stopped':
            if(taskState?.status==='running'){taskState.status='incomplete';taskState.reason='Остановлено пользователем';renderTaskResult();}
            if(pendingTraining===null)lock(false);$('status').textContent='Остановлено';break;
        case 'finished':
            lock(false);
            if(pendingTraining!==null){const value=pendingTraining;pendingTraining=null;setTraining(value);break;}
            if (!error) $('status').textContent=taskState?$('taskResult').textContent:'Завершено';break;
        case 'polygon':
        case 'scene':
            if (!busy) try {if(m.kind==='polygon')loadPolygon(m.scene);else await load(m.scene);}
            catch(err){$('status').textContent=err.message;} break;
    }
});



function drawLineArtwork(image){
    const source=[74,229,549,769,959,1150,1370,1690,1846],positions=[-6.5,...LINE_OFFSETS,6.5];
    for(let i=0;i<source.length-1;i++)ctx.drawImage(image,source[i],550,source[i+1]-source[i],149,positions[i],-.5,positions[i+1]-positions[i]+.002,1);
}
function syncFieldLock(){
    $('lockField').setAttribute('aria-pressed',String(fieldLocked));$('lockField').textContent=fieldLocked?'🔒':'🔓';
    $('lockField').title=fieldLocked?'Разблокировать рисунок поля':'Заблокировать рисунок поля';
    for(const el of document.querySelectorAll('[data-tool]'))el.disabled=busy||(fieldLocked&&el.dataset.tool!=='pan');
    for(const id of ['chooseImage','apply','preset','paint','width','radius','regionName','regionColor'])$(id).disabled=busy||fieldLocked;
    historyButtons();
}
$('lockField').onclick=()=>{
    if(drag){if(drag.moved)revertDrag(drag);drag=undefined;}pan=undefined;
    fieldLocked=!fieldLocked;selectTool('pan');syncFieldLock();refreshTaskEditor();$('status').textContent=fieldLocked?'Рисунок поля заблокирован. Роботов и предметы можно перемещать.':'Поле разблокировано';
};

function deviceConfig(robot=active,p){
    robot.deviceSettings??={};return robot.deviceSettings[p]??={};
}
function refreshDeviceSettings(){
    const list=$('deviceSettingsPort'),old=list.value;list.replaceChildren();
    const ports=Object.entries(sensors()).filter(([,s])=>['line','eye'].includes(s[0]));
    $('sensorSettings').hidden=!ports.length;
    for(const [p,s]of ports)element('option','S'+p+' · '+kinds[s[0]],list).value=p;
    list.value=ports.some(([p])=>p===old)?old:ports[0]?.[0]??'';
    renderDeviceSettings();
}
function renderDeviceSettings(){
    const root=$('deviceSettingsFields');root.replaceChildren();const p=$('deviceSettingsPort').value;
    if(!p)return;const kind=active.sensors[p][0],cfg=deviceConfig(active,p);
    const update=fn=>{const robot=active,before=structuredClone(robot.deviceSettings);fn();const after=structuredClone(robot.deviceSettings);record(()=>{robot.deviceSettings=structuredClone(before);},()=>{robot.deviceSettings=structuredClone(after);});reset();renderDeviceSettings();};
    const note=element('p',kind==='line'?'Цвета 1–7 слева направо. Высота задаёт размер семи пятен.':'Светодиоды 1–8: от верхнего по часовой стрелке.',root);note.className='small';
    const colors=kind==='line'?(cfg.lineColors??[7,7,7,7,7,7,7]):(cfg.eyeColors??Array(8).fill(0));
    const grid=element('div','',root);grid.className='device-colors';
    colors.forEach((c,i)=>{const label=element('label',String(i+1)+' ',grid);
        if(kind==='line'){
            const select=element('select','',label);select.setAttribute('aria-label','Цвет элемента '+(i+1)+' на S'+p);
            lampNames.forEach((name,index)=>element('option',name,select).value=String(index));select.value=String(c);select.disabled=busy;
            select.onchange=()=>update(()=>{cfg.lineColors=[...colors];cfg.lineColors[i]=+select.value;});
        }else{
            const input=element('input','',label);input.type='color';input.value='#'+Number(c).toString(16).padStart(6,'0');input.disabled=busy;input.setAttribute('aria-label','Цвет светодиода '+(i+1)+' на S'+p);
            input.onchange=()=>update(()=>{cfg.eyeColors=[...colors];cfg.eyeColors[i]=parseInt(input.value.slice(1),16);cfg.eyeMode=0;});
        }
    });
    if(kind==='line'){
        const label=element('label','Порог чёрного, 0–100 ',root),input=numeric(label,cfg.lineThreshold??50,0,100);input.disabled=busy;
        input.onchange=()=>{if(input.validity.valid&&input.value)update(()=>{cfg.lineThreshold=+input.value;});};
    }else{
        const label=element('label','Режим ',root),select=element('select','',label);select.disabled=busy;
        ['Ручные цвета','Постоянный свет','Мигание','Пульс','По часовой стрелке','Против часовой стрелки','Два огня','Чётные / нечётные','Заполнение','Искры'].forEach((text,i)=>element('option',text,select).value=String(i));select.value=String(cfg.eyeMode??0);
        select.onchange=()=>update(()=>{cfg.eyeMode=+select.value;});
        const l=element('label','Цвет эффекта ',root),color=element('input','',l);color.type='color';color.value='#'+(cfg.eyeColor??0xff0000).toString(16).padStart(6,'0');color.disabled=busy;color.onchange=()=>update(()=>{cfg.eyeColor=parseInt(color.value.slice(1),16);});
    }
}
$('deviceSettingsPort').onchange=renderDeviceSettings;
function eyeBrightness(mode,index,time){
    const phase=Math.floor(time*6)%8;
    switch(mode){
        case 1:return 1;
        case 2:return Math.floor(time*3)%2?0:1;
        case 3:return .15+.85*(.5-.5*Math.cos(time*Math.PI*2));
        case 4:return index===phase?1:.03;
        case 5:return index===(8-phase)%8?1:.03;
        case 6:return index===phase||index===(phase+4)%8?1:.03;
        case 7:return index%2===Math.floor(time*3)%2?1:.03;
        case 8:return index<=Math.floor(time*4)%9?1:.03;
        case 9:{const tick=Math.floor(time*3),f=time*3-tick,raw=Math.sin((tick+1)*12.9898+(index+1)*78.233)*43758.5453;return raw-Math.floor(raw)>.72?Math.sin(f*Math.PI)**2:.03;}
        default:return 1;
    }
}
function drawDeviceEffects(robot,p,kind,f,r,a,height,state){
    if(!['line','eye','touch'].includes(kind))return;
    const cfg=robot.deviceSettings?.[p]??{},d=state?.devices;
    if(kind==='touch'){
        if(state?.sensors?.[p]){ctx.save();ctx.translate(f,r);ctx.rotate(a);ctx.fillStyle='#ff413baa';ctx.fillRect(1.3,-.7,.5,1.4);ctx.restore();}return;
    }
    if(kind==='line'){
        const colors=d?.lineColors?.[p]??cfg.lineColors??Array(7).fill(7),radius=.18*height;
        for(let i=0;i<7;i++){
            const x=f-Math.sin(a)*LINE_OFFSETS[i],y=r+Math.cos(a)*LINE_OFFSETS[i],color=lampColors[colors[i]];
            if(color){ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=color+'99';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=.5/scale;ctx.stroke();}
            ctx.fillStyle='#333';ctx.font=''+(9/scale)+'px sans-serif';ctx.fillText(i+1,x+Math.cos(a)*(.7+9/scale),y+Math.sin(a)*(.7+9/scale));
        }
    }else{
        const mode=d?.eyeModes?.[p]??cfg.eyeMode??0,base=d?.eyeColor?.[p]??cfg.eyeColor??0xff0000,colors=d?.eyeColors?.[p]??cfg.eyeColors??Array(8).fill(0),time=state?.time??0;
        ctx.save();ctx.translate(f,r);ctx.rotate(a);
        for(let i=0;i<8;i++){
            const color=mode?base:colors[i];if(!color)continue;
            const brightness=eyeBrightness(mode,i,time),angle=-Math.PI/2+i*Math.PI/4;
            // The white ring is inside the dark rim, not at the case's outer radius.
            // Centre is measured in the original image and mapped through its crop.
            const cx=(530-123)*4/817-2,cy=(530-122)*4/818-2;
            const inner=1.01,outer=1.43;
            ctx.beginPath();ctx.arc(cx,cy,outer,angle-.26,angle+.26);
            ctx.arc(cx,cy,inner,angle+.26,angle-.26,true);ctx.closePath();
            ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.globalAlpha=brightness;ctx.fill();
        }ctx.restore();
    }
}
function drawSoundEffect(robot,state){
    if(!state?.devices?.sound?.active)return;
    const phase=(state.time*2)%1;ctx.save();ctx.strokeStyle='#edb83e';ctx.lineWidth=1.7/scale;
    for(let i=0;i<3;i++){ctx.globalAlpha=(1-phase)*.75;ctx.beginPath();ctx.arc(0,0,robot.bodySize*.7+(phase+i)*3,0,Math.PI*2);ctx.stroke();}ctx.restore();
}

function requestInspection(judge=false,advance=.1){
    if(busy)return;
    if(inspectionPending){inspectionQueued={judge,advance};return;}
    try{
        const data=scene('run',judge);
        const id=++inspectionSerial;inspectionPending={id,epoch:inspectionEpoch,judge};
        $('readSensors').disabled=$('previewCheck').disabled=true;$('sensorStatus').textContent='Чтение показаний…';
        vscode.postMessage({kind:'inspect',scene:data,requestId:id,judge:judge&&!training,checkpoint:judge?previewCheckpoint:null,advance,deviceStates:Object.fromEntries(states)});
    }catch(e){$('sensorStatus').textContent=e.message;$('status').textContent=e.message;}
}
$('readSensors').onclick=()=>requestInspection(false);
canvas.addEventListener('pointerup',()=>{inspectionEpoch++;if(manualPreview&&!busy&&!taskPick)requestInspection(true);});
function setTraining(value){
    training=value;manualPreview=false;previewCheckpoint=null;inspectionQueued=null;
    $('training').setAttribute('aria-pressed',String(value));$('modeLabel').hidden=!value;
    reset();refreshTaskEditor();$('status').textContent=value?'Тренировочный режим — без оценки':'Готово к новой попытке';
}
$('training').onclick=()=>{
    const value=!(pendingTraining??training);
    if(busy){pendingTraining=value;vscode.postMessage({kind:'stop'});$('status').textContent='Остановка для смены режима…';}
    else setTraining(value);
};

for (const id of ['deviceTouch','deviceIr','deviceGyro','deviceLine','deviceEye','robotCar','robotE6','robotE6Standard','robotM6','deviceLight','deviceLed','deviceLaser','deviceSonar']) $(id).addEventListener('load',draw);
switchRobot(active,true);selectTool('pan');preset('empty');vscode.postMessage({kind:'ready'});
