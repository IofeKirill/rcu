const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {highlightPython,formatHelpContent}=require('../out/HelpFormatting');
const {getProgramExamples}=require('../out/getProgramExamples');
const plain=html=>html.replace(/<span class="py-[^"]+">|<\/span>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
test('Python code highlighting preserves strings, comments and source characters',()=>{
 const source='import motor\n# 50 inside comment\nmotor.SetMotor(2, 50)\nif value < 10:\n    print("# not a comment <tag>")\n';
 const html=highlightPython(source);
 assert.equal(plain(html),source);
 assert.match(html,/<span class="py-keyword">import<\/span>/);
 assert.match(html,/<span class="py-function">SetMotor<\/span>/);
 assert.match(html,/<span class="py-number">50<\/span>/);
 assert.match(html,/<span class="py-comment"># 50 inside comment<\/span>/);
 assert.match(html,/<span class="py-string">&quot;# not a comment &lt;tag&gt;&quot;<\/span>/);
});
test('Triple-quoted and prefixed strings keep embedded comments and code inert',()=>{
 const source='x = """<script>alert(1)</script>\n# text\n"""\ny = r"C:\\path"\nz = 0xFFE0\n';
 const html=highlightPython(source);
 assert.equal(plain(html),source);assert.doesNotMatch(html,/<script>/);
 assert.equal((html.match(/py-string/g)||[]).length,2);
 assert.doesNotMatch(html,/py-comment/);assert.match(html,/py-number">0xFFE0/);
});
test('Only code blocks are highlighted and entities are decoded exactly once',()=>{
 const content='<h1>Title</h1><p>value &lt; 10</p><pre><code>print(&quot;&amp;lt;&quot;)\nif x &lt; 5: pass</code></pre>';
 const html=formatHelpContent(content);
 assert.ok(html.startsWith('<h1>Title</h1><p>value &lt; 10</p>'));
 const code=html.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/)[1];
 assert.equal(plain(code),'print("&lt;")\nif x < 5: pass');
});
test('Help pages restore hierarchy and static code colors without scripts or remote dependencies',()=>{
 for(const id of ['motor.SetMotorStop','aicam.guide','nonexistent']){
  const html=getProgramExamples(id,path.join(__dirname,'..'));
  assert.match(html,/h1\{color:#66d9ef;font-size:26px/);
  assert.match(html,/body\.vscode-light/);
  assert.match(html,/default-src 'none'/);
  assert.doesNotMatch(html,/<script|<link[^>]+https:/);
  if(id!=='nonexistent')assert.match(html,/<span class="py-/);
 }
});
