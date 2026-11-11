'use strict';const test=require('node:test'),assert=require('node:assert/strict'),{tokenize}=require('../media/python-highlight');
test('Python highlighting preserves multiline strings, escapes, Unicode and numeric literals',()=>{
 const source='def Read(порт):\n    text = r"a\\\\b"\n    doc = """# inside\nstring"""\n    # real comment\n    return 0xFF + .25e-2 + порт\n';const tokens=tokenize(source);
 assert.equal(tokens.map(t=>t.text).join(''),source);assert.equal(tokens.filter(t=>t.kind==='comment').length,1);assert.ok(tokens.some(t=>t.kind==='string'&&t.text.includes('# inside\nstring')));assert.ok(tokens.some(t=>t.kind==='number'&&t.text==='0xFF'));assert.ok(tokens.some(t=>t.kind==='number'&&t.text==='.25e-2'));assert.ok(tokens.some(t=>t.kind==='name'&&t.text==='порт'));
});
