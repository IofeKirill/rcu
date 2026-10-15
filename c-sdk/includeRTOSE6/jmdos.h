#ifndef  _JMDOS_H_
#define  _JMDOS_H_

#include <jmkernel.h>
#include "FreeRTOSConfig.h"
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "list.h"
#include "portable.h"
#include "jmd_task.h"
#include "jmdpiclib.h"


//#define _TASK_1_ 1
//#define _TASK_2_ 1
//#define _TASK_3_ 1
//#define _TASK_4_ 1
//#define _TASK_5_ 1
//#define _TASK_6_ 1
//#define _TASK_7_ 1
//#define _TASK_8_ 1

#define _MAIN_TASK_DISABLE_ //禁用main
#define _TASK_BT_	1//蓝牙任务
#define _PICTURETASK_EN_	1//图片显示任务

#define RTOS_MAIN_TASK_STACK_SIZE	256	//堆栈空间//主程序堆栈空间一定要够，否则会出现很奇怪问题
#define RTOS_TASK_STACK_SIZE		192	//256//128//堆栈空间
#define RTOS_TASK_PRIORITIES		3	//用户任务优先级


void task_main_entry(void);
void task1_entry(void);
void task2_entry(void);
void task3_entry(void);
void task4_entry(void);
void task5_entry(void);
void task6_entry(void);
void task7_entry(void);
void task8_entry(void);

uint16_t OS_CreateTask(uint8_t tasknum);	//任务创建,一次性操作
uint16_t OS_TaskDelete(uint8_t tasknum);	//任务删除,一次性操作
uint16_t OS_TaskSuspend(uint8_t tasknum);	//任务挂起
uint16_t OS_TaskResume(uint8_t tasknum);	//任务唤醒

void Create_Task(void);
//void BoardHardware_Init(void);


//以下为任务句柄,用于任务的挂起，删除等
xTaskHandle xComTaskHandle;//创建WIFI接收任务

#ifndef _MAIN_TASK_DISABLE_//当这个宏定义没有被定义时,默认初始化主任务main,适配scratch
	xTaskHandle xMainHandle;
#endif

#ifdef _TASK_1_
	xTaskHandle xTask1Handle;
#endif

#ifdef _TASK_2_
	xTaskHandle xTask2Handle;
#endif

#ifdef _TASK_3_
	xTaskHandle xTask3Handle;
#endif

#ifdef _TASK_4_
	xTaskHandle xTask4Handle;
#endif

#ifdef _TASK_5_
	xTaskHandle xTask5Handle;
#endif

#ifdef _TASK_6_
	xTaskHandle xTask6Handle;
#endif

#ifdef _TASK_7_
	xTaskHandle xTask7Handle;
#endif

#ifdef _TASK_8_
	xTaskHandle xTask8Handle;
#endif


void Create_Task(void)//任务创建与启动系统
{
#ifndef _MAIN_TASK_DISABLE_			//当这个宏定义没有被定义时,默认初始化主任务,适配scratch
	xTaskCreate(task_main_entry,	//任务地址,任务函数指针
			        ( const signed char * )"task_main", 	//任务名
			        RTOS_MAIN_TASK_STACK_SIZE,//RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
			        NULL, 			//指针用于参数传向创建的任务
			        RTOS_TASK_PRIORITIES,	//RTOS_TASK_PRIORITIES,//2//任务优先级
			        &xMainHandle ); //传递任务句柄,可以应用从而对任务进行其它操作
#endif//_MAIN_TASK_DISABLE_	
					
#if _TASK_1_ > 0//预处理宏为1时,开始调度之前初始化用到的任务
	OS_CreateTask(1);
#endif

#if _TASK_2_ > 0
	OS_CreateTask(2);
#endif

#if _TASK_3_ > 0
	OS_CreateTask(3);
#endif

#if _TASK_4_ > 0
	OS_CreateTask(4);
#endif

#if _TASK_5_ > 0
	OS_CreateTask(5);
#endif

#if _TASK_6_ > 0
	OS_CreateTask(6);
#endif

#if _TASK_7_ > 0
	OS_CreateTask(7);
#endif

#if _TASK_8_ > 0
	OS_CreateTask(8);
#endif

#ifdef _TASK_BT_
	Create_ComTask();
#endif

	//开始调度
	vTaskStartScheduler();
}

#ifdef _TASK_BT_
void task_com_entry(void);
uint8_t Create_ComTaskFlag=0;
void Create_ComTask(void)//创建通信任务
{
	if(Create_ComTaskFlag)return;Create_ComTaskFlag=1;
	xTaskCreate(task_com_entry,//任务地址,任务函数指针
							( const signed char * )"task_com_entry", //任务名
							128,//RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
							NULL, //指针用于参数传向创建的任务
							RTOS_TASK_PRIORITIES,//RTOS_TASK_PRIORITIES,//2//任务优先级
							&xComTaskHandle );//传递任务句柄,可以应用从而对任务进行其它操作
}

