/*----------------------------------------------------------------------------/
/ TJpgDec - Tiny JPEG Decompressor include file               (C)ChaN, 2012
/----------------------------------------------------------------------------*/
#ifndef _TJPGDEC
#define _TJPGDEC
/*---------------------------------------------------------------------------*/
/* System Configurations */
#define PIC_UMKNOW	0//不支持的图片格式
#define PIC_BMP			1//BMP
#define PIC_JPEG		2//jpeg
#if 1
//出入缓存512输出3100,IN=1024&OUT=4096
#define JD_SZBUF		512//2048 	/* 输入缓冲区的大小 (必须是512的倍数) */
#define JD_FORMAT		1			/* 输出RGB格式：0:RGB888 (3 字节/像素), 1:RGB565 (1 半字/) */
#define JD_USE_SCALE	1			/* 使用图像缩放 */
#define JD_TBLCLIP		0//1	   	/* 使用快速裁剪换算表（表的大小为1kB） */
#define JD_TBLZI		1	   	/* 使用Zig/Zig换算表（表的大小为64B+64B） */
#else
#define	JD_SZBUF		4096	/* Size of stream input buffer */
#define JD_FORMAT		1	/* Output pixel format 0:RGB888 (3 BYTE/pix), 1:RGB565 (1 WORD/pix) */
#define	JD_USE_SCALE	1	/* Use descaling feature for output */
#define JD_TBLCLIP		1	/* Use table for saturation (might be a bit faster but increases 1K bytes of code size) */
#endif
/*---------------------------------------------------------------------------*/

#ifdef __cplusplus
extern "C" {
#endif

#include "integer.h"

/* Error code */
typedef enum {
	JDR_OK = 0,	/* 0: Succeeded 成功*/
	JDR_INTR,	/* 1: Interrupted by output function 被输出函数中断*/
	JDR_INP,	/* 2: Device error or wrong termination of input stream 磁盘错误，或输入数据错误*/
	JDR_MEM1,	/* 3: Insufficient memory pool for the image 为解码工作配置的工作区大小不够*/
	JDR_MEM2,	/* 4: Insufficient stream input buffer 输入缓冲区的容量过小，JD_SZBUF数据过小*/
	JDR_PAR,	/* 5: Parameter error 参数错误*/
	JDR_FMT1,	/* 6: Data format error (may be damaged data) 图片数据错误*/
	JDR_FMT2,	/* 7: Right format but not supported 不支持的图片类型*/
	JDR_FMT3,	/* 8: Not supported JPEG standard 不支持的JPEG 格式*/
	JDR_SCALE,	/* 9: 图片缩放比例过大*/
	JDR_NO_FILE	/* 10: 打开图片失败*/
} JRESULT;



/* Rectangular structure 待输出的像素块的大小*/
typedef struct {
	WORD left, right, top, bottom;
	INT xstart, ystart;//起始显示坐标
} JRECT;



/* Decompressor object structure */
typedef struct JDEC JDEC;
struct JDEC {
	UINT dctr;				/* Number of bytes available in the input buffer 输入缓冲区的容量*/
	BYTE* dptr;				/* Current data read ptr 指向当前正在读取的数据的指针*/
	BYTE* inbuf;			/* Bit stream input buffer 指向输入缓冲区的指针*/
	BYTE dmsk;				/* Current bit in the current read byte 当前正在读取的字节中的当前的一个位*/
	BYTE scale;				/* Output scaling ratio 图像输出比例*/
	BYTE msx, msy;			/* MCU size in unit of block (width, height) 单片机一个内存块的大小 (宽度和高度)*/
	BYTE qtid[3];			/* Quantization table ID of each component 每个组件的量化表的编号*/
	SHORT dcv[3];			/* Previous DC element of each component */
	WORD nrst;				/* Restart inverval */
	UINT width, height;		/* Size of the input image (pixel) 输入的图片的大小（像素）*/
	BYTE* huffbits[2][2];	/* Huffman bit distribution tables [id][dcac] 霍夫曼比特分布表 [yc][dcac]*/
	WORD* huffcode[2][2];	/* Huffman code word tables [id][dcac] 霍夫曼码字表 [yc][dcac]*/
	BYTE* huffdata[2][2];	/* Huffman decoded data tables [id][dcac] 霍夫曼解码数据表 [yc][dcac]*/
	LONG* qttbl[4];			/* Dequaitizer tables [id] */
	void* workbuf;			/* Working buffer for IDCT and RGB output 指向解码工作区的指针*/
	BYTE* mcubuf;			/* Working buffer for the MCU MCU工作区的指针*/
	void* pool;				/* Pointer to available memory pool 可用的内存指针*/
	UINT sz_pool;			/* Size of momory pool (bytes available) 可用的内存的大小（以字节为单位）*/
	UINT (*infunc)(JDEC*, BYTE*, UINT);/* Pointer to jpeg stream input function 指向数据输入函数的指针*/
	void* device;			/* Pointer to I/O device identifiler for the session 指向解码工作中用到的应用信息的指针*/
#if JD_TBLZI==0
	BYTE *Zig;
	WORD *Ipsf;
#endif//JD_TBLZI
};
#if JD_TBLZI==0
typedef struct
{
	void *Zig;
	void *Ipsf;
}PicBuffer_Typedef;
#endif//#if JD_TBLZI==0
/* TJpgDec API functions */
JRESULT jd_prepare (JDEC*, UINT(*)(JDEC*,BYTE*,UINT), void*, UINT, void*);
JRESULT jd_decomp (JDEC*, UINT(*)(JDEC*,void*,JRECT*), BYTE,JRECT* );

#ifdef __cplusplus
}
#endif

#endif /* _TJPGDEC */
