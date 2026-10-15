export const SETTINGS_START = '# ---------- Настройки моторов и датчиков ----------';
export const SETTINGS_END = '# --------------------------------------------------';
export type PortKind = 'Motor' | 'Sensor';
export interface PortRow { kind: PortKind; port: number; names: string; }
interface SettingsBlock { start: number; end: number; content: string; }
const KEYWORDS = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const ASSIGNMENT = /^\s*([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*=\s*(\d+)\s*#\s*устройство подключено на порт\s+(Motor|Sensor)\s+(\d+)\s*$/u;
const SIMPLE_ASSIGNMENT = /^([\p{L}_][\p{L}\p{N}\p{M}_]*)\s*=\s*(\d+)\s*(?:#.*)?$/u;
function pythonCode(text: string): string {
    return text.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|#[^\n]*/g, match => match.replace(/[^\r\n]/g, ' '));
}

function readAssignment(line: string, text: string): { name: string; kind: PortKind; port: number } | undefined {
    const annotated = line.match(ASSIGNMENT);
    if (annotated) {
        // The assigned value is authoritative; a stale comment only identifies the kind.
        return { name: annotated[1], kind: annotated[3] as PortKind, port: Number(annotated[2]) };
    }
    const plain = line.match(SIMPLE_ASSIGNMENT);
    if (!plain) return undefined;
    const name = plain[1];
    // Comments are optional. Prefer actual library calls, then familiar device names.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const code = pythonCode(text);
    const motorUse = new RegExp('\\b(?:motor|servo)\\.\\w+\\s*\\(\\s*' + escaped + '\\s*[,)]').test(code);
    const sensorUse = new RegExp('\\b(?:sensor|trace|ai|aicam|display|actuator|rf|iot)\\.\\w+\\s*\\(\\s*' + escaped + '\\s*[,)]').test(code);
    let kind: PortKind | undefined;
    if (motorUse !== sensorUse) kind = motorUse ? 'Motor' : 'Sensor';
    else if (!motorUse && /^(?:m\d+|motor(?:\d|_|$)|мотор)/iu.test(name)) kind = 'Motor';
    else if (!sensorUse && /^(?:s\d+|sensor(?:\d|_|$)|датчик)/iu.test(name)) kind = 'Sensor';
    // Ambiguous assignments stay in the document rather than becoming the wrong device.
    return kind ? { name, kind, port: Number(plain[2]) } : undefined;
}

export function findSettingsBlock(text: string): SettingsBlock | undefined {
    const start = text.indexOf(SETTINGS_START);
    if (start < 0) {
        // A manually written, contiguous block of device assignments needs no separators.
        let offset = 0;
        let first: number | undefined;
        let end = 0;
        const code = pythonCode(text);
        for (const line of text.match(/[^\n]*\n|[^\n]+$/g) || []) {
            if (code.slice(offset, offset + line.length).trim() && readAssignment(line.replace(/\r?\n$/, ''), text)) {
                if (first === undefined) first = offset;
                end = offset + line.replace(/\r?\n$/, '').length;
            } else if (first !== undefined) break;
            offset += line.length;
        }
        return first === undefined ? undefined : { start: first, end, content: text.slice(first, end) };
    }
    const markerEnd = text.indexOf(SETTINGS_END, start + SETTINGS_START.length);
    if (markerEnd < 0) throw new Error('В файле найдено начало блока портов без конца. Восстановите разделитель перед сохранением.');
    if (text.indexOf(SETTINGS_START, start + SETTINGS_START.length) >= 0) throw new Error('В файле несколько блоков портов. Оставьте один блок настроек.');
    const end = markerEnd + SETTINGS_END.length;
    return { start, end, content: text.slice(start, end) };
}

export function getPortRows(text: string, motorPorts: 4 | 8 = 8): PortRow[] {
    const rows: PortRow[] = [];
    for (const kind of ['Motor', 'Sensor'] as PortKind[]) {
        for (let port = 1; port <= (kind === 'Motor' ? motorPorts : 8); port++) rows.push({ kind, port, names: '' });
    }
    const block = findSettingsBlock(text);
    if (!block) return rows;
    for (const line of block.content.split(/\r?\n/)) {
        const match = readAssignment(line, text);
        if (!match) continue;
        const row = rows.find(r => r.kind === match.kind && r.port === match.port);
        if (!row) throw new Error('Некорректный номер порта в строке: ' + line.trim());
        row.names = row.names ? row.names + ', ' + match.name : match.name;
    }
    return rows;
}

export function validatePortRows(value: unknown, motorPorts: 4 | 8 = 8): PortRow[] {
    if (!Array.isArray(value) || value.length !== motorPorts + 8) throw new Error(`Ожидаются настройки ${motorPorts} моторов и 8 датчиков.`);
    const seenPorts = new Set<string>();
    const seenNames = new Set<string>();
    return value.map(item => {
        if (!item || (item.kind !== 'Motor' && item.kind !== 'Sensor') || !Number.isInteger(item.port) || item.port < 1 || item.port > (item.kind === 'Motor' ? motorPorts : 8) || typeof item.names !== 'string') throw new Error('Некорректные данные портов.');
        const key = item.kind + item.port;
        if (seenPorts.has(key)) throw new Error('Порт указан дважды: ' + key);
        seenPorts.add(key);
        const names = item.names.trim() ? item.names.split(',').map((n: string) => n.trim()) : [];
        for (const name of names) {
            if (!/^[\p{L}_][\p{L}\p{N}\p{M}_]*$/u.test(name) || KEYWORDS.has(name)) throw new Error('Недопустимое имя переменной: ' + (name || '(пустое имя)'));
            if (seenNames.has(name)) throw new Error('Имя используется дважды: ' + name);
            seenNames.add(name);
        }
        return { kind: item.kind as PortKind, port: item.port, names: names.join(', ') };
    });
}

// Includes comments, module docstrings and multiline imports in the opening preamble.
export function insertionOffset(text: string): number {
    const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
    let offset = 0;
    let quote = '';
    let depth = 0;
    let continuation = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (quote) {
            if (trimmed.includes(quote)) quote = '';
        } else if (depth || continuation) {
            const code = line.split('#')[0];
            depth += (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
            continuation = /\\\s*$/.test(code);
        } else if (trimmed === SETTINGS_START) break;
        else if (!trimmed || trimmed.startsWith('#')) {
            // Preamble whitespace and comments.
        } else if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
            const q = trimmed.slice(0, 3);
            if (!trimmed.slice(3).includes(q)) quote = q;
        } else if (/^(?:import\s|from\s)/.test(trimmed)) {
            const code = line.split('#')[0];
            depth = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
            continuation = /\\\s*$/.test(code);
        } else break;
        offset += line.length;
    }
    return offset;
}

export function buildPortEdit(text: string, value: unknown, motorPorts: 4 | 8 = 8): { start: number; end: number; replacement: string } {
    const rows = validatePortRows(value, motorPorts);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const old = findSettingsBlock(text);
    const preserved = old ? old.content.split(/\r?\n/).filter(line => line.trim() && line !== SETTINGS_START && line !== SETTINGS_END && !readAssignment(line, text)) : [];
    const retainedNames = new Set(preserved.map(line => line.match(SIMPLE_ASSIGNMENT)?.[1]).filter(Boolean));
    for (const row of rows) {
        for (const name of row.names ? row.names.split(', ') : []) {
            if (retainedNames.has(name)) throw new Error('Имя уже есть в строке, тип устройства которой не определён: ' + name + '. Добавьте к этой строке комментарий Motor или Sensor в формате остальных настроек.');
        }
    }
    const lines = [SETTINGS_START];
    for (const row of rows) {
        for (const name of row.names ? row.names.split(', ') : []) lines.push(`${name} = ${row.port}  # устройство подключено на порт ${row.kind} ${row.port}`);
    }
    lines.push(...preserved, SETTINGS_END);
    const block = lines.join(eol);
    if (old) return { start: old.start, end: old.end, replacement: block };
    const offset = insertionOffset(text);
    const prefix = offset > 0 && !text.slice(0, offset).endsWith('\n') ? eol : '';
    return { start: offset, end: offset, replacement: prefix + block + eol + eol };
}
