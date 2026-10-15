//*********************************************************
//        Joinmax Digital Module library 1.0
//*********************************************************
// File                 : JMLib.c 
// Version              :  V1.0
// Compiler             : GCCARM
// Target               : STM32F407VGT6
// Author               : LXW
// Support telephone    : +86 20 84134792 (JoinMax digital)
// Support fax          : +86 20 84134890 (JoinMax digital)
//********************  Module List  **********************
// 
//*********************************************************
//IIC总线模块的地址
//BE-1727 :  0x02 GetCompoI
//BE-2615 :  0x76   GetCompassB
//BE-6303 :  0x04   GetUltrasound
//BE-6305 :  0X06   GetShortIRDist
//BE-1319 :  0X08   SetIRBoard
//BE-2620 :  0XA6   GetGSensor
//BE-1151 :  0XA1 GetAirQuality
//BE-2205 :  0X0E   SetMusicPlayer
//BE-2621 :  0X3A GetAHRS  SetAHRS
//BE-1131 :  0X350  GetColorSensor SetColorSensor
//BE-1141 :  0XA8 GetColorSensor SetColorSensor
//BE-1245 :  0X52 GetLaserDist

//**********************  HISTORY  ************************


#include "stm32f4xx_hal.h"
#include <math.h>
#include "Pinformat.h"
#include <LCD_COLOR.h>
#include "jmdmath.h"
#include "jmdos.h"






#ifndef _TC_VAR_
#define _TC_VAR_
volatile uint32_t TouchClicks[8];
uint8_t Flag_ADS[8]={0,0,0,0,0,0,0,0};
uint8_t _Adc_initdelay=0;
uint16_t _Adc_indicatorlamp=0;
#endif


//#if _TOUCH_TO_SCREEN_EN_ > 0
//volatile uint8_t TTSC_Flag;
//#endif

//==SetNSec Readding ID:  == DON'T DELETE!! ==

#ifdef _SETWAITFORTIME_
 #ifndef  _SETWAITFORTIME_EXISTS_
  #define _SETWAITFORTIME_EXISTS_
  #include <jmkernel.h>
  void SetWaitForTime(float s){

	 uint32_t endtime;
	 endtime=(uint32_t)(s*1000);
	 Delay1ms(endtime);  

  }
 #endif
#endif

#ifdef _SETLIGHTSENSORLED_
#ifndef  _SETLIGHTSENSORLED_EXISTS_
#define _SETLIGHTSENSORLED_EXISTS_
#include <jmkernel.h>

  void SetLightSensorLed(uint8_t which,int state){
   uint32_t port1 = portarray[RcuPORT[which][0]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i;
    uint8_t channel;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
    
    if(state==1)
    {
		 HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		 state=0x80;
    }
    else
    {
		 HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);
		 state=0x00;
    }
		Flag_ADS[which-1]=1|state;
  }
 #endif
#endif

#ifdef _SETLIGHTSENSORILAMP_
#ifndef  _SETLIGHTSENSORILAMP_EXISTS_
#define _SETLIGHTSENSORILAMP_EXISTS_
#include <jmkernel.h>

  void SetLightSensorILamp(uint8_t which,int state){
    uint32_t port2 = portarray[RcuPORT[which][1]];
    uint8_t bit2=RcuPIN[which][1];
    uint16_t i;
    uint8_t channel;
		
    GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
    if(state==1)
    {
	 HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
    }
    else
    {
	 HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
    }
		if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)_Adc_indicatorlamp|=(1<<(which-1));
  }
 #endif
#endif


#ifdef _SETLIGHTSENSORTHRESHOLD_
#ifndef  _SETLIGHTSENSORTHRESHOLD_EXISTS_
#define _SETLIGHTSENSORTHRESHOLD_EXISTS_
#include <jmkernel.h>
  void SetLightSensorThreshold(uint8_t which,int Threshold){
   WriteAdcThreshold(which-1,Threshold,1);
  }
 #endif
#endif

#ifdef _GETLIGHTSENSORTHRESHOLD_
#ifndef  _GETLIGHTSENSORTHRESHOLD_EXISTS_
#define _GETLIGHTSENSORTHRESHOLD_EXISTS_
#include <jmkernel.h>
  uint16_t GetLightSensorThreshold(uint8_t which){
   return ReadAdcThreshold(which-1);
  }
 #endif
#endif

#ifdef _GETANTILIGHT_
#ifndef  _GETANTILIGHT_EXISTS_
#define _GETANTILIGHT_EXISTS_
#include <jmkernel.h>

  uint16_t GetAntiLight(uint8_t which){
   uint32_t port1 = portarray[RcuPORT[which][0]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t m_Value1,m_Value2,m_Value3;
    uint8_t channel;
	RcuWhichMutexTake(which,1,4095);

	GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);
    HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);
	
    Delay1ms(5);
    m_Value1 = GetAdcResult(which);
	HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);

    Delay1ms(5);
    m_Value2 = GetAdcResult(which);
    RcuWhichMutexGive(which,1,4095);
    if(m_Value2>m_Value1)
    {
    m_Value3 = m_Value2 - m_Value1; 
    }
    else
    {
    m_Value3 = 0;
    }
    
    return m_Value3;
  }
 #endif
#endif

#ifdef _GETLIGHTSENSOR_
#ifndef  _GETLIGHTSENSOR_EXISTS_
#define _GETLIGHTSENSOR_EXISTS_
#include <jmkernel.h>

uint16_t GetLightSensor(uint8_t which){
uint32_t port1 = portarray[RcuPORT[which][0]];
uint32_t port2 = portarray[RcuPORT[which][1]];
uint32_t port3 = portarray[RcuPORT[which][2]];
uint8_t bit1=RcuPIN[which][0];
uint8_t bit2=RcuPIN[which][1];
uint8_t bit3=RcuPIN[which][2];
uint16_t i;
uint8_t channel;


  GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
  GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);

  if(Flag_ADS[which-1]==0)
 {
		RcuWhichMutexTake(which,1,4095);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		Flag_ADS[which-1]=0X81;
    	Delay1ms(10);
		RcuWhichMutexGive(which,1,4095);
 }
   if(_Adc_initdelay==0)
   {
      Delay1ms(1);
	  _Adc_initdelay=1;
   }
   i=GetAdcResult(which);
	if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)
	GPIO_AdcLed2State(which,(GPIO_TypeDef*)port2,bit2,i,1);
    return (uint16_t)i;
  }
 #endif
#endif


#ifdef _GETLIGHTSENSORDATA_
#ifndef  _GETLIGHTSENSORDATA_EXISTS_
#define _GETLIGHTSENSORDATA_EXISTS_
#include <jmkernel.h>
uint16_t ee;

uint16_t GetLightSensorData(uint8_t which)
{
   uint32_t port1 = portarray[RcuPORT[which][0]];
	 uint32_t port2 = portarray[RcuPORT[which][1]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i,th;
    uint8_t channel;
	
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);

	  if(Flag_ADS[which-1]==0)
		{
			RcuWhichMutexTake(which,1,4095);
			HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
			Flag_ADS[which-1]=0X81;
	    	Delay1ms(5);
			RcuWhichMutexGive(which,1,4095);
		}
	   if(_Adc_initdelay==0)
	   {
	      Delay1ms(1);
		  _Adc_initdelay=1;
	   }
  	  	 i=GetAdcResult(which);
		th=ReadAdcThreshold(which-1);

		if(i<th)
		{
			i=1;
			if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)
			HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
		}
		else 
		{
			i=0;
			if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)
			HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
		}
    return (uint16_t)i;
  }
 #endif
#endif
#ifdef _SETWAITFORDARK_
#ifndef  _SETWAITFORDARK_EXISTS_
#define _SETWAITFORDARK_EXISTS_
#include <jmkernel.h>

  void SetWaitforDark(uint8_t which,uint16_t value){
   uint32_t port1 = portarray[RcuPORT[which][0]];
	 uint32_t port2 = portarray[RcuPORT[which][1]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i;
    uint8_t channel;
		
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);

    if(Flag_ADS[which-1]==0)
	{
		RcuWhichMutexTake(which,1,4095);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		Flag_ADS[which-1]=0X81;
        Delay1ms(5);
		RcuWhichMutexGive(which,1,4095);
	}

	do
	{  
	    if(_Adc_initdelay==0)
	   {
	      Delay1ms(1);
		  _Adc_initdelay=1;
	   }
    	i=GetAdcResult(which);
	}while(i>value);
	
  }
 #endif
#endif

#ifdef _SETWAITFORLIGHT_
#ifndef  _SETWAITFORLIGHT_EXISTS_
#define _SETWAITFORLIGHT_EXISTS_
#include <jmkernel.h>

  uint16_t SetWaitforLight(uint8_t which,uint16_t value){
   uint32_t port1 = portarray[RcuPORT[which][0]];
	 uint32_t port2 = portarray[RcuPORT[which][1]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i;
    uint8_t channel;
		
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);

    if(Flag_ADS[which-1]==0)
	{
		RcuWhichMutexTake(which,1,4095);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		Flag_ADS[which-1]=0X81;
        Delay1ms(5);
		RcuWhichMutexGive(which,1,4095);
	}

	do
	{   
	   if(_Adc_initdelay==0)
	   {
	      Delay1ms(1);
		  _Adc_initdelay=1;
	   }
    	i=GetAdcResult(which);
	}while(i<value);
	
  }
 #endif
#endif

#ifdef _SETWAITFORDARKER_
#ifndef  _SETWAITFORDARKER_EXISTS_
#define _SETWAITFORDARKER_EXISTS_
#include <jmkernel.h>

  uint16_t SetWaitforDarker(uint8_t which,uint16_t value){
   uint32_t port1 = portarray[RcuPORT[which][0]];
	 uint32_t port2 = portarray[RcuPORT[which][1]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i,temp;
    uint8_t channel;
		
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);
    if(Flag_ADS[which-1]==0)
	{
		RcuWhichMutexTake(which,1,4095);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		Flag_ADS[which-1]=0X81;
        Delay1ms(5);
		RcuWhichMutexGive(which,1,4095);
	}
    if(_Adc_initdelay==0)
    {
       Delay1ms(1);
 	  _Adc_initdelay=1;
    }
	temp = GetAdcResult(which);
	do
	{   
    	i=GetAdcResult(which);
	}while(i>(temp-value));
	
  }
 #endif
#endif

#ifdef _SETWAITFORLIGHTER_
#ifndef  _SETWAITFORLIGHTER_EXISTS_
#define _SETWAITFORLIGHTER_EXISTS_
#include <jmkernel.h>

  uint16_t SetWaitforLighter(uint8_t which,uint16_t value){
   uint32_t port1 = portarray[RcuPORT[which][0]];
	 uint32_t port2 = portarray[RcuPORT[which][1]];
   uint32_t port3 = portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
    uint16_t i,temp;
    uint8_t channel;
		
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
    GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);
    if(Flag_ADS[which-1]==0)
	{
	RcuWhichMutexTake(which,1,4095);
	HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
	Flag_ADS[which-1]=0X81;
	Delay1ms(5);
	RcuWhichMutexGive(which,1,4095);
	}
    if(_Adc_initdelay==0)
    {
       Delay1ms(1);
 	  _Adc_initdelay=1;
    }
	temp = GetAdcResult(which);
	do
	{
    	i=GetAdcResult(which);
	}while(i<(temp+value));
	
  }
 #endif
#endif


#ifdef _GETTOUCH_
 #ifndef  _GETTOUCH_EXISTS_
  #define _GETTOUCH_EXISTS_
  #include <jmkernel.h>

  uint16_t GetTouch(uint8_t which){
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint8_t bit1=RcuPIN[which][0];
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);

    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value) return 0;
    else      return 1;
  }
 #endif
#endif

#ifdef _GETTOUCHA_
 #ifndef  _GETTOUCHA_EXISTS_
  #define _GETTOUCHA_EXISTS_
  #include <jmkernel.h>

uint16_t GetTouchA(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][1];
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);

    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value)
      return 0;
    else
      return 1;
  }
 #endif
#endif

#ifdef _GETTOUCHB_
 #ifndef  _GETTOUCHB_EXISTS_
  #define _GETTOUCHB_EXISTS_
  #include <jmkernel.h>

uint16_t GetTouchB(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][2]];//ADC
   uint8_t bit1=RcuPIN[which][2];
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);

    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value)    return 0;
    else   return 1;
  }
 #endif
#endif



#ifdef _SETLCDBACK_
 #ifndef  _SETLCDBACK_EXISTS_
  #define _SETLCDBACK_EXISTS_
  #include <jmkernel.h>
  #include "LCD320240.h"
void SetLCDBack(uint8_t led)
{
	GPIO_Setting(LCD_BACKLED_GPIO,LCD_BACKLED_PIN,GPIO_MODE_OUTPUT_PP);//3?ê??ˉ???ú
	SetBackLed(led);
	g_LcdBackLignt=led;
}
 #endif
#endif


#ifdef _SETFONTSIZE_
 #ifndef  _SETFONTSIZE_EXISTS_
  #define _SETFONTSIZE_EXISTS_
void SetFontSize(uint8_t size)//0(小字体8X16)/1(32X32)/2(64X64)/3(128X128)/4(256X256)
{
	SetFlashFontSize(size);
}
 #endif
#endif

#ifdef _GETDISPLAYPIXEL_
 #ifndef  _GETDISPLAYPIXEL_EXISTS_
  #define _GETDISPLAYPIXEL_EXISTS_
uint8_t GetDisplayPixel(uint8_t x,uint16_t y)//有显示返回1
{
	return RedOneFontXYpixel(x, y);
}
 #endif
#endif


//==SetLCD8Char Readding ID:  == DON'T DELETE!! ==

#ifdef _SETDISPLAYVAR_
#ifndef  _SETDISPLAYVAR_EXISTS_
#define _SETDISPLAYVAR_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVar(int y,int32_t data,uint16_t ch_color,uint16_t bg_color)
{
	uint16_t Xsize    =  GetFontLibWidth();
    SetBackLed(g_LcdBackLignt);
	switch(Xsize)
  {
	case 8  : Xsize=(GetFontLibWidth()*8)-1;if(y>20)y=20;break;//显示20行
	case 16 : Xsize=(GetFontLibWidth()*8)-1;if(y>10)y=10;break;
	case 32 : Xsize=(GetFontLibWidth()*7)-1;if(y>5)y=5;break;
	case 64 : Xsize=(GetFontLibWidth()*3)-1;if(y>2)y=2;break;
	case 128 : Xsize=(GetFontLibWidth()*1)-1;if(y>1)y=1;break;
  }  
	LCD_DisplayNum(LCD_Width-Xsize, (y-1)*GetFontLibHeight(),(int32_t)data, ch_color, bg_color,0x8088); 
}
#endif
#endif

//==SetLCD8Char Readding ID:  == DON'T DELETE!! ==

#ifdef _SETDISPLAYVARU32_
#ifndef  _SETDISPLAYVARU32_EXISTS_
#define _SETDISPLAYVARU32_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVarU32(int y,uint32_t data,uint16_t ch_color,uint16_t bg_color)
{
    uint16_t Xsize    =  GetFontLibWidth();
    SetBackLed(g_LcdBackLignt);
	switch(Xsize)
  {
	case 8  : Xsize=(GetFontLibWidth()*10)-1;if(y>20)y=20;break;//显示20行
	case 16 : Xsize=(GetFontLibWidth()*10)-1;if(y>10)y=10;break;
	case 32 : Xsize=(GetFontLibWidth()*7)-1;if(y>5)y=5;break;
	case 64 : Xsize=(GetFontLibWidth()*3)-1;if(y>2)y=2;break;
	case 128 : Xsize=(GetFontLibWidth()*1)-1;if(y>1)y=1;break;
  }  
	LCD_DisplayNumU32(LCD_Width-Xsize, (y-1)*GetFontLibHeight(),(uint32_t)data, ch_color, bg_color,0x800A); 
}
#endif
#endif



#ifdef _SETDISPLAYVARXY_
#ifndef  _SETDISPLAYVARXY_EXISTS_
#define _SETDISPLAYVARXY_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVarXY(int x,int y,int32_t data,uint16_t ch_color,uint16_t bg_color)
{
 	SetBackLed(g_LcdBackLignt);
	LCD_DisplayNum(x,y,(int32_t)data, ch_color, bg_color,0x8088); 
}
#endif
#endif


#ifdef _SETDISPLAYVARIABLE_
#ifndef  _SETDISPLAYVARIABLE_EXISTS_
#define _SETDISPLAYVARIABLE_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVariable(int x,int y,int32_t data,uint16_t ch_color,uint16_t bg_color)
{
 	SetBackLed(g_LcdBackLignt); 	
	LCD_DisplayNum(x,y,(int32_t)data, ch_color, bg_color,0x8088); 
}
#endif
#endif


//==SetLCD10Char Readding ID:  == DON'T DELETE!! ==
#ifdef _SETDISPLAYVARuint32_t_
#ifndef  _SETDISPLAYVARuint32_t_EXISTS_
#define _SETDISPLAYVARuint32_t_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVaruint32_t(int y,uint32_t data,uint16_t ch_color,uint16_t bg_color)
{
  SetBackLed(g_LcdBackLignt);
  LCD_DisplayNumuint32_t(LCD_Width-(GetFontLibWidth()*10)-1, (y-1)*GetFontLibHeight(),(uint32_t)data, ch_color, bg_color,0x800A); 
}
#endif
#endif


//==SetLCD10Char Readding ID:  == DON'T DELETE!! ==
#ifdef _SETDISPLAYVARHEX_
#ifndef  _SETDISPLAYVARHEX_EXISTS_
#define _SETDISPLAYVARHEX_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayVarHEX(int y,uint32_t data,uint16_t ch_color,uint16_t bg_color)
{
  SetBackLed(g_LcdBackLignt);
  LCD_DisplayNumuint32_t(0, (y-1)*GetFontLibHeight(),(uint32_t)data, ch_color, bg_color,0x804F); //8位16进制
}
#endif
#endif


//==SetDisplayFloat Readding ID:  == DON'T DELETE!! ==
#ifdef _SETDISPLAYFLOAT_
#ifndef  _SETDISPLAYFLOAT_EXISTS_
#define _SETDISPLAYFLOAT_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetDisplayFloat(int y,double data,uint16_t ch_color,uint16_t bg_color)
{

   uint16_t Xsize    =  GetFontLibWidth();
   SetBackLed(g_LcdBackLignt);
   switch(Xsize)
  {
	case 8  : Xsize=(GetFontLibWidth()*11)-1;if(y>20)y=20;break;//显示20行
	case 16 : Xsize=(GetFontLibWidth()*11)-1;if(y>10)y=10;break;
	default : Xsize=(16*11)-1;if(y>10)y=10;break;//最大16*32
  }  
	LCD_DisplayFloatNum(LCD_Width-Xsize, (y-1)*GetFontLibHeight(),(double)data, ch_color, bg_color,0x0802);  
}

 #endif
#endif

#ifdef _SETLCDCLEAR_
#ifndef  _SETLCDCLEAR_EXISTS_
#define _SETLCDCLEAR_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDClear(uint16_t m_color)
{
  LCD_Pant(m_color);
}
#endif
#endif

#ifdef _SETLCDDOT_
#ifndef  _SETLCDDOT_EXISTS_
#define _SETLCDDOT_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDDot(uint8_t x,uint16_t y,uint16_t m_color)
{
	SetBackLed(g_LcdBackLignt);
	if(x==0||y==0)return;
#if _TOUCH_TO_SCREEN_EN_ > 0
	uint16_t iy=320-y;
	if(TTSC_Flag)iy=320-y;//if(TTSC_Flag)iy=y;
	else iy=y;
	LCD_DrawPoint((x-1),(iy),m_color);
#else
  //LCD_DrawPoint((x-1),(320-y),m_color);
	LCD_DrawPoint((x-1),(y-1),m_color);
#endif
}
#endif
#endif

#ifdef _SETLCDPICTURE_
#ifndef  _SETLCDPICTURE_EXISTS_
#define _SETLCDPICTURE_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDPicture(uint8_t x,uint16_t y,uint8_t num)
{
SetBackLed(g_LcdBackLignt);
  LCD_DrawPicture(x,y,Picture1,YELLOW,BLACK);
}

#endif
#endif

#ifdef _GETCHOICEBOX_
#ifndef _GETCHOICEBOX_EXISTS_
#define _GETCHOICEBOX_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

uint8_t GetChoiceBox(uint8_t* words)
{
  uint8_t state=0;
  float m_TouchX,m_TouchY,m_Valid;
  LCD_Pant(BLACK);
  SetBackLed(g_LcdBackLignt);
  LCD_String(0,16,words,YELLOW,BLACK,0);
  LCD_Display4Chioce();

  while(state==0)
  {
		m_TouchX=ReadTouchXFilter();
		m_TouchY=ReadTouchYFilter();
		
   if((m_TouchY>65)&&(m_TouchY<134))
    {
       if((m_TouchX>27)&&(m_TouchX<96))
			{
				state=1;//A
			}
			else if((m_TouchX>143)&&(m_TouchX<212))
			{
				state=2;//B
			}
		}
		else if((m_TouchY>176)&&(m_TouchY<245))
		{
			if((m_TouchX>27)&&(m_TouchX<96))
			{
				state=3;//C
			}
			else if((m_TouchX>143)&&(m_TouchX<212))
			{
				state=4;//D
			}
    }
		Delay1ms(5);
  }
	LCD_Pant(BLACK);
	return state;
}

#endif
#endif

//==SetLCDString Readding ID:  == DON'T DELETE!! ==

#ifdef _SETDISPLAYSTRING_
#ifndef  _SETDISPLAYSTRING_EXISTS_
#define _SETDISPLAYSTRING_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

 void SetDisplayString(uint16_t y,int8_t* pic,uint16_t ch_color,uint16_t bg_color)
{
   SetBackLed(g_LcdBackLignt);
   LCD_String(0,(y-1)*GetFontLibHeight(),pic,ch_color,bg_color,0);
}
 #endif
#endif

//==SetLCDStr Readding ID:  == DON'T DELETE!! ==
#ifdef _SETDISPLAYSTR_
#ifndef  _SETDISPLAYSTR_EXISTS_
#define _SETDISPLAYSTR_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

 void SetDisplayStr(uint16_t x,uint16_t y,int8_t* pic,uint16_t ch_color,uint16_t bg_color)
{
  SetBackLed(g_LcdBackLignt);
  LCD_String(x,y,pic,ch_color,bg_color,0);
}
 #endif
#endif


//==SetLCDStr Readding ID:  == DON'T DELETE!! ==
#ifdef _SETDISPLAYSTRINGXY_
#ifndef  _SETDISPLAYSTRINGXY_EXISTS_
#define _SETDISPLAYSTRINGXY_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

 void SetDisplayStringXY(int x,int y,int8_t* pic,uint16_t ch_color,uint16_t bg_color,uint8_t T)
{
  SetBackLed(g_LcdBackLignt);
  LCD_String(x,y,pic,ch_color,bg_color,T);
}
 #endif
#endif


//==SetLCDClear Readding ID:  == DON'T DELETE!! ==

#ifdef   _SETLCDCLEAR_
#ifndef  _SETLCDCLEAR_EXISTS_
#define  _SETLCDCLEAR_EXISTS_
#include <jmkernel.h>
#include "LCD12864.h"
void SetLCDClear(uint16_t m_color){
    LCD_Pant(m_color);
}
#endif
#endif

#ifdef _SET3CLED_
 #ifndef  _SET3CLED_EXISTS_
  #define _SET3CLED_EXISTS_
  #include <jmkernel.h>

void Set3CLed(uint8_t which,uint16_t Color)
{
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint32_t port2=portarray[RcuPORT[which][1]];
   uint32_t port3=portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];

   uint8_t RedLed,GreenLed,BlueLed;
RcuWhichMutexTake(which,1,0);
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);

   switch(Color)
	{
	case 0: RedLed=0;GreenLed=0;BlueLed=0;	break;
	case RED:RedLed=1;GreenLed=0;BlueLed=0;	break;
	case 1: RedLed=1;GreenLed=0;BlueLed=0;	break;
	case GREEN:RedLed=0;GreenLed=1;BlueLed=0;	break;
	case 2: RedLed=0;GreenLed=1;BlueLed=0;	break;
	case BLUE:RedLed=0;GreenLed=0;BlueLed=1;	break;
	case 3: RedLed=0;GreenLed=0;BlueLed=1;	break;
	case YELLOW:RedLed=1;GreenLed=1;BlueLed=0;	break;
	case 4: RedLed=1;GreenLed=1;BlueLed=0;	break;
	case PURPLE:RedLed=1;GreenLed=0;BlueLed=1;	break;
	case 5: RedLed=1;GreenLed=0;BlueLed=1;	break;
	case CYAN:RedLed=0;GreenLed=1;BlueLed=1;	break;
	case 6: RedLed=0;GreenLed=1;BlueLed=1;	break;
	case WHITE:RedLed=1;GreenLed=1;BlueLed=1;	break;
	case 7: RedLed=1;GreenLed=1;BlueLed=1;	break;
	}

//oìé?
   if(RedLed==1)
   HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
   else
   	HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);
//?ìé?
   if(GreenLed==1)
   HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
   else
  	HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
//à?é?
   if(BlueLed==1)
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
   else
   	HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
RcuWhichMutexGive(which,1,0);
  }
 #endif
#endif

#ifdef _SETMOTORPOWER_
 #ifndef _SETMOTORPOWER_EXISTS_
 #define _SETMOTORPOWER_EXISTS_
#include <jmkernel.h>

void SetMotorPower(uint8_t m_Per1,int m_Per2,int m_Per3,int m_Per4)////调节输出马达功率
{
	g_MotorPowerFlag=1;
	g_M1SpeedPer=m_Per1;//M1
	g_M2SpeedPer=m_Per2;//M2
	g_M3SpeedPer=m_Per3;//M3
	g_M4SpeedPer=m_Per4;//M4
}	
 #endif
#endif


#ifdef _SETMOTOR_
 #ifndef  _SETMOTOR_EXISTS_
 #define _SETMOTOR_EXISTS_
 #include <jmkernel.h>

void SetMotor(uint8_t which,int speed)
{
	Set_Motor_X(which,speed);
}
 #endif
#endif


#ifdef _SETMOTORFREE_
 #ifndef  _SETMOTORFREE_EXISTS_
 #define _SETMOTORFREE_EXISTS_
 #include <jmkernel.h>

void SetMotorFree(uint8_t which)
{
	MotorFree(which);
}
 #endif
#endif


#ifdef _SETMOTORCODE_
 #ifndef  _SETMOTORCODE_EXISTS_
 #define _SETMOTORCODE_EXISTS_
 #include <jmkernel.h>

void SetMotorCode(uint8_t which)
{
#if 0
   MotorCodingInit();
   switch(which)
   {
	case 1:SetMotorCnt1Zero();
	break;
	case 2:SetMotorCnt2Zero();
	break;
	case 3:SetMotorCnt3Zero();
	break;
	case 4:SetMotorCnt4Zero();
	break;
   }
#endif
	Set_Motor_Code(which);
}
 #endif
#endif

#ifdef _GETMOTORCODE_
 #ifndef  _GETMOTORCODE_EXISTS_
 #define _GETMOTORCODE_EXISTS_
 #include <jmkernel.h>

volatile int32_t GetMotorCode(uint8_t which)
{
#if 0
  MotorCodingInit();
  switch(which)
  {
		case 1:return GetMotorCnt1();	break;
		case 2:return GetMotorCnt2();	break;
		case 3:return GetMotorCnt3();	break;
		case 4:return GetMotorCnt4();	break;
  }
#endif
	return Get_Motor_Code(which);
}
 #endif
#endif

//==GetSysTime Readding ID:  == DON'T DELETE!! ==

#ifdef _GETSYSTIME_
 #ifndef  _GETSYSTIME_EXISTS_
  #define _GETSYSTIME_EXISTS_
  #include <jmkernel.h>

  uint32_t GetSysTime(void){
  return GetSystemTime();
  }
 #endif
#endif

//==SetSysTime Readding ID:  == DON'T DELETE!! ==

#ifdef _SETSYSTIME_
 #ifndef  _SETSYSTIME_EXISTS_
  #define _SETSYSTIME_EXISTS_
  #include <jmkernel.h>

  void SetSysTime(void){
    SetSystemTime();
  }
 #endif
#endif
//==Getdata Readding eeprom ==

#ifdef _GETDATA_
 #ifndef  _GETDATA_EXISTS_
  #define _GETDATA_EXISTS_
  #include <jmkernel.h>

uint16_t GetData(int dataadr){
  if((dataadr>0)&&(dataadr<=156))
  return ReadEEP(dataadr);
  else
  return 888;
}
 #endif
#endif

//==Setdata write data to eeprom ==

#ifdef _SETDATA_
 #ifndef  _SETDATA_EXISTS_
  #define _SETDATA_EXISTS_
  #include <jmkernel.h>

void SetData(int dataadr,int datacode)
{
	if(datacode>4095)datacode=4095;
	if((dataadr>0)&&(dataadr<=156))
	WriteEEP(dataadr,datacode);
}
 #endif
#endif

//==GetButton1 Readding ID:  == DON'T DELETE!! ==
#ifdef   _GETLEFTBUTTON_
#ifndef  _GETLEFTBUTTON_EXISTS_
#define _GETLEFTBUTTON_EXISTS_
#include <jmkernel.h>
uint8_t GetLeftButton(void)
{  
 GPIO_Setting(GPIOC,15,GPIO_MODE_INPUT);
 uint8_t value=HAL_GPIO_ReadPin(GPIOC,GPIO_PIN_15);
  if(value)      return 0;
  else      return 1;
}
#endif
#endif

//==GetButton2 Readding ID:  == DON'T DELETE!! ==
#ifdef   _GETRIGHTBUTTON_
#ifndef  _GETRIGHTBUTTON_EXISTS_
#define _GETRIGHTBUTTON_EXISTS_
#include <jmkernel.h>
uint8_t GetRightButton(void)
{
 GPIO_Setting(GPIOC,14,GPIO_MODE_INPUT);
 uint8_t value=HAL_GPIO_ReadPin(GPIOC,GPIO_PIN_14);
 if(value)      return 0;
  else      return 1;
}
#endif
#endif


//------------------------------------------
//==SETTOUCHTOSCREENCOORDINATE Readding ID:  == DON'T DELETE!! ==

#ifdef _SETTOUCHTOSCREENCOORDINATE_
 #ifndef  _SETTOUCHTOSCREENCOORDINATE_EXISTS_
  #define _SETTOUCHTOSCREENCOORDINATE_EXISTS_
  
void SetTouchToScreenCoordinate(void)
{
  #if _TOUCH_TO_SCREEN_EN_ > 0
	TTSC_Flag=1;
  #endif
}
 #endif
#endif



#ifdef   _GETTOUCHSCREEN_
#ifndef  _GETTOUCHSCREEN_EXISTS_
#define _GETTOUCHSCREEN_EXISTS_
#include <jmkernel.h>
uint16_t GetTouchScreen(void)
{

	return ReadTouchState();
}
#endif
#endif

#ifdef   _GETTOUCHSCREENX_
#ifndef  _GETTOUCHSCREENX_EXISTS_
#define _GETTOUCHSCREENX_EXISTS_
#include <jmkernel.h>
uint16_t GetTouchScreenX(void)
{
	uint16_t m_value;
	m_value=ReadTouchXFilter();
	#if _TOUCH_TO_SCREEN_EN_ > 0
	if(TTSC_Flag)
	{
		if(m_value>240)m_value=240;
		if(m_value)m_value=241-m_value;
	}
#endif	
   return m_value;
}
#endif
#endif

#ifdef   _GETTOUCHSCREENY_
#ifndef  _GETTOUCHSCREENY_EXISTS_
#define _GETTOUCHSCREENY_EXISTS_
#include <jmkernel.h>
uint16_t GetTouchScreenY(void)
{
  uint16_t m_value;
	m_value=ReadTouchYFilter();
#if _TOUCH_TO_SCREEN_EN_ > 0
	if(TTSC_Flag)
	{
		if(m_value>320)m_value=320;
		if(m_value)m_value=321-m_value;
	}
#endif	
   return m_value;
}
#endif
#endif

#ifdef   _GETINMIC_
#ifndef  _GETINMIC_EXISTS_
#define _GETINMIC_EXISTS_
#include <jmkernel.h>

uint16_t GetInMic(void)
{
uint16_t temp;
temp=ReadInMicVaule();
return temp;
}
#endif
#endif

#ifdef   _SETWAITFORLOUD_
#ifndef  _SETWAITFORLOUD_EXISTS_
#define _SETWAITFORLOUD_EXISTS_
#include <jmkernel.h>

void SetWaitforLoud(int value)
{
	uint16_t temp;
	do
	{
		temp=ReadInMicVaule();
	}while(temp<value);
}
#endif
#endif

#ifdef   _SETWAITFORQUIET_
#ifndef  _SETWAITFORQUIET_EXISTS_
#define _SETWAITFORQUIET_EXISTS_
#include <jmkernel.h>

void SetWaitforQuiet(int value)
{
	uint16_t temp;
	do
	{
		temp=ReadInMicVaule();
	}while(temp>value);
}
#endif
#endif

#ifdef   _SETWAITFORLOUDER_
#ifndef  _SETWAITFORLOUDER_EXISTS_
#define _SETWAITFORLOUDER_EXISTS_
#include <jmkernel.h>

void SetWaitforLouder(int value)
{
uint16_t temp,org;
	org=ReadInMicVaule();
	do
	{
	temp=ReadInMicVaule();
	}while(temp<(org+value));
}
#endif
#endif

#ifdef   _SETWAITFORQUIETER_
#ifndef  _SETWAITFORQUIETER_EXISTS_
#define _SETWAITFORQUIETER_EXISTS_
#include <jmkernel.h>

void SetWaitforQuieter(int value)
{
uint16_t temp,org;
	org=ReadInMicVaule();
	do
	{
	temp=ReadInMicVaule();
	}while(temp>(org-value));
}
#endif
#endif

#ifdef   _GETINVOTAGE_
#ifndef  _GETINVOTAGE_EXISTS_
#define _GETINVOTAGE_EXISTS_
#include <jmkernel.h>

uint16_t GetInVotage(void)
{
uint16_t temp;
uint32_t m_Votage;
temp=ReadInVoltageVaule();
m_Votage=((temp*74)/10+100)/100;
if(m_Votage>84) m_Votage = 84;
return (uint16_t)m_Votage;
}
#endif
#endif

//==SetLCDBack Readding ID:  == DON'T DELETE!! ==

#ifdef _SETINBEEP_
 #ifndef  _SETINBEEP_EXISTS_
  #define _SETINBEEP_EXISTS_
  #include <jmkernel.h>

void SetInBeep(uint8_t state)
{
  Beep(state);
}
 #endif
#endif


#ifdef _SETMOTORSERVO_ || _SETMOTORANGLE_
 #ifndef  _SETMOTORSERVO_EXISTS_ || _SETMOTORANGLE_EXISTS_
  #define _SETMOTORSERVO_EXISTS_
  #define _SETMOTORANGLE_EXISTS_
  #include <jmkernel.h>

void SetMotorServo(uint8_t which,int speed,uint32_t Angle)
{
	Angle=abs(Angle);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle(which,speed,Angle);
}
 #endif
#endif



#ifdef _SETMOTORSERVO48_
 #ifndef  _SETMOTORSERVO48_EXISTS_
  #define _SETMOTORSERVO48_EXISTS_
  #include <jmkernel.h>

void SetMotorServo48(uint8_t which,int speed,uint32_t Angle)
{
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle48(which,speed,Angle);
}
 #endif
#endif

#ifdef _SETMOTORSERVO128_
 #ifndef  _SETMOTORSERVO128_EXISTS_
  #define _SETMOTORSERVO128_EXISTS_
  #include <jmkernel.h>


void SetMotorServo128(uint8_t which,int speed,uint32_t Angle)
{
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle128(which,speed,Angle);
}
 #endif
#endif

