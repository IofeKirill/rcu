#ifndef _MFRC522_H_
#define _MFRC522_H_


#include "I2C_Soft.h"


/////////////////////////////////////////////////////////////////////
//MF522命令字
/////////////////////////////////////////////////////////////////////
#define PCD_IDLE              0x00               //取消当前命令
#define PCD_AUTHENT           0x0E               //验证密钥
#define PCD_RECEIVE           0x08               //接收数据
#define PCD_TRANSMIT          0x04               //发送数据
#define PCD_TRANSCEIVE        0x0C               //发送并接收数据
#define PCD_RESETPHASE        0x0F               //复位
#define PCD_CALCCRC           0x03               //CRC计算

/////////////////////////////////////////////////////////////////////
//Mifare_One卡片命令字
/////////////////////////////////////////////////////////////////////
#define PICC_REQIDL           0x26               //寻天线区内未进入休眠状态
#define PICC_REQALL           0x52               //寻天线区内全部卡
#define PICC_ANTICOLL1        0x93               //防冲撞
#define PICC_ANTICOLL2        0x95               //防冲撞
#define PICC_AUTHENT1A        0x60               //验证A密钥
#define PICC_AUTHENT1B        0x61               //验证B密钥
#define PICC_READ             0x30               //读块
#define PICC_WRITE            0xA0               //写块
#define PICC_DECREMENT        0xC0               //扣款
#define PICC_INCREMENT        0xC1               //充值
#define PICC_RESTORE          0xC2               //调块数据到缓冲区
#define PICC_TRANSFER         0xB0               //保存缓冲区中数据
#define PICC_HALT             0x50               //休眠

/////////////////////////////////////////////////////////////////////
//MF522 FIFO长度定义
/////////////////////////////////////////////////////////////////////
#define DEF_FIFO_LENGTH       64                 //FIFO size=64byte

/////////////////////////////////////////////////////////////////////
//MF522寄存器定义
/////////////////////////////////////////////////////////////////////
// PAGE 0
#define     RFU00                 0x00    
#define     CommandReg            0x01//启动和停止命令的执行   
#define     ComIEnReg             0x02// 中断请求传递的使能和禁能控制位    
#define     DivlEnReg             0x03// 中断请求传递的使能和禁能控制位    
#define     ComIrqReg             0x04// 包含中断请求标志    
#define     DivIrqReg             0x05// 包含中断请求标志
#define     ErrorReg              0x06// 错误标志，指示执行的上个命令的错误状态    
#define     Status1Reg            0x07// 包含通信的状态标志    
#define     Status2Reg            0x08// 包含接收器和发送器的状态标志    
#define     FIFODataReg           0x09// 64字节FIFO缓冲区的输入和输出
#define     FIFOLevelReg          0x0A// 指示FIFO中存储的字节数
#define     WaterLevelReg         0x0B
#define     ControlReg            0x0C
#define     BitFramingReg         0x0D
#define     CollReg               0x0E
#define     RFU0F                 0x0F
// PAGE 1     
#define     RFU10                 0x10
#define     ModeReg               0x11
#define     TxModeReg             0x12
#define     RxModeReg             0x13
#define     TxControlReg          0x14
#define     TxAutoReg             0x15
#define     TxSelReg              0x16
#define     RxSelReg              0x17
#define     RxThresholdReg        0x18
#define     DemodReg              0x19
#define     RFU1A                 0x1A
#define     RFU1B                 0x1B
#define     MifareReg             0x1C
#define     RFU1D                 0x1D
#define     RFU1E                 0x1E
#define     SerialSpeedReg        0x1F
// PAGE 2    
#define     RFU20                 0x20  
#define     CRCResultRegM         0x21
#define     CRCResultRegL         0x22
#define     RFU23                 0x23
#define     ModWidthReg           0x24
#define     RFU25                 0x25
#define     RFCfgReg              0x26
#define     GsNReg                0x27
#define     CWGsCfgReg            0x28
#define     ModGsCfgReg           0x29
#define     TModeReg              0x2A
#define     TPrescalerReg         0x2B
#define     TReloadRegH           0x2C
#define     TReloadRegL           0x2D
#define     TCounterValueRegH     0x2E
#define     TCounterValueRegL     0x2F
// PAGE 3      
#define     RFU30                 0x30
#define     TestSel1Reg           0x31
#define     TestSel2Reg           0x32
#define     TestPinEnReg          0x33
#define     TestPinValueReg       0x34
#define     TestBusReg            0x35
#define     AutoTestReg           0x36
#define     VersionReg            0x37
#define     AnalogTestReg         0x38
#define     TestDAC1Reg           0x39  
#define     TestDAC2Reg           0x3A   
#define     TestADCReg            0x3B   
#define     RFU3C                 0x3C   
#define     RFU3D                 0x3D   
#define     RFU3E                 0x3E   
#define     RFU3F		          0x3F


