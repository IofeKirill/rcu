#ifndef _JMDPICLIB_H_
#define _JMDPICLIB_H_

#include <stdlib.h>
#include"diskio.h"
#include"ff.h"
//#include"jmdspiflashlib.h"
#include"jmdtjpgdlib.h"
#include"jmdbmp.h"
#include"jmdjpeg.h"
#include "LCD320240.h"

void (*task_display_pictures_hook)(void);//显示图片勾函数
//#define Debug_printf	//Printf//调试
uint32_t  (*ui_display_jpeg_hook)(FIL* f_fatfile,//指向JPEG图片文件的指针
		                      				const char* filename,//JPEG图片文件的名称
		                      				UINT xstart,UINT ystart,
		                      				BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
		                      				void* pool,//指向本次解压工作区的指针(4字节对齐)
		                      				UINT sz_pool
#if JD_TBLZI==0
,	PicBuffer_Typedef *p_inpool//图片缓存
#endif//JD_TBLZI==0
		                      				);//解压工作区的大小
uint32_t  (*ui_display_bmp_hook)(	FIL* f_fatfile,//指向JPEG图片文件的指针
		                      				const char* filename,//JPEG图片文件的名称
		                      				UINT xstart,UINT ystart,
		                      				BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
		                      				void* pool,//指向本次解压工作区的指针(4字节对齐)
		                      				UINT sz_pool);//解压工作区的大小
//void SetDisplayJpegFunHook(void (*hook)(void)){if(ui_display_jpeg_hook!=hook)ui_display_jpeg_hook=hook;}
//void SetDisplayBmpFunHook(void (*hook)(void)){if(ui_display_bmp_hook!=hook)ui_display_bmp_hook=hook;}
int SetDisplayFunHook(int n,void (*hook)(void))//设置显示勾函数
{
	switch(n)
	{
		case 0:if(lcd_set_display_windows_hook!=hook)lcd_set_display_windows_hook=hook;	break;
		case 1:if(lcd_wr_data_hook!=hook)lcd_wr_data_hook=hook;													break;
		case 2:if(lcd_setcs_hook!=hook)lcd_setcs_hook=hook;															break;
		case 3:if(lcd_rtos_enter_hook!=hook)lcd_rtos_enter_hook=hook;										break;
		case 4:if(lcd_rtos_exit_hook!=hook)lcd_rtos_exit_hook=hook;											break;
		case 5:if(ui_display_jpeg_hook!=hook)ui_display_jpeg_hook=hook;									break;
		case 6:if(ui_display_bmp_hook!=hook)ui_display_bmp_hook=hook;										break;
		case 7://if(task_display_pictures_hook!=NULL)return 0;
			     if(task_display_pictures_hook!=hook)task_display_pictures_hook=hook;			break;//
		default:return 0;																																break;
	}
	return 1;
}
/*********************************************************************************************
  函数名称:  UI_DisplayPicture
  函数功能:  在主函数中调用的JPEG/bmp图片显示函数
  入口参数:  filename：图片文件的名称
           xstart,ystart 图片左上角起始坐标
           scale：图片缩放比例0-3 : 1,1/2,1/4,1/8
           pool:自定义图片缓存(4字节对齐),缓存要足够大,JPEG图片要3100以上，所以建议用3100，BMP要求缓存大小不小于1行图像数据
           sz_pool：缓存大小
  出口参数: JDR_OK = 0,	0: Succeeded 成功
					JDR_INTR,	 	1: Interrupted by output function 被输出函数中断
					JDR_INP,	 	2: Device error or wrong termination of input stream 磁盘错误，或输入数据错误
					JDR_MEM1,	 	3: Insufficient memory pool for the image 为解码工作配置的工作区大小不够
					JDR_MEM2,	 	4: Insufficient stream input buffer 输入缓冲区的容量过小，JD_SZBUF数据过小
					JDR_PAR,	 	5: Parameter error 参数错误
					JDR_FMT1,	 	6: Data format error (may be damaged data) 图片数据错误
					JDR_FMT2,	 	7: Right format but not supported 不支持的图片类型
					JDR_FMT3,	 	8: Not supported JPEG standard 不支持的图片格式
					JDR_SCALE, 	9: 图片缩放比例过大
					JDR_NO_FILE	10: 打开图片失败
  全局变量:	   无
  备注说明: JPEG格式说明只支持Baseline DCT(离散余弦变换)有损压缩，BMP格式只支持无损(即没有经过压缩)的16位/24位/32位真彩图
*********************************************************************************************/
//extern FATFS fatfs;   // Work area (file system object) for logical drive
//extern FIL f_fatfile;       // File object
FATFS fatfs;   // Work area (file system object) for logical drive
FIL f_fatfile;		 // File object

