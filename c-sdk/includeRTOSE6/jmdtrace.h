#ifndef _JMDTRACE_H_
#define _JMDTRACE_H_
//#include "lcd320240.h"
//#include "stm32f4xx_hal.h"
//#include "stm32f4xx.h"

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "I2C_Soft.h"
#include "jmkernel.h"
#include "Pinformat.h"

#define uint32_t unsigned int

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;


/************************************内置函数*************************************************/

/************************************内置函数*************************************************/
volatile uint8_t line_color = 0;
volatile uint8_t type_flag = 0;         //光电和循迹卡的切换
volatile uint8_t trace_port = 1;        //trace端口
volatile uint8_t motor_left_port = 1;   //马达左端口
volatile uint8_t motor_right_port = 2;  //马达右端口
volatile float light_pro = 0.6;         //巡线速率
volatile uint8_t chassis_status = 0;

volatile uint32_t _time = 0;


volatile int32_t track_line_tt1 = 0;

volatile int32_t track_line_zz = 0;

volatile uint32_t _time_start = 0;
volatile uint32_t _time_outer = 0;
volatile uint32_t _left_motor_code = 0;
volatile uint32_t _right_motor_code = 0;

volatile int32_t _temp = 0;


volatile uint8_t SL_outer = 0;
volatile uint8_t SL2 = 0;
volatile uint8_t SL1 = 0;
volatile uint8_t SC = 0;
volatile uint8_t SR1 = 0;
volatile uint8_t SR2 = 0;
volatile uint8_t SR_outer = 0;
volatile uint8_t trace_state_data = 0;

void trace_Line_Set_Initialize(uint8_t which,char * temp_color,char * temp_chassis);
void trace_Line_Speed_Control(int8_t left_speed,int8_t right_speed);
void trace_Line_Intersection_Stop(int32_t speed,int32_t which);
void trace_Line_Basis(int8_t speed);
void trace_Line_Get_State();
void trace_Line_Millisecond(int8_t speed, int32_t time);
void trace_Line_Turn_Encounterline(int32_t left_speed,int32_t right_speed,int32_t whi);
void trace_Line_For_Bmp(int32_t speed,int32_t bmp);

/*                      光电端口号                          */
volatile uint8_t light_line_p1 = 1;
volatile uint8_t light_line_p2 = 2;
volatile uint8_t light_line_p3 = 3;
volatile uint8_t light_line_p4 = 4;
volatile uint8_t light_line_p5 = 5;

extern uint16_t ThADValue[8];
extern uint8_t Flag_ADS[8];
extern uint8_t _Adc_initdelay;
extern uint16_t _Adc_indicatorlamp;


static int32_t my_fabs(int32_t num)
{
    int32_t res =num;
    if(num < 0)
        res = (-num);
    return res;
}


static void Get_Trace_V2I2CState( uint8_t which)
{
	uint32_t port1=portarray[RcuPORT[which][0]];//I2C_SCL
	uint32_t port2=portarray[RcuPORT[which][1]];//I2C_SDA
	uint8_t bit1=RcuPIN[which][0];
	uint8_t bit2=RcuPIN[which][1];

	uint8_t m_ChannelState;
   //OS_ENTER_CRITICAL();

	RcuWhichMutexTake(which,1,0XFFFF);//获取端口IIC使用权
    Soft_I2C_Typedef iic_typedef;
	 Soft_I2C_BspInit(port2,bit2,//SDA
                    port1,bit1,//SCL
										&iic_typedef);


    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x18);
    Soft_I2C_Write(&iic_typedef,9);
    Soft_I2C_Stop(&iic_typedef);
    
    Soft_I2C_Start(&iic_typedef);
    Soft_I2C_Write(&iic_typedef,0x19);
    m_ChannelState=Soft_I2C_Read(&iic_typedef,1);
    Soft_I2C_Stop(&iic_typedef);

	trace_state_data = m_ChannelState;

}

static uint8_t get_trace_state(uint8_t portx,uint8_t bit)
{
    uint16_t data;
    data = trace_state_data   &   (0x01   <<   (bit-1))   ?   1   :   0;

    if(TraceLineColor[portx-1] == 0)
	 	data = data;
	else 
		data = (!data);
    return data;
}