#ifdef _SETMOTORSERVO2048_
 #ifndef  _SETMOTORSERVO2048_EXISTS_
  #define _SETMOTORSERVO2048_EXISTS_
  #include <jmkernel.h>

void SetMotorServo2048(uint8_t which,int speed,uint32_t Angle)
{
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle2048(which,speed,Angle);
}
 #endif
#endif

#ifdef _SETWAITFORANGLE_
 #ifndef  _SETWAITFORANGLE_EXISTS_
  #define _SETWAITFORANGLE_EXISTS_
  #include <jmkernel.h>

void SetWaitForAngle(uint8_t which,int speed,int32_t Angle)
{
#if 0
	int32_t m_Target=0,m_CV;
	Angle=abs(Angle);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle(which,speed,Angle);
	m_Target = GetTMCP(which);

	do
	{
		switch(which)
		{
			case 1:m_CV=GetMotorCnt1();	break;
			case 2:m_CV=GetMotorCnt2();	break;
			case 3:m_CV=GetMotorCnt3();	break;
			case 4:m_CV=GetMotorCnt4();	break;
		}
		if((m_Target>=(m_CV-6))&&(m_Target<=(m_CV+6)))break;
  }while(1);
#endif
	Set_Wait_For_Angle(which,speed,Angle);
}
 #endif
#endif


#ifdef _SETWAITFORANGLE48_
 #ifndef  _SETWAITFORANGLE48_EXISTS_
  #define _SETWAITFORANGLE48_EXISTS_
  #include <jmkernel.h>

void SetWaitForAngle48(uint8_t which,int speed,int32_t Angle)
{
	int32_t m_Target=0,m_CV;
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle48(which,speed,Angle);
	m_Target = GetTMCP(which);

	do
	{
		switch(which)
		{
			case 1:m_CV=GetMotorCnt1();	break;
			case 2:m_CV=GetMotorCnt2();	break;
			case 3:m_CV=GetMotorCnt3();	break;
			case 4:m_CV=GetMotorCnt4();	break;
		}
		if((m_Target>=(m_CV-6))&&(m_Target<=(m_CV+6)))break;
  }while(1);


}
 #endif
#endif



#ifdef _SETWAITFORANGLE128_
 #ifndef  _SETWAITFORANGLE128_EXISTS_
  #define _SETWAITFORANGLE128_EXISTS_
  #include <jmkernel.h>

void SetWaitForAngle128(uint8_t which,int speed,int32_t Angle)
{
int32_t m_Target=0,m_CV;
Angle=abs(Angle);
Motor_Init();
MotorCodingInit();
SetMotorServoMode(which);
SetCodeServoAngle128(which,speed,Angle);

m_Target = GetTMCP(which);

do{
    switch(which)
	{
	case 1:m_CV=GetMotorCnt1();	break;
	case 2:m_CV=GetMotorCnt2();	break;
	case 3:m_CV=GetMotorCnt3();	break;
	case 4:m_CV=GetMotorCnt4();	break;
	}

     if((m_Target>=(m_CV-6))&&(m_Target<=(m_CV+6)))break;

  }while(1);
}
 #endif
#endif

#ifdef _SETWAITFORANGLE2048_
 #ifndef  _SETWAITFORANGLE2048_EXISTS_
  #define _SETWAITFORANGLE2048_EXISTS_
  #include <jmkernel.h>

void SetWaitForAngle2048(uint8_t which,int speed,int32_t Angle)
{
	int32_t m_Target=0,m_CV;
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle2048(which,speed,Angle);
	m_Target = GetTMCP(which);

	do
	{
		switch(which)
		{
			case 1:m_CV=GetMotorCnt1();	break;
			case 2:m_CV=GetMotorCnt2();	break;
			case 3:m_CV=GetMotorCnt3();	break;
			case 4:m_CV=GetMotorCnt4();	break;
		}
		if((m_Target>=(m_CV-6))&&(m_Target<=(m_CV+6)))break;
  }while(1);
}
 #endif
#endif

#ifdef _SETWAITFORPRESS_
 #ifndef  _SETWAITFORPRESS_EXISTS_
  #define _SETWAITFORPRESS_EXISTS_
  #include <jmkernel.h>

void SetWaitForPress(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t value;

   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
    do
    {
    value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    }while(value==1);
   TouchClicks[which-1]++;
   Delay1ms(5);
}
 #endif
#endif

#ifdef _SETWAITFORRELEASE_
 #ifndef  _SETWAITFORRELEASE_EXISTS_
  #define _SETWAITFORRELEASE_EXISTS_
  #include <jmkernel.h>

void SetWaitForRelease(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t value;
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
    do
    {
    value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    }while(value==0);
   TouchClicks[which-1]++;
   Delay1ms(5);
}
 #endif
#endif

#ifdef _SETWAITFORBUMP_
 #ifndef  _SETWAITFORBUMP_EXISTS_
  #define _SETWAITFORBUMP_EXISTS_
  #include <jmkernel.h>

void SetWaitForBump(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t value;
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
    do
    {
    value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    }while(value==1);
    Delay1ms(5);
    do
    {
    value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    }while(value==0);
    TouchClicks[which-1]++;
    Delay1ms(5);
}
 #endif
#endif

#ifdef _GETNUMBEROFCLICKS_
 #ifndef  _GETNUMBEROFCLICKS_EXISTS_
  #define _GETNUMBEROFCLICKS_EXISTS_
  #include <jmkernel.h>

uint32_t GetNumberOfClicks(uint8_t which)
{
    return TouchClicks[which-1];
}
 #endif
#endif
 
 
//==GetUltrasound (adr=04)Readding ID:  == DON'T DELETE!! == 3?éù

#ifdef _GETULTRASOUND_
 #ifndef  _GETULTRASOUND_EXISTS_
  #define _GETULTRASOUND_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
  
#define _ULTRASOUND_ADDR_		0X04
uint16_t GetUltrasound(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//ADC
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
   
   uint16_t data=999;
   uint8_t  datah=0,datal=0,cmd=0,s=0,SUM=0,i;

	 RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
	 Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
					&iic_typedef);
   for(i=0;i<3;i++)
	{
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_ULTRASOUND_ADDR_);
		Soft_I2C_Write(&iic_typedef,0xaa);
		Soft_I2C_Stop(&iic_typedef);
		
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_ULTRASOUND_ADDR_+1);
		cmd=Soft_I2C_Read(&iic_typedef,0);		//数据开头
		if(cmd!=0xAA) cmd=Soft_I2C_Read(&iic_typedef,0);
		datah=Soft_I2C_Read(&iic_typedef,0);	//数据高八位
		datal=Soft_I2C_Read(&iic_typedef,0);	//低八位
		s=Soft_I2C_Read(&iic_typedef,1);		//检验和
		Soft_I2C_Stop(&iic_typedef);

		SUM=(uint8_t)(cmd+datah+datal);//校验
		if(SUM==s)i=3;		//如果一次读取成功则读一次，不成功读三次
   	}	
	if(SUM!=s)//校验
	{
		data=999;
	}
	else
	{
		data=(uint16_t)(((uint16_t)datah<<8)|datal);	
	}
	RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
	
	
    return (uint16_t)data;
}
 #endif
#endif


//==GetDBCompoI Readding ID:0x02  == DON'T DELETE!! == ?′??
//BE1727
#ifdef _GETCOMPOI_
 #ifndef  _GETCOMPOI_EXISTS_
  #define _GETCOMPOI_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
 
#define _COMPOI_ADDR_		0X02//I2C μ???
uint8_t GetCompoI(uint8_t which, uint8_t command)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();

	 RcuWhichMutexTake(which,1,0XFFFF);//??è????úIICê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char m_temp,m_fix;
    if(command<=15)
    {
    	if( command <= 7)
	{
	  switch(command)
	  {		
		case 1:m_fix = 7;		break;
		case 2:m_fix = 6;		break;
		case 3:m_fix = 5;		break;
		case 4:m_fix = 4;		break;
		case 5:m_fix = 3;		break;
		case 6:m_fix = 2;		break;
		case 7:m_fix = 1;		break;
	  }
	}
	else
	{
		m_fix = command;
	}

    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_COMPOI_ADDR_);//0x02
    Soft_I2C_Write(&iic_typedef,m_fix);
    Soft_I2C_Stop(&iic_typedef);
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_COMPOI_ADDR_+1);//0x03 
    m_temp=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef); 
		//OS_EXIT_CRITICAL();
    }
		RcuWhichMutexGive(which,1,0xffff);//êí??IIC???úê1ó?è¨
    if(m_fix == 8)
    {
		if(m_temp==255)return 255;
		return (8-m_temp);
    }
    else
    {
		return m_temp;
    }  
   
}
 #endif
#endif


//==GetCompassB Readding ID:0x76  == DON'T DELETE!! == ??????

#ifdef _GETCOMPASSB_
 #ifndef  _GETCOMPASSB_EXISTS_
  #define _GETCOMPASSB_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
#define _COMPOB_ADDR_		0X76//I2C μ???
uint16_t GetCompassB(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,9999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    uint8_t low;
    uint8_t high;
    uint16_t angle;
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_COMPOB_ADDR_);//
    Soft_I2C_Write(&iic_typedef,0x01);
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_COMPOB_ADDR_+1);
    high=Soft_I2C_Read(&iic_typedef,0);
    low=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
//OS_EXIT_CRITICAL();
    if(high==1)
      angle=256+low;
    else
      if(high==0)
        angle=low;
      else
        angle=9999;
				RcuWhichMutexGive(which,1,angle);//êí??IIC???úê1ó?è¨
    return angle;
  }
 #endif
#endif

//==GETGETGSENSOR Readding ID:0xa6  == DON'T DELETE!! == èy?á?ó?ù?è

#ifdef _GETGSENSOR_
 #ifndef  _GETGSENSOR_EXISTS_
  #define _GETGSENSOR_EXISTS_
   #include <jmkernel.h>
  #include "I2C_Soft.h"
  
#define _GSENSOR_ADDR_  0xA6
//2:6.6ms;  4:9ms;  3:7.9ms
#define _GS_cnt_ 	4//?ù?μ??2¨??êy>=2
void ADXL345_Write(Soft_I2C_Typedef *iic_typedef,uint8_t Reg,uint8_t Data)
{
//OS_ENTER_CRITICAL();
	Soft_I2C_Start(iic_typedef);
	Soft_I2C_Write(iic_typedef,_GSENSOR_ADDR_);
	Soft_I2C_Write(iic_typedef,Reg);
	Soft_I2C_Write(iic_typedef,Data);
	Soft_I2C_Stop(iic_typedef);
	//OS_EXIT_CRITICAL();
}
void gSense_Init(Soft_I2C_Typedef *iic_typedef)
{
	ADXL345_Write(iic_typedef,0x31, 0x00);	//éè??2aá????§
	ADXL345_Write(iic_typedef,0x2C, 0x0A);  //éè?¨?ù?ê
	ADXL345_Write(iic_typedef,0x2D, 0x08);  //éè?¨μ??′?￡ê?
	ADXL345_Write(iic_typedef,0x1E, 0x00);  //X??ò?á? 0 ó?óúD￡?y
	ADXL345_Write(iic_typedef,0x1F, 0x00);  //Y??ò?á? 0
	ADXL345_Write(iic_typedef,0x20, 0x0a);  //Z??ò?á? 0 
}
int GetGSensor(uint8_t which,uint8_t axis)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,0XFFFF);//??è????úIICê1ó?è¨
Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	uint8_t i,j,m_temp[6];
	int16_t GS_X,GS_Y,GS_Z;
	int8_t g_x,g_y,g_z;
	int8_t buf=0;
	int16_t GS_Data[_GS_cnt_][3];  //??á|?ó?ù?èμ?àúê?????￡????ˉ??2¨
	uint8_t GS_idx;
	
	
	gSense_Init(&iic_typedef);//3?ê??ˉ
	Delay1ms(2);
	
	for(GS_idx=0;GS_idx<_GS_cnt_;GS_idx++)
	{
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_GSENSOR_ADDR_);
		Soft_I2C_Write(&iic_typedef,0x32);
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_GSENSOR_ADDR_+1);
		for(j=0;j<5;j++)m_temp[j]=Soft_I2C_Read(&iic_typedef,0);
		m_temp[5]=Soft_I2C_Read(&iic_typedef,1);
		Soft_I2C_Stop(&iic_typedef);

		GS_Data[GS_idx][0]	=	(m_temp[1]*256+m_temp[0]);
		GS_Data[GS_idx][1]	=	(m_temp[3]*256+m_temp[2]);
		GS_Data[GS_idx][2]	=	(m_temp[5]*256+m_temp[4]);
	}
	//OS_EXIT_CRITICAL();
	GS_X = 0;
	GS_Y = 0;
	GS_Z = 0;
	g_x = 0;
	g_y = 0;
	g_z = 0;
	
	for(i=0;i<_GS_cnt_;i++)
	{
		GS_X += GS_Data[i][0];
		GS_Y += GS_Data[i][1];
		GS_Z += GS_Data[i][2];
	}
	
	g_x	=(int8_t)(GS_X/4/_GS_cnt_);
	g_y	=(int8_t)(GS_Y/4/_GS_cnt_);
	g_z	=(int8_t)(GS_Z/4/_GS_cnt_);
	
	switch(axis)
	{
		case 1:buf=g_x;break;
		case 2:buf=g_y;break;
		case 3:buf=g_z;break;
	}
	RcuWhichMutexGive(which,1,buf);//êí??IIC???úê1ó?è¨
	return buf;
}
 #endif
#endif

#ifdef   _GETBLUETOOTH_
#ifndef  _GETBLUETOOTH_EXISTS_
#define  _GETBLUETOOTH_EXISTS_
#include <jmkernel.h>

uint16_t GetBluetooth(void)  
{
   uint16_t m_temp;	
  //SetUsart1RxMode(0);//??í¨?￡ê?
  m_temp = ReadBTData();
  return m_temp;
}

 #endif
#endif


#ifdef   _SETBLUETOOTH_
#ifndef  _SETBLUETOOTH_EXISTS_
#define  _SETBLUETOOTH_EXISTS_
#include <jmkernel.h>

void SetBluetooth(uint8_t data)  
{
  SendBTData(data);
}

 #endif
#endif

//==SetBluetooth Readding ID:  == DON'T DELETE!! ==

#ifdef _SETWIFIDATA_
 #ifndef  _SETWIFIDATA_EXISTS_
  #define _SETWIFIDATA_EXISTS_

uint8_t SetWifiData(uint8_t data)
{
	return SetWirelessData(data);
}
 #endif
#endif

//==GetBluetooth Readding ID:  == DON'T DELETE!! ==

#ifdef _GETWIFIDATA_
 #ifndef  _GETWIFIDATA_EXISTS_
  #define _GETWIFIDATA_EXISTS_
 
uint16_t GetWifiData(void)
{
	return ReadWirelessData();
}
 #endif
#endif
//==SetFan Readding ID:  == DON'T DELETE!! == ??éè

#ifdef _SETFAN_
 #ifndef  _SETFAN_EXISTS_
  #define _SETFAN_EXISTS_
  #include <jmkernel.h>

void SetFan(uint8_t which,int speed)
{
speed=(uint8_t)speed;
	if(speed==0)
	{
		SetMotorX(which,1,speed);
	}
   else if(speed<=100)
	{
		SetMotorX(which,2,speed);
	}
   else
	{
SetMotorX(which,0,256-speed);
	}  
}

 #endif
#endif


//==SetIR Readding ID:  == DON'T DELETE!! == oìía?￠é? -PIN3

#ifdef _SETIR_
 #ifndef  _SETIR_EXISTS_
  #define _SETIR_EXISTS_
  #include <jmkernel.h>

void SetIR(uint8_t which,uint8_t state)
{
   volatile unsigned long i=0;
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint32_t port2=portarray[RcuPORT[which][1]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);

	if(state>0)
	{
		for(i=0;i<11500;i++);//for(i=0;i<9999;i++);
		for(i=0;i<11500;i++);//11500-2ms
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);//delay24ms
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		for(i=0;i<9999;i++);
    }
    HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);

}
 #endif
#endif


//==GetIRDete Readding ID:  == DON'T DELETE!! == oìía?óê? PIN3

#ifdef _GETIRDETE_
 #ifndef  _GETIRDETE_EXISTS_
  #define _GETIRDETE_EXISTS_
  #include <jmkernel.h>
  
uint8_t GetIRDete(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint8_t bit1=RcuPIN[which][0];
	
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value) return 0;
    else     return 1;
}
 #endif
#endif


//==GetIRDist Readding ID:  == DON'T DELETE!! == oìía2a?à

#ifdef _GETIRDIST_
 #ifndef  _GETIRDIST_EXISTS_
  #define _GETIRDIST_EXISTS_
  #include <jmkernel.h>

uint16_t GetIRDist(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
    uint16_t i;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);
    i=GetAdcResult(which);
    return (uint16_t)i;
}
 #endif
#endif

//==GetInfrared Readding ID:  == DON'T DELETE!! == è?ì?oìía

#ifdef _GETINFRARED_
 #ifndef  _GETINFRARED_EXISTS_
  #define _GETINFRARED_EXISTS_
  #include <jmkernel.h>

uint16_t GetInfrared(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//SCL
	uint8_t bit1=RcuPIN[which][0];
	
	GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);//GPIO_Mode_IPU
    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value) return 1;
    else     return 0;
}
 #endif
#endif

//==GetRemoIR Readding ID:  == DON'T DELETE!! == ?e??

#ifdef _GETREMOIR_
 #ifndef  _GETREMOIR_EXISTS_
  #define _GETREMOIR_EXISTS_
  #include <jmkernel.h>
  

uint16_t GetRemoIR(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
    uint16_t i;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);
    i=GetAdcResult(which);
    return (uint16_t)i;
}
 #endif
#endif


//==GetVolume Readding ID:  == DON'T DELETE!! == ?ó????

#ifdef _GETVOLUME_
 #ifndef  _GETVOLUME_EXISTS_
  #define _GETVOLUME_EXISTS_
  #include <jmkernel.h>

uint16_t GetVolume(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
    uint16_t i;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);
    i=GetAdcResult(which);
    return (uint16_t)i;
}
 #endif
#endif

//==GetVoltage Readding ID:  == DON'T DELETE!! == μ??1?ì2a
//μ??1±í1?ê?￡oVin=Vout/0.091μ￥???üì?=Vout*1000/91
//0.0~30.0
#ifdef _GETVOLTAGE_
 #ifndef  _GETVOLTAGE_EXISTS_
  #define _GETVOLTAGE_EXISTS_
  #include <jmkernel.h>

uint16_t GetVoltage(uint8_t which)//mV
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
	uint32_t adc;
	uint32_t m_Voltage;
	uint8_t i;
	uint32_t s=0;

    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);

	for(i=0;i<5;i++)
	{
		adc=GetAdcResult(which);
		s+=adc;
	}
	adc=s/5;
	
	m_Voltage=(uint32_t)((adc*80586)/91)/10000;//(((temp*3300*1000)/4095)/91);
	
    return (uint16_t)m_Voltage;
}
 #endif
#endif

//==GetCurrent Readding ID:  == DON'T DELETE!! == μ?á÷?ì2a
//μ?á÷±í1?ê?￡oI=|(Vout-2.5)/0.185 μ￥??°2±?￡?D?óú2.5Vê??oêy
//-4.0~4.0A
#ifdef _GETCURRENT_
 #ifndef  _GETCURRENT_EXISTS_
  #define _GETCURRENT_EXISTS_
  #include <jmkernel.h>
  
int GetCurrent(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
	uint16_t adc;
	float buf;
	int16_t m_current;
	uint8_t i;
	uint32_t s=0;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);

    for(i=0;i<5;i++)
	{
		adc=GetAdcResult(which);
		s+=adc;
	}
	adc=s/5;
	
	buf=(float)(adc*80.586);//(uint32_t)(adc*3300)/4095
	buf-=250000;
	m_current=(int16_t)(buf/185)/10;
	
    return (int)m_current;
}
 #endif
#endif


//==GetPhoto Readding ID:  == DON'T DELETE!! == 1a??

#ifdef _GETPHOTO_
 #ifndef  _GETPHOTO_EXISTS_
  #define _GETPHOTO_EXISTS_
  #include <jmkernel.h>

uint16_t GetPhoto(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][2]];//ADC
	uint8_t bit1=RcuPIN[which][2];
	
    uint16_t i;
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_ANALOG);
    i=GetAdcResult(which);
    return (uint16_t)i;
  }
 #endif
#endif

//==GetMagnet Readding ID:  == DON'T DELETE!! == ′??? PIN3

#ifdef _GETMAGNET_
 #ifndef  _GETMAGNET_EXISTS_
  #define _GETMAGNET_EXISTS_
  #include <jmkernel.h>
  
uint8_t GetMagnet(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint8_t bit1=RcuPIN[which][0];
	
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
    uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
    if(value) return 0;
    else     return 1;
}
 #endif
#endif


//==GetDTHSensor Readding ID:  == DON'T DELETE!! ==数字温湿度 PIN4
// digital temperature and humidity sensor
//0: Humidity
//1: Temperature
#ifdef _GETDTHSENSOR_
 #ifndef  _GETDTHSENSOR_EXISTS_
  #define _GETDTHSENSOR_EXISTS_
	#include <jmkernel.h>
	#include"DTHSensor.h"

uint16_t GetDTHSensor(uint8_t which,int mode)
{
    uint32_t port1=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][1];
	uint16_t value;
	uint8_t i,j;
	RcuWhichMutexTake(which,1,999);
	WIRE_PORT=port1;
	WIRE_BIT=bit1;

   i=0;j=20;
	do
	{
		i=GetDHT11Data(mode,&value);
		if(j>0)j--;
		else {i=1;j=0;}
	}while(i==0);
	RcuWhichMutexGive(which,1,999);
	return (uint16_t)value;
  }
 #endif
#endif

//==GetAirQuality  Readding ID: 0xa0 == DON'T DELETE!! == ?????êá?

#ifdef _GETAIRQUALITY_
 #ifndef  _GETAIRQUALITY_EXISTS_
  #define _GETAIRQUALITY_EXISTS_
	#include <jmkernel.h>
  #include "I2C_Soft.h"
#define _AQ_ADDR_		0XA1//I2C μ???
uint8_t GetAirQuality(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	
	uint8_t data;
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,0XFFFF);//??è????úIICê1ó?è¨
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0XA1);//0XA1
	data=Soft_I2C_Read(&iic_typedef,1);
	Soft_I2C_Stop(&iic_typedef);
	RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
	//OS_EXIT_CRITICAL();
	return (uint8_t)data;
  }
 #endif
#endif

//==GetMusicPlayer  Readding ID: 0xa0 == DON'T DELETE!! == ?????êá?

#ifdef _SETMUSICPLAYER_
 #ifndef  _SETMUSICPLAYER_EXISTS_
  #define _SETMUSICPLAYER_EXISTS_
	#include <jmkernel.h>
  #include "I2C_Soft.h"
#define _MUSICPLAY_ADDR_		0x0E//I2C μ???
void SetMusicPlayer(uint8_t which, int cmd)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	uint16_t i;
	//OS_ENTER_CRITICAL();
 
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef, _MUSICPLAY_ADDR_);
	Soft_I2C_Write(&iic_typedef,cmd);
	Soft_I2C_Stop(&iic_typedef);	
	RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
	//OS_EXIT_CRITICAL();
  }
 #endif
#endif

//==GetIR Readding ID:  == DON'T DELETE!! == oìía?￠é?ó??óê?ò?ì?

#ifdef _GETIR_
 #ifndef  _GETIR_EXISTS_
  #define _GETIR_EXISTS_
  #include <jmkernel.h>

uint8_t GetIR(uint8_t whichs,uint8_t whichr,uint8_t state)
{
   volatile unsigned long i=0;
   uint32_t port1=portarray[RcuPORT[whichs][0]];//I2C_SCL
   uint8_t bit1=RcuPIN[whichs][0];
   uint32_t port2=portarray[RcuPORT[whichr][0]];//I2C_SCL
   uint8_t bit2=RcuPIN[whichr][0];
	 
   RcuWhichMutexTake(whichs,1,0);
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	if(state>0)
	{
		for(i=0;i<11500;i++);//11500-2ms
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		for(i=0;i<11500;i++);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
		for(i=0;i<9999;i++);
    }
    GPIO_ResetBits((GPIO_TypeDef*)port1,( 1<<bit1));
	
    GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_Mode_IPU);
    uint8_t value=GPIO_ReadInputDataBit((GPIO_TypeDef*)port2,(1<<bit2));
		RcuWhichMutexGive(whichs,1,0);
    if(value) return 0;
    else     return 1;
}
 #endif
#endif

#ifdef   _SETWAITFORBLUETOOTH_
 #ifndef  _SETWAITFORBLUETOOTH_EXISTS_
 #define  _SETWAITFORBLUETOOTH_EXISTS_
   #include <jmkernel.h>

void SetWaitForBluetooth(uint8_t data)  
{
	uint16_t m_temp;	
	do
	{
		m_temp = ReadBTData();
	}while(m_temp!=data);
}

 #endif
#endif


#ifdef   _SETWAITFORWIFIDATA_
 #ifndef  _SETWAITFORWIFIDATA_EXISTS_
 #define  _SETWAITFORWIFIDATA_EXISTS_
   #include <jmkernel.h>

void SetWaitForWifiData(uint8_t data)  
{
	uint16_t m_temp;	
	do
	{
		m_temp = ReadWirelessData();
	}while(m_temp!=data);
}

 #endif
#endif

#ifdef _SETPIDMOTOR_
 #ifndef  _SETPIDMOTOR_EXISTS_
 #define _SETPIDMOTOR_EXISTS_
 #include <jmkernel.h>

void SetPIDMotor(uint8_t which,uint8_t speed)
{
	Motor_Init();
	MotorPIDTime_Init();
	MotorCodingInit();
	SetMotorPIDMode(which);
	SetPIDSpeed(which,speed);
}
 #endif
#endif

#ifdef _SETPIDMOTORREF_
 #ifndef  _SETPIDMOTORREF_EXISTS_
 #define _SETPIDMOTORREF_EXISTS_
 #include <jmkernel.h>

void SetPIDMotorRef(uint8_t pulse)
{
	SetFullSpeedRef(pulse);
}
 #endif
#endif

//------BE2560-ê±??è?àú?￡?é-----------------------------

//==calendar Readding adr:07  == DON'T DELETE!! ==

#ifdef _GETCALENDAR_
 #ifndef  _GETCALENDAR_EXISTS_
  #define _GETCALENDAR_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

unsigned char GetCalendar(uint8_t which, unsigned char command)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,88);//??è????úIICê1ó?è¨
Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char data;
    unsigned char temph,templ;
    unsigned char ack=1;    
	if((command>=30)&&(command<=41))
  {
		Soft_I2C_Start(&iic_typedef);
		ack &=Soft_I2C_Write(&iic_typedef,0x0e);
		ack &=Soft_I2C_Write(&iic_typedef,command);
		Soft_I2C_Stop(&iic_typedef);
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,0x0f);     
		data=Soft_I2C_Read(&iic_typedef,1);
		Soft_I2C_Stop(&iic_typedef); 
		//OS_EXIT_CRITICAL();
		if(command<37)
		{
			templ=data;
			temph=data;
			templ=templ&0x0f;       
			temph=temph>>4;
			data=temph*10+templ;
		}
		//return data;
  }
	else
	{
		data=88;//return 88;
	}
	RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
	return data;
}
 #endif
#endif

//==calendar write adr:07  == DON'T DELETE!! ==

#ifdef _SETCALENDAR_
 #ifndef  _SETCALENDAR_EXISTS_
  #define _SETCALENDAR_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetCalendar(uint8_t which, unsigned char sec,unsigned char min,unsigned char hour,unsigned char date,unsigned char month,unsigned char year)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1; 
    unsigned char buf[4];
    unsigned long temp;
    unsigned int temp1;
    
    Soft_I2C_Start(&iic_typedef);
    ack &=Soft_I2C_Write(&iic_typedef,0x0e);
    ack &=Soft_I2C_Write(&iic_typedef,49);    //COMMAND=49
    ack &=Soft_I2C_Write(&iic_typedef,year);    
    ack &=Soft_I2C_Write(&iic_typedef,month);
    ack &=Soft_I2C_Write(&iic_typedef,date);
    ack &=Soft_I2C_Write(&iic_typedef,hour); 
    ack &=Soft_I2C_Write(&iic_typedef,min);
    ack &=Soft_I2C_Write(&iic_typedef,sec);     
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
 }
 #endif
#endif

//== write calendaradr lcd:07  == DON'T DELETE!! ==

#ifdef _SETBE2560LCD1_
 #ifndef  _SETBE2560LCD1_EXISTS_
  #define _SETBE2560LCD1_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetBE2560LCD1(uint8_t which, unsigned char command,unsigned char lx,unsigned char lxdchar)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1;
    unsigned char led;
 
	if(command==50)
    {
		Soft_I2C_Start(&iic_typedef);
		ack &=Soft_I2C_Write(&iic_typedef,0x0e);
		ack &=Soft_I2C_Write(&iic_typedef,command);  
		ack &=Soft_I2C_Write(&iic_typedef,lx);   
		ack &=Soft_I2C_Write(&iic_typedef,lxdchar); 
		Soft_I2C_Stop(&iic_typedef);
    }
	if(command==54)
    {
		Soft_I2C_Start(&iic_typedef);
		ack &=Soft_I2C_Write(&iic_typedef,0x0e);
		ack &=Soft_I2C_Write(&iic_typedef,command); 
		Soft_I2C_Stop(&iic_typedef);
    }
	if(command==55)
    {
		Soft_I2C_Start(&iic_typedef);
		ack &=Soft_I2C_Write(&iic_typedef,0x0e);
		ack &=Soft_I2C_Write(&iic_typedef,command);    
		ack &=Soft_I2C_Write(&iic_typedef,lx); 
		Soft_I2C_Stop(&iic_typedef);
    }
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
 }

 #endif
#endif

//== write calendaradr lcd:07  == DON'T DELETE!! ==

#ifdef _SETBE2560BACK_
 #ifndef  _SETBE2560BACK_EXISTS_
  #define _SETBE2560BACK_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetBE2560Back(uint8_t which, unsigned char led)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1;
    
    Soft_I2C_Start(&iic_typedef);
    ack &=Soft_I2C_Write(&iic_typedef,0x0e);
    ack &=Soft_I2C_Write(&iic_typedef,53);    
    ack &=Soft_I2C_Write(&iic_typedef,led); 
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
    
}

 #endif
#endif

//== write calendaradr lcd:07  == DON'T DELETE!! ==

#ifdef _SETBE2560LCD3_
 #ifndef  _SETBE2560LCD3_EXISTS_
  #define _SETBE2560LCD3_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetBE2560LCD3(uint8_t which, unsigned char lx,unsigned int lxdint)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1; 
    unsigned char buf[2];
    unsigned int temp1;

    temp1=lxdint;
    buf[0]=(unsigned char)temp1;
    temp1=lxdint;  
    temp1=temp1>>8;
    buf[1]=(unsigned char)temp1;
    Soft_I2C_Start(&iic_typedef);
    ack &=Soft_I2C_Write(&iic_typedef,0x0e);
    ack &=Soft_I2C_Write(&iic_typedef,51);
    ack &=Soft_I2C_Write(&iic_typedef,lx);     
    ack &=Soft_I2C_Write(&iic_typedef,buf[0]); 
    ack &=Soft_I2C_Write(&iic_typedef,buf[1]); 
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
}

 #endif
#endif

//== write calendaradr lcd:07  == DON'T DELETE!! ==

#ifdef _SETBE2560LCD8_
 #ifndef  _SETBE2560LCD8_EXISTS_
  #define _SETBE2560LCD8_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetBE2560LCD8(uint8_t which, unsigned char lx,unsigned long lxdlong)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1; 
    unsigned char buf[4];
    unsigned long temp1;
	
    temp1=lxdlong;
    buf[0]=(unsigned char)temp1;

    temp1=lxdlong;  
    temp1=temp1>>8;
    buf[1]=(unsigned char)temp1;

    temp1=lxdlong;
    temp1=temp1>>16;
    buf[2]=(unsigned char)temp1;

    temp1=lxdlong;  
    temp1=temp1>>24;
    buf[3]=(unsigned char)temp1;
    Soft_I2C_Start(&iic_typedef);
    ack &=Soft_I2C_Write(&iic_typedef,0x0e);
    ack &=Soft_I2C_Write(&iic_typedef,52);
    ack &=Soft_I2C_Write(&iic_typedef,lx);     
    ack &=Soft_I2C_Write(&iic_typedef,buf[0]); 
    ack &=Soft_I2C_Write(&iic_typedef,buf[1]); 
    ack &=Soft_I2C_Write(&iic_typedef,buf[2]); 
    ack &=Soft_I2C_Write(&iic_typedef,buf[3]); 
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
 }

 #endif
#endif

//== set calendaradr speaker:07  == DON'T DELETE!! ==

#ifdef _SETBE2560SPK_
 #ifndef  _SETBE2560SPK_EXISTS_
  #define _SETBE2560SPK_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetBE2560spk(uint8_t which, unsigned char time,unsigned int freq)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	//OS_ENTER_CRITICAL();

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char ack=1; 
    unsigned char buf[2];
    unsigned int temp1;
    
    temp1=freq;
    buf[0]=(unsigned char)temp1;
    temp1=freq;  
    temp1=temp1>>8;
    buf[1]=(unsigned char)temp1;
    Soft_I2C_Start(&iic_typedef);
    ack &=Soft_I2C_Write(&iic_typedef,0x0e);
    ack &=Soft_I2C_Write(&iic_typedef,56);
    ack &=Soft_I2C_Write(&iic_typedef,time);     
    ack &=Soft_I2C_Write(&iic_typedef,buf[0]); 
    ack &=Soft_I2C_Write(&iic_typedef,buf[1]); 
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
  //OS_EXIT_CRITICAL();
 }

 #endif
#endif


//==SETAHRS Readding ID:  == DON'T DELETE!! == áù?á

#ifdef _SETAHRS_
 #ifndef  _SETAHRS_EXISTS_
  #define _SETAHRS_EXISTS_
  
  #include <jmkernel.h>
  #include "I2C_Soft.h"
void SetAHRS(uint8_t which,uint8_t command)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();

	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0x3a);//addr
	Soft_I2C_Write(&iic_typedef,0xaa);
	Soft_I2C_Write(&iic_typedef,0x55);
	Soft_I2C_Write(&iic_typedef,command);
	Soft_I2C_Write(&iic_typedef,0);
	Soft_I2C_Write(&iic_typedef,0);
	Soft_I2C_Write(&iic_typedef,0);
	Soft_I2C_Write(&iic_typedef,0xcf);
	Soft_I2C_Stop(&iic_typedef);
	RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
	//OS_EXIT_CRITICAL();
	Delay1ms(1000);
}
 #endif
#endif

//==GETAHRS Readding ID:  == DON'T DELETE!! == áù?á

#ifdef _GETAHRS_
 #ifndef  _GETAHRS_EXISTS_
  #define _GETAHRS_EXISTS_
  
  #include <jmkernel.h>
  #include "I2C_Soft.h"
  
  int16_t g_AhrsRecBuf[8][9];
  uint8_t g_AhrsRecBufCnt[8];
  uint8_t g_AhrsFistRxFlag[8];
  uint8_t g_LastCmdList[8][9];
