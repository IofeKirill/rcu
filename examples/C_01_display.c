#define _TASK_1_ 1  // Запуск первой задачи.
#include "zmrobo.h"  // Библиотека команд E6.

void task1(void) {
    SetDisplayString(1, (int8_t *)"C E6 TEST", 65535, 0);
    // Вывести текст на экран: строка 1, белый текст, чёрный фон.
    SetWaitForTime(1);
    // Подождать одну секунду.
}