uint16_t Get_Light_SensorData(uint8_t which)
{
    uint32_t port1 = portarray[RcuPORT[which][0]];
    uint32_t port2 = portarray[RcuPORT[which][1]];
    uint32_t port3 = portarray[RcuPORT[which][2]];
    uint8_t bit1=RcuPIN[which][0];
    uint8_t bit2=RcuPIN[which][1];
    uint8_t bit3=RcuPIN[which][2];
    uint16_t i,th;
    uint8_t channel;
	
    GPIO_Setting((GPIO_TypeDef*)port1,bit1,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port2,bit2,GPIO_MODE_OUTPUT_PP);
	GPIO_Setting((GPIO_TypeDef*)port3,bit3,GPIO_MODE_ANALOG);

    if(Flag_ADS[which-1]==0)
    {
        RcuWhichMutexTake(which,1,4095);
        HAL_GPIO_WritePin((GPIO_TypeDef*)port1,(1<<bit1),GPIO_PIN_SET);
        Flag_ADS[which-1]=0X81;
        Delay1ms(5);
        RcuWhichMutexGive(which,1,4095);
    }
    if(_Adc_initdelay==0)
    {
        Delay1ms(1);
        _Adc_initdelay=1;
    }
        i=GetAdcResult(which);
    th=ReadAdcThreshold(which-1);

    if(i<th)
    {
        i=1;
        if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)
        HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_SET);
    }
    else 
    {
        i=0;
        if(((_Adc_indicatorlamp>>(which-1))&0x01)==0)
        HAL_GPIO_WritePin((GPIO_TypeDef*)port2,(1<<bit2),GPIO_PIN_RESET);
    }
    if(line_color == 1)
        return !i;
    return (uint16_t)i;
}


/*初始设置光电端口，巡线颜色，底盘颜色*/
void trace_Line_Set_Initialize_For_Light(uint8_t p1,uint8_t p2,uint8_t p3,uint8_t p4,uint8_t p5,char * temp_color,char * temp_chassis)
{
    light_line_p1 = p1;
    light_line_p2 = p2;
    light_line_p3 = p3;
    light_line_p4 = p4;
    light_line_p5 = p5;
	type_flag = 1;

    if (strcmp(temp_color,"black") == 0){
        line_color = 0;

    }
    else if (strcmp(temp_color,"white") == 0){
        line_color = 1;
    }
    if (strcmp(temp_chassis,"wheeledchassis") == 0){
        chassis_status = 0;
    }	
    else if (strcmp(temp_chassis,"mecanumchassis") == 0){
        chassis_status = 1;
    }
    trace_Line_Get_State();

	return;
}

/*设置轮式底盘端口，以及马达转动方向*/
void trace_Line_Set_Chassis(uint8_t m_left_port,uint8_t m_right_port,char * direction)
{
	motor_left_port = m_left_port;
    motor_right_port = m_right_port;
    if (strcmp(direction,"left_reversal") == 0){
        Change_Motor_Dir(motor_left_port,1);
        Change_Motor_Dir(motor_right_port,0);
    }
    else if (strcmp(direction,"right_reversal") == 0){
        Change_Motor_Dir(motor_left_port,0);
        Change_Motor_Dir(motor_right_port,1);
    }
    if (strcmp(direction,"all_reversal") == 0){
        Change_Motor_Dir(motor_left_port,1);
        Change_Motor_Dir(motor_right_port,1);
    }
	else if (strcmp(direction,"no_reversal") == 0){
        Change_Motor_Dir(motor_left_port,0);
        Change_Motor_Dir(motor_right_port,0);
    }
	return;
}

/*设置巡线转弯比例*/
void trace_Line_Set_Proportio(uint8_t power)
{

	light_pro = (float)power/(float)100;

}

/*初始设置循迹卡端口，巡线颜色，底盘颜色*/
void trace_Line_Set_Initialize(uint8_t which,char * temp_color,char * temp_chassis)
{
    type_flag = 0;
	trace_port = which;
    if (strcmp(temp_color,"black") == 0){
        line_color = 0;
        TraceLineColor[trace_port-1] = 0;
    }
    else if (strcmp(temp_color,"white") == 0){
        line_color = 1;
        TraceLineColor[trace_port-1] = 1;
    }
    if (strcmp(temp_chassis,"wheeledchassis") == 0){
        chassis_status = 0;
    }
	else if (strcmp(temp_chassis,"mecanumchassis") == 0){
        chassis_status = 1;
    }
    trace_Line_Get_State();

	return;
}

