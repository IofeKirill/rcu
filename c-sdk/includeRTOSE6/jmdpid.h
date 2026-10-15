#ifndef _JMDPID_H_
#define _JMDPID_H_

#include <stdint.h>


//PID
struct PidMotorGroup_Struct
{
	unsigned group1:4; //左
	unsigned group2:4; //右
};

typedef struct
{
	uint16_t Kp;//减速PID
	uint16_t Ki;//减速PID
	uint16_t Kpd;//轮差
	uint16_t th;//限定界限值
	uint16_t Kpx;//加速慢启动P
	int8_t Ktx;//转弯比例
}PidPara_Typedef;

void MotorPidCtrlStop(uint8_t which);
void PidPara_Init(uint8_t group,int dir,void *pid,int8_t angle);
uint8_t CarPidCtrl_Init(uint8_t group,//控制组,M1M2为0组,M3M4为1组
		               uint8_t which ,//高4位为R马达,低四位为L马达
		               int dir,//0直走,1转弯
		               int sp, //速度,转弯是速度正负代表反方向转
		               long pulse);//目标脉冲
void CarPidCtrl_Hook(void);//转角度 sp=[20,90]


#endif//_JMDPID_H_
