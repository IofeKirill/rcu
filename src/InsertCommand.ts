import * as vscode from 'vscode';
import { planCommandImports } from './PythonImports';

export async function insertCommand(snippet: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'python') throw new Error('Откройте Python-файл для вставки команды.');
    const plan = planCommandImports(editor.document.getText(), snippet);
    if (plan.imports) {
        const version = editor.document.version;
        const applied = await editor.edit(edit => edit.insert(editor.document.positionAt(plan.offset), plan.imports),
            { undoStopBefore: true, undoStopAfter: false });
        if (!applied) throw new Error('Не удалось добавить импорт. Команда не вставлена.');
        if (editor.document.version !== version + 1) throw new Error('Файл изменился во время вставки. Повторите добавление команды.');
    }
    // VS Code moves all editor selections after the import edit; keep snippet tab stops.
    if (!await editor.insertSnippet(new vscode.SnippetString(plan.snippet), undefined,
        { undoStopBefore: !plan.imports, undoStopAfter: true })) throw new Error('Не удалось вставить команду.');
}