int16_t GetAHRSRecBuf(uint8_t which,uint8_t cnt)//êy?Yò??-?á3??ò?μ??8888
{
	int16_t buf;
	if(cnt>8)return 9999;//cnt=9-1
	buf=g_AhrsRecBuf[which][cnt];
	g_AhrsRecBuf[which][cnt]=8888;
	if(buf!=8888)
	{
		g_AhrsRecBufCnt[which]++;
		g_LastCmdList[which][cnt]=1;
	}
	if(g_AhrsRecBufCnt[which]>8)//ò??-???o′?è?2??á3?
	{
		g_AhrsRecBufCnt[which]=0;
		g_AhrsFistRxFlag[which]=0;
	}
	return buf;
}
int16_t GetAHRS(uint8_t which,uint8_t command1,uint8_t command2)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	uint8_t i,j;
	uint8_t ACK=0;
	int16_t m_data;
	uint8_t m_AhrsRecBufList[22];
	uint8_t m_Rxflag=0;//?óê?ò?′??üá?
	uint8_t whichx=which-1;
	//OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,9999);//??è????úIICê1ó?è¨
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	if(g_AhrsFistRxFlag[whichx]==0||command2||g_LastCmdList[whichx][command1-1])
	{
		m_Rxflag=1;//?óê?ò?′??o′?
		if(command2==0)g_AhrsFistRxFlag[whichx]=1;
		else g_AhrsFistRxFlag[whichx]=0;
		for(i=0;i<9;i++)	{g_LastCmdList[whichx][i]=0;}//??á?
		
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,0x3b);//addr
		for(i=0;i<22;i++)
		{
			if(i==21) ACK =1;
			else  ACK = 0;
			m_AhrsRecBufList[i]=Soft_I2C_Read(&iic_typedef,ACK);  
		}  
		Soft_I2C_Stop(&iic_typedef);
	}
	//OS_EXIT_CRITICAL();
	if(m_Rxflag)//?óê?ò?′?êy?Y
    {
		g_AhrsRecBufCnt[whichx]=0;
		if(m_AhrsRecBufList[0]==0xaa && m_AhrsRecBufList[1]==0x55 && m_AhrsRecBufList[21]==0xcf)//?yè?êy?Y°ü
		{
			g_AhrsFistRxFlag[whichx]=2;
			g_AhrsRecBuf[whichx][0]=(int16_t)(m_AhrsRecBufList[2])|((int8_t)m_AhrsRecBufList[3]<<8);//roll//oá1??? degree￡¨??′ó10±?￡?
			g_AhrsRecBuf[whichx][1]=(int16_t)(m_AhrsRecBufList[4])|((int8_t)m_AhrsRecBufList[5]<<8);//pitch//?????? degree￡¨??′ó10±?￡?
			g_AhrsRecBuf[whichx][2]=(int16_t)(m_AhrsRecBufList[6])|((int8_t)m_AhrsRecBufList[7]<<8);//yaw//??o??? degree￡¨??′ó10±?￡?
			g_AhrsRecBuf[whichx][3]=(int16_t)(m_AhrsRecBufList[8])|((int8_t)m_AhrsRecBufList[9]<<8);//ax//?ó?ù?èX g￡¨??′ó100±?￡?
			g_AhrsRecBuf[whichx][4]=(int16_t)(m_AhrsRecBufList[10])|((int8_t)m_AhrsRecBufList[11]<<8);//ay//?ó?ù?èY g￡¨??′ó100±?￡?
			g_AhrsRecBuf[whichx][5]=(int16_t)(m_AhrsRecBufList[12])|((int8_t)m_AhrsRecBufList[13]<<8);//az//?ó?ù?èZ g￡¨??′ó100±?￡?
			g_AhrsRecBuf[whichx][6]=(int16_t)(m_AhrsRecBufList[14])|((int8_t)m_AhrsRecBufList[15]<<8);//gx//íó?Yò?X  dps￡¨??′ó100±?￡?
			g_AhrsRecBuf[whichx][7]=(int16_t)(m_AhrsRecBufList[16])|((int8_t)m_AhrsRecBufList[17]<<8);//gy//íó?Yò?Y  dps￡¨??′ó100±?￡?
			g_AhrsRecBuf[whichx][8]=(int16_t)(m_AhrsRecBufList[18])|((int8_t)m_AhrsRecBufList[19]<<8);//gz//íó?Yò?Z  dps￡¨??′ó100±?￡?
		}
		else 
		{
			g_AhrsFistRxFlag[whichx]=0;
			return 9999;//?óê?μ???êy?Y°ü
		}
		m_AhrsRecBufList[0]=0;		
		m_AhrsRecBufList[1]=0; 		
		m_AhrsRecBufList[21]=0;
   }
   if(g_AhrsFistRxFlag[whichx]==2)  m_data=GetAHRSRecBuf(whichx,command1-1);//command1=1~9
   else m_data=9999;
	 RcuWhichMutexGive(which,1,m_data);//êí??IIC???úê1ó?è¨
   return (int16_t)m_data;
}
 #endif
#endif

#ifdef _SETEXTBLUETOOTHMODE_
 #ifndef  _SETEXTBLUETOOTHMODE_EXISTS_
  #define _SETEXTBLUETOOTHMODE_EXISTS_
  
	#include "jmkernel.h"
	#include "bluetooth.h"
	
uint8_t SetExtBluetoothMode(uint8_t *name,uint8_t *mode,uint8_t *pswd)
{
	return ExtBT_Config(name,mode,pswd);
}

 #endif
#endif

#ifdef _SETEXTBLUETOOTH_
 #ifndef  _SETEXTBLUETOOTH_EXISTS_
  #define _SETEXTBLUETOOTH_EXISTS_
  
	#include "jmkernel.h"
	#include "bluetooth.h"
	
void SetExtBluetooth(uint8_t data)
{
	SendExtBTData(data);
}

 #endif
#endif

#ifdef _GETEXTBLUETOOTH_
 #ifndef  _GETEXTBLUETOOTH_EXISTS_
  #define _GETEXTBLUETOOTH_EXISTS_
  
	#include "jmkernel.h"
	#include "bluetooth.h"
	
uint16_t GetExtBluetooth(void)
{
	return ReadExtBTData();
}

 #endif
#endif

#ifdef _SETEXTBLUETOOTHCMD_
 #ifndef  _SETEXTBLUETOOTHCMD_EXISTS_
  #define _SETEXTBLUETOOTHCDM_EXISTS_
  
	#include "jmkernel.h"
	#include "bluetooth.h"
	
uint8_t SetExtBluetoothCmd(uint8_t mode,uint8_t *strcmd,uint8_t *str)
{
	return ExtBT_AT_SetCmd(mode,strcmd,str);
}

 #endif
#endif

#ifdef _GETREMOTECONTROLLERBUTTON_
 #ifndef  _GETREMOTECONTROLLERBUTTON_EXISTS_
  #define _GETREMOTECONTROLLERBUTTON_EXISTS_
  
	#include "jmkernel.h"
//0~19,20~39:0~39?ü??,40:è?2??ü???μ
uint32_t GetRemoteControllerButton(void)//?ü??
{
	Joystick_Init();
	//26bit=1,0~19bit?ü??0~19,26bit=1,0~19bit?ü??20~39;
	//27bit=1,3D?￡ê?,27bit=0,??í¨?￡ê?;
	//20~25bit±￡á?
	return ReadJSButtonData(0);//0 ?μ??1~4?ü?μ(32Bit),1~4?μ??1~4?ü?μ(8Bit)
}

 #endif
#endif

#ifdef _GETREMOTECONTROLLERBUTTONSTATE_
 #ifndef  _GETREMOTECONTROLLERBUTTONSTATE_EXISTS_
  #define _GETREMOTECONTROLLERBUTTONSTATE_EXISTS_
  
	#include "jmkernel.h"
//0~19,20~39:0~39?ü??
uint16_t GetRemoteControllerButtonState(void)//?μ???ü???μ
{
	uint32_t m_buf=0;
	uint8_t i,flag=0;
	Joystick_Init();
	m_buf=ReadJSButtonData(0);	//0 ?μ??1~4?ü?μ(32Bit),1~4?μ??1~4?ü?μ(8Bit)
	if((m_buf&0x000fffff)==0)return 999;//??óD°′?ü°′?? 
	if(m_buf&(0x04000000))flag=1;
	for(i=0;i<20;i++)
	{
		if(m_buf&(1<<i))
		{
			if(flag)return (i+20);
			else return i;
		}
	}
	return 999;
}

 #endif
#endif

#ifdef _GETREMOTECONTROLLERROCKER_
 #ifndef  _GETREMOTECONTROLLERROCKER_EXISTS_
  #define _GETREMOTECONTROLLERROCKER_EXISTS_
  
	#include "jmkernel.h"
	//dir=0 left,dir=1 right, axis=0 x,  axis=1 y
uint32_t GetRemoteControllerRocker(uint8_t dir,uint8_t axis)//ò????μ
{
	Joystick_Init();
	if(dir==0)
	{
		if(axis==0)return ReadJSRockerData(1);
		else return ReadJSRockerData(2);
	}
	else
	{
		if(axis==0)return ReadJSRockerData(3);
		else return ReadJSRockerData(4);
	}
}

 #endif
#endif


#ifdef _GETREMOTECONTROLLERGRAVITY_
 #ifndef  _GETREMOTECONTROLLERGRAVITY_EXISTS_
  #define _GETREMOTECONTROLLERGRAVITY_EXISTS_

	#include "jmkernel.h"
	//i=1 x,i=2 y,i=3 z
int16_t GetRemoteControllerGravity(uint8_t i)//?áè???á|?ó?ù?è
{
	uint16_t m_val;
	Joystick_Init();
	m_val=ReadJSGravityData(i+3);
	if(m_val==999)return 999;
	return (int8_t)m_val;
}

 #endif
#endif

#ifdef _GETREMOTECONTROLLEREULERIAN_
 #ifndef  _GETREMOTECONTROLLEREULERIAN_EXISTS_
  #define _GETREMOTECONTROLLEREULERIAN_EXISTS_

	#include "jmkernel.h"

uint16_t g_QLastList[4];
int16_t g_RollLast,g_PitchLast,g_YawLast;

//i=1 Roll,2 Pitch,3 Yaw
int16_t GetRemoteControllerEulerian(uint8_t i)//?áè???à-??
{
	int16_t m_val=0;
	float quartf[4];
	int32_t q0,q1,q2,q3;
	Joystick_Init();
	if(ReadJSQuartfData(&q0,&q1,&q2,&q3)==0)
	{
		g_QLastList[0]=0;
		g_QLastList[1]=0;
		g_QLastList[2]=0;
		g_QLastList[3]=0;
		g_RollLast=0;g_PitchLast=0;g_YawLast=0;
		return 999;
	}
	if(g_QLastList[0]!=q0||g_QLastList[1]!=q1||g_QLastList[2]!=q2||g_QLastList[3]!=q3)
	{
		quartf[0] = q0/1073741824.0;  
		quartf[1] = q1/1073741824.0;
		quartf[2] = q2/1073741824.0;
		quartf[3] = q3/1073741824.0;
	}
	switch(i)
	{
		case 1:// Roll
		{
			if(g_QLastList[0]==q0&&g_QLastList[1]==q1&&g_QLastList[2]==q2&&g_QLastList[3]==q3)return (int16_t)g_RollLast;
			m_val = atan2(2*(quartf[2]*quartf[3]+quartf[0]*quartf[1]),\
					quartf[0]*quartf[0]-quartf[1]*quartf[1]-quartf[2]*quartf[2]+quartf[3]*quartf[3])*57.3;
			g_RollLast=m_val;
		}break;
		case 2:// Pitch
		{
			if(g_QLastList[0]==q0&&g_QLastList[1]==q1&&g_QLastList[2]==q2&&g_QLastList[3]==q3)return (int16_t)g_PitchLast;
			m_val = asin(-2*(quartf[1]*quartf[3]-quartf[0]*quartf[2]))*57.3;
			g_PitchLast=m_val;
		}break;
		case 3:// Yaw
		{
			if(g_QLastList[0]==q0&&g_QLastList[1]==q1&&g_QLastList[2]==q2&&g_QLastList[3]==q3)return (int16_t)g_YawLast;
			m_val = atan2(2*(quartf[1]*quartf[2]+quartf[0]*quartf[3]),\
			quartf[0]*quartf[0]+quartf[1]*quartf[1]-quartf[2]*quartf[2]-quartf[3]*quartf[3])*57.3;
			g_YawLast=m_val;
		}break;
	}
	return (int16_t)m_val;
}

 #endif
#endif

#ifdef _SETMOTORDIRECTION_
 #ifndef  _SETMOTORDIRECTION_EXISTS_
 #define _SETMOTORDIRECTION_EXISTS_
 #include <jmkernel.h>

void SetMotorDirection(uint8_t dir,uint8_t speed)//dir 0:left 1:right ;speed 0~10
{
	if(speed > 0)
		speed = 2;
	Change_Motor_Dir(dir,speed);
}
 #endif
#endif


//==SetLCDSolidCircle Readding ID:  == DON'T DELETE!! == ?-êμD??2

#ifdef _SETLCDSOLIDCIRCLE_
 #ifndef  _SETLCDSOLIDCIRCLE_EXISTS_
  #define _SETLCDSOLIDCIRCLE_EXISTS_
 #include <jmkernel.h>
#include "LCD320240.h"
  
void SetLCDSolidCircle(int x,int y,uint16_t radius,uint16_t color)
{
	uint16_t xs,xe,ix,ys,ye,iy,yb,ib;
	if(x>radius)xs=x-radius;
	else xs=0;
	xe=x+radius;
	SetBackLed(g_LcdBackLignt);
	for(ix=xs;ix<=xe;ix++)
	{
		if(ix>x)	ib=sqrt(radius*radius-(ix-x)*(ix-x));
		else ib=sqrt(radius*radius-(x-ix)*(x-ix));
		if(y>ib)ys=y-ib;
		else ys=0;
		ye=y+ib;
		if(ye>319)ye=319;
		LCD_DrawRectangleFont( ix,ys,ix, ye, color);
	}
}
 #endif
#endif

//==SetLCDFilledRectangle Readding ID:  == DON'T DELETE!! == ?-êμD???D?

#ifdef _SETLCDFILLEDRECTANGLE_
 #ifndef  _SETLCDFILLEDRECTANGLE_EXISTS_
  #define _SETLCDFILLEDRECTANGLE_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDFilledRectangle(int x1,int y1,int x2,int y2,uint16_t color)
{
	SetBackLed(g_LcdBackLignt);
	LCD_DrawRectangleFont(x1,y1,x2,y2,color);
}
 #endif
#endif

//==SetLCDRectangle Readding ID:  == DON'T DELETE!! == ?-??D?

#ifdef _SETLCDRECTANGLE_
 #ifndef  _SETLCDRECTANGLE_EXISTS_
  #define _SETLCDRECTANGLE_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDRectangle(int x1,int y1,int x2,int y2,int w,uint16_t color)
{
	uint8_t wmx,wmy,wm;
	wmx=x2-x1;
	wmy=y2-y1;
	wm=(wmx<wmy)?wmx:wmy;
	if(w>wm)w=wm;
	if(w>0)w-=1;
	SetBackLed(g_LcdBackLignt);
	LCD_DrawRectangleFont( x1,y1,x2,y1+w, color);
	LCD_DrawRectangleFont( x1,y1+w,x1+w, y2, color);
	LCD_DrawRectangleFont( x1+w,y2-w,x2, y2, color);
	LCD_DrawRectangleFont( x2-w,y1+w,x2, y2-w, color);
}
 #endif
#endif

//==GetColorSensor Readding ID:  == DON'T DELETE!! == BE1130
//STM8 addr 10bit//N76E003 addr 8bit
#ifdef _GETCOLORSENSOR_
 #ifndef  _GETCOLORSENSOR_EXISTS_
  #define _GETCOLORSENSOR_EXISTS_
  
  #include "I2C_Soft.h"
 uint8_t MCUN76E003FirstByte; 
uint32_t GetColorSensor(uint8_t which,uint8_t cmd)
{   
  uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
  uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
  uint8_t bit1=RcuPIN[which][0];
  uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
                    &iic_typedef);
  uint32_t m_val=0;
  uint8_t m_val1=0, m_val2=0, m_val3=0;
  uint8_t m_bit1=0, m_bit2=0;
  uint8_t first=0,end=0;
  uint8_t m_id=0;
  uint8_t sum=0,m_para1=0,m_para2=0;
  uint8_t addrh,addrl;
  uint8_t id=1;
  uint8_t addr;
  
   RcuWhichMutexGive(which,1,MCUN76E003FirstByte);//释放IIC端口使用权

    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0xA9);//SlaveAddr+0x01
    MCUN76E003FirstByte=Soft_I2C_Read(&iic_typedef,1);//0xA9
    Soft_I2C_Stop(&iic_typedef);//停止位
    if(MCUN76E003FirstByte==0xA9)  //适配N76E003的7bit地址
    {
         addr=id+0xA8-1;//0xA8

          //FistByte+cmd+parameter1+parameter2+sum
          Soft_I2C_Start(&iic_typedef);
        //  Soft_I2C_Write(&iic_typedef,0xf6);//SlaveAddrH
          Soft_I2C_Write(&iic_typedef,addr);//SlaveAddrL
          Soft_I2C_Write(&iic_typedef,0xFA);//0
          Soft_I2C_Write(&iic_typedef,cmd);//2
           Soft_I2C_Stop(&iic_typedef);//停止位
        //FistByte+id+parameter1+[parameter2]+[parameter3]+sum
        //if(cmd<20&&cmd>0)//接收数据

        if((cmd<20&&cmd>0)||(cmd>60&&cmd<=74)||((cmd>=254)&&(cmd<=255)))
        {
          Soft_I2C_Start(&iic_typedef);//重复起始位
          Soft_I2C_Write(&iic_typedef,0xA9);//SlaveAddr|0x01
          first=Soft_I2C_Read(&iic_typedef,0);//SlaveAddr|0x01
          first=Soft_I2C_Read(&iic_typedef,0);
          m_id=Soft_I2C_Read(&iic_typedef,0);
          m_val1=Soft_I2C_Read(&iic_typedef,0);
          if((cmd>=5&&cmd<=18)||(cmd>60&&cmd<=74)||(cmd==254))
          {
            m_val2=Soft_I2C_Read(&iic_typedef,0);
            m_bit1=8;m_bit2=0;
          }
          if(cmd==5)
          {
            m_val3=Soft_I2C_Read(&iic_typedef,0);
            m_bit1=16;m_bit2=8;
          }
          end=Soft_I2C_Read(&iic_typedef,1);
        }
        Soft_I2C_Stop(&iic_typedef);//停止位

        //OS_EXIT_CRITICAL();
        sum=m_id+m_val1+m_val2+m_val3;//校验和计算

        if(first==0xEA&&sum==end&&m_id==addr)
        {
          m_val=(uint32_t)(m_val1<<m_bit1)|(m_val2<<m_bit2)|(m_val3);
        }
        else
        {
          m_val=999;
        }
        RcuWhichMutexGive(which,1,m_val);//释放IIC端口使用权
        return m_val;

    }
    else
    {
            addr=id+0x50-1;//0xf650~0xf657

         //FistByte+cmd+parameter1+parameter2+sum
          Soft_I2C_Start(&iic_typedef);
          Soft_I2C_Write(&iic_typedef,0xf6);//SlaveAddrH
          Soft_I2C_Write(&iic_typedef,addr);//SlaveAddrL
          Soft_I2C_Write(&iic_typedef,0xFA);//0
          Soft_I2C_Write(&iic_typedef,cmd);//2

          //FistByte+id+parameter1+[parameter2]+[parameter3]+sum
          //if(cmd<20&&cmd>0)//接收数据
         if((cmd<20&&cmd>0)||(cmd>60&&cmd<=74)||((cmd>=254)&&(cmd<=255)))
         {
             Soft_I2C_Start(&iic_typedef);//重复起始位
             Soft_I2C_Write(&iic_typedef,0xf7);//SlaveAddr|0x01
             first=Soft_I2C_Read(&iic_typedef,0);
             m_id=Soft_I2C_Read(&iic_typedef,0);//低八位地址
             m_val1=Soft_I2C_Read(&iic_typedef,0);
            if((cmd>=5&&cmd<=18)||(cmd>60&&cmd<=74)||(cmd==254))
           {
                m_val2=Soft_I2C_Read(&iic_typedef,0);
              m_bit1=8;m_bit2=0;
            }
             if(cmd==5)
           {
               m_val3=Soft_I2C_Read(&iic_typedef,0);
               m_bit1=16;m_bit2=8;
            }
           end=Soft_I2C_Read(&iic_typedef,1);
         }
          Soft_I2C_Stop(&iic_typedef);//停止位

          //OS_EXIT_CRITICAL();
          sum=m_id+m_val1+m_val2+m_val3;//校验和计算

         if(first==0xEA&&sum==end&&m_id==addr)
         {
            m_val=(uint32_t)(m_val1<<m_bit1)|(m_val2<<m_bit2)|(m_val3);
         }
          else
          {
            m_val=999;
         }
         RcuWhichMutexGive(which,1,m_val);//释放IIC端口使用权
         return m_val;
    }

}
 #endif
#endif




//==GetColorSensorRGB Readding ID:  == DON'T DELETE!! == BE1130
//addr 10bit
#ifdef _GETCOLORSENSORRGB_
 #ifndef  _GETCOLORSENSORRGB_EXISTS_
  #define _GETCOLORSENSORRGB_EXISTS_
  
  #include "I2C_Soft.h"
 uint8_t GetMCUN76E003FirstByteRGB; //颜色传感器专用
uint32_t GetColorSensorRGB(uint8_t which,uint8_t cmd)
{   
  uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
  uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
  uint8_t bit1=RcuPIN[which][0];
  uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
                    &iic_typedef);
  uint32_t m_val=0;
  uint8_t m_val1=0, m_val2=0, m_val3=0;
  uint8_t m_bit1=0, m_bit2=0;
  uint8_t first=0,end=0;
  uint8_t m_id=0;
  uint8_t sum=0,m_para1=0,m_para2=0;
  uint8_t addrh,addrl;
  uint8_t id=1;
  uint8_t addr;

   RcuWhichMutexGive(which,1,MCUN76E003FirstByte);//释放IIC端口使用权
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0xA9);//SlaveAddr+0x01
    GetMCUN76E003FirstByteRGB=Soft_I2C_Read(&iic_typedef,1);//0xA9
    Soft_I2C_Stop(&iic_typedef);//停止位
    if(GetMCUN76E003FirstByteRGB==0xA9)  
  {
        addr=id+0xA8-1;//0xA8
  
        //FistByte+cmd+parameter1+parameter2+sum
        Soft_I2C_Start(&iic_typedef);
      //  Soft_I2C_Write(&iic_typedef,0xf6);//SlaveAddrH
        Soft_I2C_Write(&iic_typedef,addr);//SlaveAddrL
        Soft_I2C_Write(&iic_typedef,0xFA);//0
        Soft_I2C_Write(&iic_typedef,cmd);//2
         Soft_I2C_Stop(&iic_typedef);//停止位
      //FistByte+id+parameter1+[parameter2]+[parameter3]+sum
      //if(cmd<20&&cmd>0)//接收数据
    
      if((cmd<20&&cmd>0)||(cmd>60&&cmd<=74)||((cmd>=254)&&(cmd<=255)))
      {
        Soft_I2C_Start(&iic_typedef);//重复起始位
        Soft_I2C_Write(&iic_typedef,0xA9);//SlaveAddr|0x01
        first=Soft_I2C_Read(&iic_typedef,0);//SlaveAddr|0x01
        first=Soft_I2C_Read(&iic_typedef,0);
        m_id=Soft_I2C_Read(&iic_typedef,0);
        m_val1=Soft_I2C_Read(&iic_typedef,0);
        if((cmd>=5&&cmd<=18)||(cmd>60&&cmd<=74)||(cmd==254))
        {
          m_val2=Soft_I2C_Read(&iic_typedef,0);
          m_bit1=8;m_bit2=0;
        }
        if(cmd==5)
        {
          m_val3=Soft_I2C_Read(&iic_typedef,0);
          m_bit1=16;m_bit2=8;
        }
        end=Soft_I2C_Read(&iic_typedef,1);
      } 
      Soft_I2C_Stop(&iic_typedef);//停止位
      
      //OS_EXIT_CRITICAL();
      sum=m_id+m_val1+m_val2+m_val3;//校验和计算

      if(first==0xEA&&sum==end&&m_id==addr) 
      {
        m_val=(uint32_t)(m_val1<<m_bit1)|(m_val2<<m_bit2)|(m_val3);
      }
      else 
      {
        m_val=999;
      }
      RcuWhichMutexGive(which,1,m_val);//释放IIC端口使用权
      return m_val;
  }
   else
   {
  
        addr=id+0x50-1;//0xf650~0xf657
        
        //FistByte+cmd+parameter1+parameter2+sum
        Soft_I2C_Start(&iic_typedef);
        Soft_I2C_Write(&iic_typedef,0xf6);//SlaveAddrH
        Soft_I2C_Write(&iic_typedef,addr);//SlaveAddrL
        Soft_I2C_Write(&iic_typedef,0xFA);//0
        Soft_I2C_Write(&iic_typedef,cmd);//2
        
        //FistByte+id+parameter1+[parameter2]+[parameter3]+sum
        //if(cmd<20&&cmd>0)//接收数据
        if((cmd<20&&cmd>0)||(cmd>60&&cmd<=74)||((cmd>=254)&&(cmd<=255)))
        {
          Soft_I2C_Start(&iic_typedef);//重复起始位
          Soft_I2C_Write(&iic_typedef,0xf7);//SlaveAddr|0x01
          first=Soft_I2C_Read(&iic_typedef,0);
          m_id=Soft_I2C_Read(&iic_typedef,0);//低八位地址
          m_val1=Soft_I2C_Read(&iic_typedef,0);
          if((cmd>=5&&cmd<=18)||(cmd>60&&cmd<=74)||(cmd==254))
          {
            m_val2=Soft_I2C_Read(&iic_typedef,0);
            m_bit1=8;m_bit2=0;
          }
          if(cmd==5)
          {
            m_val3=Soft_I2C_Read(&iic_typedef,0);
            m_bit1=16;m_bit2=8;
          }
          end=Soft_I2C_Read(&iic_typedef,1);
        } 
        Soft_I2C_Stop(&iic_typedef);//停止位
        
        //OS_EXIT_CRITICAL();
        sum=m_id+m_val1+m_val2+m_val3;//校验和计算

        if(first==0xEA&&sum==end&&m_id==addr) 
        {
          m_val=(uint32_t)(m_val1<<m_bit1)|(m_val2<<m_bit2)|(m_val3);
        }
        else 
        {
          m_val=999;
        }
        RcuWhichMutexGive(which,1,m_val);//释放IIC端口使用权
        return m_val;
  }
}
 #endif
#endif


//==SetColorSensor Readding ID:  == DON'T DELETE!! == BE1130
//addr 10bit
#ifdef _SETCOLORSENSOR_
 #ifndef  _SETCOLORSENSOR_EXISTS_
  #define _SETCOLORSENSOR_EXISTS_
  
  #include "I2C_Soft.h"
 uint8_t SetMCUN76E003FirstByte; //颜色传感器专用
uint32_t SetColorSensor(uint8_t which,uint8_t cmd,int parameter)
{   
  uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
  uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
  uint8_t bit1=RcuPIN[which][0];
  uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
  Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
                    &iic_typedef);
  uint8_t sum=0;
  uint8_t addr=0x50;//临时地址的低八位
  uint8_t m_addrh,m_addrl;
  uint8_t first,m_id,end;
  uint16_t m_val;
  uint8_t id=1;
  if(cmd==40||cmd==41)return;
  //sum=ID+cmd+parameter1+parameter2;
  

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,0xA9);//SlaveAddr+0x01
  SetMCUN76E003FirstByte=Soft_I2C_Read(&iic_typedef,1);//0xA9
  Soft_I2C_Stop(&iic_typedef);//停止位
  
  if(SetMCUN76E003FirstByte==0xA9)  
  {
        //从机地址为8Bite  0XA8
      //TX FistByte+cmd+parameter1+parameter2
      Soft_I2C_Start(&iic_typedef);
      Soft_I2C_Write(&iic_typedef,0xA8);//0I2C_ADDR
      Soft_I2C_Write(&iic_typedef,0xEA);//0I2C_SetFirstByte
      Soft_I2C_Write(&iic_typedef,cmd);//写从机命令
      Soft_I2C_Write(&iic_typedef,parameter>>8);//
      Soft_I2C_Write(&iic_typedef,parameter&0xff);//
      Soft_I2C_Stop(&iic_typedef);
      RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
      //OS_EXIT_CRITICAL();
      if(((cmd>=31)&&(cmd<=32))||(cmd>=34&&cmd<=37)||(cmd>=44&&cmd<=55))Delay1ms(25);
      else if(cmd>=33)Delay1ms(200);
      else if(cmd>=43)Delay1ms(1500);
  }
  else
  {
      //从机地址为10Bite 0xf6xx:高2位固定为11,低八位为0x50~0x57,即实际使用的地址为0x350~0x357(0xf650~0xf657)
      //TX FistByte+cmd+parameter1+parameter2
      Soft_I2C_Start(&iic_typedef);
      Soft_I2C_Write(&iic_typedef,0xf6);//写临时地址
      Soft_I2C_Write(&iic_typedef,addr);//
      Soft_I2C_Write(&iic_typedef,0xEA);//0I2C_SetFirstByte
      Soft_I2C_Write(&iic_typedef,cmd);//写从机命令
      Soft_I2C_Write(&iic_typedef,parameter>>8);//
      Soft_I2C_Write(&iic_typedef,parameter&0xff);//
      Soft_I2C_Stop(&iic_typedef);
      RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
      //OS_EXIT_CRITICAL();
      if(((cmd>=31)&&(cmd<=32))||(cmd>=34&&cmd<=37)||(cmd>=44&&cmd<=55))Delay1ms(25);
      else if(cmd>=33)Delay1ms(200);
      else if(cmd>=43)Delay1ms(1500);
  }
}
 #endif
#endif

//==SetServo Readding ID:  == DON'T DELETE!! ==
#ifdef _SETSERVO_
 #ifndef  _SETSERVO_EXISTS_
  #define _SETSERVO_EXISTS_
  
void SetServo(uint8_t which,int angle)
{
	SetComServoAngleAdjustFlag(which,1);
    ComServoInit(which);
	if(angle==220)ComServoAngle(which,0,0);//释放伺服
	else ComServoAngle(which,(angle+50),0);
}
 #endif
#endif

//==SetServo Readding ID:  == DON'T DELETE!! ==
#ifdef _SETSERVOTIME_
 #ifndef  _SETSERVOTIME_EXISTS_
  #define _SETSERVOTIME_EXISTS_
  
void SetServoTime(uint8_t which,int angle,u16 time)
{
	ResetServoAngle(which);
	SetComServoAngleAdjustFlag(which,1);
    ComServoInit(which);
	if(angle==220)ComServoAngle(which,0,0);////释放伺服
	else ComServoAngle(which,(angle+50),time);
}
 #endif
#endif

//==SetSeeringEngine Readding ID:  == DON'T DELETE!! ==
#ifdef _SETSEERINGENGINE_
 #ifndef  _SETSEERINGENGINE_EXISTS_
  #define _SETSEERINGENGINE_EXISTS_
void SetSeeringEngine(uint8_t which,int angle)
{
	SetComServoAngleAdjustFlag(which,2);
    ComServoInit(which);
	if(angle==360)ComServoAngle(which,0,0);//释放舵机
	else 
	{
		ComServoAngle(which,(angle+50),0);
	}
}
 #endif
#endif

//==SetSeeringEngineTime Readding ID:  == DON'T DELETE!! ==
#ifdef _SETSEERINGENGINETIME_
 #ifndef  _SETSEERINGENGINETIME_EXISTS_
  #define _SETSEERINGENGINETIME_EXISTS_
  
void SetSeeringEngineTime(uint8_t which,int angle,u16 time)
{
	ResetServoAngle(which);
	SetComServoAngleAdjustFlag(which,2);
    ComServoInit(which);
	if(angle==360)ComServoAngle(which,0,0);////释放舵机
	else 
	{
		ComServoAngle(which,(angle+50),time);
	}
}
 #endif
#endif

//==SetMusicNote Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICNOTE_
 #ifndef  _SETMUSICNOTE_EXISTS_
  #define _SETMUSICNOTE_EXISTS_
	#include "I2C_Soft.h"
	//1ì?¨90??/???ó	
const uint16_t MusicMeter_TimeList[]={133,300,217,550,383,1050,716,2050,1383,4050,2716};//3?ê±ê±3¤
uint8_t SetMusicNote(uint8_t which,uint8_t m_note,uint8_t m_meter,uint8_t m_pitch,uint8_t m_scale)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,0);//??è????úIICê1ó?è¨
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	uint8_t ack;
	uint16_t dt;
	uint8_t m_led=1;//LED????
	uint8_t mmeter=m_meter&0x0f;//?áè??ú??
	if(m_note==0)m_led=0;//í￡?1ê±?eμ?
	
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0x0E);	//μ???
	Soft_I2C_Write(&iic_typedef,0XEA);	//×?í?
	Soft_I2C_Write(&iic_typedef,m_note);	//1 ò???0￡oí￡?1￡?1~7
	Soft_I2C_Write(&iic_typedef,m_pitch);//2 ò??? 0￡oμí￡?1￡o?D￡?2￡o??
	Soft_I2C_Write(&iic_typedef,m_scale);//3 °?ò? 1￡o°?ò?￡?0è?ò?
	Soft_I2C_Write(&iic_typedef,mmeter);//4 ?ú?? beatflag&0xf0=0ê± 0:1/8  1:3/8  2:1/4  3:3/4  4:1/2  5:3/2  6:1  7:3  8:2  9:6  10:4 
	Soft_I2C_Write(&iic_typedef,0);//5 ?ú???a1ê±μ??ú??ê±3¤??°???,μ￥??1ms
	Soft_I2C_Write(&iic_typedef,0);//6 μí°???
	Soft_I2C_Write(&iic_typedef,1);//7 beatflag μí4???ú??ê±??1￡o1ì?¨ ￡?0￡o?éμ÷,2 ?ú??ê??ˉμ÷?úóémeter1/meter2???¨￡?3￡o?ú??1ì?¨2?±?￡??????? ????1ì?¨?ú??êy×é:0X10:TimeList1[],???òTimeList[]
	Soft_I2C_Write(&iic_typedef,0);//8 stop￡¨μí4??￡? 2￥íêò???ò??? ￡o0í￡?1￡?12?í￡?1￡?freqflag￡¨??????￡? 1￡o??á?????￡?0￡oê1ó??ú??
	Soft_I2C_Write(&iic_typedef,1);//9 2￥???óê±????;?ú??ê±3¤(μí4??)1:?ú???óê±￡?0￡oμ￥′?2￥??ò???;??4??settime 1?ú??ê±3¤(?ú??=1ê±)1ì?¨?a×?oóê±3¤
	Soft_I2C_Write(&iic_typedef,m_led);//10 led LED×′ì?????,2￥ò?ledáá
	Soft_I2C_Write(&iic_typedef,0);	//11 ?ú??μ???×óbeatflag=22??e×÷ó?
	Soft_I2C_Write(&iic_typedef,0);	//12 ?ú??μ?????beatflag=22??e×÷ó?
	Soft_I2C_Write(&iic_typedef,0);	//13 ??á?2ù×÷?μ?ê freqflag==12??e×÷ó?
	Soft_I2C_Write(&iic_typedef,0);	//14 
	Soft_I2C_Write(&iic_typedef,0xF5);//×??2
	Soft_I2C_Stop(&iic_typedef);
	//OS_EXIT_CRITICAL();
	//dt =6000;//3?ê±
	dt=MusicMeter_TimeList[mmeter];//??è?3?ê±ê±3¤
	do//???áó|′e??￡?ó|′e3é1|±íê?2￥??íê±?
	{
		 //OS_ENTER_CRITICAL();
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,0x0F);
		ack=Soft_I2C_Read(&iic_typedef,1);	
		Soft_I2C_Stop(&iic_typedef);
		//OS_EXIT_CRITICAL();
		if(ack==0xFA)break;//return 1;//??ò?íê±?±ê??
		if(ack==0xFC)break;//±?°?μ???D?2?é?
		Delay1ms(1);
	}while(dt--);
	RcuWhichMutexGive(which,1,0);//êí??IIC???úê1ó?è¨
	if(ack==0XFA)return 1;
	return 0;//3?ê±
}
 #endif
