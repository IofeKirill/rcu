
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export function getProgramExamples(commandId: string):  string {
    const filePath = path.join(__dirname, '..', 'commands-info.html');  // Путь к файлу в вашем расширении
    try {
        let htmlContent = fs.readFileSync(filePath, 'utf8');  // Считывание содержимого файла
        // Добавляем скрипт для отображения нужного блока по id
        htmlContent += `
        <script>
            document.getElementById('${commandId}').style.display = 'block';
        </script>`;

        return htmlContent;
    } catch (error) {
        return `<p>Ошибка при загрузке файла: ${error.message}</p>`;  // Обработка ошибок чтения файла
        }
}