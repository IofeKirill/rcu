//***************************(C) COPYRIGHT 2019 LXW******************************
//*******************************************************************************
// File Name   	: jmdisr.h
// Version		  : V0.0
// Compiler		  : GCCARM
// Target		    : E6RCU (STM32F407VGXX)
// Author		    : LXW
// Date			    : 2019/3/20
// Description  : 系统中断函数管理文件，所有中断函数在这里同一管理,这个文件不开放
//                已使用中断函数放在stm32f4xx_it.c,中断函数名为已经定义的函数,
//                在这个文件重新定义的中断函数是为实际为空函数，用于调用勾函数,如
//                果勾函数没有指向任何函数(指的是中断处理函数),则该函数为空,中断函
//                数统一由函数SetSysISRHookFun指向，注意中断函数不要定义错误!
//*******************************************************************************
// hook 函数避免不用到的中断占资源
//*******************************************************************************
#ifndef __JMDISR_H
#define __JMDISR_H
//** defined ********************************************************************
//预处理
#define __ISR_HOOK_EN		1//使能中断函数勾函数
//其它定义
#ifndef NULL
#define NULL ((void *)0)
#endif

#define SET_FUN_HOOK(hook,inhook)	if(hook!=inhook)hook=inhook;
//funtion
//已定义的中断函数,中断函数统一定义为:XX_ISR(),在stm32fxxx_it.c中声明了中断函数，
//同时需要在这里声明，并且将函数包含到stm32fxxx_it.c声明的中断函数实体中
void USART1_ISR(void);
void USART2_ISR(void);
void USART3_ISR(void);
void EXTI9_5_ISR(void);
//void TIM3_ISR(void);
//void TIM5_ISR(void);
//void TIM4_ISR(void);
void TIM7_ISR(void);
void TIM9_ISR(void);

//includes
void MotorCoding_Istr(void);//编码器
void UART1_RX_ISR(void);//WIFI
void BlueTH_RX_ISR(void);
void UART2_RX_ISR(void);//P8 串口
void PID_ISR(void);//轮走直线
void JS_RXD_ISR(void);//蓝牙
void RockerDelay_ISR(void);//蓝牙手柄
void JS_TIM_ISR(void);//无线手柄
void InMusicDelay_ISR(void);//音乐播放
void ComServo_ISR(void);//伺服调速

void Motor1_MCPid_Isr(void);
void Motor2_MCPid_Isr(void);
void Motor3_MCPid_Isr(void);
void Motor4_MCPid_Isr(void);

void ReadIRISR(void);
void SendIRISR(void);

void MP3_RX_ISR(void);
//***中断函数勾函数************************************************************************
//勾函数可以重定向,可开放给用户用于
#if __ISR_HOOK_EN > 0
//定义的中断勾函数
//定义规则:以sys开头,isr_hook结尾即sys_name_isr_hook,name=外设名称 i2c/SPI/UART/EXTI...
//串口
void (*sys_usart2_isr_hook)();
void (*sys_usart1_isr_hook)();
void (*sys_usart3_isr_hook)();
//外部中断
void (*sys_exti15_10_isr_hook)();
void (*sys_exti9_5_isr_hook)();
//定时器
//void (*sys_timer3_isr_hook)();
//void (*sys_timer4_isr_hook)();
//void (*sys_timer5_isr_hook)();
void (*sys_timer7_isr_hook)();
void (*sys_timer1_up_isr_hook)();
void (*sys_timer9_isr_hook)();
void (*sys_timer10_isr_hook)();
void (*sys_timer12_isr_hook)();

//以下用于2轮走直线，放在编码器中断里面
void (*sys_motor1pid_isr_hook)();
void (*sys_motor2pid_isr_hook)();
void (*sys_motor3pid_isr_hook)();
void (*sys_motor4pid_isr_hook)();