#define     REQ_ALL               0x52
#define     KEYA                  0x60

/////////////////////////////////////////////////////////////////////
//和MF522通讯时返回的错误代码
/////////////////////////////////////////////////////////////////////
#define MI_OK                          0
#define MI_NOTAGERR                    (-1)
#define MI_ERR                         (-2)

/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
#define MAXRLEN 18
#define SLA_ADDR 0x50

unsigned char I2CRdStr(unsigned char ucSla,unsigned char ucAddress,unsigned char *ucBuf,unsigned char ucCount,Soft_I2C_Typedef *iic_typedef)
{  //从有子地址的器件读取数据  PCF8563的地址为0xa2,
	unsigned char i=0;
	
	Soft_I2C_Start(iic_typedef); 
	Soft_I2C_Write(iic_typedef,ucSla);
    Soft_I2C_Write(iic_typedef,ucAddress);

    Soft_I2C_Start(iic_typedef);
	Soft_I2C_Write(iic_typedef,ucSla+1);

    i=ucCount-1;
	while(i--)
	{
	*ucBuf=Soft_I2C_Read(iic_typedef,0);//读从器件寄存器
    ucBuf++;
	}
	*ucBuf=Soft_I2C_Read(iic_typedef,1);

    Soft_I2C_Stop(iic_typedef);
	return 1;
}
unsigned char I2CWrStr(unsigned char ucSla,unsigned char ucAddress,unsigned char *ucData,unsigned char ucNo,Soft_I2C_Typedef *iic_typedef)
{ //从有子地址的器件写入数据 8563的地址为0xa2
	unsigned char i;	

	Soft_I2C_Start(iic_typedef);
	Soft_I2C_Write(iic_typedef,ucSla);
	Soft_I2C_Write(iic_typedef,ucAddress);

	i=ucNo;
	while(i--)
	{
		Soft_I2C_Write(iic_typedef,*ucData);
	    ucData++;
	}
	Soft_I2C_Stop(iic_typedef);
	return 1;
}
////////////////////////////////////////寄存器操作///////////////////////////////////////////////////////////////////////////////////////////////
unsigned char ReadRawRC(unsigned char Address,Soft_I2C_Typedef *iic_typedef)//读RC632寄存器
{
	unsigned char tmp;
	//unsigned int i;
    I2CRdStr(SLA_ADDR,Address,&tmp,0x01,iic_typedef);
	//i++;i++;i++;
	return tmp;
}
unsigned char WriteRawRC(unsigned char Address, unsigned char value,Soft_I2C_Typedef *iic_typedef)//写RC632寄存器
{
    unsigned char tmp;
	tmp=I2CWrStr(SLA_ADDR,Address,&value,0x01,iic_typedef);
	return tmp;
}
unsigned char SetBitMask(unsigned char reg,unsigned char mask,Soft_I2C_Typedef *iic_typedef)//置RC522寄存器位  
{
    char tmp = 0x0,tmpp;
    tmp = ReadRawRC(reg,iic_typedef);
	Delay1ms(5);
    tmpp=WriteRawRC(reg,tmp | mask,iic_typedef);  // set bit mask
	return tmpp;
}
unsigned char ClearBitMask(unsigned char reg,unsigned char mask,Soft_I2C_Typedef *iic_typedef)//清RC522寄存器位  
{
    unsigned char tmp = 0x0,tmpp;
    tmp = ReadRawRC(reg,iic_typedef);//读RC632寄存器
	Delay1ms(5);
    tmpp=WriteRawRC(reg, tmp & ~mask,iic_typedef);  // clear bit mask //写RC632寄存器
	return tmpp;
}
//////////////////////////////////////// 通过RC522和ISO14443卡通讯//////////////////////////////////////////////////////////////////////////////////////////////////
// 通过RC522和ISO14443卡通讯
char PcdComMF522(unsigned char Command,// Command[IN]:RC522命令字
                 unsigned char *pInData,//pInData[IN]:通过RC522发送到卡片的数据
                 unsigned char InLenByte,// InLenByte[IN]:发送数据的字节长度
                 unsigned char *pOutData,//pOutData[OUT]:接收到的卡片返回数据
                 unsigned char *pOutLenBit,//*pOutLenBit[OUT]:返回数据的位长度
				 Soft_I2C_Typedef *iic_typedef)
{
    char status = MI_ERR;
    unsigned char irqEn   = 0x00;
    unsigned char waitFor = 0x00;
    unsigned char lastBits;
    unsigned char n;
    unsigned int i;
	unsigned char tmp;
    switch (Command)
    {
       case PCD_AUTHENT: //0x0E 验证密钥
          irqEn   = 0x12;
          waitFor = 0x10;
          break;
       case PCD_TRANSCEIVE: //0x0C发送并接收数据
          irqEn   = 0x77;
          waitFor = 0x30;
          break;
       default:
         break;
    }
   
    WriteRawRC(ComIEnReg,irqEn|0x80,iic_typedef);//写RC632寄存器
    ClearBitMask(ComIrqReg,0x80,iic_typedef); //清RC522寄存器位
    WriteRawRC(CommandReg,PCD_IDLE,iic_typedef);//写RC632寄存器 0x01,PCD_IDLE 0x00 取消当前命令
    SetBitMask(FIFOLevelReg,0x80,iic_typedef);//置RC522寄存器位
    
    for (i=0; i<InLenByte; i++)//InLenByte函数给出，这里置1
    {   WriteRawRC(FIFODataReg, pInData[i],iic_typedef);//写RC632寄存器 0x09,写指令    
	}
    WriteRawRC(CommandReg, Command,iic_typedef);//写RC632寄存器 0x01,数据的内容 
   
    
    if (Command == PCD_TRANSCEIVE)//PCD_TRANSCEIVE 0x0C 发送并接收数据
    {    SetBitMask(BitFramingReg,0x80,iic_typedef);  }//置RC522寄存器位 0x0D,
    
    //    i = 600;//根据时钟频率调整，操作M1卡最大等待时间25ms
    i = 2000;
    do 
    {
         n = ReadRawRC(ComIrqReg,iic_typedef);//读RC632寄存器,0x04
		 Delay1ms(5);
         i--;
    }
    while ((i!=0) && !(n&0x01) && !(n&waitFor));//0x00

    ClearBitMask(BitFramingReg,0x80,iic_typedef);//清RC522寄存器位
	      
    if (i!=0)
    {    
         if(!(ReadRawRC(ErrorReg,iic_typedef)&0x1B))//读RC632寄存器,错误标志，指示执行的上个命令的错误状态
         {
             status = MI_OK;
             if (n & irqEn & 0x01)
             {   status = MI_NOTAGERR;   }
             if (Command == PCD_TRANSCEIVE)//发送并接收数据
             {
               	n = ReadRawRC(FIFOLevelReg,iic_typedef);
              	lastBits = ReadRawRC(ControlReg,iic_typedef) & 0x07;
                if (lastBits)
                {   *pOutLenBit = (n-1)*8 + lastBits;   }
                else
                {   *pOutLenBit = n*8;   }
                if (n == 0)
                {   n = 1;    }
                if (n > MAXRLEN)
                {   n = MAXRLEN;   }
                for (i=0; i<n; i++)
                {   pOutData[i] = ReadRawRC(FIFODataReg,iic_typedef);    }
             }
         }
         else
         {   
			status = MI_ERR;			
		 }
        
   }
   SetBitMask(ControlReg,0x80,iic_typedef);           // stop timer now
   WriteRawRC(CommandReg,PCD_IDLE,iic_typedef); 
   return status;
}

