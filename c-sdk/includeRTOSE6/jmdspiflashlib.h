#ifndef _JMDSPIFLASHLIB_H_
#define _JMDSPIFLASHLIB_H_


#include "stm32f4xx_hal.h"

#define FLASH_DEBUG	0
#define Delayns(dt)


//void SetBackLed(uint8_t temp){if(temp){GPIOE->BSRR=GPIO_PIN_6;}else{GPIOE->BSRR=(GPIO_PIN_6<<16);}}

// Select SPI FLASH: ChipSelect pin low
#define Select_Flash()     GPIOB->BSRR=(GPIO_PIN_12<<16)// HAL_GPIO_WritePin(GPIOB,12,GPIO_PIN_RESET);//mp_hal_pin_low(pin_B12)
// Deselect SPI FLASH: ChipSelect pin high
#define NotSelect_Flash()  GPIOB->BSRR=GPIO_PIN_12// HAL_GPIO_WritePin(GPIOB,12,GPIO_PIN_SET);// mp_hal_pin_high(pin_B12)

#define sFLASH_PAGES_PER_SECTOR 16
#define sFLASH_PAGE_SIZE 256
#define sFLASH_ERASE_PAGE_SIZE 4096
#define sFLASH_SECTOR_SIZE   4096



typedef enum
{//带*号为必须片选NSS必须在1Byte发送命令发生前拉低,发送完毕之后拉高
	SF_CMD_WREN=0X06,//写使能*
	SF_CMD_WRDIS=0X04,//写禁止*
	SF_CMD_RDID1=0X9F,//读ID
	SF_CMD_RDID2=0X9E,
	SF_CMD_RDSR=0X05,//读状态寄存器
	SF_CMD_WRSR=0X01,//写状态寄存器*
	SF_CMD_WRLR=0XE5,//写锁存器*
	SF_CMD_RDLR=0XE8,//读锁存器
	SF_CMD_RDDB=0X03,//读数据字节
	SF_CMD_RDDBHS=0X0B,//高速读数据字节
	SF_CMD_DOFRD=0X3B,//双输出快速读
	SF_CMD_RDOTP=0X4B,//读操作字节
	SF_CMD_PROOTP=0X42,//操作字节编程*
	SF_CMD_PP=0X02,//页编程*
	SF_CMD_DIFP=0XA2,//双输入快速编程*
	SF_CMD_SUBSERASE=0X20,//擦除扇区4K*
	SF_CMD_SERASE=0XD8,//块擦除4K*16=64K
	SF_CMD_BULKERASE=0XC7,//完全擦除*
	SF_CMD_DPD=0XB9,//睡眠*
	SF_CMD_RDPD=0XAB//激活
}SPI_FLASH_CMD_DEFINED;
#define SF_SR_BUSY		0X01//0x03
#define SF_SR_WIP			0X01//Write in progress bit
#define SF_SR_WEL			0X02//Write enable latch bit
#define SF_SR_BP012		0X1C//Block protect bits
#define SF_SR_TB			0X20//Top/bottom bit
#define SF_SR_SRWD  	0X80//Status register write protect
	//Dataflash指令表
#define Cmd_DF_PageRead         0xD2
#define Cmd_DF_Buffer1Read      0xD1
#define Cmd_DF_Buffer2Read      0xD3
#define Cmd_DF_WriteBuffer1     0x84
#define Cmd_DF_WriteBuffer2     0x87
#define Cmd_DF_Buffer1ToPage  	0x83
#define Cmd_DF_Buffer2ToPage  	0x86
#define Cmd_DF_PageErase        0x81
#define Cmd_DF_BlockErase       0x50
#define Cmd_DF_SectorErase      0x7C
#define Cmd_DF_AllErase         0xC7
#define Cmd_DF_ReadState        0xD7
#define Cmd_DF_ReadID           0x9F//*/
	
#define Dummy_Byte 0xA5


typedef enum
{
	SPI_ERROR=0,
	SPI_SUCCESS,
	SPI_OVERTIME
}SPI_FLASH_DEFINED;


void sFlash_Init(void);
uint32_t sFlashReadID(void);
uint8_t sFlashWaitBusy(void);//20140329
uint8_t sFlash_Read_Sector(uint32_t nSector, uint8_t* pBuffer);
uint8_t sFlash_ReadMultiBytes(uint32_t Addr,uint16_t lenght,uint8_t* pBuffer);
void sFlashWriteStatusReg(uint8_t sr);



#endif
//*********************************************************************************************