uint32_t  UI_DisplayPicture(const char* filename,//图片文件的名称(不超过8Byte,不能为中文,后缀不能超过3Byte)
		                      	UINT xstart,UINT ystart,//图片左上角起始坐标
		                      	BYTE scale,//图像缩放比例0-3 : 1,1/2,1/4,1/8
		                      	void* pool,//指向本次解压工作区的指针(4字节对齐)
		                      	UINT sz_pool
#if JD_TBLZI==0
,	PicBuffer_Typedef *p_inpool//图片缓存
#endif//JD_TBLZI==0
		                      	)//解压工作区的大小
{
    FRESULT   Res_FatFs;//FATFS系统函数返回值
    BYTE buff[2];
    UINT res;
    pool=pool;
//  	FATFS fatfs;   // Work area (file system object) for logical drive
//    FIL f_fatfile;       // File object
	//FATFS *fatfs;   // Work area (file system object) for logical drive
	//FIL *f_fatfile;		 // File object

	//fatfs = malloc(sizeof(FATFS));
	//f_fatfile = malloc(sizeof(FIL));

    res=f_mount(&fatfs, "", 1);//挂载文件系统
  	if(res!=FR_OK)//挂载失败直接返回
  	{
#ifdef Debug_printf
  		Debug_printf("挂载失败\r\n");
#endif//#ifdef Debug_printf
  		return JDR_INP;
  	}
//使用FATFS的f_open函数以读方式打开文件
#ifdef Debug_printf
    Debug_printf("f_open %s\r\n",filename);
#endif//#ifdef Debug_printf
    Res_FatFs = f_open(&f_fatfile,filename,FA_READ);
    if(Res_FatFs!= FR_OK) //打开文件失败，返回
    {
    	res=JDR_NO_FILE;
    }
    else
    {
#ifdef Debug_printf
			Debug_printf("打开%s=%d\r\n",filename,Res_FatFs);
#endif//#ifdef Debug_printf
			if (f_readfilebuffer(&f_fatfile, buff, 2,0) != 2) return JDR_INP;
			if (f_readfilebuffer(&f_fatfile, NULL, 0,1) != 0) return JDR_INP;//reset读指针
			//if(f_read(&f_fatfile, buff, 2, &res)!=FR_OK||res!=2)return JDR_INP;;
			//if(f_lseek(&f_fatfile, 0)!=FR_OK)return JDR_INP;//reset读指针
			extern const BYTE Zig[64]		;extern const WORD Ipsf[64];
			switch(LD_WORD(buff))
			{
				case 0xD8FF://JPG
					if(ui_display_jpeg_hook==0)res=JDR_FMT3;else
					res=ui_display_jpeg_hook( &f_fatfile,//指向JPEG图片文件的指针
																		filename,//JPEG图片文件的名称
																		xstart, ystart,
																		scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
																		pool,//指向本次解压工作区的指针(4字节对齐)
																		sz_pool
#if JD_TBLZI==0
,	 p_inpool
#endif//JD_TBLZI==0
																		);
				break;
				case 0x4D42://BMP
					if(ui_display_bmp_hook==0)res=JDR_FMT3;else
					res=ui_display_bmp_hook(&f_fatfile,//指向JPEG图片文件的指针
																	filename,//JPEG图片文件的名称
																	xstart, ystart,
																	scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
																	pool,//指向本次解压工作区的指针(4字节对齐)
																	sz_pool);
				break;
			}
    }
    f_close(&f_fatfile);//关闭打开的图片
  	f_mount(NULL, "",NULL);
    return res;
}
void os_picture_task(void)//多任务处理图像
{
	//u32 i;
	while(1)
	{
		if(task_display_pictures_hook!=0)task_display_pictures_hook();
		//vPortYield();
		//LCD_DisplayNum(0,0,task_display_pictures_hook,0XFFFF,0,0X08);
	}
}



