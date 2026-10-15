 #ifndef _I2C_SOFT_
 #define _I2C_SOFT_

 unsigned char I2C_SPEED;
 unsigned char pic_iic;
 #define IIC_SPEED_70K		112
 #define IIC_SPEED_100K		66
 #define IIC_SPEED_400K		14
 #define IIC_SPEED_DEFAULT	IIC_SPEED_70K//默认I2C速度70Khz
 unsigned char delay_iic=IIC_SPEED_DEFAULT;
 
 #define OS_ENTER_CRITICAL()	os_port_enter_critical()
 #define OS_EXIT_CRITICAL()		os_port_exit_critical()
 
 #define Set_PORT_DDR(portx,bitx)	GPIO_Setting((GPIO_TypeDef*)portx,bitx,GPIO_MODE_OUTPUT_PP)
 #define Cls_PORT_DDR(portx,bitx)   GPIO_Setting((GPIO_TypeDef*)portx,bitx,GPIO_MODE_INPUT)
 #define Set_PORT(portx,bitx)	    HAL_GPIO_WritePin((GPIO_TypeDef*)portx,(1<<bitx),GPIO_PIN_SET)
 #define Cls_PORT(portx,bitx)		HAL_GPIO_WritePin((GPIO_TypeDef*)portx,(1<<bitx),GPIO_PIN_RESET)
 #define PORT_Status(portx,bitx)	HAL_GPIO_ReadPin((GPIO_TypeDef*)portx,(1<<bitx))
 typedef struct
 {
		unsigned long sda_port;
		unsigned long scl_port;
		unsigned char sda_pin;
		unsigned char scl_pin;
 }Soft_I2C_Typedef;
 //初始化I2C引脚
char Soft_I2C_BspInit(	unsigned long sda_port,unsigned char sda_pin,//SDA
                        unsigned long scl_port,unsigned char scl_pin,//SCL
												Soft_I2C_Typedef *iic)
{
	iic->sda_port=sda_port;iic->sda_pin=sda_pin;
	iic->scl_port=scl_port;iic->scl_pin=scl_pin;
	return 1;
}
static void Soft_I2C_Delay(void)
{
	volatile unsigned int ri;
	 for( ri=0; ri<delay_iic; ri++ );//20->100k 34->70k 30->78k
}
  
 void Soft_I2C_Delayxd(void)
 {
   int xri;
   for( xri=0; xri<2000; xri++ );
 }
 void Soft_I2C_Start(Soft_I2C_Typedef *iic)
 { 
   Set_PORT_DDR(iic->sda_port,iic->sda_pin);
   Set_PORT_DDR(iic->scl_port,iic->scl_pin);   
   Set_PORT(iic->sda_port,iic->sda_pin);  
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();  
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();
   Cls_PORT(iic->sda_port,iic->sda_pin);
   Soft_I2C_Delay();
   Cls_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();
 }

 void Wireless_Soft_I2C_Start(Soft_I2C_Typedef *iic)
 {
   Set_PORT(iic->sda_port,iic->sda_pin);
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Start(iic);
 }
 void Soft_I2C_Stop(Soft_I2C_Typedef *iic)
 {
   Set_PORT_DDR(iic->sda_port,iic->sda_pin);
   Set_PORT_DDR(iic->scl_port,iic->scl_pin);
   Cls_PORT(iic->sda_port,iic->sda_pin);
   Soft_I2C_Delay();
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();
   Set_PORT(iic->sda_port,iic->sda_pin);
   Soft_I2C_Delay();
 }
 
 unsigned char Soft_I2C_Write(Soft_I2C_Typedef *iic,unsigned char wb)
 {
   unsigned char ack=0;
   int i;
   Set_PORT_DDR(iic->sda_port,iic->sda_pin);
   Set_PORT_DDR(iic->scl_port,iic->scl_pin);  
   OS_ENTER_CRITICAL();//保证1Byte数据传输完整性
   for(i=0;i<8;i++)
	 {
     if( wb&0x80 ) {Set_PORT(iic->sda_port,iic->sda_pin);}
     else {Cls_PORT(iic->sda_port,iic->sda_pin);}
     wb=wb<<1;
     Soft_I2C_Delay();
     Set_PORT(iic->scl_port,iic->scl_pin);
     Soft_I2C_Delay();
     Cls_PORT(iic->scl_port,iic->scl_pin);
   }
   Cls_PORT_DDR(iic->sda_port,iic->sda_pin);                                // releast data line
   Set_PORT(iic->sda_port,iic->sda_pin);                                    // pull up for check
   Soft_I2C_Delay();
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();  
   if(PORT_Status(iic->sda_port,iic->sda_pin))ack=0;
   else ack=1;  
   Cls_PORT(iic->scl_port,iic->scl_pin);
	 OS_EXIT_CRITICAL();
   Soft_I2C_Delay();
   return ack;    
 }
 
 unsigned char Soft_I2C_Read(Soft_I2C_Typedef *iic,unsigned char bEnd)
 {
   unsigned char i,mb;
   mb=0;
	 OS_ENTER_CRITICAL();//保证1Byte数据传输完整性
   Cls_PORT_DDR(iic->sda_port,iic->sda_pin);
   Set_PORT(iic->sda_port,iic->sda_pin); 
   Set_PORT_DDR(iic->scl_port,iic->scl_pin);    
   for(i=0;i<8;i++)
	{
	     Soft_I2C_Delay();
	     Cls_PORT(iic->scl_port,iic->scl_pin);
	     Soft_I2C_Delay();
	 	 Set_PORT(iic->scl_port,iic->scl_pin);
	     mb=mb<<1;	
	     if( PORT_Status(iic->sda_port,iic->sda_pin) )  mb++;
   }
   Soft_I2C_Delay();  
   Cls_PORT(iic->scl_port,iic->scl_pin);  
   Set_PORT_DDR(iic->sda_port,iic->sda_pin);  
   if( bEnd )   {Set_PORT(iic->sda_port,iic->sda_pin);}
   else    {Cls_PORT(iic->sda_port,iic->sda_pin);}
   Soft_I2C_Delay();
   Set_PORT(iic->scl_port,iic->scl_pin);
   Soft_I2C_Delay();
   Cls_PORT(iic->scl_port,iic->scl_pin);
   OS_EXIT_CRITICAL();
   Soft_I2C_Delay();
   return mb;
 }

