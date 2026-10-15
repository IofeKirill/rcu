#ifndef _HT1632CDRIVER_H_
 #define _HT1632CDRIVER_H_


 #include "I2C_Soft.h"


 #define os_lcd_task_enter_critical 	os_task_enter_critical
 #define os_lcd_task_exit_critical 	os_task_exit_critical
 
 #define _BV(bit) (1 << (bit))
 
 #define OS_ENTER_CRITICAL()		os_port_enter_critical()
 #define OS_EXIT_CRITICAL()		os_port_exit_critical()
 
 #define Set_PORT_DDR(portx,bitx) GPIO_Setting((GPIO_TypeDef*)portx,bitx,GPIO_MODE_OUTPUT_PP)
 #define Cls_PORT_DDR(portx,bitx) GPIO_Setting((GPIO_TypeDef*)portx,bitx,GPIO_MODE_INPUT)
 #define Set_PORT_AIN(portx,bitx)   GPIO_Setting((GPIO_TypeDef*)portx,bitx,GPIO_MODE_INPUT)
 #define Set_PORT(portx,bitx)     HAL_GPIO_WritePin((GPIO_TypeDef*)portx,(1<<bitx),GPIO_PIN_SET);
 #define Cls_PORT(portx,bitx)     HAL_GPIO_WritePin((GPIO_TypeDef*)portx,(1<<bitx),GPIO_PIN_RESET);
 #define PORT_Status(portx,bitx)  HAL_GPIO_ReadPin((GPIO_TypeDef*)portx,(1<<bitx))
 //HT1632 驱动文件.
#define ADA_HT1632_READ  0x6
#define ADA_HT1632_WRITE 0x5
#define ADA_HT1632_COMMAND 0x4

#define ADA_HT1632_SYS_DIS 0x00
#define ADA_HT1632_SYS_EN 0x01
#define ADA_HT1632_LED_OFF 0x02
#define ADA_HT1632_LED_ON 0x03
#define ADA_HT1632_BLINK_OFF 0x08
#define ADA_HT1632_BLINK_ON 0x09
#define ADA_HT1632_SLAVE_MODE 0x10
#define ADA_HT1632_MASTER_MODE 0x14
#define ADA_HT1632_INT_RC 0x18
#define ADA_HT1632_EXT_CLK 0x1C
#define ADA_HT1632_PWM_CONTROL 0xA0

#define ADA_HT1632_COMMON_8NMOS  0x20
#define ADA_HT1632_COMMON_16NMOS  0x24
#define ADA_HT1632_COMMON_8PMOS  0x28
#define ADA_HT1632_COMMON_16PMOS  0x2C

int8_t WIDTH=16, HEIGHT=16;
int8_t width, height;
//int8_t _data, _cs, _wr, _rd;
uint8_t ledmatrix[48];     // 16 * 24 / 8
uint8_t matrixNum=1;
uint8_t ENChar_Buf[4096];
uint8_t Char_Buf[4096];
uint16_t Last_CNSectorHT=0; 
uint8_t Alone[32]={0};
 typedef struct
 {
		unsigned long CS_port;
		unsigned long WR_port;
		unsigned long DATA_port;
		unsigned char CS_pin;
		unsigned char WR_pin;
		unsigned char DATA_pin;
 }Soft_DI2C_Typedef;
 
 Soft_DI2C_Typedef *Diic;
 //初始化I2C引脚