/////////////////////////////////////////////寻卡////////////////////////////////////////////////////////////////////////////////////////////////////////
char PcdRequest(unsigned char req_code,unsigned char *pTagType,Soft_I2C_Typedef *iic_typedef)
{
   char status;  
   unsigned int  unLen,i=20;
   unsigned char ucComMF522Buf[MAXRLEN],tmp;//18 															//0111
   ClearBitMask(Status2Reg,0x08,iic_typedef);//清RC522寄存器位 0x08,0x08 //需要先读取内容，再把内容与~0x08相与后写入寄存器

   WriteRawRC(BitFramingReg,0x07,iic_typedef);//写RC632寄存器  0x0D,0x07 //写命令，地址0x0D，内容0x07

   SetBitMask(TxControlReg,0x03,iic_typedef);//	置RC522寄存器位	 0x14，0x03 //需要先读取内容，再把内容与0x03相或后写入寄存器
 
   ucComMF522Buf[0] = req_code;

   status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,1,ucComMF522Buf,&unLen,iic_typedef);//通过RC522和ISO14443卡通讯

   if ((status == MI_OK) && (unLen == 0x10))
   {    
       *pTagType     = ucComMF522Buf[0];
       *(pTagType+1) = ucComMF522Buf[1];
   }
   else
   {   
		//status = MI_ERR;		
   }
   
   return status;
}
/////////////////////////////////////////防冲撞///////////////////////////////////////////////////////////////////////////////////////////////////////////////
u8 PcdAnticoll(unsigned char *pSnr,Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned char i,snr_check=0;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN];
    
    ClearBitMask(Status2Reg,0x08,iic_typedef);//清RC522寄存器位
    WriteRawRC(BitFramingReg,0x00,iic_typedef);//写RC632寄存器
    ClearBitMask(CollReg,0x80,iic_typedef);//清RC522寄存器位
 
    ucComMF522Buf[0] = PICC_ANTICOLL1;
    ucComMF522Buf[1] = 0x20;

    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,2,ucComMF522Buf,&unLen,iic_typedef);
	Delay1ms(5);

    if (status == MI_OK)
    {
    	 for (i=0; i<4; i++)
         {   
             *(pSnr+i)  = ucComMF522Buf[i];
             snr_check ^= ucComMF522Buf[i];
         }
         if (snr_check != ucComMF522Buf[i])
         {   status = MI_ERR;    }
    }
    
    SetBitMask(CollReg,0x80,iic_typedef);//置RC522寄存器位
    return status;
}
/////////////////////////////////////////////用MF522计算CRC16函数///////////////////////////////////////
void CalulateCRC(unsigned char *pIndata,unsigned char len,unsigned char *pOutData,Soft_I2C_Typedef *iic_typedef)
{
    unsigned char i,n;
    ClearBitMask(DivIrqReg,0x04,iic_typedef);
    WriteRawRC(CommandReg,PCD_IDLE,iic_typedef);
    SetBitMask(FIFOLevelReg,0x80,iic_typedef);
    for (i=0; i<len; i++)
    {   WriteRawRC(FIFODataReg, *(pIndata+i),iic_typedef);   }
    WriteRawRC(CommandReg, PCD_CALCCRC,iic_typedef);
    i = 0xFF;
    do 
    {
        n = ReadRawRC(DivIrqReg,iic_typedef);
        i--;
    }
    while ((i!=0) && !(n&0x04));
    pOutData[0] = ReadRawRC(CRCResultRegL,iic_typedef);
    pOutData[1] = ReadRawRC(CRCResultRegM,iic_typedef);
}
/////////////////////////////////////////////命令卡片进入休眠状态///////////////////////////////////////////////
char PcdHalt(Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = PICC_HALT;
    ucComMF522Buf[1] = 0;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2],iic_typedef);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen,iic_typedef);

    return MI_OK;
}


