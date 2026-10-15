/************************************************/
/******************20200311.xjk******************/
/***************GMP102气压传感器****************/
/************************************************/
#ifndef __GMP102__
#define __GMP102_H__

#include "I2C_Soft.h"

#define address		0xD8
#define GMP102_TEMPERATURE_SENSITIVITY 256  //1 Celsius = 256 code
#define GMP102_T_CODE_TO_CELSIUS(tCode) (((float)(tCode)) / GMP102_TEMPERATURE_SENSITIVITY)

//Registers Address
#define GMP102_REG_RESET	  0x00
#define GMP102_REG_PID 	      0x01
#define GMP102_REG_STATUS 	  0x02
#define GMP102_REG_PRESSH	  0x06
#define GMP102_REG_PRESSM	  0x07
#define GMP102_REG_PRESSL	  0x08
#define GMP102_REG_TEMPH	  0x09
#define GMP102_REG_TEMPL	  0x0A
#define GMP102_REG_CMD	 	  0x30
#define GMP102_REG_CONFIG1 	  0xA5
#define GMP102_REG_CONFIG2 	  0xA6
#define GMP102_REG_CONFIG3 	  0xA7
#define GMP102_REG_CALIB00        0xAA
//Total calibration register count: AAh~BBh total 18
#define GMP102_CALIBRATION_REGISTER_COUNT 18
//Total calibration parameter count: total 9
#define GMP102_CALIBRATION_PARAMETER_COUNT (GMP102_CALIBRATION_REGISTER_COUNT/2)
//Soft reset 
#define GMP102_SW_RST_SET_VALUE		0x24


/* PID */
#define GMP102_PID__REG GMP102_REG_PID
/* Soft Rest bit */
#define GMP102_RST__REG		GMP102_REG_RESET
#define GMP102_RST__MSK		0x24
#define GMP102_RST__POS		0
/* DRDY bit */
#define GMP102_DRDY__REG	GMP102_REG_STATUS
#define GMP102_DRDY__MSK	0x01
#define GMP102_DRDY__POS	0
/* P OSR bits */
#define GMP102_P_OSR__REG       GMP102_REG_CONFIG2
#define GMP102_P_OSR__MSK       0x07
#define GMP102_P_OSR__POS       0
/* T OSR bits */
#define GMP102_T_OSR__REG       GMP102_REG_CONFIG3
#define GMP102_T_OSR__MSK       0x07
#define GMP102_T_OSR__POS       0

