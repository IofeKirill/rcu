/* ZMROBO blocks → readable Python. Shared by the webview and extension host. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports)
        module.exports = factory();
    else
        root.ZmPython = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const reserved = new Set(('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case type motor move rcu sensor trace servo ai aicam display rf actuator iot os math random print str int float bool len range list sum min max abs sgn task1 round sorted reversed enumerate pow input').split(' '));
    function identifier(name) { return typeof name === 'string' && /^[\p{L}][\p{L}\p{N}_]*$/u.test(name) && name.normalize('NFKC') === name && !reserved.has(name); }
    function literal(v) {
        if (v === null)
            return 'None';
        if (typeof v === 'boolean')
            return v ? 'True' : 'False';
        if (typeof v === 'number' && Number.isFinite(v))
            return String(v);
        if (typeof v === 'string')
            return JSON.stringify(v);
        throw Error('Недопустимое значение.');
    }
    function generate(program, catalog) {
        const commands = new Map(catalog.map(c => [c.id, c]));
        if (!program || program.version !== 1 || !['E6', 'M6', 'E7', 'H'].includes(program.controller) || !Array.isArray(program.variables) || !Array.isArray(program.body) || !Array.isArray(program.functions))
            throw Error('Неверный формат программы.');
        if (JSON.stringify(program).length > 1000000)
            throw Error('Программа слишком большая.');
        const names = new Map(), usedNames = new Set(), funcs = new Map(), imports = new Set(), used = new Set();
        let serial = 0, nodes = 0;
        const helpers = new Set();
        function declare(id, name, map) {
            if (typeof id !== 'string' || !id || map.has(id) || !identifier(name) || usedNames.has(name))
                throw Error('Недопустимое или повторяющееся имя: ' + name);
            map.set(id, name);
            usedNames.add(name);
        }
        for (const v of program.variables)
            declare(v.id, v.name, names);
        for (const f of program.functions)
            declare(f.id, f.name, funcs);
        function name(id, ctx) {
            if (ctx?.args.has(id))
                return ctx.args.get(id);
            if (!names.has(id))
                throw Error('Неизвестная переменная: ' + id);
            return names.get(id);
        }
        function visit(n, fn) {
            if (++nodes > 20000)
                throw Error('Слишком много блоков.');
            if (!n || typeof n !== 'object')
                throw Error('Не заполнено поле блока.');
            try {
                return fn();
            }
            catch (e) {
                if (!e.blockId)
                    e.blockId = n.blockId;
                throw e;
            }
        }
        function call(n, ctx) {
            const c = commands.get(n.id);
            if (!c || !c.sets[program.controller])
                throw Error('Команда недоступна для ' + program.controller + ': ' + n.id);
            if (!Array.isArray(n.args) || n.args.length !== c.args.length)
                throw Error('Проверь параметры ' + c.name);
            imports.add(c.name.split('.')[0]);
            used.add(c.id);
            return c.name + '(' + n.args.map(x => expr(x, ctx)).join(', ') + ')';
        }
        function expr(n, ctx) {
            return visit(n, () => {
                switch (n.type) {
                    case 'literal':
                        if (n.hex) {
                            if (!Number.isInteger(n.value) || n.value < 0 || n.value > 0xffffff)
                                throw Error('Некорректный цвет RGB.');
                            return '0x' + n.value.toString(16).toUpperCase().padStart(n.digits === 4 ? 4 : 6, '0');
                        }
                        return literal(n.value);
                    case 'variable': return name(n.id, ctx);
                    case 'list': return '[' + n.items.map(x => expr(x, ctx)).join(', ') + ']';
                    case 'binary':
                        if (!['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', '!=', 'and', 'or', 'in'].includes(n.op))
                            throw Error('Неизвестный оператор.');
                        return '(' + expr(n.left, ctx) + ' ' + n.op + ' ' + expr(n.right, ctx) + ')';
                    case 'not': return '(not ' + expr(n.value, ctx) + ')';
                    case 'command': return call(n, ctx);
                    case 'procedure': {
                        const f = program.functions.find(f => f.id === n.id);
                        if (!f || n.args.length !== f.args.length)
                            throw Error('Неизвестная подпрограмма или неверные аргументы.');
                        return funcs.get(n.id) + '(' + n.args.map(x => expr(x, ctx)).join(', ') + ')';
                    }
                    case 'builtin': {
                        const allowed = { sgn: 1, abs: 1, round: 1, int: 1, float: 1, str: 1, len: 1, bool: 1, sum: 1, min: 1, max: 1, sorted: 1, list: 1 };
                        if (allowed[n.name] !== n.args.length)
                            throw Error('Неизвестная функция.');
                        if (n.name === 'sgn') helpers.add('sgn');
                        return n.name + '(' + n.args.map(x => expr(x, ctx)).join(', ') + ')';
                    }
                    case 'math': {
                        if (!['sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'exp', 'floor', 'ceil'].includes(n.name))
                            throw Error('Неизвестная математическая функция.');
                        imports.add('math');
                        const a = expr(n.value, ctx);
                        return ['sin', 'cos', 'tan'].includes(n.name) ? 'math.' + n.name + '(math.radians(' + a + '))' : ['asin', 'acos', 'atan'].includes(n.name) ? 'math.degrees(math.' + n.name + '(' + a + '))' : 'math.' + n.name + '(' + a + ')';
                    }
                    case 'constant':
                        if (!['pi', 'e', 'inf', 'sqrt2', 'sqrt_half', 'golden'].includes(n.name))
                            throw Error('Неизвестная константа.');
                        imports.add('math');
                        return { sqrt2: 'math.sqrt(2)', sqrt_half: 'math.sqrt(0.5)', golden: '((1 + math.sqrt(5)) / 2)' }[n.name] || 'math.' + n.name;
                    case 'random':
                        imports.add('random');
                        return 'random.randint(int(' + expr(n.low, ctx) + '), int(' + expr(n.high, ctx) + '))';
                    case 'join':
                        if (!n.items.length)
                            return '""';
                        return '(' + n.items.map(x => 'str(' + expr(x, ctx) + ')').join(' + ') + ')';
                    case 'index':
                        helpers.add('index');
                        return expr(n.list, ctx) + '[_zm_index(' + expr(n.index, ctx) + ')]';
                    case 'threshold': {
                        helpers.add('threshold');
                        const port = expr(n.port, ctx);
                        if (n.kind === 'lightThreshold')
                            return '_zm_light_thresholds.get(int(' + port + '), 1000)';
                        if (n.kind === 'lightDigital') {
                            imports.add('sensor');
                            used.add('sensor.GetLightSensor');
                            used.add('sensor.GetLightSensorData');
                            return '_zm_light_digital(' + port + ')';
                        }
                        if (n.kind === 'lineDigital') {
                            imports.add('trace');
                            used.add('trace.GetTraceV2I2C');
                            used.add('trace.GetTraceV2I2CState');
                            return '_zm_line_digital(' + port + ', ' + expr(n.channel, ctx) + ')';
                        }
                        throw Error('Неизвестный порог датчика.');
                    }
                    case 'listItem':
                        helpers.add('list');
                        imports.add('random');
                        return expr(n.list, ctx) + '[_zm_list_pos(' + expr(n.index, ctx) + ', ' + expr(n.list, ctx) + ')]';
                    case 'listIndex':
                        helpers.add('list');
                        imports.add('random');
                        return '_zm_list_find(' + expr(n.list, ctx) + ', ' + expr(n.value, ctx) + ')';
                    case 'listRepeat': return '(' + expr(n.value, ctx) + ' * int(' + expr(n.count, ctx) + '))';
                    default: throw Error('Неизвестное выражение: ' + n.type);
                }
            });
        }
        function body(rows, depth, ctx) {
            if (!Array.isArray(rows))
                throw Error('Неверное тело блока.');
            if (depth > 80)
                throw Error('Слишком большая вложенность.');
            const p = '    '.repeat(depth);
            if (!rows.length)
                return p + 'pass\n';
            return rows.map(n => visit(n, () => {
                switch (n.type) {
                    case 'set':
                    case 'change': {
                        const target = name(n.id, ctx);
                        if (ctx && !ctx.args.has(n.id))
                            ctx.globals.add(target);
                        return p + target + (n.type === 'set' ? ' = ' : ' += ') + expr(n.value, ctx) + '\n';
                    }
                    case 'command': return p + call(n, ctx) + '\n';
                    case 'procedure': return p + expr(n, ctx) + '\n';
                    case 'print': return p + 'print(' + expr(n.value, ctx) + ')\n';
                    case 'if': return p + 'if ' + expr(n.condition, ctx) + ':\n' + body(n.then, depth + 1, ctx) + (n.else !== undefined ? p + 'else:\n' + body(n.else, depth + 1, ctx) : '');
                    case 'repeat': return p + 'for _zm_repeat_' + serial++ + ' in range(int(' + expr(n.count, ctx) + ')):\n' + body(n.body, depth + 1, ctx);
                    case 'for': {
                        const v = name(n.id, ctx);
                        if (ctx && !ctx.args.has(n.id))
                            ctx.globals.add(v);
                        helpers.add('range');
                        return p + 'for ' + v + ' in _zm_range(' + [n.from, n.to, n.step].map(x => expr(x, ctx)).join(', ') + '):\n' + body(n.body, depth + 1, ctx);
                    }
                    case 'foreach': {
                        const v = name(n.id, ctx);
                        if (ctx && !ctx.args.has(n.id))
                            ctx.globals.add(v);
                        return p + 'for ' + v + ' in ' + expr(n.list, ctx) + ':\n' + body(n.body, depth + 1, ctx);
                    }
                    case 'while':
                    case 'until': return p + 'while ' + (n.type === 'until' ? 'not ' : '') + expr(n.condition, ctx) + ':\n' + body(n.body, depth + 1, ctx);
                    case 'forever': return p + 'while True:\n' + body(n.body, depth + 1, ctx);
                    case 'waitUntil':
                        imports.add('rcu');
                        used.add('rcu.SetWaitForTime');
                        return p + 'while not ' + expr(n.condition, ctx) + ':\n' + p + '    rcu.SetWaitForTime(0.01)\n';
                    case 'append': return p + expr(n.list, ctx) + '.append(' + expr(n.value, ctx) + ')\n';
                    case 'setIndex':
                        helpers.add('index');
                        return p + expr(n.list, ctx) + '[_zm_index(' + expr(n.index, ctx) + ')] = ' + expr(n.value, ctx) + '\n';
                    case 'thresholdSet': {
                        helpers.add('threshold');
                        if (n.kind === 'lightSetThreshold')
                            return p + '_zm_light_thresholds[int(' + expr(n.port, ctx) + ')] = ' + expr(n.value, ctx) + '\n';
                        if (n.kind === 'lineSetThreshold')
                            return p + '_zm_line_thresholds[(int(' + expr(n.port, ctx) + '), int(' + expr(n.channel, ctx) + '))] = ' + expr(n.value, ctx) + '\n';
                        throw Error('Неизвестная настройка порога.');
                    }
                    case 'listClear': return p + expr(n.list, ctx) + '.clear()\n';
                    case 'listDelete':
                        helpers.add('list');
                        imports.add('random');
                        return p + '_zm_list_delete(' + expr(n.list, ctx) + ', ' + expr(n.index, ctx) + ')\n';
                    case 'listInsert':
                        helpers.add('list');
                        imports.add('random');
                        return p + expr(n.list, ctx) + '.insert(_zm_list_pos(' + expr(n.index, ctx) + ', ' + expr(n.list, ctx) + ', True), ' + expr(n.value, ctx) + ')\n';
                    case 'listReplace':
                        helpers.add('list');
                        imports.add('random');
                        return p + expr(n.list, ctx) + '[_zm_list_pos(' + expr(n.index, ctx) + ', ' + expr(n.list, ctx) + ')] = ' + expr(n.value, ctx) + '\n';
                    case 'raw':
                        if (typeof n.source !== 'string' || n.source.length > 20000)
                            throw Error('Некорректный блок Python.');
                        return n.source.split('\n').map(line => p + line).join('\n') + '\n';
                    case 'break':
                    case 'continue': return p + n.type + '\n';
                    case 'returnValue':
                        if (!ctx || ctx.isEntry) throw Error('Возврат доступен внутри Моего блока.');
                        return p + 'return ' + expr(n.value, ctx) + '\n';
                    case 'return':
                        if (!ctx || ctx.isEntry)
                            throw Error('Возврат доступен внутри подпрограммы.');
                        return p + 'if ' + expr(n.condition, ctx) + ':\n' + p + '    return' + (n.value ? ' ' + expr(n.value, ctx) : '') + '\n';
                    default: throw Error('Неизвестный блок: ' + n.type);
                }
            })).join('');
        }
        const definitions = program.functions.map(f => {
            const ctx = { args: new Map(), globals: new Set() };
            const argsNames = new Set();
            for (const a of f.args) {
                if (!identifier(a.name) || argsNames.has(a.name) || usedNames.has(a.name) || ctx.args.has(a.id))
                    throw Error('Имя аргумента занято: ' + a.name);
                ctx.args.set(a.id, a.name);
                argsNames.add(a.name);
            }
            let b = body(f.body, 1, ctx);
            if(f.result&&!f.body.length)b='';
            if (f.result)
                b += '    return ' + expr(f.result, ctx) + '\n';
            return 'def ' + funcs.get(f.id) + '(' + [...ctx.args.values()].join(', ') + '):\n' + (ctx.globals.size ? '    global ' + [...ctx.globals].join(', ') + '\n' : '') + b + '\n';
        }).join('');
        const entryContext = program.entry === 'task1' ? {args:new Map(),globals:new Set(),isEntry:true} : null;
        const mainBody = body(program.body, entryContext ? 1 : 0, entryContext);
        const main = entryContext ? 'def task1():\n' + (entryContext.globals.size ? '    global ' + [...entryContext.globals].join(', ') + '\n' : '') + mainBody + '\ntask1()\n' : mainBody;
        const init = program.variables.map(v => names.get(v.id) + ' = ' + (v.kind === 'list' ? '[]' : literal(v.initial ?? 0)) + '\n').join('');
        const range = helpers.has('range') ? 'def _zm_range(start, end, step):\n    if step == 0:\n        raise ValueError("Шаг цикла не может быть нулём")\n    step = abs(step) if start <= end else -abs(step)\n    value = start\n    while value <= end if step > 0 else value >= end:\n        yield value\n        value += step\n\n' : '';
        const extraHelpers = { sgn: 'def sgn(value):\n    if value > 0:\n        return 1\n    if value < 0:\n        return -1\n    return 0\n\n', "threshold": "_zm_light_thresholds = {}\n_zm_line_thresholds = {}\n\ndef _zm_light_digital(port):\n    if int(port) in _zm_light_thresholds:\n        return sensor.GetLightSensor(port) < _zm_light_thresholds[int(port)]\n    return bool(sensor.GetLightSensorData(port))\n\ndef _zm_line_digital(port, channel):\n    key = (int(port), int(channel))\n    if key in _zm_line_thresholds:\n        return trace.GetTraceV2I2C(port, channel) < _zm_line_thresholds[key]\n    return bool(trace.GetTraceV2I2CState(port, channel))\n\n", "list": "def _zm_list_pos(index, values, insert=False):\n    if index == 'last':\n        return len(values) if insert else len(values) - 1\n    if index == 'random':\n        return random.randrange(len(values) + (1 if insert else 0))\n    index = int(index)\n    if index < 1:\n        raise IndexError('Нумерация элементов начинается с 1')\n    return index - 1\n\ndef _zm_list_find(values, value):\n    try:\n        return values.index(value) + 1\n    except ValueError:\n        return 0\n\ndef _zm_list_delete(values, index):\n    if index == 'all':\n        values.clear()\n    else:\n        del values[_zm_list_pos(index, values)]\n\n" };
        const helperSource = [...helpers].map(key => extraHelpers[key] || '').join('');
        const source = [...imports].sort().map(n => 'import ' + n + '\n').join('') + '\n' + (helpers.has('index') ? 'def _zm_index(value):\n    value = int(value)\n    if value < 1:\n        raise IndexError("Нумерация элементов начинается с 1")\n    return value - 1\n\n' : '') + range + helperSource + init + '\n' + definitions + main;
        return { source: source.trim() + '\n', commands: [...used], unsupported: [...used].filter(id => !commands.get(id)?.sim), raw: JSON.stringify(program).includes('"type":"raw"') };
    }
    return { generate, identifier, literal };
});
