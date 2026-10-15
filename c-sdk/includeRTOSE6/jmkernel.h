#ifndef  _JMKERNEL_H_
#define  _JMKERNEL_H_

#include "stm32f4xx_hal.h"
#include "stm32f4xx.h"
#include <stdint.h>

typedef char* string;

//定义空操作,统一MDK于GCC
#if defined (KEIL)//
#define _NOP()	__nop
#elif defined (IAR)
#define _NOP()	asm("NOP")
#else //GCC
#define _NOP()	asm("nop")
#endif

#define _TOUCH_TO_SCREEN_EN_ 1u//屏幕转换使能控制
// #ifdef __JMDK_DATA
// #define __JMDK_DATA
// #ifndef __JMDK_DATA_EXT
// #define __JMDK_DATA_EXT
// volatile uint8_t g_MotorPowerFlag=0;
// volatile uint8_t g_M1SpeedPer=100,g_M2SpeedPer=100,g_M3SpeedPer=100,g_M4SpeedPer=100;//调节马达输出的速度的百分比
// volatile uint8_t g_LcdBackLignt=1;//默认背光灯亮
// #endif
// #endif
extern volatile uint8_t g_MotorPowerFlag;
extern volatile uint8_t g_M1SpeedPer,g_M2SpeedPer,g_M3SpeedPer,g_M4SpeedPer;//调节马达输出的速度的百分比
extern volatile uint8_t g_LcdBackLignt;//默认背光灯亮
extern int Velocity_Motor[4];

extern unsigned char random_64bytes[64];
extern uint8_t nfc_data[12];
extern uint8_t Encryption_Num;
extern uint8_t NFCRecBuf[14];

#if _TOUCH_TO_SCREEN_EN_ > 0
extern volatile uint8_t TTSC_Flag;
#endif


//用户中断向量表
#define USERISR_IRQ_SIZE	16//中断向量个数
typedef enum
{
	TIM1UPIRQ,	//0
	TIM2IRQ,	//1
	TIM8UPIRQ,	//2
	TIM8TRGIRQ,	//3
	TIM8COMIRQ,	//4
	EXTI0IRQ,	//5
	EXTI1IRQ,	//6
	EXTI2IRQ,	//7
	EXTI3IRQ,	//8
	EXTI4IRQ,	//9
	EXTI10IRQ,	//10
	EXTI11IRQ,	//11
	EXTI12IRQ,	//12
	EXTI13IRQ,	//13
	EXTI14IRQ,	//14
	EXTI15IRQ	//15
}USERFUNTON_DEFINED;

typedef enum
{
	TONE_D1 = 294,
	TONE_D2 = 330,
	TONE_D3 = 350,
	TONE_D4 = 393,
	TONE_D5 = 441,
	TONE_D6 = 495,
	TONE_D7 = 556,
	TONE_GH3 = 990,
	TONE_HH3 = 1976,
	TONE_CH1 = 294,
	TONE_CH2 = 589,
	TONE_CH3 = 661,
	TONE_CH4 = 700,
	TONE_CH5 = 786,
	TONE_CH6 = 882,
	TONE_CH7 = 990,
	TONE_DH7 = 1112
}BEEPMUSIC_DEFINED;

/*
typedef struct
{
	int x, y;
	char *filename;
	char scale;
	int state;//显示状态
} Pic_Typedef;//*/
typedef void (*pUserFunction)(void);//用户函数指针

extern uint8_t TraceThresholdState;
extern uint8_t TraceLineColor[8];

extern volatile uint8_t move_left_port;
extern volatile int32_t move_temporaryVar;
extern volatile uint8_t move_right_port;