#define GMP102_GET_BITSLICE(regvar, bitname)	\
  ((regvar & bitname##__MSK) >> bitname##__POS)

#define GMP102_SET_BITSLICE(regvar, bitname, val)			\
  ((regvar & ~bitname##__MSK) | ((val<<bitname##__POS)&bitname##__MSK))
  
u8 Pbuf[3], Tbuf[2];  
u8 GCalibuf[18]; 
float GCali[9]; 
static const float GMP102_CALIB_SCALE_FACTOR[] = {
  1.0E+00,
  1.0E-05,
  1.0E-10,
  1.0E-05,
  1.0E-10,
  1.0E-15,
  1.0E-12,
  1.0E-17,
  1.0E-21 };

static const s32 GMP102_POWER_SCALE[] = {1, 10, 100, 1000};


 void GmpWriteDataAt(Soft_I2C_Typedef *iic, u8 reg, u8 data) //*****
 {
   // 写1字节
	Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
    Soft_I2C_Write(iic,data);
    Soft_I2C_Stop(iic);
 }
 
  u8 GmpReadDataAt(Soft_I2C_Typedef *iic, u8 reg) //*****
 {
   //读一个字节数据
	Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
	Soft_I2C_Delay();
	Soft_I2C_Stop(iic);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,address|0x01); 
	Soft_I2C_Delay();
    u8 b = Soft_I2C_Read(iic, 1);
	Soft_I2C_Stop(iic);
    return b;
 }

 
  void GmpReadDatasAt(Soft_I2C_Typedef *iic, u8 reg, u8 len, u8 vbuf[]) //*****
 {	
    //读几个字节数据
 	u8 i = 0;
    Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,address);
    Soft_I2C_Write(iic,reg);
	//Soft_I2C_Delay();
	Soft_I2C_Stop(iic);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,address|0x01); 
	//Soft_I2C_Delay();
	while(len)
	{
		if(len==1)
		{
			vbuf[i] = Soft_I2C_Read(iic, 1);
		}
		else
		{
			vbuf[i] = Soft_I2C_Read(iic, 0);
		}
		i++;
		len--;
	}
	Soft_I2C_Stop(iic);
   
 }
 
u8 Pflag=0;
float GetPressure(Soft_I2C_Typedef *iic)
{
	float Pressure = 0;
	s32 Pre = 0;
	s16 Tem=0;
	s32 tmp, shift, i;
	u8 p=0,t=0;
	if(Pflag == 0)
	{
		GmpWriteDataAt(iic, GMP102_REG_RESET, GMP102_SW_RST_SET_VALUE);  //复位
		Delay1ms(100);

		GmpReadDatasAt(iic, GMP102_REG_CALIB00, GMP102_CALIBRATION_REGISTER_COUNT, GCalibuf);	//校准参数	
		shift = sizeof(s32)*8 - 16;
		for(i = 0; i < GMP102_CALIBRATION_PARAMETER_COUNT; ++i)
		{
			tmp = (GCalibuf[2 * i] << 8) + GCalibuf[2 * i + 1];
			GCali[i] = ((tmp << shift) >> (shift + 2)) * GMP102_POWER_SCALE[(GCalibuf[2 * i + 1] & 0x03)] * GMP102_CALIB_SCALE_FACTOR[i];
        }	
		
		GmpWriteDataAt(iic, 0xAA, 0x00);
		GmpWriteDataAt(iic, 0xAB, 0x00);
		GmpWriteDataAt(iic, 0xAC, 0x00);
		GmpWriteDataAt(iic, 0xAD, 0x00);
		  
		//GmpWriteDataAt(iic, GMP102_P_OSR__REG, (GmpReadDataAt(iic, GMP102_P_OSR__REG)&0xF8) | 0x03);//11.46ms （default 42.18）气压采样时间 19.1典型分辨率 （default 19.7）
		//GmpWriteDataAt(iic, GMP102_T_OSR__REG, (GmpReadDataAt(iic, GMP102_T_OSR__REG)&0xF8) | 0x03);//11.46ms                  温度采样时间 19.1典型分辨率
		Pflag=1;
	}

	GmpWriteDataAt(iic, GMP102_REG_CONFIG1, 0x02);         //读取3字节气压补码
	GmpWriteDataAt(iic, GMP102_REG_CMD, 0x09);
	while (!(GmpReadDataAt(iic, GMP102_REG_STATUS) & 0x01))
	{
		Delay1ms(5);
		p++;
		if(p>10)
		{
			Pflag=0;
			break;
		}	
    }
	p=0;
	GmpReadDatasAt(iic, GMP102_REG_PRESSH, 3, Pbuf);
	Pre = (Pbuf[0]<<16) +(Pbuf[1]<<8) +Pbuf[2];
	
	GmpWriteDataAt(iic, GMP102_REG_CONFIG1, 0x00);         //读取2字节温度补码
	GmpWriteDataAt(iic, GMP102_REG_CMD, 0x08);
	while (!(GmpReadDataAt(iic, GMP102_REG_STATUS) & 0x01))
	{
		Delay1ms(5);
		t++;
		if(t>10)
		{
			Pflag=0;
			break;
		}
    }
	t=0;
	GmpReadDatasAt(iic, GMP102_REG_TEMPH, 2, Tbuf);	
	Tem = (Tbuf[0]<<8) +Tbuf[1]; 
	                                  //气压公式
	Pressure = \                                          
    GCali[0] + \
    GCali[1]*Tem + \
    GCali[2]*Tem*Tem + \
    GCali[3]*Pre + \
    GCali[4]*Tem*Pre + \
    GCali[5]*Tem*Tem*Pre + \
    GCali[6]*Pre*Pre + \
    GCali[7]*Tem*Pre*Pre + \
    GCali[8]*Tem*Tem*Pre*Pre;
	
	if( Pressure<0 ) Pflag=0;	
	//Delay1ms(100);
	return Pressure;	

}	


float  PressureDataPro(float pa)
{

    static float  Data[16],pb = 0;
    static u8 PCount = 0;
    static u8 OutputFlag = 0;  
	u8  i;


	if(PCount < 16)
	{
    	Data[PCount++] = pa;
	}	
    else
    {
        PCount = 0;
        OutputFlag = 1; 
    }

    if(OutputFlag)
    {
       pb=0;
       for(i = 0;i<16;i++)
       {
			pb += Data[i];
	   }
	   pb = pb/16;
	return pb;
    }


}
	
#endif 	