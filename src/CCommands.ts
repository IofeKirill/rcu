import { COMMANDS, CommandDefinition } from './CommandCatalog';
import { ERCU_TREE, NodeDesc } from './CommandTrees';
import { C_SIGNATURES, C_UNAVAILABLE } from './CSDK';

export const C_COMMANDS: Record<string, CommandDefinition & { signature: string; name: string }> = {};
const byName = new Map(C_SIGNATURES.map(item => [item.name, item]));
for (const item of C_SIGNATURES) {
    if(C_UNAVAILABLE.has(item.name))continue;
    const python = Object.values(COMMANDS).find(command => command.label === item.name + '()');
    const parameters = item.parameters === 'void' || !item.parameters ? [] : item.parameters.split(',').map(part => part.trim());
    const reading = /^(Get|BluetoothGet)/.test(item.name) && item.returnType !== 'void';
    const argumentsSnippet = parameters.map((part, index) => {
        const name = part.match(/([A-Za-z_]\w*)\s*(?:\[.*\])?$/)?.[1] || 'value';
        const value = /\*/.test(part) ? /char|string|int8_t/.test(part) ? '"hello"' : 'NULL'
            : /time|sec/i.test(name) ? '1' : /speed|power/i.test(name) ? '30' : /axis|direction|state|cmd|mode/i.test(name) ? '0' : '1';
        return '${' + (index + (reading ? 2 : 1)) + ':' + value + '}';
    }).join(', ');
    C_COMMANDS['c.' + item.name] = {
        name: item.name, label: item.name + '()',
        description: python?.description || 'Команда из C-библиотеки E6. Параметры: ' + (item.parameters || 'нет'),
        signature: item.returnType + ' ' + item.name + '(' + (item.parameters || 'void') + ')',
        snippet: (reading ? item.returnType + ' ${1:value} = ' : '') + item.name + '(' + argumentsSnippet + ');'
    };
}
Object.assign(C_COMMANDS, {
    'c.if': {name:'if',label:'if',description:'Выполнить блок при истинном условии.',signature:'if (condition)',snippet:'if (${1:condition}) {\n    ${2}\n}'},
    'c.ifElse': {name:'if',label:'if / else',description:'Выбор одного из двух блоков.',signature:'if (condition) / else',snippet:'if (${1:condition}) {\n    ${2}\n} else {\n    ${3}\n}'},
    'c.while': {name:'while',label:'while',description:'Повторять блок, пока условие истинно.',signature:'while (condition)',snippet:'while (${1:1}) {\n    ${2}\n}'},
    'c.for': {name:'for',label:'for',description:'Повторить блок заданное число раз.',signature:'for (int i = 0; i < count; ++i)',snippet:'for (int ${1:i} = 0; ${1:i} < ${2:10}; ++${1:i}) {\n    ${3}\n}'},
    'c.function': {name:'function',label:'Функция',description:'Создать функцию C.',signature:'void function(void)',snippet:'void ${1:functionName}(void) {\n    ${2}\n}'},
    'c.break': {name:'break',label:'break',description:'Выйти из текущего цикла.',signature:'break;',snippet:'break;'}
});

const used = new Set<string>();
const convert = (nodes: NodeDesc[]): NodeDesc[] => nodes.flatMap<NodeDesc>(node => {
    if (node.children) {
        const children = convert(node.children);
        return children.length ? [{label:node.label, children}] : [];
    }
    const name = node.commandId?.split('.').pop();
    if (!name || !byName.has(name) || C_UNAVAILABLE.has(name) || used.has(name)) return [];
    used.add(name); return [{label:name+'()', commandId:'c.'+name}];
});
export const C_TREE: NodeDesc[] = convert(ERCU_TREE.filter(node => node.label !== 'Циклы, условия и функции'));
const extra = C_SIGNATURES.filter(item => !used.has(item.name) && !C_UNAVAILABLE.has(item.name)).map(item => ({label:item.name+'()',commandId:'c.'+item.name}));
if (extra.length) C_TREE.push({label:'Дополнительные команды C',children:extra});
C_TREE.push({label:'Циклы, условия и функции',children:Object.keys(C_COMMANDS).filter(id => !id.slice(2).match(/^[A-Z]/)).map(id => ({label:C_COMMANDS[id].label,commandId:id}))});
