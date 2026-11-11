'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), { spawnSync } = require('node:child_process');
const { generate } = require('../media/core'), catalog = require('../media/catalog.json');
const l = value => ({ type: 'literal', value }), v = id => ({ type: 'variable', id }), op = (a, o, b) => ({ type: 'binary', left: a, op: o, right: b });
const p = (body = [], variables = [], functions = []) => ({ version: 1, controller: 'E6', body, variables, functions });
const variable = (id, name, initial = 0) => ({ id, name, initial });
function py(source, tail = '') { const r = spawnSync(process.env.PYTHON || 'python3', ['-c', source + '\n' + tail], { encoding: 'utf8', timeout: 5000 }); assert.equal(r.status, 0, r.stderr || String(r.error)); return r.stdout; }
function check(program, expected) { const r = generate(program, catalog); const text = py(r.source, 'import json; print(json.dumps({' + program.variables.map(v => JSON.stringify(v.name) + ':' + v.name).join(',') + '}))'); assert.deepEqual(JSON.parse(text), expected); return r; }
test('variables retain names, Unicode names and values; repeat evaluates count once', () => {
    const code = check(p([{ type: 'repeat', count: v('n'), body: [{ type: 'change', id: 'r', value: l(1) }, { type: 'set', id: 'n', value: l(0) }] }], [variable('n', 'count', 3), variable('r', 'результат')]), { count: 0, результат: 3 }).source;
    assert.doesNotMatch(code, /global /);
    assert.match(code, /результат \+= 1/);
});
test('nested loops and operator precedence', () => check(p([{ type: 'repeat', count: l(2), body: [{ type: 'repeat', count: l(3), body: [{ type: 'change', id: 'r', value: op(op(l(1), '+', l(2)), '*', l(4)) }] }] }], [variable('r', 'result')]), { result: 72 }));
test('if / else and until', () => check(p([{ type: 'until', condition: op(v('x'), '>=', l(3)), body: [{ type: 'change', id: 'x', value: l(1) }] }, { type: 'if', condition: op(v('x'), '==', l(3)), then: [], else: [{ type: 'set', id: 'x', value: l(-1) }] }], [variable('x', 'value')]), { value: 3 }));
test('inclusive ascending and descending loops preserve user counter', () => check(p([{ type: 'for', id: 'i', from: l(3), to: l(1), step: l(-1), body: [{ type: 'change', id: 's', value: v('i') }] }], [variable('i', 'index'), variable('s', 'total')]), { index: 1, total: 6 }));
test('lists, one-based indexing and string escaping', () => check(p([{ type: 'set', id: 'a', value: { type: 'list', items: [l('Привет\n"\\'), l(3)] } }, { type: 'append', list: v('a'), value: l(true) }, { type: 'setIndex', list: v('a'), index: l(2), value: l(7) }, { type: 'set', id: 'b', value: { type: 'index', list: v('a'), index: l(2) } }], [variable('a', 'items'), variable('b', 'value')]), { items: ['Привет\n"\\', 7, true], value: 7 }));
test('procedures use explicit args and declare only modified global variables', () => {
    const program = p([{ type: 'procedure', id: 'Add', args: [l(5)] }], [variable('x', 'total')], [{ id: 'Add', name: 'Add', args: [{ id: 'amount', name: 'amount' }], body: [{ type: 'change', id: 'x', value: v('amount') }] }]);
    const result = check(program, { total: 5 });
    assert.match(result.source, /def Add\(amount\):\n    global total/);
});
test('procedures with return values', () => check(p([{ type: 'set', id: 'x', value: { type: 'procedure', id: 'Double', args: [l(7)] } }], [variable('x', 'value')], [{ id: 'Double', name: 'Double', args: [{ id: 'a', name: 'number' }], body: [], result: op(v('a'), '*', l(2)) }]), { value: 14 }));
test('empty text join produces an empty string', () => check(p([{ type: 'set', id: 'x', value: { type: 'join', items: [] } }], [variable('x', 'text')]), { text: '' }));
test('trigonometry uses degrees', () => check(p([{ type: 'set', id: 'x', value: { type: 'builtin', name: 'round', args: [{ type: 'math', name: 'sin', value: l(90) }] } }], [variable('x', 'value')]), { value: 1 }));
test('invalid names and missing references fail explicitly', () => {
    for (const name of ['for', 'motor', 'int', 'bad name', '_zm_repeat_0', '1x'])
        assert.throws(() => generate(p([], [variable('x', name)]), catalog));
    assert.throws(() => generate(p([{ type: 'set', id: 'missing', value: l(0) }]), catalog));
    assert.throws(() => generate(p([], [variable('x', 'same'), variable('y', 'same')]), catalog));
});
test('all catalog calls generate syntactically valid Python and correct simulator flags', () => {
    const sources = [];
    for (const c of catalog) {
        const program = { ...p(), controller: Object.keys(c.sets)[0] };
        const call = { type: 'command', id: c.id, args: c.args.map(a => l(a.value)) };
        if (c.output) {
            program.variables = [variable('x', 'value')];
            program.body = [{ type: 'set', id: 'x', value: call }];
        }
        else
            program.body = [call];
        const r = generate(program, catalog);
        assert.equal(r.unsupported.includes(c.id), !c.sim);
        sources.push(r.source);
    }
    const r = spawnSync(process.env.PYTHON || 'python3', ['-c', 'import ast,json,sys\nfor source in json.load(sys.stdin): ast.parse(source)'], { input: JSON.stringify(sources), encoding: 'utf8', timeout: 5000 });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(sources.length, catalog.length);
});
test('imports are unique and command arity is validated', () => {
    const call = { type: 'command', id: 'motor.SetMotor', args: [l(1), l(50)] };
    assert.equal((generate(p([call, call]), catalog).source.match(/import motor/g) || []).length, 1);
    assert.throws(() => generate(p([{ ...call, args: [] }]), catalog));
});
test('native list operations preserve values and one-based indexing', () => {
    const program = p([{ type: 'append', list: v('a'), value: l(5) }, { type: 'append', list: v('a'), value: l(7) }, { type: 'listInsert', list: v('a'), index: l(2), value: l(6) }, { type: 'listReplace', list: v('a'), index: l('last'), value: l(8) }, { type: 'set', id: 'r', value: { type: 'listIndex', list: v('a'), value: l(6) } }, { type: 'listDelete', list: v('a'), index: l(1) }], [{ ...variable('a', 'items'), kind: 'list' }, variable('r', 'position')]);
    check(program, { items: [6, 8], position: 2 });
});
test('light threshold blocks generate a working comparison with the same hardware API', () => {
    const program = p([{ type: 'thresholdSet', kind: 'lightSetThreshold', port: l(1), value: l(50) }, { type: 'set', id: 'r', value: { type: 'threshold', kind: 'lightDigital', port: l(1) } }], [variable('r', 'detected')]);
    const r = generate(program, catalog);
    const prelude = 'import sys, types\nsensor=types.ModuleType("sensor")\nsensor.GetLightSensor=lambda port:25\nsensor.GetLightSensorData=lambda port:False\nsys.modules["sensor"]=sensor\n';
    py(prelude + r.source, 'assert detected is True');
    assert.deepEqual(r.unsupported, []);
});
test('RGB fields stay readable as hexadecimal Python constants', () => {
    const r = generate(p([{ type: 'command', id: 'sensor.SetSmartEyeMode', args: [l(1), l(9), { type: 'literal', value: 0xff0000, hex: true }] }]), catalog);
    assert.match(r.source, /0xFF0000/);
});
test('task1 shares assigned variables with custom functions and supports early returns',()=>{
    const program=p([{type:'set',id:'r',value:{type:'procedure',id:'Choose',args:[l(-8)]}},{type:'procedure',id:'Increase',args:[]}],[variable('r','result')],[
        {id:'Choose',name:'Choose',args:[{id:'x',name:'number'}],body:[{type:'if',condition:op(v('x'),'<',l(0)),then:[{type:'returnValue',value:{type:'builtin',name:'sgn',args:[v('x')]}}]},{type:'returnValue',value:l(10)}]},
        {id:'Increase',name:'Increase',args:[],body:[{type:'change',id:'r',value:l(3)}]}
    ]);program.entry='task1';
    const result=check(program,{result:2});assert.match(result.source,/def task1\(\):\n    global result/);assert.match(result.source,/\ntask1\(\)\n$/);
    assert.throws(()=>generate({...p([{type:'returnValue',value:l(0)}]),entry:'task1'},catalog),/внутри/);
    const sign=generate({...p([{type:'print',value:{type:'builtin',name:'sgn',args:[l(0)]}},{type:'print',value:{type:'builtin',name:'sgn',args:[l(4)]}}]),entry:'task1'},catalog);
    assert.equal(py(sign.source),'0\n1\n');
});
