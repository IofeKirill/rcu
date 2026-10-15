#ifndef _JMDJPEG_H_
#define _JMDJPEG_H_

#include"diskio.h"
#include "ff.h"
#include "tjpgd.h"
//#include <stdlib.h>
//#include "malloc.h"

//#define Debug_printf	//Printf//调试
//typedef struct {
//    FIL *fp;      /*指向输入文件的指针（JPEG文件）*/  //
//    BYTE *fbuf;    /*指向输出缓冲区的指针*///
//    UINT wfbuf;    /*输出缓冲区的宽度[pix] *///
//} IODEV;
void (*lcd_set_drawe_windows_hook)(int x,int y,//起始坐标
																	 int width,int height,//一数据块的像素
																	 uint32_t ofesst,//相对于图像数据一个数据块显示后的偏移量
																	 const uint16_t *image);//图像数据指针
int SetDisplayWindowsFunHook(void (*hook)(void))//设置显示勾函数
{
	if(lcd_set_drawe_windows_hook!=hook)lcd_set_drawe_windows_hook=hook;
}
void (*lcd_set_display_windows_hook)(uint16_t Left,uint16_t Top,uint16_t Right,uint16_t Bottom);
void (*lcd_wr_data_hook)(uint16_t data);
void (*lcd_setcs_hook)();
void (*lcd_rtos_enter_hook)();//实时系统用到
void (*lcd_rtos_exit_hook)();

//有关TFTLCD的尺寸的定义
#define TFTLCD_WIDTH     240//2.4寸TFTLCD屏幕的宽度
#define TFTLCD_HEIGHT    320//2.4寸TFTLCD屏幕的高度

//static int Mask_Left  = 0;                  //TFTLCD最左边的起始点
//static int Mask_Right = TFTLCD_WIDTH - 1;   //TFTLCD最右边的结束点
//static int Mask_Top   = 0;                  //TFTLCD最上方的起始点
//static int Mask_Bottom= TFTLCD_HEIGHT - 1;  //TFTLCD最下方的结束点
#define Mask_Left   0                  //TFTLCD最左边的起始点
#define Mask_Right  (TFTLCD_WIDTH - 1)   //TFTLCD最右边的结束点
#define Mask_Top    0                 //TFTLCD最上方的起始点
#define Mask_Bottom (TFTLCD_HEIGHT - 1)  //TFTLCD最下方的结束点
//static int Image_xstart = 0;   //图片显示起始坐标，左上角
//static int Image_ystart = 0;
//UINT Height_Of_Jpeg=0;//记录图片高度的全局变量
//#define __IMAGEBUFFER_SZIE	(JD_SZBUF<<2)//8192//0X2000
//BYTE _ImageBuffer[__IMAGEBUFFER_SZIE] __attribute__ ((aligned(4)));    //定义全局数组变量，作为输入的缓冲区，强制4字节对齐
void SysLCD_Jpeg( int xstart,int ystart,
									int left,                            /*图片左方起始点，即一行的起始点 */
    							int right,                           /*图片右方的结束点，即一行的结束点*/
  						    int top,                             /* 图片上方的起始点，即一列的起始点 */
  						    int bottom,                          /*图像下方的结束点，即一列的结束点 */
  						    const uint16_t * RGB_Data_Pointer);   /* 待显示的图像数据，RGB格式*/
UINT f_readfilebuffer ( FIL* device,        /*储存待解码的对象信息的结构体 */
                     	 	BYTE* buff,      /* 输入数据缓冲区 (NULL:删除数据) */
                     	 	UINT nd,/*需要从输入数据流读出/删除的数据量*/
                     	 	UINT offest);//相对第一个的偏移量,0不设