#endif


#ifdef _GETTRACEV2I2C_
 #ifndef _GETTRACEV2I2C_EXISTS_
  #define _GETTRACEV2I2C_EXISTS_

  #include "I2C_Soft.h"

uint8_t GetTraceV2I2C( uint8_t which, uint8_t command)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();

	RcuWhichMutexTake(which,1,0XFFFF);//??è????úIICê1ó?è¨
Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char m_ChannelState;
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,command);
    Soft_I2C_Stop(&iic_typedef);
    
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x19);
    m_ChannelState=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,0XFFFF);//êí??IIC???úê1ó?è¨
    //OS_EXIT_CRITICAL();
    return m_ChannelState;
}
 #endif
#endif

#ifdef  _SETTRACEV2COLOR_
 #ifndef _SETTRACEV2COLOR_EXISTS_
  #define _SETTRACEV2COLOR_EXISTS_

  #include "I2C_Soft.h"

void SetTraceV2Color(uint8_t which,int ch1,int ch2,int ch3,int ch4,int ch5,int ch6,int ch7)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,51);
    Soft_I2C_Write(&iic_typedef,ch1);
    Soft_I2C_Write(&iic_typedef,ch2);
    Soft_I2C_Write(&iic_typedef,ch3);
    Soft_I2C_Write(&iic_typedef,ch4);
    Soft_I2C_Write(&iic_typedef,ch5);
    Soft_I2C_Write(&iic_typedef,ch6);
    Soft_I2C_Write(&iic_typedef,ch7);
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
}
  #endif
#endif

#ifdef  _SETTRACEV2BEEPI2C_
 #ifndef _SETTRACEV2BEEPI2C_EXISTS_
  #define _SETTRACEV2BEEPI2C_EXISTS_
  
  #include "I2C_Soft.h"

void SetTraceV2BeepI2C( uint8_t which,int beeptime)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    unsigned char m_ChannelState;
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,52);
    Soft_I2C_Stop(&iic_typedef);
    
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,beeptime);
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
    //OS_EXIT_CRITICAL();
}
  #endif
#endif

#ifdef  _SETTRACEV2PERCENTI2C_
 #ifndef _SETTRACEV2PERCENTI2C_EXISTS_
  #define _SETTRACEV2PERCENTI2C_EXISTS_

  #include "I2C_Soft.h"

void SetTraceV2PercentI2C( uint8_t which,int molecular,int denominator)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,55);
    Soft_I2C_Write(&iic_typedef,molecular);
    Soft_I2C_Write(&iic_typedef,denominator);
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
		//OS_EXIT_CRITICAL();
}
   #endif
 #endif
 
 



//==SetRFPassWord Readding ID:  BE-9242 == DON'T DELETE!! ==

#ifdef _SETRFPASSWORD_
 #ifndef  _SETRFPASSWORD_EXISTS_
  #define _SETRFPASSWORD_EXISTS_
  
  #include "I2C_Soft.h"
  #define _I2C_addr_w  0XA0
  
 void SetRFPassWord(uint8_t which,uint32_t password)
  {
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
 
    uint8_t pw[6]={0x00};
    uint8_t check_sum=0;
    //OS_ENTER_CRITICAL();
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
   pw[0]=(uint8_t)(password/1000000);  
   pw[1]=(uint8_t)((password/100000)%10);
   pw[2]=(uint8_t)((password/10000)%10);
   pw[3]=(uint8_t)((password/1000)%10);
   pw[4]=(uint8_t)((password/100)%10);
   pw[5]=(uint8_t)(password%100);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
    //?￠?íDT???ü????á?
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x01);//?üá?
    check_sum+=0x01;
    Soft_I2C_Write(&iic_typedef,0x09); 
    check_sum+=0x09;
    Soft_I2C_Write(&iic_typedef,pw[0]); 
    check_sum+=pw[0];
    Soft_I2C_Write(&iic_typedef,pw[1]);
    check_sum+=pw[1];
    Soft_I2C_Write(&iic_typedef,pw[2]);  
    check_sum+=pw[2];   
    Soft_I2C_Write(&iic_typedef,pw[3]); 
    check_sum+=pw[3];
    Soft_I2C_Write(&iic_typedef,pw[4]);
    check_sum+=pw[4];
    Soft_I2C_Write(&iic_typedef,pw[5]);  
    check_sum+=pw[5];
    Soft_I2C_Write(&iic_typedef,check_sum);  
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
    delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
		//OS_EXIT_CRITICAL();
 }
 #endif
#endif

//==GetRFModuleByte Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEBYTE_
 #ifndef  _GETRFMODULEBYTE_EXISTS_
  #define _GETRFMODULEBYTE_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint16_t GetRFModuleByte(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint16_t data=999;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint8_t n;
//OS_ENTER_CRITICAL();
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x11&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {	
       data=rf_data[3];
    }
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
    delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
		//OS_EXIT_CRITICAL();
   return data;
}
 #endif
#endif


//==SetRFModuleByte Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _SETRFMODULEBYTE_
 #ifndef  _SETRFMODULEBYTE_EXISTS_
  #define _SETRFMODULEBYTE_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint8_t SetRFModuleByte(uint8_t which,uint8_t _data)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t check_sum=0;
	uint8_t ok_flag=0x02;
//OS_ENTER_CRITICAL();
		RcuWhichMutexTake(which,1,0);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
//?￠é???á?
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x02);//?üá?,?￠é?êy?Y
    check_sum+=0x02;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,_data); 
    check_sum+=_data;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	 //éè??2é?ˉμ??úèYê?????
	Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x04);//?üá?
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	//?áè???ì?êy?Y
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    do{
    	   ok_flag=Soft_I2C_Read(&iic_typedef,0);
    	 }while(ok_flag==0x02); //2???2é?ˉ￡?μè′y?￠é?íê±?
    ok_flag=Soft_I2C_Read(&iic_typedef,1); 
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,0);//êí??IIC???úê1ó?è¨
    delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
		//OS_EXIT_CRITICAL();
   return(ok_flag);
}
 #endif
#endif

//==GetRFModuleRemoteButton Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEREMOTEBUTTON_
 #ifndef  _GETRFMODULEREMOTEBUTTON_EXISTS_
  #define _GETRFMODULEREMOTEBUTTON_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint16_t GetRFModuleRemoteButton(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint16_t data=999;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint32_t code=0;
	uint32_t k=1;
	uint8_t n;
//OS_ENTER_CRITICAL();
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    
    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {
    	code=(uint32_t)rf_data[3]*0x1000000+(uint32_t)rf_data[4]*0x10000+(uint32_t)rf_data[5]*0x100+(uint32_t)rf_data[6];
    	 for(n=0;n<20;n++)
       {
       	 if(code&(k<<n))
       	 {
       	 	 data=n;
       	 	 if(code&(k<<26))
       	 	 {
       	 	 	  data+=20;
       	 	 }
       	 	 break;
       	 }
       }
    }
		RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
	delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
	//OS_EXIT_CRITICAL();
   return data;
}
 #endif
#endif

//==GetRFModuleRemoteCode Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEREMOTECODE_
 #ifndef  _GETRFMODULEREMOTECODE_EXISTS_
  #define _GETRFMODULEREMOTECODE_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint32_t GetRFModuleRemoteCode(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint32_t code=0;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint32_t k=1;
	uint8_t n;
		RcuWhichMutexTake(which,1,0);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);

    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {
    	code=(uint32_t)rf_data[3]*0x1000000+(uint32_t)rf_data[4]*0x10000+(uint32_t)rf_data[5]*0x100+(uint32_t)rf_data[6];
    }
		RcuWhichMutexGive(which,1,code);//êí??IIC???úê1ó?è¨
	delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
   return code;
}
 #endif
#endif

//==GetRFModuleRemoteGravity Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEREMOTEGRAVITY_
 #ifndef  _GETRFMODULEREMOTEGRAVITY_EXISTS_
  #define _GETRFMODULEREMOTEGRAVITY_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

int16_t GetRFModuleRemoteGravity(uint8_t which,uint8_t axis)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	int16_t data=999;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint8_t n;
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    
    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {
        switch(axis){
        	                  case 0x01:{data=(int8_t)rf_data[11];}break; //X
        	                  case 0x02:{data=(int8_t)rf_data[12];}break; //Y
        	                  case 0x03:{data=(int8_t)rf_data[13];}break;//Z
        	                  default:{data=999;}
        	               } 
    }
		RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
   return data;
}
 #endif
#endif

//==GetRFModuleRemoteKnob Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEREMOTEKNOB_
 #ifndef  _GETRFMODULEREMOTEKNOB_EXISTS_
  #define _GETRFMODULEREMOTEKNOB_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

int16_t GetRFModuleRemoteKnob(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	static int16_t data=0;
	uint8_t check_sum=0;
	static uint8_t rf_data[16]={0x00};  
	uint8_t n;
	RcuWhichMutexTake(which,1,999);//¨
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);

    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //
    {
		data=((uint8_t)rf_data[11]*256)+(uint8_t)rf_data[12];
    }
	RcuWhichMutexGive(which,1,data);//
	delay_iic=IIC_SPEED_DEFAULT;//
   return data;
}
 #endif
#endif

#ifdef _SETRFMODULEREMOTEKNOB_
 #ifndef  _SETRFMODULEREMOTEKNOB_EXISTS_
  #define _SETRFMODULEREMOTEKNOB_EXISTS_
  #include "jmkernel.h"
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0
int8_t SetRFModuleRemoteKnob(uint8_t which,uint32_t axis)
{
	uint8_t RF_Send_buffer[5];
	uint8_t RF_i=0;
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	
	uint8_t check_sum=0;
	uint8_t ok_flag=0x02;
	//OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,0);//
	Soft_I2C_Typedef iic_typedef;
 	Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	
	RF_Send_buffer[0]=0xA7;
	RF_Send_buffer[1]=(axis>>24)&0xFF;
	RF_Send_buffer[2]=(axis>>16)&0xFF;
	RF_Send_buffer[3]=(axis>>8)&0xFF;
	RF_Send_buffer[4]=(axis)&0xFF;
	
	for(RF_i=0;RF_i<5;RF_i++)
	{
		Soft_I2C_Start(&iic_typedef);
	    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
	    Soft_I2C_Write(&iic_typedef,0xaa);    
	    Soft_I2C_Write(&iic_typedef,0x55);    
	    Soft_I2C_Write(&iic_typedef,0x02);//
	    check_sum+=0x02;
	    Soft_I2C_Write(&iic_typedef,0x04); 
	    check_sum+=0x04;
	    Soft_I2C_Write(&iic_typedef,RF_Send_buffer[RF_i]); 
	    check_sum+=RF_Send_buffer[RF_i];
		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);
		 //
		Soft_I2C_Start(&iic_typedef);
	    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
	    Soft_I2C_Write(&iic_typedef,0xaa);    
	    Soft_I2C_Write(&iic_typedef,0x56);    
	    Soft_I2C_Write(&iic_typedef,0x04);//
	    check_sum+=0x04;
	    Soft_I2C_Write(&iic_typedef,0x04); 
	    check_sum+=0x04;
	    Soft_I2C_Write(&iic_typedef,0x00); 
		check_sum+=0x00;
		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);
	    Soft_I2C_Start(&iic_typedef);
	    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	    do{
	    	   ok_flag=Soft_I2C_Read(&iic_typedef,0);
	    	 }while(ok_flag==0x02); //
	    ok_flag=Soft_I2C_Read(&iic_typedef,1); 
	    Soft_I2C_Stop(&iic_typedef);
		Delay1ms(10);
	}
	RcuWhichMutexGive(which,1,0);//
    delay_iic=IIC_SPEED_DEFAULT;//
		//OS_EXIT_CRITICAL();
   	return(ok_flag);
}
 #endif
#endif

//==GetRFModuleRemoteRocker Readding ID:  == DON'T DELETE!! == BE9242
#ifdef _GETRFMODULEREMOTEROCKER_
 #ifndef  _GETRFMODULEREMOTEROCKER_EXISTS_
  #define _GETRFMODULEREMOTEROCKER_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

int16_t GetRFModuleRemoteRocker(uint8_t which,uint8_t direction,uint8_t axis)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	int16_t data=999;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint8_t n;
//OS_ENTER_CRITICAL();
		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	 Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    
    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {
    	 if(direction==0)
    	 {
            switch(axis){
        	                     case 0x00:{data=(int8_t)rf_data[7];}break; //X
        	                     case 0x01:{data=(int8_t)rf_data[8];}break; //Y
        	                     default:{data=999;}
        	                  } 
        
        }
        else
        {
        	  switch(axis){
        	                     case 0x00:{data=(int8_t)rf_data[9];}break; //X
        	                     case 0x01:{data=(int8_t)rf_data[10];}break; //Y
        	                     default:{data=999;}
        	                  } 
        }
    }
		RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
//OS_EXIT_CRITICAL();
   return data;
}
 #endif
#endif


#ifdef _SETMUSICADDDATA_
 #ifndef  _SETMUSICADDDATA_EXISTS_
  #define _SETMUSICADDDATA_EXISTS_
  #include <jmkernel.h>
	#include "jmdmusic.h"
  void SetMusicAddData(uint8_t mdata,int time)
  {
	MUSIC_typedef m_Music;
	InMusic_DataProcess(&m_Music, mdata, time);
	Music_AddData(m_Music.freq,m_Music.time);
  }
 #endif
#endif

#ifdef _SETMUSICADDTREBLE_
 #ifndef  _SETMUSICADDTREBLE_EXISTS_
  #define _SETMUSICADDTREBLE_EXISTS_
  #include <jmkernel.h>
  #include "jmdmusic.h"
  void SetMusicAddtreble(uint8_t mdata,int time){
  	MUSIC_typedef m_Music;
	InMusic_DataProcess(&m_Music, (14+mdata), time);
	Music_AddData(m_Music.freq,m_Music.time);
  }
 #endif
#endif

//==SetMusicAddalto Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICADDALTO_
 #ifndef  _MUSICADDALTO_EXISTS_
  #define _MUSICADDALTO_EXISTS_
  #include <jmkernel.h>
  #include "jmdmusic.h"
  void SetMusicAddalto(uint8_t mdata,int time){
    	MUSIC_typedef m_Music;
	InMusic_DataProcess(&m_Music, (7+mdata), time);
	Music_AddData(m_Music.freq,m_Music.time);
  }
 #endif
#endif

//==SetMusicAddbass Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICADDBASS_
 #ifndef  _MUSICADDBASS_EXISTS_
  #define _MUSICADDBASS_EXISTS_
  #include <jmkernel.h>
  #include "jmdmusic.h"
void SetMusicAddbass(uint8_t mdata,int time){
   	MUSIC_typedef m_Music;
	InMusic_DataProcess(&m_Music, (mdata), time);
	Music_AddData(m_Music.freq,m_Music.time);
  }
 #endif
#endif

//==SetMusicStop Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICSTOP_
 #ifndef  _SETMUSICSTOP_EXISTS_
  #define _SETMUSICSTOP_EXISTS_
  #include <jmkernel.h>
  #include "jmdmusic.h"
void SetMusicStop(int time){
   	MUSIC_typedef m_Music;
	InMusic_DataProcess(&m_Music, (0), (uint8_t)time);
	Music_AddData(0,m_Music.time);
  }
 #endif
#endif

//==SetMusicRepeat Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICREPEAT_
 #ifndef  _SETMUSICREPEAT_EXISTS_
  #define _SETMUSICREPEAT_EXISTS_
  #include <jmkernel.h>
  void SetMusicRepeat(int c)
 {
  Music_Repeat(c);
  }
 #endif
#endif

//==SetMusicClear Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICCLEAR_
 #ifndef  _SETMUSICCLEAR_EXISTS_
  #define _SETMUSICCLEAR_EXISTS_
  #include <jmkernel.h>
  
void SetMusicClear(void)
{
  Music_DataClear();
}
 #endif
#endif

//==SetMusicPlay Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICPLAY_
 #ifndef  _SETMUSICPLAY_EXISTS_
  #define _SETMUSICPLAY_EXISTS_
  #include <jmkernel.h>

  void SetMusicPlay(void)
  {
   InMusic_Play();
  }
 #endif
#endif

//==GetMusicState Readding ID:  == DON'T DELETE!! ==

#ifdef   _GETMUSICSTATE_
#ifndef  _GETMUSICSTATE_EXISTS_
#define  _GETMUSICSTATE_EXISTS_
#include <jmkernel.h>

uint8_t GetMusicState(void)
  {
   return Music_GetEndState();
  }
 #endif
#endif

#ifdef _SETINSOUND_
 #ifndef  _SETINSOUND_EXISTS_
  #define _SETINSOUND_EXISTS_
  #include <jmkernel.h>

  void SetInSound(int freq,int time)
  {
		if(freq>20000)freq=20000;
		if(time==0)return;
		else if(time>0x7fff)time=0x7fff;
		SetAddMusicPlay(freq,time);
#ifndef __RCU_MUSIC_FREQ_PLAY_DISABLE
		Delay1ms(time);
#endif//__RCU_MUSIC_FREQ_PLAY_DISABLE
  }
 #endif
#endif

//==SetTunes Readding ID:  == DON'T DELETE!! ==

#ifdef _SETMUSICMETER_
 #ifndef  _SETMUSICMETER_EXISTS_
  #define _SETMUSICMETER_EXISTS_
  #include <jmkernel.h>
  #include "jmdmusic.h"
void SetMusicMeter(unsigned int meter)//DT???ú??￡???è?80??/???ó
{
	uint32_t mmeter=60000/meter;
	MusicMeter(TimeList,mmeter);
}
 #endif
#endif

#ifdef _GETRCUPORTDATA_
 #ifndef  _GETRCUPORTDATA_EXISTS_
  #define _GETRCUPORTDATA_EXISTS_
  #include <jmkernel.h>
uint16_t GetRcuPortData(uint8_t which)//ó?2êμ???o?ê1ó?μ?RCU????μ?í¨D??￡?é
{
  uint32_t port1=portarray[RcuPORT[which][0]];
  uint8_t bit1=RcuPIN[which][0];
  uint32_t port2=portarray[RcuPORT[which][1]];
  uint8_t bit2=RcuPIN[which][1];
  uint32_t port3=portarray[RcuPORT[which][2]];
  uint8_t bit3=RcuPIN[which][2];
	
  GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
  GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_INPUT);
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_INPUT);

  uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
  value|=HAL_GPIO_ReadPin((GPIO_TypeDef*)port2,(1<<bit2))<<1;
  value|=HAL_GPIO_ReadPin((GPIO_TypeDef*)port3,(1<<bit3))<<2;
  
  switch(value)
  {
		case 0:value=0;break;
		case 1:value=1;break;
		case 2:value=2;break;
		case 3:value=4;break;
		case 4:value=3;break;
		case 5:value=5;break;
		case 6:value=6;break;
		case 7:value=7;break;
  }
  return value;
}
 #endif
#endif


#ifdef _SETMOTORSTRAIGHTANGLE_
 #ifndef  _SETMOTORSTRAIGHTANGLE_EXISTS_
  #define _SETMOTORSTRAIGHTANGLE_EXISTS_
  #include <jmkernel.h>

void SetMotorStraightAngle(uint8_t whichL,uint8_t whichR,int speed,int32_t pulse)//两轮走直线
{
	if(pulse<0)pulse=-pulse;
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	which=whichL|(whichR<<4);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	PidPara_Init(0,0,(void *)0,0);
	CarPidCtrl_Init(0,which ,0,speed, pulse);
	Create_PicTask();//开始运行
}
 #endif
#endif

#ifdef _SETWAITFORSTRAIGHT_
 #ifndef  _SETWAITFORSTRAIGHT_EXISTS_
  #define _SETWAITFORSTRAIGHT_EXISTS_

void SetWaitForStraight(uint8_t whichL,uint8_t whichR,int speed,long pulse)//两轮走直线(等待)
{

	if(pulse<0)pulse=-pulse;//pulse=abs(pulse);
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	which=whichL|(whichR<<4);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	PidPara_Init(0,0,(void *)0,0);
	CarPidCtrl_Init(0,which ,0,speed, pulse);
	Create_PicTask();//开始运行
	while(1)
	{
		if(ReadPidCtrlFlag(0)==0)break;//执行完毕
	}
}
#endif
#endif

#ifdef _SETMOTORSTRAIGHT_
 #ifndef  _SETMOTORSTRAIGHT_EXISTS_
  #define _SETMOTORSTRAIGHT_EXISTS_
  #include <jmkernel.h>

void SetMotorStraight(uint8_t whichL,uint8_t whichR,int speed)//两轮走直线(一直走)
{
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	which=whichL|(whichR<<4);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	PidPara_Init(0,0,(void *)0,0);
	CarPidCtrl_Init(0,which ,0,speed, 0xFFFFFF);//走16777215个编码?
	Create_PicTask();//开始运行
}
 #endif
#endif

#ifdef _SETMOTORSTRAIGHTTURN_
 #ifndef  _SETMOTORSTRAIGHTTURN_EXISTS_
  #define _SETMOTORSTRAIGHTTURN_EXISTS_
  #include <jmkernel.h>

void SetMotorStraightTurn(uint8_t whichL,uint8_t whichR,int speed,int8_t angle)//两轮同步直线转弯
{
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	if(angle>=90)angle=90;else if(angle<=-90)angle=-90;
	which=whichL|(whichR<<4);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	PidPara_Init(0,0,(void *)0,angle);
	CarPidCtrl_Init(0,which ,0,speed, 0xFFFFFF);//走16777215个编码?
	Create_PicTask();//开始运行
}
 #endif
#endif



#ifdef _SETCARTURN_
 #ifndef  _SETCARTURN_EXISTS_
  #define _SETCARTURN_EXISTS_

void SetCarTurn(uint8_t whichL,uint8_t whichR,int speed,long pulse)//两轮转弯 speed>0左转,<0右转 ，=0停止
{

	if(pulse<0)pulse=-pulse;//pulse=abs(pulse);
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	which=whichL|(whichR<<4);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	PidPara_Init(0,1,(void *)0,0);
	CarPidCtrl_Init(0,which ,1,speed, pulse);
	Create_PicTask();////开始运行
}
#endif
#endif

#ifdef _SETWAITFORCARTURN_
 #ifndef  _SETWAITFORCARTURN_EXISTS_
  #define _SETWAITFORCARTURN_EXISTS_

void SetWaitForCarTurn(uint8_t whichL,uint8_t whichR,int speed,long pulse)//两轮转弯 speed>0左转,<0右转 ，=0停止(等待)
{

	if(pulse<0)pulse=-pulse;//pulse=abs(pulse);
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	uint8_t m_speedper;

	which=whichL|(whichR<<4);
	PidPara_Init(0,1,(void *)0,0);
	CarPidCtrl_Init(0,which ,1,speed, pulse);
	Create_PicTask();//开始运行
	while(1)
	{
		if(ReadPidCtrlFlag(0)==0)break;//执行完毕
	}
}
#endif
#endif

#ifdef _SETMOTORSTRAIGHTSTOP_
 #ifndef  _SETMOTORSTRAIGHTSTOP_EXISTS_
  #define _SETMOTORSTRAIGHTSTOP_EXISTS_

int32_t SetMotorStraightStop(uint8_t whichL,uint8_t whichR)
{
	uint8_t which;
	if(whichL==0||whichL>4||whichR==0||whichR>4)return ;
	which=whichL|(whichR<<4);
	PidPara_Init(0,0,(void *)0,0);
	CarPidCtrl_Init(0,which ,0,0, 0);
	Create_PicTask();//开始运行
}
 #endif
#endif

#ifdef _SETMOTORSTRAIGHTANGLE128_
 #ifndef  _SETMOTORSTRAIGHTANGLE128_EXISTS_
  #define _SETMOTORSTRAIGHTANGLE128_EXISTS_
  #include <jmkernel.h>

void SetMotorStraightAngle128(uint8_t which,int speed,int32_t Angle)
{
	Angle=abs(Angle);
	Motor_Init();
	MotorCodingInit();
	MotorPIDTime_Init();
	SetMCPidServoAngle128(which,speed,Angle);
}
 #endif
#endif

#ifdef _SETTASKSUSPEND_
 #ifndef  _SETTASKSUSPEND_EXISTS_
  #define _SETTASKSUSPEND_EXISTS_
 
uint16_t SetTaskSuspend(uint8_t tasknum)//1ò?e???¨è???,tasknum=01ò?e×??o
{
	return OS_TaskSuspend(tasknum);
}
 #endif
#endif

#ifdef _SETTASKRESUME_
 #ifndef  _SETTASKRESUME_EXISTS_
  #define _SETTASKRESUME_EXISTS_
 
uint16_t SetTaskResume(uint8_t tasknum)//??D????¨è???
{
	OS_TaskCreate(tasknum);//′′?¨è???
	return OS_TaskResume(tasknum);
}
 #endif
#endif

#ifdef _SETTASKDELETE_
 #ifndef  _SETTASKDELETE_EXISTS_
  #define _SETTASKDELETE_EXISTS_
 
uint16_t SetTaskDelete(uint8_t tasknum)//é?3y???¨è???
{
	return OS_TaskDelete(tasknum);
}
 #endif
#endif

#ifdef _SETTASKCREATE_
 #ifndef  _SETTASKCREATE_EXISTS_
  #define _SETTASKCREATE_EXISTS_
 
uint16_t SetTaskCreate(uint8_t tasknum)//′′?¨???¨è???
{
	return OS_TaskCreate(tasknum);
}
 #endif
#endif


#ifdef _GETIRCODE_
 #ifndef  _GETIRCODE_EXISTS_
  #define _GETIRCODE_EXISTS_

extern volatile uint32_t IR_code;
extern uint8_t IR_revOK;
uint8_t lastIRData;
uint8_t GetIRCode(uint8_t which)
{
uint8_t IR_addr,IR_addr_n,IR_data,IR_data_n;

uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
uint8_t bit2=RcuPIN[which][1];

HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
   ReadIRcodeInit();
   if(IR_revOK==1)
   {
    IR_revOK=0;
   IR_addr = 0xFF&(IR_code>>24);
   IR_addr_n = 0xFF&(IR_code>>16);
   IR_data = 0xFF&(IR_code>>8);
   IR_data_n = 0xFF&IR_code;
   lastIRData = IR_data;
   return IR_data;
   }
   if(IR_revOK==2)
   {
      IR_revOK=0;
      return lastIRData;
    }
   else
   {
    	return 0;
    }

}	
 #endif
#endif

#ifdef _SETIRCODE_
 #ifndef  _SETIRCODE_EXISTS_
  #define _SETIRCODE_EXISTS_

uint8_t SetIRCode(uint8_t which,uint8_t data)
{
    uint8_t status;
//×ó?aμ???￡?óò?aêy?Y
    status=SendIRFunction(0,data);
    return status;
}	
 #endif
#endif

#ifdef _SETMP3PLAY_
 #ifndef  _SETMP3PLAY_EXISTS_
  #define _SETMP3PLAY_EXISTS_
	#include "mp3lib.h"
void SetMp3Play(uint16_t folder,uint16_t mp3num)
{
  uint8_t volume=0;
  volume = MP3_GetSound();	
  MP3_SetSound(volume);
  Delay1ms(20);
  MP3_PlaySong(0X05,((folder&0XFF)<<8)|((mp3num&0XFF)));
}	
 #endif
#endif

#ifdef _SETMP3SUSPEND_
 #ifndef  _SETMP3SUSPEND_EXISTS_
  #define _SETMP3SUSPEND_EXISTS_
	#include "mp3lib.h"
void SetMp3Suspend(void)//?Yí￡2￥??
{
  MP3_PlaySong(0x02,0x0000);
}	
 #endif
#endif


#ifdef _SETMP3SOUND_
 #ifndef  _SETMP3SOUND_EXISTS_
  #define _SETMP3SOUND_EXISTS_
	#include "mp3lib.h"
void SetMp3Sound(uint8_t Mp3Sound)
{
	if(Mp3Sound < 0) Mp3Sound =0;
	else if(Mp3Sound > 28 ) Mp3Sound = 28;
  MP3_SetSound(Mp3Sound);//0-28
}	
 #endif
#endif



#ifdef _GETRANDOM_
 #ifndef  _GETRANDOM_EXISTS_
  #define _GETRANDOM_EXISTS_
#define _MULTIPLIER 	0x015a4e35L 
#define _INCREMENT	 	1 
uint8_t g_GetRandomFirst=0;
int GetRandom(int m,int n)
{
	static long seed;
	int rn=0,randn;
	if(g_GetRandomFirst==0)//μúò?′??èéè?¨???ú??×ó
	{
		seed=GetSystemTime()+ReadInMicVaule()+ReadInVoltageVaule();
		Delay1ms(1);
		seed=(GetSystemTime()+ReadInMicVaule()+216+ReadInVoltageVaule())%0x8000;
		g_GetRandomFirst=1;
	}
	seed = _MULTIPLIER*seed + _INCREMENT; 
	randn=((int)(seed>>16) & 0x7fff); 
	rn=(int)(randn%(n-m+1)+m);//m~n???úêy
	return((int)rn);
}
 #endif
#endif


#ifdef _GETRCUPORTDATA_
 #ifndef  _GETRCUPORTDATA_EXISTS_
  #define _GETRCUPORTDATA_EXISTS_
  #include <jmkernel.h>
uint16_t GetRcuPortData(uint8_t which)//ó?2êμ???o?ê1ó?μ?RCU????μ?í¨D??￡?é
{
  uint32_t port1=portarray[RcuPORT[which][0]];
  uint8_t bit1=RcuPIN[which][0];
  uint32_t port2=portarray[RcuPORT[which][1]];
  uint8_t bit2=RcuPIN[which][1];
  uint32_t port3=portarray[RcuPORT[which][2]];
  uint8_t bit3=RcuPIN[which][2];


	
  GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_INPUT);
  GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_INPUT);
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_INPUT);//GPIO_Mode_IN_FLOATING

  uint8_t value=HAL_GPIO_ReadPin((GPIO_TypeDef*)port1,(1<<bit1));
  value|=HAL_GPIO_ReadPin((GPIO_TypeDef*)port2,(1<<bit2))<<1;
  value|=HAL_GPIO_ReadPin((GPIO_TypeDef*)port3,(1<<bit3))<<2;
  
  switch(value)
  {
		case 0:value=0;break;
		case 1:value=1;break;
		case 2:value=2;break;
		case 3:value=4;break;
		case 4:value=3;break;
		case 5:value=5;break;
		case 6:value=6;break;
		case 7:value=7;break;
  }
  return value;
}
 #endif
#endif

#ifdef _SETRCUPORTDATA_
 #ifndef  _SETRCUPORTDATA_EXISTS_
  #define _SETRCUPORTDATA_EXISTS_

void SetRcuPortData(uint8_t which,uint16_t Color)
{
   uint32_t port1=portarray[RcuPORT[which][0]];
   uint32_t port2=portarray[RcuPORT[which][1]];
   uint32_t port3=portarray[RcuPORT[which][2]];
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
   uint8_t RedLed,GreenLed,BlueLed;
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   switch(Color)
	{
		case 0: RedLed=0;GreenLed=0;BlueLed=0;	break;
		case 1: RedLed=1;GreenLed=0;BlueLed=0;	break;
		case 2: RedLed=0;GreenLed=1;BlueLed=0;	break;
		case 3: RedLed=0;GreenLed=0;BlueLed=1;	break;
		case 4: RedLed=1;GreenLed=1;BlueLed=0;	break;
		case 5: RedLed=1;GreenLed=0;BlueLed=1;	break;
		case 6: RedLed=0;GreenLed=1;BlueLed=1;	break;
		case 7: RedLed=1;GreenLed=1;BlueLed=1;	break;
	}

//oìé?
   if(RedLed==1)   HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
   else    HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);
//?ìé?
   if(GreenLed==1)   HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
   else  HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
//à?é?
   if(BlueLed==1)    HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
   else   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);

  }
 #endif
#endif


//==GetRFModuleRemoteBit Readding ID:  == DON'T DELETE!! == BE9237
#ifdef _GETRFMODULEREMOTEBIT_
 #ifndef  _GETRFMODULEREMOTEBIT_EXISTS_
  #define _GETRFMODULEREMOTEBIT_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint16_t GetRFModuleRemoteBit(uint8_t which,uint8_t num)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint16_t data=0;
	uint8_t check_sum=0;
	uint8_t rf_data[16]={0x00};  
	uint32_t code=0;
	uint32_t k=1;
	uint8_t n;

		RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
		Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	  Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//?üá?,2é?ˉ?óê??o3?
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //ò?′?òa?áè?íê?ùóD?o3?êy?Y
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    
    // data=rf_data[3];
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x05&&rf_data[15]==0xCF) //?ì?é?üá?°ü
    {
    	   code=(uint32_t)rf_data[3]*0x1000000+(uint32_t)rf_data[4]*0x10000+(uint32_t)rf_data[5]*0x100+(uint32_t)rf_data[6];
       	 if(code&(k<<num))
       	 {
       	 	 data=1;
       	 }
    }
		RcuWhichMutexGive(which,1,data);//êí??IIC???úê1ó?è¨
   	delay_iic=IIC_SPEED_DEFAULT;//???′??è??ù?è
    return data;
}
 #endif
#endif

#ifdef _GETWIFIVOICE_
 #ifndef _GETWIFIVOICE_EXISTS_
  #define _GETWIFIVOICE_EXISTS_
 
uint16_t GetWifiVoice(uint8_t *str)
{
	int s=-1;
	//if(GetWifiReadRxMode()!=1)	
	//{
	//	SetWifiReadRxMode(1);//WIFI?óê??￡ê??aD-òé?óê?
	//}
	WifiVoice_Init();
	s=ReadWifiVoiceResult(str);
	if(s==-1)return 0;
	else return 1;//ê?±e3é1|
}
 #endif
#endif
#ifdef _SETWIFIVOICESTRING_
 #ifndef _SETWIFIVOICESTRING_EXISTS_
  #define _SETWIFIVOICESTRING_EXISTS_
 #include "LCD320240.h"
uint16_t SetWifiVoiceString(int y,uint16_t ch_color,uint16_t bg_color)
{
	uint8_t* str=ReadWifiVoiceString();
	uint8_t strlist[32],i,n=LCD_Width/GetFontLibWidth();
	for(i=0;i<n;i++)
	{
		if(*str!='\0')strlist[i]=*str++;
		else strlist[i]=' ';
	}
	strlist[i]='\0';
  SetBackLed(g_LcdBackLignt);
  LCD_String(0,(y-1)*GetFontLibHeight(),strlist,ch_color,bg_color);
}
 #endif
#endif

#ifdef _SETNOTE_
 #ifndef  _SETNOTE_EXISTS_
  #define _SETNOTE_EXISTS_
  #include "jmdmusic.h"
  void SetNote(int note)
  {
		uint16_t freq;
		BeepInit();
		if(note==0)
		{
			BeepOff();
		}
		else
		{
			freq=NoteList[1][note-1];
			SetMusicPWMFreq(freq);
		}
  }
 #endif
#endif


//==SetUartData Readding ID:  == DON'T DELETE!! ==

#ifdef _SETUARTDATA_
 #ifndef  _SETUARTDATA_EXISTS_
  #define _SETUARTDATA_EXISTS_
#include <jmkernel.h>

void SetUartData(uint8_t data,uint32_t baud)//P8?￠?í′??úêy?Y
{
	uint32_t BaudRate;
  switch(baud)
  {
		case 0:BaudRate=9600  ;break;
		case 1:BaudRate=14400 ;break;
		case 2:BaudRate=19200 ;break;
		case 3:BaudRate=38400 ;break;
		case 4:BaudRate=57600 ;break;
		case 5:BaudRate=76800 ;break;
		case 6:BaudRate=115200;break;
		case 7:BaudRate=128000;break;
		case 8:BaudRate=256000;break;
		case 9:BaudRate=512000;break;
		case 10:BaudRate=921600;break;
		default:BaudRate=baud;break;
  }
	SysCOM_Init(BaudRate);
	SetComData(data);
}
 #endif
#endif

