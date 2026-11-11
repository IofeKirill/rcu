'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const B = require('blockly'), Z = require('../media/blocks'), C = require('../media/core'), catalog = require('../media/catalog.json');
Z.register(B, catalog);
function number(w, value) { const b = w.newBlock('math_number'); b.setFieldValue(String(value), 'NUM'); return b; }
function run(w) { return C.generate(Z.workspaceToProgram(w, catalog, 'E6'), catalog); }
test('workspace saves and reloads with stable variable IDs and code', () => {
    const w = new B.Workspace(), start = w.newBlock('zm_start');
    const variable = w.getVariableMap().createVariable('speed');
    const set = w.newBlock('variables_set');
    set.setFieldValue(variable.getId(), 'VAR');
    set.getInput('VALUE').connection.connect(number(w, 50).outputConnection);
    start.nextConnection.connect(set.previousConnection);
    const before = run(w).source;
    const serialized = B.serialization.workspaces.save(w);
    const copy = new B.Workspace();
    B.serialization.workspaces.load(serialized, copy);
    assert.equal(run(copy).source, before);
    assert.match(before, /speed = 50/);
    w.dispose();
    copy.dispose();
});
test('all backend robot commands can be instantiated and translated', () => {
    for (const c of catalog) {
        const w = new B.Workspace(), start = w.newBlock('zm_start'), block = w.newBlock(Z.blockType(c));
        c.args.forEach((a, i) => {
            let b;
            if (typeof a.value === 'string') {
                b = w.newBlock('text');
                b.setFieldValue(a.value, 'TEXT');
            }
            else if (typeof a.value === 'boolean') {
                b = w.newBlock('logic_boolean');
                b.setFieldValue(a.value ? 'TRUE' : 'FALSE', 'BOOL');
            }
            else
                b = number(w, a.value);
            block.getInput('ARG' + i).connection.connect(b.outputConnection);
        });
        if (c.output) {
            const print = w.newBlock('text_print');
            print.getInput('TEXT').connection.connect(block.outputConnection);
            start.nextConnection.connect(print.previousConnection);
        }
        else
            start.nextConnection.connect(block.previousConnection);
        const p = Z.workspaceToProgram(w, catalog, Object.keys(c.sets)[0]);
        assert.match(C.generate(p, catalog).source, new RegExp(c.name.replace('.', '\\.')));
        w.dispose();
    }
});
test('disconnected blocks and empty required inputs prevent execution', () => {
    const w = new B.Workspace(), start = w.newBlock('zm_start'), b = w.newBlock('variables_set');
    assert.throws(() => run(w), /Присоедини/);
    start.nextConnection.connect(b.previousConnection);
    assert.throws(() => run(w), /Заполни/);
    w.dispose();
});
test('default function name is a valid Python identifier', () => {
    const w = new B.Workspace();
    w.newBlock('zm_start');
    w.newBlock('procedures_defnoreturn');
    assert.match(run(w).source, /def MyFunction\(\)/);
    w.dispose();
});
test('procedure arguments become local Python parameters and survive serialization', () => {
    const w = new B.Workspace(), start = w.newBlock('zm_start'), total = w.getVariableMap().createVariable('total');
    const def = w.newBlock('procedures_defnoreturn');
    def.setFieldValue('Add', 'NAME');
    def.arguments_ = ['amount'];
    def.argumentVarModels_ = [w.getVariableMap().createVariable('amount')];
    def.updateParams_();
    const get = w.newBlock('variables_get');
    get.setFieldValue(def.argumentVarModels_[0].getId(), 'VAR');
    const change = w.newBlock('math_change');
    change.setFieldValue(total.getId(), 'VAR');
    change.getInput('DELTA').connection.connect(get.outputConnection);
    def.getInput('STACK').connection.connect(change.previousConnection);
    const call = w.newBlock('procedures_callnoreturn');
    call.setFieldValue('Add', 'NAME');
    call.setProcedureParameters_(['amount'], ['arg1']);
    call.getInput('ARG0').connection.connect(number(w, 5).outputConnection);
    start.nextConnection.connect(call.previousConnection);
    const code = run(w).source;
    assert.match(code, /def Add\(amount\)/);
    assert.match(code, /global total/);
    assert.match(code, /total \+= amount/);
    assert.match(code, /Add\(5\)/);
    assert.doesNotMatch(code, /amount = 0/);
    const copy = new B.Workspace();
    B.serialization.workspaces.load(B.serialization.workspaces.save(w), copy);
    assert.equal(run(copy).source, code);
    w.dispose();
    copy.dispose();
});