void os_com_task(void);//主任务
void task_com_entry(void)//主任务,必须定义
{
	os_com_task();
	vTaskDelete(NULL);//参数任务避免出现空任务或者任务被意外返回
	return 0;
}
#endif//_TASK_BT_

#ifdef _PICTURETASK_EN_
xTaskHandle xPicTaskHandle;//创建WIFI接收任务
int Create_PicTask(void);
void task_pic_entry(void);
uint8_t _Create_PicTaskFlag=0;
int Create_PicTask(void)//创建通信任务
{
	if(_Create_PicTaskFlag)return _Create_PicTaskFlag;_Create_PicTaskFlag=1;
	xTaskCreate(task_pic_entry,//任务地址,任务函数指针
							( const signed char * )"task_pic_entry", //任务名
							1728,//2048,//RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
							NULL, //指针用于参数传向创建的任务
							RTOS_TASK_PRIORITIES,//RTOS_TASK_PRIORITIES,//2//任务优先级
							&xPicTaskHandle );//传递任务句柄,可以应用从而对任务进行其它操作
	return 0;
}
void os_picture_task(void);
void task_pic_entry(void)
{
	os_picture_task();
	vTaskDelete(NULL);//参数任务避免出现空任务或者任务被意外返回
	return 0;
}
void PicTaskSuspend(void)
{
	vTaskSuspend(xPicTaskHandle);
}
void PicTaskResume(void)
{
	vTaskResume(xPicTaskHandle);
}
#endif//_PICTURETASK_EN_

#ifndef _MAIN_TASK_DISABLE_//当这个宏定义没有被定义时,默认初始化主任务,适配scratch
int main(void);//主任务
void task_main_entry(void)//主任务,必须定义
{
  	main();
	vTaskDelete(NULL);//参数任务避免出现空任务或者任务被意外返回
	return 0;
}
#endif//#ifndef _MAIN_TASK_DISABLE_

#ifdef _TASK_1_
void task1(void);
void task1_entry(void)
{
	task1();
	vTaskDelete(NULL);
}
#endif//_TASK_1_

#ifdef _TASK_2_
void task2(void);
void task2_entry(void)
{
	task2();
	vTaskDelete(NULL);
}
#endif//_TASK_2_

#ifdef _TASK_3_
void task3(void);
void task3_entry(void)
{
	task3();
	vTaskDelete(NULL);
}
#endif//_TASK_3_

#ifdef _TASK_4_
void task4(void);
void task4_entry(void)
{
	task4();
	vTaskDelete(NULL);
}
#endif//_TASK_4_

#ifdef _TASK_5_
void task5(void);
void task5_entry(void)
{
	task5();
	vTaskDelete(NULL);
}
#endif//_TASK_5_

#ifdef _TASK_6_
void task6(void);
void task6_entry(void)
{
	task6();
	vTaskDelete(NULL);
}
#endif//_TASK_6_

#ifdef _TASK_7_
void task7(void);
void task7_entry(void)
{
	task7();
	vTaskDelete(NULL);
}
#endif//_TASK_7_

#ifdef _TASK_8_
void task8(void);
void task8_entry(void)
{
	task8();
	vTaskDelete(NULL);
}
#endif//_TASK_8_

//当任务想要获取被其它任务占用的端口使用权时,进入超时等待其他任务放弃使用权,如果超时依然没有获取,应该退出，以保障下面程序可以执行
#define MUTEXTAKETICKTOWAIT		100	//100ms
volatile uint16_t MutexTakeWaitTime=MUTEXTAKETICKTOWAIT;//端口被其它任务占用情况下的超时时间
void SetPortMutexTakeWaitTime(uint16_t time){MutexTakeWaitTime=time;}


#define RcuWhichMutexTake(which,mode,Return) if(RcuPortMutexTake(which,mode)==2)\
                                            {\
												if(mode!=0)\
												{\
													uint32_t t_time=GetSystemTime()+MutexTakeWaitTime;\
													while(RcuPortMutexTake(which,mode)==2)\
													{\
														if(t_time<GetSystemTime())return(Return);\	
													}\
												}\
											}

//释放RCU端口使用权，只有占有端口的任务放弃使用权，其它任务才能使用该端口 																								 
#define RcuWhichMutexGive(which,mode,Return) RcuPortMutexGive(which,mode)