//==GetUartData Readding ID:  == DON'T DELETE!! ==

#ifdef _GETUARTDATA_
 #ifndef  _GETUARTDATA_EXISTS_
  #define _GETUARTDATA_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
uint8_t GetUartData(uint32_t baud)//P8?áè?′??úêy?Y
{
	
	uint8_t buf;
	uint32_t BaudRate;
	UART2_Sletc=0;//普通串口
  switch(baud)
  {
		case 0:BaudRate=9600  ;break;
		case 1:BaudRate=14400 ;break;
		case 2:BaudRate=19200 ;break;
		case 3:BaudRate=38400 ;break;
		case 4:BaudRate=57600 ;break;
		case 5:BaudRate=76800 ;break;
		case 6:BaudRate=115200;break;
		case 7:BaudRate=128000;break;
		case 8:BaudRate=256000;break;
		case 9:BaudRate=512000;break;
		case 10:BaudRate=921600;break;
		default:BaudRate=baud;break;
  }
	SysCOM_Init(BaudRate);
	buf=ReadCOMData();
	return buf;
}
 #endif
#endif


#ifdef _SETLCDFILLEDRECTANGLE2_
 #ifndef  _SETLCDFILLEDRECTANGLE2_EXISTS_
  #define _SETLCDFILLEDRECTANGLE2_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDFilledRectangle2(uint16_t x,uint16_t y,uint16_t xlong ,uint16_t ylong,uint16_t color)
{
	SetBackLed(g_LcdBackLignt);//GPIO_SetBits(GPIOA,GPIO_Pin_4);
	if(xlong==0||ylong==0)return ;
	LCD_DrawRectangleFont(x,y,x+xlong,y+ylong,color);
}
 #endif
#endif

#ifdef _SETLCDRECTANGLE2_
 #ifndef  _SETLCDRECTANGLE2_EXISTS_
  #define _SETLCDRECTANGLE2_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDRectangle2(uint16_t x1,uint16_t y1,uint16_t xlong,uint16_t ylong,uint16_t w,uint16_t color)
{
	uint8_t wmx,wmy,wm;
	uint16_t x2,y2;
	SetBackLed(g_LcdBackLignt);//GPIO_SetBits(GPIOA,GPIO_Pin_4);
	if(xlong==0||ylong==0)return ;
	
	x2=x1+xlong;
	y2=y1+ylong;
	wmx=x2-x1;
	wmy=y2-y1;
	wm=(wmx<wmy)?wmx:wmy;
	if(w>wm)w=wm;
	if(w>0)w-=1;
	
	LCD_DrawRectangleFont( x1,y1,x2,y1+w, color);// |
	LCD_DrawRectangleFont( x1,y1+w,x1+w, y2, color);//  |
	LCD_DrawRectangleFont( x1+w,y2-w,x2, y2, color);//-
	LCD_DrawRectangleFont( x2-w,y1+w,x2, y2-w, color);//_
}
 #endif
#endif

#ifdef _SETLCDLINE_
 #ifndef  _SETLCDLINE_EXISTS_
  #define _SETLCDLINE_EXISTS_
#include <jmkernel.h>
#include "LCD320240.h"

void SetLCDLine(uint16_t x1,uint16_t y1,int16_t angle, uint16_t lenght,uint16_t color)
{
	SetBackLed(g_LcdBackLignt);//GPIO_SetBits(GPIOA,GPIO_Pin_4);
	LCD_Line(x1,y1,angle,lenght,color,1);
}
 #endif
#endif
//==SetOneServo Readding ID:  == DON'T DELETE!! ==//BE5235/BE5236

#ifdef _SETONESERVO_
 #ifndef  _SETONESERVO_EXISTS_
  #define _SETONESERVO_EXISTS_
  
  #include "I2C_Soft.h"
  
#define _SERVO2_ADDR_		(0x18)//0x18
void SetOneServo(uint8_t which,uint8_t Channel, uint8_t angle, uint16_t time)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t timh,timl;
	uint8_t sum=0;
	timh=time>>8;
	timl=time&0xff;
	
	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
 	Soft_I2C_Typedef iic_typedef;
 	Soft_I2C_BspInit( port2,bit2,//SDA
   									port1,bit1,//SCL
   									&iic_typedef);
	//if(g_Servo8to10Flag==0)//10
	{
		sum=(uint8_t)(Channel+angle+timh+timl);
	}
  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_SERVO2_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xfa);
  Soft_I2C_Write(&iic_typedef,Channel);
  Soft_I2C_Write(&iic_typedef,angle);
  Soft_I2C_Write(&iic_typedef,timh);
  Soft_I2C_Write(&iic_typedef,timl);
	//if(g_Servo8to10Flag==0)
	Soft_I2C_Write(&iic_typedef,sum);//10
  Soft_I2C_Stop(&iic_typedef);
  RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
}
 #endif
#endif


#ifdef _SETDISPLAYPICTURE_
 #ifndef  _SETDISPLAYPICTURE_EXISTS_
  #define _SETDISPLAYPICTURE_EXISTS_

int SetDisplayPicture(int x,int y,//图片起始坐标X=0-239，Y=0-319
		            	 	 	const char* filename,//图片文件的名称(字符串类型),名称不能有中文，图片名称不能超过8个字节,后缀不能超过3个字节
		            	 	 	char scale)//图像缩放比例0-3 : 1,1/2,1/4,1/8
{
	  int res=0;
	  //return LCD_DisplayPicture(x,y,filename,scale);
	  while(ReadDisplayPictureFlag());//等待上一次显示完毕
	  os_task_enter_critical();
	  SetDisplayPictureFlag(1);//显示这一次的图片
	  StartDisplayPicture(x,y,filename,scale);
	  os_task_exit_critical();
	  while(ReadDisplayPictureFlag());//等待显示完毕
	  res=ReadDisplayPictureState();//返回显示状态
	  return res;

}
#endif
#endif
#ifdef _SETWIFIUDPMODE_
 #ifndef  _SETWIFIUDPMODE_EXISTS_
  #define _SETWIFIUDPMODE_EXISTS_

//uint16_t SetWifiUdpMode(uint8_t *remotip,uint8_t *remoteport,uint8_t *port)
uint16_t SetWifiUdpMode(uint8_t *remotip,uint16_t remoteport,uint16_t port)//éè??UDPá??óμ?IPoí???ú
{
	//print("IP:%s\r\n??3ì???ú:%s\r\n±?μ????ú:%s\r\n",remotip,remoteport,port);
	if(WifiSetting_Init(remotip,remoteport,port,0)==2)return 1;
	return 0;
}
 #endif
#endif


//==SetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 

#ifdef _SETSMARTEYEALLLED_
#ifndef  _SETSMARTEYEALLLED_EXISTS_
#define _SETSMARTEYEALLLED_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32

uint32_t SetSmartEyeAllLed(uint8_t which,uint32_t led1, uint32_t led2,uint32_t led3,uint32_t led4,uint32_t led5,uint32_t led6,uint32_t led7,uint32_t led8)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   uint8_t i;

   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
	Soft_I2C_Write(&iic_typedef,0xAA);//CMD
	Soft_I2C_Write(&iic_typedef,0xD1);//mode

	Soft_I2C_Write(&iic_typedef,(led1&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led1&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led1&0xFF));

	Soft_I2C_Write(&iic_typedef,(led2&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led2&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led2&0xFF));

	Soft_I2C_Write(&iic_typedef,(led3&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led3&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led3&0xFF));

	Soft_I2C_Write(&iic_typedef,(led4&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led4&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led4&0xFF));

	Soft_I2C_Write(&iic_typedef,(led5&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led5&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led5&0xFF));

	Soft_I2C_Write(&iic_typedef,(led6&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led6&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led6&0xFF));

	Soft_I2C_Write(&iic_typedef,(led7&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led7&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led7&0xFF));

	Soft_I2C_Write(&iic_typedef,(led8&0xFF0000)>>16);
	Soft_I2C_Write(&iic_typedef,(led8&0xFF00)>>8);
	Soft_I2C_Write(&iic_typedef,(led8&0xFF));


	Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨ 

        
}
#endif
#endif

//==SetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 

#ifdef _SETSMARTEYEALLLED2_
#ifndef  _SETSMARTEYEALLLED2_EXISTS_
#define _SETSMARTEYEALLLED2_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32

void SetSmartEyeAllLed2(uint8_t which,int8_t* color1, int8_t* color2,int8_t* color3,int8_t* color4,int8_t* color5,int8_t* color6,int8_t* color7,int8_t* color8)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   uint32_t led1,led2,led3,led4,led5,led6,led7,led8;
   led1=atoi(color1);
   led2=atoi(color2);
   led3=atoi(color3);
   led4=atoi(color4);
   led5=atoi(color5);
   led6=atoi(color6);
   led7=atoi(color7);
   led8=atoi(color8);
   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD1);//mode

  Soft_I2C_Write(&iic_typedef,led1/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led1%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led1%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led2/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led2%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led2%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led3/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led3%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led3%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led4/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led4%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led4%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led5/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led5%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led5%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led6/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led6%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led6%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led7/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led7%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led7%1000000)%1000);//低三位

  Soft_I2C_Write(&iic_typedef,led8/1000000);//高三位
  Soft_I2C_Write(&iic_typedef,(led8%1000000)/1000);//中三位
  Soft_I2C_Write(&iic_typedef,(led8%1000000)%1000);//低三位

  Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨ 

        
}
#endif
#endif


//==SetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 
#ifdef _SETSMARTEYEMODE_
#ifndef  _SETSMARTEYEMODE_EXISTS_
#define _SETSMARTEYEMODE_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32
uint32_t SetSmartEyeMode(uint8_t which,uint8_t cmd,uint32_t color)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   uint8_t red,gerrn,bule;

  red   = (color&0xFF0000)>>16;
  gerrn = (color&0xFF00)>>8;
  bule  = (color&0xFF);
   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD2);//mode
  Soft_I2C_Write(&iic_typedef,cmd);
  Soft_I2C_Write(&iic_typedef,red);
  Soft_I2C_Write(&iic_typedef,gerrn);
  Soft_I2C_Write(&iic_typedef,bule);
  Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨ 

        
}

 #endif
#endif

//==SetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 
#ifdef _SETSMARTEYEMODE2_
#ifndef  _SETSMARTEYEMODE2_EXISTS_
#define _SETSMARTEYEMODE2_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32
uint32_t SetSmartEyeMode2(uint8_t which,uint8_t cmd,uint8_t* color)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   uint8_t red,gerrn,bule;
   uint32_t colorc;
   colorc=atoi(color);

   red   =(colorc/1000000);//高三位
   gerrn =(colorc%1000000)/1000;//中三位
   bule  =(colorc%1000000)%1000;//低三位

   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD2);//mode
  Soft_I2C_Write(&iic_typedef,cmd);
  Soft_I2C_Write(&iic_typedef,red);
  Soft_I2C_Write(&iic_typedef,gerrn);
  Soft_I2C_Write(&iic_typedef,bule);
  Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨ 

        
}

 #endif
#endif


//==GetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 
#ifdef _GETSMARTEYEIRCODE_
#ifndef _GETSMARTEYEIRCODE_EXISTS_
#define _GETSMARTEYEIRCODE_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32
uint32_t GetSmartEyeIRcode(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   
   uint8_t data;
   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD3);//mode
  Soft_I2C_Write(&iic_typedef,0x00);
  Soft_I2C_Write(&iic_typedef,0x00);
  Soft_I2C_Write(&iic_typedef,0x00);
  Soft_I2C_Write(&iic_typedef,0x00);
  Soft_I2C_Stop(&iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_+1);
  data=Soft_I2C_Read(&iic_typedef,0);//_COLORIR_ADDR_+1
  data=Soft_I2C_Read(&iic_typedef,1);//
  Soft_I2C_Stop(&iic_typedef);
  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨  
  
  if(data!=0&&data!=0xFF) return data;
  else return 0;
        
}

 #endif
#endif



//==SetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 
#ifdef _SETSMARTEYEIRCODE_
#ifndef  _SETSMARTEYEIRCODE_EXISTS_
#define _SETSMARTEYEIRCODE_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32
uint32_t SetSmartEyeIRcode(uint8_t which,uint8_t cmd)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   

   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD4);//mode
  Soft_I2C_Write(&iic_typedef,0);//addr
  Soft_I2C_Write(&iic_typedef,cmd);
  Soft_I2C_Write(&iic_typedef,0);
  Soft_I2C_Write(&iic_typedef,0);
  Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999);//êí??I2Cê1ó?è¨ 
        
}

 #endif
#endif


//==GetColorIR (adr=0x32)Readding ID:  == DON'T DELETE!! == 
#ifdef _GETSMARTEYEDIST_
#ifndef _GETSMARTEYEDIST_EXISTS_
#define _GETSMARTEYEDIST_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _COLORIR_ADDR_ 0x32
uint32_t GetSmartEyeDist(uint8_t which)
{
   uint8_t data;
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1]; 
   

   RcuWhichMutexTake(which,1,999);//??è?I2Cê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);//CMD
  Soft_I2C_Write(&iic_typedef,0xD5);//mode
  Soft_I2C_Write(&iic_typedef,0);//addr
  Soft_I2C_Write(&iic_typedef,0);
  Soft_I2C_Write(&iic_typedef,0);
  Soft_I2C_Write(&iic_typedef,0);
  Soft_I2C_Stop(&iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_COLORIR_ADDR_+1);
  data=Soft_I2C_Read(&iic_typedef,0);//_COLORIR_ADDR_+1
  data=Soft_I2C_Read(&iic_typedef,1);//
  Soft_I2C_Stop(&iic_typedef);

  RcuWhichMutexGive(which,1,999); 
  if(data!=0xFF) return data;
  else return 0;
        
}

 #endif
#endif


/***激光测距传感器 地址0x52***/
#ifdef _GETLASERDIST_  
#ifndef  _GETLASERDIST_EXISTS_
#define _GETLASERDIST_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "vl53l0x.h"
 //vl_mode=0,默认模式：1.2米测距；   
 //vl_mode=1,长距离模式：2米测距。
 uint16_t GetLaserDist(uint8_t which, uint8_t vl_mode) 
 {
   uint16_t distance = 0;
 
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA  
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
					 port1,bit1,//SCL
		   &iic_typedef);
   
   vl_init(&iic_typedef,which);		   
   //setTimeout(500);
   
   if( (mode_flag==0)||(vl_mode!=MODE) )
   {
	 mode_flag=1;  
	 if(vl_mode==0){vl_default_mode(&iic_typedef);MODE=0;}
	 if(vl_mode==1){vl_long_mode(&iic_typedef);MODE=1;}  
   }
   
   distance = vl_result(&iic_typedef);	
   if(distance>8000)return 8888;  
   return(distance);
 }
   
 #endif
#endif  




#ifdef _GETGESTURE_
 #ifndef  _GETGESTURE_EXISTS_
  #define _GETGESTURE_EXISTS_
  #include <jmkernel.h>
  #include "PAJ7620.h"
  #include "I2C_Soft.h"
uint8_t GestureInitFlag=0,CheckSensor=0;
uint8_t Sdata=0;//新增，移到函数外侧
uint32_t GestureO=0,GestureN=0;//新增，用于保存手势识别结果一段时间
uint8_t GetGesture(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//ADC
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
   
   uint16_t gesture_data;   
   uint8_t i,status;
   uint8_t data[2];

   GPIO_Setting2((GPIO_TypeDef*)port3,bit3,GPIO_MODE_INPUT);
   CheckSensor=HAL_GPIO_ReadPin((GPIO_TypeDef*)port3,(1<<bit3));

   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
                    &iic_typedef);
            

  if(CheckSensor==1) GestureInitFlag=0;
  if(GestureInitFlag==0&&CheckSensor==0)//已接入传感器，初始化一次
  {

      while(!paj7620u2_init(&iic_typedef));//PAJ7620U2传感器初始化
    //paj7620u2_init(&iic_typedef);
      paj7620u2_selectBank(BANK0,&iic_typedef);//进入BANK0寄存器区域
      for(i=0;i<GESTURE_SIZE;i++)
      {
      GS_Write_Byte(gesture_arry[i][0],gesture_arry[i][1],&iic_typedef);//手势识别模式初始化
     } 
    paj7620u2_selectBank(BANK0,&iic_typedef);//切换回BANK0寄存器区域
    GestureInitFlag=1;
 }
      status = GS_Read_nByte(PAJ_GET_INT_FLAG1,2,&data[0],&iic_typedef);//读取手势状态
      GestureN=GetSystemTime();
	if(GestureN-GestureO>50){
		status = GS_Read_nByte(PAJ_GET_INT_FLAG1,2,&data[0],&iic_typedef);//读取手势状态
		Sdata=0;
		GestureO=GestureN;
	}

    if(!status)
    {   
      gesture_data =(uint16_t)data[1]<<8 | data[0];

      if(gesture_data) 
      {
        switch(gesture_data)
        {
          case GES_UP:               Sdata=0x01;break; //向上
          case GES_DOWM:             Sdata=0x02;break; //向下
          case GES_LEFT:             Sdata=0x03;break; //向左
          case GES_RIGHT:            Sdata=0x04;break; //向右
          case GES_FORWARD:          Sdata=0x05;break; //向前
          case GES_BACKWARD:         Sdata=0x06;break; //向后
          case GES_CLOCKWISE:        Sdata=0x07;break; //顺时针
          case GES_COUNT_CLOCKWISE:  Sdata=0x08;break; //逆时针
          case GES_WAVE:             Sdata=0x09;break; //挥动
          default:  Sdata=0x00; break;          
        }  

      }
      RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
      return Sdata;   
    }
        //Delay1ms(50);
   /* */
 
  return 0;
}
 #endif
#endif      


#ifdef _GETSHORTIRDIST_
 #ifndef  _GETSHORTIRDIST__EXISTS_
  #define _GETSHORTIRDIST__EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
#define _SHORTIRDIST_ADDR_ 0X06
uint16_t GetShortIRDist(uint32_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA

   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   
    uint16_t data;
    uint8_t  datah=0,datal=0,cmd=0,s=0,SUM=0;


   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
                    &iic_typedef);

  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_SHORTIRDIST_ADDR_);
  Soft_I2C_Write(&iic_typedef,0xAA);
  Soft_I2C_Stop(&iic_typedef);
    
  Soft_I2C_Start(&iic_typedef);
  Soft_I2C_Write(&iic_typedef,_SHORTIRDIST_ADDR_+1);
  cmd=Soft_I2C_Read(&iic_typedef,0); //数据开头
  datah=Soft_I2C_Read(&iic_typedef,0); //数据高八位
  datal=Soft_I2C_Read(&iic_typedef,0); //第八位
  s=Soft_I2C_Read(&iic_typedef,1);   //检验和
  Soft_I2C_Stop(&iic_typedef);

  SUM=(uint8_t)(cmd+datah+datal);//校验
    
  if(SUM!=s)//错误数据
  {
      return 999;
  }
  else
  {
      data=(uint16_t)(((uint16_t)datah<<8)|datal);  
  }
  RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
  return (uint16_t)data;
}
 #endif
#endif  



//==GetWifiCamCtrl Readding ID:  == DON'T DELETE!! ==

#ifdef _GETWIFICAMCTRL_
 #ifndef  _GETWIFICAMCTRL_EXISTS_
  #define _GETWIFICAMCTRL_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
uint32_t GetWifiCamCtrl(void)
{
	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();
	return buf;
	
}
 #endif
#endif

//==GetWifiCamCtrldata Readding ID:  == DON'T DELETE!! ==

#ifdef _GETWIFICAMCTRLDATA_
 #ifndef  _GETWIFICAMCTRLDATA_EXISTS_
  #define _GETWIFICAMCTRLDATA_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
uint8_t GetWifiCamCtrlData(uint8_t mode)
{
	uint8_t val;
	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();
	switch(mode)
	{
		case 1:val=(buf>>24)&0xFF;break;//X
		case 2:val=(buf>>16)&0xFF;break;//Y
		case 3:val=(buf>>8)&0xFF;break;//ID
		case 4:val=buf&0xFF;break;//大小
	}
	return val;
	
}
 #endif
#endif



//==GetWifiCamCtrl Readding ID:  == DON'T DELETE!! ==

#ifdef _GETWIFICAMROCKCTRL_
 #ifndef  _GETWIFICAMROCKCTRL_EXISTS_
  #define _GETWIFICAMROCKCTRL_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
int8_t GetWifiCamRockCtrl(uint8_t direction,uint8_t axis)
{
	int8_t temp;
	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_Rock();
	if(direction==0)//左摇杆
	{
		if(axis==0) temp=(buf>>24)&0xFF;//X
		else if(axis==1) temp=(buf>>16)&0xFF;//Y
	}
	else if(direction==1)//右摇杆
	{
		if(axis==0) temp=(buf>>8)&0xFF;//X
		else if(axis==1) temp=buf&0xFF;//Y
	}
	
	return temp;
	
}
 #endif
#endif




//==GetBluetoothControl Readding ID:  == DON'T DELETE!! ==

#ifdef _GETBLUETOOTHCONTROL_
 #ifndef  _GETBLUETOOTHCONTROL_EXISTS_
  #define _GETBLUETOOTHCONTROL_EXISTS_
 #include <jmkernel.h>

uint32_t GetBluetoothControl(void)
{
	return BluetoothPhoneControl();	
}
 #endif
#endif


//==GetBluetoothControl Readding ID:  == DON'T DELETE!! ==

#ifdef _GETBLUETOOTHCONTROLDATA_
 #ifndef  _GETBLUETOOTHCONTROLDATA_EXISTS_
  #define _GETBLUETOOTHCONTROLDATA_EXISTS_
 #include <jmkernel.h>

uint8_t GetBluetoothControlData(void)
{
	uint8_t key;
	uint32_t PhoneKey;	
	PhoneKey = BluetoothPhoneControl();
	switch(PhoneKey)
	{
		case 0x02:  key=1;
		break;
		case 0x04:  key=2;
		break;
		case 0x08:  key=3;
		break;
		case 0x10:  key=4;
		break;
		case 0x20:  key=5;
		break;
		case 0x40:  key=6;
		break;
		case 0x80:  key=7;
		break;
		case 0x100: key=8;
		break;
		default :   key=0;
		break;
	}

	return key;
	
}
 #endif
#endif


//==SetBluetoothData Readding ID:  == DON'T DELETE!! ==

#ifdef _SETBLUETOOTHDATA_
 #ifndef  _SETBLUETOOTHDATA_EXISTS_
  #define _SETBLUETOOTHDATA_EXISTS_
 #include <jmkernel.h>

void SetBluetoothData(uint8_t data)
{
	BluetoothSendData(data);	
}
 #endif
#endif



//==GetBluetoothData Readding ID:  == DON'T DELETE!! ==

#ifdef _GETBLUETOOTHDATA_
 #ifndef  _GETBLUETOOTHDATA_EXISTS_
  #define _GETBLUETOOTHDATA_EXISTS_
 #include <jmkernel.h>

uint8_t GetBluetoothData(void)
{
	return BluetoothReceiveData();	
}
 #endif
#endif


//==GetBTModuleRemoteButton Readding ID:  == DON'T DELETE!! == BE9256
#ifdef _GETBTMODULEREMOTEBUTTON_
 #ifndef  _GETBTMODULEREMOTEBUTTON_EXISTS_
  #define _GETBTMODULEREMOTEBUTTON_EXISTS_
  #include "jdy16.h"


uint16_t GetBTModuleRemoteButton(void)
{

	uint16_t data=999;
	uint32_t code=0;
	uint32_t k=1;
	uint8_t n,i;
	int8_t Rokerdata[4];
	BlueTH_Init(115200); 
	RockerDelayTimInit();
    if(BTroker2RcuData[0]==0x56&&BTroker2RcuData[1]==0xAB&&BTroker2RcuData[2]==0x05&&BTroker2RcuData[15]==0xCF) //校验数据
    {
    	code=(uint32_t)BTroker2RcuData[3]*0x1000000+(uint32_t)BTroker2RcuData[4]*0x10000+(uint32_t)BTroker2RcuData[5]*0x100+(uint32_t)BTroker2RcuData[6];
    	 for(n=0;n<20;n++)
       {
       	 if(code&(k<<n))
       	 {
       	 	 data=n;
       	 	 if(code&(k<<26))
       	 	 {
       	 	 	  data+=20;
       	 	 }
       	 	 break;
       	 }
       }

    }	
	if(data>=12&&data<=19)
	{
		//7左X 8左Y    9右X 10右Y
		for(i=0;i<4;i++) Rokerdata[i]=BTroker2RcuData[7+i];
		//0左X 1左Y    2右X 3右Y
		if(Rokerdata[3]==100&&(Rokerdata[2]>=-100&&Rokerdata[2]<100)) return 12;
		else if(Rokerdata[2]==100&&(Rokerdata[3]>=-100&&Rokerdata[3]<=100)) return 13;		
		else if(Rokerdata[3]==-100&&(Rokerdata[2]>-100&&Rokerdata[2]<100)) return 14;
		else if(Rokerdata[2]==-100&&(Rokerdata[3]>=-100&&Rokerdata[3]<=100)) return 15;
		
		else if(Rokerdata[1]==100&&(Rokerdata[0]>=-100&&Rokerdata[0]<100)) return 16;
		else if(Rokerdata[0]==100&&(Rokerdata[1]>=-100&&Rokerdata[1]<=100)) return 17;
		else if(Rokerdata[1]==-100&&(Rokerdata[0]>-100&&Rokerdata[0]<100)) return 18;
		else if(Rokerdata[0]==-100&&(Rokerdata[1]>=-100&&Rokerdata[1]<=100)) return 19;
		else return 999;
	}
    else return data;
}
 #endif
#endif

//==GetBTModuleRemoteCode Readding ID:  == DON'T DELETE!! == BE9256
#ifdef _GETBTMODULEREMOTECODE_
 #ifndef  _GETBTMODULEREMOTECODE_EXISTS_
  #define _GETBTMODULEREMOTECODE_EXISTS_
#include "jdy16.h"
uint32_t GetBTModuleRemoteCode(void)
{
	uint32_t code=0;
	uint32_t k=1;
	uint8_t n;
	
	BlueTH_Init(115200); 
	RockerDelayTimInit();
    if(BTroker2RcuData[0]==0x56&&BTroker2RcuData[1]==0xAB&&BTroker2RcuData[2]==0x05&&BTroker2RcuData[15]==0xCF) //校验数据
    {
    	code=(uint32_t)BTroker2RcuData[3]*0x1000000+(uint32_t)BTroker2RcuData[4]*0x10000+(uint32_t)BTroker2RcuData[5]*0x100+(uint32_t)BTroker2RcuData[6];   
	}
	return code; 
   
}
 #endif
#endif


//==GetBTModuleRemoteRocker Readding ID:  == DON'T DELETE!! == BE9256
#ifdef _GETBTMODULEREMOTEROCKER_
 #ifndef  _GETBTMODULEREMOTEROCKER_EXISTS_
  #define _GETBTMODULEREMOTEROCKER_EXISTS_
#include "jdy16.h"

int16_t GetBTModuleRemoteRocker(uint8_t direction,uint8_t axis)
{
  int16_t data=999; 
  uint8_t n;
  
  BlueTH_Init(115200); 
  RockerDelayTimInit();
    if(BTroker2RcuData[0]==0x56&&BTroker2RcuData[1]==0xAB&&BTroker2RcuData[2]==0x05&&BTroker2RcuData[15]==0xCF) //校验数据
    {
       if(direction==0)
       {
            switch(axis)
            {
               case 0x00:{data=(int8_t)BTroker2RcuData[7];}break; //X
               case 0x01:{data=(int8_t)BTroker2RcuData[8];}break; //Y
               default:{data=999;}
            } 
        
        }
        else
        {
            switch(axis)
            {
               case 0x00:{data=(int8_t)BTroker2RcuData[9];}break; //X
               case 0x01:{data=(int8_t)BTroker2RcuData[10];}break; //Y
               default:{data=999;}
            } 
        }
    }
    return data;
}
 #endif
#endif


#ifdef _SETIRBOARD_
 #ifndef  _SETIRBOARD_EXISTS_
  #define _SETIRBOARD_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
  
#define _SETIRBOARD_ADDR_   0X08
void SetIRBoard(uint8_t which,uint8_t addr,uint8_t mode,uint8_t color)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//ADC
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];
   
   uint16_t data;
   uint8_t  cmd=0;

   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
        &iic_typedef);
   if(mode>3)mode=3;
   if(color>63)color=63;
   cmd = (mode<<6|color);
   Soft_I2C_Start(&iic_typedef);
   Soft_I2C_Write(&iic_typedef,_SETIRBOARD_ADDR_);
   Soft_I2C_Write(&iic_typedef,0xAA);
   Soft_I2C_Write(&iic_typedef,addr);
   Soft_I2C_Write(&iic_typedef,cmd);
   Soft_I2C_Stop(&iic_typedef);
   RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
}
 #endif
#endif


//==GetRFPenCode Readding ID:  == DON'T DELETE!! == BE9237点读笔码最新值
#ifdef _GETRFPENCODE_
 #ifndef  _GETRFPENCODE_EXISTS_
  #define _GETRFPENCODE_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint32_t GetRFPenCode(uint8_t which)
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
  uint32_t data=0X1000000;
  uint8_t check_sum=0;
  uint8_t rf_data[32]={0x00};  
  uint8_t n;


  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
        &iic_typedef);

   delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
   Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
    Soft_I2C_Write(&iic_typedef,0xaa);    
    Soft_I2C_Write(&iic_typedef,0x55);    
    Soft_I2C_Write(&iic_typedef,0x05);//命令,查询点读笔码
    check_sum+=0x05;
    Soft_I2C_Write(&iic_typedef,0x04); 
    check_sum+=0x04;
    Soft_I2C_Write(&iic_typedef,0x00); 
    check_sum+=0x00;
   Soft_I2C_Write(&iic_typedef,check_sum); 
   Soft_I2C_Stop(&iic_typedef);
  
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
    for(n=0;n<15;n++) //一次要读取完所有缓冲数据
    {
         rf_data[n]=Soft_I2C_Read(&iic_typedef,0);
    }
    rf_data[15]=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);
    if(rf_data[0]==0x56&&rf_data[1]==0xAB&&rf_data[2]==0x31&&rf_data[15]==0xCF)
    {
       data=(uint32_t)rf_data[3]*0x10000+(uint32_t)rf_data[4]*0x100+(uint32_t)rf_data[5];
    }
    delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
    RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
   return data;
}
 #endif
#endif

//==GetRFID (adr=0x50)Readding ID:  == DON'T DELETE!! == rc522 // I2C 0x50
//rfid读卡号
#ifdef _GETRFID522_
#ifndef  __GETRFID522__EXISTS_
#define __GETRFID522__EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "MFRC522.h"
uint8_t rc522Reset=1;//rc522初始化标志位
uint32_t GetRFID522(uint8_t which)//选择模式
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//RST
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];   
   
   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);

    unsigned char TagType[2];
  uint8_t SelectedSnr[4];
  uint32_t tmp;
   
    char status;
  unsigned char i=1;

    if(rc522Reset)
    {//初始化rc522
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);

    WriteRawRC(CommandReg,PCD_RESETPHASE,&iic_typedef); 
    WriteRawRC(ModeReg,0x3D,&iic_typedef);//和Mifare卡通讯，CRC初始值0x6363
  WriteRawRC(TReloadRegL,30,&iic_typedef);           
  WriteRawRC(TReloadRegH,0,&iic_typedef);
  WriteRawRC(TModeReg,0x8D,&iic_typedef);
  WriteRawRC(TPrescalerReg,0x3E,&iic_typedef);
  WriteRawRC(TxAutoReg,0x40,&iic_typedef);
  
  ClearBitMask(TxControlReg, 0x03,&iic_typedef);//关闭天线
  i = ReadRawRC(TxControlReg,&iic_typedef);//开启天线
    if (!(i & 0x03))
    { SetBitMask(TxControlReg, 0x03,&iic_typedef);  }
  rc522Reset=0;
	Delay1ms(100);
    }
 
 
  status = PcdRequest(REQ_ALL,TagType,&iic_typedef);//寻卡
  if(!status)
  {
    status = PcdAnticoll(SelectedSnr,&iic_typedef);//防冲撞
    { PcdHalt(&iic_typedef);  }
  }
  
  if(!status)//优化后加入的
  {
	 tmp=SelectedSnr[0]*0x1000000+SelectedSnr[1]*0x10000+SelectedSnr[2]*0x100+SelectedSnr[3];  
  }
  return tmp;
}

 #endif
#endif


/********************************************************************************/
//==_SETRFID_ (adr=0x50)Readding ID:  == DON'T DELETE!! == 
//rfid读卡数据
#ifdef _READRFID522_
#ifndef  _READRFID522_EXISTS_
#define _READRFID522_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "MFRC522.h"
uint8_t rc522Reset1=1;//rc522初始化标志位
uint16_t ReadRFID522(uint8_t which)//读IC卡数据
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//RST
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];   
   
   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
          
  unsigned char DefaultKey[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
    unsigned char TagType[2];
  uint8_t SelectedSnr[4];
  uint32_t tmp;
   
    char status;
  unsigned char buf[16];
  unsigned char snr;
  unsigned char i=1;

   if(rc522Reset1)
    {//初始化rc522
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);

    WriteRawRC(CommandReg,PCD_RESETPHASE,&iic_typedef); 
    WriteRawRC(ModeReg,0x3D,&iic_typedef);//和Mifare卡通讯，CRC初始值0x6363
  WriteRawRC(TReloadRegL,30,&iic_typedef);           
  WriteRawRC(TReloadRegH,0,&iic_typedef);
  WriteRawRC(TModeReg,0x8D,&iic_typedef);
  WriteRawRC(TPrescalerReg,0x3E,&iic_typedef);
  WriteRawRC(TxAutoReg,0x40,&iic_typedef);
  
  ClearBitMask(TxControlReg, 0x03,&iic_typedef);//关闭天线
  i = ReadRawRC(TxControlReg,&iic_typedef);//开启天线
    if (!(i & 0x03))
    { SetBitMask(TxControlReg, 0x03,&iic_typedef);  }
  rc522Reset1=0;
	Delay1ms(100);
    }
 
 
  status = PcdRequest(REQ_ALL,TagType,&iic_typedef);//寻卡（卡片类型，寻卡方式，串口数组）
  if(!status)
  {
    status = PcdAnticoll(SelectedSnr,&iic_typedef);//防冲撞（返回SelectedSnr四位卡号）
    if(!status)
    {
      status=PcdSelect(SelectedSnr,&iic_typedef);//选择卡片
      if(!status)
      {
        snr = 1;  //扇区号1，卡有四个区域
        status = PcdAuthState(KEYA, (snr*4+3), DefaultKey, SelectedSnr, &iic_typedef);// 校验1扇区密码，密码位于每一扇区第3块
        if(!status)
        {
           status = PcdRead((snr*4+0), &buf, &iic_typedef);  // 读卡，读取1扇区0块数据到buf[0]-buf[16]
		   { PcdHalt(&iic_typedef);  }
             //return buf[0];
        }
        }
      }
    }
	else return 999;//寻卡失败返回999

  tmp=buf[0];
  return tmp;
}

 #endif
