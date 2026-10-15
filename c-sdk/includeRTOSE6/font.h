#ifndef _FONT_H_
#define _FONT_H_




uint8_t g_AsciiFontType=0;//默认小字体 //ASCII 8*16
uint8_t g_ChineseFontType=0;////默认小字体 //中文 16*16
uint16_t width=8;
uint16_t height=16;

/*
typedef enum
{
	TYPE_ASCII_8X16=0,//ASCII 8*16
	TYPE_CN_16X16=1,//中文 16*16
	TYPE_ASCII_16X32=2,//ASCII 16*32
	TYPE_CN_32X32=3,//中文 32*32
	TYPE_ASCII_128X256=4,//ASCII 128*256
	TYPE_CN_32X32=5,//中文 256*256
}Font_Type_Defined;
*/

//设置字体大小
//type =0(小字体8X16)/1(大字体32X32)/2(超大字体256X256)
void SetFlashFontSize(uint16_t type)
{
	g_AsciiFontType=type;
	g_ChineseFontType=type;
	switch(g_AsciiFontType)//
	{
		case 0:width=8;height=16;   	break;
		case 1:width=16;height=32;	    break;
		case 2:width=32;height=64;  	break;
		case 3:width=64;height=128;	    break;
		case 4:width=128;height=256;	break;		
		default:width=8;height=16;	    break;
	}

}

//字体当前分辨率
uint16_t GetFontLibWidth(void){return width;}
uint16_t GetFontLibHeight(void){return height;}







#endif