typedef enum//自定义中断勾函数向量表
{
	__U3_IRQN=0,//蓝牙
	__U2_IRQN=1,//P8

	__E9_5_IRQN=2,

	//__T3_IRQN=3,
	//__T4_IRQN=4,
	__T7_IRQN=5,
	__T9_IRQN=6,

	__T1_UP_IRQN=7,
	__E15_10_IRQN=8,
	
	__U1_IRQN=9,//MP3
	__T10_IRQN=10,
	__T12_IRQN=12,


}ISRFUN_DEFINED;
//新加入的中断函数，要在SetSysISRHookFun添加
uint8_t SetSysISRHookFun(uint8_t n,void (*hook)(void))//设置中断勾函数,注意：一旦设置中断勾函数,系统函数就不可用
{
	uint8_t state=0;
	os_task_enter_critical();//临界区处理,禁止任务调度破坏共享资源
	switch(n)
  {
		case __U2_IRQN:  		if(sys_usart2_isr_hook!=hook)sys_usart2_isr_hook=hook;							state = 1;	break;
		case __U1_IRQN:  		if(sys_usart1_isr_hook!=hook)sys_usart1_isr_hook=hook;							state = 1;	break;
		case __U3_IRQN:  		if(sys_usart3_isr_hook!=hook)sys_usart3_isr_hook=hook;							state = 1;	break;

		case __E9_5_IRQN:   	if(sys_exti9_5_isr_hook!=hook)  sys_exti9_5_isr_hook=hook;					state = 1;	break;

	//	case __T3_IRQN:  		if(sys_timer3_isr_hook!=hook)   sys_timer3_isr_hook=hook;						state = 1;	break;
	//	case __T4_IRQN:  		if(sys_timer4_isr_hook!=hook)   sys_timer4_isr_hook=hook;						state = 1;	break;
		case __T7_IRQN:  		if(sys_timer7_isr_hook!=hook)   sys_timer7_isr_hook=hook;						state = 1;	break;
		case __T9_IRQN: 		if(sys_timer9_isr_hook!=hook)	sys_timer9_isr_hook=hook;						state = 1;	break;
		case __T10_IRQN: 		if(sys_timer10_isr_hook!=hook)	sys_timer10_isr_hook=hook;						state = 1;	break;
		case __T12_IRQN: 		if(sys_timer12_isr_hook!=hook)	sys_timer12_isr_hook=hook;						state = 1;	break;
		case __T1_UP_IRQN: 	if(sys_timer1_up_isr_hook!=hook)sys_timer1_up_isr_hook=hook;				state = 1;	break;
		case __E15_10_IRQN: if(sys_exti15_10_isr_hook!=hook)sys_exti15_10_isr_hook=hook;			  state = 1;	break;
  }
	os_task_exit_critical();//开启任务调度
	return state;
}
//以下为一用到的中断函数
void SysMotorCodeISRFunInit(void)//初始化编码器中断函数
{
	SetSysISRHookFun(__E9_5_IRQN,MotorCoding_Istr);//EXTI9_5_ISR
}
void SysUSARTISRFunInit(uint8_t Usartx)//初始化串口中断函数
{
	switch(Usartx)
	{
		case __U2_IRQN:SetSysISRHookFun(__U2_IRQN,UART2_RX_ISR);break;//USART2_ISR
		//case __U1_IRQN:SetSysISRHookFun(__U1_IRQN,UART1_RX_ISR);break;//USART1_ISR
		case __U3_IRQN:SetSysISRHookFun(__U3_IRQN,BlueTH_RX_ISR);break;//BlueTH_RX_ISR
	}
}
void SysPIDISRFunInit(void)//初始化TIM3中断函数
{
	SetSysISRHookFun(__T12_IRQN,PID_ISR);//
	if(sys_motor1pid_isr_hook!=Motor1_MCPid_Isr)sys_motor1pid_isr_hook=Motor1_MCPid_Isr;
	if(sys_motor2pid_isr_hook!=Motor2_MCPid_Isr)sys_motor2pid_isr_hook=Motor2_MCPid_Isr;
	if(sys_motor3pid_isr_hook!=Motor3_MCPid_Isr)sys_motor3pid_isr_hook=Motor3_MCPid_Isr;
	if(sys_motor4pid_isr_hook!=Motor4_MCPid_Isr)sys_motor4pid_isr_hook=Motor4_MCPid_Isr;
}
void SysJSISRFunInit(void)//初始化中断函数
{
	//SetSysISRHookFun(__T6_IRQN,JS_TIM_ISR);//
	SetSysISRHookFun(__U1_IRQN,JS_RXD_ISR);//串口接收中断函数
}
void RockerISRFunInit(void)//初始化TIM9中断函数
{
	SetSysISRHookFun(__T9_IRQN,RockerDelay_ISR);//
}

