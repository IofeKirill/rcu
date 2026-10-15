#ifndef _PINFORMAT_
#define _PINFORMAT_
//0 GPIOA GPIOB GPIOC GPIOD GPIOE
const uint32_t portarray[6]={0,0x40020000,0x40020400,0x40020800,0x40020C00,0x40021000};
//端口排列定义 3 ,4 ,6 ,5 -> SCL,SDC,ADC/TXD,RXD
const uint8_t  RcuPORT[9][4]={{0,0,0,0},{5 ,5 ,1 ,0 },{2 ,5 ,3 ,0 }, //P1 P2
										{5 ,5 ,1 ,0 },{5 ,5 ,1 ,0 }, //P3 P4
										{5 ,5 ,2 ,0 },{5 ,5 ,1 ,0 }, //P5 P6
										{5 ,5 ,3 ,0 },{2 ,2 ,1 ,1 }};//P7 P8
										
const uint8_t  RcuPIN[9][4]={{0,0,0,0},	{8 ,9 ,7 ,0 },{2 ,7 ,4 ,0 }, //P1 P2
										{4 ,5 ,4 ,0 },{2 ,3 ,0 ,0 }, //P3 P4
										{10,11,0 ,0 },{0 ,1 ,1 ,0 }, //P5 P6
										{12,13,5 ,0 },{8 ,9 ,2 ,3 }};//P7 P8
							
#define _P1_ 1
#define _P2_ 2
#define _P3_ 3
#define _P4_ 4
#define _P5_ 5
#define _P6_ 6
#define _P7_ 7
#define _P8_ 8

#define _M1_ 1
#define _M2_ 2
#define _M3_ 3
#define _M4_ 4

#endif
