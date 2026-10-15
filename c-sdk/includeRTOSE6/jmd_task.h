//***************************(C) COPYRIGHT 2019 LXW ******************************
// File Name   	: jmd_task.h 
// Author       : LXW
// Version      : V0.0
// Date         : 2019/4/25
// Target       : E6RCU
// Compiler     : GCCARM
// Description  : 
//*******************************************************************************
//
//*******************************************************************************
#ifndef _JMD_TASK_H_
#define _JMD_TASK_H_
//Define to prevent recursive inclusion -------------------------------------


//Includes -必要的头文件-----------------------------------------------------

//#include "jmdram.h"
#include "jdy16.h"

void os_com_task(void);//蓝牙通信任务
void os_com_task(void)//蓝牙通信任务
{
	BlueTH_Init(115200);
	while(1);
}


#endif
