"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionIcon = void 0;
const path = require("path");
function connectionIcon(status) {
    const color = status === 'connected' ? 'green' : status === 'connecting' ? 'yellow' : 'red';
    const file = path.join(__dirname, '..', 'media', 'connection-' + color + '.svg');
    return { light: file, dark: file };
}
exports.connectionIcon = connectionIcon;
//# sourceMappingURL=ConnectionIcons.js.map