/*定义左速度和右速度*/
void trace_Line_Speed_Control(int8_t left_speed,int8_t right_speed)
{
	if (chassis_status == 0)
    {
        Set_Motor_X(motor_left_port,left_speed);
        Set_Motor_X(motor_right_port,right_speed);
    } 
    else if (chassis_status == 1)
    {
        Set_Motor_X(1,left_speed);
        Set_Motor_X(2,right_speed);
        Set_Motor_X(3,left_speed);
        Set_Motor_X(4,right_speed);
        
    }
	return;
}




/*遇线停止*/
void trace_Line_Intersection_Stop(int32_t speed,int32_t which)
{
    trace_Line_Speed_Control(speed,speed);
    _time = (uint32_t)GetSystemTime();
    while(!((((uint32_t)GetSystemTime()-_time))>200 && SL_outer == 0 &&SR_outer == 0))
    {
        trace_Line_Basis(speed);
    }
    trace_Line_Get_State();
    if (which == 17 || which == 15)
    {
        while (!((SL_outer == 1) && (SR_outer == 1))){
            trace_Line_Basis(speed);
        }
    } 
    else if (which == 1)
    {
        while (!(SL_outer == 1)){
            trace_Line_Basis(speed);
        }
    }
    else if (which == 5 || which == 7)
    {
        while (!(SR_outer == 1)){
            trace_Line_Basis(speed);
        }
    }

    trace_Line_Speed_Control(0,0);
    SetAddMusicPlay(1047,50);
	return ;

}

/*以基础速度巡线一次*/
void trace_Line_Basis(int8_t speed)
{
    trace_Line_Get_State();
    _time_start = (uint32_t)GetSystemTime();
    if(type_flag == 1)
    {
        if(SL2 == 1)
        {
            _temp = 1;
            _time_outer = (uint32_t)GetSystemTime();
        }
        else if(SR1 == 1)
        {
            _temp = 5;
            _time_outer = (uint32_t)GetSystemTime();
        }

        if (SC == 1){
            trace_Line_Speed_Control(speed, speed);
            if ((_time_start - _time_outer) > 200)
                _temp = 3;
        } 
        else if(SL1 == 1)
        {
            trace_Line_Speed_Control(speed*light_pro, speed);
            if ((_time_start - _time_outer) > 200)
                _temp = 2;
        }
        else if(SR1 == 1)
        {
            trace_Line_Speed_Control(speed, speed*light_pro);
            if ((_time_start - _time_outer) > 200)
                _temp = 4;
        }
        else if(SL2 == 1)
        {
            trace_Line_Speed_Control(-40, 50);
        }
        else if(SR2 == 1)
        {
            trace_Line_Speed_Control(50, -40);
        }
        else
        {
            if (_temp == 0){
                trace_Line_Speed_Control(speed, speed );
            }
            if (_temp == 1){
                trace_Line_Speed_Control(-45, 55);
            }
            if (_temp == 2){
                trace_Line_Speed_Control(0, speed);
            }
            if (_temp == 3){
                trace_Line_Speed_Control(speed, speed);
            }
            if (_temp == 4){
                trace_Line_Speed_Control(speed, 0);
            }
            if (_temp == 5){
                trace_Line_Speed_Control(55, -45);
            }
        }
    }
    else
    {
        if(SL_outer == 1)
        {
            _temp = 1;
            _time_outer = (uint32_t)GetSystemTime();
        }
        else if(SR_outer == 1)
        {
            _temp = 7;
            _time_outer = (uint32_t)GetSystemTime();
        }

        if (SC == 1){
            trace_Line_Speed_Control(speed, speed);
            if ((_time_start - _time_outer) > 200)
                _temp = 4;
        } 
        else if(SL1 == 1 && SC == 1)
            trace_Line_Speed_Control(speed*0.8, speed);
        else if(SC==1 && SR1 == 1)
            trace_Line_Speed_Control(speed*0.8, speed);
        else if(SL1 == 1)
        {
            trace_Line_Speed_Control(speed*0.5, speed);
            if ((_time_start - _time_outer) > 200)
                _temp =3;
        }
        else if(SR1==1)
        {
            trace_Line_Speed_Control(speed, speed*0.5);
            if ((_time_start - _time_outer) > 200)
                _temp =5;
        }
        else if(SL2==1)
        {
            trace_Line_Speed_Control(0, speed);
            if ((_time_start - _time_outer) > 200)
                _temp =2;
        }
        else if(SR2==1)
        {
            trace_Line_Speed_Control(speed, 0);
            if ((_time_start - _time_outer) > 200)
                _temp =6;
        }
        else
        {
            if(SL_outer){
                trace_Line_Speed_Control(-40, 50 );
            }
            else if (SR_outer){
                trace_Line_Speed_Control(50, -40 );
            }
            else if (_temp == 1){
                trace_Line_Speed_Control(-40, 50);
            }
            else if (_temp == 2){
                trace_Line_Speed_Control(speed*0.8, speed);
            }
            else if (_temp == 3){
                trace_Line_Speed_Control(speed, speed);
            }
            else if (_temp == 6){
                trace_Line_Speed_Control(speed, speed*0.8);
            }
            else if (_temp == 7){
                trace_Line_Speed_Control(50, -40);
            }
            else if(_temp == 5 || _temp == 0 || _temp == 4){
                trace_Line_Speed_Control(speed, speed);
            }

        }
    }
   
	return ;
}
/*巡线时间*/
void trace_Line_Millisecond(int8_t speed, int32_t time)
{
    _time = (uint32_t)GetSystemTime();
    while (( ((uint32_t)GetSystemTime()) - _time) < time){
        trace_Line_Basis(speed);
    }
    
    trace_Line_Speed_Control(0,0);
}

