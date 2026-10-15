#ifndef _JMDBMP_H_
#define _JMDBMP_H_

#include"diskio.h"
#include "ff.h"
#include "tjpgd.h"

//#define Debug_printf	Printf//调试
extern void (*lcd_set_display_windows_hook)(uint16_t Left,uint16_t Top,uint16_t Right,uint16_t Bottom);
extern void (*lcd_wr_data_hook)(uint16_t data);
extern void (*lcd_setcs_hook)();
extern void (*lcd_rtos_enter_hook)();//实时系统用到
extern void (*lcd_rtos_exit_hook)();

//图象数据压缩的类型
#define BI_RGB	 			0  //没有压缩.RGB 5,5,5.
#define BI_RLE8 			1  //每个象素8比特的RLE压缩编码，压缩格式由2字节组成(重复象素计数和颜色索引)；
#define BI_RLE4 			2  //每个象素4比特的RLE压缩编码，压缩格式由2字节组成
#define BI_BITFIELDS 	3  //每个象素的比特由指定的掩码决定。

#define TFTLCD_WIDTH     240//2.4寸TFTLCD屏幕的宽度
#define TFTLCD_HEIGHT    320//2.4寸TFTLCD屏幕的高度
/* BMP file viewer scroll step */
#define MOVE_X	(TFTLCD_WIDTH / 4)	/* X scroll step */
#define MOVE_Y	(TFTLCD_HEIGHT / 4)	/* Y scroll step */

#define Mask_Left   0                  //TFTLCD最左边的起始点
#define Mask_Right  (TFTLCD_WIDTH - 1)   //TFTLCD最右边的结束点
#define Mask_Top    0                 //TFTLCD最上方的起始点
#define Mask_Bottom (TFTLCD_HEIGHT - 1)  //TFTLCD最下方的结束点
//extern FATFS Fs;	/* File system object (main.c) */

/*-----------------------------------*/
/* Windows BMP file loader           */
#define RGB8882RGB565(b,g,r)		((((b)>>3)&0x1f)|((((g)>>2)&0X3F)<<5)|(((r)>>3)&0x1f)<<11)	/* Get an RGB888 pixel, convert to RGB565 format */
//d27 R[d26 d25 d24 d23] G[d21 d20,d17 d16 d15] B[d14 d13 d12 d11 d10]
#define RGB5552RGB565(d1,d2)		((((d1)&0x1F))|((((d1)&0xE0)&0x07)<<1)|(((d2)&0x03)<<8)|(((d2)&0x1F)<<11))	/* Get an RGB555 pixel, convert to RGB565 format */

