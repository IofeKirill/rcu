/* Preserve v1 project code while moving its common blocks to the RoboCode renderer. */
(function (root) {
    'use strict';
    let registered = false;
    root.RoboMigrate = function (project, reference, catalog) {
        if (project.workspace.xml)
            return project;
        const B = root.LegacyBlockly;
        if (!registered) {
            root.ZmBlocksV1.register(B, catalog);
            registered = true;
        }
        const w = new B.Workspace();
        let ast;
        try {
            B.serialization.workspaces.load(project.workspace, w);
            ast = root.ZmBlocksV1.workspaceToProgram(w, catalog, project.controller);
        }
        finally {
            w.dispose();
        }
        const esc = root.RoboBlocks.escape, names = new Map(ast.variables.map(v => [v.id, v.name])), procs = new Map(ast.functions.map(f => [f.id, f.name + f.args.map(() => ' %s').join('')]));
        function field(name, value, attrs = '') { return '<field name="' + name + '"' + attrs + '>' + esc(value) + '</field>'; }
        function value(name, node, ctx) { return '<value name="' + name + '">' + expr(node, ctx) + '</value>'; }
        function saved(node, statement, ctx) { const copy = JSON.parse(JSON.stringify(node)); function remap(n) { if (!n || typeof n !== 'object')
            return; if (n.type === 'variable' && ctx?.ids.has(n.id))
            n.id = ctx.ids.get(n.id); if (n.type === 'procedure')
            n.id = procs.get(n.id) || n.id; for (const v of Object.values(n))
            if (v && typeof v === 'object')
                Array.isArray(v) ? v.forEach(remap) : remap(v); } remap(copy); return '<block type="rc_saved_' + (statement ? 'statement' : 'expression') + '">' + field('LABEL', node.type === 'command' ? node.id : 'из прежнего проекта') + '<data>' + esc(JSON.stringify(copy)) + '</data></block>'; }
        function native(n, ctx) { const candidates = reference.blocks.filter(d => d.call === n.id && !d.compare && !d.special && !d.requiresOriginalCode); for (const d of candidates) {
            const args = {};
            let ok = d.order.length === n.args.length;
            if (!ok)
                continue;
            d.order.forEach((key, i) => { if (typeof key === 'object') {
                if (n.args[i].type !== 'literal' || n.args[i].value !== key.constant)
                    ok = false;
            }
            else
                args[key] = n.args[i]; });
            let body = '';
            for (const a of d.args) {
                const n = args[a.name];
                if (!n) {
                    ok = false;
                    break;
                }
                if (a.kind === 'dropdown') {
                    if (n.type !== 'literal' || !a.options.some(o => o[1] === n.value)) {
                        ok = false;
                        break;
                    }
                    body += field(a.name, JSON.stringify(n.value));
                }
                else if (a.kind === 'colour') {
                    if (n.type !== 'literal' || typeof n.value !== 'number') {
                        ok = false;
                        break;
                    }
                    body += field(a.name, '#' + n.value.toString(16).padStart(6, '0'));
                }
                else
                    body += value(a.name, n, ctx);
            }
            if (ok)
                return '<block type="' + d.id + '">' + body + '</block>';
        } return saved(n, !catalog.find(c => c.id === n.id)?.output, ctx); }
        function variable(id) { return field('VARIABLE', names.get(id) || id, ' id="' + esc(id) + '"'); }
        function expr(n, ctx) {
            switch (n.type) {
                case 'literal':
                    if (typeof n.value === 'number')
                        return '<shadow type="math_number">' + field('NUM', n.value) + '</shadow>';
                    if (typeof n.value === 'string')
                        return '<shadow type="text">' + field('TEXT', n.value) + '</shadow>';
                    return saved(n, false, ctx);
                case 'variable':
                    if (ctx?.args.has(n.id))
                        return '<block type="argument_reporter_string_number">' + field('VALUE', ctx.args.get(n.id)) + '</block>';
                    return '<block type="data_variable">' + variable(n.id) + '</block>';
                case 'command': return native(n, ctx);
                case 'binary': {
                    const map = { '+': ['operator_add', 'NUM1', 'NUM2'], '-': ['operator_subtract', 'NUM1', 'NUM2'], '*': ['operator_multiply', 'NUM1', 'NUM2'], '/': ['operator_divide', 'NUM1', 'NUM2'], '%': ['operator_mod', 'NUM1', 'NUM2'], '>': ['operator_gt', 'OPERAND1', 'OPERAND2'], '<': ['operator_lt', 'OPERAND1', 'OPERAND2'], '==': ['operator_equals', 'OPERAND1', 'OPERAND2'], 'and': ['operator_and', 'OPERAND1', 'OPERAND2'], 'or': ['operator_or', 'OPERAND1', 'OPERAND2'] };
                    if (!map[n.op])
                        return saved(n, false, ctx);
                    const [type, a, b] = map[n.op];
                    return '<block type="' + type + '">' + value(a, n.left, ctx) + value(b, n.right, ctx) + '</block>';
                }
                case 'not': return '<block type="operator_not">' + value('OPERAND', n.value, ctx) + '</block>';
                case 'random': return '<block type="operator_random">' + value('FROM', n.low, ctx) + value('TO', n.high, ctx) + '</block>';
                default: return saved(n, false, ctx);
            }
        }
        function list(rows, ctx) {
            if (!rows.length)
                return '';
            const [n, ...rest] = rows;
            let xml;
            switch (n.type) {
                case 'command':
                    xml = native(n, ctx);
                    break;
                case 'set':
                case 'change':
                    xml = '<block type="' + (n.type === 'set' ? 'data_setvariableto' : 'data_changevariableby') + '">' + variable(n.id) + value('VALUE', n.value, ctx) + '</block>';
                    break;
                case 'repeat':
                    xml = '<block type="control_repeat">' + value('TIMES', n.count, ctx) + '<statement name="SUBSTACK">' + list(n.body, ctx) + '</statement></block>';
                    break;
                case 'forever':
                    xml = '<block type="control_forever"><statement name="SUBSTACK">' + list(n.body, ctx) + '</statement></block>';
                    break;
                case 'until':
                case 'while':
                    xml = '<block type="' + (n.type === 'until' ? 'control_repeat_until' : 'control_while') + '">' + value('CONDITION', n.condition, ctx) + '<statement name="SUBSTACK">' + list(n.body, ctx) + '</statement></block>';
                    break;
                case 'if':
                    xml = '<block type="' + (n.else ? 'control_if_else' : 'control_if') + '">' + value('CONDITION', n.condition, ctx) + '<statement name="SUBSTACK">' + list(n.then, ctx) + '</statement>' + (n.else ? '<statement name="SUBSTACK2">' + list(n.else, ctx) + '</statement>' : '') + '</block>';
                    break;
                case 'waitUntil':
                    xml = '<block type="control_wait_until">' + value('CONDITION', n.condition, ctx) + '</block>';
                    break;
                case 'raw':
                    xml = '<block type="control_RunPythonMultiline">' + field('SOURCE', n.source) + '</block>';
                    break;
                case 'print':
                    xml = '<block type="rc_print">' + value('VALUE', n.value, ctx) + '</block>';
                    break;
                case 'procedure': {
                    const f = ast.functions.find(f => f.id === n.id), ids = f.args.map((_, i) => 'arg_' + i + '_' + f.name);
                    xml = '<block type="procedures_call"><mutation proccode="' + esc(procs.get(n.id)) + '" argumentids="' + esc(JSON.stringify(ids)) + '" warp="false"/>' + ids.map((id, i) => value(id, n.args[i], ctx)).join('') + '</block>';
                    break;
                }
                default: xml = saved(n, true, ctx);
            }
            const next = list(rest, ctx);
            return xml.slice(0, -8) + (next ? '<next>' + next + '</next>' : '') + '</block>';
        }
        let xml = '<xml xmlns="http://www.w3.org/1999/xhtml"><variables>' + ast.variables.map(v => '<variable type="" id="' + esc(v.id) + '">' + esc(v.name) + '</variable>').join('') + '</variables><block type="rc_start" x="50" y="50">' + field('TASK', 1) + (ast.body.length ? '<next>' + list(ast.body) + '</next>' : '') + '</block>';
        ast.functions.forEach((f, i) => { const ctx = { args: new Map(f.args.map(a => [a.id, a.name])), ids: new Map(f.args.map((a, i) => [a.id, 'arg:' + procs.get(f.id) + ':' + i])) }; let body = f.body; if (f.result)
            body = [...body, { type: 'return', condition: { type: 'literal', value: true }, value: f.result }]; let def = root.RoboBlocks.procedureXml(f.name, f.args.map(a => a.name), 650, 60 + i * 220); def = def.slice(0, -8) + (body.length ? '<next>' + list(body, ctx) + '</next>' : '') + '</block>'; xml += def; });
        xml += '</xml>';
        return { ...project, workspace: { xml } };
    };
})(globalThis);