#endif
//********************************************************************************
//==_SETRFID_ (adr=0x50)Readding ID:  == DON'T DELETE!! == 
//rfid写卡
#ifdef _WRITERFID522_
#ifndef  _WRITERFID522_EXISTS_
#define _WRITERFID522_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "MFRC522.h"
uint8_t rc522Reset2=1;//rc522初始化标志位
uint8_t WriteRFID522(uint8_t which,uint8_t data)//选择模式
{
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//RST
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];   
   
   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
          
   unsigned char DefaultKey[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
   unsigned char TagType[2];
   uint8_t SelectedSnr[4];
   uint32_t tmp;
   
   char status;
   unsigned char buf[16];
   unsigned char snr;
   unsigned char i=1;

    if(rc522Reset2)
    {//初始化rc522
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);

    WriteRawRC(CommandReg,PCD_RESETPHASE,&iic_typedef); 
    WriteRawRC(ModeReg,0x3D,&iic_typedef);//和Mifare卡通讯，CRC初始值0x6363
  WriteRawRC(TReloadRegL,30,&iic_typedef);           
  WriteRawRC(TReloadRegH,0,&iic_typedef);
  WriteRawRC(TModeReg,0x8D,&iic_typedef);
  WriteRawRC(TPrescalerReg,0x3E,&iic_typedef);
  WriteRawRC(TxAutoReg,0x40,&iic_typedef);
  
  ClearBitMask(TxControlReg, 0x03,&iic_typedef);//关闭天线
  i = ReadRawRC(TxControlReg,&iic_typedef);//开启天线
    if (!(i & 0x03))
    { SetBitMask(TxControlReg, 0x03,&iic_typedef);  }
  rc522Reset2=0;
	Delay1ms(100);
    }

  buf[0]=data;
  status = PcdRequest(REQ_ALL,TagType,&iic_typedef);//寻卡（卡片类型，寻卡方式，串口数组）
  if(!status)
  {
    status = PcdAnticoll(SelectedSnr,&iic_typedef);//防冲撞（返回SelectedSnr四位卡号）
    if(!status)
    {
      status=PcdSelect(SelectedSnr,&iic_typedef);//选择卡片
      if(!status)
      {
        snr = 1;  //扇区号1，卡有四个区域
        status = PcdAuthState(KEYA, (snr*4+3), DefaultKey, SelectedSnr, &iic_typedef);// 校验1扇区密码，密码位于每一扇区第3块
        if(!status)
        {
            status = PcdWrite((snr*4+0), &buf, &iic_typedef);  // 写卡，将buf[0]-buf[16]写入1扇区0块 
			{ PcdHalt(&iic_typedef);  }
        }
        if(!status)
        {
            //WaitCardOff(&iic_typedef);//等待卡片离开
        }
        }
    }
  }
  
  tmp=status;
  return tmp;
}
 #endif
#endif

//==GetCamRecog Readding ID:  == DON'T DELETE!! == 读取摄像头模块数据包
#ifdef _GETCAMRECOG_
 #ifndef  _GETCAMRECOG_EXISTS_
  #define _GETCAMRECOG_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
int8_t GetCamRecog(uint8_t mode)
{
	int8_t val=0;

	uint32_t buf,buf2;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	if(mode>4&&mode<9){
		buf=WifiCamRX_ISR();//读图像数据
	}
	if(mode>8&&mode<13){
		buf2=WifiCamRX_Rock();//读摇杆数据
	}
	switch(mode)
	{
		case 0:val=0x56;break;//数据包格式
		case 1:val=0xAB;break;//数据包格式
		case 2:val=0x14;break;//数据包格式
		case 3:val=0xE8;break;//数据包格式
		case 4:val=0x13;break;//数据包格式

		case 5:val=(buf>>24)&0xFF;break;//X
		case 6:val=(buf>>16)&0xFF;break;//Y
		case 7:val=(buf>>8)&0xFF;break; //ID
		case 8:val=buf&0xFF;break;      //大小

		case 9:val=(buf2>>24)&0xFF;break; //左摇杆x轴
		case 10:val=(buf2>>16)&0xFF;break;//左摇杆y轴
		case 11:val=(buf2>>8)&0xFF;break; //右摇杆x轴
		case 12:val=buf2&0xFF;break;      //右摇杆y轴
	}

	return val;
	
}
 #endif
#endif

//==GetWifiPictureData Readding ID:  == DON'T DELETE!! == 读取摄像头模块检测结果
//0：二维码ID	1:图像面积	 2:图像X坐标	 3:图像Y坐标
#ifdef _GETWIFIPICTUREDATA_
 #ifndef  _GETWIFIPICTUREDATA_EXISTS_
  #define _GETWIFIPICTUREDATA_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
uint8_t GetWifiPictureData(uint8_t mode)
{
	uint8_t val=0;

	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();//读图像数据
	switch(mode)
	{
		case 0:val=(buf>>8)&0xFF;break; //二维码ID
		case 1:val=buf&0xFF;break;			//图像面积
		case 2:val=(buf>>24)&0xFF;break;	//图像X坐标
		case 3:val=(buf>>16)&0xFF;break;	//图像Y坐标
	}

	return val;
	
}
 #endif
#endif

//==GetWifiCamRockCtrlNew Readding ID:  == DON'T DELETE!! == 读取摄像头模块检测结果
//0：左摇杆x轴	1:左摇杆y轴	 2:右摇杆x轴	 3:右摇杆y轴
#ifdef _GETWIFICAMROCKCTRLNEW_
 #ifndef  _GETWIFICAMROCKCTRLNEW_EXISTS_
  #define _GETWIFICAMROCKCTRLNEW_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
int8_t GetWifiCamRockCtrlNew(uint8_t mode)
{
	int8_t val=0;

	uint32_t buf2;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf2=WifiCamRX_Rock();//读摇杆数据

	switch(mode)
	{
		case 0:val=(buf2>>24)&0xFF;break; //左摇杆x轴
		case 1:val=(buf2>>16)&0xFF;break; //左摇杆y轴
		case 2:val=(buf2>>8)&0xFF;break;  //右摇杆x轴
		case 3:val=buf2&0xFF;break;       //右摇杆y轴
	}

	return val;
	
}
 #endif
#endif


//==GetWifiCamPictureResult Readding ID:  == DON'T DELETE!! == 读取摄像头模块数据包
//摄像头检测图像的结果（人脸、二维码），检测到返回1、检测不到返回0；
#ifdef _GETWIFICAMPICTURERESULT_
 #ifndef  _GETWIFICAMPICTURERESULT_EXISTS_
  #define _GETWIFICAMPICTURERESULT_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
uint8_t GetWifiCamPictureResult(uint8_t mode)
{
	uint8_t val=0;

	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();//读图像数据
	
	val=buf&0xFF;      //读取图像大小

	if(val>0) return 1;
	else return 0;
}
 #endif
#endif


//==GetWifiCamPictureSize Readding ID:  == DON'T DELETE!! == 摄像头检测图像大小的结果
//输入参数0、1、2表示“大”、“中”、“小”
//输入“大”，并且检测到图像为“大”，返回1、否则返回0；
//输入“中”，并且检测到图像为“中”，返回1、否则返回0；
//输入“小”，并且检测到图像为“小”，返回1、否则返回0；
#ifdef _GETWIFICAMPICTURESIZE_
 #ifndef  _GETWIFICAMPICTURESIZE_EXISTS_
  #define _GETWIFICAMPICTURESIZE_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
uint8_t GetWifiCamPictureSize(uint8_t mode)
{
	uint8_t val=0,Result=0;

	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();//读图像数据
	
	val=buf&0xFF;      //大小
	
	if(mode==0&&val>=110&&val<255) {Result=1;}			//大
	else if(mode==1&&val>=60&&val<110) {Result=1;}	//中
	else if(mode==2&&val>0&&val<60) {Result=1;}	//小
	else Result=0;

	return Result;
	
}
 #endif
#endif


//==GetWifiCamPictureSite Readding ID:  == DON'T DELETE!! == 读取摄像头图像检测到的位置
//输入参数0、1、2、3、4表示“上”、“下”、“左”、“右”、“中”
//输入“上/下/左/右/中”，并且检测到图像为“上/下/左/右/中”，返回1、否则返回0；
#ifdef _GETWIFICAMPICTURESITE_
 #ifndef  _GETWIFICAMPICTURESITE_EXISTS_
  #define _GETWIFICAMPICTURESITE_EXISTS_
	#include <jmkernel.h>
extern volatile uint8_t UART2_Sletc;
uint8_t GetWifiCamPictureSite(uint8_t mode)
{
	uint8_t val=0,val2=0,Result=0;

	uint32_t buf;
	UART2_Sletc=1;//摄像头串口
	SysCOM_Init(115200);
	buf=WifiCamRX_ISR();//读图像数据

	val=(buf>>24)&0xFF;//X
	val2=(buf>>16)&0xFF;//Y

	if(mode==0&&val2<=128&&val2>0) {Result=1;}						//上
	else if(mode==1&&val2>128) {Result=1;}							//下
	else if(mode==2&&val<=128&&val>0) {Result=1;}					//左
	else if(mode==3&&val>128) {Result=1;}							//右
	else if(mode==4&&val>64&&val<192&&val2>64&&val2<192) {Result=1;}//中
	
	return Result;
	
}
 #endif
#endif

#ifdef _SETDISPLAYLATTICE_
 #ifndef  _SETDISPLAYLATTICE_EXISTS_
  #define _SETDISPLAYLATTICE_EXISTS_
#include "HT1632cDriver.h"
void SetDisplayLattice(uint8_t which,char* pic,int8_t luminance)
{
   u32 port1=portarray[RcuPORT[which][0]];//
   u32 port2=portarray[RcuPORT[which][1]];//
   u32 port3=portarray[RcuPORT[which][2]];//

   u8 bit1=RcuPIN[which][0];
   u8 bit2=RcuPIN[which][1];
   u8 bit3=RcuPIN[which][2];

	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_DI2C_Typedef Diic_typedef;
	 Soft_DI2C_BspInit(port1,bit1,//DATA
                    port2,bit2,//WR
				  port3,bit3,//CS
										&Diic_typedef);   

   Adafruit_HT1632(&Diic_typedef);//端口参数传递
   
   begin(ADA_HT1632_COMMON_16NMOS,luminance);//初始化，输入模式和亮度
												//亮度控制，范围0x0-0xF   
   //zi1616(TEXT1);//自己画字符或者自定义图案用
   
   //可以显示一个16x16的汉字或者两个8x16的数字或符号
   ziku1616(pic);//显示16x16的完整字符

   RcuWhichMutexGive(which,1,999);
}
 #endif
#endif

#ifdef _SETDISPLAYLATTICEPIC_
 #ifndef  _SETDISPLAYLATTICEPIC_EXISTS_
  #define _SETDISPLAYLATTICEPIC_EXISTS_
#include "HT1632cDriver.h"
void SetDisplayLatticePic(uint8_t which,int8_t* pic,int8_t luminance)
{
   u32 port1=portarray[RcuPORT[which][0]];//
   u32 port2=portarray[RcuPORT[which][1]];//
   u32 port3=portarray[RcuPORT[which][2]];//

   u8 bit1=RcuPIN[which][0];
   u8 bit2=RcuPIN[which][1];
   u8 bit3=RcuPIN[which][2];

	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_DI2C_Typedef Diic_typedef;
	 Soft_DI2C_BspInit(port1,bit1,//DATA
                    port2,bit2,//WR
				  port3,bit3,//CS
										&Diic_typedef);   

   Adafruit_HT1632(&Diic_typedef);//端口参数传递
   
   begin(ADA_HT1632_COMMON_16NMOS,luminance);//初始化，输入模式和亮度
												//亮度控制，范围0x0-0xF   
   //zi1616(TEXT1);//自己画字符或者自定义图案用
   
   //可以显示一个16x16的汉字或者两个8x16的数字或符号
   hua1616(pic);////绘制符号专用

   RcuWhichMutexGive(which,1,999);
}
 #endif
#endif

#ifdef _SETDISPLAYLATTICESTRING_
 #ifndef  _SETDISPLAYLATTICESTRING_EXISTS_
  #define _SETDISPLAYLATTICESTRING_EXISTS_
#include "HT1632cDriver.h"
//点阵显示字符串
void SetDisplayLatticeString(uint8_t which,char* pic,int8_t direction,uint32_t speed,int8_t luminance)
{//                            端口    字符串      移动方向  速度       亮度
   u32 port1=portarray[RcuPORT[which][0]];//
   u32 port2=portarray[RcuPORT[which][1]];//
   u32 port3=portarray[RcuPORT[which][2]];//

   u8 bit1=RcuPIN[which][0];
   u8 bit2=RcuPIN[which][1];
   u8 bit3=RcuPIN[which][2];
   

	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_DI2C_Typedef Diic_typedef;
	 Soft_DI2C_BspInit(port1,bit1,//DATA
                    port2,bit2,//WR
				  port3,bit3,//CS
										&Diic_typedef);   

   Adafruit_HT1632(&Diic_typedef);//端口参数传递
   
   begin(ADA_HT1632_COMMON_16NMOS,luminance);//初始化，输入模式和亮度
												//亮度控制，范围0x0-0xF   

   String1616(pic,direction,speed);
   RcuWhichMutexGive(which,1,999);
}
 #endif
#endif

#ifdef _SETDISPLAYLATTICECLEAR_
 #ifndef  _SETDISPLAYLATTICECLEAR_EXISTS_
  #define _SETDISPLAYLATTICECLEAR_EXISTS_
#include "HT1632cDriver.h"
//点阵清屏
void SetDisplayLatticeClear(uint8_t which)
{//                            端口    字符串      移动方向         亮度
   u32 port1=portarray[RcuPORT[which][0]];//
   u32 port2=portarray[RcuPORT[which][1]];//
   u32 port3=portarray[RcuPORT[which][2]];//

   u8 bit1=RcuPIN[which][0];
   u8 bit2=RcuPIN[which][1];
   u8 bit3=RcuPIN[which][2];
   

	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_DI2C_Typedef Diic_typedef;
	 Soft_DI2C_BspInit(port1,bit1,//DATA
                    port2,bit2,//WR
				  port3,bit3,//CS
										&Diic_typedef);   

   Adafruit_HT1632(&Diic_typedef);//端口参数传递
   
   begin(ADA_HT1632_COMMON_16NMOS,15);//初始化，输入模式和亮度
												//亮度控制，范围0x0-0xF   
												
   clearScreen();
   
   RcuWhichMutexGive(which,1,999);
}
 #endif
#endif

#ifdef _SETDISPLAYLATTICEXY_
 #ifndef  _SETDISPLAYLATTICEXY_EXISTS_
  #define _SETDISPLAYLATTICEXY_EXISTS_
#include "HT1632cDriver.h"
//单独一个点的操作
void SetDisplayLatticeXY(uint8_t which,int8_t x,int8_t y,uint8_t state,uint8_t luminance)
{//                            端口        坐标X  坐标Y     亮/灭          亮度
   u32 port1=portarray[RcuPORT[which][0]];//
   u32 port2=portarray[RcuPORT[which][1]];//
   u32 port3=portarray[RcuPORT[which][2]];//

   u8 bit1=RcuPIN[which][0];
   u8 bit2=RcuPIN[which][1];
   u8 bit3=RcuPIN[which][2];
   

	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_DI2C_Typedef Diic_typedef;
	 Soft_DI2C_BspInit(port1,bit1,//DATA
                    port2,bit2,//WR
				  port3,bit3,//CS
										&Diic_typedef);   

   Adafruit_HT1632(&Diic_typedef);//端口参数传递
   
   begin(ADA_HT1632_COMMON_16NMOS,luminance);//初始化，输入模式和亮度
												//亮度控制，范围0x0-0xF   
												
   AloneXY(x-1,y-1,state);
   
   RcuWhichMutexGive(which,1,999);
}
 #endif
#endif


#ifdef _GETAICAMDATA_
 #ifndef  _GETAICAMDATA_EXISTS_
  #define _GETAICAMDATA_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
 extern volatile uint32_t AISystemTimeO=0,AISystemTimeN=0;
uint8_t GetAICamData(uint8_t cmd)//P8
{
	
	uint8_t buf;
	UART2_Sletc=1;////摄像头串口
	SysCOM_Init(115200);
	AISystemTimeN=(uint32_t)GetSystemTime();
 	if(AISystemTimeN - AISystemTimeO >= 500)
	{
		SetCOMPackData(0);
		SetCOMPackData(1);
		SetCOMPackData(2);
		AISystemTimeO = AISystemTimeN;
	}
    switch(cmd)
   {

		case 1:buf=(GetCOMPackData(0)>>24)&0xFF;break; 
		case 2:buf=(GetCOMPackData(0)>>16)&0xFF;break; 
		case 3:buf=(GetCOMPackData(0)>>8)&0xFF;break;  
		case 4:buf=GetCOMPackData(0)&0xFF;break;       
		case 5:buf=(GetCOMPackData(1)>>24)&0xFF;break; 
		case 6:buf=(GetCOMPackData(1)>>16)&0xFF;break; 
		case 7:buf=(GetCOMPackData(1)>>8)&0xFF;break;  
		case 8:buf=GetCOMPackData(1)&0xFF;break;     
    case 9:buf=(GetCOMPackData(2)>>24)&0xFF;break; 
		case 10:buf=(GetCOMPackData(2)>>16)&0xFF;break; 
		case 11:buf=(GetCOMPackData(2)>>8)&0xFF;break;  
		case 12:buf=GetCOMPackData(2)&0xFF;break;
		case 13:buf=(GetCOMPackData(3)>>8)&0xFF;break;
		case 14:buf=GetCOMPackData(3)&0xFF;break;	   
		default:buf=0;break;

    }
	if(buf<0xEE) return buf;
	else return 0;
}
 #endif
#endif



#ifdef _SETAICAMDATA_
 #ifndef  _SETAICAMDATA_EXISTS_
  #define _SETAICAMDATA_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
void SetAICamData(uint8_t cmd0,uint8_t cmd1)//P8
{
	
	uint8_t buf;
	UART2_Sletc=1;////摄像头串口
	SysCOM_Init(115200);
  SetCOMByteData(cmd0,cmd1);
	if(cmd1>0) Delay1ms(1000);
}
 #endif
#endif


#ifdef _SETAICAMLED_
 #ifndef  _SETAICAMLED_EXISTS_
  #define _SETAICAMLED_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
void SetAICamLED(uint8_t cmd)//P8
{
	
	uint8_t buf;
	UART2_Sletc=1;////摄像头串口
	SysCOM_Init(115200);
  SetCOMSwitchData(14,cmd);
}
 #endif
#endif


#ifdef _SETWAITFORAICAMDATA_
 #ifndef  _SETWAITFORAICAMDATA_EXISTS_
  #define _SETWAITFORAICAMDATA_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
void SetWaitForAICamData(uint8_t cmd0,uint8_t cmd1)//P8
{
	
	uint8_t buf,time=0;
	UART2_Sletc=1;////摄像头串口
	SysCOM_Init(115200);
  while(1)
	{
		SetCOMByteData(0xEE,0xFF);
		Delay1ms(50);
		time++;
		if(((((GetCOMPackData(0)>>24)&0xFF)==0xF0)&&(((GetCOMPackData(0)>>16)&0xFF)==0xF1))||time>200)break;
	}
	Delay1ms(10);
	SetCOMByteData(cmd0,cmd1);
}
 #endif
#endif


#ifdef _GETAICAMVOICE_
 #ifndef  _GETAICAMVOICE_EXISTS_
  #define _GETAICAMVOICE_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
uint16_t GetAICamVoice(uint16_t cmd)//P8
{
	
    uint8_t buf;
    uint16_t cmp=0;
    UART2_Sletc=1;////摄像头串口
    SysCOM_Init(115200);
    cmp=((uint8_t)((GetCOMPackData(3)>>8)&0xFF))*256+((uint8_t)GetCOMPackData(3)&0xFF);
    if(cmp==cmd) 
    {
        SetCOMPackData(3);
        return 1;
    }
    else return 0;
}
 #endif
#endif

#ifdef _GETCOMVOICE_
 #ifndef  _GETCOMVOICE_EXISTS_
  #define _GETCOMVOICE_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
int8_t GetComVoice(int8_t* pic)//P8
{
	int s=-1;
	s=ReadComVoiceResult(pic);
	if(s==-1)return 0;
	else return 1;//识别成功

}
 #endif
#endif


#ifdef _GETSCANCAMERA_
 #ifndef  _GETSCANCAMERA_EXISTS_
  #define _GETSCANCAMERA_EXISTS_
 
uint16_t GetScanCamera(void)
{//P8读取串口数据
	//E3000Y用的连续扫描拉低
	//E3000H已经初始化为连续扫描
	uint8_t which=8;//必须接P8
	uint32_t port2 = portarray[RcuPORT[which][1]];
	uint8_t bit2=RcuPIN[which][1];	
	
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);	
	uint16_t buf;
	uint32_t BaudRate=115200;

	SysCOM_Init(BaudRate);
	buf=ReadCOMData64();//无数据时返回999
	if(buf>256)
	{//0D 0A是E3000Y的数据停止标志位，E3000H没有这两位
		buf=999;
	}
	return buf;
}
 #endif
#endif



#ifdef _GETCOMSTRCOMPARE_
 #ifndef  _GETCOMSTRCOMPARE_EXISTS_
  #define _GETCOMSTRCOMPARE_EXISTS_
 #include <jmkernel.h>
 extern volatile uint8_t UART2_Sletc;
int8_t GetComStrCompare(int8_t* pic)//P8
{
  //P5读取串口数据
	//E3000Y用的连续扫描拉低
	//E3000H已经初始化为连续扫描
	uint8_t which=8;//必须接P8
	uint32_t port2 = portarray[RcuPORT[which][1]];
	uint8_t bit2=RcuPIN[which][1];	
	
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);	
	uint16_t buf;
	uint32_t BaudRate=115200;
  int s=-1;

	SysCOM_Init(BaudRate);
	s=ReadComStrResult(pic);
	if(s==0)return 1; //识别成功
	else return 0;

}
 #endif
#endif


#ifdef _GETAIRPRESSURE_
 #ifndef  _GETAIRPRESSURE_EXISTS_
  #define _GETAIRPRESSURE_EXISTS_
 #include <jmkernel.h>
#include "gmp102.h"
//读气压传感器
float GetAirPressure(u8 which) 
{
  uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
  uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA  
  uint8_t bit1=RcuPIN[which][0];
  uint8_t bit2=RcuPIN[which][1];
  
  float Pressure=0;
  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
  Soft_I2C_Typedef iic_typedef;
  Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
  //return GetPressure(&iic_typedef);
  Pressure = GetPressure(&iic_typedef);
  RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
  return PressureDataPro(Pressure);
}  
 #endif
#endif

#ifdef _GETSHT30_
 #ifndef  _GETSHT30_EXISTS_
  #define _GETSHT30_EXISTS_
 #include <jmkernel.h>
#include "sht30.h"
/* SHT30温湿度传感器
 TEMPERATURE  0		//温度
 HUMIDITY  1		//湿度
*/
float GetSht30(u8 which, u8 command) 
{
  uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
  uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA  
  uint8_t bit1=RcuPIN[which][0];
  uint8_t bit2=RcuPIN[which][1];
  
  RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
  Soft_I2C_Typedef iic_typedef;
  Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
  
  //  result = periodicFetchData(&iic_typedef); 
  
  ReadTempAndHumi(&iic_typedef);
  RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
  Delay1ms(15);
  if(command==0) return cTemp;
  if(command==1) return humidity;
  
}  
 #endif
#endif

#ifdef _GETMAGNETIC_
 #ifndef  _GETMAGNETIC_EXISTS_
  #define _GETMAGNETIC_EXISTS_
 #include <jmkernel.h>
/*磁敏传感器
 model  0	//磁场强度
 model  1	//磁场方向
*/
uint16_t GetMagnetic(u8 which, u8 model) 
{
	uint32_t port3 = portarray[RcuPORT[which][2]];
	uint8_t bit3=RcuPIN[which][2];
	uint16_t i;
	uint16_t strength,direction;
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);
	
	i=GetAdcResult(which);
	if(i>2000) {strength=i-2000;}
	else {strength=2000-i;}
	
	if(i>2300) {direction=1;}
	else if(i<1700) {direction=2;}
	else {direction=0;}

	if(model==0) return strength;
	if(model==1) return direction;	
	//return (uint16_t)i;  
}  
 #endif
#endif


//==SetMagneticServoDegreeTime Readding ID:  == DON'T DELETE!! == 设置BE-9520伺服马达的目标角度与运动时间
#ifdef _SETMAGNETICSERVODEGREETIME_
 #ifndef _SETMAGNETICSERVODEGREETIME_EXISTS_
#define  _SETMAGNETICSERVODEGREETIME_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _I2C_addr_w  0XA0
void SetMagneticServoDegreeTime(uint8_t which,uint16_t degree,uint16_t time)
{		
		uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
		uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
		uint8_t bit1=RcuPIN[which][0];
		uint8_t bit2=RcuPIN[which][1];
	
		uint8_t check_sum=0;
		uint8_t id,cmd;
		uint16_t data1,data2;
		static uint16_t degree_temp=999;//上一次的角度

		id=0x01; 
		cmd=0x01;
		
        if(degree==degree_temp)  { return;}//角度值重复，不响应
		degree_temp=degree;
		
		data1=degree;
		data1%=360;

		data2=time;
		if(data2==0)  data2=1;//时间为0，认为需要最大速度  ，时间设为1ms

		
		RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
		Soft_I2C_Typedef iic_typedef;
		Soft_I2C_BspInit(port2,bit2,//SDA
					   port1,bit1,//SCL
			           &iic_typedef);

		delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	//发射指令

		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

		Soft_I2C_Write(&iic_typedef,0xfe);
	 
		Soft_I2C_Write(&iic_typedef,0xfe);
		
		Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
		check_sum+=id;
		
		Soft_I2C_Write(&iic_typedef,cmd); 
		check_sum+=cmd;

		Soft_I2C_Write(&iic_typedef,data1/256); //d1h
		check_sum+=(data1/256);

		Soft_I2C_Write(&iic_typedef,data1%256); //d1l
		check_sum+=(data1%256);

		Soft_I2C_Write(&iic_typedef,data2/256); //d2h
		check_sum+=(data2/256);

		Soft_I2C_Write(&iic_typedef,data2%256); //d2l
		check_sum+=(data2%256);

		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);

		delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
		RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

}
 #endif
#endif

//==SetMagneticServoDegreeSpeed Readding ID:  == DON'T DELETE!! == 设置BE-9520伺服马达的目标角度与运动速度
#ifdef _SETMAGNETICSERVODEGREESPEED_
 #ifndef _SETMAGNETICSERVODEGREESPEED_EXISTS_
  #define _SETMAGNETICSERVODEGREESPEED_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0
uint16_t Get_IS_degree1(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t rec_data[16]={0x00};  
	uint16_t data=0X00;
	uint8_t id,cmd,n,check_sum;

	id=0x01; 
	cmd=0x24;
	check_sum=0;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
				   port1,bit1,//SCL
				   &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);	 
	Soft_I2C_Write(&iic_typedef,0xfe);

	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,0x00); //D1H
	Soft_I2C_Write(&iic_typedef,0x00); //D1L
	Soft_I2C_Write(&iic_typedef,0x00); //D2H
	Soft_I2C_Write(&iic_typedef,0x00); //D2L

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	for(n=0;n<6;n++) //一次要读取完所有缓冲数据
	{
	 rec_data[n]=Soft_I2C_Read(&iic_typedef,0);
	}
	rec_data[6]=Soft_I2C_Read(&iic_typedef,1);
	Soft_I2C_Stop(&iic_typedef);

	if(rec_data[0]==0xfe&&rec_data[1]==0xfe&&rec_data[3]==0x0d)
	{
	   data=(uint16_t)rec_data[4]*0x100+(uint16_t)rec_data[5];
	}
	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
    return data;
}
void SetMagneticServoDegreeSpeed(uint8_t which,uint16_t degree,uint16_t speed)
{		
		uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
		uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
		uint8_t bit1=RcuPIN[which][0];
		uint8_t bit2=RcuPIN[which][1];
	
		uint8_t check_sum=0;
		uint8_t id,cmd;
		uint16_t data1,data2,time;
		uint16_t degree_step=0;//运动距离
		uint16_t degree_temp=0;

                                degree_temp=Get_IS_degree1(which);  //当前角度值
		degree_step=abs((int16_t)degree-(int16_t)degree_temp);  //角度差
		
		if(degree_step==0)  return;
		
        time= (uint16_t)(10+(float)degree_step*3*((float)100/(float)speed));  //最快3ms/度，对应的速度值为100

		id=0x01; 
		cmd=0x01;
		data1=degree;
		data2=time;
		
		RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
		Soft_I2C_Typedef iic_typedef;
		Soft_I2C_BspInit(port2,bit2,//SDA
			         port1,bit1,//SCL
			           &iic_typedef);

		delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	//发射指令

		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

		Soft_I2C_Write(&iic_typedef,0xfe);
	 
		Soft_I2C_Write(&iic_typedef,0xfe);
		
		Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
		check_sum+=id;
		
		Soft_I2C_Write(&iic_typedef,cmd); 
		check_sum+=cmd;

		Soft_I2C_Write(&iic_typedef,data1/256); //d1h
		check_sum+=(data1/256);

		Soft_I2C_Write(&iic_typedef,data1%256); //d1l
		check_sum+=(data1%256);

		Soft_I2C_Write(&iic_typedef,data2/256); //d2h
		check_sum+=(data2/256);

		Soft_I2C_Write(&iic_typedef,data2%256); //d2l
		check_sum+=(data2%256);

		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);

		delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
		RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

}
 #endif
#endif

//==SetMagneticServoWaitForDegreeSpeed Readding ID:  == DON'T DELETE!! ==等待BE-9520伺服马达的目标角度到达
#ifdef _SETMAGNETICSERVOWAITFORDEGREE_
 #ifndef _SETMAGNETICSERVOWAITFORDEGREE_EXISTS_
#define  _SETMAGNETICSERVOWAITFORDEGREE_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#define _I2C_addr_w  0XA0

uint16_t Get_IS_degree2(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t rec_data[16]={0x00};  
	uint16_t data=0X00;
	uint8_t id,cmd,n,check_sum;

	id=0x01; 
	cmd=0x24;
	check_sum=0;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
				   port1,bit1,//SCL
				   &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);	 
	Soft_I2C_Write(&iic_typedef,0xfe);

	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,0x00); //D1H
	Soft_I2C_Write(&iic_typedef,0x00); //D1L
	Soft_I2C_Write(&iic_typedef,0x00); //D2H
	Soft_I2C_Write(&iic_typedef,0x00); //D2L

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	for(n=0;n<6;n++) //一次要读取完所有缓冲数据
	{
	 rec_data[n]=Soft_I2C_Read(&iic_typedef,0);
	}
	rec_data[6]=Soft_I2C_Read(&iic_typedef,1);
	Soft_I2C_Stop(&iic_typedef);

	if(rec_data[0]==0xfe&&rec_data[1]==0xfe&&rec_data[3]==0x0d)
	{
	   data=(uint16_t)rec_data[4]*0x100+(uint16_t)rec_data[5];
	}
	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
    return data;
}
void SetMagneticServoWaitForDegree(uint8_t which,uint16_t degree,uint16_t speed)
{		
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	
	uint8_t check_sum=0;
	uint8_t id,cmd;
	uint16_t data1,data2,time;
	uint16_t deg_is=999;

	uint16_t degree_temp=0;//当前角度
	uint16_t degree_step=0;//运动距离

	degree_temp=Get_IS_degree2(which);  //当前角度值
	degree_step=abs((int16_t)degree-(int16_t)degree_temp);	//角度差

	if(degree_step==0)  return;
	
	time= (uint16_t)(10+(float)degree_step*3*((float)100/(float)speed));  //最快3ms/度，对应的速度值为100
	
	id=0x01; 
	cmd=0x01;
	data1=degree;
	data2=time;


	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		         port1,bit1,//SCL
		           &iic_typedef);

	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
//发射指令

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);
 
	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,data1/256); //d1h
	check_sum+=(data1/256);

	Soft_I2C_Write(&iic_typedef,data1%256); //d1l
	check_sum+=(data1%256);

	Soft_I2C_Write(&iic_typedef,data2/256); //d2h
	check_sum+=(data2/256);

	Soft_I2C_Write(&iic_typedef,data2%256); //d2l
	check_sum+=(data2%256);

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

	while(deg_is!=degree)
	{
	      deg_is=Get_IS_degree2(which);
	}

}
 #endif
#endif

//==SetMagneticServoCodeMotor Readding ID:  == DON'T DELETE!! ==设置BE-9520伺服马达为编码电机模式
#ifdef _SETMAGNETICSERVOCODEMOTOR_
 #ifndef _SETMAGNETICSERVOCODEMOTOR_EXISTS_
#define _SETMAGNETICSERVOCODEMOTOR_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0
   
int32_t Get_IS_Code(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t check_sum=0;
	uint8_t id,cmd;
	int32_t data=0X00;
	uint8_t n;

	uint8_t rec_data[9]={0x00};  

	id=0x01; 
	cmd=0x37;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权

	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
				   port1,bit1,//SCL
				   &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
   
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
	
	Soft_I2C_Write(&iic_typedef,0xfe);	 
	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;
   
	
	Soft_I2C_Write(&iic_typedef,0x00); //D1H
	Soft_I2C_Write(&iic_typedef,0x00); //D1L
	Soft_I2C_Write(&iic_typedef,0x00); //D2H
	Soft_I2C_Write(&iic_typedef,0x00); //D2L
   
	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);
   
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	for(n=0;n<8;n++) //一次要读取完所有缓冲数据
	{
		 rec_data[n]=Soft_I2C_Read(&iic_typedef,0);
	}
   rec_data[8]=Soft_I2C_Read(&iic_typedef,1);
   Soft_I2C_Stop(&iic_typedef);
   
   if(rec_data[0]==0xfe&&rec_data[1]==0xfe&&rec_data[3]==0x0d)
   {
	   data=(uint32_t)rec_data[4]*0x1000000+(uint32_t)rec_data[5]*0x10000+(uint32_t)rec_data[6]*0x100+(uint32_t)rec_data[7];
   }
   delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
   RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
   return(data);


}

void SetMagneticServoCodeMotor(uint8_t which,int32_t run_code,int16_t speed)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t check_sum=0;
	uint8_t id,cmd;
	uint8_t data1,data2,data3;
	int32_t code_start,code_temp;

	id=0x01; 
	cmd=0x03;

    if(run_code==0&&speed!=0)  {return;}
	data1=(run_code<<8)>>24;
	data2=(run_code<<16)>>24;
	data3=(run_code<<24)>>24;

	code_start=Get_IS_Code(which); //获取开始位置编码值

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
					port1,bit1,//SCL
					&iic_typedef);

	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);	 
	Soft_I2C_Write(&iic_typedef,0xfe);

	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;
	Soft_I2C_Write(&iic_typedef,data1); //d1
	check_sum+=data1;
	Soft_I2C_Write(&iic_typedef,data2); //d2
	check_sum+=data2;
	Soft_I2C_Write(&iic_typedef,data3); //d3
	check_sum+=data3;
	Soft_I2C_Write(&iic_typedef,speed); //
	check_sum+=speed;

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
	
	do{
		code_temp=Get_IS_Code(which)-code_start;
		code_temp=abs(code_temp);
   	  }while(((code_temp+2)<run_code)&&(run_code!=0)&&(speed!=0));
		
}
 #endif
#endif



//==SetMagneticServoMotor Readding ID:  == DON'T DELETE!! ==设置BE-9520磁编码伺服马达的电机运动模式
#ifdef _SETMAGNETICSERVOMOTOR_
 #ifndef  _SETMAGNETICSERVOMOTOR_EXISTS_
  #define _SETMAGNETICSERVOMOTOR_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

void SetMagneticServoMotor(uint8_t which,int16_t speed)
{
		uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
		uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
		uint8_t bit1=RcuPIN[which][0];
		uint8_t bit2=RcuPIN[which][1];
	
		uint8_t check_sum=0;
		uint8_t id,cmd;
		uint16_t data1,data2,direction;

		id=0x01; 
		cmd=0x04;
	
		if(speed>0)    //正转
		{
			direction=0x00;
		}
		else if(speed==0)  //停止
		{
			direction=0x01;
		}
		else if(speed<0)   //反转
		{
			direction=0x02;
		}
		else
		{ 
			direction=0x01;
		}
		
		data1=direction;
		data2=abs(speed);	
		
		RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
		Soft_I2C_Typedef iic_typedef;
		Soft_I2C_BspInit(port2,bit2,//SDA
					   port1,bit1,//SCL
			           &iic_typedef);

		delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

		Soft_I2C_Write(&iic_typedef,0xfe);	 
		Soft_I2C_Write(&iic_typedef,0xfe);

		Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
		check_sum+=id;
		Soft_I2C_Write(&iic_typedef,cmd); 
		check_sum+=cmd;
		Soft_I2C_Write(&iic_typedef,data1/256); //d1h
		check_sum+=(data1/256);
		Soft_I2C_Write(&iic_typedef,data1%256); //d1l
		check_sum+=(data1%256);

		Soft_I2C_Write(&iic_typedef,data2/256); //d2h
		check_sum+=(data2/256);
		Soft_I2C_Write(&iic_typedef,data2%256); //d2l
		check_sum+=(data2%256);

		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);

		delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
		RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

}
 #endif