char Soft_DI2C_BspInit(	unsigned long CS_port,unsigned char CS_pin,//CS
                        unsigned long WR_port,unsigned char WR_pin,//WR
						unsigned long DATA_port,unsigned char DATA_pin,//DATA
												Soft_DI2C_Typedef *_iic)
{
	Diic=_iic;
	Diic->CS_port=CS_port;Diic->CS_pin=CS_pin;
	Diic->WR_port=WR_port;Diic->WR_pin=WR_pin;
	Diic->DATA_port=DATA_port;Diic->DATA_pin=DATA_pin;
	return 1;
}

 //----------------------------------------测试---------
  void text(Soft_DI2C_Typedef *Diic)
 {
	Set_PORT_DDR(Diic->CS_port,Diic->CS_pin);
	Set_PORT_DDR(Diic->WR_port,Diic->WR_pin);
	Set_PORT_DDR(Diic->DATA_port,Diic->DATA_pin);
	
	Cls_PORT(Diic->CS_port,Diic->CS_pin);
	Set_PORT(Diic->CS_port,Diic->CS_pin);
	Cls_PORT(Diic->WR_port,Diic->WR_pin);
	Set_PORT(Diic->WR_port,Diic->WR_pin);
	Cls_PORT(Diic->DATA_port,Diic->DATA_pin);	
	Set_PORT(Diic->DATA_port,Diic->DATA_pin);	
 }

void A_setPixel(uint8_t x, uint8_t y) {
//坐标映射-亮
/*
  if(x>=8&&y<8){drawPixel(x-8, 7-y, 1);}
  else if(x<8&&y>=8){drawPixel(x+8, 23-y, 1);}
  else if(x>=8&&y>=8){drawPixel(x, 15-y, 1);}
  else drawPixel(x, 7-y, 1);
*/
/*
  if(x>=8&&y<8){drawPixel(x-8, y+8, 1);}
  else if(x<8&&y>=8){drawPixel(x+8, y-8, 1);}
  else if(x>=8&&y>=8){drawPixel(x, y, 1);}
  else drawPixel(x, y, 1);
*/
       if(x>=0&&x<=7 &&y>=0&&y<=7) {drawPixel(15-y, 15-x, 1);}
  else if(x>=8&&x<=15&&y>=0&&y<=7) {drawPixel(7-y, 23-x, 1);}
  else if(x>=0&&x<=7 &&y>=8&&y<=15){drawPixel(23-y, 7-x, 1);}
  else if(x>=8&&x<=15&&y>=8&&y<=15){drawPixel(15-y, 15-x, 1);}
  //drawPixel(15, 0, 1);
}
void A_clrPixel(uint8_t x, uint8_t y) {
//坐标映射-灭
/*
  if(x>=8&&y<8){drawPixel(x-8, 7-y, 0);}
  else if(x<8&&y>=8){drawPixel(x+8, 23-y, 0);}
  else if(x>=8&&y>=8){drawPixel(x, 15-y, 0);}
  else drawPixel(x, 7-y, 0);
*/
/*
  if(x>=8&&y<8){drawPixel(x-8, y+8, 0);}
  else if(x<8&&y>=8){drawPixel(x+8, y-8, 0);}
  else if(x>=8&&y>=8){drawPixel(x, y, 0);}
  else drawPixel(x, y, 0);
*/ 
       if(x>=0&&x<=7 &&y>=0&&y<=7) {drawPixel(15-y, 15-x, 0);}
  else if(x>=8&&x<=15&&y>=0&&y<=7) {drawPixel(7-y, 23-x, 0);}
  else if(x>=0&&x<=7 &&y>=8&&y<=15){drawPixel(23-y, 7-x, 0);}
  else if(x>=8&&x<=15&&y>=8&&y<=15){drawPixel(15-y, 15-x, 0);}
}

void drawPixel(int16_t x, int16_t y, uint16_t color) {
	                                    //x坐标，y坐标，亮或灭
  if((x < 0) || (x >= width) || (y < 0) || (y >= height)) return;

  //uint8_t m;
  // figure out which matrix controller it is
  //m = x / 24;//多个HT1632C串联时用来表示控制第几个HT1632C
  x %= 24;//表示控制点阵的第几列

  uint16_t i;

  if (x < 8) {//小于8
    i = 7;
  } else if (x < 16) {//8到16
    i = 128 + 7;
  } else {//17到23
    i = 256 + 7;
  }
  i -= (x % 8);

  if (y < 8) {
    y *= 2;
  } else {
    y = (y-8) * 2 + 1;
  } 

  i += y * 8;
//
  if (color) 
    setPixel(i);
	//matrices[m].setPixel(i);
  else
    clrPixel(i);
	//matrices[m].clrPixel(i);
}
//////////////////////////////////////////////////////////////////////////