void E6RCU_Init(void);
void GPIO_Setting(GPIO_TypeDef* port,uint16_t pin,uint32_t mode);//GPIO_NOPULL
void GPIO_Setting2(GPIO_TypeDef* port,uint16_t pin,uint32_t mode);//GPIO_PULLUP
void BeepInit(void);
void Beep(uint8_t state);
uint8_t ADC_Configuration(uint32_t SimpleTime,uint8_t channel) ;
uint16_t GetAdcResult(uint8_t channel);
void EepAdr_Init(void);
uint16_t ReadEEP(uint16_t address);
void WriteEEP(uint16_t address,uint16_t data);
uint8_t  SystemTime_init(void);
uint8_t SystemRTC_init(void);
void SetSystemTime(void);
uint32_t GetSystemTime(void);
void delayTenthms(uint32_t Tenthms);
void Delay1ms(float ms);
void Sysdelayus(volatile uint32_t nCount);
uint16_t ReadMotorDir(uint16_t ch);
uint8_t Motor_Init(void);
void Set_Motor_Speed(which,speed);
void MotorFree(uint8_t MotorX);
void SetMotorX(uint8_t MotorX,int8_t Dir,int8_t Speed);
void Set_Motor_Speed(which,speed);
int32_t ReadMotorCnt(uint8_t which);
void ClearMotorCnt(uint8_t which);
uint8_t MotorCodingInit(void);
void SetMotorServoMode(uint8_t MotorX);
void SetMotorNormalMode(uint8_t MotorX);
void MotorCoding_Istr(void);
void SetMotorCnt1Zero(void);
void SetMotorCnt2Zero(void);
void SetMotorCnt3Zero(void);
void SetMotorCnt4Zero(void);
volatile int32_t GetMotorCnt1(void);
volatile int32_t GetMotorCnt2(void);
volatile int32_t GetMotorCnt3(void);
volatile int32_t GetMotorCnt4(void);
void SetCodeServoAngle(uint8_t MotorX,uint8_t speed,uint32_t Angle);
uint8_t GetTouchValid(void);
uint16_t GetTouchY(void);
uint16_t GetTouchX(void);
uint8_t ReadTouchState(void);
void SetComData(uint8_t data);
uint32_t GetCOMPackData(uint8_t cmd);
void SetCOMByteData(uint8_t cmd0,uint8_t cmd1);
void SetCOMByteData2(uint8_t cmd0,uint8_t cmd1);
void SetCOMSwitchData(uint8_t num,uint8_t data);
uint32_t GetCOMPackData(uint8_t cmd);
uint8_t GPIO_AdcLed2State(uint8_t which,GPIO_TypeDef *GPIOx,uint8_t Bitx,uint16_t adc,uint8_t mode);//设置引脚状态
uint16_t ReadInMicVaule(void);
uint16_t ReadInVoltageVaule(void);
void os_task_enter_critical(void);
void os_task_exit_critical(void);
void SetMachineCodeCMD(void);
void SetCOMSOMEData(uint8_t num);
uint32_t JmdRand(void);
char *inttostr(double num);
uint16_t ReadLangu(void);
//////////////////END/////////////////////////


// void MotorPid_Init(uint8_t which);
// void Set_Motor_Pid_State(uint8_t which,uint8_t state);
void Set_Motor_Pid_Speed(uint8_t which,int speed);
long Get_pid_motor_speed(uint8_t which);
void Set_Motor_Pid_Init_Sarameter(uint8_t which);
void Set_Motor_Pid_Sarameter(uint8_t which,int code,double P,double I,double D);

void Set_TraceV2I2CLineColor(uint8_t which,uint8_t color);
void SetComServoAngleAdjustFlag(uint8_t ServoX, uint8_t flag);
void ResetServoAngle(uint8_t ServoX);

void Set_Motor_Code(uint8_t which);
int32_t Get_Motor_Code(uint8_t which);
void Set_Motor_X(uint8_t which,int speed);
void Set_Motor_Const_Speed(uint8_t which,int speed);
void Change_Motor_Dir(uint8_t which,uint8_t dir);
void Set_Wait_For_Angle(uint8_t which,int speed,int32_t Angle);
void Set_For_Angle(uint8_t which,int speed,int32_t Angle);
void Move_Speed(int32_t speedl,int32_t speedr);
void Move_Stop();
void Move_Power(int32_t speedl,int32_t speedr);

void Beep_Play_Music(uint8_t music_num);

int16_t NFCShow(void);
#endif
