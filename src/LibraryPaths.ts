import * as vscode from 'vscode';
import * as path from 'path';

export async function configureLibraryPaths(stubPath: string): Promise<void> {
    for (const folder of vscode.workspace.workspaceFolders || []) {
        const config = vscode.workspace.getConfiguration('python.analysis', folder.uri);
        const paths = config.get<string[]>('extraPaths', []);
        const normal = (p: string): string => process.platform === 'win32' ? path.normalize(p).toLowerCase() : path.normalize(p);
        if (!paths.some(p => normal(p) === normal(stubPath))) {
            await config.update('extraPaths', [stubPath, ...paths], vscode.ConfigurationTarget.WorkspaceFolder);
        }
    }
}
