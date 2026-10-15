import { getPortRows, buildPortEdit, SETTINGS_START, SETTINGS_END } from './PortSettings';
const start = SETTINGS_START.replace(/^#/, '//'), end = SETTINGS_END.replace(/^#/, '//');
export function cSettingsBlock(text: string): {start:number;end:number;content:string} | undefined {
    const first=text.indexOf(start);
    if(first<0)return undefined;
    const last=text.indexOf(end,first+start.length);
    if(last<0 || text.indexOf(start,first+start.length)>=0)throw new Error('Повреждён блок настройки портов C.');
    return {start:first,end:last+end.length,content:text.slice(first,last+end.length)};
}
export function getCPortRows(text: string): ReturnType<typeof getPortRows> {
    const block=cSettingsBlock(text);
    const python=block?.content.replace(/^\/\//gm,'#').replace(/^\s*#define\s+([A-Za-z_]\w*)\s+(\d+)\s*(?:\/\/([^\r\n]*))?$/gm,
        (_match,name:string,port:string,comment:string)=>name+' = '+port+(comment?' # '+comment:'')) || '';
    return getPortRows(python, 4);
}
export function buildCPortEdit(text:string,rows:unknown): {start:number;end:number;replacement:string} {
    const block=cSettingsBlock(text);
    const parsed=getCPortRows(text);
    const original=SETTINGS_START+'\n'+parsed.flatMap(row=>row.names.split(',').map(name=>name.trim()).filter(Boolean).map(name=>
        name+' = '+row.port+' # устройство подключено на порт '+row.kind+' '+row.port)).join('\n')+'\n'+SETTINGS_END;
    const edit=buildPortEdit(original,rows,4);
    const keywords=new Set('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex _Imaginary'.split(' '));
    for(const line of edit.replacement.split(/\r?\n/)) {
        const name=/^([^#\s]+)\s*=/.exec(line)?.[1];
        if(name && (!/^[A-Za-z_]\w*$/.test(name)||keywords.has(name)))throw new Error('Введите корректное имя устройства C латинскими буквами: '+name);
    }
    let replacement=edit.replacement.replace(/^# /gm,'// ').replace(/^([A-Za-z_]\w*)\s*=\s*(\d+)\s*#\s*(.*)$/gm,'#define $1 $2  // $3');
    if(/^[^\r\n]*[а-яА-ЯёЁ][^\r\n]*=/m.test(edit.replacement))throw new Error('В C используйте латинские имена устройств.');
    if(block) {
        const known=new Set(parsed.flatMap(row=>row.names.split(',').map(name=>name.trim()).filter(Boolean)));
        const extras=block.content.split(/\r?\n/).slice(1,-1).filter(line=> {
            const name=/^\s*#define\s+([A-Za-z_]\w*)\s+/.exec(line)?.[1];
            return line.trim() && !(name && known.has(name));
        });
        if(extras.length) replacement=replacement.replace(end,extras.join('\n')+'\n'+end);
    }
    if(block)return {start:block.start,end:block.end,replacement};
    const includes=/^(?:\s*#(?:include|define)[^\r\n]*\r?\n)+/.exec(text);
    const offset=includes?.[0].length||0;
    return {start:offset,end:offset,replacement:'\n'+replacement+'\n\n'};
}
