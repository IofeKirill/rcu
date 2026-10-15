#ifndef _LCD320240_H_
#define _LCD320240_H_

#include "stm32f4xx_hal.h"




#define LCD_Width 240
#define LCD_Heigh 320  

//字库起始地址
//define CN16X16_lib 	0x00E00000
//#define ASCII16X8_lib 	0x00E36000

#define FLASH_SECTOR_SIZE   4096
#define CNFONT_START_SECTOR 3584
#define ENFONT_START_SECTOR 3637   //3584 +212/4



#define LCD_BACKLED_GPIO	GPIOE
#define LCD_BACKLED_PIN		6


void Delay (uint32_t nCount);
void LCD_PinInit(void);
void LCD_Init(void);
void SetCS(uint8_t temp);
void Address_set(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2);

void LCD_Pant(uint16_t color); 
void SetBackLed(uint8_t temp);
void LCD_Write_Data16Bit(uint16_t V);//9341

void LCD_5bit(uint16_t x,uint16_t y,uint16_t num,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_DrawRectangle(uint16_t x1,uint16_t y1,uint16_t x2,uint16_t y2,uint16_t color);
void LCD_Picture(uint16_t x,uint16_t y,//图片	起始坐标
		         uint16_t Icon_Width,uint16_t Icon_Height,//图片像素(大小)
		       const uint8_t *image,//图片指针
		         uint8_t Dir,//显示方向,0正常,1水平翻转,2垂直翻转,3旋转180,4左转90,5右转90
				 uint8_t state);//显示状态
void LCD_String(uint8_t x,uint16_t y,char* ch,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_Num(uint16_t x,uint16_t y,int32_t num,uint16_t ch_color,uint16_t bg_color,uint16_t size);
uint8_t LCD_DrawRoundRectangle(uint16_t x,uint16_t y,//起始坐标
		                  uint16_t Width,uint16_t Height,//矩形宽和高
		                  uint8_t radius,//圆角半径
		                  uint16_t color,//矩形颜色
		                  uint8_t fill);//线宽

void UI_LoadWindows(uint16_t x,uint16_t y,uint16_t xlong ,uint16_t ylong,uint16_t color);
void Delay (uint32_t nCount);
void LCD_en(uint8_t x,uint16_t y,uint8_t ch,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_3g(uint8_t x,uint8_t y,uint8_t num,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);

void LCD_BinImage(uint16_t x,uint16_t y,    //起始坐标
		          uint16_t Icon_Width, //图片点阵的宽
		          uint16_t Icon_Height,//图片点阵的高
		          const uint8_t *image,      //图片指针
		          uint16_t fColor,     //前景颜色
		          uint16_t bColor,     //背景颜色
                  uint8_t transparent);//0不透明,1透明，BIT4~BIT7：0不旋转，1水平翻转,2垂直翻转，3旋转180,4左转90度，5右转90度

void LCD_DrawPoint(int16_t x,int16_t y,uint16_t color);
void LCD_8g(uint16_t x,uint16_t y,uint32_t num,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_ProgName(uint8_t x,uint16_t y,char* ch,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_DisplayNum(uint16_t x,uint16_t y,int32_t num,uint16_t ch_color,uint16_t bg_color,uint16_t size);
void LCD_Line(int16_t x1,int16_t y1,int16_t angle,int16_t lenght,uint16_t color,uint8_t size);
void LCD_DisplayString(uint16_t x,uint16_t y,char* ch,uint16_t ch_color,uint16_t bg_color,uint8_t transparent);
void LCD_Display4Chioce(void);
uint8_t RedOneFontXYpixel(uint8_t x,uint16_t y);//读像素点的值//240X320
void SetOneFontXYpixel(uint8_t x,uint16_t y,uint8_t val);//设置屏幕字体像素数组



#endif