#define _GET_FLAG(flagx,bity)			((flagx>>(bity<<1))&0X03)
#define _SET_FLAG(flagx,bity,state)		(flagx|=(state<<(bity<<1)))
#define _RESET_FLAG(flagx,bity,state)	(flagx&=~(state<<(bity<<1)))
static volatile uint32_t __task_create_flag=0;
static volatile uint32_t __task_management_flag=0;
#define vTaskHardwareMutexRelease(taskhandle) //RcuPortMutexRelease(taskhandle)//释放已使用的引脚
#define vTaskManagement_Enter()			os_setinterruptmask()//##关内核中断
#define vTaskManagement_Leave()			os_clearinterruptmask()//##开内核中断


static uint8_t _Get_OSTaskNum(uint8_t tasknum)
{
	extern pxCurrentTCB;//当前运行的任务栈顶
	if(tasknum)return tasknum;
	//if(pxCurrentTCB==xMainHandle)return 0;
	
#ifdef _TASK_1_
	if(pxCurrentTCB==xTask1Handle)return 1;
#endif//_TASK_1_

#ifdef _TASK_2_
	if(pxCurrentTCB==xTask2Handle)return 2;
#endif//_TASK_2_

#ifdef _TASK_3_
	if(pxCurrentTCB==xTask3Handle)return 3;
#endif//_TASK_3_

#ifdef _TASK_4_
	if(pxCurrentTCB==xTask4Handle)return 4;
#endif//_TASK_4_

#ifdef _TASK_5_
	if(pxCurrentTCB==xTask5Handle)return 5;
#endif//_TASK_5_

#ifdef _TASK_6_
	if(pxCurrentTCB==xTask6Handle)return 6;
#endif//_TASK_6_

#ifdef _TASK_7_
	if(pxCurrentTCB==xTask7Handle)return 7;
#endif//_TASK_7_

#ifdef _TASK_8_
	if(pxCurrentTCB==xTask8Handle)return 8;
#endif//_TASK_8_

	return 0;
}

static int16_t RTOS_TaskManagement(xTaskHandle taskhandle,uint8_t mode)//挂起/唤醒/删除任务
{
	switch(mode)
	{	//删除任务
		case 1:	vTaskManagement_Enter();
			    vTaskHardwareMutexRelease(taskhandle);
			    vTaskDelete(taskhandle);
			    vTaskManagement_Leave();
	  			return 1;
		//挂起任务
		case 2:	vTaskManagement_Enter();
			    vTaskHardwareMutexRelease(taskhandle);
		        vTaskSuspend(taskhandle);
		        vTaskManagement_Leave();
				return 2;
		break;
		//唤醒挂起的任务,不能唤醒任务自身
		case 3: vTaskResume(taskhandle);
				return 3;
		break;
	}
	return 0;
}

uint16_t OS_TaskManagement(uint8_t tasknum,uint8_t mode)//任务管理
{
	uint16_t state=NULL;
	extern pxCurrentTCB;//当前运行的任务栈顶
	switch(tasknum)
	{
		case 0://挂起/删除自己
		#ifndef _MAIN_TASK_DISABLE_//当这个宏定义没有被定义时,默认初始化主任务,适配scratch
		if(pxCurrentTCB!=xMainHandle)//不要挂起/删除main任务
		#endif//_MAIN_TASK_DISABLE_
				state=RTOS_TaskManagement(NULL,mode);			break;
		
		#ifdef _TASK_1_
		case 1:	state=RTOS_TaskManagement(xTask1Handle, mode);	break;
		#endif//_TASK_1_

		#ifdef _TASK_2_
		case 2:	state=RTOS_TaskManagement(xTask2Handle, mode);	break;
		#endif//_TASK_2_

		#ifdef _TASK_3_
		case 3:	state=RTOS_TaskManagement(xTask3Handle, mode);	break;
		#endif//_TASK_3_

		#ifdef _TASK_4_
		case 4:	state=RTOS_TaskManagement(xTask4Handle, mode);  break;
		#endif//_TASK_4_

		#ifdef _TASK_5_	
		case 5:	state=RTOS_TaskManagement(xTask5Handle, mode);  break;
		#endif//_TASK_5_

		#ifdef _TASK_6_	
		case 6:	state=RTOS_TaskManagement(xTask6Handle, mode);  break;
		#endif//_TASK_6_

		#ifdef _TASK_7_
		case 7:	state=RTOS_TaskManagement(xTask7Handle, mode);  break;
		#endif//_TASK_7_

		#ifdef _TASK_8_
		case 8:	state=RTOS_TaskManagement(xTask8Handle, mode);  break;
		#endif//_TASK_8_		
	}
	return state;
}

uint16_t OS_TaskDelete(uint8_t tasknum)//任务删除
{
	uint8_t n=_Get_OSTaskNum(tasknum);//获取任务编号
	if(_GET_FLAG(__task_create_flag,n)==0)return 0;
	if(_GET_FLAG(__task_management_flag,n)==1)return 1;_SET_FLAG(__task_management_flag,n,1);
	OS_TaskManagement(tasknum, 1);
	return 1;
}