void Adafruit_HT1632(Soft_DI2C_Typedef *_iic ) {
  //Diic=_iic;
  width=16; 
  height=16;
  for (uint8_t i=0; i<48; i++) {
    ledmatrix[i] = 0;
  }
}

void begin(uint8_t type,uint8_t luminance) {//初始化模块
  Set_PORT_DDR(Diic->CS_port,Diic->CS_pin);
  Set_PORT(Diic->CS_port,Diic->CS_pin);
  Set_PORT_DDR(Diic->WR_port,Diic->WR_pin);
  Set_PORT(Diic->WR_port,Diic->WR_pin);
  Set_PORT_DDR(Diic->DATA_port,Diic->DATA_pin);
  //Set_PORT(Diic->DATA_port,Diic->DATA_pin);
  
  //if (_rd >= 0) {
    //pinMode(_rd, OUTPUT);
    //digitalWrite(_rd, HIGH);
  //}

  sendcommand(ADA_HT1632_SYS_EN);//系统标准
  sendcommand(ADA_HT1632_LED_ON);//开全部LED
  sendcommand(ADA_HT1632_BLINK_OFF);//关闭全部LED
  sendcommand(ADA_HT1632_MASTER_MODE);//主机模式
  sendcommand(ADA_HT1632_INT_RC);//中断
  sendcommand(type);//类型初始化
  sendcommand(ADA_HT1632_PWM_CONTROL | luminance);////设置亮度为15（0-15）
  
  WIDTH = 16;//列16
  HEIGHT = 16;//行16

}

void setBrightness(uint8_t pwm) {//设置亮度
  if (pwm > 15) pwm = 15;
  sendcommand(ADA_HT1632_PWM_CONTROL | pwm);
}

void blink(uint8_t blinky) {//闪烁一次
  if (blinky) 
    sendcommand(ADA_HT1632_BLINK_ON);//全关
  else
    sendcommand(ADA_HT1632_BLINK_OFF);//全开
}

void setPixel(uint16_t i) {//设置像素-开
  ledmatrix[i/8] |= _BV(i%8); 
}

void clrPixel(uint16_t i) {//设置像素-关
  ledmatrix[i/8] &= ~_BV(i%8); 
}

void writeScreen() {//IC往驱动芯片写入一次显示信息

  Cls_PORT(Diic->CS_port,Diic->CS_pin);

  writedata(ADA_HT1632_WRITE, 3);
  // send with address 0
  writedata(0, 7);

  for (uint16_t i=0; i<(WIDTH*HEIGHT/8); i+=2) {
    uint16_t d = ledmatrix[i];
    d <<= 8;
    d |= ledmatrix[i+1];

    writedata(d, 16);
  }
  Set_PORT(Diic->CS_port,Diic->CS_pin);
}

void clearScreen() {//IC显示数组清零并传输给驱动芯片
  for (uint8_t i=0; i<(WIDTH*HEIGHT/8); i++) {
    ledmatrix[i] = 0;//全部关
  }
  for(uint8_t i =0; i<32; i++) Alone[i]=0;
  writeScreen();//全屏刷新一次
}

void writedata(uint16_t d, uint8_t bits) {//写入bits位数据
  Set_PORT_DDR(Diic->DATA_port,Diic->DATA_pin);
  for (uint8_t i=bits; i > 0; i--) {
    Cls_PORT(Diic->WR_port,Diic->WR_pin);
   if (d & _BV(i-1)) {
     Set_PORT(Diic->DATA_port,Diic->DATA_pin);
   } else {
     Cls_PORT(Diic->DATA_port,Diic->DATA_pin);
   }
  Set_PORT(Diic->WR_port,Diic->WR_pin);
  }
  Set_PORT_AIN(Diic->DATA_port,Diic->DATA_pin);
}