/*
typedef struct
{
	int x, y;
	char *filename;
	char scale;
	int state;//显示状态
} Pic_Typedef;
Pic_Typedef p_Pic;///*/
int16_t _p_Pic_x,_p_Pic_y,_p_Pic_state=0;
int8_t *_p_Pic_filename,_p_Pic_scale=0;
uint8_t _displaypictureflag=0;
#define DispalyPicFlag  			_displaypictureflag
#define SetDispalyPicFlag(n)  (_displaypictureflag=n)
#define DispalyPicState  			_p_Pic_state
int SetDisplayPictureBuffer(int x,int y,//图片起始坐标X=0-239，Y=0-319
												    const char* filename,//图片文件的名称(字符串类型),名称不能有中文，图片名称不能超过8个字节,后缀不能超过3个字节
												    char scale)//图像缩放比例0-3 : 1,1/2,1/4,1/8
{
	_p_Pic_x=x;_p_Pic_y=y;
	_p_Pic_filename=filename;
	_p_Pic_scale=scale;
	_p_Pic_state=0;//清状态
}
int ReadDisplayPictureFlag(void) 	    {return DispalyPicFlag;}
void SetDisplayPictureFlag(int n)     {SetDispalyPicFlag(n);}
void WaitDisplayPictureFinish(void)   {while(DispalyPicFlag);}
int ReadDisplayPictureState(void)     {return DispalyPicState;}
void SetDisplayPictureState(int res)  {DispalyPicState=res;}
int  SysLcdDisplayPicture(void* pool,//指向本次解压工作区的指针(4字节对齐)
		                      UINT sz_pool)//解压工作区的大小
{
	return (int)UI_DisplayPicture(_p_Pic_filename,//图片文件的名称(不超过8Byte,不能为中文,后缀不能超过3Byte)
      													_p_Pic_x,_p_Pic_y,//图片左上角起始坐标
      													_p_Pic_scale,//图像缩放比例0-3 : 1,1/2,1/4,1/8
      													pool,//指向本次解压工作区的指针(4字节对齐)
      													sz_pool);
}


int Call_DisplayPicture(void)
{
	  if(ReadDisplayPictureFlag()==0)return -1;//等待一张图片显示完毕
	  os_task_enter_critical();//显示过程中要禁止其它任务调度
	  int16_t res;
	  BYTE ImageBuffer[3100] __attribute__ ((aligned(4)));//为图片显示设定缓存,缓存要4字节对齐，并且要足够大
	  //调用图片解码和显示函数
	  res=SysLcdDisplayPicture(ImageBuffer,//指向本次解压工作区的指针(4字节对齐)
								   sizeof(ImageBuffer));//解压工作区的大小
	  SetDisplayPictureFlag(0);
	  SetDisplayPictureState(res);
	  os_task_exit_critical();//退出临界
	  return res;
}


int StartDisplayPicture(int x,int y,//图片起始坐标X=0-239，Y=0-319
											  const char* filename,//图片文件的名称(字符串类型),名称不能有中文，图片名称不能超过8个字节,后缀不能超过3个字节
											  char scale)//图像缩放比例0-3 : 1,1/2,1/4,1/8
{
	  SetDisplayPictureBuffer(x,y,filename,scale);
	  //先设定相关函数
	  SetDisplayFunHook(0,Address_set);
	  SetDisplayFunHook(1,LCD_Write_Data16Bit);
	  SetDisplayFunHook(2,SetCS);
	  SetDisplayFunHook(5,UI_Display_Jpeg);
	  SetDisplayFunHook(6,UI_Display_Bmp);
	  SetDisplayFunHook(7,Call_DisplayPicture);
	  Create_PicTask();
	  vPortYield();//让出任务,执行显示任务//LXW+
}

						  
#endif//_JMDPICTURE_H_