uint16_t OS_TaskSuspend(uint8_t tasknum)//任务挂起
{//已经挂起的任务就不需要再进行挂起，已经删除的任务不能挂起
	uint8_t n=_Get_OSTaskNum(tasknum);//获取任务编号
	if(_GET_FLAG(__task_create_flag,n)==0)return 0;
	uint8_t flag=_GET_FLAG(__task_management_flag,n);
	if(flag==1||flag==2)return flag;_SET_FLAG(__task_management_flag,n,2);
	OS_TaskManagement(tasknum, 2);
	return 2;
}

uint16_t OS_TaskResume(uint8_t tasknum)//任务唤醒
{//已经唤醒的任务就不需要再进行唤醒，已经删除的任务不能唤醒
	uint8_t n=_Get_OSTaskNum(tasknum);//获取任务编号
	if(_GET_FLAG(__task_create_flag,n)==0)return 0;
	uint8_t flag=_GET_FLAG(__task_management_flag,n);
	if(flag==1||flag==3)return flag;_SET_FLAG(__task_management_flag,n,0x03);
	OS_TaskManagement(tasknum, 3);
	return 3;
}

uint16_t OS_CreateTask(uint8_t tasknum)//创建任务
{
	if(_GET_FLAG(__task_create_flag,tasknum))return 0;_RESET_FLAG(__task_management_flag,tasknum,0x03);
	switch(tasknum)
	{
		#ifdef _TASK_1_	
		case 1:
			xTaskCreate(task1_entry,//任务地址,任务函数指针
					        ( const signed char * )"task1", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask1Handle );//传递任务句柄,可以应用从而对任务进行其它操作
		break;
		#endif//_TASK_1_
		
		#ifdef _TASK_2_
		case 2:
			xTaskCreate(task2_entry,//任务地址,任务函数指针
					        ( const signed char * )"task2", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask2Handle );//传递任务句柄,可以应用从而对任务进行其它操作
	  	break;
	 	#endif//_TASK_2_
		
		#ifdef _TASK_3_
		case 3:
			xTaskCreate(task3_entry,//任务地址,任务函数指针
					        ( const signed char * )"task3", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask3Handle );//传递任务句柄,可以应用从而对任务进行其它操作
		break;
		#endif//_TASK_3_
		
		#ifdef _TASK_4_
		case 4:
			xTaskCreate(task4_entry,//任务地址,任务函数指针
					        ( const signed char * )"task4", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask4Handle );//传递任务句柄,可以应用从而对任务进行其它操作
    	break;
		#endif//_TASK_4_	
		
		#ifdef _TASK_5_
		case 5:
			xTaskCreate(task5_entry,//任务地址,任务函数指针
					        ( const signed char * )"task5", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask5Handle );//传递任务句柄,可以应用从而对任务进行其它操作
    	break;
		#endif//_TASK_5_	
		
		#ifdef _TASK_6_
		case 6:
			xTaskCreate(task6_entry,//任务地址,任务函数指针
					        ( const signed char * )"task6", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask6Handle );//传递任务句柄,可以应用从而对任务进行其它操作
    	break;
		#endif//_TASK_6_
		
		#ifdef _TASK_7_	
		case 7:
			xTaskCreate(task7_entry,//任务地址,任务函数指针
					        ( const signed char * )"task7", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask7Handle );//传递任务句柄,可以应用从而对任务进行其它操作
    	break;
		#endif//_TASK_7_
		
		#ifdef _TASK_8_
		case 8:
			xTaskCreate(task8_entry,//任务地址,任务函数指针
					        ( const signed char * )"task8", //任务名
					        RTOS_TASK_STACK_SIZE,//256,//任务堆栈空间
					        NULL, //指针用于参数传向创建的任务
					        RTOS_TASK_PRIORITIES,//2//任务优先级
					        &xTask8Handle );//传递任务句柄,可以应用从而对任务进行其它操作
    	break;
		#endif//_TASK_8_		
	}

	_SET_FLAG(__task_create_flag,tasknum,0x01);
	return 1;
}

void OS_WifiTaskSuspend(void)//挂起WIFI任务
{
	vTaskManagement_Enter();
	vTaskHardwareMutexRelease(xComTaskHandle);
	vTaskSuspend(xComTaskHandle);
	vTaskManagement_Leave();
}
void OS_WifiTaskResume(void)//唤醒WIFI任务
{
	//唤醒挂起的任务,不能唤醒任务自身
	vTaskResume(xComTaskHandle);
}
void OS_PicTaskSuspend(void)//挂起Pic任务
{
	vTaskSuspend(xPicTaskHandle);
}
void OS_PicTaskResume(void)//唤醒Pic任务
{
	//唤醒挂起的任务,不能唤醒任务自身
	vTaskResume(xPicTaskHandle);
}

#endif


