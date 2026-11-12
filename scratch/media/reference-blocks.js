/* RoboCode palette: original renderer, reference labels, our Python intermediate tree. */
(function (root, factory) { if (typeof module === 'object' && module.exports)
    module.exports = factory();
else
    root.RoboBlocks = factory(); })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
    let restoring = false, activeController = 'E6', B, reference, catalog, defs, controllerLabel = 'E6RCU';
    const icons = { wheel: '<circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>', controller: '<rect x="5" y="2" width="14" height="20" rx="2" fill="none" stroke="white" stroke-width="2"/><path d="M9 18h6" stroke="white" stroke-width="2"/>', eye: '<path d="M2 12q10-13 20 0Q12 25 2 12" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3"/>', play: '<path d="M6 3v18l15-9z"/>', sensor: '<rect x="2" y="3" width="8" height="18" rx="2"/><path d="M14 7q6 5 0 10m4-14q10 9 0 18" fill="none" stroke="white" stroke-width="2"/>', wifi: '<path d="M2 8q10-10 20 0M6 12q6-6 12 0M9 16q3-3 6 0" stroke="white" stroke-width="3" fill="none"/><circle cx="12" cy="20" r="2"/>', line: '<path d="M1 6h22v10H1z"/><path d="M5 4v16m7-16v16m7-16v16" stroke="white" stroke-width="2"/>', radio: '<path d="M2 8q10-10 20 0M6 12q6-6 12 0" stroke="white" stroke-width="2" fill="none"/><text x="3" y="22" font-size="8">2.4G</text>', bolt: '<path d="M13 1L4 13h7l-1 10 10-15h-7z"/>', ai: '<path d="M6 3h12v18H6z" fill="none" stroke="white" stroke-width="2"/><text x="7" y="15" font-size="9">AI</text>', gear: '<circle cx="12" cy="12" r="8" fill="none" stroke="white" stroke-width="4"/><circle cx="12" cy="12" r="3"/>', control: '<path d="M4 3h16v5H9v8h11v5H4z"/>', operators: '<path d="M3 10h18v4H3zM10 3h4v18h-4z"/>', data: '<circle cx="12" cy="12" r="9"/>', blocks: '<path d="M3 4h18v16H3z"/>' };
    function icon(name) { return 'data:image/svg+xml;base64,' + (typeof btoa === 'function' ? btoa : s => Buffer.from(s).toString('base64'))('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">' + (icons[name] || icons.sensor) + '</svg>'); }
    function isSensorPort(a) { return a.kind==='dropdown' && a.options.length && a.options.every(([label,v])=>/^P[1-8]$/.test(label)&&Number.isInteger(v)); }
    function isMotorPort(a) { return a.kind==='dropdown' && a.options.length && a.options.every(([label,v])=>/^M[1-4]$/.test(label)&&Number.isInteger(v)); }
    function isPort(a) { return isSensorPort(a)||isMotorPort(a); }
    function shadow(a) { if(isPort(a)) return '<value name="'+a.name+'"><shadow type="'+(isMotorPort(a)?'rc_motor_port':'rc_sensor_port')+'"><field name="PORT">'+a.value+'</field></shadow></value>'; if (a.kind === 'dropdown' || a.kind === 'colour')
        return ''; return '<value name="' + a.name + '"><shadow type="' + (a.kind === 'text' ? 'text' : 'math_number') + '"><field name="' + (a.kind === 'text' ? 'TEXT' : 'NUM') + '">' + esc(a.value) + '</field></shadow></value>'; }
    function blockXml(d) { return '<block type="' + d.id + '" gap="16">' + d.args.map(shadow).join('') + '</block>'; }
    function register(blockly, ref, cat) {
        B = blockly;
        reference = ref;
        catalog = cat;
        defs = new Map(ref.blocks.filter(d => !d.separator).map(d => [d.id, d]));
        B.Colours.workspace = '#f5f6ff';
        B.Colours.flyout = '#ffffff';
        B.Colours.toolbox = '#ffffff';
        B.Colours.scrollbar = '#c6c4d2';
        for (const d of defs.values()) {
            const group = ref.groups.find(g => g.id === d.group), args = [{ type: 'field_image', src: icon(group.icon), width: 24, height: 24, alt: '' }];
            let message = '%1 ' + d.text.replace(/\{(\w+)\}/g, (_, name) => { const a = d.args.find(a => a.name === name); if (!a)
                throw Error('Unknown reference field ' + name); let field; if(isPort(a)) field={type:'input_value',name:a.name,check:['Number','String']}; else if (a.kind === 'dropdown')
                field = { type: 'field_dropdown', name: a.name, options: portOptions(a).map(([label, v]) => [label, JSON.stringify(v)]) };
            else if (a.kind === 'colour')
                field = { type: 'field_colour_slider', name: a.name, colour: a.value };
            else
                field = { type: 'input_value', name: a.name }; args.push(field); return '%' + args.length; });
            if (d.id === 'rc_start') {
                message = '%1 %2 %3';
                args.splice(1, args.length - 1, { type: 'field_label_serializable', name: 'DEVICE', text: controllerLabel }, { type: 'field_dropdown', name: 'TASK', options: d.args[0].options.map(([label, v]) => [label, JSON.stringify(v)]) });
            }
            B.defineBlocksWithJsonArray([{ type: d.id, message0: message, args0: args, colour: group.color, colourSecondary: group.color, colourTertiary: darken(group.color), tooltip: d.requiresOriginalCode || d.text.replace(/\{\w+\}/g, '…'), extensions: [d.output === 'hat' ? 'shape_hat' : d.output === 'boolean' ? 'output_boolean' : d.output ? 'output_number' : 'shape_statement'] }]);
            const init = B.Blocks[d.id].init;
            B.Blocks[d.id].init = function () { init.call(this); for (const a of d.args) {
                if (a.kind === 'dropdown' && !isPort(a)) {
                    this.getField(a.name).menuGenerator_ = (restoring ? a.options : portOptions(a)).map(([label,v]) => [label,JSON.stringify(v)]);
                    this.setFieldValue(JSON.stringify(portOptions(a).some(o => o[1] === a.value) ? a.value : portOptions(a)[0][1]), a.name);
                }
            } if (d.id === 'rc_start') {
                this.setFieldValue('1', 'TASK');
                this.setFieldValue(controllerLabel, 'DEVICE');
            } };
        }
        B.defineBlocksWithJsonArray([
            { type: 'control_RunPython', message0: 'выполнить код Python %1', args0: [{ type: 'field_input', name: 'SOURCE', text: 'print("hello world")' }], extensions: ['colours_control', 'shape_statement'] },
            { type: 'control_RunPythonMultiline', message0: 'выполнить код Python %1', args0: [{ type: 'field_multilineText', name: 'SOURCE', text: 'print("hello world")' }], extensions: ['colours_control', 'shape_statement'] },
            { type: 'operator_strToNum', message0: 'преобразовать строку %1 в число', args0: [{ type: 'input_value', name: 'STRING' }], extensions: ['colours_operators', 'output_number'] },
            { type: 'operator_numToStr', message0: 'преобразовать число %1 в строку', args0: [{ type: 'input_value', name: 'NUM' }], extensions: ['colours_operators', 'output_string'] },
            { type: 'rc_print', message0: 'вывести %1', args0: [{ type: 'input_value', name: 'VALUE' }], extensions: ['colours_control', 'shape_statement'] },
            { type: 'rc_saved_expression', message0: 'выражение %1', args0: [{ type: 'field_input', name: 'LABEL', text: 'из предыдущего проекта' }], extensions: ['colours_operators', 'output_number'] },
            { type: 'rc_saved_statement', message0: 'команда %1', args0: [{ type: 'field_input', name: 'LABEL', text: 'из предыдущего проекта' }], extensions: ['colours_control', 'shape_statement'] }
        ]);
        const mathInit = B.Blocks.operator_mathop.init;
        B.Blocks.operator_mathop.init = function () {
            mathInit.call(this);
            const f = this.getField('OPERATOR');
            const options = f.getOptions().map(o => o[1] === 'abs' ? ['abs', 'abs'] : o);
            f.menuGenerator_ = [options.find(o=>o[1]==='abs'), ['sgn','sgn'], ...options.filter(o=>!['abs','sgn'].includes(o[1]))];
        };
        B.defineBlocksWithJsonArray([{type:'rc_sensor_port',message0:'%1',args0:[{type:'field_dropdown',name:'PORT',options:Array.from({length:8},(_,i)=>['P'+(i+1),String(i+1)])}],colour:'#0BB5D8',colourSecondary:'#0BB5D8',colourTertiary:'#0894B1',extensions:['output_number']}]);
        B.defineBlocksWithJsonArray([{type:'rc_motor_port',message0:'%1',args0:[{type:'field_dropdown',name:'PORT',options:Array.from({length:4},(_,i)=>['M'+(i+1),String(i+1)])}],colour:'#4C97FF',colourSecondary:'#4C97FF',colourTertiary:'#3B77CA',extensions:['output_number']}]);
        B.defineBlocksWithJsonArray([{type:'rc_arithmetic',message0:'%1 %2 %3',args0:[{type:'input_value',name:'NUM1'},{type:'field_dropdown',name:'OP',options:[['+','+'],['−','-'],['×','*'],[':','/']]},{type:'input_value',name:'NUM2'}],extensions:['colours_operators','output_number']}]);
        const portInit=B.Blocks.rc_sensor_port.init;
        B.Blocks.rc_sensor_port.init=function(){portInit.call(this);this.getField('PORT').menuGenerator_=()=>sensorPortOptions(this);};
        const prototypeInit=B.Blocks.procedures_prototype.init;
        B.Blocks.rc_function_signature=Object.assign({},B.Blocks.procedures_prototype,{init:function(){prototypeInit.call(this);this.setPreviousStatement(false);this.setNextStatement(false);this.setOutput(true,'RcFunctionSignature');this.setOutputShape(B.OUTPUT_SHAPE_ROUND);}});
        B.Blocks.rc_function={
            init:function(){this.jsonInit({message0:'определить %1',args0:[{type:'input_value',name:'custom_block',check:'RcFunctionSignature'}],message1:'%1',args1:[{type:'input_statement',name:'BODY'}],extensions:['colours_more','shape_hat','procedure_def_contextmenu']});this.setNextStatement(false);this.zmReturnsValue=false;this.setInputsInline(true);},
            mutationToDom:function(){const m=B.utils.xml?.createElement?.('mutation')||document.createElement('mutation');m.setAttribute('returns',String(!!this.zmReturnsValue));return m;},
            domToMutation:function(m){this.updateReturn_(m.getAttribute('returns')==='true');},
            updateReturn_:function(enabled){
                this.zmReturnsValue=!!enabled;
                this.data=enabled?'zm:return':null;
            }
        };
        B.Procedures.getDefineBlock=function(code,ws){return ws.getTopBlocks(false).find(b=>['rc_function','procedures_definition'].includes(b.type)&&b.getInputTargetBlock('custom_block')?.getProcCode()===code)||null;};
        const editProcedure=B.Procedures.editProcedureCallback_;
        B.Procedures.editProcedureCallback_=function(block){
            if(block.type==='rc_function')block=block.getInputTargetBlock('custom_block');
            else if(block.type==='rc_procedure_value')block=B.Procedures.getPrototypeBlock(block.getProcCode(),block.workspace.isFlyout?block.workspace.targetWorkspace:block.workspace);
            if(block)editProcedure.call(this,block);
        };
        const allMutations=B.Procedures.allProcedureMutations;
        B.Procedures.allProcedureMutations=function(ws){return [...allMutations(ws),...ws.getAllBlocks().filter(b=>b.type==='rc_function_signature').map(b=>b.mutationToDom(true))];};
        B.defineBlocksWithJsonArray([{type:'rc_return',message0:'вернуть %1',args0:[{type:'input_value',name:'VALUE'}],extensions:['colours_more','shape_end']}]);
        B.Blocks.rc_procedure_value = Object.assign({}, B.Blocks.procedures_call, {
            init: function () {
                B.Blocks.procedures_call.init.call(this);
                this.setPreviousStatement(false); this.setNextStatement(false);
                this.setOutput(true); this.setOutputShape(B.OUTPUT_SHAPE_ROUND);
            }
        });
        // Flyout callers must offer editable literal shadows. The native XML loader
        // restores saved children itself; generating them during that restoration
        // would create a second, detached copy on undo.
        for(const type of ['procedures_call','rc_procedure_value']) {
            const original=B.Blocks[type].domToMutation;
            B.Blocks[type].domToMutation=function(m){
                const copy=m.cloneNode(true);
                if(!this.workspace.isFlyout)copy.setAttribute('generateshadows',String(B.Events.isEnabled()&&B.Events.recordUndo));
                original.call(this,copy);
            };
        }
        // Native mutation propagation knows statement calls only. Include expression calls.
        const callers = B.Procedures.getCallers;
        B.Procedures.getCallers = function(code, ws, definition, includeDefinition) {
            const result = callers.call(this, code, ws, definition, includeDefinition);
            for (const b of ws.getAllBlocks())
                if (b.type === 'rc_procedure_value' && b.getProcCode() === code && (includeDefinition || !definition || b.getRootBlock() !== definition)) result.push(b);
            return result;
        };
        // Xml initializes fields before restoring serialized values. Reuse a declared
        // variable instead of minting i/j/k for each temporary field initialization.
        const initModel = B.FieldVariable.prototype.initModel;
        B.FieldVariable.prototype.initModel = function () {
            if (!this.variable_ && !this.defaultVariableName && this.sourceBlock_) {
                const ws = this.sourceBlock_.workspace;
                const first = ws.getVariablesOfType(this.defaultType_ || '')[0];
                if (first) this.defaultVariableName = first.name;
            }
            return initModel.call(this);
        };
        const getterInit = B.FieldVariableGetter.prototype.init;
        B.FieldVariableGetter.prototype.init = function () {
            if (!this.variable_ && !this.text_ && this.sourceBlock_) {
                const v = this.sourceBlock_.workspace.getVariablesOfType(this.variableType_ || '')[0];
                if (v) this.text_ = v.name;
            }
            return getterInit.call(this);
        };
        // The original renderer expects the surrounding application to supply the menu hook.
        B.Procedures.externalProcedureDefCallback = (mutation, callback) => globalThis.RoboEditor?.editProcedure(mutation, callback);
    }
    function darken(hex) { return '#' + hex.slice(1).match(/../g).map(x => Math.round(parseInt(x, 16) * .78).toString(16).padStart(2, '0')).join(''); }
    function val(type, name, value) { return '<value name="' + name + '"><shadow type="' + type + '"><field name="' + (type === 'text' ? 'TEXT' : 'NUM') + '">' + esc(value) + '</field></shadow></value>'; }
    function block(type, values = '', gap = 16) { return '<block type="' + type + '" gap="' + gap + '">' + values + '</block>'; }
    const builtin = {
        control: () => block('control_wait', val('math_positive_number', 'DURATION', 1), 36) + block('control_repeat', val('math_whole_number', 'TIMES', 10)) + block('control_forever', '', 36) + block('control_if') + block('control_if_else') + block('control_wait_until') + block('control_repeat_until', '', 36) + block('control_RunPython') + block('control_RunPythonMultiline'),
        operators: () => block('rc_arithmetic', val('math_number','NUM1',0)+val('math_number','NUM2',0),8) + block('operator_random', val('math_number', 'FROM', 1) + val('math_number', 'TO', 10), 36) + ['operator_gt', 'operator_lt', 'operator_equals'].map(type => block(type, val('text', 'OPERAND1', '') + val('text', 'OPERAND2', 50))).join('') + ['operator_and', 'operator_or', 'operator_not'].map(type => block(type)).join('') + block('operator_join', val('text', 'STRING1', 'яблоко') + val('text', 'STRING2', 'банан')) + block('operator_letter_of', val('math_whole_number', 'LETTER', 1) + val('text', 'STRING', 'яблоко')) + block('operator_length', val('text', 'STRING', 'яблоко')) + block('operator_contains', val('text', 'STRING1', 'яблоко') + val('text', 'STRING2', 'я')) + block('operator_mod', val('math_number', 'NUM1', '') + val('math_number', 'NUM2', '')) + block('operator_round', val('math_number', 'NUM', '')) + block('operator_mathop', val('math_number', 'NUM', '')) + block('operator_strToNum', val('text', 'STRING', '')) + block('operator_numToStr', val('math_number', 'NUM', ''))
    };
    function toolbox(controller = 'E6') {
        activeController = controller;
        controllerLabel = controller + 'RCU';
        return '<xml>' + reference.groups.filter(g => g.id !== 'cameraE7' || controller === 'E7').map(g => {
            if (g.id === 'variables')
                return '<category name="Переменные" id="variables" colour="' + g.color + '" secondaryColour="' + darken(g.color) + '" custom="RC_VARIABLES"/>';
            if (g.id === 'procedures')
                return '<category name="Мои блоки" id="procedures" colour="' + g.color + '" secondaryColour="' + darken(g.color) + '" custom="RC_PROCEDURES"/>';
            let contents = builtin[g.id] ? builtin[g.id]() : reference.blocks.filter(d => d.group === g.id && (!d.controllers || d.controllers.includes(controller))).map(d => d.separator ? (d.label ? '<label text="' + esc(d.label) + '"/>' : '<sep gap="36"/>') : blockXml(d)).join('');
            return '<category name="' + esc(g.id === 'rcu' ? controller + 'RCU' : g.name) + '" id="' + g.id + '" colour="' + g.color + '" secondaryColour="' + darken(g.color) + '">' + contents + '</category>';
        }).join('') + '</xml>';
    }
    function variableCategory(ws) {
        let text = '<xml><button text="Создать переменную" callbackKey="RC_NEW_VARIABLE"/>';
        for (const v of ws.getAllVariables().filter(v => !v.type)) {
            text += '<block type="data_variable"><field name="VARIABLE" id="' + esc(v.getId()) + '">' + esc(v.name) + '</field></block>';
        }
        const vars = ws.getAllVariables().filter(v => !v.type), lists = ws.getAllVariables().filter(v => v.type === 'list');
        if (vars.length) {
            text += block('data_setvariableto', variableField(vars[0], 'VARIABLE') + val('text', 'VALUE', 0));
            text += block('data_changevariableby', variableField(vars[0], 'VARIABLE') + val('math_number', 'VALUE', 1));
        }
        text += '<button text="Создать список" callbackKey="RC_NEW_LIST"/>';
        for (const v of lists)
            text += '<block type="data_listcontents">' + variableField(v, 'LIST') + '</block>';
        if (lists.length) {
            const f = variableField(lists[0], 'LIST');
            text += block('data_addtolist', f + val('text', 'ITEM', 'элемент')) + block('data_deleteoflist', f + val('math_integer', 'INDEX', 1)) + block('data_deletealloflist', f) + block('data_insertatlist', f + val('text', 'ITEM', 'элемент') + val('math_integer', 'INDEX', 1)) + block('data_replaceitemoflist', f + val('math_integer', 'INDEX', 1) + val('text', 'ITEM', 'элемент')) + block('data_itemoflist', f + val('math_integer', 'INDEX', 1)) + block('data_itemnumoflist', f + val('text', 'ITEM', 'элемент')) + block('data_lengthoflist', f) + block('data_listcontainsitem', f + val('text', 'ITEM', 'элемент'));
        }
        return [...B.Xml.textToDom(text + '</xml>').children];
    }
    function variableField(v, name) { return '<field name="' + name + '" id="' + esc(v.getId()) + '" variabletype="' + esc(v.type || '') + '">' + esc(v.name) + '</field>'; }
    function procedureCategory(ws) { const root = B.Xml.textToDom('<xml><button text="Создать блок" callbackKey="RC_NEW_PROCEDURE"/></xml>'); for (const def of ws.getTopBlocks(false).filter(b => b.type === 'rc_function')) {
        const proto = def.getInputTargetBlock('custom_block');
        if (!proto)
            continue;
        const call = B.Xml.textToDom('<xml><block type="procedures_call"/></xml>').firstChild;
        const mutation = proto.mutationToDom();
        mutation.removeAttribute('argumentnames');
        mutation.removeAttribute('argumentdefaults');
        call.appendChild(mutation);
        mutation.setAttribute('generateshadows','true');
        root.appendChild(call);
        if (returnsValue(def)) {
            const valueCall = call.cloneNode(true); valueCall.setAttribute('type', 'rc_procedure_value'); root.appendChild(valueCall);
        }
    } root.appendChild(B.Xml.textToDom('<xml>'+block('rc_return',val('math_number','VALUE',0))+'</xml>').firstChild);return [...root.children]; }
    function returnsValue(def) { return typeof def?.zmReturnsValue==='boolean'?def.zmReturnsValue:def?.data==='zm:return'||def?.getDescendants().some(b=>b.type==='rc_return'); }
    function setReturns(def,enabled) {const old=B.Xml.domToText(def.mutationToDom());def.updateReturn_(enabled);const now=B.Xml.domToText(def.mutationToDom());if(old!==now)B.Events.fire(new B.Events.BlockChange(def,'mutation',null,old,now));}
    function portOptions(a) {
        if (a.kind !== 'dropdown') return [];
        const max = activeController === 'M6' ? 5 : 8;
        return a.options.filter(([label]) => !/^P[1-8]$/.test(label) || Number(label.slice(1)) <= max);
    }
    function sensorPortOptions(block) {
        const parent=block.getParent(),d=defs.get(parent?.type);
        const a=d?.args.find(a=>isPort(a)&&parent.getInputTargetBlock(a.name)===block);
        let options=(a?.options||Array.from({length:8},(_,i)=>['P'+(i+1),i+1])).filter(([label,v])=>restoring||activeController!=='M6'||v<=5).map(([label,v])=>[label,String(v)]);
        const current=block.getFieldValue('PORT');
        if(!options.some(o=>o[1]===current)&&current)options.push(['Недоступный P'+current,current]);
        return options;
    }
    function upgradeXml(xml) {
        const child=(el,tag,name)=>[...el.children].find(c=>c.tagName.toLowerCase()===tag&&(!name||c.getAttribute('name')===name));
        const el=tag=>xml.ownerDocument.createElement(tag);
        // Read old field-based ports without changing the selected port.
        for(const b of xml.querySelectorAll('block,shadow')) {
            const d=defs.get(b.getAttribute('type'));if(!d)continue;
            for(const a of d.args.filter(isPort)) {
                const f=child(b,'field',a.name);if(!f)continue;
                if(!child(b,'value',a.name)) {
                    const v=el('value'),shadow=el('shadow'),field=el('field');v.setAttribute('name',a.name);shadow.setAttribute('type',isMotorPort(a)?'rc_motor_port':'rc_sensor_port');field.setAttribute('name','PORT');field.textContent=f.textContent;shadow.appendChild(field);v.appendChild(shadow);b.appendChild(v);
                } f.remove();
            }
        }
        for(const def of xml.querySelectorAll('block[type="procedures_definition"],block[type="rc_function"]')) {
            def.setAttribute('type','rc_function');
            const header=child(def,'statement','custom_block');if(header){const value=el('value');value.setAttribute('name','custom_block');while(header.firstChild)value.appendChild(header.firstChild);def.replaceChild(value,header);}
            const signature=child(def,'value','custom_block')?.querySelector('shadow,block');if(signature?.getAttribute('type')==='procedures_prototype')signature.setAttribute('type','rc_function_signature');
            let mutation=child(def,'mutation');
            const legacyReturn=child(def,'data')?.textContent==='zm:return'||!!def.querySelector('block[type="rc_return"]');
            if(!mutation){mutation=el('mutation');mutation.setAttribute('returns',String(legacyReturn));def.insertBefore(mutation,def.firstChild);}
            const next=child(def,'next');
            if(next){let body=child(def,'statement','BODY');if(!body){body=el('statement');body.setAttribute('name','BODY');def.appendChild(body);}while(next.firstChild)body.appendChild(next.firstChild);next.remove();}
            // Convert 4.5.0's fixed return expression into a movable body block.
            const value=child(def,'value','RETURN');
            if(value) {
                value.setAttribute('name','VALUE');
                const ret=el('block');ret.setAttribute('type','rc_return');ret.appendChild(value);
                let body=child(def,'statement','BODY');if(!body){body=el('statement');body.setAttribute('name','BODY');def.appendChild(body);}
                let tail=body.firstElementChild;
                if(!tail)body.appendChild(ret);
                else {while(child(tail,'next')?.firstElementChild)tail=child(tail,'next').firstElementChild;
                    if(tail.getAttribute('type')!=='rc_return'){const next=el('next');next.appendChild(ret);tail.appendChild(next);}}
                mutation.setAttribute('returns','true');
            }
        }
        // Add missing editable fields only to serialized calls that lack a value.
        for(const call of xml.querySelectorAll('block[type="procedures_call"],block[type="rc_procedure_value"]')) {
            const mutation=child(call,'mutation');if(!mutation)continue;
            const ids=JSON.parse(mutation.getAttribute('argumentids')||'[]');
            const types=(mutation.getAttribute('proccode')||'').match(/%[snb]/g)||[];
            ids.forEach((id,i)=>{if(types[i]==='%b'||child(call,'value',id))return;
                const v=el('value'),sh=el('shadow'),f=el('field');v.setAttribute('name',id);sh.setAttribute('type',types[i]==='%n'?'math_number':'text');f.setAttribute('name',types[i]==='%n'?'NUM':'TEXT');f.textContent=types[i]==='%n'?'0':'';sh.appendChild(f);v.appendChild(sh);call.appendChild(v);});
        }
        return xml;
    }
    function loadXml(xml, ws) {restoring=true;try{return B.Xml.domToWorkspace(upgradeXml(xml),ws);}finally{restoring=false;} }

    function updatePorts(ws, controller) {
        activeController = controller;
        for (const b of ws.getAllBlocks()) {
            if(b.type==='rc_sensor_port'){b.getField('PORT').menuGenerator_=()=>sensorPortOptions(b);continue;}
            const d = defs.get(b.type); if (!d) continue;
            for (const a of d.args.filter(a => a.kind === 'dropdown'&&!isPort(a))) {
                const f = b.getField(a.name), current = b.getFieldValue(a.name);
                let opts = portOptions(a).map(([label,v]) => [label,JSON.stringify(v)]);
                if (!opts.some(o => o[1] === current)) opts.push(['Недоступный порт '+current,current]);
                f.menuGenerator_ = opts;
            }
        }
    }
    function refresh(ws) { ws.getToolbox()?.refreshSelection?.(); }
    function bind(ws, callbacks) { ws.registerToolboxCategoryCallback('RC_VARIABLES', variableCategory); ws.registerToolboxCategoryCallback('RC_PROCEDURES', procedureCategory); ws.registerButtonCallback('RC_NEW_VARIABLE', () => callbacks.variable('')); ws.registerButtonCallback('RC_NEW_LIST', () => callbacks.variable('list')); ws.registerButtonCallback('RC_NEW_PROCEDURE', callbacks.procedure); }
    function defaultProject(controller = 'E6') { return { format: 'zmrobo-blocks', version: 1, controller, workspace: { xml: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="rc_start" x="45" y="55"><field name="TASK">1</field></block></xml>' } }; }
    function procedureXml(name, args, x = 400, y = 70) { const ids = args.map((_, i) => 'arg_' + i + '_' + name); const proccode = name + args.map(() => ' %s').join(''); return '<block type="rc_function" x="' + x + '" y="' + y + '"><value name="custom_block"><shadow type="rc_function_signature"><mutation proccode="' + esc(proccode) + '" argumentids="' + esc(JSON.stringify(ids)) + '" argumentnames="' + esc(JSON.stringify(args)) + '" argumentdefaults="' + esc(JSON.stringify(args.map(() => ''))) + '" warp="false"/></shadow></value></block>'; }
    function workspaceToProgram(ws, controller) {
        const variables = ws.getAllVariables(), varMap = new Map(variables.map(v => [v.getId(), v])), top = ws.getTopBlocks(true).filter(b => !b.disabled);
        const usedVariables = new Set();
        const functions = top.filter(b => b.type === 'rc_function');
        function fail(b, text) { const e = Error(text); e.blockId = b?.id; throw e; }
        function node(b, data) { if (['variable','set','change'].includes(data.type)) usedVariables.add(data.id); return { ...data, blockId: b.id }; }
        function input(b, key, ctx, fallback = 0) { const target = b.getInputTargetBlock(key); return target ? expr(target, ctx) : { type: 'literal', value: fallback }; }
        function numeric(n) { return n?.type === 'literal' && typeof n.value === 'string' && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(n.value.trim()) ? { ...n, value: Number(n.value) } : n; }
        function fieldValue(b, a) { if (a.kind === 'colour')
            return { type: 'literal', value: parseInt(b.getFieldValue(a.name).replace('#', ''), 16), hex: true }; return { type: 'literal', value: JSON.parse(b.getFieldValue(a.name)), hex: ['C', 'BG'].includes(a.name) && a.options.some(o => typeof o[1] === 'number' && o[1] > 255), digits: 4 }; }
        function native(b, ctx) {
            const d = defs.get(b.type);
            if (d.controllers && !d.controllers.includes(controller)) fail(b, 'Этот блок доступен только для '+d.controllers.join(', '));
            for (const a of d.args.filter(a => a.kind === 'dropdown'&&!isPort(a))) {
                const label = a.options.find(o => JSON.stringify(o[1]) === b.getFieldValue(a.name))?.[0];
                if (controller === 'M6' && /^P[6-8]$/.test(label || '')) fail(b, 'У M6 доступны порты P1–P5. Выбери другой порт.');
            }
            if (d.requiresOriginalCode)
                fail(b, d.requiresOriginalCode);
            const args = Object.fromEntries(d.args.map(a => [a.name, isPort(a)?numeric(input(b,a.name,ctx,a.value)):a.kind === 'dropdown' || a.kind === 'colour' ? fieldValue(b, a) : input(b, a.name, ctx, a.value)]));
            for(const a of d.args.filter(isPort)) {
                const value=args[a.name];if(value.type!=='literal')continue;
                if(!Number.isInteger(value.value)||value.value<1||value.value>(isMotorPort(a)?4:controller==='M6'?5:8))fail(b,isMotorPort(a)?'Порт мотора должен быть целым числом от 1 до 4.':controller==='M6'?'У M6 доступны порты P1–P5. Выбери другой порт.':'Порт датчика должен быть целым числом от 1 до 8.');
                if(d.group==='cameraE7'&&![7,8].includes(value.value))fail(b,'Камера E7 подключается к P7 или P8.');
            }
            if (d.special) {
                if (d.special === 'encoderPulses')
                    fail(b, 'Настройка импульсов требует сверки с Python RoboCode.');
                return node(b, { type: d.special.startsWith('lightSet') || d.special === 'lineSetThreshold' ? 'thresholdSet' : 'threshold', kind: d.special, port: args.P, channel: args.CH, value: args.V });
            }
            let call = node(b, { type: 'command', id: d.call, args: d.order.map(key => typeof key === 'object' ? { type: 'literal', value: key.constant } : args[key]) });
            if (d.compare) {
                let op = d.compare.op === 'OP' ? args.OP.value : d.compare.op;
                if (op === 'contains')
                    return node(b, { type: 'binary', op: 'in', left: { type: 'builtin', name: 'str', args: [args[d.compare.right]] }, right: { type: 'builtin', name: 'str', args: [call] } });
                return node(b, { type: 'binary', op, left: call, right: args[d.compare.right] });
            }
            return call;
        }
        function expr(b, ctx) {
            if (defs.has(b.type))
                return native(b, ctx);
            const n = data => node(b, data), t = b.type;
            if (t === 'rc_saved_expression')
                return JSON.parse(b.data);
            if (['math_number', 'math_integer', 'math_positive_number', 'math_whole_number', 'math_angle'].includes(t))
                return n({ type: 'literal', value: Number(b.getFieldValue('NUM')) });
            if (t === 'rc_sensor_port'||t==='rc_motor_port')return n({type:'literal',value:Number(b.getFieldValue('PORT'))});
            if (t === 'text')
                return n({ type: 'literal', value: b.getFieldValue('TEXT') });
            if (t === 'colour_picker')
                return n({ type: 'literal', value: parseInt(b.getFieldValue('COLOUR').replace('#', ''), 16) });
            if (t === 'data_variable' || t === 'data_listcontents')
                return n({ type: 'variable', id: b.getFieldValue(t === 'data_variable' ? 'VARIABLE' : 'LIST') });
            if (t.startsWith('argument_reporter_')) {
                const name = b.getFieldValue('VALUE');
                if (!ctx?.has(name))
                    fail(b, 'Аргумент вне своего блока: ' + name);
                return n({ type: 'variable', id: ctx.get(name) });
            }
            if(t==='rc_arithmetic')return n({type:'binary',op:b.getFieldValue('OP'),left:numeric(input(b,'NUM1',ctx)),right:numeric(input(b,'NUM2',ctx))});
            const binary = { operator_add: ['+', 'NUM1', 'NUM2'], operator_subtract: ['-', 'NUM1', 'NUM2'], operator_multiply: ['*', 'NUM1', 'NUM2'], operator_divide: ['/', 'NUM1', 'NUM2'], operator_gt: ['>', 'OPERAND1', 'OPERAND2'], operator_lt: ['<', 'OPERAND1', 'OPERAND2'], operator_equals: ['==', 'OPERAND1', 'OPERAND2'], operator_and: ['and', 'OPERAND1', 'OPERAND2'], operator_or: ['or', 'OPERAND1', 'OPERAND2'], operator_mod: ['%', 'NUM1', 'NUM2'] };
            if (binary[t]) {
                const [op, a, c] = binary[t];
                return n({ type: 'binary', op, left: numeric(input(b, a, ctx)), right: numeric(input(b, c, ctx)) });
            }
            switch (t) {
                case 'rc_procedure_value': {
                    const m = b.mutationToDom(), id = m.getAttribute('proccode');
                    const def = B.Procedures.getDefineBlock(id, ws);
                    if (!returnsValue(def)) fail(b, 'Включи возврат значения в настройках Моего блока.');
                    return n({type:'procedure',id,args:JSON.parse(m.getAttribute('argumentids') || '[]').map(k => numeric(input(b,k,ctx)))});
                }
                case 'operator_not': return n({ type: 'not', value: input(b, 'OPERAND', ctx, false) });
                case 'operator_random': return n({ type: 'random', low: input(b, 'FROM', ctx, 1), high: input(b, 'TO', ctx, 10) });
                case 'operator_join': return n({ type: 'join', items: [input(b, 'STRING1', ctx, ''), input(b, 'STRING2', ctx, '')] });
                case 'operator_length': return n({ type: 'builtin', name: 'len', args: [{ type: 'builtin', name: 'str', args: [input(b, 'STRING', ctx, '')] }] });
                case 'operator_contains': return n({ type: 'binary', op: 'in', left: { type: 'builtin', name: 'str', args: [input(b, 'STRING2', ctx, '')] }, right: { type: 'builtin', name: 'str', args: [input(b, 'STRING1', ctx, '')] } });
                case 'operator_letter_of': return n({ type: 'index', list: { type: 'builtin', name: 'str', args: [input(b, 'STRING', ctx, '')] }, index: input(b, 'LETTER', ctx, 1) });
                case 'operator_round': return n({ type: 'builtin', name: 'round', args: [input(b, 'NUM', ctx)] });
                case 'operator_strToNum': return n({ type: 'builtin', name: 'float', args: [input(b, 'STRING', ctx, '0')] });
                case 'operator_numToStr': return n({ type: 'builtin', name: 'str', args: [input(b, 'NUM', ctx)] });
                case 'operator_mathop': {
                    const op = b.getFieldValue('OPERATOR'), value = input(b, 'NUM', ctx);
                    if (op === 'abs' || op === 'sgn')
                        return n({ type: 'builtin', name: op, args: [value] });
                    if (op === '10 ^')
                        return n({ type: 'binary', op: '**', left: { type: 'literal', value: 10 }, right: value });
                    return n({ type: 'math', name: { ceiling: 'ceil', ln: 'log', log: 'log10', 'e ^': 'exp' }[op] || op, value });
                }
                case 'data_itemoflist': return n({ type: 'listItem', list: { type: 'variable', id: b.getFieldValue('LIST') }, index: input(b, 'INDEX', ctx, 1) });
                case 'data_lengthoflist': return n({ type: 'builtin', name: 'len', args: [{ type: 'variable', id: b.getFieldValue('LIST') }] });
                case 'data_listcontainsitem': return n({ type: 'binary', op: 'in', left: input(b, 'ITEM', ctx, ''), right: { type: 'variable', id: b.getFieldValue('LIST') } });
                case 'data_itemnumoflist': return n({ type: 'listIndex', list: { type: 'variable', id: b.getFieldValue('LIST') }, value: input(b, 'ITEM', ctx, '') });
                case 'data_listindexall':
                case 'data_listindexrandom': {
                    const value = b.getFieldValue('INDEX');
                    return n({ type: 'literal', value: isNaN(Number(value)) ? value : Number(value) });
                }
                default: fail(b, 'Не поддерживается значение блока ' + t);
            }
        }
        function rows(first, ctx) {
            const result = [];
            for (let b = first; b; b = b.getNextBlock()) {
                if (b.disabled)
                    continue;
                const n = data => result.push(node(b, data)), sub = key => rows(b.getInputTargetBlock(key), ctx);
                if (defs.has(b.type)) {
                    n(native(b, ctx));
                    continue;
                }
                switch (b.type) {
                    case 'rc_saved_statement':
                        n(JSON.parse(b.data));
                        break;
                    case 'data_setvariableto':
                    case 'data_changevariableby':
                        n({ type: b.type === 'data_setvariableto' ? 'set' : 'change', id: b.getFieldValue('VARIABLE'), value: numeric(input(b, 'VALUE', ctx)) });
                        break;
                    case 'control_wait':
                        n({ type: 'command', id: 'rcu.SetWaitForTime', args: [input(b, 'DURATION', ctx, 1)] });
                        break;
                    case 'control_repeat':
                        n({ type: 'repeat', count: input(b, 'TIMES', ctx, 10), body: sub('SUBSTACK') });
                        break;
                    case 'control_forever':
                        n({ type: 'forever', body: sub('SUBSTACK') });
                        break;
                    case 'control_if':
                    case 'control_if_else': {
                        const v = { type: 'if', condition: input(b, 'CONDITION', ctx, false), then: sub('SUBSTACK') };
                        if (b.type === 'control_if_else')
                            v.else = sub('SUBSTACK2');
                        n(v);
                        break;
                    }
                    case 'control_repeat_until':
                    case 'control_while':
                        n({ type: b.type === 'control_while' ? 'while' : 'until', condition: input(b, 'CONDITION', ctx, false), body: sub('SUBSTACK') });
                        break;
                    case 'control_wait_until':
                        n({ type: 'waitUntil', condition: input(b, 'CONDITION', ctx, false) });
                        break;
                    case 'control_RunPython':
                    case 'control_RunPythonMultiline':
                        n({ type: 'raw', source: b.getFieldValue('SOURCE') });
                        break;
                    case 'rc_return':
                        if (!ctx) fail(b, 'Вернуть значение можно только внутри Моего блока.');
                        n({type:'returnValue',value:input(b,'VALUE',ctx)}); break;
                    case 'rc_print':
                        n({ type: 'print', value: input(b, 'VALUE', ctx, '') });
                        break;
                    case 'data_addtolist':
                        n({ type: 'append', list: { type: 'variable', id: b.getFieldValue('LIST') }, value: input(b, 'ITEM', ctx, '') });
                        break;
                    case 'data_deleteoflist':
                        n({ type: 'listDelete', list: { type: 'variable', id: b.getFieldValue('LIST') }, index: input(b, 'INDEX', ctx, 1) });
                        break;
                    case 'data_deletealloflist':
                        n({ type: 'listClear', list: { type: 'variable', id: b.getFieldValue('LIST') } });
                        break;
                    case 'data_insertatlist':
                        n({ type: 'listInsert', list: { type: 'variable', id: b.getFieldValue('LIST') }, index: input(b, 'INDEX', ctx, 1), value: input(b, 'ITEM', ctx, '') });
                        break;
                    case 'data_replaceitemoflist':
                        n({ type: 'listReplace', list: { type: 'variable', id: b.getFieldValue('LIST') }, index: input(b, 'INDEX', ctx, 1), value: input(b, 'ITEM', ctx, '') });
                        break;
                    case 'procedures_call': {
                        const m = b.mutationToDom(), id = m.getAttribute('proccode'), ids = JSON.parse(m.getAttribute('argumentids') || '[]');
                        n({ type: 'procedure', id, args: ids.map(k => numeric(input(b, k, ctx))) });
                        break;
                    }
                    default: fail(b, 'Не поддерживается команда ' + b.type);
                }
            }
            return result;
        }
        const starts = top.filter(b => b.type === 'rc_start');
        if (starts.length > 1)
            throw Error('Параллельные задачи требуют отдельного исполнения. Пока используй одну задачу.');
        if (starts[0] && JSON.parse(starts[0].getFieldValue('TASK')) !== 1)
            fail(starts[0], 'Параллельные задачи пока не подключены. Используй задачу 1.');
        const statements = top.filter(b => b.type !== 'rc_start' && b.type !== 'rc_function' && !b.outputConnection);
        const body = [...(starts[0] ? rows(starts[0].getNextBlock()) : []), ...statements.flatMap(b => rows(b))];
        const functionNodes = functions.map(def => { const proto = def.getInputTargetBlock('custom_block'); if (!proto)
                fail(def, 'Не заполнено определение блока.'); const m = proto.mutationToDom(), id = m.getAttribute('proccode'), names = JSON.parse(m.getAttribute('argumentnames') || '[]'), name = id.replace(/\s*%[snb]/g, '').trim(), ctx = new Map(names.map((n, i) => [n, 'arg:' + id + ':' + i])); return { id, name, args: names.map(n => ({ id: ctx.get(n), name: n })), body: rows(def.getInputTargetBlock('BODY'), ctx) }; });
        function collect(n) { if (!n || typeof n !== 'object') return; if (['variable','set','change'].includes(n.type)) usedVariables.add(n.id); for (const v of Object.values(n)) if (typeof v === 'object') Array.isArray(v) ? v.forEach(collect) : collect(v); }
        collect({body,functions:functionNodes});
        return {version:1,controller,entry:'task1',variables:variables.filter(v => usedVariables.has(v.getId())).map(v => ({id:v.getId(),name:v.name,kind:v.type === 'list' ? 'list' : undefined,initial:0})),body,functions:functionNodes};
    }
    return { register, toolbox, bind, refresh, returnsValue, setReturns, updatePorts, loadXml, upgradeXml, defaultProject, workspaceToProgram, procedureXml, blockXml, icon, escape: esc };
});
