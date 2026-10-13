import { insertionOffset } from './PortSettings';

export const LIBRARY_COMMENTS: Readonly<Record<string, string>> = {
    rcu: 'Основная библиотека для управления роботом.',
    motor: 'Библиотека для управления моторами.',
    move: 'Библиотека для работы с колёсной базой робота.',
    servo: 'Библиотека для управления сервоприводами.',
    sensor: 'Библиотека для работы с различными датчиками.',
    ai: 'Библиотека для работы с камерой.',
    trace: 'Библиотека для управления модулем линии.',
    display: 'Библиотека для управления матричным экраном.',
    actuator: 'Библиотека для управления исполнительными устройствами.',
    rf: 'Библиотека для работы с радиомодулем и радиопультом.',
    iot: 'Библиотека для работы с модулем IoT.',
    aicam: 'Библиотека для работы с ИИ-камерой (Е7, порты P7/P8).',
    gyro_lib: 'Библиотека для работы с гироскопом.',
    os: 'Библиотека для работы с файлами и операционной системой.'
};

// Preserve offsets/newlines, but ignore imports in strings, docstrings and comments.
export function maskPythonText(text: string): string {
    return text.replace(/'''[\s\S]*?(?:'''|$)|"""[\s\S]*?(?:"""|$)|'(?:\\.|[^'\\\r\n])*'|"(?:\\.|[^"\\\r\n])*"|#[^\r\n]*/g,
        match => match.replace(/[^\r\n]/g, ' '));
}
function* matches(text: string, pattern: RegExp): IterableIterator<RegExpExecArray> {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) yield match;
}
interface Binding { module?: string; names: Map<string, string>; wildcard?: boolean; }
function moduleBindings(text: string): Map<string, Binding> {
    const bindings = new Map<string, Binding>();
    const get = (module: string): Binding => {
        let binding = bindings.get(module);
        if (!binding) { binding = { names: new Map() }; bindings.set(module, binding); }
        return binding;
    };
    const lines = maskPythonText(text).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        // Imports inside functions/conditions do not supply a module-wide binding.
        if (!/^(?:import\s|from\s)/.test(lines[i])) continue;
        let statement = lines[i];
        let depth = (statement.match(/\(/g) || []).length - (statement.match(/\)/g) || []).length;
        while ((depth > 0 || /\\\s*$/.test(statement)) && i + 1 < lines.length) {
            const line = lines[++i];
            depth += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
            statement = statement.replace(/\\\s*$/, ' ') + ' ' + line.trim();
        }
        for (const part of statement.split(';').map(s => s.trim())) {
            const imported = part.match(/^import\s+(.+)$/);
            if (imported) {
                for (const entry of imported[1].split(',')) {
                    const match = entry.trim().match(/^(\w+)(?:\s+as\s+(\w+))?$/);
                    if (match) get(match[1]).module = match[2] || match[1];
                }
            } else {
                const from = part.match(/^from\s+(\w+)\s+import\s+(.+)$/);
                if (!from) continue;
                const binding = get(from[1]);
                for (const entry of from[2].replace(/[()]/g, '').split(',')) {
                    if (entry.trim() === '*') { binding.wildcard = true; continue; }
                    const match = entry.trim().match(/^(\w+)(?:\s+as\s+(\w+))?$/);
                    if (match) binding.names.set(match[1], match[2] || match[1]);
                }
            }
        }
    }
    return bindings;
}
function importInsertionOffset(text: string): number {
    const preambleEnd = insertionOffset(text);
    const raw = text.slice(0, preambleEnd).match(/[^\n]*\n|[^\n]+$/g) || [];
    const masked = maskPythonText(text.slice(0, preambleEnd)).match(/[^\n]*\n|[^\n]+$/g) || [];
    let offset = 0;
    let lastImportEnd: number | undefined;
    for (let i = 0; i < raw.length; i++) {
        const code = masked[i] || '';
        if (/^(?:import\s|from\s)/.test(code)) {
            let depth = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
            let continued = /\\\s*$/.test(code);
            offset += raw[i].length;
            while ((depth > 0 || continued) && i + 1 < raw.length) {
                const next = masked[++i] || '';
                depth += (next.match(/\(/g) || []).length - (next.match(/\)/g) || []).length;
                continued = /\\\s*$/.test(next);
                offset += raw[i].length;
            }
            lastImportEnd = offset;
        } else offset += raw[i].length;
    }
    return lastImportEnd === undefined ? preambleEnd : lastImportEnd;
}

export interface ImportPlan { snippet: string; offset: number; imports: string; }
export function planCommandImports(text: string, snippet: string): ImportPlan {
    const bindings = moduleBindings(text);
    const required = new Map<string, Set<string>>();
    // Calls, not strings such as "motor.SetMotor" inside example arguments.
    for (const match of matches(maskPythonText(snippet), /\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\s*\(/g)) {
        if (!LIBRARY_COMMENTS[match[1]]) continue;
        if (!required.has(match[1])) required.set(match[1], new Set());
        required.get(match[1])!.add(match[2]);
    }
    const replacements = new Map<string, string>();
    const missing: string[] = [];
    for (const [module, functions] of required) {
        const binding = bindings.get(module);
        if (binding?.module) {
            for (const fn of functions) replacements.set(module + '.' + fn, binding.module + '.' + fn);
        } else if (binding && [...functions].every(fn => binding.wildcard || binding.names.has(fn))) {
            for (const fn of functions) replacements.set(module + '.' + fn, binding.names.get(fn) || fn);
        } else missing.push(module);
    }
    const code = maskPythonText(snippet);
    const edits: { start: number; end: number; text: string }[] = [];
    for (const match of matches(code, /\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)(?=\s*\()/g)) {
        const replacement = replacements.get(match[0]);
        if (replacement) edits.push({ start: match.index!, end: match.index! + match[0].length, text: replacement });
    }
    for (const edit of edits.reverse()) snippet = snippet.slice(0, edit.start) + edit.text + snippet.slice(edit.end);
    const offset = importInsertionOffset(text);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    let imports = missing.map(module => 'import ' + module + '  # ' + LIBRARY_COMMENTS[module]).join(eol);
    if (imports) imports = (offset && !text.slice(0, offset).endsWith('\n') ? eol : '') + imports + eol +
        (offset < text.length && text[offset] !== '\r' && text[offset] !== '\n' ? eol : '');
    return { snippet, offset, imports };
}