void writeRAM(uint8_t addr, uint8_t data) {
  //Serial.print("Writing 0x"); Serial.print(data&0xF, HEX);
  //Serial.print(" to 0x"); Serial.println(addr & 0x7F, HEX);
  uint16_t d = ADA_HT1632_WRITE;
  d <<= 7;
  d |= addr & 0x7F;
  d <<= 4;
  d |= data & 0xF;
 
  Cls_PORT(Diic->CS_port,Diic->CS_pin);
  writedata(d, 14);
  Set_PORT(Diic->CS_port,Diic->CS_pin);
}

void sendcommand(uint8_t cmd) {//发送命令
  uint16_t data = 0;
  data = ADA_HT1632_COMMAND;//0x4
  data <<= 8;
  data |= cmd;
  data <<= 1;
  
  Cls_PORT(Diic->CS_port,Diic->CS_pin);
  writedata(data, 12);//发送12位命令
  Set_PORT(Diic->CS_port,Diic->CS_pin);
}

void fillScreen() {//全屏幕操作-全开
  for (uint8_t i=0; i<(WIDTH*HEIGHT/8); i++) {
    ledmatrix[i] = 0xFF;//全部亮
  }
  writeScreen();//全屏刷新一次
}

//简化横扫描用-旋转-重新定义正方向
//用取模软件
void zi1616(uint8_t a[32])
{
  uint8_t y,z,key;
    for (y=0; y<32; y++) {
      key=a[y];
      for (z=0; z<8; z++) {
		if(key&0x01==0x01)A_setPixel(z+y%2*8,y/2);//点亮
		else A_clrPixel(z+y%2*8,y/2);   //列      行
        key=key>>1;
      }
    }
  writeScreen();
}

//单独操作每一个点用
void AloneXY(int8_t x,int8_t y,int8_t state)
{
	if(state==1)
	{
		Alone[x*2+y/8]=Alone[x*2+y/8]|(0x01<<(y%8));		
	}
	if(state==0)
	{
		Alone[x*2+y/8]=Alone[x*2+y/8]&(0xFE<<(y%8));		
	}
	zi1616(Alone);
}

//显示1-2个英文字符用
void HT_en(uint8_t* ch,uint8_t a)
{
  uint8_t i,j,var0,p=0,c;
  uint8_t* pic;

  os_task_enter_critical();
  c=*ch-32;
  if((ENChar_Buf[33]!=0x48)&&(ENChar_Buf[34]!=0x6C)){sFlash_Read_Sector(ENFONT_START_SECTOR,ENChar_Buf);}
  pic=(uint8_t*)(ENChar_Buf+c*16);
  for(i=0;i<16;i++,p++)
  {
    var0=*(pic+i);
    for(j=0;j<8;j++)
    {
		if((var0&(0x01<<j))!=0)A_setPixel(j+a*8,p);//点亮
		else A_clrPixel(j+a*8,p);
    }
  }
  os_task_exit_critical();
}
//能够上下移动，显示字符串
void HT_en2(uint8_t* ch,uint8_t a,uint8_t d,uint8_t x)
{
  uint8_t i,j,var0,p=0,c,ax,by,cx,dy;
  //ax-在x轴移动的距离，by-在y轴移动的距离
  //cx-下一个字符存放位置在x轴的偏移，dx-下一个字符存放位置在y轴的偏移
  uint8_t* pic;

       if(d==0){ax=x;  by=0;  cx=a;  dy=0;  }//左
  else if(d==1){ax=0-x;by=0;  cx=0-a;dy=0;  }//右
  else if(d==2){ax=0;  by=x;  cx=0;  dy=a;  }//上
  else if(d==3){ax=0;  by=0-x;cx=0;  dy=0-a;}//下
  
  os_task_enter_critical();
  c=*ch-32;
  if((ENChar_Buf[33]!=0x48)&&(ENChar_Buf[34]!=0x6C)){sFlash_Read_Sector(ENFONT_START_SECTOR,ENChar_Buf);}
  pic=(uint8_t*)(ENChar_Buf+c*16);
  for(i=0;i<16;i++,p++)
  {
    var0=*(pic+i);
    for(j=0;j<8;j++)
    {
		//if((var0&(0x01<<j))!=0)A_setPixel(j+a*8-ax,p-by);//点亮
		//else A_clrPixel(j+a*8-ax,p-by);
		if((var0&(0x01<<j))!=0)A_setPixel(j+cx*8-ax,p-by+dy*16);//点亮
		else A_clrPixel(j+cx*8-ax,p-by+dy*16);
    }
  }
  os_task_exit_critical();
}