/////////////////////////////////////////////选定卡片////////////////////////////////////////////////////////////////////////////////////////////////////////
char PcdSelect(unsigned char *pSnr,Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned char i;
    unsigned int  unLen;
    unsigned char ucComMF522Buf[MAXRLEN]; 
    
    ucComMF522Buf[0] = PICC_ANTICOLL1;
    ucComMF522Buf[1] = 0x70;
    ucComMF522Buf[6] = 0;
    for (i=0; i<4; i++)
    {
    	ucComMF522Buf[i+2] = *(pSnr+i);
    	ucComMF522Buf[6]  ^= *(pSnr+i);
    }
    CalulateCRC(ucComMF522Buf,7,&ucComMF522Buf[7],iic_typedef);
  
    ClearBitMask(Status2Reg,0x08,iic_typedef);

    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,9,ucComMF522Buf,&unLen,iic_typedef);
    
    if ((status == MI_OK) && (unLen == 0x18))
    {   status = MI_OK;  }
    else
    {   status = MI_ERR;    }

    return status;
}
/////////////////////////////////////////////验证卡片密码////////////////////////////////////////
char PcdAuthState(unsigned char auth_mode,unsigned char addr,unsigned char *pKey,unsigned char *pSnr,Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = auth_mode;
    ucComMF522Buf[1] = addr;
    for (i=0; i<6; i++)
    {    ucComMF522Buf[i+2] = *(pKey+i);   }
    for (i=0; i<6; i++)
    {    ucComMF522Buf[i+8] = *(pSnr+i);   }
    
    status = PcdComMF522(PCD_AUTHENT,ucComMF522Buf,12,ucComMF522Buf,&unLen,iic_typedef);
    if ((status != MI_OK) || (!(ReadRawRC(Status2Reg,iic_typedef) & 0x08)))
    {   status = MI_ERR;   }
    
    return status;
}
/////////////////////////////////////////////读取M1卡一块数据////////////////////////////////////////
char PcdRead(unsigned char addr,unsigned char *pData,Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 

    ucComMF522Buf[0] = PICC_READ;//读块
    ucComMF522Buf[1] = addr;//写地址
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2],iic_typedef);
   
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen,iic_typedef);
    if ((status == MI_OK) && (unLen == 0x90))
 //   {   memcpy(pData, ucComMF522Buf, 16);   }
    {
        for (i=0; i<16; i++)
        {    *(pData+i) = ucComMF522Buf[i];   }
    }
    else
    {   
		status = MI_ERR;   
	}
    
    return status;
}
/////////////////////////////////////////////写数据到M1卡一块////////////////////////////////////////
char PcdWrite(unsigned char addr,unsigned char *pData,Soft_I2C_Typedef *iic_typedef)
{
    char status;
    unsigned int  unLen;
    unsigned char i,ucComMF522Buf[MAXRLEN]; 
    
    ucComMF522Buf[0] = PICC_WRITE;
    ucComMF522Buf[1] = addr;
    CalulateCRC(ucComMF522Buf,2,&ucComMF522Buf[2],iic_typedef);
 
    status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,4,ucComMF522Buf,&unLen,iic_typedef);

    if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
    {   
		//status = MI_ERR;   
	}
        
    if (status == MI_OK)
    {
        //memcpy(ucComMF522Buf, pData, 16);
        for (i=0; i<16; i++)
        {    ucComMF522Buf[i] = *(pData+i);   }
        CalulateCRC(ucComMF522Buf,16,&ucComMF522Buf[16],iic_typedef);

        status = PcdComMF522(PCD_TRANSCEIVE,ucComMF522Buf,18,ucComMF522Buf,&unLen,iic_typedef);
        if ((status != MI_OK) || (unLen != 4) || ((ucComMF522Buf[0] & 0x0F) != 0x0A))
        {   
			//status = MI_ERR;   
		}
    }
    
    return status;
}
/////////////////////////////////////////////设置RC632的工作方式////////////////////////////////////////
char M500PcdConfigISOType(unsigned char type,Soft_I2C_Typedef *iic_typedef)
{
   unsigned char i;
   if (type == 'A')                     //ISO14443_A
   { 
       ClearBitMask(Status2Reg,0x08,iic_typedef);
       WriteRawRC(ModeReg,0x3D,iic_typedef);//3F
       WriteRawRC(RxSelReg,0x86,iic_typedef);//84
       WriteRawRC(RFCfgReg,0x7F,iic_typedef);   //4F
   	   WriteRawRC(TReloadRegL,30,iic_typedef);//tmoLength);// TReloadVal = 'h6a =tmoLength(dec) 
	   WriteRawRC(TReloadRegH,0,iic_typedef);
       WriteRawRC(TModeReg,0x8D,iic_typedef);
	   WriteRawRC(TPrescalerReg,0x3E,iic_typedef);

	   delay_10ms(1);
	   i = ReadRawRC(TxControlReg,iic_typedef);
	   if (!(i & 0x03))
	   {
		  SetBitMask(TxControlReg, 0x03,iic_typedef);
	   }
   }
   else{ return -1; }
   
   return MI_OK;
}
/////////////////////////////////////////////等待卡离开////////////////////////////////////////
void WaitCardOff(Soft_I2C_Typedef *iic_typedef)
{
	char status, TagType[2];

	while(1)
	{
		status = PcdRequest(REQ_ALL, TagType, iic_typedef);
		if(status)
		{
			status = PcdRequest(REQ_ALL, TagType, iic_typedef);
			if(status)
			{
				status = PcdRequest(REQ_ALL, TagType, iic_typedef);
				if(status)
				{
					return;
				}
			}
		}
		delay_10ms(1);
	}
}
/////////////////////////////////////////////Delay 10ms/////////////////////////
void delay_10ms(unsigned int _10ms)
{
	unsigned int i, j;

	for(i=0; i<_10ms; i++)
	{
		for(j=0; j<10000; j++);
	}
}
#endif
