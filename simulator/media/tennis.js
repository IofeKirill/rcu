'use strict';
const tennisDescription='Перекати мячи на половину соперника или за его линию аута. Разрешены неподвижные клешни в пределах конструкции 20 × 20 см; моторные захваты и пиналки запрещены. Сет длится до 60 секунд, матч — до двух побед. Назначь программу каждому роботу; старты и шесть мячей расставлены по регламенту.';
let tennisRoundId=0,tennisRecorded=null;
function tennisTask(left,right){tennisRoundId++;tennisRecorded=null;return {kind:'tennis',version:1,nodes:[],aliases:{},tennis:{field:[300,200,200,100],players:[left,right]},match:{sets:[]}};}
function tennisHistory(){return taskSpec?.match?.sets??[];}
function tennisWins(){const wins=[0,0];for(const row of tennisHistory())if(row.winner===0||row.winner===1)wins[row.winner]++;return wins;}
function tennisResetPositions(){
    const [x,y]=taskSpec.tennis.field;
    const radius=ballDiameter/2,pitch=10+ballDiameter;
    const leftY=85-12.5-radius,rightY=15+12.5+radius;
    taskSpec.tennis.players.forEach((id,i)=>{
        const r=robots.find(r=>r.id===id);if(!r)return;
        const rear=(r.model==='M6'?383:r.motorType==='sport'?447:470)*r.bodySize/1080;
        r.start=[i===0?x+rear:x+200-rear,y+(i===0?leftY:rightY),i*180];
    });
    props=[];for(const [side,ys]of [[0,[leftY-2*pitch,leftY-pitch,leftY]],[1,[rightY,rightY+pitch,rightY+2*pitch]]])for(const yy of ys)props.push([x+(side===0?87.5-radius-2.5:112.5+radius+2.5),y+yy,'ball']);
    propIds.clear();props.forEach(propId);propPoses.clear();currentPoses.clear();
    if(active)start=active.start;
}
function acceptTennisState(state){
    if(taskSpec?.kind!=='tennis'||training||manualPreview||!state?.tennis||state.status==='running')return;
    const t=state.tennis;
    if((t.result==='final'||t.result==='forfeit')&&(t.winner===0||t.winner===1)&&tennisRecorded!==tennisRoundId)recordTennisSet(t.winner,false);
}
function recordTennisSet(winner,manual){
    taskSpec.match??={sets:[]};
    if(tennisRecorded===tennisRoundId)taskSpec.match.sets.pop();
    const s=taskState?.tennis;
    taskSpec.match.sets.push({winner,scores:s?.scores?.slice()??[0,0],goals:s?.goalsConceded?.slice()??[0,0],reason:manual?'Решение судьи':taskState?.reason??'',time:taskState?.time??0});
    tennisRecorded=tennisRoundId;
}
function renderTennisControls(){
    const $=id=>document.getElementById(id),isTennis=taskSpec?.kind==='tennis';
    $('tennisControls').hidden=!isTennis;if(!isTennis)return;
    const wins=tennisWins(),ended=wins.some(n=>n>=2),state=taskState?.tennis;
    $('tennisMatchScore').textContent=`Слева ${wins[0]} : ${wins[1]} справа`+(ended?` · Матч выиграл робот ${wins[0]>=2?'слева':'справа'}`:'');
    $('tennisSetScore').textContent=training?'Тренировка: результаты в матч не записываются.':state?`На поле: ${state.fieldBalls.join(' / ')}; пропущено голов: ${state.goalsConceded.join(' / ')}; ауты: ${state.outs.join(' / ')}; штрафы: ${state.penalties.join(' / ')}; нейтральных: ${state.neutral}.`:'Слева / справа. Подготовлено шесть мячей.';
    $('tennisHistory').textContent=tennisHistory().map((r,i)=>`${i+1}. ${r.scores.join(' : ')} — ${r.winner===null?'переигровка':r.winner===0?'победа слева':'победа справа'}${r.reason?' · '+r.reason:''}`).join('\n');
    $('tennisStop').disabled=!busy||training;
    $('tennisNext').disabled=busy||training||ended||tennisRecorded!==tennisRoundId;
    $('tennisReplay').disabled=busy;
    $('tennisNew').disabled=busy;
    $('tennisJudge').disabled=busy||training||manualPreview||!state||taskState.status==='running'||state.result==='invalid';
    $('tennisDecision').disabled=$('tennisJudge').disabled;
    if(ended&&!busy&&!training)$('run').disabled=true;
}
function tennisPrepare(replay=false,newMatch=false){
    if(busy||taskSpec?.kind!=='tennis')return;
    if(newMatch)taskSpec.match={sets:[]};
    else if(replay&&tennisRecorded===tennisRoundId)taskSpec.match.sets.pop();
    else if(!replay&&tennisWins().some(n=>n>=2))return;
    tennisRoundId++;tennisRecorded=null;manualPreview=false;previewCheckpoint=null;
    tennisResetPositions();switchRobot(active,true);reset();lock(false);refreshTaskEditor();
    document.getElementById('status').textContent='Сет подготовлен. Для запуска нажми ▶.';
}
document.getElementById('tennisNext').onclick=()=>tennisPrepare();
document.getElementById('tennisReplay').onclick=()=>tennisPrepare(true);
document.getElementById('tennisNew').onclick=()=>tennisPrepare(false,true);
document.getElementById('tennisStop').onclick=()=>{if(busy)vscode.postMessage({kind:'stop'});};
document.getElementById('tennisJudge').onclick=()=>{
    if(busy||training||!taskState?.tennis||taskState.status==='running')return;
    const value=document.getElementById('tennisDecision').value,t=taskState.tennis;let winner;
    if(value==='score'){
        if(t.unknown?.length){document.getElementById('status').textContent='Есть спорный аут: выбери победителя или переигровку решением судьи.';return;}
        winner=t.scores[0]!==t.scores[1]?(t.scores[0]>t.scores[1]?0:1):t.goalsConceded[0]!==t.goalsConceded[1]?(t.goalsConceded[1]>t.goalsConceded[0]?0:1):null;
    }else winner=value==='draw'?null:Number(value);
    if(tennisRecorded===tennisRoundId){taskSpec.match.sets.pop();tennisRecorded=null;}
    if(winner!==null)recordTennisSet(winner,true);
    t.winner=winner;t.result=winner===null?'draw':'final';
    taskState.reason='Решение судьи: '+(winner===null?'переигровка':winner===0?'победа слева':'победа справа');
    renderTaskResult();
};