#endif


//==SetMagneticServoEncoder Readding ID:  == DON'T DELETE!! ==BE-9520磁编码伺服马达编码器清零
#ifdef _SETMAGNETICSERVOENCODER_
#ifndef _SETMAGNETICSERVOENCODER_EXISTS_
#define _SETMAGNETICSERVOENCODER_EXISTS_
#include  "I2C_Soft.h"
#define  _I2C_addr_w   0XA0

void SetMagneticServoEncoder(uint8_t which)
{
	 uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	 uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	 uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
	 
	 uint8_t check_sum=0;
	 uint8_t id,cmd;

 	 uint8_t n;
 	 
	 
	 id=0x01; 
	 cmd=0x38;
	
	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
					port1,bit1,//SCL
					&iic_typedef);
	 
	 delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	 Soft_I2C_Start(&iic_typedef);
	 Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
	 
	 Soft_I2C_Write(&iic_typedef,0xfe);   
	 Soft_I2C_Write(&iic_typedef,0xfe);
	 
	 Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	 check_sum+=id;
	 Soft_I2C_Write(&iic_typedef,cmd); 
	 check_sum+=cmd;	 
	 Soft_I2C_Write(&iic_typedef,0x00); //D1H
	 Soft_I2C_Write(&iic_typedef,0x00); //D1L
	 Soft_I2C_Write(&iic_typedef,0x00); //D2H
	 Soft_I2C_Write(&iic_typedef,0x00); //D2L
	
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

}
 #endif
#endif

//==GetMagneticServoEncoder Readding ID:  == DON'T DELETE!! ==读取BE-9520编码器数值
#ifdef _GETMAGNETICSERVOENCODER_
 #ifndef _GETMAGNETICSERVOENCODER_EXISTS_
  #define _GETMAGNETICSERVOENCODER_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

int32_t GetMagneticServoEncoder(uint8_t which)
{
	 uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	 uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	 uint8_t bit1=RcuPIN[which][0];
	 uint8_t bit2=RcuPIN[which][1];
	 
	 uint8_t check_sum=0;
	 uint8_t id,cmd;
	 int32_t data=0X00;
 	 uint8_t n;
 	 
	 uint8_t rec_data[9]={0x00};  
	 
	 id=0x01; 
	 cmd=0x37;
	
	 RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	 Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
					port1,bit1,//SCL
					&iic_typedef);
	 
	 delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	 Soft_I2C_Start(&iic_typedef);
	 Soft_I2C_Write(&iic_typedef,_I2C_addr_w);
	 
	 Soft_I2C_Write(&iic_typedef,0xfe);   
	 Soft_I2C_Write(&iic_typedef,0xfe);
	 
	 Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	 check_sum+=id;
	 Soft_I2C_Write(&iic_typedef,cmd); 
	 check_sum+=cmd;

	 
	 Soft_I2C_Write(&iic_typedef,0x00); //D1H
	 Soft_I2C_Write(&iic_typedef,0x00); //D1L
	 Soft_I2C_Write(&iic_typedef,0x00); //D2H
	 Soft_I2C_Write(&iic_typedef,0x00); //D2L
	
	 Soft_I2C_Write(&iic_typedef,check_sum); 
	 Soft_I2C_Stop(&iic_typedef);
	
	 Soft_I2C_Start(&iic_typedef);
	 Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	 for(n=0;n<8;n++) //一次要读取完所有缓冲数据
	 {
		  rec_data[n]=Soft_I2C_Read(&iic_typedef,0);
	 }
	rec_data[8]=Soft_I2C_Read(&iic_typedef,1);
	Soft_I2C_Stop(&iic_typedef);

	if(rec_data[0]==0xfe&&rec_data[1]==0xfe&&rec_data[3]==0x0d)
	{
		data=(uint32_t)rec_data[4]*0x1000000+(uint32_t)rec_data[5]*0x10000+(uint32_t)rec_data[6]*0x100+(uint32_t)rec_data[7];
	}
	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
	return(data);
}
 #endif
#endif


//== GetMagneticServoDegree Readding ID:  == DON'T DELETE!! ==读取BE-9520伺服马达的伺服角度值
#ifdef _GETMAGNETICSERVODEGREE_
 #ifndef  _GETMAGNETICSERVODEGREE_EXISTS_
  #define _GETMAGNETICSERVODEGREE_EXISTS_
  #include "I2C_Soft.h"
   #define _I2C_addr_w  0XA0

uint16_t GetMagneticServoDegree(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t rec_data[16]={0x00};  
	uint16_t data=0X00;
	uint8_t id,cmd,n,check_sum;

	id=0x01; 
	cmd=0x24;
	check_sum=0;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
				   port1,bit1,//SCL
				   &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);	 
	Soft_I2C_Write(&iic_typedef,0xfe);

	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,0x00); //D1H
	Soft_I2C_Write(&iic_typedef,0x00); //D1L
	Soft_I2C_Write(&iic_typedef,0x00); //D2H
	Soft_I2C_Write(&iic_typedef,0x00); //D2L

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,_I2C_addr_w+1);
	for(n=0;n<6;n++) //一次要读取完所有缓冲数据
	{
	 rec_data[n]=Soft_I2C_Read(&iic_typedef,0);
	}
	rec_data[6]=Soft_I2C_Read(&iic_typedef,1);
	Soft_I2C_Stop(&iic_typedef);

	if(rec_data[0]==0xfe&&rec_data[1]==0xfe&&rec_data[3]==0x0d)
	{
	   data=(uint16_t)rec_data[4]*0x100+(uint16_t)rec_data[5];
	}
	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权
   return (data);

}
 #endif
#endif


//==SetMagneticServoPowerDown Readding ID:  == DON'T DELETE!! == 设置BE-9520 伺服马达进入失电模式（0力矩）
#ifdef _SETMAGNETICSERVOPOWERDOWN_
#ifndef  _SETMAGNETICSERVOPOWERDOWN_EXISTS_
#define _SETMAGNETICSERVOPOWERDOWN_EXISTS_
#include "I2C_Soft.h"
#define _I2C_addr_w  0XA0

void SetMagneticServoPowerDown(uint8_t which)
{
		uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
		uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
		uint8_t bit1=RcuPIN[which][0];
		uint8_t bit2=RcuPIN[which][1];

	
		uint8_t check_sum=0;
		uint8_t id,cmd;
		uint16_t data1,data2;

		id=0x01; 
		cmd=0x05;
		data1=0xaffa;//特殊指令的参数要求是0XAFFA
		data2=0xaffa;
		
		RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
		Soft_I2C_Typedef iic_typedef;
		Soft_I2C_BspInit(port2,bit2,//SDA
					   port1,bit1,//SCL
			           &iic_typedef);

		delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

		Soft_I2C_Write(&iic_typedef,0xfe);
	 
		Soft_I2C_Write(&iic_typedef,0xfe);
		
		Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
		check_sum+=id;
		
		Soft_I2C_Write(&iic_typedef,cmd); 
		check_sum+=cmd;

		Soft_I2C_Write(&iic_typedef,data1/256); //d1h
		check_sum+=(data1/256);

		Soft_I2C_Write(&iic_typedef,data1%256); //d1l
		check_sum+=(data1%256);

		Soft_I2C_Write(&iic_typedef,data2/256); //d2h
		check_sum+=(data2/256);

		Soft_I2C_Write(&iic_typedef,data2%256); //d2l
		check_sum+=(data2%256);

		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);

		delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
		RcuWhichMutexGive(which,1,999);//释放IIC端口使用权


}
 #endif
#endif


//==SetMagneticServoPowerDown Readding ID:  == DON'T DELETE!! == 输出BE-9520 伺服马达通用设置命令
#ifdef _SETMAGNETICSERVO_CMD_
#ifndef  _SETMAGNETICSERVO_CMD_EXISTS_
#define _SETMAGNETICSERVO_CMD_EXISTS_
#include "I2C_Soft.h"
#define _I2C_addr_w  0XA0

void SetMagneticServo_CMD(uint8_t which,uint8_t cmd,uint16_t data1,uint16_t data2)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	
	uint8_t id=0x01;
	uint8_t check_sum=0x00;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		          port1,bit1,//SCL
		          &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,_I2C_addr_w);

		Soft_I2C_Write(&iic_typedef,0xfe);
	 
		Soft_I2C_Write(&iic_typedef,0xfe);
		
		Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
		check_sum+=id;
		
		Soft_I2C_Write(&iic_typedef,cmd); 
		check_sum+=cmd;

		Soft_I2C_Write(&iic_typedef,data1/256); //d1h
		check_sum+=(data1/256);

		Soft_I2C_Write(&iic_typedef,data1%256); //d1l
		check_sum+=(data1%256);

		Soft_I2C_Write(&iic_typedef,data2/256); //d2h
		check_sum+=(data2/256);

		Soft_I2C_Write(&iic_typedef,data2%256); //d2l
		check_sum+=(data2%256);

		Soft_I2C_Write(&iic_typedef,check_sum); 
		Soft_I2C_Stop(&iic_typedef);

		delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
		RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

 
}
 #endif
#endif



#ifdef _SETPUMP_                
 #ifndef  _SETPUMP_EXISTS_
  #define _SETPUMP_EXISTS_
  #include <jmkernel.h>
 //设置气泵（端口）状态为（状态选择）      状态选择1,0/HIGH,LOW
void SetPump(uint8_t which,uint8_t State)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

   RcuWhichMutexTake(which,1,0);
   GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
   GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);


   if(State==1)
   {
	   HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
	   Delay1ms(100);
	   HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
   }
   
   else
	{
		HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
		Delay1ms(100);
		HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_RESET);

   }
	RcuWhichMutexGive(which,1,0);
  }
 #endif
#endif

//==SetServo Readding ID:  == DON'T DELETE!! ==
#ifdef _SETSERVOMOTOR_
 #ifndef  _SETSERVOMOTOR_EXISTS_
  #define _SETSERVOMOTOR_EXISTS_
  
void SetServoMotor(uint8_t which,int speed)
{
	SetComServoAngleAdjustFlag(which,0);
    ComServoInit(which);
	if(speed < -100) speed = -100;
	if(speed > 100 ) speed = 100;
	if(speed < 0)//-100 -0
	{
		speed = 100 + speed;
		ComServoAngle(which,(speed+350),0);
	}
	else if(speed > 0)//0-100
	{
		ComServoAngle(which,(speed+450),0);
	}
	else{//0
		ComServoAngle(which,450,0);
	}
}
 #endif
#endif


/********************************************************************************/
//==_SETRFID_ (adr=0x50)Readding ID:  == DON'T DELETE!! == 
//rfid读卡数据
#ifdef _READRFID522SECTOR_
#ifndef  _READRFID522SECTOR_EXISTS_
#define _READRFID522SECTOR_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "MFRC522.h"
uint8_t rc522Reset1Sector=1;//rc522初始化标志位
uint32_t ReadRFID522Sector(uint8_t which,unsigned char snr,unsigned char kuai)//读IC卡数据
{//读取的时候要输入页号1-15，块号0-2。返回的数据从原来的8个字节扩展为32个字节
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//RST
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];   
   
   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
          
  unsigned char DefaultKey[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
    unsigned char TagType[2];
  uint8_t SelectedSnr[4];
  uint32_t tmp;
   
    char status;
  unsigned char buf[16];
  //unsigned char snr;
  unsigned char i=1;
	snr = snr+1;
   if(rc522Reset1Sector)
    {//初始化rc522
  GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
  Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
  Delay1ms(1);

    WriteRawRC(CommandReg,PCD_RESETPHASE,&iic_typedef); 
    WriteRawRC(ModeReg,0x3D,&iic_typedef);//和Mifare卡通讯，CRC初始值0x6363
  WriteRawRC(TReloadRegL,30,&iic_typedef);           
  WriteRawRC(TReloadRegH,0,&iic_typedef);
  WriteRawRC(TModeReg,0x8D,&iic_typedef);
  WriteRawRC(TPrescalerReg,0x3E,&iic_typedef);
  WriteRawRC(TxAutoReg,0x40,&iic_typedef);
  
  ClearBitMask(TxControlReg, 0x03,&iic_typedef);//关闭天线
  i = ReadRawRC(TxControlReg,&iic_typedef);//开启天线
    if (!(i & 0x03))
    { SetBitMask(TxControlReg, 0x03,&iic_typedef);  }
  rc522Reset1Sector=0;
	Delay1ms(100);
    }
 
 
  status = PcdRequest(REQ_ALL,TagType,&iic_typedef);//寻卡（卡片类型，寻卡方式，串口数组）
  if(!status)
  {
    status = PcdAnticoll(SelectedSnr,&iic_typedef);//防冲撞（返回SelectedSnr四位卡号）
    if(!status)
    {
      status=PcdSelect(SelectedSnr,&iic_typedef);//选择卡片
      if(!status)
      {
        //snr = 1;  //扇区号1，卡有四个区域
        status = PcdAuthState(KEYA, (snr*4+3), DefaultKey, SelectedSnr, &iic_typedef);// 校验1扇区密码，密码位于每一扇区第3块
        if(!status)
        {
           status = PcdRead((snr*4+kuai), &buf, &iic_typedef);  // 读卡，读取1扇区0块数据到buf[0]-buf[16]
		   { PcdHalt(&iic_typedef);  }
             //return buf[0];
        }
        }
      }
    }
	else return 999;//寻卡失败返回999

  tmp=buf[0]*0x1000000+buf[1]*0x10000+buf[2]*0x100+buf[3];
  return tmp;
}

 #endif
#endif
//********************************************************************************
//==_SETRFID_ (adr=0x50)Readding ID:  == DON'T DELETE!! == 
//rfid写卡
#ifdef _WRITERFID522SECTOR_
#ifndef  _WRITERFID522SECTOR_EXISTS_
#define _WRITERFID522SECTOR_EXISTS_
#include <jmkernel.h>
#include "I2C_Soft.h"
#include "MFRC522.h"
uint8_t rc522Reset2Sector=1;//rc522初始化标志位                                 
uint8_t WriteRFID522Sector(uint8_t which,unsigned char snr,unsigned char kuai,uint32_t data)//选择模式，data改为32字节，可以输入大一点的数字
{//扇区号1-15，块号0-2，没块能存放16个字节，每一次的擦除和写入都要以块为单位，擦除写入16字节（0扇区0块不能用。）
   uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
   uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
   uint32_t port3=portarray[RcuPORT[which][2]];//RST
   uint8_t bit1=RcuPIN[which][0];
   uint8_t bit2=RcuPIN[which][1];
   uint8_t bit3=RcuPIN[which][2];   
   
   RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
   Soft_I2C_Typedef iic_typedef;
   Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
          &iic_typedef);
          
   unsigned char DefaultKey[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
   unsigned char TagType[2];
   uint8_t SelectedSnr[4];
   uint32_t tmp;
   
   char status;
   unsigned char buf[16];//存储块数据
   //unsigned char snr;//snr存储扇区号
   unsigned char i=1;
		snr = snr+1;
    if(rc522Reset2Sector)
    {//初始化rc522
   GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_OUTPUT_PP);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
   Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_RESET);
   Delay1ms(1);
   HAL_GPIO_WritePin((GPIO_TypeDef*)port3,(1<<bit3),GPIO_PIN_SET);
   Delay1ms(1);

  WriteRawRC(CommandReg,PCD_RESETPHASE,&iic_typedef); 
  WriteRawRC(ModeReg,0x3D,&iic_typedef);//和Mifare卡通讯，CRC初始值0x6363
  WriteRawRC(TReloadRegL,30,&iic_typedef);           
  WriteRawRC(TReloadRegH,0,&iic_typedef);
  WriteRawRC(TModeReg,0x8D,&iic_typedef);
  WriteRawRC(TPrescalerReg,0x3E,&iic_typedef);
  WriteRawRC(TxAutoReg,0x40,&iic_typedef);
  
  ClearBitMask(TxControlReg, 0x03,&iic_typedef);//关闭天线
  i = ReadRawRC(TxControlReg,&iic_typedef);//开启天线
    if (!(i & 0x03))
    { SetBitMask(TxControlReg, 0x03,&iic_typedef);  }
  rc522Reset2Sector=0;
	 Delay1ms(100);
    }

  //buf[0]=data;

  buf[0]= data>>24;
  buf[1]=(data>>16)&0xff;
  buf[2]=(data>> 8)&0xff;
  buf[3]= data     &0xff;

  status = PcdRequest(REQ_ALL,TagType,&iic_typedef);//寻卡（卡片类型，寻卡方式，串口数组）
  if(!status)
  {
    status = PcdAnticoll(SelectedSnr,&iic_typedef);//防冲撞（返回SelectedSnr四位卡号）
    if(!status)
    {
      status=PcdSelect(SelectedSnr,&iic_typedef);//选择卡片
      if(!status)
      {
        //snr = 1;  //扇区号1，卡有四个区域
        status = PcdAuthState(KEYA, (snr*4+3), DefaultKey, SelectedSnr, &iic_typedef);// 校验1扇区密码，密码位于每一扇区第3块
        if(!status)
        {//snr*4+#是块选择，#可以输入0-2，3是读取密码，不能写入数据
            status = PcdWrite((snr*4+kuai), &buf, &iic_typedef);  // 写卡，将buf[0]-buf[16]写入1扇区0块 
			{ PcdHalt(&iic_typedef);  }
        }
        if(!status)
        {
            //WaitCardOff(&iic_typedef);//等待卡片离开
        }
        }
    }
  }
  
  tmp=status;
  return tmp;
}
 #endif
#endif



#ifdef _GETTRACEV2I2CSTATE_
 #ifndef _GETTRACEV2I2CSTATE_EXISTS_
  #define _GETTRACEV2I2CSTATE_EXISTS_
  #include <jmkernel.h>
  #include "I2C_Soft.h"
uint8_t GetTraceV2I2CState( uint8_t which, uint8_t bit)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t m_ChannelState;
   //OS_ENTER_CRITICAL();

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,9);
    Soft_I2C_Stop(&iic_typedef);
    
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x19);
    m_ChannelState=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);

	m_ChannelState = m_ChannelState   &   (0x01   <<   (bit-1))   ?   1   :   0;
	if(TraceLineColor[which-1] == 0)
	 	m_ChannelState = m_ChannelState;
	else 
		m_ChannelState = (!m_ChannelState);
	return m_ChannelState;
}
 #endif
#endif

#ifdef _SETMOTORCONSTSPEEDVALUE_
 #ifndef  _SETMOTORCONSTSPEEDVALUE_EXISTS_
 #define _SETMOTORCONSTSPEEDVALUE_EXISTS_
 #include <jmkernel.h>

void SetMotorConstSpeedValue(uint8_t which,int code,double p,double i,double d)
{
	Set_Motor_Pid_Sarameter(which,code,p,i,d);

}
 #endif
#endif

#ifdef _SETMOTORCONSTSPEED_
 #ifndef  _SETMOTORCONSTSPEED_EXISTS_
 #define _SETMOTORCONSTSPEED_EXISTS_
 #include <jmkernel.h>

void SetMotorConstSpeed(uint8_t which,int speed)
{
#if 0
	if(speed>100) speed = 100;
	else if(speed<-100) speed = -100;
	Motor_Init();	
	MotorCodingInit();
	MotorPIDTime_Init();
	SetMotorPIDMode(which);//却换为单马达PID模式
	Set_Motor_Pid_Speed(which,speed);
#endif
	Set_Motor_Const_Speed(which,speed);

}
 #endif
#endif


#ifdef _GETMOTORCONSTSPEED_
 #ifndef  _GETMOTORCONSTSPEED_EXISTS_
 #define _GETMOTORCONSTSPEED_EXISTS_
 #include <jmkernel.h>

long GetMotorConstSpeed(uint8_t which)
{
	MotorCodingInit();
	MotorPIDTime_Init();
    return Get_pid_motor_speed(which);

}
 #endif
#endif

#ifdef _SETIOTCONFIG_
 #ifndef  _SETIOTCONFIG_EXISTS_
  #define _SETIOTCONFIG_EXISTS_

uint8_t res_language = 0;
#include "jmdmqtt.h"

void SetIOTConfig(uint8_t which,char * wifiname,char * wifipwd,char * IDname,char * IDpwd,char * IPaddr)
{
    size_t wfifnamelen,wfifpwdlen,IDnamelen,IDpwdlen,IPaddrlen;
	//char  pic[30];
	uint16_t time=0;
	uint8_t i=0;
	uint8_t portx    = which;


	WiFiName = (const char *)wifiname;
	//rcu_arg_check_num(&portx,8);
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	res_language = ReadLangu();
	if(res_language == 1)
		LCD_String(5,5,"IOT模块启动中",0xFFE0,0x0000,0);
	else
		LCD_String(5,5,"IOT Starting",0xFFE0,0x0000,0);
	mqtt_modle_led_state(&iic_typedef,4);//红灯快闪
	Delay1ms(100);
	while(1)
	{
		time++;
		mqtt_modle_send_str(&iic_typedef,"AT\r\n");//用设置命令检测IOT模块是否存在
		Delay1ms(100);
		if(mqtt_modle_read_cmd_state(&iic_typedef)) break;	
		if(time > 50)
		{
			if(res_language == 1)
			{
				LCD_String(5,25,"读取IOT模块失败 请接入IOT模块",0xF800,0x0000,0);
			}
			else
			{
				LCD_String(5,25,"IOT failed,please connect IOT",0xF800,0x0000,0);//太长
			}
		}

	}
	time=0;
	//mp_hal_delay_ms(100);
	//mqtt_modle_send_str(pin3,pin4,"AT+RST\r\n");//使用复位指令复位一下命令
	//mp_hal_delay_ms(500);

	while(1)
	{

		mqtt_modle_send_str(&iic_typedef,"AT+CWMODE=1\r\n");//将WiFi模块设置成STA模式
		Delay1ms(100);
		if(mqtt_modle_read_cmd_state(&iic_typedef)) break;	
		time++;
		if(time > 5)	//重复发5次
			break;
	}

	Delay1ms(200);
	if(res_language == 1)
		LCD_String(5,25,"检测无线网络环境",0xFFE0,0x0000,0);
	else
		LCD_String(5,25,"Detect network",0xFFE0,0x0000,0);
	for(i=0;i<2;i++)
	{
		mqtt_modle_send_str(&iic_typedef,"AT+CWSTATE?\r\n");//检测IOT模块是否连接WIFI成功
		while(1)
		{

			Delay1ms(100);
			if(mqtt_modle_read_wifi_state(&iic_typedef,wifiname)==1) //wifi已连接，并且连接的是目标wifi
			{
				time =0;
				
				break;
			}
			else if(mqtt_modle_read_wifi_state(&iic_typedef,wifiname)==2) //wifi已连接，并且连接的不是目标wifi
			{
				time =1;
				break;
			}
			time++;
			if(time>10)//3s超时退出，重连wifi
			{
				break;
			}
		}
		if(time == 0)
			break;
		else if(time == 1)
			Delay1ms(500);
		if(i == 0)
			time = 0;
	}
			

	if(time !=0)//wifi未连接，需要重新连接
	{
		//mp_hal_delay_ms(200);
		mqtt_modle_send_str(&iic_typedef,"AT+CWQAP\r\n");//断开AP
		while(1)
		{
			Delay1ms(100);
			if(mqtt_modle_read_cmd_state(&iic_typedef)) break;
			time++;
			if(time>50)
			{
				if(res_language == 1)
					LCD_String(5,25,"重连无线网络失败",0xF800,0x0000,0);
				else
					LCD_String(5,25,"Reconnection network failed",0xF800,0x0000,0);
				mqtt_modle_led_state(&iic_typedef,4);//红灯快闪
			}
		}
		//mp_hal_delay_ms(200);
		time = 0;
		mqtt_modle_connect_ap(&iic_typedef,wifiname,wifipwd);
		if(res_language == 1)
			LCD_String(5,25,"正在连接无线网络",0xFFE0,0x0000,0);
		else
			LCD_String(5,25,"Connecting to network",0xFFE0,0x0000,0);
		while(1)
		{
			//mqtt_modle_connect_ap(pin3,pin4,wfifname,wfifpwd);

			if(mqtt_modle_read_cmd_state(&iic_typedef)) break;
			time++;
			if(time>60)
			{
				if(res_language == 1)
					LCD_String(5,25,"连接无线网络失败",0xF800,0x0000,0);
				else
					LCD_String(5,25,"Network connection failed",0xF800,0x0000,0);
				mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
			}
			Delay1ms(100);
		}
		Delay1ms(200);
		if(res_language == 1)
			LCD_String(5,25,"无线网络连接成功",0xFFE0,0x0000,0);
		else
			LCD_String(5,25,"Network connection successful",0xFFE0,0x0000,0);
		mqtt_modle_led_state(&iic_typedef,4);////红灯快闪
		//mp_hal_delay_ms(2000);
	}
	else 
	{
		if(res_language == 1)
			LCD_String(5,25,"无线网络连接成功",0xFFE0,0x0000,0);
		else
			LCD_String(5,25,"Network connection successful",0xFFE0,0x0000,0);
	}

	mqtt_modle_usercfg(&iic_typedef,JmdRand(),IDname,IDpwd);
	if(res_language == 1)
		LCD_String(5,45,"正在配置IOT数据",0xFFE0,0x0000,0);
	else
		LCD_String(5,45,"Configuring IOT data",0xFFE0,0x0000,0);
	time=0;
	while(1)
	{
		//mqtt_modle_usercfg(pin3,pin4,JmdRand(),IDname,IDpwd);
		Delay1ms(100);
		if(mqtt_modle_read_cmd_state(&iic_typedef)) break;
		time++;
		if(time>50)
		{
			if(res_language == 1)
				LCD_String(5,45,"配置IOT数据失败",0xF800,0x0000,0);
			else
				LCD_String(5,45,"Failed to configure IOT",0xF800,0x0000,0);
			mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		}
	}
	Delay1ms(200);
	if(res_language == 1)
		LCD_String(5,45,"配置IOT数据成功",0xFFE0,0x0000,0);
	else
		LCD_String(5,45,"IOT configure successfully",0xFFE0,0x0000,0);
	//mp_hal_delay_ms(2000);
	mqtt_modle_conn(&iic_typedef,IPaddr,1883);
	if(res_language == 1)
		LCD_String(5,65,"正在连接IOT平台",0xFFE0,0x0000,0);
	else
		LCD_String(5,65,"Connecting to the IOT",0xFFE0,0x0000,0);
	time=0;
	while(1)
	{
		
		//mp_hal_delay_ms(100);
		if(mqtt_modle_read_cmd_state(&iic_typedef)) break;
		time++;
		if(time>50)
		{
			if(res_language == 1)
				LCD_String(5,65,"连接IOT平台失败",0xF800,0x0000,0);
			else
				LCD_String(5,65,"Failed connect to the IOT",0xF800,0x0000,0);
			mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		}
		Delay1ms(100);
	}
	Delay1ms(200);
	mqtt_modle_led_state(&iic_typedef,1);//蓝灯常亮
	if(res_language == 1)
	{
		LCD_String(5,65,"连接IOT平台成功",0xFFE0,0x0000,0);
		LCD_String(5,85,"配置完成",0xFFE0,0x0000,0);
	}
	else
	{
		LCD_String(5,65,"Connecting IOT successfully",0xFFE0,0x0000,0);
		LCD_String(5,85,"Configuration complete",0xFFE0,0x0000,0);
	}
	Delay1ms(100);
	LCD_Pant(BLACK);
	IOTConfigFlag = 1;

}

 #endif
#endif

#ifdef _SETIOTTOPIC_
 #ifndef  _SETIOTTOPIC_EXISTS_
  #define _SETIOTTOPIC_EXISTS_

  #include "jmdmqtt.h"
void SetIOTTopic(uint8_t which,char *str)
{
	size_t len;

	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


	
	mqtt_modle_led_state(&iic_typedef,1);//蓝灯常亮
	while(IOTConfigFlag ==0)
	{
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		if(res_language == 1)
		{
			LCD_String(5,280,"IOT模块未启动",0xF800,0x0000,0);
			LCD_String(5,300,"请先初始化模块",0xF800,0x0000,0);
		}
		else
		{
			LCD_String(5,280,"The IOT is not started",0xF800,0x0000,0);
			LCD_String(5,300,"Please initialize the module",0xF800,0x0000,0);
		}

		Delay1ms(100);
		
		//time++;
		//if(time>50)break;
	}
	Delay1ms(100);
	mqtt_modle_sub(&iic_typedef,str,0);
	Delay1ms(20);


}

 #endif
#endif


#ifdef _SETIOTDATA_
 #ifndef  _SETIOTDATA_EXISTS_
  #define _SETIOTDATA_EXISTS_

  #include "jmdmqtt.h"

//发送消息
void SetIOTData(uint8_t which,char *topic,uint32_t data)
{

	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	
	if(connect_time < 40)			//前面3秒不判断是否连接网络
	{
		connect_time++;
	}
	
	if(mqtt_modle_read_connect_state(&iic_typedef) != 6 && connect_time  == 40) //表示断开连接
	{
		connect_flag = 1;
		if(res_language == 1)
			LCD_String(5,150,"请重新打开WiFi,会自动连接WiFi",0xF800,0x0000,0);
		else
		{
			LCD_String(5,150,"Please turn the WiFi back on",0xF800,0x0000,0);
			LCD_String(5,170,"Automatic WiFi connection",0xF800,0x0000,0);
		}
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮

	}
	else
	{
		if(connect_flag == 1)
		{
			connect_flag = 0;
			LCD_Pant(BLACK);
		}
	}
	mqtt_modle_led_state(&iic_typedef,6);//蓝灯快闪

	while(IOTConfigFlag ==0)
	{
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		if(res_language == 1)
		{
			LCD_String(5,280,"IOT模块未启动",0xF800,0x0000,0);
			LCD_String(5,300,"请先初始化模块",0xF800,0x0000,0);
		}
		else
		{
			LCD_String(5,280,"The IOT is not started",0xF800,0x0000,0);
			LCD_String(5,300,"Please initialize the module",0xF800,0x0000,0);
		}
		Delay1ms(100);
	//	time++;
	//	if(time>50)break;
	
	}
	Delay1ms(70);
	mqtt_modle_pub(&iic_typedef,topic,data,0);
	Delay1ms(70);
	mqtt_modle_led_state(&iic_typedef,1);//蓝灯常亮
}


 #endif
#endif

#ifdef _SETIOTDATASTR_
 #ifndef  _SETIOTDATASTR_EXISTS_
  #define _SETIOTDATASTR_EXISTS_

  #include "jmdmqtt.h"

void SetIOTDataStr(uint8_t which,char *topic,char *string)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
	
	if(connect_time < 40)			//前面3秒不判断是否连接网络
	{
		connect_time++;
	}
	
	if(mqtt_modle_read_connect_state(&iic_typedef) != 6 && connect_time  == 40) //表示断开连接
	{
		connect_flag = 1;
		if(res_language == 1)
			LCD_String(5,150,"请重新打开WiFi,会自动连接WiFi",0xF800,0x0000,0);
		else
		{
			LCD_String(5,150,"Please turn the WiFi back on",0xF800,0x0000,0);
			LCD_String(5,170,"Automatic WiFi connection",0xF800,0x0000,0);
		}
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
	}
	else
	{
		if(connect_flag == 1)
		{
			connect_flag = 0;
			LCD_Pant(BLACK);
		}
	}
	mqtt_modle_led_state(&iic_typedef,6);//蓝灯快闪
	while(IOTConfigFlag ==0)
	{
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		if(res_language == 1)
		{
			LCD_String(5,280,"IOT模块未启动",0xF800,0x0000,0);
			LCD_String(5,300,"请先初始化模块",0xF800,0x0000,0);
		}
		else
		{
			LCD_String(5,280,"The IOT is not started",0xF800,0x0000,0);
			LCD_String(5,300,"Please initialize the module",0xF800,0x0000,0);
		}
		Delay1ms(100);
	//	time++;
	//	if(time>50)break;
	}
	Delay1ms(70);
	mqtt_modle_pub_str(&iic_typedef,topic,string,0);
	Delay1ms(70);
	mqtt_modle_led_state(&iic_typedef,1);////蓝灯常亮
}


 #endif
#endif

#ifdef _GETIOTDATA_
 #ifndef  _GETIOTDATA_EXISTS_
  #define _GETIOTDATA_EXISTS_

  #include "jmdmqtt.h"
//获取消息进行对比，一样则返回1
uint8_t GetIOTData(uint8_t which,char *topic,char *str2)
{
	uint8_t res = 0;
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);

	if(connect_time < 40)			//前面3秒不判断是否连接网络
	{
		connect_time++;
	}
	
	if(mqtt_modle_read_connect_state(&iic_typedef) != 6 && connect_time  == 40) //表示断开连接
	{
		connect_flag = 1;
		if(res_language == 1)
			LCD_String(5,150,"请重新打开WiFi,会自动连接WiFi",0xF800,0x0000,0);
		else
		{
			LCD_String(5,150,"Please turn the WiFi back on",0xF800,0x0000,0);
			LCD_String(5,170,"Automatic WiFi connection",0xF800,0x0000,0);
		}
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		return res;
	}
	else
	{
		if(connect_flag == 1)
		{
			connect_flag = 0;
			LCD_Pant(BLACK);
		}
	}
	//mqtt_modle_led_state(pin3,pin4,1);////蓝灯常亮
	//  LCD_DisplayNum(10,10,str2[0], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,30,str2[1], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,50,str2[2], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,70,str2[3], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,90,str2[4], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,110,str2[5], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,130,str2[6], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,150,str2[7], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,170,str2[8], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,190,str2[9], 44, 0xffff,0x8088); 
	//  LCD_DisplayNum(10,300,len2, 44, 0xffff,0x8088);
	
//	char  string[30];
	//uint8_t data[50];
	//uint8_t i,s=0,sum,check=0;
	//LCD_Pant(BLACK);
	//mp_hal_delay_ms(100);
	while(IOTConfigFlag ==0)
	{
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		if(res_language == 1)
		{
			LCD_String(5,280,"IOT模块未启动",0xF800,0x0000,0);
			LCD_String(5,300,"请先初始化模块",0xF800,0x0000,0);
		}
		else
		{
			LCD_String(5,280,"The IOT is not started",0xF800,0x0000,0);
			LCD_String(5,300,"Please initialize the module",0xF800,0x0000,0);
		}
		Delay1ms(100);
	//	time++;
	//	if(time>50)break;
		
	}

	if((res = mqtt_modle_read_compare(&iic_typedef,topic,str2)) != 0)
	{
		mqtt_modle_led_state(&iic_typedef,6);////蓝灯快闪
	}
	else
	{
		mqtt_modle_led_state(&iic_typedef,1);////蓝灯常亮
	}
	Delay1ms(50);

	return res;

}

 #endif
#endif

#ifdef _GETIOTDATASTR_
 #ifndef  _GETIOTDATASTR_EXISTS_
  #define _GETIOTDATASTR_EXISTS_

  #include "jmdmqtt.h"
