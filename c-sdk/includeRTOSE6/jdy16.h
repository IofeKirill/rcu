#ifndef _JDY16_H_
#define _JDY16_H_

#include "stm32f4xx_hal.h"
#include "stm32f4xx.h"
#include <stdint.h>

extern uint8_t BTName[20];
volatile uint8_t BTroker2RcuData[16];
uint8_t BlueTH_Init(uint32_t baud);
void BlueTH_SetATmode(uint8_t stat);
void BlueTH_RX_ISR(void);
void BluetoothProcess(void);
void RockerDelayTimInit(void);
uint8_t BlueTH_IsConnect(void);
void JDY16_GetName(void);

void JDY16_Rename(char *name);
void JDY16_Broadcast(uint8_t stat);
void JDY16_SetMode(uint8_t mode);
void JDY16_MasterNameConnect(const char * name);
void JDY16_SelectMode(uint8_t state);

#endif