/*********************************************************************************************
  函数名称:    SysReadJpegInform
  函数功能:    用户自定义的用于输入文件数据的功能函数
  入口参数:    见函数头
  出口参数:    读取或者删除的数据量
  全局变量:	   无
  备注说明:    本函数在解码准备工作中用于读取文件头信息
*********************************************************************************************/
UINT SysReadJpegInform ( JDEC* jd,        /*储存待解码的对象信息的结构体 */
                     	 	 BYTE* buff,      /* 输入数据缓冲区 (NULL:删除数据) */
                     	 	 UINT nd)         /*需要从输入数据流读出/删除的数据量*/
{
    /*UINT  rb;
    FIL * dev = (FIL *)jd->device;    // 待解码的文件的信息，使用FATFS中的FIL结构类型进行定义 //
    if (buff)     //读取数据有效，开始读取数据 //
    {
        f_read(dev, buff, nd, &rb); //调用FATFS的f_read函数，用于把jpeg文件的数据读取出来
        return rb;        // 返回读取到的字节数目//
    }
    else
    {
        return (f_lseek(dev, f_tell(dev) + nd) == FR_OK) ? nd : 0;// 重新定位数据点，相当于删除之前的n字节数据 //
    }//*/
	FIL * dev = (FIL *)jd->device;    // 待解码的文件的信息，使用FATFS中的FIL结构类型进行定义 //
	return f_readfilebuffer (jd->device,        /*储存待解码的对象信息的结构体 */
	                     	 	 buff,      /* 输入数据缓冲区 (NULL:删除数据) */
	                     	 	 nd,/*需要从输入数据流读出/删除的数据量*/
	                     	 	 0);//相对第一个的偏移量,0不设
}
/*********************************************************************************************
  函数名称:    SysDisplayJpeg
  函数功能:    用户自定义的用于输出RGB位图数据的功能函数
  入口参数:    见函数头
  出口参数:    1：令解码函数继续执行
  全局变量:	       无
  备注说明:    无
*********************************************************************************************/
UINT SysDisplayJpeg ( JDEC*   jd,        /*储存待解码的对象信息的结构体*/
                      void*   bitmap,    /* 指向等待输出的RGB位图数据 的指针*/
                      JRECT*  rect)      /* 等待输出的矩形图像的参数 */

{
    jd = jd;    /* 说明：输出函数中JDEC结构体没有用到 */
    SysLCD_Jpeg(rect->xstart, rect->ystart, rect->left, rect->right, rect->top, rect->bottom, (uint16_t*)bitmap);
    return 1;    /*返回1，使解码工作继续执行 */
}

