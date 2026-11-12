'use strict';
const vscode = require('vscode');
const clawData = require('./media/claws.json');
const kickerData = require('./media/kickers.json');
const bigTravelData = require('./media/big-travel.json');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { Buffer } = require('node:buffer');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

function activate(context) {
    let panel, child, selected, opening, launchId=0, panelReady=false;
    const externalRequests = new Map(), externalPrograms = new Map();
    const select = editor => {
        if (editor?.document.languageId === 'python' && ['file','untitled'].includes(editor.document.uri.scheme)) {
            selected = editor.document;
            panel?.webview.postMessage({ kind:'source', name:path.basename(selected.fileName) });
        }
    };
    function stop() {
        for(const r of externalRequests.values()){clearTimeout(r.timer);r.reject(new Error('Запуск отменён.'));}externalRequests.clear();
        ++launchId;
        if (child) child.stdin.end('stop\n');
        else panel?.webview.postMessage({kind:'stopped'});
    }
    function python(script) {
        const installed = vscode.extensions.getExtension('IofeKirill.rcu-extension');
        const bundled = installed && path.join(installed.extensionPath,'runtime','win32-x64','python.exe');
        const configured = vscode.workspace.getConfiguration('zmrobo2d').get('pythonPath');
        const executable = configured || (process.platform === 'win32' && bundled && existsSync(bundled) ? bundled :
            process.platform === 'win32' ? 'py' : 'python3');
        const args = [...(executable === 'py' ? ['-3'] : []), '-I','-u',path.join(__dirname, script)];
        return [executable,args];
    }
    function convert(data, mode) {
        return new Promise((resolve,reject) => {
            const [exe,args] = python('scene_xml.py');
            const proc = spawn(exe,[...args,mode],{windowsHide:true,shell:false,stdio:'pipe'});
            const output=[];let size=0, errors='';
            proc.stdout.on('data',chunk=>{
                size+=chunk.length;
                if(size>5_000_000) {proc.kill();reject(new Error('Слишком большой файл поля.'));}
                else output.push(chunk);
            });
            proc.stderr.setEncoding('utf8').on('data',chunk=>{errors=(errors+chunk).slice(-2000);});
            proc.on('error',err=>reject(new Error('Не удалось запустить Python для XML: '+err.message)));
            proc.stdin.on('error',()=>{});
            proc.on('close',code=>code?reject(new Error(errors||'Не удалось обработать XML.')):resolve(Buffer.concat(output)));
            proc.stdin.end(data);
        });
    }
    async function launch(scene,rate,current,training=false,override) {
        if (!vscode.workspace.isTrusted) throw new Error('Для запуска Python открой доверенную папку.');
        if (child) throw new Error('Дождись остановки предыдущего запуска.');
        const generation=++launchId;
        const programs={};
        const folder=vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || context.extensionPath;
        try {
            if(override && !scene.robots.some(r=>r.id===override.robot))throw new Error('Выбранный робот отсутствует на поле.');
            for (const robot of scene.robots) {
                if(override && robot.id===override.robot){
                    programs[robot.id]={filename:override.program.filename,source:override.program.source};
                    continue;
                }
                const assigned=externalPrograms.get(robot.id);
                if(assigned && !robot.program){programs[robot.id]={filename:assigned.filename,source:assigned.source};continue;}
                let doc;
                if (robot.program) {
                    const extension=path.extname(robot.program).toLowerCase();
                    if(!path.isAbsolute(robot.program)||!['.py','.zmblocks'].includes(extension))throw new Error(robot.name+': выбери локальный файл .py или .zmblocks.');
                    if(extension==='.zmblocks'){
                        const snapshot=await vscode.commands.executeCommand('zmroboBlocks.compileFile',vscode.Uri.file(robot.program));
                        if(!snapshot||typeof snapshot.source!=='string'||Buffer.byteLength(snapshot.source)>400_000)throw new Error(robot.name+': не удалось получить программу из блоков (Python до 400 КБ).');
                        if(snapshot.controller!==robot.model)throw new Error(robot.name+': в проекте выбран '+snapshot.controller+', а у робота '+robot.model+'.');
                        if(snapshot.unsupported?.length)throw new Error(robot.name+': в симуляторе недоступны '+snapshot.unsupported.join(', ')+'.');
                        programs[robot.id]={filename:snapshot.filename,source:snapshot.source};
                        continue;
                    }
                    try {
                        const uri=vscode.Uri.file(robot.program);
                        if ((await vscode.workspace.fs.stat(uri)).size>400_000) throw new Error();
                        doc=await vscode.workspace.openTextDocument(uri);
                    } catch {
                        throw new Error(robot.name+': не удалось открыть '+path.basename(robot.program)+' (файл до 400 КБ).');
                    }
                } else if (scene.robots.length===1 && selected && !selected.isClosed) doc=selected;
                if (!doc) throw new Error(robot.name+': назначь файл .py или .zmblocks во вкладке «Робот».');
                const filename=doc.isUntitled?path.join(folder,'program.py'):doc.uri.fsPath;
                programs[robot.id]={filename,source:doc.getText()};
            }
        } catch (error) {
            if (generation===launchId) throw error;
            return;
        }
        if (generation!==launchId || panel!==current) return;
        current.reveal?.(undefined,false);
        const [executable,args]=python('multi_runner.py');
        const request=JSON.stringify({scene,rate,programs,interactive:true,training:training===true});
        if (Buffer.byteLength(request)>12_000_000) throw new Error('Поле или программы слишком большие.');
        const proc=spawn(executable,args,{cwd:folder,windowsHide:true,shell:false,stdio:'pipe'});
        child=proc;
        let stopped=false,stderr='';
        const post=message=>{if(child===proc&&panel===current) current.webview.postMessage(message);};
        post({kind:'started'});
        createInterface({input:proc.stdout}).on('line',line=>{
            if (line.length>500_000) return;
            try {
                const message=JSON.parse(line);
                if (message.kind==='stopped') stopped=true;
                else post(message);
            } catch { /* Ignore non-protocol output. */ }
        });
        proc.stderr.setEncoding('utf8').on('data',chunk=>{stderr=(stderr+chunk).slice(-4000);});
        proc.on('error',error=>post({kind:'error',text:'Не удалось запустить Python. Проверь путь в ZMROBO 2D: Python Path.\n'+error.message}));
        proc.stdin.on('error',()=>{});
        proc.on('close',code=>{
            if (stderr) post({kind:'error',text:stderr});
            else if (![0,1,null].includes(code)) post({kind:'error',text:'Python завершился с кодом '+code+'.'});
            // Clear the child before allowing a new Run.
            if(child===proc) child=undefined;
            if(panel===current) current.webview.postMessage({kind:stopped?'stopped':'finished'});
        });
        proc.stdin.write(request+'\n');
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(select),
        vscode.commands.registerCommand('zmrobo2d.stopSource',stop),
        vscode.commands.registerCommand('zmrobo2d.setSource',async program=>{
            if(!vscode.workspace.isTrusted)throw new Error('Открой доверенную папку.');
            if(!program||typeof program.source!=='string'||Buffer.byteLength(program.source)>400_000||typeof program.filename!=='string'||!path.isAbsolute(program.filename)||path.extname(program.filename).toLowerCase()!=='.py')throw new Error('Некорректная Python-программа.');
            if(child||externalRequests.size)throw new Error('Сначала останови текущий запуск.');
            await vscode.commands.executeCommand('zmrobo2d.open');
            if(!panel)throw new Error('Не удалось открыть модель.');
            return new Promise((resolve,reject)=>{
                const id=randomBytes(12).toString('hex');
                const timer=setTimeout(()=>{externalRequests.delete(id);reject(new Error('Модель не ответила. Повтори запуск.'));},15000);
                externalRequests.set(id,{program,resolve,reject,timer,kind:'externalProgram'});
                if(panelReady)panel.webview.postMessage({kind:'externalProgram',requestId:id,name:program.name});
            });
        }),
        vscode.commands.registerCommand('zmrobo2d.runSource',async program=>{
            if(!vscode.workspace.isTrusted)throw new Error('Открой доверенную папку.');
            if(!program||typeof program.source!=='string'||Buffer.byteLength(program.source)>400_000||typeof program.filename!=='string'||!path.isAbsolute(program.filename)||path.extname(program.filename).toLowerCase()!=='.py')throw new Error('Некорректная Python-программа.');
            if(child||externalRequests.size)throw new Error('Сначала останови текущий запуск.');
            await vscode.commands.executeCommand('zmrobo2d.open');
            if(!panel)throw new Error('Не удалось открыть модель.');
            return new Promise((resolve,reject)=>{
                const id=randomBytes(12).toString('hex');
                const timer=setTimeout(()=>{externalRequests.delete(id);reject(new Error('Модель не ответила. Повтори запуск.'));},15000);
                externalRequests.set(id,{program,resolve,reject,timer,kind:'externalRun'});
                if(panelReady)panel.webview.postMessage({kind:'externalRun',requestId:id,name:program.name});
            });
        }),
        vscode.commands.registerCommand('zmrobo2d.open' , async () => {
            select(vscode.window.activeTextEditor);
            if (panel) { panel.reveal(panel.viewColumn,false); return; }
            if (opening) return;
            opening=true;
            const media = vscode.Uri.file(path.join(__dirname,'media'));
            let html;
            try { html=Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(media,'index.html'))).toString('utf8'); }
            finally { opening=false; }
            panel = vscode.window.createWebviewPanel('zmrobo2d','ZMROBO: 2D', {viewColumn:vscode.ViewColumn.Active,preserveFocus:false},
                {enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[media]});
            const current = panel;
            const nonce = randomBytes(18).toString('base64');
            panel.webview.onDidReceiveMessage(async msg => {
                try {
                    if (msg.kind === 'ready') {
                        panelReady=true;
                        for(const [id,r]of externalRequests)current.webview.postMessage({kind:r.kind,requestId:id,name:r.program.name});
                        if (selected) current.webview.postMessage({kind:'source',name:path.basename(selected.fileName)});
                     } else if (msg.kind === 'bindExternalProgram') {
                        const r=externalRequests.get(msg.requestId);
                        if(!r || r.kind!=='externalProgram')throw new Error('Запрос передачи программы устарел.');
                        if(typeof msg.robot!=='string'||!msg.robot)throw new Error('Не выбран робот на поле.');
                        externalPrograms.set(msg.robot,r.program);
                        clearTimeout(r.timer);externalRequests.delete(msg.requestId);r.resolve();
                     } else if (msg.kind === 'run') {
                        if(msg.externalRequestId){
                            const r=externalRequests.get(msg.externalRequestId);
                            if(!r)throw new Error('Запрос запуска устарел. Повтори запуск из блоков.');
                            try {await launch(msg.scene,msg.rate,current,msg.training,{robot:msg.robot,program:r.program});externalPrograms.set(msg.robot,r.program);r.resolve();}
                            catch(error){r.reject(error);throw error;}
                            finally{clearTimeout(r.timer);externalRequests.delete(msg.externalRequestId);}
                        }else await launch(msg.scene,msg.rate,current,msg.training);
                    } else if(msg.kind==='externalRunError'){
                        const r=externalRequests.get(msg.requestId);if(r){clearTimeout(r.timer);r.reject(new Error(msg.text));externalRequests.delete(msg.requestId);}
                    }
                    else if (msg.kind === 'inspect') {
                        if(child) throw new Error('Сначала останови программу.');
                        const request=JSON.stringify({scene:msg.scene,requestId:msg.requestId,judge:msg.judge===true,checkpoint:msg.checkpoint,advance:msg.advance,deviceStates:msg.deviceStates});
                        if(Buffer.byteLength(request)>12_100_000) throw new Error('Запрос слишком большой.');
                        const [exe,args]=python('inspect_scene.py');
                        await new Promise((resolve,reject)=>{
                            const proc=spawn(exe,args,{windowsHide:true,shell:false,stdio:'pipe'});
                            let output='',errors='';
                            const timer=setTimeout(()=>{proc.kill();reject(new Error('Чтение показаний заняло слишком много времени.'));},15000);
                            proc.stdout.on('data',b=>{output+=b;if(output.length>2_000_000)proc.kill();});
                            proc.stderr.on('data',b=>{errors=(errors+b).slice(-2000);});
                            proc.stdin.on('error',()=>{});
                            proc.on('error',e=>{clearTimeout(timer);reject(e);});
                            proc.on('close',code=>{
                                clearTimeout(timer);
                                try{const data=JSON.parse(output);data.requestId=msg.requestId;current.webview.postMessage(data);resolve();}
                                catch{reject(new Error(errors||'Не удалось прочитать показания.'));}
                            });proc.stdin.end(request);
                        }).catch(e=>current.webview.postMessage({kind:'inspectionError',requestId:msg.requestId,text:e.message}));
                    }
                    else if (msg.kind === 'stop') stop();
                    else if (msg.kind === 'chooseProgram') {
                        const [uri]=await vscode.window.showOpenDialog({filters:{'Программы ZMROBO':['py','zmblocks'],Python:['py'],'ZMROBO Блоки':['zmblocks']},openLabel:'Назначить роботу',canSelectMany:false})||[];
                        if(uri?.scheme==='file'){externalPrograms.delete(msg.robot);current.webview.postMessage({kind:'program',robot:msg.robot,path:uri.fsPath});}
                    } else if (msg.kind === 'save') {
                        const uri=await vscode.window.showSaveDialog({filters:{'Полигон XML':['xml']},saveLabel:'Сохранить полигон XML'});
                        if (uri?.scheme==='file') {
                            const dir=path.dirname(uri.fsPath);
                            for (const r of msg.scene.robots) if(r.program) {
                                const relative=path.relative(dir,r.program);
                                if(path.isAbsolute(relative)) throw new Error(r.name+': сохрани XML на том же диске, что и программу.');
                                r.program=relative.split(path.sep).join('/');
                            }
                            const data=await convert(Buffer.from(JSON.stringify(msg.scene)),'save');
                            await vscode.workspace.fs.writeFile(uri,data);
                            current.webview.postMessage({kind:'saved'});
                        }
                    } else if (msg.kind === 'load') {
                        const [uri]=await vscode.window.showOpenDialog({filters:{'Полигон XML':['xml']},canSelectMany:false})||[];
                        if(uri?.scheme==='file') {
                            if((await vscode.workspace.fs.stat(uri)).size>4_000_000) throw new Error('XML должен быть не больше 4 МБ.');
                            const result=JSON.parse((await convert(await vscode.workspace.fs.readFile(uri),'load')).toString('utf8'));
                            externalPrograms.clear();
                            if (result.scene) {
                                for(const r of result.scene.robots) if(r.program) r.program=path.resolve(path.dirname(uri.fsPath),r.program);
                                current.webview.postMessage({kind:'scene',scene:result.scene});
                            } else current.webview.postMessage({kind:'polygon',scene:result.polygon});
                        }
                    }
                } catch (error) {
                    if(msg.kind==='inspect'){current.webview.postMessage({kind:'inspectionError',requestId:msg.requestId,text:error.message});return;}
                    current.webview.postMessage({kind:'error',text:error.message});
                    if (!child) current.webview.postMessage({kind:'finished'});
                }
            });
            panel.onDidDispose(() => { panelReady=false;externalPrograms.clear();panel = undefined; stop();for(const r of externalRequests.values()){clearTimeout(r.timer);r.reject(new Error('Модель закрыта.'));}externalRequests.clear(); });
            panel.webview.html = html.replaceAll('{{nonce}}',nonce).replaceAll('{{source}}',panel.webview.cspSource)
                .replace('{{js}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'view.js')).toString())
                .replace('{{clawData}}',JSON.stringify(clawData))
                .replace('{{kickerData}}',JSON.stringify(kickerData))
                .replace('{{kickerMedium}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'kicker-medium.png')).toString())
                .replace('{{kickerLong}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'kicker-long.png')).toString())
                .replace('{{kickerExtraLong}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'kicker-extra-long.png')).toString())
                .replace('{{bigTravelData}}',JSON.stringify(bigTravelData).replaceAll('<','\\u003c'))
                .replace('{{builderJs}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'task-builder.js')).toString())
                .replace('{{tennisJs}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'tennis.js')).toString())
                .replace('{{taskJs}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'task-editor.js')).toString())
                .replace('{{beamStraight}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'beam-straight.png')).toString())
                .replace('{{beamAngle}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'beam-angle.png')).toString())
                .replace('{{clawStraight}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'claw-straight.png')).toString())
                .replace('{{clawSmall}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'claw-small.png')).toString())
                .replace('{{clawLarge}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'claw-large.png')).toString())
                .replace('{{clawNarrow}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'claw-narrow.png')).toString())
                .replace('{{deviceTouch}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-touch.png')).toString())
                .replace('{{deviceIr}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-ir.png')).toString())
                .replace('{{deviceGyro}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-gyro.png')).toString())
                .replace('{{deviceLine}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-line.png')).toString())
                .replace('{{deviceEye}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-eye.png')).toString())
                .replace('{{deviceLight}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-light.png')).toString())
                .replace('{{deviceLed}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-led.png')).toString())
                .replace('{{robotM6}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'robot-m6.png')).toString())
                .replace('{{deviceLaser}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-laser.png')).toString())
                .replace('{{deviceSonar}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'device-sonar.png')).toString())
                .replace('{{robotE6Standard}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'robot-e6-standard.png')).toString())
                .replace('{{robotCar}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'robot-car.png')).toString())
                .replace('{{robotE6}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'robot-e6.png')).toString())
                .replaceAll('{{css}}',panel.webview.asWebviewUri(vscode.Uri.joinPath(media,'view.css')).toString());
        }),{dispose:stop});
}
exports.activate = activate;