void SysMusicISRFunInit(void)//初始化TIM7中断函数
{
	SetSysISRHookFun(__T7_IRQN,InMusicDelay_ISR);//
}

void SysComServoISRFunInit(void)//初始化TIM10中断函数
{
	SetSysISRHookFun(__T10_IRQN,ComServo_ISR);//
}

void SysSendIRCodeISRFunInit(void)//TIM1_UP 初始化红外编码中断函数
{
	SetSysISRHookFun(__T1_UP_IRQN,SendIRISR);//
}
void SysReadIRCodeISRFunInit(void)//EXTI15_10初始化红外编码中断函数
{
	SetSysISRHookFun(__E15_10_IRQN,ReadIRISR);//
}
void SysMP3ISRFunInit(void)//USART1 MP3初始
{
	SetSysISRHookFun(__U1_IRQN,MP3_RX_ISR);//
}
#endif//#if __ISR_HOOK_EN > 0
//***中断函数勾函数**END*******************************************************************
//***中断函数*****************************************************************************
//******************************************************************************
//*            STM32F2xx Peripherals Interrupt Handlers                        *
//******************************************************************************
void USART2_ISR(void)
{
	if(sys_usart2_isr_hook!=NULL)
	{sys_usart2_isr_hook();return ;}
}
void USART1_ISR(void)
{
	if(sys_usart1_isr_hook!=NULL)
	{sys_usart1_isr_hook();return ;}
}
void USART3_ISR(void)
{
	if(sys_usart3_isr_hook!=NULL)
	{sys_usart3_isr_hook();return ;}
}
/*******************************************************************************
* Function Name  : EXTI9_5_IRQHandler
* Description    : This function handles External lines 15 to 10 interrupt request.
* Input          : None
* Output         : None
* Return         : None
*******************************************************************************/
void EXTI9_5_ISR(void)
{
	if(sys_exti9_5_isr_hook!=NULL)
	{sys_exti9_5_isr_hook();return ;}
}
/*
void TIM3_ISR(void)
{
	if(sys_timer3_isr_hook!=NULL)
	{sys_timer3_isr_hook();return ;}
}

void TIM5_ISR(void)
{
	if(sys_timer5_isr_hook!=NULL)
	{sys_timer5_isr_hook();return ;}
}*/
void TIM7_ISR(void)
{
	if(sys_timer7_isr_hook!=NULL)
	{sys_timer7_isr_hook();return ;}
}

void TIM9_ISR(void)
{
	if(sys_timer9_isr_hook!=NULL)
	{sys_timer9_isr_hook();return ;}
}
void TIM10_ISR(void)
{
	if(sys_timer10_isr_hook!=NULL)
	{sys_timer10_isr_hook();return ;}
}

void TIM12_ISR(void)
{
	if(sys_timer12_isr_hook!=NULL)
	{sys_timer12_isr_hook();return ;}
}


void TIM1_UP_ISR(void)
{
	if(sys_timer1_up_isr_hook!=NULL)
	{sys_timer1_up_isr_hook();return ;}
}
/*******************************************************************************
* Function Name  : EXTI15_10_IRQHandler
* Description    : This function handles External lines 15 to 10 interrupt request.
* Input          : None
* Output         : None
* Return         : None
*******************************************************************************/
void EXTI15_10_ISR(void)
{
	if(sys_exti15_10_isr_hook!=NULL)
	{sys_exti15_10_isr_hook();return ;}
}
//***中断函数**END************************************************************************
#endif//__JMDISR_H