/*********************************************************************************************
  函数名称:    SysLCD_Jpeg
  函数功能:    在TFTLCD屏幕上显示图片
  入口参数:    见函数头
  出口参数:    无
  全局变量:	   无
  备注说明:    无
*********************************************************************************************/
void SysLCD_Jpeg( int xstart,int ystart,
									int left,                            /*图片左方起始点，即一行的起始点 */
    							int right,                           /*图片右方的结束点，即一行的结束点*/
  						    int top,                             /* 图片上方的起始点，即一列的起始点 */
  						    int bottom,                          /*图像下方的结束点，即一列的结束点 */
  						    const uint16_t * RGB_Data_Pointer)   /* 待显示的图像数据，RGB格式*/
{
    int   height_jpeg=0,width_jpeg=0,x_width=0;//,lines_change=0;
    uint32_t  width_clip=0;  //变量一定要初始化，不然会遇到意想不到的麻烦
    int x1=left+xstart,y1=top+ystart,x2=right+xstart,y2=bottom+ystart;
    //Debug_printf("SysLCD_Jpeg：L=%d,R=%d,T=%d,B=%d\r\n",left,right,top,bottom);
     if (left > right || top > bottom)
 		{
     	return;   //起始点错误，不执行显示功能
 		}
    if (left > Mask_Right || right < Mask_Left  || top > Mask_Bottom || bottom < Mask_Top)
		{
    	return;                // 图像超出屏幕的显示范围，则不执行显示功能
		}
    //if (left > (TFTLCD_WIDTH - 1) || right < 0  || top > (TFTLCD_HEIGHT - 1) || bottom < 0)
		//{
    //	return;                // 图像超出屏幕的显示范围，则不执行显示功能
		///}
    //if((x1)>(TFTLCD_WIDTH-1)||(y1)>(TFTLCD_HEIGHT-1))return ;//超出显示边界,应该不显示直接退出
    if((x1)>(Mask_Right)||(y1)>(Mask_Bottom)||x2<=Mask_Left||y2<=Mask_Top)return ;//超出显示边界,应该不显示直接退出
//开始对图片的宽度和高度进行裁剪和修改
    height_jpeg = y2 - y1 + 1;//计算图像的高度
    width_jpeg  = x2 - x1 + 1;//计算图像的宽度
    if (y1 < Mask_Top)         // 裁减掉在图片顶部超出显示范围的部分数据
		{
  		RGB_Data_Pointer += width_jpeg * (Mask_Top- y1); //计算出需要删除的数据量
  		height_jpeg-= Mask_Top- y1;
  		y1 = Mask_Top;
		}
    if (y2 > Mask_Bottom)     // 裁减掉在图片底部超出显示范围的部分数据
		{
    	height_jpeg-= y2 - Mask_Bottom;
    	y2 = Mask_Bottom;
		}
    if (x1 < Mask_Left)         // 裁减掉在图片左边超出显示范围的部分数据
		{
    	RGB_Data_Pointer += Mask_Left - x1; //水平方向的数据指针右移
    	width_jpeg -= Mask_Left - x1;  //水平宽度减小
    	width_clip+= Mask_Left - x1;//记录裁减掉的宽度
    	x1 = Mask_Left;
		}
    if (x2 > Mask_Right)         // 裁减掉在图片右边超出显示范围的部分数据
		{
    	width_jpeg -= x2 - Mask_Right;
    	width_clip+=x2 - Mask_Right;
    	x2 = Mask_Right;
		}
#if 1
    //Debug_printf("开始显示\r\n");
    if(lcd_rtos_enter_hook!=0)lcd_rtos_enter_hook();
    if(lcd_setcs_hook==0||lcd_set_display_windows_hook==0||lcd_wr_data_hook==0)return JDR_INTR;
    lcd_setcs_hook(0);
    //lcd_set_display_windows_hook(left,top+lines_change,right,bottom+lines_change);//设置显示窗口勾函数,需要配置显示函数
    lcd_set_display_windows_hook(x1,y1,x2,y2);
    //设置TFTLCD显示屏的显示参数
//向TFTLCD显示屏控制器写入数据
//根据TFTLCD的控制器的特性，接下来可以连续地向上面设置好的矩形区域丢数据
    while(height_jpeg--)  //控制显示区域的高度
		{
			x_width=width_jpeg;
			//在此处加入向TFTLCD写入数据的功能函数，在水平方向输出矩形区域一行的数据
			while(x_width--)
			{
				lcd_wr_data_hook(*RGB_Data_Pointer++);
			}
			//图片的水平方向的调整，去除裁减掉的像素数据
			RGB_Data_Pointer+= width_clip;
		}
    lcd_setcs_hook(1);
    if(lcd_rtos_exit_hook!=0)lcd_rtos_exit_hook();
#else
    lcd_set_drawe_windows_hook(x1,y1,width_jpeg,height_jpeg,width_clip,RGB_Data_Pointer);
#endif
    //Debug_printf("开始显示完毕\r\n");
}
/*********************************************************************************************
  函数名称:    UI_Display_Jpeg
  函数功能:    在主函数中调用的JPEG图片显示函数
  入口参数:    f_Jpeg：指向JPEG图片文件的指针，其值不定
			   	 	 filename：JPEG图片文件的名称
  出口参数:  	0：函数执行成功
  其他：函数执行失败
  全局变量:	   无
  备注说明:    无
*********************************************************************************************/
INT  UI_Display_Jpeg(FIL* f_Jpeg,//指向JPEG图片文件的指针
		                 const char* filename,//JPEG图片文件的名称
		                 UINT xstart,UINT ystart,
		                 BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
		                 void* pool,//指向本次解压工作区的指针(4字节对齐)
		                 UINT sz_pool
#if JD_TBLZI==0
,	PicBuffer_Typedef *p_inpool//图片缓存
#endif//JD_TBLZI==0
		                 )//解压工作区的大小
{
    FRESULT    Res_FatFs;//FATFS系统函数返回值
    JDEC       jd;         /* 待解码的对象的信息记录表 */
    JRESULT    Res_TjpgDec; // TjpgDec系统函数返回值
    JRECT			jrect;
#if JD_TBLZI==0
    jd.Zig=(BYTE *)p_inpool->Zig;
    jd.Ipsf=(WORD *)p_inpool->Ipsf;
#endif//#if JD_TBLZI==0
//使用FATFS的f_open函数以读方式打开文件
   /* Debug_printf("f_open %s\r\n",filename);
    Res_FatFs = f_open(f_Jpeg,filename,FA_READ);
    if(Res_FatFs!= FR_OK) //打开文件失败，返回
    {
      //Delay(10000);
      f_close(f_Jpeg);
      //print("没有发现 %s=%d\r\n",filename,Res_FatFs);
      return JDR_NO_FILE;//Res_FatFs;
    }//*/
#ifdef Debug_printf
    Debug_printf("打开%s=%d\r\n",filename,Res_FatFs);
#endif//Debug_printf
//执行解码的准备工作，调用TjpgDec模块的jd_prepare函数
#ifdef Debug_printf
    Debug_printf("开始jd_prepare=%d\r\n",Res_FatFs);
#endif//#ifdef Debug_printf
    pool=pool;
    Res_TjpgDec = jd_prepare(&jd,SysReadJpegInform,pool,sz_pool,f_Jpeg);
    //Height_Of_Jpeg=jd.height;//保存图片的高度数据
    if (Res_TjpgDec == JDR_OK)
    {
#ifdef Debug_printf
    	Debug_printf("成功jd_prepare=%d\r\n",Res_FatFs);
#endif//#ifdef Debug_printf
    	if(scale>3)scale=3;
      ///for (scale = 0; scale < 3; scale++) //确定输出图像的比例因子
      //{
      //  if ((jd.width >> scale) <= TFTLCD_WIDTH && (jd.height >> scale) <= TFTLCD_HEIGHT)
      //  {
      //     // break;
      //  }
      //  else
      //  {
      //  	//if(scale>3)scale=3;
      //  	//return JDR_SCALE;//图片缩放比例过大
      //  }
      //}
      //if(scale)scale--;  //处理标准240宽度的图片时，对于高度过高的情况进行降低一级比例的处理//*/
      //print("比例=%d\r\n",scale);
#ifdef Debug_printf
      Debug_printf("开始jd_decomp=%d,比例=%d\r\n",Res_FatFs,scale);
#endif//#ifdef Debug_printf
    //执行解码工作，调用TjpgDec模块的jd_decomp函数
     jrect.xstart=xstart;jrect.ystart=ystart;//保存起始坐标
     Res_TjpgDec = jd_decomp(&jd, SysDisplayJpeg, scale,&jrect);
#ifdef Debug_printf
     Debug_printf("成功jd_decomp=%d\r\n",Res_FatFs);
#endif//#ifdef Debug_printf
    }
    else    //解码的准备工作失败，关闭文件，返回
    {
			//Delay(10000);
      //f_close(f_Jpeg);
      //return Res_TjpgDec; //返回错误代码
    }
     //解码工作执行成功，返回0
    //f_close(f_Jpeg);
    return Res_TjpgDec;//JDR_OK;
}

#endif//_JMDJPEG_H_