unsigned char Soft_I2C_ReadSlaver(Soft_I2C_Typedef *iic,unsigned char sbEnd)
{
  unsigned char j,sb;
  sb=0;
  Cls_PORT_DDR(iic->sda_port,iic->sda_pin);
  Set_PORT(iic->sda_port,iic->sda_pin); 
  Cls_PORT_DDR(iic->scl_port,iic->scl_pin);
  Set_PORT(iic->scl_port,iic->scl_pin);     
  for(j=0;j<8;j++)
	{
    if(!PORT_Status(iic->scl_port,iic->scl_pin))
		{
			Soft_I2C_Delayxd();
			while(!PORT_Status(iic->scl_port,iic->scl_pin));
			Soft_I2C_Delayxd();
		}
    
    sb<<=1;	
    if( PORT_Status(iic->sda_port,iic->sda_pin) )   sb++;
		if(PORT_Status(iic->scl_port,iic->scl_pin))
		{    
			 Soft_I2C_Delayxd();
			while(PORT_Status(iic->scl_port,iic->scl_pin));
			Soft_I2C_Delayxd();
		}
	}
  if(!PORT_Status(iic->scl_port,iic->scl_pin))
  {
		Soft_I2C_Delayxd();
		while(!PORT_Status(iic->scl_port,iic->scl_pin));
		Soft_I2C_Delayxd();
  }
  if( sbEnd )
  { 
		Set_PORT(iic->sda_port,iic->sda_pin);
	}
  else
  {
		Cls_PORT(iic->sda_port,iic->sda_pin); 
	} 
  Set_PORT_DDR(iic->sda_port,iic->sda_pin); 
	if(PORT_Status(iic->scl_port,iic->scl_pin))
  {    
    Soft_I2C_Delayxd();
		while(PORT_Status(iic->scl_port,iic->scl_pin));
		Soft_I2C_Delayxd();
  } 
	Cls_PORT_DDR(iic->sda_port,iic->sda_pin);
	Set_PORT(iic->sda_port,iic->sda_pin);
  Soft_I2C_Delayxd();
  return sb;
 }
#endif
