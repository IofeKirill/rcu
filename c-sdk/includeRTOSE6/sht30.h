/************************************************/
/******************20191217.xjk******************/
/***************SHT30温湿度传感器****************/
/************************************************/
#ifndef __SHT30_H__
#define __SHT30_H__

#include "I2C_Soft.h"

typedef enum {
	_address = 0x88,
	CMD_READ_SERIAL_NUMBER = 0x3780,

	CMD_READ_STATUS = 0xF32D,
	CMD_CLEAR_STATUS = 0x3041,

	CMD_HEATER_ENABLE = 0x306D,
	CMD_HEATER_DISABLE = 0x3066,

	CMD_SOFT_RESET = 0x30A2,

	CMD_CLOCK_STRETCH_H = 0x2C06,
	CMD_CLOCK_STRETCH_M = 0x2C0D,
	CMD_CLOCK_STRETCH_L = 0x2C10,

	CMD_POLLING_H = 0x2400,
	CMD_POLLING_M = 0x240B,
	CMD_POLLING_L = 0x2416,

	CMD_ART = 0x2B32,

	CMD_PERIODIC_HALF_H = 0x2032,
	CMD_PERIODIC_HALF_M = 0x2024,
	CMD_PERIODIC_HALF_L = 0x202F,
	CMD_PERIODIC_1_H = 0x2130,
	CMD_PERIODIC_1_M = 0x2126,
	CMD_PERIODIC_1_L = 0x212D,
	CMD_PERIODIC_2_H = 0x2236,
	CMD_PERIODIC_2_M = 0x2220,
	CMD_PERIODIC_2_L = 0x222B,
	CMD_PERIODIC_4_H = 0x2334,
	CMD_PERIODIC_4_M = 0x2322,
	CMD_PERIODIC_4_L = 0x2329,
	CMD_PERIODIC_10_H = 0x2737,
	CMD_PERIODIC_10_M = 0x2721,
	CMD_PERIODIC_10_L = 0x272A,

	CMD_FETCH_DATA = 0xE000,
	CMD_STOP_PERIODIC = 0x3093,

	CMD_READ_ALR_LIMIT_LS = 0xE102,
	CMD_READ_ALR_LIMIT_LC = 0xE109,
	CMD_READ_ALR_LIMIT_HS = 0xE11F,
	CMD_READ_ALR_LIMIT_HC = 0xE114,

	CMD_WRITE_ALR_LIMIT_HS = 0x611D,
	CMD_WRITE_ALR_LIMIT_HC = 0x6116,
	CMD_WRITE_ALR_LIMIT_LC = 0x610B,
	CMD_WRITE_ALR_LIMIT_LS = 0x6100,

	CMD_NO_SLEEP = 0x303E,
} SHT3XD_Commands;



float cTemp=0;
float fTemp=0;
float humidity=0;
uint8_t flag=0;  	
void ReadTempAndHumi(Soft_I2C_Typedef *iic)
{
	unsigned int data[6];
	//Delay1ms(11);
	Soft_I2C_Start(iic);
 	Soft_I2C_Write(iic,_address);                  //写地址
	//Delay1ms(11);
	
    Soft_I2C_Write(iic,((CMD_CLOCK_STRETCH_H >> 8) & 0xFF));
	Soft_I2C_Write(iic,(CMD_CLOCK_STRETCH_H  & 0xFF));             //写0x2C06，读取温度指令，高重复性，有时钟延伸（测量过程中会拉下SCL线）
	Soft_I2C_Stop(iic);


	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,_address|0x01); 
	for (int i=0;i<5;i++) { 
		data[i]=Soft_I2C_Read(iic, 0);                                    //读温度、湿度和各自的CRC校验字节
	}
	data[5]=Soft_I2C_Read(iic, 1);
    Soft_I2C_Stop(iic);

	
	cTemp = ((((data[0] * 256.0) + data[1]) * 175) / 65535.0) - 45;          //计算转换数值
	//fTemp = (cTemp * 1.8) + 32;   //华氏温度
	humidity = ((((data[3] * 256.0) + data[4]) * 100) / 65535.0);
	//humidity = data[5];
}
	
#endif 	