uint8_t HT_CN(char* ch)
{
  uint16_t i,j;
  uint8_t data,Hdata,Ldata;
  uint32_t CN_ADR=0,CN_Sector=0,CN_Pos=0;
  os_task_enter_critical();
  //
  Hdata = *ch;     
  Ldata = *(ch+1);  
 
  CN_ADR    = ((Hdata-0xB0)*94+(Ldata-0xA1))*32;
  CN_Sector = CN_ADR/FLASH_SECTOR_SIZE+CNFONT_START_SECTOR;
  CN_Pos    = CN_ADR%FLASH_SECTOR_SIZE;

  if(Last_CNSectorHT!=CN_Sector) sFlash_Read_Sector(CN_Sector,Char_Buf);
  Last_CNSectorHT = CN_Sector;
  //字符的数据分为32个8位数据包传过来
  for(i=0;i<32;i++)
    {//i=0和i=1时是第一行；i=2和i=3是第二行；以此类推。
       data = Char_Buf[i+CN_Pos];
       for(j=0;j<8;j++)//8bit
        {//（i/2）会得到一个整数，i%2*8算出是否需要加8，需要加8的都是一行的后半部分
		if((data&(0x01<<j))!=0)A_setPixel(j+i%2*8,i/2);//点亮
		else A_clrPixel(j+i%2*8,i/2);   //列      行
        }
    }
  os_task_exit_critical();
}
//汉字显示，支持上下移动
uint8_t HT_CN2(uint8_t* ch,uint8_t a,uint8_t d,uint8_t x)
{
  uint16_t i,j;
  uint8_t data,Hdata,Ldata,ax,by,cx,dy;
  //ax-在x轴移动的距离，by-在y轴移动的距离
  //cx-下一个字符存放位置在x轴的偏移，dx-下一个字符存放位置在y轴的偏移
  uint32_t CN_ADR=0,CN_Sector=0,CN_Pos=0;
/*  
  if(d==0){ax=x;by=0;}
  else if(d==1){ax=0-x;by=0;}
  else if(d==2){ax=0;by=x;}
  else if(d==3){ax=0;by=0-x;}
*/ 
       if(d==0){ax=x;  by=0;  cx=a;  dy=0;  }//左
  else if(d==1){ax=0-x;by=0;  cx=0-a;dy=0;  }//右
  else if(d==2){ax=0;  by=x;  cx=0;  dy=a;  }//上
  else if(d==3){ax=0;  by=0-x;cx=0;  dy=0-a;}//下
  
  os_task_enter_critical();

  Hdata = *ch;     
  Ldata = *(ch+1);  
 
  CN_ADR    = ((Hdata-0xB0)*94+(Ldata-0xA1))*32;
  CN_Sector = CN_ADR/FLASH_SECTOR_SIZE+CNFONT_START_SECTOR;
  CN_Pos    = CN_ADR%FLASH_SECTOR_SIZE;

  if(Last_CNSectorHT!=CN_Sector) sFlash_Read_Sector(CN_Sector,Char_Buf);
  Last_CNSectorHT = CN_Sector;
  
  for(i=0;i<32;i++)
    {
       data = Char_Buf[i+CN_Pos];
       for(j=0;j<8;j++)//8bit
        {
		//if((data&(0x01<<j))!=0)A_setPixel(j+i%2*8-ax+a*16,i/2-by);//点亮
		//else A_clrPixel(j+i%2*8-ax+a*16,i/2-by);   //列      行
		if((data&(0x01<<j))!=0)A_setPixel(j+i%2*8-ax+cx*16,i/2-by+dy*16);//点亮
		else A_clrPixel(j+i%2*8-ax+cx*16,i/2-by+dy*16);   //列      行
		//if((var0&(0x01<<j))!=0)A_setPixel(j+cx*8-ax,p-by+dy*16);//点亮
		//else A_clrPixel(j+cx*8-ax,p-by+dy*16);
        }
    }
  os_task_exit_critical();
}
//合并,支持移动的显示函数
uint8_t ziku1616xy(uint8_t* ch,uint8_t d,uint8_t x)
{							   //上下左右     距离
	uint8_t a=0;//用于计数第几个字符
    while((*ch)!='\0')
    {
    if((*ch>0x00)&&(*ch<0x80)) //0-128 //ascii
    {

       //HT_en(ch,a);//传递字符和字符序号
	   HT_en2(ch,a,d,x);//显示字符加移动的距离
       ch+=1;
    }
    else
    {
      HT_CN2(ch,a,d,x);//传递汉字
      ch+=2;
    }
	a++;
    }
    writeScreen();
}
//显示字库字，不支持移动
uint8_t ziku1616(uint8_t* ch)
{
	uint8_t a=0;//用于计数第几个字符
    while((*ch)!='\0')
  {
    if((*ch>0x00)&&(*ch<0x80)) //0-128 //ascii
    {

       HT_en(ch,a);//传递字符和字符序号
       ch+=1;
    }
    else
    {
      HT_CN(ch);//传递汉字
      ch+=2;
    }
	a++;
  }
   writeScreen();
}
//显示手绘图案
uint8_t hua1616(uint8_t* ch)
{
	uint8_t a=0;//用于计数第几个数
	uint8_t facet[32];//16x16点阵用32个数表示
	uint8_t member=0;

	while((*ch)!='\0')
	{
		if((*ch>0x2f)&&(*ch<0x3a))//数字字符
		{
			member=(*ch-0x30)*0x10;
			ch+=1;
		}
		else//a-f英文字符
		{
			member=(*ch-0x57)*0x10;
			ch+=1;			
		}
		
		if((*ch>0x2f)&&(*ch<0x3a))//数字字符
		{
			member=member+(*ch-0x30);
			ch+=1;
		}
		else//a-f英文字符
		{
			member=member+(*ch-0x57);
			ch+=1;			
		}
		facet[a]=member;
		member=0;
		a++;		
	}
	zi1616(facet);
}

uint8_t String1616(uint8_t* ch,uint8_t a,int16_t sp)
{//               字符串开始指针 （0、1、2、3-左、右、上、下）
	uint16_t b,i;//记录移动的次数
	uint8_t* ch2;//存储字符串开始指针
	uint8_t L=0;
	ch2=ch;
	if((*ch2>0x00)&&(*ch2<0x80)&&(a==1)){L=8;};
	//字母左移时需要
    while((*ch2)!='\0')
	{
    if((*ch2>0x00)&&(*ch2<0x80)) //0-128 //ascii
    {//英文字符
		if(a==0||a==1){b+=8;}//左右移动加8
		else {b+=16;}//上下移动加16
		ch2+=1;
    }
    else
    {//汉字字符
	  b+=16;
	  ch2+=2;
    }
	}
	for(i=0;i<=b-17+L;i++)
	{
	   ziku1616xy(ch,a,i);
	   Delay1ms(sp);
	}
}
#endif