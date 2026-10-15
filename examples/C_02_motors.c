#define _TASK_1_ 1
#include "zmrobo.h"

// ---------- Настройки моторов и датчиков ----------
#define LEFT_MOTOR 1  // устройство подключено на порт Motor 1
#define RIGHT_MOTOR 3  // устройство подключено на порт Motor 3
// --------------------------------------------------

void task1(void) {
    int speed = GetData(1);
    // Скорость из первой ячейки памяти.
    SetMotor(LEFT_MOTOR, speed);
    SetMotor(RIGHT_MOTOR, speed);
    SetWaitForTime(1);
    SetMotorStop(LEFT_MOTOR);
    SetMotorStop(RIGHT_MOTOR);
}
