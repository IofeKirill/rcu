"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramExamples = void 0;
const fs = require("fs");
const path = require("path");
const CommandCatalog_1 = require("./CommandCatalog");
const WebviewUtils_1 = require("./WebviewUtils");
const HelpFormatting_1 = require("./HelpFormatting");
function getProgramExamples(commandId, extensionPath, label, controller) {
    var _a;
    const definition = CommandCatalog_1.COMMANDS[commandId];
    const title = (0, WebviewUtils_1.escapeHtml)(label || (definition === null || definition === void 0 ? void 0 : definition.label) || commandId);
    const filePath = path.join(extensionPath, 'commands-info.html');
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        // Sections have unique div IDs and contain no nested divs.
        const escapedId = commandId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = html.match(new RegExp('<div\\s+id="' + escapedId + '"[^>]*>([\\s\\S]*?)</div>'));
        const isH = controller === 'H-RCU';
        const content = match ? match[1] : `<h1>${title}</h1><p>${isH ? 'Подробная справка для H не заполнена.' : 'Подробная справка для этой команды пока не заполнена.'}</p>${definition ? '<pre><code>' + (0, WebviewUtils_1.escapeHtml)(definition.snippet.replace(/\$\{\d+\|([^}]+)\|\}/g, (_match, choices) => choices.split(',')[0]).replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\d+/g, '')) + '</code></pre>' : ''}`;
        const style = ((_a = html.match(/<style>([\s\S]*?)<\/style>/)) === null || _a === void 0 ? void 0 : _a[1]) || '';
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><title>${title}</title><style>${style}\n${HelpFormatting_1.HELP_STYLE}</style></head><body><main>${(0, HelpFormatting_1.formatHelpContent)(content)}</main></body></html>`;
    }
    catch (error) {
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>${HelpFormatting_1.HELP_STYLE}</style></head><body><main><h1>${title}</h1><p>Не удалось прочитать справку: ${(0, WebviewUtils_1.escapeHtml)(error instanceof Error ? error.message : String(error))}</p></main></body></html>`;
    }
}
exports.getProgramExamples = getProgramExamples;
//# sourceMappingURL=getProgramExamples.js.map