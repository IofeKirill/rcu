#ifndef _JMDRAM_H_
#define _JMDRAM_H_
#include "stm32f4xx_hal.h"

//__SCRATCH_EN用来区分scratch固件和快车库，需要分别编译
//#define __SCRATCH_EN			//适配scratch固件开关
uint8_t *_ReadLibVersion(void)//读模块库版本
{
#ifdef __SCRATCH_EN

return (uint8_t *)"Lib:Scratche Firmware";

#else
return (uint8_t *)"Lib:RoboExpLib";
#endif
}
#define __SETWIFICODE_EN 	0//配对码可以设置
#ifdef __SCRATCH_EN//scratch
//读取缓存
#define BUFFER_SIZE					2048
#define BUFFER_LIST_SIZE		50//100
#define INRX_BUFFER_SIZE		200//64
//二次缓存
#define READ_BUF_LIST_SIZE	10//14//13//100//缓存列表组数
#define READ_BUF_LIST_SIZE2	1024//1434//1500//1536//200//一个队列的长度
#else//快车库
//读取缓存
#define BUFFER_SIZE					512//256//一级串口接收缓存大小（即串口透传过来的数据）
#define BUFFER_LIST_SIZE		5//8//
#define INRX_BUFFER_SIZE		64//
//二次缓存
#define READ_BUF_LIST_SIZE	5//8//缓存列表组数
#define READ_BUF_LIST_SIZE2	64//一个队列的长度
#endif//__SCRATCH_EN
//全局变量定义
#ifdef __SCRATCH_EN//scratch
uint16_t WLRX_BufferListLen[BUFFER_LIST_SIZE];
#endif//#ifdef __SCRATCH_EN//scratch
uint8_t WLRX_BufferList[BUFFER_LIST_SIZE][64],//三级缓存列表,读取二级缓存，最终用户读取该缓存使用
   WLRX_Buffer[READ_BUF_LIST_SIZE2];//缓存一个WIFI数据包大小0X78 0XCD *** 0xBE
uint8_t g_WLUsbRxMode=1;//1 无线模式, 2USB模式

uint16_t WifiConnectSuccessState=0;//连接成功之后返回数据标志位
//******JMD******
uint8_t InRx_Buffer[INRX_BUFFER_SIZE];//64
uint16_t InRx_BufferCnt=0;

uint16_t EspWifiLockIP=0;//1锁定IP,即不再跳到广播模式

#define __WIFICONNECT255OVERTIM_EN 1
#if __WIFICONNECT255OVERTIM_EN>0
uint16_t WIFICONNECT_OVERTIME=15000;//广播超时时间20s,超过这个时间依然没有连接，则进入
uint32_t WifiConnect255OverTime;//跳出广播之后一直没有连接情况下，超时进入指定IP连接
void SetWifiConnect255OverTimeArr(uint32_t time){WIFICONNECT_OVERTIME=time;}
uint32_t GetWifiConnect255OverTimeArr(void){return WIFICONNECT_OVERTIME;}
void SetConnect255Overtime(void)	{WifiConnect255OverTime=GetSystemTime()+WIFICONNECT_OVERTIME;}//设置广播超时时间
uint8_t GetConnect255OverTime(void) 		{return (WifiConnect255OverTime<GetSystemTime()?1:0);}
#endif//__WIFICONNECT255OVERTIM_EN
//****************
 uint16_t RxBuf_idx = 0;
 uint16_t Rx_CurLen = 0;
 uint16_t WL_CurPos = 0,WL_ListPos = 0;
//遥控手柄
 uint8_t g_WifiRMFlag=0;
//#define _WIFIRX_CLEARTIME		100//100ms
uint16_t _WIFIRX_CLEARTIME=150;//150ms
uint32_t WifiRxTimeTick=0;//用于超时清WIFI模式2下的缓存
extern uint16_t lenght_cnt;
//语音识别
uint8_t InRx_Srting[64]={0};//接收字符串
int16_t NewInRxSrting=0;
uint32_t WifiRxStrTimeTick=0;//用于超时清WIFI模式2下的缓存
uint32_t ReadWifiRxTimeTick(void){return WifiRxTimeTick;}
void SetWifiRxTimeMax(uint32_t tick){_WIFIRX_CLEARTIME=tick;}
void SetWifiRxTimeTick(uint32_t tick){WifiRxTimeTick=tick;}
void SetWifiRxTimeNextTick(uint32_t tick){WifiRxTimeTick=xTaskGetTickCount()+tick;}
uint8_t ReadWifiRxTimeTickState(void){if(WifiRxTimeTick>xTaskGetTickCount())return 1;else return 0;}
void ClearWifiRxPacketBuffer(void)//清缓存
{
	uint16_t n;
	InRx_BufferCnt=0;
	for(n=0;n<INRX_BUFFER_SIZE;n++)InRx_Buffer[n]=0;
}
uint16_t WifiTxCnt=0;//wifi发送计数，用于用户发送wifi数据是一次性发送数据个数，超时处理
uint8_t WifiIpLen=0;
uint8_t PcWifiPort[6];//PORT:28000 wifi连接端口
uint8_t WifiPort[6];//PORT:28000 wifi连接端口
uint8_t _ServerIPS[16];//保存AP的UDP定向IP
uint8_t _WifiMode=0;//wifi模式 0配对码接收模式,1指定IP和端口透传模式
#define GetWifiModeFlag()		_WifiMode
#define SetWifiModeFlag(S)	(_WifiMode=S)
//定时发送数据
#define WIFI_TX_IDEL	0
#define WIFI_TX_BUSY	1
#define WIFI_TX_SAVE	2
volatile uint8_t _WifiTxFlag=WIFI_TX_IDEL;//发送标志 0缓存空或者没有满可以继续存入数据,1 忙标志，缓存已满或者到达临界时间可以发送数据，这时不能继续保存数据，要等待数据发送完毕
volatile uint32_t _WifiTxTimeMax=20;//发送时间间隔，默认25ms
uint32_t SetWifiTxTime(uint32_t time,uint8_t state){if(state)_WifiTxTimeMax=time;return _WifiTxTimeMax;}
#define GetCurSysTick()			xTaskGetTickCount()//GetSystemTime()
#define CheckTxTime(t)			(t<=GetCurSysTick())
#define SetNextTxTime(t)		(t=GetCurSysTick()+_WifiTxTimeMax)
#define ResetNextTxTime(t)	(t=0)
#define CheckWifiTxFlag(t)	(_WifiTxFlag==t)
#define SetWifiTxFlag(t)		(_WifiTxFlag=t)
uint16_t _WifiTxlenght=0;
void WIFI_SaveTxData(uint16_t data);
//uint32_t _WifiTxTaskTCB=NULL;
#endif//_JMDRAM_H_