#define RGB888TORGB565(ptr)		(((((DWORD)*((BYTE*)(ptr)))>>3)&0x1f)|(((((DWORD)*((BYTE*)(ptr)+1))>>2)&0X3F)<<5)|((((DWORD)*((BYTE*)(ptr)+2))>>3)&0x1f)<<11)	/* Get an RGB888 pixel, convert to RGB565 format */
//d27 R[d26 d25 d24 d23] G[d21 d20,d17 d16 d15] B[d14 d13 d12 d11 d10]
//#define RGB555TORGB565(ptr)		(((((DWORD)*((BYTE*)(ptr)))&0x1F))|(((((DWORD)*((BYTE*)(ptr)))&0xE0)&0x07)<<1)|((((DWORD)*((BYTE*)(ptr)+1))&0x03)<<8)|((((DWORD)*((BYTE*)(ptr)+1))&0x1F)<<11))	/* Get an RGB555 pixel, convert to RGB565 format */
//color=((uint16_t)bmpbuf[count]&0X1F);	 	//R
//color+=(((uint16_t)bmpbuf[count])&0XE0)<<1; //G
#define RGB555TORGB565(ptr) ((((DWORD)*((BYTE*)(ptr)))&0x1F)|((((DWORD)*((BYTE*)(ptr)))&0xE0)<<1)|(((DWORD)*((BYTE*)(ptr)+1))<<9))
UINT f_readfilebuffer ( FIL* device,        /*储存待解码的对象信息的结构体 */
                     	 	BYTE* buff,      /* 输入数据缓冲区 (NULL:删除数据) */
                     	 	UINT nd,/*需要从输入数据流读出/删除的数据量*/
                     	 	UINT offest)//相对第一个的偏移量,0不设
{
  UINT  rb;
  FIL * dev = (FIL *)device;    /* 待解码的文件的信息，使用FATFS中的FIL结构类型进行定义 */
  if (buff)     /*读取数据有效，开始读取数据 */
  {
  		if(offest)f_lseek(dev, offest);
      f_read(dev, buff, nd, &rb); //调用FATFS的f_read函数，用于把jpeg文件的数据读取出来
      return rb;        /* 返回读取到的字节数目*/
  }
  else
  {
  	if(offest)return f_lseek(dev, nd);//nd确定起始位置
  	else return (f_lseek(dev, f_tell(dev) + nd) == FR_OK) ? nd : 0;/* 重新定位数据点，相当于删除之前的n字节数据 */
  }
}
#if 1
INT  UI_Display_Bmp (FIL* f_Bmp,//指向JPEG图片文件的指针
										 const char* fn,	/* File to open */
										 UINT xstart,UINT ystart,
										 BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
										 void *work,		/* Pointer to the working buffer (must be 4-byte aligned) */
										 UINT sz_work)	/* Size of the working buffer (must be power of 2) */
{
	DWORD n, m,im,jm, biofs, iw, biBitCount,biCompression,rlen,rmw;
	LONG biWidth, biHeight,//图片实际分辨率
			bmw,bmh;//最终显示的长和宽
	BYTE *buff = work, *p,d1,d2,biBitLD;
	WORD d;
	FRESULT  Res_FatFs;//FATFS系统函数返回值
	LONG bh;
	UINT rdlen;
	int x1,y1,x2,y2,biscale,rw,xs=0,ys=0;
	work=work;
	/*Debug_printf("打开=%s\r\n",fn);
	Res_FatFs = f_open(f_Bmp,fn,FA_READ);
	if(Res_FatFs!= FR_OK) //打开文件失败，返回
	{
    f_close(f_Bmp);
    return JDR_NO_FILE;//Res_FatFs;
	}//*/
#ifdef Debug_printf
	Debug_printf("读%s信息头\r\n",fn);
#endif//#ifdef Debug_printf
	//读信息头
	//bfType 文件的类型
	if (f_readfilebuffer(f_Bmp, buff, 128,0) != 128) return JDR_INP;
	//if (f_readfilebuffer(f_Bmp, buff, 2,0) != 2) return JDR_INP;
	if(LD_WORD(buff)!=0x4D42)return JDR_FMT3;//if(buff[0]!='B'||buff[1]!='M')return JDR_FMT3;

	//Bitmap Data Offset 从文件开始到位图数据开始之间的数据(bitmap data)之间的偏移量
	//if (f_readfilebuffer(f_Bmp, buff, 4 ,10) != 4) return JDR_INP;
	biofs = LD_DWORD(buff+10);			// bfOffBits 即从文件头到位图数据需偏移biofs字节
#ifdef Debug_printf
	Debug_printf("biofs=%X\r\n",biofs);
#endif//#ifdef Debug_printf
	//if (f_readfilebuffer(f_Bmp, buff, 2, 26) != 2) return JDR_INP;
	if (LD_WORD(buff+26) != 1) return JDR_FMT2;	// biPlanes 该值总为1
	//if (f_readfilebuffer(f_Bmp, buff, 2, 28) != 2) return JDR_INP;
	biBitCount=LD_WORD(buff+28);// biBitCount 每个象素的位数 1单色/4 16色/8 256色/16/24/32
	if(biBitCount!=16&&biBitCount!=24&&biBitCount!=32)return JDR_FMT3;
#ifdef Debug_printf
	Debug_printf("biBitCount 0x%X=%d\r\n",28,biBitCount);
#endif //#ifdef Debug_printf
	//if (f_readfilebuffer(f_Bmp, buff, 4, 30) != 4) return JDR_INP;
	biCompression=LD_DWORD(buff+30);// biCompression BI_RGB,00000000说明本图像不压缩
#ifdef Debug_printf
	Debug_printf("biCompression 0x%X=%X\r\n",30,biCompression);
#endif //#ifdef Debug_printf
	if(((biBitCount==24||biBitCount==32)&&biCompression!=0))return JDR_FMT3;

	//if (f_readfilebuffer(f_Bmp, buff, 8, 18) != 8) return JDR_INP;
	biWidth = LD_DWORD(buff+18);		// biWidth 图像宽
	biHeight= LD_DWORD(buff+4+18);	// biHeight 图像高,这是一个正数，说明图像数据是从图像左下角到右上角排列的。
	//biHeight<0 显示方向正向显示 :由左到右,上到下(原点在左上角)
	//biHeight>0 显示方向正向显示 :由左到右,下到上(原点在左下角)
	bh=(LONG)biHeight;
	if(bh<0)biHeight=-bh;
#ifdef Debug_printf
	Debug_printf("BMP宽=%d,高=%d,%d\r\n",biWidth,biHeight,bh);
#endif //#ifdef Debug_printf
	if (!biWidth || !biHeight) return JDR_FMT1;// Check bitmap size

	if(scale>3)scale=3;
	biscale=1<<scale;
#ifdef Debug_printf
	Debug_printf("缩放比例=%d\r\n",scale);
#endif//#ifdef Debug_printf
	if (!(biWidth>>scale) || !(biHeight>>scale)) return JDR_OK;	//缩放已经到达最小则不显示，直接退出
	//显示区域坐标设置
	x1=xstart,y1=ystart,x2=xstart+(biWidth>>scale)-1,y2=ystart+(biHeight>>scale)-1;
	if((x1)>(Mask_Right)||(y1)>(Mask_Bottom)||x2<=Mask_Left||y2<=Mask_Top)return JDR_OK;//JDR_PAR;//超出显示边界,应该不显示直接退出
  if (y2 > Mask_Bottom)// 裁减掉在图片底部超出显示范围的部分数据
	{
  	y2 = Mask_Bottom;
	}
  if (x2 > Mask_Right)// 裁减掉在图片右边超出显示范围的部分数据
	{
  	x2 = Mask_Right;
	}
  if(x1<Mask_Left){x1=0;xs=-xstart;}else xs=0;
  if(y1<Mask_Top){y1=0;ys=-ystart;}else ys=0;
  bmw=((x2-x1+1)<<scale);bmh=((y2-y1+1)<<scale);//换算最终显示分辨率
	//Bitmap line stride [byte] 位图行间距
	biBitLD=biBitCount>>3;//biBitCount/8
	iw=biWidth*biBitLD;//一行的字节数
	//iw = ((biWidth * biBitLD) + biBitLD) & ~biBitLD;//1行实际数据数
	//Debug_printf("1行实际数据数=%d,%d\r\n",iw,biWidth*biBitLD);
	if (iw > sz_work) return JDR_MEM1;	// Check if buffer size is sufficient for this file 检查缓冲区大小是足够用于此文件
#if 1
	//显示图片 每次显示1行数据,定位到图像起始位置
#ifdef Debug_printf
	Debug_printf("x1=%d,y1=%d,x2=%d,y2=%d\r\n",x1,y1,x2,y2);
	Debug_printf("biscale=%d,bmw=%d,bmh=%d\r\n",biscale,bmw,bmh);
#endif//#ifdef Debug_printf
  if(lcd_rtos_enter_hook!=0)lcd_rtos_enter_hook();
  if(lcd_setcs_hook==0||lcd_set_display_windows_hook==0||lcd_wr_data_hook==0)return JDR_INTR;
  lcd_setcs_hook(0);
	//lcd_set_display_windows_hook(x1,y1,x2,y2);//设置显示区域
  //rw=bmw*biBitLD;//实际读取行宽
	if(bh<0)
	{
		lcd_set_display_windows_hook(x1,y1,x2,y2);//设置显示区域
		f_lseek(f_Bmp, biofs+ys*iw);//正序定位到起始点
	}
	else
	{
		f_lseek(f_Bmp, biofs+(biHeight-bmh)*iw+ys*iw);//正序定位到起始点
	}
	for(n=0;n<biHeight&&(n<bmh);n++)
	{
		if (f_readfilebuffer(f_Bmp, buff, iw,0) != iw) return JDR_INP;
		//if (f_readfilebuffer(f_Bmp, buff, iw,0) != iw) return JDR_INP;
		if(((n%biscale)!=0))continue;//判断为需要显示的行
		if(bh>0)
		{
			if(y2>=y1)
			{
				lcd_set_display_windows_hook(x1,y2,x2,y2);//倒序时设置显示区域
				y2--;
			}
		}
		for(m=0,im=0;m<biWidth&&(m<bmw);m+=biscale)
		{
			p=buff+(m+xs)*biBitLD;
			switch(biBitCount)
			{
				case 16:
					if(biCompression==0)	d=RGB555TORGB565(p);//lcd_wr_data_hook(RGB555TORGB565(p));//d=RGB5552RGB565(d1,d2);//Get an RGB888 pixel, convert to RGB565 format
					else d=LD_WORD(p);//d=(d2<<8)|d1;//RGB565lcd_wr_data_hook(LD_WORD(p));//
				break;
				case 24://蓝，绿，红
				case 32://(蓝，绿，红，Alpha)
					d=RGB888TORGB565(p);
					//lcd_wr_data_hook(RGB888TORGB565(p));
				break;
				case 1:
				case 4:
				case 8:
				default:return JDR_FMT3;break;
			}
			lcd_wr_data_hook(d);//*/
			/*switch(biBitCount)
			{
				case 16:
					if(biCompression==0)	lcd_wr_data_hook(RGB555TORGB565(buff+(m+xs)*biBitLD));//Get an RGB888 pixel, convert to RGB565 format
					else lcd_wr_data_hook(LD_WORD(buff+(m+xs)*biBitLD));
				break;
				case 24://蓝，绿，红
				case 32://(蓝，绿，红，Alpha)
					lcd_wr_data_hook(RGB888TORGB565(buff+(m+xs)*biBitLD));
				break;
				case 1:
				case 4:
				case 8:
				default:return JDR_FMT3;break;
			}//*/
		}
	}
#else
	rmw=(sz_work/iw);
	rlen=iw*rmw;//一次性读取的行数，有实际缓存决定

	Debug_printf("x1=%d,y1=%d,x2=%d,y2=%d\r\n",x1,y1,x2,y2);
	Debug_printf("biscale=%d,bmw=%d,bmh=%d\r\n",biscale,bmw,bmh);

  lcd_rtos_enter_hook();
  lcd_setcs_hook(0);
	lcd_set_display_windows_hook(x1,y1,x2,y2);//设置显示区域
	rw=rlen;//bmw*biBitLD*rmw;//实际读取行宽
	Debug_printf("rlen=%d,rw=%d\r\n",rlen,rw);

	for(n=0;n<biHeight&&(n<bmh);n+=biscale)
	{
		if(bh<0)//biHeight<0 显示方向正向显示 :由左到右,上到下(原点在左上角)
		{
			if(f_readfilebuffer(f_Bmp, buff, rw, (biofs+n*rlen)) != rw) return JDR_INP;//读1行
		}
		else//biHeight>0 显示方向正向显示 :由左到右,下到上(原点在左下角)
		{
			if(f_readfilebuffer(f_Bmp, buff, rw, (biofs+(biHeight-n-1)*rlen)) != rw) return JDR_INP;//读1行
		}
		for(jm=0;jm<rmw;jm++)
		{
			for(m=0;m<biWidth&&(m<bmw);m+=biscale)
			{
				p=buff+m*biBitLD+jm*iw;
				switch(biBitCount)
				{
					case 16:
						if(biCompression==0)	d=RGB555TORGB565(p);//d=RGB5552RGB565(d1,d2);//Get an RGB888 pixel, convert to RGB565 format
						else d=LD_WORD(p);//d=(d2<<8)|d1;//RGB565
					break;
					case 24:
					case 32://(蓝，绿，红，Alpha)
						d=RGB888TORGB565(p);
					break;
					case 1:
					case 4:
					case 8:
					default:return JDR_FMT3;break;
				}
				lcd_wr_data_hook(d);
			}
		}
	}
#endif
  lcd_setcs_hook(1);
  if(lcd_rtos_exit_hook!=0)lcd_rtos_exit_hook();
  //f_close(f_Bmp);
  return JDR_OK;//显示成功
}
#else
#if 1
INT  UI_Display_Bmp (FIL* f_Bmp,//指向JPEG图片文件的指针
										 const char* fn,	/* File to open */
										 UINT xstart,UINT ystart,
										 BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
										 void *work,		/* Pointer to the working buffer (must be 4-byte aligned) */
										 UINT sz_work	/* Size of the working buffer (must be power of 2) */
)
{
	DWORD biofs, iw, xs, xe, ys, ye,biBitCount,biCompression;
	LONG bm_w, bm_h,//图片实际分辨率
	     width,height,//缩放后分辨率
	     biW, biH,lc,w, h, n, m,lpc,lpce,linevl,
	     x_width=0;//缩放后宽度
	UINT bx;//WORD bx;
	BYTE *buff = work, *p, k,d1,d2,biBitLD=2;
	WORD d;
	//FRESULT   Res_FatFs;//FATFS系统函数返回值
	LONG bh;
	LONG biscale,rw,pcadd,y1,y2,rwl,res=FR_OK,rspc=0;
/*
	Debug_printf("打开=%s\r\n",fn);
	Res_FatFs = f_open(f_Bmp,fn,FA_READ);
	if(Res_FatFs!= FR_OK) //打开文件失败，返回
	{
    f_close(f_Bmp);
    return Res_FatFs;
	}//*/
#ifdef Debug_printf
	Debug_printf("读%s信息头\r\n",fn);
#endif//#ifdef Debug_printf
	f_read(f_Bmp,buff, 128, &bx);
	if (bx != 128)return JDR_INP;
	//文件标识
	if(LD_WORD(buff)!=0x4D42)return JDR_FMT3;
	biofs = LD_DWORD(buff+10);			//bfOffBits 即从文件头到位图数据需偏移biofs字节
#ifdef Debug_printf
	Debug_printf("biofs=%X\r\n",biofs);
#endif//#ifdef Debug_printf
	if (LD_WORD(buff+26) != 1) return JDR_FMT2;	// biPlanes 该值总为1
#ifdef Debug_printf
	Debug_printf("0x%X=%X\r\n",26,LD_WORD(buff+26));
#endif//#ifdef Debug_printf
	biBitCount=LD_WORD(buff+28);/* biBitCount 表示每个像素占8个比特，即该图像共有256种颜色*/
	if(biBitCount!=16&&biBitCount!=24&&biBitCount!=32)return JDR_FMT3;
#ifdef Debug_printf
	Debug_printf("biBitCount 0x%X=%d\r\n",28,biBitCount);
#endif//#ifdef Debug_printf
	biCompression=LD_DWORD(buff+30);
	//if (LD_DWORD(buff+30) != 0) return;	/* biCompression BI_RGB,00000000说明本图像不压缩*/
#ifdef Debug_printf
	Debug_printf("biCompression 0x%X=%X\r\n",30,biCompression);
#endif//#ifdef Debug_printf
	if(((biBitCount==24||biBitCount==32)&&biCompression!=0))return JDR_FMT3;

	bm_w = LD_DWORD(buff+18);			/* biWidth 图像宽*/
	bm_h = LD_DWORD(buff+22);			/* biHeight 图像高,这是一个正数，说明图像数据是从图像左下角到右上角排列的。*/
	bh=(LONG)LD_DWORD(buff+22);
	if(bh<0)
	{
		bm_h=-bh;//
	}
#ifdef Debug_printf
	Debug_printf("BMP宽=%d,高=%d,%d\r\n",bm_w,bm_h,bh);
#endif//#ifdef Debug_printf
	if (!bm_w || !bm_h) return JDR_FMT1;			/* Check bitmap size */
	if(scale>3)scale=3;
	biscale=1<<scale;
	biW=bm_w>>scale,biH=bm_h>>scale;//缩放后分辨率
#ifdef Debug_printf
	Debug_printf("宽=%d,高=%d\r\n",biW,biH);
#endif//#ifdef Debug_printf
	if (!(biW) || !(biH)) return JDR_OK;	//缩放已经到达最小则不显示，直接退出
	//Bitmap line stride [byte] 位图行间距
	biBitLD=biBitCount>>3;//biBitCount/8
	iw = ((bm_w * biBitLD) + biBitLD) & ~biBitLD;

	if (iw > sz_work) return JDR_MEM1;			/* Check if buffer size is sufficient for this file 检查缓冲区大小是足够用于此文件*/
	//显示区域坐标设置
	xs=xstart,ys=ystart,xe=xstart+(biW)-1,ye=ystart+(biH)-1;
	if((xs)>(Mask_Right)||(ys)>(Mask_Bottom))return JDR_PAR;//超出显示边界,应该不显示直接退出
  if (ye > Mask_Bottom)// 裁减掉在图片底部超出显示范围的部分数据
	{
  	ye = Mask_Bottom;
	}
  if (xe > Mask_Right)// 裁减掉在图片右边超出显示范围的部分数据
	{
  	xe = Mask_Right;
	}
  width=(xe-xs)+1,height=(ye-ys)+1;//缩放后分辨率

  if(scale)
  {
  	rwl=1;
  	rw=1;//缩放情况下一行一行显示
  }
  else
  {
  	rw=sz_work / iw;
  	rwl=rw>>scale;if(rwl==0)rwl=1;//一次性读取缓存实际包含的要显示的行数
  }
	pcadd=biBitLD<<scale;//一行数据2个读取数据之间的间隔
  lpc=0;//总行计数
  lpce=height<<scale;//按照显示边界限制行读取指针
  x_width=width<<scale;
	w=x_width;//width;
	h=bm_h;	m = ye;//开始显示的行数
	if(bh>0)//倒序读取要把最前面的不显示行裁减掉
	{
		rspc=biofs+(bm_h-lpce);//定位读起始指针到裁剪掉后的部分
	}
	else //正序
	{
		rspc=biofs;//定位读起始指针转到开始
	}
	// Put a rectangular of the picture
	//设定读起始指针
	if (f_lseek(f_Bmp,rspc)!=FR_OK || rspc != f_Bmp->fptr) return JDR_INP;//break;	// Goto bottom line of the window
	//if (f_lseek(f_Bmp,biofs)!=FR_OK || biofs != f_Bmp->fptr) return JDR_INP;//break;	// Goto bottom line of the window
#ifdef Debug_printf
  Debug_printf("xs=%d,ys=%d,xe=%d,ye=%d,f_Bmp->fptr=%d\r\n",xs,ys,xe,ye,f_Bmp->fptr);
  Debug_printf("实际%d:%d缩放%d,%d,lpce=%d,rw=%d,rwl=%d,rspc=%d\r\n",bm_w,bm_h,w,h,lpce,rw,rwl,rspc);
#endif//#ifdef Debug_printf
  lcd_rtos_enter_hook();
  lcd_setcs_hook(0);
  if(bh<0)lcd_set_display_windows_hook(xs,ys,xe,ye);//正序显示
	do// Line loop 行循环Y
	{// Get some lines fit in the working buffer
		lc = rw;//根据缓存大小一次读取的实际图像行数
		if (lc > h) lc = h;//最后一行
		h -= lc;//行递减
		if(scale==0||((lpc%biscale)==0))
		{
			if(scale)//缩放时逐行读取,所以要重新定向坐标
			{
				res=f_lseek(f_Bmp,rspc+lpc*iw);//res=f_lseek(f_Bmp,lpc*iw+biofs);
				if (res!=FR_OK)
				{
					res=JDR_INP;
					break;//;return JDR_INP;
				}
			}
			f_read(f_Bmp,buff, lc * iw, &bx);//读取多行，有缓存大小决定
			if(bh>0)
			{
				y1=m-rwl+1;y2=m;
	    	lcd_set_display_windows_hook(xs,y1,xe,y2);
			}
	    m -= rwl;//实际显示行计数递减
			do {// buffer Line loop 缓存行循环Y
				lc--;//行递减
				if((lpc%biscale)==0)
				{
					if(bh>0)p = buff+(lc* iw);//指向一行读起始位置
					else p = buff+((rw-1-lc)* iw);//指向一行读起始位置
					//n = w;//一行实际显示宽度,已经缩放后
					n=0;
					do 	// Pixel loop  列循环X
					{
						if(n%biscale==0)
						{
							switch(biBitCount)
							{
								case 16:if(biCompression==0)d=RGB555TORGB565(p);else d=LD_WORD(p);break;
								case 24:
								case 32:d=RGB888TORGB565(p);								break;//(蓝，绿，红，Alpha)
								case 1:
								case 4:
								case 8:
								default:/*return JDR_FMT3;*/break;
							}
							lcd_wr_data_hook(d);//显示
							//p+=pcadd;//指针移动
						}//if(n%biscale==0)
						p+=biBitLD;//指针移动
					}while (++n<w);//(--n>0);//
				}//if((lpc%biscale)==0)
				lpc++;//行计数
			}while (lc>0);//判断是否把读取到的缓存全部显示出来了
		}//if(scale==0||((lpc%biscale)==0))
		else if(scale)//缩放情况下
		{
			lpc++;//行计数
		}
	} while (h>0&&lpc<lpce);
  lcd_setcs_hook(1);
  lcd_rtos_exit_hook();
	if(res!=FR_OK)return res;
	return JDR_OK;
}
#else
INT  UI_Display_Bmp (FIL* f_Bmp,//指向JPEG图片文件的指针
										 const char* fn,	/* File to open */
										 UINT xstart,UINT ystart,
										 BYTE scale,//jpeg图像缩放比例0-3 : 1,1/2,1/4,1/8
										 void *work,		/* Pointer to the working buffer (must be 4-byte aligned) */
										 UINT sz_work	/* Size of the working buffer (must be power of 2) */
)
{
	DWORD n, m, biofs, bm_w, bm_h, iw, w, h, lc, left, top, x1,x2,y1,y2,xs, xe, ys, ye,biCompression;
	WORD bx,biBitCount,biBitLD;
	BYTE *buff = work, *p, k;
	WORD d;
	LONG dir,biscale;
	f_read(f_Bmp,buff, 128, &bx);
	if (bx != 128)return JDR_INP;
	//文件标识
	if(LD_WORD(buff)!=0x4D42)return JDR_FMT3;
	biofs = LD_DWORD(buff+10);			/* bfOffBits */
	if (LD_WORD(buff+26) != 1) return JDR_FMT2;	// biPlanes 该值总为1
	biBitCount=LD_WORD(buff+28);/* biBitCount 表示每个像素占8个比特，即该图像共有256种颜色*/
	if(biBitCount!=16&&biBitCount!=24&&biBitCount!=32)return JDR_FMT3;

	biCompression=LD_DWORD(buff+30);/* biCompression BI_RGB,00000000说明本图像不压缩*/
	if(((biBitCount==24||biBitCount==32)&&biCompression!=0))return JDR_FMT3;

	bm_w = LD_DWORD(buff+18);			/* biWidth */
	bm_h = LD_DWORD(buff+22);			/* biHeight */
	dir=(LONG)bm_h;
	if(dir<0)bm_h=-dir;
	//iw = ((bm_w * 3) + 3) & ~3;			/* Bitmap line stride [byte] */
	biBitLD=biBitCount>>3;//biBitCount/8
	iw = bm_w * biBitLD;//((bm_w * biBitLD) + biBitLD) & ~biBitLD;

	if (!bm_w || !bm_h) return JDR_FMT1;			/* Check bitmap size */
	if (iw > sz_work) return JDR_MEM1;	/* Check if buffer size is sufficient for this file */
	if((xstart+bm_w-1)<=0||(ystart+bm_h-1)<=0)return JDR_PAR;
	x1 = xstart;				y1 = ystart;	/* Offset from left/top of the picture */
	x2 = xstart+bm_w-1;	y2 = ystart+bm_h-1;
	if(x1<0)x1=-xstart;	else x1=0;
	if(y1<0)y1=-ystart;	else y1=0;
	if((x2)>=TFTLCD_WIDTH) x2=bm_w-1;
	if((y2)>=TFTLCD_HEIGHT)y2=bm_h-1;
	/* Determine left/right of image rectangular */
	if (xstart <0) xs=0;	else xs=xstart;
	if (ystart <0) ys=0;	else ys=ystart;
	if ((xstart+bm_w-1) >=TFTLCD_WIDTH) xe=TFTLCD_WIDTH-1;else xe=(xstart+bm_w-1);
	if ((ystart+bm_h-1) >=TFTLCD_HEIGHT)ye=TFTLCD_HEIGHT-1;else ye=(ystart+bm_h-1);
	if(scale>3)scale=3;
	biscale=1<<scale;
	left = x1,top = y1;	/* Offset from left/top of the picture */
  //if(bh<0)lcd_set_display_windows_hook(xs,ys,xe,ye);//正序显示
	//do {
		/* Put a rectangular of the picture */
		//m = (bm_h <= TFTLCD_HEIGHT) ? biofs : biofs + (bm_h - TFTLCD_HEIGHT - top) * iw;
		m = (x2<=TFTLCD_WIDTH) ? biofs : biofs + (bm_h - TFTLCD_WIDTH - top) * iw;
		if (f_lseek(f_Bmp,m) || m != f_Bmp->fptr) return JDR_INP;	/* Goto bottom line of the window */
		w = (bm_w > TFTLCD_WIDTH) ? TFTLCD_WIDTH : bm_w;	/* Rectangular width [pix] */
		h = (bm_h > TFTLCD_HEIGHT) ? TFTLCD_HEIGHT : bm_h;	/* Rectangular height [pix] */
		m = ye;
	  if(lcd_rtos_enter_hook!=0)lcd_rtos_enter_hook();
	  lcd_setcs_hook(0);
		do {
			lc = sz_work / iw;	/* Get some lines fit in the working buffer */
			if (lc > h) lc = h;
			h -= lc;
			f_read(f_Bmp,buff, lc * iw, &bx);
			//CS_LOW();
			//if(bh<0)lcd_set_display_windows_hook(xs,ys,xe,ye);//正序显示
			//else
			lcd_set_display_windows_hook(xs, xe, m - lc + 1, m);
			//disp_setrect(xs, xe, m - lc + 1, m);	/* Begin to transfer data to a rectangular area */
			m -= lc;
			do {	/* Line loop */
				lc--; p = &buff[lc * iw + left * 3];
				n = w;
				do {	/* Pixel loop  */
					//d = *p++ >> 3;	/* Get an RGB888 pixel, convert to RGB565 format */
					//d |= (*p++ >> 2) << 5;
					//d |= (*p++ >> 3) << 11;
					switch(biBitCount)
					{
						case 16:if(biCompression==0)d=RGB555TORGB565(p);else d=LD_WORD(p);break;
						case 24:
						case 32:d=RGB888TORGB565(p);								break;//(蓝，绿，红，Alpha)
						case 1:
						case 4:
						case 8:
						default:/*return JDR_FMT3;*/break;
					}
					lcd_wr_data_hook(d);//显示
					p+=biBitCount;
				} while (--n);
			} while (lc);
			//CS_HIGH();
		} while (h);
	//}while(1);
  lcd_setcs_hook(1);
  lcd_rtos_exit_hook();
	//if(res!=FR_OK)return res;
	return JDR_OK;
}
#endif
#endif
#endif//_JMDBMP_H_
