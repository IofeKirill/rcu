#ifndef _DHTSENSOR_
#define _DHTSENSOR_

 uint32_t WIRE_PORT;
 uint8_t WIRE_BIT;
 
 #define Set_WIRE_DDR 	GPIO_Setting((GPIO_TypeDef*)WIRE_PORT,WIRE_BIT,GPIO_MODE_OUTPUT_PP)
 #define Cls_WIRE_DDR 	GPIO_Setting((GPIO_TypeDef*)WIRE_PORT,WIRE_BIT,GPIO_MODE_INPUT)
 #define Set_WIRE     	HAL_GPIO_WritePin((GPIO_TypeDef*)WIRE_PORT,(1<<WIRE_BIT),GPIO_PIN_SET)
 #define Cls_WIRE     	HAL_GPIO_WritePin((GPIO_TypeDef*)WIRE_PORT,(1<<WIRE_BIT),GPIO_PIN_RESET)
 #define WIRE_PinStatus  HAL_GPIO_ReadPin((GPIO_TypeDef*)WIRE_PORT,(1<<WIRE_BIT))
#define _DTHSDELAYBASIC_		{asm("nop");asm("nop");asm("nop");asm("nop");asm("nop");}
/////////////////////168MHz 主频///////////////////////
void DTHS_Delayus(unsigned long nCount)//100 =5.4us
{
	volatile int i;
	for (i=0;i<nCount;i++){_DTHSDELAYBASIC_;}
}
void DTHS_Delayms(unsigned long nCount)//10 = 6.22ms
{
	volatile long i;
	volatile int j;
	for (i=0;i<nCount;i++)
	{
		for (j=0;j<4500;j++)
		{_DTHSDELAYBASIC_;}
	}
}
void DTHS_Delay28us(void)//520
{
	DTHS_Delayus(300);//27us//26-28us//
}
void DTHS_Delay40us(void)//735
{
	DTHS_Delayus(410);//<20-40us //32us
}
void DTHS_Delay18ms(void)//45
{
	DTHS_Delayms(25); //>18ms  22ms
}
void DTHS_Delay700ms(void)//27
{
	DTHS_Delayms(850);
}

// read 8 bits onice
unsigned char DTHS_GetOneByte(void)
{
	unsigned char i,temp=0,data=0;
	for(i=0;i<8;i++)
	{
		while(!WIRE_PinStatus);// 表示读取的高电位延时大于24us则读取的是1,否则读取的是0
		DTHS_Delay40us(); //通过 uint8_tFLAG 可判断 bit11 显示数据的脉长 0:26-28us
		if(WIRE_PinStatus)temp=0X01;
		else temp=0X00;
		while(WIRE_PinStatus);
		data<<=1;
		data|=temp;
	}
	return data;
}
//--------------------- 温湿度读取子程序 ------------
//DHT11一次通讯时间最大3ms，主机连续采样间隔建议不小于100ms。
//DTH11采样周期1s
//8bit湿度整数数据+8bit湿度小数数据+8bi温度整数数据+8bit温度小数数据
unsigned char GetDHT11Data(unsigned char mode,unsigned int *pdat)
{
	unsigned char sum,s;
	unsigned char hum_int,hum_dec;
	unsigned char temp_int,temp_dec;

    unsigned char i,temp=0,data=0;
/*
    Set_WIRE_DDR;
	while(1)
	{	Cls_WIRE;
		DTHS_Delay40us();
		Set_WIRE;
		DTHS_Delay40us();
		
		Cls_WIRE;
		DTHS_Delay40us();
		Set_WIRE;
		DTHS_Delay40us();

	}
*/


	Set_WIRE_DDR;
	Cls_WIRE;
	DTHS_Delay18ms();
	Set_WIRE;
	DTHS_Delay40us();//总线由上拉电阻拉高 主机延时 20us-40us
	Cls_WIRE_DDR;//释放总线 主机设为输入 判断从机响应信号

	
	if(!WIRE_PinStatus)// 判断从机是否有低电平响应信号 如不响应则跳出，响应则向下运行
	{
	
		while(!WIRE_PinStatus);//判断从机是否发出 80us 的低电平响应信号是否结束  
		while(WIRE_PinStatus);//判断从机是否发出 80us 的高电平，如发出则进入数据接收状态

		hum_int=DTHS_GetOneByte();//湿度整数
		hum_dec=DTHS_GetOneByte();//湿度小数 读出为0
		temp_int=DTHS_GetOneByte();//湿度整数
		temp_dec=DTHS_GetOneByte();//湿度小数 读出为0
		sum=DTHS_GetOneByte();
		Set_WIRE_DDR;
		Set_WIRE;
		s=hum_int+hum_dec+temp_int+temp_dec;//计算校验和
		if(s==sum)
		{
			if(mode)//湿度
			{
				*pdat=hum_int;
			}
			else//温度
			{
				*pdat=temp_int;
			}
			return (1);
		}
		else *pdat=999;//读到错误数据
	}
	else *pdat=888;//读不到数据
	return(0);
}

#endif
