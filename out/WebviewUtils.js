"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = exports.nonce = void 0;
const crypto_1 = require("crypto");
function nonce() { return (0, crypto_1.randomBytes)(16).toString('hex'); }
exports.nonce = nonce;
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
exports.escapeHtml = escapeHtml;
//# sourceMappingURL=WebviewUtils.js.map