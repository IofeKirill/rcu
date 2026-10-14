"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_STYLE = exports.formatHelpContent = exports.highlightPython = void 0;
const WebviewUtils_1 = require("./WebviewUtils");
const keywords = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const builtins = new Set('abs all any bool dict enumerate float int isinstance len list max min open print range round set sorted str sum tuple zip'.split(' '));
function highlightPython(source) {
    const tokens = /#[^\r\n]*|[rRuUbBfF]{0,3}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*')|\b(?:0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)\b|\b[A-Za-z_]\w*\b/g;
    let result = '', offset = 0;
    let match;
    while ((match = tokens.exec(source)) !== null) {
        const start = match.index;
        result += (0, WebviewUtils_1.escapeHtml)(source.slice(offset, start));
        const token = match[0];
        let kind;
        if (token.startsWith('#'))
            kind = 'comment';
        else if (/^[rRuUbBfF]{0,3}['"]/.test(token))
            kind = 'string';
        else if (/^\d/.test(token))
            kind = 'number';
        else if (keywords.has(token))
            kind = 'keyword';
        else if (builtins.has(token))
            kind = 'builtin';
        else if (/^\s*\(/.test(source.slice(start + token.length)))
            kind = 'function';
        result += kind ? `<span class="py-${kind}">${(0, WebviewUtils_1.escapeHtml)(token)}</span>` : (0, WebviewUtils_1.escapeHtml)(token);
        offset = start + token.length;
    }
    return result + (0, WebviewUtils_1.escapeHtml)(source.slice(offset));
}
exports.highlightPython = highlightPython;
function decodeCode(code) {
    return code.replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[\da-fA-F]+);/g, entity => {
        const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" };
        if (named[entity] !== undefined)
            return named[entity];
        const number = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
        return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
    });
}
function formatHelpContent(content) {
    return content.replace(/<pre\b([^>]*)>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_match, attributes, code) => `<pre${attributes}><code>${highlightPython(decodeCode(code).replace(/^\r?\n/, '').replace(/\r?\n$/, ''))}</code></pre>`);
}
exports.formatHelpContent = formatHelpContent;
exports.HELP_STYLE = `
body{font-family:var(--vscode-font-family,Arial,sans-serif);font-size:16px;color:var(--vscode-editor-foreground,#f8f8f2);background:var(--vscode-editor-background,#1e1e1e);margin:0;padding:24px;line-height:1.65}
main{max-width:1050px}h1{color:#66d9ef;font-size:26px;line-height:1.3;font-weight:700;margin:0 0 22px}h2{color:#a6e22e;font-size:21px;margin:30px 0 12px}h3{color:#fd971f;font-size:18px;margin:24px 0 10px}p{margin:14px 0}strong{color:#fd971f;font-weight:650}
pre{background:var(--vscode-textCodeBlock-background,#272822);border:1px solid var(--vscode-panel-border,#454545);border-radius:8px;padding:18px;margin:16px 0 24px;overflow:auto;white-space:pre;box-shadow:none}
code{font-family:var(--vscode-editor-font-family,Consolas,monospace);font-size:15px;color:#a6e22e;background:var(--vscode-textCodeBlock-background,#272822);padding:2px 5px;border-radius:3px}
pre code{display:block;line-height:1.6;color:var(--vscode-editor-foreground,#f8f8f2);background:transparent;padding:0;border-radius:0;font-size:15px;white-space:inherit}
.py-keyword{color:#f92672;font-weight:600}.py-string{color:#e6db74}.py-number{color:#ae81ff}.py-function{color:#a6e22e}.py-builtin{color:#66d9ef}.py-comment{color:#91a17b;font-style:italic}
table{border-collapse:collapse;width:100%;margin:20px 0}th,td{border:1px solid var(--vscode-panel-border,#454545);padding:10px 12px;text-align:left}th{background:var(--vscode-textCodeBlock-background,#272822);font-weight:650}a{color:var(--vscode-textLink-foreground,#66d9ef)}
body.vscode-light h1{color:#006b87}body.vscode-light h2{color:#427500}body.vscode-light h3,body.vscode-light strong{color:#a94e00}body.vscode-light code{color:#427500}body.vscode-light pre code{color:var(--vscode-editor-foreground,#222)}
body.vscode-light .py-keyword{color:#a31576}body.vscode-light .py-string{color:#8d5700}body.vscode-light .py-number{color:#7052c0}body.vscode-light .py-function{color:#427500}body.vscode-light .py-builtin{color:#006b87}body.vscode-light .py-comment{color:#507044}
body.vscode-high-contrast h1,body.vscode-high-contrast h2,body.vscode-high-contrast h3,body.vscode-high-contrast strong,body.vscode-high-contrast code,body.vscode-high-contrast .py-keyword,body.vscode-high-contrast .py-string,body.vscode-high-contrast .py-number,body.vscode-high-contrast .py-function,body.vscode-high-contrast .py-builtin,body.vscode-high-contrast .py-comment{color:var(--vscode-editor-foreground);font-weight:650}
`;
//# sourceMappingURL=HelpFormatting.js.map