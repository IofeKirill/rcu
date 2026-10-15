#define _TASK_1_ 1
#include "zmrobo.h"

// ---------- Настройки моторов и датчиков ----------
#define LEFT_MOTOR 1   // устройство подключено на порт Motor 1
#define RIGHT_MOTOR 3  // устройство подключено на порт Motor 3
#define LEFT_LIGHT 5   // устройство подключено на порт Sensor 5
#define RIGHT_LIGHT 6  // устройство подключено на порт Sensor 6
// --------------------------------------------------

// Ячейки: 1 — скорость, 2 — kP * 10, 4 — kD.
// Ячейки 5 и 6 — ненулевые значения нормировки датчиков.
float lastDeviation = 0;

float ReadLight(int port) {
    return (float)GetLightSensor(port) / GetData(port);
}

void LinePD(void) {
    float speed = GetData(1);
    float kP = GetData(2) / 10.0f;
    float kD = GetData(4);
    float deviation = ReadLight(LEFT_LIGHT) - ReadLight(RIGHT_LIGHT);
    float pReg = deviation * kP;
    float dReg = (deviation - lastDeviation) * kD;
    float control = pReg + dReg;
    lastDeviation = deviation;

    SetMotor(LEFT_MOTOR, (int)(speed + control));
    SetMotor(RIGHT_MOTOR, (int)(speed - control));
    SetWaitForTime(0.001f);
}

void task1(void) {
    SetLightSensorLed(LEFT_LIGHT, 1);
    SetLightSensorLed(RIGHT_LIGHT, 1);
    while (1) {
        LinePD();
    }
}
