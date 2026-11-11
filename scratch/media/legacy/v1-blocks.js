(function (root, factory) { if (typeof module === 'object' && module.exports)
    module.exports = factory();
else
    root.ZmBlocksV1 = factory(); })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    function blockType(c) { return 'zm_' + c.id.replace(/\./g, '_'); }
    function register(B, catalog) {
        B.defineBlocksWithJsonArray([
            { type: 'zm_start', message0: 'Когда программа запущена', nextStatement: null, colour: 45, tooltip: 'Одна последовательность команд для выбранного робота.' },
            { type: 'zm_forever', message0: 'всегда %1 %2', args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, colour: 32 },
            { type: 'zm_wait_until', message0: 'ждать до %1', args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }], previousStatement: null, nextStatement: null, colour: 32 },
            { type: 'zm_append', message0: 'добавить %1 в список %2', args0: [{ type: 'input_value', name: 'VALUE' }, { type: 'input_value', name: 'LIST' }], previousStatement: null, nextStatement: null, colour: 15 },
            { type: 'zm_get_index', message0: 'элемент %1 списка %2', args0: [{ type: 'input_value', name: 'INDEX', check: 'Number' }, { type: 'input_value', name: 'LIST' }], output: null, colour: 15 },
            { type: 'zm_set_index', message0: 'в списке %1 заменить элемент %2 на %3', args0: [{ type: 'input_value', name: 'LIST' }, { type: 'input_value', name: 'INDEX', check: 'Number' }, { type: 'input_value', name: 'VALUE' }], previousStatement: null, nextStatement: null, colour: 15 },
            { type: 'zm_convert', message0: 'преобразовать %1 в %2', args0: [{ type: 'input_value', name: 'VALUE' }, { type: 'field_dropdown', name: 'KIND', options: [['число', 'float'], ['целое число', 'int'], ['строку', 'str']] }], output: null, colour: 115 },
            { type: 'zm_raw', message0: 'Python %1', args0: [{ type: 'field_multilinetext', name: 'SOURCE', text: 'print("Привет!")' }], previousStatement: null, nextStatement: null, colour: 32 },
        ].filter(d => d.type !== 'zm_raw'));
        // Core Blockly does not ship the multiline-field plugin. A normal text field is
        // deliberately used here; newline text is preserved on load and editable in Python export.
        B.Blocks.zm_raw = { init() { this.appendDummyInput().appendField('Python').appendField(new B.FieldTextInput('print("Привет!")'), 'SOURCE'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(32); this.setTooltip('Произвольный Python. Совместимость с моделью проверяется при выполнении.'); } };
        for (const type of ['procedures_defnoreturn', 'procedures_defreturn']) {
            const init = B.Blocks[type].init;
            B.Blocks[type].init = function () { init.call(this); this.setFieldValue(B.Procedures.findLegalName('MyFunction', this), 'NAME'); };
        }
        for (const c of catalog) {
            const args = c.args.map((a, i) => ({ type: 'input_value', name: 'ARG' + i }));
            let message = c.label;
            args.forEach((a, i) => { message += ' · ' + c.args[i].label + ' %' + (i + 1); });
            const d = { type: blockType(c), message0: message, args0: args, colour: c.name.startsWith('motor.') ? 215 : c.name.startsWith('move.') ? 325 : c.name.startsWith('rcu.') ? 265 : 190, tooltip: c.description + (c.sim ? '\nПоддерживается симулятором.' : '\nСимулятор пока не поддерживает эту команду.') };
            if (c.output)
                d.output = null;
            else {
                d.previousStatement = null;
                d.nextStatement = null;
            }
            B.defineBlocksWithJsonArray([d]);
        }
    }
    function shadow(value) { return typeof value === 'number' ? { shadow: { type: 'math_number', fields: { NUM: value } } } : typeof value === 'boolean' ? { shadow: { type: 'logic_boolean', fields: { BOOL: value ? 'TRUE' : 'FALSE' } } } : { shadow: { type: 'text', fields: { TEXT: String(value) } } }; }
    function toolbox(catalog, set, query = '') {
        const b = type => ({ kind: 'block', type });
        const categories = [
            { kind: 'category', name: 'Начало', colour: 45, contents: [b('zm_start')] },
            { kind: 'category', name: 'Управление', colour: 32, contents: ['controls_repeat_ext', 'zm_forever', 'controls_if', 'controls_whileUntil', 'zm_wait_until', 'controls_for', 'controls_forEach', 'controls_flow_statements', 'zm_raw'].map(b) },
            { kind: 'category', name: 'Операторы', colour: 115, contents: ['math_number', 'math_arithmetic', 'math_single', 'math_trig', 'math_constant', 'math_round', 'math_modulo', 'math_random_int', 'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean', 'zm_convert'].map(b) },
            { kind: 'category', name: 'Текст и вывод', colour: 160, contents: ['text', 'text_join', 'text_length', 'text_isEmpty', 'text_print'].map(b) },
            { kind: 'category', name: 'Переменные', colour: 25, custom: 'VARIABLE' },
            { kind: 'category', name: 'Списки', colour: 15, contents: ['lists_create_with', 'lists_repeat', 'lists_length', 'lists_isEmpty', 'zm_append', 'zm_get_index', 'zm_set_index'].map(b) },
            { kind: 'category', name: 'Мои блоки', colour: 290, custom: 'PROCEDURE' },
        ];
        const groups = new Map();
        for (const c of catalog) {
            if (!c.sets[set] || (query && !((c.label + ' ' + c.name + ' ' + c.description).toLowerCase().includes(query.toLowerCase()))))
                continue;
            const group = c.sets[set];
            if (!groups.has(group))
                groups.set(group, []);
            groups.get(group).push({ kind: 'block', type: blockType(c), inputs: Object.fromEntries(c.args.map((a, i) => ['ARG' + i, shadow(a.value)])) });
        }
        for (const [name, contents] of groups)
            categories.push({ kind: 'category', name, colour: 210, contents });
        return { kind: 'categoryToolbox', contents: categories };
    }
    function workspaceToProgram(ws, catalog, controller) {
        const commandTypes = new Map(catalog.map(c => [blockType(c), c]));
        const variables = ws.getVariableMap().getAllVariables();
        const variableById = new Map(variables.map(v => [v.getId(), v.name]));
        const top = ws.getTopBlocks(true).filter(b => b.isEnabled());
        const defs = top.filter(b => /^procedures_def/.test(b.type));
        const argNames = new Set(defs.flatMap(b => b.getProcedureDef()[1]));
        function vref(block, field = 'VAR', ctx) { const id = block.getFieldValue(field), n = variableById.get(id); return ctx?.has(n) ? ctx.get(n) : id; }
        function input(b, n, ctx) { const c = b.getInputTargetBlock(n); if (!c)
            fail(b, 'Заполни поле «' + n + '».'); return expr(c, ctx); }
        function fail(b, text) { const e = Error(text); e.blockId = b?.id; throw e; }
        const node = (b, value) => ({ ...value, blockId: b.id });
        function expr(b, ctx) {
            const n = value => node(b, value);
            if (!b.isEnabled())
                fail(b, 'Выключенный блок используется как значение.');
            const c = commandTypes.get(b.type);
            if (c)
                return n({ type: 'command', id: c.id, args: c.args.map((_, i) => input(b, 'ARG' + i, ctx)) });
            switch (b.type) {
                case 'math_number': return n({ type: 'literal', value: Number(b.getFieldValue('NUM')) });
                case 'text': return n({ type: 'literal', value: b.getFieldValue('TEXT') });
                case 'logic_boolean': return n({ type: 'literal', value: b.getFieldValue('BOOL') === 'TRUE' });
                case 'variables_get': return n({ type: 'variable', id: vref(b, 'VAR', ctx) });
                case 'math_arithmetic': return n({ type: 'binary', op: { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: '**' }[b.getFieldValue('OP')], left: input(b, 'A', ctx), right: input(b, 'B', ctx) });
                case 'logic_compare': return n({ type: 'binary', op: { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' }[b.getFieldValue('OP')], left: input(b, 'A', ctx), right: input(b, 'B', ctx) });
                case 'logic_operation': return n({ type: 'binary', op: b.getFieldValue('OP') === 'AND' ? 'and' : 'or', left: input(b, 'A', ctx), right: input(b, 'B', ctx) });
                case 'logic_negate': return n({ type: 'not', value: input(b, 'BOOL', ctx) });
                case 'math_modulo': return n({ type: 'binary', op: '%', left: input(b, 'DIVIDEND', ctx), right: input(b, 'DIVISOR', ctx) });
                case 'math_single':
                case 'math_round':
                case 'math_trig': {
                    const op = b.getFieldValue('OP'), val = input(b, 'NUM', ctx);
                    if (op === 'NEG')
                        return n({ type: 'binary', op: '*', left: { type: 'literal', value: -1 }, right: val });
                    if (op === 'POW10')
                        return n({ type: 'binary', op: '**', left: { type: 'literal', value: 10 }, right: val });
                    if (['ABS', 'ROUND'].includes(op))
                        return n({ type: 'builtin', name: op === 'ABS' ? 'abs' : 'round', args: [val] });
                    return n({ type: 'math', name: { ROOT: 'sqrt', LN: 'log', LOG10: 'log10', EXP: 'exp', ROUNDUP: 'ceil', ROUNDDOWN: 'floor' }[op] || op.toLowerCase(), value: val });
                }
                case 'math_constant': return n({ type: 'constant', name: { PI: 'pi', E: 'e', INFINITY: 'inf', GOLDEN_RATIO: 'golden', SQRT2: 'sqrt2', SQRT1_2: 'sqrt_half' }[b.getFieldValue('CONSTANT')] || fail(b, 'Эта константа пока не поддерживается.') });
                case 'math_random_int': return n({ type: 'random', low: input(b, 'FROM', ctx), high: input(b, 'TO', ctx) });
                case 'text_join': return n({ type: 'join', items: Array.from({ length: b.itemCount_ }, (_, i) => input(b, 'ADD' + i, ctx)) });
                case 'text_length':
                case 'lists_length': return n({ type: 'builtin', name: 'len', args: [input(b, 'VALUE', ctx)] });
                case 'text_isEmpty':
                case 'lists_isEmpty': return n({ type: 'not', value: input(b, 'VALUE', ctx) });
                case 'lists_create_with': return n({ type: 'list', items: Array.from({ length: b.itemCount_ }, (_, i) => input(b, 'ADD' + i, ctx)) });
                case 'lists_repeat': return n({ type: 'listRepeat', value: { type: 'list', items: [input(b, 'ITEM', ctx)] }, count: input(b, 'NUM', ctx) });
                case 'zm_get_index': return n({ type: 'index', list: input(b, 'LIST', ctx), index: input(b, 'INDEX', ctx) });
                case 'zm_convert': return n({ type: 'builtin', name: b.getFieldValue('KIND'), args: [input(b, 'VALUE', ctx)] });
                case 'procedures_callreturn':
                case 'procedures_callnoreturn': return n({ type: 'procedure', id: b.getProcedureCall(), args: b.arguments_.map((_, i) => input(b, 'ARG' + i, ctx)) });
                default: fail(b, 'Не поддерживается блок: ' + b.type);
            }
        }
        function chain(first, ctx, loop = 0) {
            const rows = [];
            for (let b = first; b; b = b.getNextBlock()) {
                if (!b.isEnabled())
                    continue;
                const n = x => rows.push(node(b, x)), sub = name => chain(b.getInputTargetBlock(name), ctx, loop);
                const cmd = commandTypes.get(b.type);
                if (cmd) {
                    n(expr(b, ctx));
                    continue;
                }
                switch (b.type) {
                    case 'variables_set':
                        n({ type: 'set', id: vref(b, 'VAR', ctx), value: input(b, 'VALUE', ctx) });
                        break;
                    case 'math_change':
                        n({ type: 'change', id: vref(b, 'VAR', ctx), value: input(b, 'DELTA', ctx) });
                        break;
                    case 'controls_repeat_ext':
                        n({ type: 'repeat', count: input(b, 'TIMES', ctx), body: chain(b.getInputTargetBlock('DO'), ctx, loop + 1) });
                        break;
                    case 'controls_whileUntil':
                        n({ type: b.getFieldValue('MODE') === 'UNTIL' ? 'until' : 'while', condition: input(b, 'BOOL', ctx), body: chain(b.getInputTargetBlock('DO'), ctx, loop + 1) });
                        break;
                    case 'zm_forever':
                        n({ type: 'forever', body: chain(b.getInputTargetBlock('DO'), ctx, loop + 1) });
                        break;
                    case 'zm_wait_until':
                        n({ type: 'waitUntil', condition: input(b, 'CONDITION', ctx) });
                        break;
                    case 'controls_if': {
                        let branch = b.elseCount_ ? sub('ELSE') : undefined;
                        for (let i = b.elseifCount_; i >= 0; i--) {
                            const item = node(b, { type: 'if', condition: input(b, 'IF' + i, ctx), then: sub('DO' + i) });
                            if (branch !== undefined)
                                item.else = branch;
                            branch = [item];
                        }
                        rows.push(...branch);
                        break;
                    }
                    case 'controls_for':
                        n({ type: 'for', id: vref(b, 'VAR', ctx), from: input(b, 'FROM', ctx), to: input(b, 'TO', ctx), step: input(b, 'BY', ctx), body: chain(b.getInputTargetBlock('DO'), ctx, loop + 1) });
                        break;
                    case 'controls_forEach':
                        n({ type: 'foreach', id: vref(b, 'VAR', ctx), list: input(b, 'LIST', ctx), body: chain(b.getInputTargetBlock('DO'), ctx, loop + 1) });
                        break;
                    case 'controls_flow_statements':
                        if (!loop)
                            fail(b, 'Прерывание доступно только внутри цикла.');
                        n({ type: b.getFieldValue('FLOW') === 'BREAK' ? 'break' : 'continue' });
                        break;
                    case 'text_print':
                        n({ type: 'print', value: input(b, 'TEXT', ctx) });
                        break;
                    case 'zm_append':
                        n({ type: 'append', list: input(b, 'LIST', ctx), value: input(b, 'VALUE', ctx) });
                        break;
                    case 'zm_set_index':
                        n({ type: 'setIndex', list: input(b, 'LIST', ctx), index: input(b, 'INDEX', ctx), value: input(b, 'VALUE', ctx) });
                        break;
                    case 'zm_raw':
                        n({ type: 'raw', source: b.getFieldValue('SOURCE') });
                        break;
                    case 'procedures_callnoreturn':
                        n(expr(b, ctx));
                        break;
                    case 'procedures_ifreturn':
                        if (!ctx)
                            fail(b, 'Возврат должен быть внутри подпрограммы.');
                        n({ type: 'return', condition: input(b, 'CONDITION', ctx), value: b.hasReturnValue_ ? input(b, 'VALUE', ctx) : undefined });
                        break;
                    default: fail(b, 'Этот блок нельзя использовать как команду: ' + b.type);
                }
            }
            return rows;
        }
        const starts = top.filter(b => b.type === 'zm_start');
        if (starts.length !== 1)
            throw Error('Нужен ровно один блок «Когда программа запущена».');
        const loose = top.find(b => b.type !== 'zm_start' && !/^procedures_def/.test(b.type));
        if (loose)
            fail(loose, 'Присоедини блоки к началу программы или к подпрограмме.');
        return { version: 1, controller, variables: variables.filter(v => !argNames.has(v.name)).map(v => ({ id: v.getId(), name: v.name, initial: 0 })), functions: defs.map(b => { const [name, args] = b.getProcedureDef(); const ctx = new Map(args.map(a => [a, 'arg:' + name + ':' + a])); return { id: name, name, args: args.map(a => ({ id: ctx.get(a), name: a })), body: chain(b.getInputTargetBlock('STACK'), ctx), result: b.type === 'procedures_defreturn' ? input(b, 'RETURN', ctx) : undefined }; }), body: chain(starts[0].getNextBlock()) };
    }
    return { register, toolbox, workspaceToProgram, blockType };
});