/*读取光电值*/
void trace_Line_Get_State()
{
    // if(line_color == 0)
    // {
    //     LCD_String(0,GetFontLibHeight(),"Init Error", 0xFFE0, 0x0000,0);
    //     LCD_String(0,(1)*GetFontLibHeight(),"Set Track Mode", 0xFFE0, 0x0000,0);
    //     LCD_String(0,(2)*GetFontLibHeight(),"Set Wheeled Mode", 0xFFE0, 0x0000,0);
    //     trace_port = 1;
    //     line_color = 70;
    //     chassis_status = 1;
    // }
    if(type_flag ==1)
    {
        SL2 = Get_Light_SensorData(light_line_p1);
        SL1 = Get_Light_SensorData(light_line_p2);
        SC = Get_Light_SensorData(light_line_p3);
        SR1 = Get_Light_SensorData(light_line_p4);
        SR2 = Get_Light_SensorData(light_line_p5);
        SL_outer = SL2;
        SR_outer = SR2;
    }
    else
    {
        Get_Trace_V2I2CState(trace_port);
        SL_outer = get_trace_state(trace_port,1);
        SL2 = get_trace_state(trace_port,2);
        SL1 = get_trace_state(trace_port,3);
        SC = get_trace_state(trace_port,4);
        SR1 = get_trace_state(trace_port,5);
        SR2 = get_trace_state(trace_port,6);
        SR_outer = get_trace_state(trace_port,7);
    }
}



/*转弯遇线*/
void trace_Line_Turn_Encounterline(int32_t left_speed,int32_t right_speed,int32_t whi)
{
    uint8_t state = 0;
    trace_Line_Speed_Control(left_speed,right_speed);
    Delay1ms(200);
    trace_Line_Get_State();
    if(type_flag == 1)
    {
        if(whi == 1)
        {
            while (SL2 == 0)
                trace_Line_Get_State();
        }
        else if(whi == 2)
        {
            while (SL1 == 0)
                trace_Line_Get_State();
        }
        else if(whi == 3)
        {
            while (SC == 0)
                trace_Line_Get_State();
        }
        else if(whi == 4)
        {
            while (SR1 == 0)
                trace_Line_Get_State();
        }
        else if(whi == 5)
        {
            while (SR2 == 0)
                trace_Line_Get_State();
        }
    }
    else
    {
        while (!state)
        {
            Get_Trace_V2I2CState(trace_port);
            state = get_trace_state(trace_port,whi);
        }
    }
	SetAddMusicPlay(1760,50);
    trace_Line_Speed_Control(0,0);
}
/*巡线编码*/
void trace_Line_For_Bmp(int32_t speed,int32_t bmp)
{
    _left_motor_code = Get_Motor_Code(motor_left_port);
    _right_motor_code = Get_Motor_Code(motor_right_port);
    while (!((my_fabs((Get_Motor_Code(motor_left_port) - _left_motor_code)) > bmp) || (my_fabs((Get_Motor_Code(motor_right_port) - _right_motor_code)) > bmp))){
        trace_Line_Basis(speed);

    }
	
    trace_Line_Speed_Control(0,0);
}





#endif // JMDMQTT_H

