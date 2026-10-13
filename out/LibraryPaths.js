"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLibraryPaths = void 0;
const vscode = require("vscode");
const path = require("path");
async function configureLibraryPaths(stubPath) {
    for (const folder of vscode.workspace.workspaceFolders || []) {
        const config = vscode.workspace.getConfiguration('python.analysis', folder.uri);
        const paths = config.get('extraPaths', []);
        const normal = (p) => process.platform === 'win32' ? path.normalize(p).toLowerCase() : path.normalize(p);
        if (!paths.some(p => normal(p) === normal(stubPath))) {
            await config.update('extraPaths', [stubPath, ...paths], vscode.ConfigurationTarget.WorkspaceFolder);
        }
    }
}
exports.configureLibraryPaths = configureLibraryPaths;
//# sourceMappingURL=LibraryPaths.js.map