//获取消息进行对比，一样则返回1
//char *GetIOTDataStr(uint8_t which,char *topic,char *)
void GetIOTDataStr(uint8_t which,char *topic,const char *iot_str)
{
	uint8_t res = 0;
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);

	//char temp[64] = {0};
	memset(iot_str,0,sizeof(iot_str));		//清除数据

	if(connect_time < 40)			//前面3秒不判断是否连接网络
	{
		connect_time++;
	}
	
	if(mqtt_modle_read_connect_state(&iic_typedef) != 6 && connect_time  == 40) //表示断开连接
	{
		connect_flag = 1;
		if(res_language == 1)
			LCD_String(5,150,"请重新打开WiFi,会自动连接WiFi",0xF800,0x0000,0);
		else
		{
			LCD_String(5,150,"Please turn the WiFi back on",0xF800,0x0000,0);
			LCD_String(5,170,"Automatic WiFi connection",0xF800,0x0000,0);
		}
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		//return ;
		#if 0
		if(res_language == 1)
			return mp_obj_new_str("等待重连",strlen("等待重连"));
		else
			return mp_obj_new_str("Wait for reconnection",strlen("Wait for reconnection"));
		#endif
	}
	else
	{
		if(connect_flag == 1)
		{
			connect_flag = 0;
			LCD_Pant(BLACK);
		}
	}
	//mqtt_modle_led_state(pin3,pin4,1);////蓝灯常亮

	//mp_hal_delay_ms(100);
	while(IOTConfigFlag ==0)
	{
		mqtt_modle_led_state(&iic_typedef,2);//红灯常亮
		if(res_language == 1)
		{
			LCD_String(5,280,"IOT模块未启动",0xF800,0x0000,0);
			LCD_String(5,300,"请先初始化模块",0xF800,0x0000,0);
		}
		else
		{
			LCD_String(5,280,"The IOT is not started",0xF800,0x0000,0);
			LCD_String(5,300,"Please initialize the module",0xF800,0x0000,0);
		}
		Delay1ms(100);
	//	time++;
	//	if(time>50)break;
	}
	//const char *recv_str = (const char *)mqtt_modle_read_data(&iic_typedef,topic);
	// temp = (char *)mqtt_modle_read_data(&iic_typedef,topic);
	// temp = iot_str;
	res = mqtt_modle_read_data(&iic_typedef,topic,iot_str);
	//LCD_DisplayNum(5, 100,buf_len, 0xF800, 0x000,0x8088); 
	if(res != 0)
	{
		mqtt_modle_led_state(&iic_typedef,6);////蓝灯闪烁
	}
	else
	{
		mqtt_modle_led_state(&iic_typedef,1);////蓝灯常亮
		//iot_str = '0';
	}
	Delay1ms(100);
	//LCD_String(5,140,(char *)temp,0xF800,0x0000,0);
	return ;
	//return recv_str;

}

 #endif
#endif

#ifdef _GETTRACEV2I2CCHXSTATE_
 #ifndef _GETTRACEV2I2CCHXSTATE_EXISTS_
  #define _GETTRACEV2I2CCHXSTATE_EXISTS_

  #include "I2C_Soft.h"
  #include "jmkernel.h"
uint8_t GetTraceV2I2CChxState( uint8_t which, uint8_t state)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t data;
   //OS_ENTER_CRITICAL();

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,9);
    Soft_I2C_Stop(&iic_typedef);
    
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x19);
    data=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);


	switch (state)
	{
		case 1: {if((data & 0x41 )== 0x41) data = 1;else data = 0; }break;//01000001
		case 2: {if((data & 0x01 )== 0x01) data = 1;else data = 0; }break;//00000001
		case 3: {if((data & 0x40 )== 0x40) data = 1;else data = 0; }break;//01000000
		case 4: {if((data & 0x1C )== 0x1C) data = 1;else data = 0; }break;//00011100
		case 5: {if((data & 0x01 )== 0x01) data = 1;else data = 0; }break;//00000001
		case 6: {if((data & 0x02 )== 0x02) data = 1;else data = 0; }break;//00000010
		case 7: {if((data & 0x04 )== 0x04) data = 1;else data = 0; }break;//00000100
		case 8: {if((data & 0x08 )== 0x08) data = 1;else data = 0; }break;//00001000
		case 9: {if((data & 0x10 )== 0x10) data = 1;else data = 0; }break;//00010000
		case 10: {if((data & 0x20 )== 0x20) data = 1;else data = 0; }break;//00100000
		case 11: {if((data & 0x40 )== 0x40) data = 1;else data = 0; }break;//01000000
		
		default:
			break;
	}
	if(TraceLineColor[which-1] != 0)
		data = (!data);
	return data;
}

 #endif
#endif

#ifdef _SETTRACEV2I2ALLCOLOR_
 #ifndef _SETTRACEV2I2ALLCOLOR_EXISTS_
  #define _SETTRACEV2I2ALLCOLOR_EXISTS_

  #include "I2C_Soft.h"
void SetTraceV2I2AllColor( uint8_t which, uint8_t color)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t i;
	uint8_t ch[7] = {0};
   //OS_ENTER_CRITICAL();

   	// input  1-7  R G B Y P C W
	// change 1-7  B G C R P Y W
	//重排颜色
	if(color==1) color= 4;
	else if(color==3) color= 1;
	else if(color==4) color= 6;
	else if(color==6)color= 3;
	for ( i = 0; i < 7; i++) ch[i] = color;

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,70);
	for(i=0;i<7;i++)
    {
    	Soft_I2C_Write(&iic_typedef,ch[i]);
    }

	Soft_I2C_Stop(&iic_typedef);

	return ;
}

 #endif
#endif

#ifdef _SETTRACEV2I2COLOR_
 #ifndef _SETTRACEV2I2COLOR_EXISTS_
  #define _SETTRACEV2I2COLOR_EXISTS_

  #include "I2C_Soft.h"
void SetTraceV2I2Color( uint8_t which, uint8_t ch1,uint8_t ch2,uint8_t ch3,uint8_t ch4,uint8_t ch5,uint8_t ch6,uint8_t ch7)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t i;
	uint8_t ch[7] = {ch1,ch2,ch3,ch4,ch5,ch6,ch7};
   //OS_ENTER_CRITICAL();

	// input  1-7  R G B Y P C W
	// change 1-7  B G C R P Y W
	//重排颜色
	for ( i = 0; i < 7; i++)
	{
		if(ch[i]==1) ch[i]= 4;
		else if(ch[i]==3) ch[i]= 1;
		else if(ch[i]==4) ch[i]= 6;
		else if(ch[i]==6) ch[i]= 3;
		
	}

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,70);
	for(i=0;i<7;i++)
    {
    	Soft_I2C_Write(&iic_typedef,ch[i]);
    }

	Soft_I2C_Stop(&iic_typedef);

	return ;
}

 #endif
#endif

#ifdef _SETTRACEV2I2THRESHOLD_
 #ifndef _SETTRACEV2I2THRESHOLD_EXISTS_
  #define _SETTRACEV2I2THRESHOLD_EXISTS_

  #include "I2C_Soft.h"
  #include "jmkernel.h"
 //command:
// TRACE_COLOR_CMD=51u,//LED状态
// TRACE_BEEP_CMD=52u,//蜂鸣器
// TRACE_PER_CMD=55u,//比例值
// TRACE_SCAN_CMD=58u,//设置扫描模式
// TRACE_STOP_CMD=59u,//结束扫描模式
// TRACE_LED1_CMD=81u,//1通道LED状态
static void Set_TraceV2I2C(uint8_t which,uint8_t cmomand ,uint8_t param1,uint8_t param2)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   	uint8_t paramlist[2],i,size=1,n=0,nsize=0,data=0;
	paramlist[0] = param1;
	paramlist[1] = param2;
    switch(cmomand)
    {
		case 51:size=7;nsize=0;	break;
		case 52:size=1;	nsize=0;	break;
		case 55:size=2;	nsize=1;	break;
		case 58:size=1;	nsize=0;	break;
		case 59:size=1;	nsize=0;	break;
    }

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,cmomand);
	for(i=0,n=0;i<size;i++)
    {
    	Soft_I2C_Write(&iic_typedef,paramlist[n]);
    	if(n<nsize)n++;
    }
	Soft_I2C_Stop(&iic_typedef);

}


void SetTraceV2I2Threshold( uint8_t which, uint16_t time)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   	uint8_t paramlist[2],i,size=1,n=0,nsize=0,data=0;
	time = time*100;	
	// uint8_t cmomand = 58;
	// paramlist[0] = 0;
	// paramlist[1] = 0;
    // switch(cmomand)
    // {
	// 	case 51:size=7;nsize=0;	break;
	// 	case 52:size=1;	nsize=0;	break;
	// 	case 55:size=2;	nsize=1;	break;
	// 	case 58:size=1;	nsize=0;	break;
	// 	case 59:size=1;	nsize=0;	break;
    // }
	TraceThresholdState = which;
	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);

	Set_TraceV2I2C(which,58,0,0);
    // Soft_I2C_Start(&iic_typedef);
    // Soft_I2C_Write(&iic_typedef,0x18);
    // Soft_I2C_Write(&iic_typedef,cmomand);
	// for(i=0,n=0;i<size;i++)
    // {
    // 	Soft_I2C_Write(&iic_typedef,paramlist[n]);
    // 	if(n<nsize)n++;
    // }
	// Soft_I2C_Stop(&iic_typedef);

	while(time>0)
	{
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,0x18);
		Soft_I2C_Write(&iic_typedef,9);
		Soft_I2C_Stop(&iic_typedef);
		
		Soft_I2C_Start(&iic_typedef);
		Soft_I2C_Write(&iic_typedef,0x19);
		data=Soft_I2C_Read(&iic_typedef,1);
		Soft_I2C_Stop(&iic_typedef);
		time --;
		Delay1ms(10);
	}
	Set_TraceV2I2C(which,59,0,0);
	TraceThresholdState = 0;
	return ;
}

 #endif
#endif

#ifdef _SETTRACEV2I2CLINECOLOR_
 #ifndef _SETTRACEV2I2CLINECOLOR_EXISTS_
  #define _SETTRACEV2I2CLINECOLOR_EXISTS_

  #include "I2C_Soft.h"
  #include "jmkernel.h"
void SetTraceV2I2CLineColor( uint8_t which, uint8_t color)
{



	Set_TraceV2I2CLineColor(which,color);

	return ;
}

 #endif
#endif

//==SetMagneticServoPowerDown Readding ID:  == DON'T DELETE!! == 输出BE-9520 伺服马达通用设置命令
#ifdef _SETMAGNETICSERVOSOFTRESET_
#ifndef  _SETMAGNETICSERVOSOFTRESET_EXISTS_
#define _SETMAGNETICSERVOSOFTRESET_EXISTS_
#include "I2C_Soft.h"

//舵机复位
void SetMagneticServoSoftReset(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];


	uint8_t i2c_addr_w = 0xA0;
	uint8_t id=0x01;
	uint8_t check_sum=0x00;
	uint8_t cmd = 0xFF;
	uint16_t data1 = (0xAF << 8) | 0xFA;
	uint16_t data2 = (0xAF << 8) | 0xFA;

	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		          port1,bit1,//SCL
		          &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,i2c_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,data1/256); //d1h
	check_sum+=(data1/256);

	Soft_I2C_Write(&iic_typedef,data1%256); //d1l
	check_sum+=(data1%256);

	Soft_I2C_Write(&iic_typedef,data2/256); //d2h
	check_sum+=(data2/256);

	Soft_I2C_Write(&iic_typedef,data2%256); //d2l
	check_sum+=(data2%256);

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

 
}
 #endif
#endif

//==SetMagneticServoPowerDown Readding ID:  == DON'T DELETE!! == 输出BE-9520 伺服马达通用设置命令
#ifdef _SETMAGNETICSERVOSTATE_
#ifndef  _SETMAGNETICSERVOSTATE_EXISTS_
#define _SETMAGNETICSERVOSTATE_EXISTS_
#include "I2C_Soft.h"

//舵机状态设置
void SetMagneticServoState(uint8_t which,uint8_t reset,uint8_t speed,uint16_t degree)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t i2c_addr_w = 0xA0;
	uint8_t id=0x01;
	uint8_t check_sum=0x00;
	uint8_t cmd = 0x0D;
	if(speed > 100)
		speed = 100;
	else if(speed <=0)
		speed = 0;
	if(degree > 360)
		degree = 360;
	else if(degree <=0)
		degree = 0;
	uint16_t data1 = (reset << 8) | speed;
	uint16_t data2 = degree;


	RcuWhichMutexTake(which,1,999);//获取端口IIC使用权
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		          port1,bit1,//SCL
		          &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k

	//发射指令
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,i2c_addr_w);

	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,0xfe);
	
	Soft_I2C_Write(&iic_typedef,id);//命令,发射数据
	check_sum+=id;
	
	Soft_I2C_Write(&iic_typedef,cmd); 
	check_sum+=cmd;

	Soft_I2C_Write(&iic_typedef,data1/256); //d1h
	check_sum+=(data1/256);

	Soft_I2C_Write(&iic_typedef,data1%256); //d1l
	check_sum+=(data1%256);

	Soft_I2C_Write(&iic_typedef,data2/256); //d2h
	check_sum+=(data2/256);

	Soft_I2C_Write(&iic_typedef,data2%256); //d2l
	check_sum+=(data2%256);

	Soft_I2C_Write(&iic_typedef,check_sum); 
	Soft_I2C_Stop(&iic_typedef);

	delay_iic=IIC_SPEED_DEFAULT;//恢复默认速度
	RcuWhichMutexGive(which,1,999);//释放IIC端口使用权

 
}
 #endif
#endif

#ifdef _LINESETCHASSIS_
#ifndef  _LINESETCHASSIS_EXISTS_
#define _LINESETCHASSIS_EXISTS_
	#include "jmdtrace.h"
	void LineSetChassis(uint8_t p1,uint8_t p2,char * dir)
	{
		trace_Line_Set_Chassis(p1,p2,(char *)dir);
	}
 #endif
#endif


#ifdef _LINESETPROPORTIO_
#ifndef  _LINESETPROPORTIO_EXISTS_
#define _LINESETPROPORTIO_EXISTS_
	#include "jmdtrace.h"
	void LineSetProportio(uint8_t power)
	{
		trace_Line_Set_Proportio(power);
	}
 #endif
#endif

#ifdef _LINESETINITIALIZEFORLIGHT_
#ifndef  _LINESETINITIALIZEFORLIGHT_EXISTS_
#define _LINESETINITIALIZEFORLIGHT_EXISTS_
	#include "jmdtrace.h"
	void LineSetInitializeForLight(uint8_t p1,uint8_t p2,uint8_t p3,uint8_t p4,uint8_t p5,char * temp_color,char * temp_chassis)
	{
		trace_Line_Set_Initialize_For_Light(p1,p2,p3,p4,p5,(char *)temp_color,(char *)temp_chassis);
	}
 #endif
#endif

#ifdef _LINESETINITIALIZE_
#ifndef  _LINESETINITIALIZE_EXISTS_
#define _LINESETINITIALIZE_EXISTS_
	#include "jmdtrace.h"
	void LineSetInitialize(uint8_t which,char * temp_color,char * temp_chassis)
	{
		trace_Line_Set_Initialize(which,temp_color,temp_chassis);
	}
 #endif
#endif

#ifdef _LINESPEEDCONTROL_
#ifndef  _LINESPEEDCONTROL_EXISTS_
#define _LINESPEEDCONTROL_EXISTS_
	#include "jmdtrace.h"
	void LineSpeedControl(int32_t speedl,int32_t speedr)
	{
		trace_Line_Speed_Control(speedl,speedr);
	}
 #endif
#endif

#ifdef _LINEINTERSECTIONSTOP_
#ifndef  _LINEINTERSECTIONSTOP_EXISTS_
#define _LINEINTERSECTIONSTOP_EXISTS_
	#include "jmdtrace.h"
	void LineIntersectionStop(int32_t speedu,int32_t which)
	{
		trace_Line_Intersection_Stop(speedu,which);
	}
 #endif
#endif

#ifdef _LINEBASIS_
#ifndef  _LINEBASIS_EXISTS_
#define _LINEBASIS_EXISTS_
	#include "jmdtrace.h"
	void LineBasis(int8_t speedup)
	{
		trace_Line_Basis(speedup);
	}
 #endif
#endif

#ifdef _LINEMILLISECOND_
#ifndef  _LINEMILLISECOND_EXISTS_
#define _LINEMILLISECOND_EXISTS_
	#include "jmdtrace.h"
	void LineMillisecond(int8_t speed, int32_t time)
	{
		trace_Line_Millisecond(speed,time);
	}
 #endif
#endif

#ifdef _LINEGETSTATE_
#ifndef  _LINEGETSTATE_EXISTS_
#define _LINEGETSTATE_EXISTS_
	#include "jmdtrace.h"
	void LineGetState()
	{
		trace_Line_Get_State();
	}
 #endif
#endif


#ifdef _LINETURNENCOUNTERLINE_
#ifndef  _LINETURNENCOUNTERLINE_EXISTS_
#define _LINETURNENCOUNTERLINE_EXISTS_
	#include "jmdtrace.h"
	void LineTurnEncounterline(int32_t spl,int32_t spr,int32_t whi)
	{
		trace_Line_Turn_Encounterline(spl,spr,whi);
	}
 #endif
#endif

#ifdef _LINEFORBMP_
#ifndef  _LINEFORBMP_EXISTS_
#define _LINEFORBMP_EXISTS_
	#include "jmdtrace.h"
	void LineForBmp(int32_t sp0,int32_t bmp)
	{
		trace_Line_For_Bmp(sp0,bmp);
	}
 #endif
#endif





#ifdef _SETMOVEINITIALIZE_
 #ifndef _SETMOVEINITIALIZE_EXISTS_
 #define _SETMOVEINITIALIZE_EXISTS_
   	#include "jmkernel.h"
void SetMoveInitialize(uint8_t Left,uint8_t Right,char *Vector)
{
    move_left_port = Left;
    move_right_port = Right;
    if(strcmp(Vector,"left_reversal") == 0)
    {
        Change_Motor_Dir(move_left_port,1);
        Change_Motor_Dir(move_right_port,0);
    } 
    else if (strcmp(Vector,"right_reversal") == 0)
    {
        Change_Motor_Dir(move_left_port,0);
        Change_Motor_Dir(move_right_port,1);
    }
    else if(strcmp(Vector,"all_reversal") == 0)
    {
        Change_Motor_Dir(move_left_port,1);
        Change_Motor_Dir(move_right_port,1);
    }
    else
    {
        Change_Motor_Dir(move_left_port,0);
        Change_Motor_Dir(move_right_port,0);
    }

    
}
 #endif
#endif

#ifdef _SETMOVERUNSECOND_
 #ifndef _SETMOVERUNSECOND_EXISTS_
 #define _SETMOVERUNSECOND_EXISTS_
   	#include "jmkernel.h"
void SetMoveRunSecond(char *direction,int32_t speed,double time)
{
    if (strcmp(direction,"forward") == 0){
        Move_Speed(speed,speed);
    } else {
        if((strcmp(direction,"backward") == 0))
        {
            Move_Speed((-1 * speed),(-1 * speed));
        } else {
            if (strcmp(direction,"turnleft") == 0){
                // move_speed(speed,(-1 * speed));
                Move_Speed((-1 * speed),speed);
            } else {
                if (strcmp(direction,"turnright") == 0){
                    // move_speed((-1 * speed),speed);
                    Move_Speed(speed,(-1 * speed));
                }
            }
        }
    }
    Delay1ms(time*1000);
    Move_Speed(0,0);
}
 #endif
#endif

#ifdef _SETMOVESPEEDSECOND_
 #ifndef _SETMOVESPEEDSECOND_EXISTS_
 #define _SETMOVESPEEDSECOND_EXISTS_
   	#include "jmkernel.h"
void SetMoveSpeedSecond(int32_t speedl,int32_t speedr,double time)
{
    Move_Speed(speedl,speedr);
    Delay1ms(time*1000);
    Move_Speed(0,0);
}
 #endif
#endif

#ifdef _SETMOVERUNANGLE_
 #ifndef _SETMOVERUNANGLE_EXISTS_
 #define _SETMOVERUNANGLE_EXISTS_
   	#include "jmkernel.h"
void SetMoveRunAngle(char * direction,int32_t speed,double angle)
{
    if (strcmp(direction,"forward") == 0){
        Move_Speed(speed,speed);
    } else {
        if((strcmp(direction,"backward") == 0))
        {
            Move_Speed((-1 * speed),(-1 * speed));
        } else {
            if (strcmp(direction,"turnleft") == 0){
                // move_speed(speed,(-1 * speed));
                Move_Speed((-1 * speed),speed);
            } else {
                if (strcmp(direction,"turnright") == 0){
                    // move_speed((-1 * speed),speed);
                    Move_Speed(speed,(-1 * speed));
                }
            }
        }
    }
    move_temporaryVar = Get_Motor_Code(move_left_port);
    while (!(abs((Get_Motor_Code(move_left_port) - move_temporaryVar)) > abs(angle)));
    Move_Speed(0,0);
}
 #endif
#endif


#ifdef _SETMOVERUN_
 #ifndef _SETMOVERUN_EXISTS_
 #define _SETMOVERUN_EXISTS_
  	#include "jmkernel.h"
void SetMoveRun(char * direction,int32_t speed)
{
    if (strcmp(direction,"forward") == 0){
        Move_Speed(speed,speed);
    } else {
        if((strcmp(direction,"backward") == 0)){
            Move_Speed(-speed,-speed);
        } else {
            if (strcmp(direction,"turnleft") == 0){
                // move_speed(speed,(-1 * speed));
                Move_Speed((-1 * speed),speed);
            } else {
                if (strcmp(direction,"turnright") == 0){
                    // move_speed((-1 * speed),speed);
                    Move_Speed(speed,(-1 * speed));
                }
            }
        }
    }
}
 #endif
#endif


#ifdef _SETMOVESPEED_
 #ifndef _SETMOVESPEED_EXISTS_
 #define _SETMOVESPEED_EXISTS_
 	#include "jmkernel.h"
	void SetMoveSpeed(int32_t speedl,int32_t speedr)
	{
		Move_Speed(speedl,speedr);
	}
 #endif
#endif

#ifdef _SETMOVESTOP_
 #ifndef _SETMOVESTOP_EXISTS_
 #define _SETMOVESTOP_EXISTS_
 	#include "jmkernel.h"
	void SetMoveStop(void)
	{
		Move_Stop();
	}
 #endif
#endif

#ifdef _SETMOVEPOWER_
 #ifndef _SETMOVEPOWER_EXISTS_
 #define _SETMOVEPOWER_EXISTS_
 	#include "jmkernel.h"
	void SetMovePower(int32_t speedl,int32_t speedr)
	{
		Move_Power(speedl,speedr);
	}
 #endif
#endif




#ifdef _SETMOTORSECOND_
 #ifndef _SETMOTORSECOND_EXISTS_
 #define _SETMOTORSECOND_EXISTS_
 #include "jmkernel.h"
	void SetMotorSecond(uint8_t port,int32_t speed,double time)
	{
		Set_Motor_X(port,speed);
		Delay1ms(time*1000);
		Set_Motor_X(port,0);
	}
 #endif
#endif


#ifdef _SETMOTORANGLEDELAY_
 #ifndef _SETMOTORANGLEDELAY_EXISTS_
  #define _SETMOTORANGLEDELAY_EXISTS_
  #include <jmkernel.h>

void SetMotorAngleDelay(uint8_t which,int speed,int32_t Angle)
{
	Set_Wait_For_Angle(which,speed,Angle);
}
 #endif
#endif

#ifdef _RUN_
 #ifndef _RUN_EXISTS_
  #define _RUN_EXISTS_
  #include <jmkernel.h>

void Run(uint8_t which,int32_t speed)
{
	Set_Motor_X(which,speed);
}
 #endif
#endif


#ifdef _SETMOTORSTOP_
 #ifndef _SETMOTORSTOP_EXISTS_
  #define _SETMOTORSTOP_EXISTS_
  #include <jmkernel.h>

void SetMotorStop(uint8_t which)
{
	Set_Motor_X(which,0);
}
 #endif
#endif

#ifdef _SETMOTORANGLE_
 #ifndef  _SETMOTORANGLE_EXISTS_
  #define _SETMOTORANGLE_EXISTS_
  #include <jmkernel.h>

void SetMotorAngle(uint8_t which,int speed,uint32_t Angle)
{
	Angle=abs(Angle);
	if(speed > 100)
		speed = 100;
	else if(speed < -100)
		speed = -100;
	Motor_Init();
	MotorCodingInit();
	SetMotorServoMode(which);
	SetCodeServoAngle(which,speed,Angle);
}
 #endif
#endif


#ifdef _SETMOTORCONSTCODE_
 #ifndef _SETMOTORCONSTCODE_EXISTS_
  #define _SETMOTORCONSTCODE_EXISTS_
  #include <jmkernel.h>

void SetMotorConstCode(uint8_t which,int s_code)
{
	Velocity_Motor[which-1] = s_code;
}
 #endif
#endif


#ifdef _SETRUNANGLE_
 #ifndef _SETRUNANGLE_EXISTS_
  #define _SETRUNANGLE_EXISTS_
  #include <jmkernel.h>

void SetRunAngle(uint8_t which,int speed,int32_t Angle)
{
	Set_For_Angle(which,speed,Angle);
}
 #endif
#endif



#ifdef _DISPLAYSHOWIMAGE_
 #ifndef  _DISPLAYSHOWIMAGE_EXISTS_
  #define _DISPLAYSHOWIMAGE_EXISTS_

// #define display_show_image(name,A) display_show_image_time(name, (A == 0.0 ? 0.0 : A)) /*用于实现默认参数的宏*/
#include <jmkernel.h>
#include "LCD320240.h"
int DisplayShowImage(const char* filename,//图片文件的名称(字符串类型),名称不能有中文，图片名称不能超过8个字节,后缀不能超过3个字节
		            	 	 	float time)//图片的显示时间
{
	int res=0;
	//return LCD_DisplayPicture(x,y,filename,scale);
	while(ReadDisplayPictureFlag());//等待上一次显示完毕
	os_task_enter_critical();
	SetDisplayPictureFlag(1);//显示这一次的图片
	StartDisplayPicture(0,0,filename,0);
	os_task_exit_critical();
	while(ReadDisplayPictureFlag());//等待显示完毕
	res=ReadDisplayPictureState();//返回显示状态
	if(time != 0)
	{
		Delay1ms(time*1000);
		LCD_Pant(0x0000);
	}
	return res;

}
#endif
#endif


#ifdef _SOUNDMP3_
 #ifndef  _SOUNDMP3_EXISTS_
  #define _SOUNDMP3_EXISTS_
	#include "mp3lib.h"
void SoundMp3(uint16_t folder,uint16_t mp3num,float time)
{
	uint8_t volume=0;
	volume = MP3_GetSound();	
	MP3_SetSound(volume);
	Delay1ms(20);
	MP3_PlaySong(0X05,((folder&0XFF)<<8)|((mp3num&0XFF)));
	Delay1ms(time*1000);
	MP3_PlaySong(0x02,0x0000);
}	
 #endif
#endif

#ifdef _SOUNDSTARTBEEP_
 #ifndef  _SOUNDSTARTBEEP_EXISTS_
  #define _SOUNDSTARTBEEP_EXISTS_
	#include "jmkernel.h"
void SoundStartBeep(uint16_t folder)
{
	uint8_t volume=0;
	Beep_Play_Music(folder+2);
}	
 #endif
#endif

#ifdef _BLUETOOTHSETNAME_
 #ifndef  _BLUETOOTHSETNAME_EXISTS_
  #define _BLUETOOTHSETNAME_EXISTS_
	#include "jdy16.h"
	#include "LCD320240.h"
void BluetoothSetName(char *name)
{
	size_t len = strlen(name);
	BlueTH_Init(115200); 
	// RockerDelayTimInit();
	if(len<26)	//蓝牙名称小于26
	{
		JDY16_Rename(name);
		// LCD_DisplayNum(0, 0,(int32_t)len, 0xFFFF, 0x0000,0x8088); 
	}
}	
 #endif
#endif

#ifdef _BLUETOOTHGETNAME_
 #ifndef  _BLUETOOTHGETNAME_EXISTS_
  #define _BLUETOOTHGETNAME_EXISTS_
	#include "jdy16.h"
char * BluetoothGetName()
{
	BlueTH_Init(115200); 
	JDY16_GetName();
	return (char *)BTName;

}	
 #endif
#endif

#ifdef _BLUETOOTHCONNECT_
 #ifndef  _BLUETOOTHCONNECT_EXISTS_
  #define _BLUETOOTHCONNECT_EXISTS_
	#include "jdy16.h"
void BluetoothConnect(const char *name)
{
	BlueTH_Init(115200); 
	RockerDelayTimInit();
	JDY16_Broadcast(1);		//开广播
	JDY16_SelectMode(1);	//开主机
	JDY16_MasterNameConnect(name);
}	
 #endif
#endif

#ifdef _BLUETOOTHWAITCONNECT_
 #ifndef  _BLUETOOTHWAITCONNECT_EXISTS_
  #define _BLUETOOTHWAITCONNECT_EXISTS_
	#include "jdy16.h"
void BluetoothWaitConnect()
{
	BlueTH_Init(115200); 
	RockerDelayTimInit();
	//从模式等待连接
	JDY16_Broadcast(1);		//开广播
	JDY16_SelectMode(0);
	
}	
 #endif
#endif

#ifdef _BLUETOOTHSETMODE_
 #ifndef  _BLUETOOTHSETMODE_EXISTS_
  #define _BLUETOOTHSETMODE_EXISTS_
	#include "jdy16.h"
void BluetoothSetMode(uint8_t state)
{
	BlueTH_Init(115200); 
	RockerDelayTimInit();
	//从模式等待连接
	JDY16_Broadcast(1);		//开广播
	JDY16_SelectMode(state);
	
}	
 #endif
#endif

#ifdef  _SETTRACEV2THRESHOLD_
 #ifndef _SETTRACEV2THRESHOLD_EXISTS_
  #define _SETTRACEV2THRESHOLD_EXISTS_

  #include "I2C_Soft.h"
  #include "jmkernel.h"
void SetTraceV2Threshold(uint8_t which,uint8_t pass, uint8_t thr)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
   //OS_ENTER_CRITICAL();
	RcuWhichMutexTake(which,1,999);//??è????úIICê1ó?è¨
   Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,72);
    Soft_I2C_Write(&iic_typedef,pass);
    Soft_I2C_Write(&iic_typedef,thr);
    Soft_I2C_Stop(&iic_typedef);
		RcuWhichMutexGive(which,1,999);//êí??IIC???úê1ó?è¨
	Delay1ms(3);
		//OS_EXIT_CRITICAL();
}
  #endif
#endif

#ifdef _SETBEMSTATE_
 #ifndef  _SETBEMSTATE_EXISTS_
  #define _SETBEMSTATE_EXISTS_
	#include "I2C_Soft.h"
void SetBEMState(uint8_t state,uint8_t CMD)
{
	uint32_t port1=portarray[RcuPORT[state][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[state][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[state][0];
	uint8_t bit2=RcuPIN[state][1];

	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		          port1,bit1,//SCL
		          &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0x8A);
	Soft_I2C_Write(&iic_typedef,0xDC);//写LED命令
	Soft_I2C_Write(&iic_typedef,CMD);
	Soft_I2C_Stop(&iic_typedef);

}	
 #endif
#endif

#ifdef _SETELECTROMAGNET_
 #ifndef  _SETELECTROMAGNET_EXISTS_
  #define _SETELECTROMAGNET_EXISTS_
	#include "I2C_Soft.h"
void SetElectromagnet(uint8_t state,uint8_t CMD)
{
	uint32_t port1=portarray[RcuPORT[state][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[state][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[state][0];
	uint8_t bit2=RcuPIN[state][1];

	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
		          port1,bit1,//SCL
		          &iic_typedef);
	
	delay_iic=IIC_SPEED_100K;//20->100k 34->70k 30->78k
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0x40);
	Soft_I2C_Write(&iic_typedef,0xDC);//写LED命令
	Soft_I2C_Write(&iic_typedef,CMD);
	Soft_I2C_Stop(&iic_typedef);

}	
 #endif
#endif

#ifdef _SETNFC_
 #ifndef  _SETNFC_EXISTS_
  #define _SETNFC_EXISTS_
  
  #include <jmkernel.h>
  #include "I2C_Soft.h"

void SetNFC(uint8_t which)
{
    uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
    uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
    uint8_t bit1=RcuPIN[which][0];
    uint8_t bit2=RcuPIN[which][1];
    uint8_t m_AhrsRecBufList[14];
    uint8_t i;
    uint8_t ACK=0;
    uint8_t F;

    RcuWhichMutexTake(which,1,999);
    Soft_I2C_Typedef iic_typedef;
    Soft_I2C_BspInit(port2,bit2,//SDA
                        port1,bit1,//SCL
                        &iic_typedef);
    if(Encryption_Num == 255)
    {
        Soft_I2C_Start(&iic_typedef);
        Soft_I2C_Write(&iic_typedef,0x3a);//addr
        Soft_I2C_Write(&iic_typedef,0x85);
        Soft_I2C_Write(&iic_typedef,Encryption_Num);
        Soft_I2C_Write(&iic_typedef,nfc_data[0]); 
        Soft_I2C_Write(&iic_typedef,nfc_data[1]);
        Soft_I2C_Write(&iic_typedef,nfc_data[2]);
        Soft_I2C_Write(&iic_typedef,nfc_data[3]);
        Soft_I2C_Write(&iic_typedef,nfc_data[4]);
        Soft_I2C_Write(&iic_typedef,nfc_data[5]);
        Soft_I2C_Write(&iic_typedef,nfc_data[6]);
        Soft_I2C_Write(&iic_typedef,nfc_data[7]);
        Soft_I2C_Write(&iic_typedef,nfc_data[8]);
        Soft_I2C_Write(&iic_typedef,nfc_data[9]);
        Soft_I2C_Write(&iic_typedef,nfc_data[10]);
        Soft_I2C_Write(&iic_typedef,nfc_data[11]);
        Soft_I2C_Write(&iic_typedef,0xCF);		
        Soft_I2C_Stop(&iic_typedef);

        Delay1ms(200);

        Soft_I2C_Start(&iic_typedef);
        Soft_I2C_Write(&iic_typedef,0x3b);//addr
        for(i=0;i<14;i++)
        {
        if(i==13) ACK =1;
        else  ACK = 0;
        m_AhrsRecBufList[i]=Soft_I2C_Read(&iic_typedef,ACK);  
        }  
        Soft_I2C_Stop(&iic_typedef);
        Encryption_Num = m_AhrsRecBufList[1];
    }
    F = random_64bytes[(Encryption_Num+11)%64];

        Soft_I2C_Start(&iic_typedef);
        Soft_I2C_Write(&iic_typedef,0x3a);//addr
    
        Soft_I2C_Write(&iic_typedef,0x91);
        Soft_I2C_Write(&iic_typedef,Encryption_Num);

    for(int k = 0; k<12; k++)
    {
        Soft_I2C_Write(&iic_typedef,SetEncryptorByte1((Encryption_Num+k)%64,nfc_data[k],F));   
    }

        Soft_I2C_Write(&iic_typedef,0xCF);		
        Soft_I2C_Stop(&iic_typedef);
    RcuWhichMutexGive(which,1,999);

  
}
 #endif
#endif


#ifdef _GETNFCSTATUS_
 #ifndef  _GETNFCSTATUS_EXISTS_
  #define _GETNFCSTATUS_EXISTS_

#include <jmkernel.h>
#include "I2C_Soft.h"

int16_t GetNFCStatus(uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];
	uint8_t i,j;
	uint8_t ACK=0;  
	uint8_t whichx=which-1;
    uint8_t Status=0;
  
	RcuWhichMutexTake(which,1,9999);
	Soft_I2C_Typedef iic_typedef;
	Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);
		
	Soft_I2C_Start(&iic_typedef);
	Soft_I2C_Write(&iic_typedef,0x3b);//addr
	for(i=0;i<14;i++)
	{
		if(i==13) ACK =1;
		else  ACK = 0;
		NFCRecBuf[i]=Soft_I2C_Read(&iic_typedef,ACK);         
	}  
	Soft_I2C_Stop(&iic_typedef);
    Status = NFCShow();
    RcuWhichMutexGive(which,1,999);
        return Status;
}
 #endif
#endif


