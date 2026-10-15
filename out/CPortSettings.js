"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCPortEdit = exports.getCPortRows = exports.cSettingsBlock = void 0;
const PortSettings_1 = require("./PortSettings");
const start = PortSettings_1.SETTINGS_START.replace(/^#/, '//'), end = PortSettings_1.SETTINGS_END.replace(/^#/, '//');
function cSettingsBlock(text) {
    const first = text.indexOf(start);
    if (first < 0)
        return undefined;
    const last = text.indexOf(end, first + start.length);
    if (last < 0 || text.indexOf(start, first + start.length) >= 0)
        throw new Error('Повреждён блок настройки портов C.');
    return { start: first, end: last + end.length, content: text.slice(first, last + end.length) };
}
exports.cSettingsBlock = cSettingsBlock;
function getCPortRows(text) {
    const block = cSettingsBlock(text);
    const python = (block === null || block === void 0 ? void 0 : block.content.replace(/^\/\//gm, '#').replace(/^\s*#define\s+([A-Za-z_]\w*)\s+(\d+)\s*(?:\/\/([^\r\n]*))?$/gm, (_match, name, port, comment) => name + ' = ' + port + (comment ? ' # ' + comment : ''))) || '';
    return (0, PortSettings_1.getPortRows)(python, 4);
}
exports.getCPortRows = getCPortRows;
function buildCPortEdit(text, rows) {
    var _a;
    const block = cSettingsBlock(text);
    const parsed = getCPortRows(text);
    const original = PortSettings_1.SETTINGS_START + '\n' + parsed.flatMap(row => row.names.split(',').map(name => name.trim()).filter(Boolean).map(name => name + ' = ' + row.port + ' # устройство подключено на порт ' + row.kind + ' ' + row.port)).join('\n') + '\n' + PortSettings_1.SETTINGS_END;
    const edit = (0, PortSettings_1.buildPortEdit)(original, rows, 4);
    const keywords = new Set('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex _Imaginary'.split(' '));
    for (const line of edit.replacement.split(/\r?\n/)) {
        const name = (_a = /^([^#\s]+)\s*=/.exec(line)) === null || _a === void 0 ? void 0 : _a[1];
        if (name && (!/^[A-Za-z_]\w*$/.test(name) || keywords.has(name)))
            throw new Error('Введите корректное имя устройства C латинскими буквами: ' + name);
    }
    let replacement = edit.replacement.replace(/^# /gm, '// ').replace(/^([A-Za-z_]\w*)\s*=\s*(\d+)\s*#\s*(.*)$/gm, '#define $1 $2  // $3');
    if (/^[^\r\n]*[а-яА-ЯёЁ][^\r\n]*=/m.test(edit.replacement))
        throw new Error('В C используйте латинские имена устройств.');
    if (block) {
        const known = new Set(parsed.flatMap(row => row.names.split(',').map(name => name.trim()).filter(Boolean)));
        const extras = block.content.split(/\r?\n/).slice(1, -1).filter(line => {
            var _a;
            const name = (_a = /^\s*#define\s+([A-Za-z_]\w*)\s+/.exec(line)) === null || _a === void 0 ? void 0 : _a[1];
            return line.trim() && !(name && known.has(name));
        });
        if (extras.length)
            replacement = replacement.replace(end, extras.join('\n') + '\n' + end);
    }
    if (block)
        return { start: block.start, end: block.end, replacement };
    const includes = /^(?:\s*#(?:include|define)[^\r\n]*\r?\n)+/.exec(text);
    const offset = (includes === null || includes === void 0 ? void 0 : includes[0].length) || 0;
    return { start: offset, end: offset, replacement: '\n' + replacement + '\n\n' };
}
exports.buildCPortEdit = buildCPortEdit;
//# sourceMappingURL=CPortSettings.js.map