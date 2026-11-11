/* Local Python lexical highlighting. All text is rendered through textContent. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RoboPythonHighlight=factory();})(globalThis,function(){
'use strict';
const keywords=new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const flow=new Set('and as assert async await break continue elif else except finally for from if import in is not or pass raise return try while with yield match case'.split(' '));
const builtins=new Set('abs all any bool dict enumerate filter float int len list map max min next object open pow print range repr reversed round set sorted str sum super tuple type zip'.split(' '));
const identifier=/[\p{L}_][\p{L}\p{N}_]*/uy;
const number=/(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?[\d_]+)?)[jJ]?/y;
const quote=/(?:[rRuUbBfF]{1,2})?("""|'''|"|')/y;
function tokenize(source){
 source=String(source??'');const result=[];let i=0,previous='',depth=0;
 const add=(kind,text)=>{result.push({kind,text});};
 while(i<source.length){
  const start=i,c=source[i];
  if(c==='#'){while(i<source.length&&source[i]!=='\n'&&source[i]!=='\r')i++;add('comment',source.slice(start,i));continue;}
  quote.lastIndex=i;const q=quote.exec(source);
  if(q){const delimiter=q[1];i=quote.lastIndex;while(i<source.length){if(source[i]==='\\'){i=Math.min(source.length,i+2);continue;}if(source.startsWith(delimiter,i)){i+=delimiter.length;break;}if(delimiter.length===1&&/[\r\n]/.test(source[i]))break;i++;}add('string',source.slice(start,i));previous='string';continue;}
  if(/\s/.test(c)){while(i<source.length&&/\s/.test(source[i]))i++;add('',source.slice(start,i));continue;}
  identifier.lastIndex=i;const word=identifier.exec(source);
  if(word){i=identifier.lastIndex;const text=word[0],next=source.slice(i).match(/^\s*(.)/)?.[1];
   const kind=keywords.has(text)?flow.has(text)?'flow':'keyword':previous==='class'?'class':previous==='def'||next==='('?'function':builtins.has(text)?'builtin':text===text.toUpperCase()&&/[\p{L}]/u.test(text)?'constant':'name';
   add(kind,text);previous=text;continue;
  }
  number.lastIndex=i;const n=number.exec(source);if(n){i=number.lastIndex;add('number',n[0]);previous='number';continue;}
  if('([{'.includes(c)){add('bracket-'+depth%3,c);depth++;}
  else if(')]}'.includes(c)){depth=Math.max(0,depth-1);add('bracket-'+depth%3,c);}
  else add('punctuation',c);
  previous=c;i++;
 }
 return result;
}
const cache=new WeakMap();
function render(element,source){source=String(source??'');if(cache.get(element)===source&&element.textContent===source)return;
 const fragment=element.ownerDocument.createDocumentFragment();
 for(const token of tokenize(source)){if(!token.kind){fragment.appendChild(element.ownerDocument.createTextNode(token.text));continue;}const span=element.ownerDocument.createElement('span');span.className='py-'+token.kind;span.textContent=token.text;fragment.appendChild(span);}
 element.replaceChildren(fragment);cache.set(element,source);
}
return {tokenize,render};
});
