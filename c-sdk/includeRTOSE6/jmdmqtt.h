#ifndef _JMDMQTT_H_
#define _JMDMQTT_H_
//#include "lcd320240.h"
//#include "stm32f4xx_hal.h"
//#include "stm32f4xx.h"

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "I2C_Soft.h"
#include "jmkernel.h"

#define uint32_t unsigned int

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
// extern uint8_t buf_len;

// //发字符串
// void mqtt_modle_send_str(Soft_I2C_Typedef *iic,const char *str);

// //连接wifi  例 AT+CWJAP="sxm","1234567890"
// //<name>       wifi名称
// //<password>   wifi密码
// void mqtt_modle_connect_ap(Soft_I2C_Typedef *iic,const char *name,const char *password);


// //配置 MQTT 属性  例 AT+MQTTUSERCFG=0,1,"NULL","admin","l12345678",0,0,""
// //<client_id>：MQTT 客户端 ID，最大长度：256 字节。
// //<username>：用户名，用于登陆 MQTT broker，最大长度：64 字节。
// //<password>：密码，用于登陆 MQTT broker，最大长度：64 字节。
// void mqtt_modle_usercfg(Soft_I2C_Typedef *iic,uint32_t client_id,const char *name,const char *password);



// //发送服务器的IP地址,连接 MQTT Broker   例 AT+MQTTCONN=0,"192.168.1.105",1883,0
// //<host>：MQTT broker 域名，最大长度：128 字节。
// //<port>：MQTT broker 端口，最大端口：65535。
// void mqtt_modle_conn(Soft_I2C_Typedef *iic,const char *host,uint32_t port);

// //发布 MQTT 消息  最大256个字节  //AT+MQTTPUB=0,"topicName","hello zmrobo",1,0
// //<topic>：MQTT topic，最大长度：128 字节。
// //<data>：MQTT 字符串消息。
// //<qos>：发布消息的 QoS，参数可选 0、1、或 2，默认值：0。
// void mqtt_modle_pub(Soft_I2C_Typedef *iic,const char *topic,uint32_t data,uint8_t qos);

// //发布 MQTT 消息  最大256个字节  //AT+MQTTPUB=0,"topicName","hello zmrobo",1,0
// //<topic>：MQTT topic，最大长度：128 字节。
// //<data>：MQTT 字符串消息。
// //<qos>：发布消息的 QoS，参数可选 0、1、或 2，默认值：0。
// void mqtt_modle_pub_str(Soft_I2C_Typedef *iic,const char *topic,const char *data,uint8_t qos);

// //订阅 MQTT 消息  可大于256个字节  //AT+MQTTSUB=0,"topicName",1
// //<topic>：MQTT topic，最大长度：128 字节。
// //<qos>：订阅消息的 QoS，参数可选 0、1、或 2，默认值：0。
// void mqtt_modle_sub(Soft_I2C_Typedef *iic,const char *topic,uint8_t qos);

// //读取30byte数据，判断是否和输入的一致，一致则返回1，否则返回0
// uint8_t mqtt_modle_read_compare(Soft_I2C_Typedef *iic,const char *topic,const char *str2);

// //读取AT指令命令状态 OK-1,ERROR-0
// //给IOT模块发送AT指令时，模块内部状态位自动清零
// uint8_t mqtt_modle_read_cmd_state(Soft_I2C_Typedef *iic);

// //读取WIFI连接状态，
// //读取IOT模块wif连接状态, 如果IOT模块连接的wifi与将要配置的wifi名称一样，返回OK-1；wifi已连接，但不是目标wifi名称，返回2；否则返回 ERROR-0
// uint8_t mqtt_modle_read_wifi_state(Soft_I2C_Typedef *iic,const char *name);

// //设置IOT模块LED颜色  1:蓝灯常亮  2：红色常亮  3：红色慢闪  4：红色快闪 
// void mqtt_modle_led_state(Soft_I2C_Typedef *iic,uint8_t CMD);

// uint8_t mqtt_modle_read_connect_state(Soft_I2C_Typedef *iic);

// uint8_t *mqtt_modle_read_data(Soft_I2C_Typedef *iic,const char *topic);

const uint8_t AT[]			      ="AT\r\n";			    //测试
const uint8_t RST[]			      ="AT+RST\r\n";			//复位
const uint8_t STA[]		          ="AT+CWMODE=1\r\n";		//进入STA模式
const uint8_t CONNECT[]		      ="AT+CWJAP=";			    //连接ap //AT+CWJAP="sxm","1234567890"
const uint8_t MQTTUSERCFG[]	      ="AT+MQTTUSERCFG=0,1,";   //配置MQTT属性 //AT+MQTTUSERCFG=0,1,"NULL","admin","l12345678",0,0,""
const uint8_t MQTTUSERCFGEND[]	  =",0,0,\"\"";             //配置MQTT属性 //AT+MQTTUSERCFG=0,1,"NULL","admin","l12345678",0,0,""
const uint8_t MQTTCONN[]	      ="AT+MQTTCONN=0,";		//连接服务器  //AT+MQTTCONN=0,"192.168.1.105",1883,0
const uint8_t MQTTCONNSTATE[]	  ="AT+MQTTCONN?\r\n";      //查询 设备是否已连接的 MQTT broker
const uint8_t MQTTSUB[]		      ="AT+MQTTSUB=0,";			//订阅主题消息  //AT+MQTTSUB=0,"topicName",1
const uint8_t MQTTPUB[]		      ="AT+MQTTPUB=0,";		    //发布主题消息 //AT+MQTTPUB=0,"topicName","hello zmrobo",1,0
const uint8_t MQTTPUBRAW[]	      ="AT+MQTTPUBRAW=0,";	    //发布长主题消息 //AT+MQTTPUBRAW=0,"topicName",512,1,0


const uint8_t QUOTES[]		  ="\"";		            //引号
const uint8_t COMMA[]		  =",";		                //逗号
const uint8_t ATEND[] 		  ="\r\n";				    //结束符


uint8_t str_len = 64;
uint8_t recv_str[64] = {0};
uint8_t buf_len = 0;
uint8_t IOTConfigFlag = 0;
const char * WiFiName = NULL;
uint8_t connect_flag = 0;
uint8_t connect_time = 0;




/* 将无符号十进制数拆分并转换为字符形式，返回字符串长度 */
char uBinaryToAscii(unsigned int value, char *str)
{
    char i;
    char num_str[10] = { 0 };
    unsigned int quotient;
    unsigned char len;

    len = 0;

    quotient = value / 10;
    while (quotient != 0)
    {
        num_str[len] = value % 10 + '0';
        len++;
        value = quotient;
        quotient = value / 10;
    }

    if (value != 0)
    {
        num_str[len] = value + '0';
        len++;
    }

    for (i = 0; i < len; i++)
    {
        *str = num_str[len-i-1];
        str++;
    }

    return len;
}

//发字符串
void mqtt_modle_send_str(Soft_I2C_Typedef *iic,const char *str)
{
	uint8_t check_sum=0;
	uint16_t i;
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);
	Soft_I2C_Write(iic,0xEA);//写数据命令
	Soft_I2C_Write(iic,strlen(str)+1);//发送数据长度: 字符+校验码
    for(i=0;i<strlen(str);i++)
	{
		Soft_I2C_Write(iic,str[i]);
		check_sum += str[i];
	}
	Soft_I2C_Write(iic,check_sum);
	Soft_I2C_Stop(iic);
}


//读取AT指令命令状态, OK-1,ERROR-0
//给IOT模块发送AT指令，OK状态清零
uint8_t mqtt_modle_read_cmd_state(Soft_I2C_Typedef *iic)
{
	uint8_t i,s=0,sum;
	uint8_t data[5];
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);//add
	Soft_I2C_Write(iic,0xFA);//读数据命令
	Soft_I2C_Write(iic,0x02);//读AT命令状态
	Soft_I2C_Stop(iic);
	Delay1ms(5);
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8B);//add+1
	for(i=0;i<3;i++)//只接1byte有效数据
	{
		data[i]= Soft_I2C_Read(iic,0);
	
	}
	sum= Soft_I2C_Read(iic,1);
	Soft_I2C_Stop(iic);
	s= (uint8_t)(data[1]+data[2]);
	// data[0]  包头  0x86
	// data[1]  包头  0xab
	// data[2]  data
	// data[3]  sum
	// LCD_DisplayNum(5, 100,data[2], 0xffff, 0x000,0x8088); 
	if(sum == s && sum!=0)return data[2];
	// LCD_DisplayNum(5, 180,sum, 0xffff, 0x000,0x8088); 
	// LCD_DisplayNum(5, 200,s, 0xffff, 0x000,0x8088); 

	return 0;
}


//读取IOT模块wif连接状态, 如果IOT模块连接的wifi与将要配置的wifi名称一样，返回OK-1；wifi已连接，但不是目标wifi名称，返回2；否则返回 ERROR-0
uint8_t mqtt_modle_read_wifi_state(Soft_I2C_Typedef *iic,const char *name)
{
	uint8_t i,s=0,sum,checksum = 0;
	uint8_t data[5];
	const char BTcmdbuf[strlen(name)];
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	strcat((char*)BTcmdbuf,(char*)name);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
    Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);
	Soft_I2C_Write(iic,0xDB);//写数据命令
	Soft_I2C_Write(iic,strlen(BTcmdbuf)+1);//发送数据长度
	for(i=0;i<strlen(BTcmdbuf);i++)
	{
		Soft_I2C_Write(iic,BTcmdbuf[i]);
		checksum += BTcmdbuf[i];
	}
	Soft_I2C_Write(iic,checksum);
	Soft_I2C_Stop(iic);

	Delay1ms(100);//等待IOT模块接收数据

	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);//add
	Soft_I2C_Write(iic,0xFA);//读数据命令
	Soft_I2C_Write(iic,0x03);//读WIFI状态
	Soft_I2C_Stop(iic);
	Delay1ms(5);
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8B);//add+1
	for(i=0;i<3;i++)//只接1byte有效数据
	{
		data[i]= Soft_I2C_Read(iic,0);
	
	}
	sum= Soft_I2C_Read(iic,1);
	Soft_I2C_Stop(iic);
	s= (uint8_t)(data[1]+data[2]);
	// data[0]  包头  0x86
	// data[1]  包头  0xab
	// data[2]  data
	// data[3]  sum
	//LCD_DisplayNum(5, 220,data[2], 0xffff, 0x000,0x8088); 
	if(sum == s && sum!=0)return data[2];
	// LCD_DisplayNum(5, 180,sum, 0xffff, 0x000,0x8088); 
	// LCD_DisplayNum(5, 200,s, 0xffff, 0x000,0x8088); 
	// LCD_DisplayNum(5, 220,data[2], 0xffff, 0x000,0x8088); 
	return 0;
}

//使用AT+MQTTCONN?指令来判断IOT的连接状态，返回IOT连接状态，0：未初始化，1：已设置用户配置，2：已设置服务器；3：断开连接；4：建立连接；5：已连接，但没有订阅主题，6：已连接，已经订阅主题
uint8_t mqtt_modle_read_connect_state(Soft_I2C_Typedef *iic)
{
	uint8_t i,s=0,sum;
	uint8_t data[5];
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);//add
	Soft_I2C_Write(iic,0xFA);//读数据命令
	Soft_I2C_Write(iic,0x04);//读AT命令状态
	Soft_I2C_Stop(iic);
	Delay1ms(5);
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8B);//add+1
	for(i=0;i<3;i++)//只接1byte有效数据
	{
		data[i]= Soft_I2C_Read(iic,0);
	
	}
	sum= Soft_I2C_Read(iic,1);
	Soft_I2C_Stop(iic);
	s= (uint8_t)(data[1]+data[2]);
	// data[0]  包头  0x86
	// data[1]  包头  0xab
	// data[2]  data
	// data[3]  sum
	//LCD_DisplayNum(5, 220,data[2], 0xffff, 0x000,0x8088); 
	if(sum == s && sum!=0)return data[2];
	// LCD_DisplayNum(5, 180,sum, 0xffff, 0x000,0x8088); 
	// LCD_DisplayNum(5, 200,s, 0xffff, 0x000,0x8088); 

	return 0;
}
/*
函数说明：
参数：
	SCL:IIC的IIC引脚
	SDA:IIC的SDA引脚
	topic:主题名称
	str2:比较的字符串
返回值：
	1：比较成功
	0：比较失败
*/
uint8_t mqtt_modle_read_compare(Soft_I2C_Typedef *iic,const char *topic,const char *str2)
{
	size_t len1,len2;
	uint8_t checksum = 0;
//	char  string[30];
	uint8_t head[4] = {0};
	uint8_t i,s=0,sum,check=0;
	len1=strlen(topic);
	len2=strlen(str2);
	//LCD_DisplayNum(5, 200,len1, 0xffff, 0x000,0x8088); 
	//LCD_DisplayNum(5, 220,len2, 0xffff, 0x000,0x8088); 
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);
	Soft_I2C_Write(iic,0xDA);//写数据命令
	Soft_I2C_Write(iic,len1+1);//发送数据长度
	//数据清0
	memset(recv_str,0,str_len);

	for(i=0;i<len1;i++)
	{
		Soft_I2C_Write(iic,topic[i]);
		checksum += topic[i];
	}
	Soft_I2C_Write(iic,checksum);
	Soft_I2C_Stop(iic);
	Delay1ms(5);																										
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);//add
	Soft_I2C_Write(iic,0xFA);//读数据命令
	Soft_I2C_Write(iic,0x01);//读AT数据
	Soft_I2C_Stop(iic);
	Delay1ms(5);
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8B);//add+1

	//mp_hal_delay_ms(100);
	/*获取头四个自己,第四个字节为数据长度*/
	for ( i = 0; i < 4; i++)
	{
		head[i] = Soft_I2C_Read(iic,0);
		s= (uint8_t)(head[i]+s);
	}
	buf_len = head[3];
	//LCD_DisplayNum(5, 200,buf_len, 0xffff, 0x000,0x8088); 
	for(i=0;i<buf_len;i++)//只接30byte有效数据
	{
		recv_str[i]= Soft_I2C_Read(iic,0);
		s= (uint8_t)(recv_str[i]+s);
		
	}
	//LCD_DisplayString(5, 180,(char *)(recv_str), 0xffff, 0x0000,0); 
	//LCD_DisplayString(5, 200,(char *)str2, 0xffff, 0x0000,0); 
	sum= Soft_I2C_Read(iic,1);
	Soft_I2C_Stop(iic);

	if(s == sum) 
	{
		for(i=0;i<=len2;i++)//只接30byte有效数据
		{
			
			if(str2[i]==recv_str[i] )
			{ 
				check=i;
			}
			else break;		
		}	
	}

	#if 0
	LCD_DisplayNum(5, 60,s, 0xffff, 0x000,0x8088); 
	LCD_DisplayNum(5, 80,sum, 0xffff, 0x000,0x8088); 
	LCD_DisplayNum(5, 100,len2, 0xffff, 0x000,0x8088); 
	LCD_DisplayNum(5, 120,check, 0xffff, 0x000,0x8088); 
	#endif
	//mp_hal_delay_ms(100);
	if(check ==len2) return 1;
	return 0;

}

/*
函数说明获取数据
*/

uint8_t mqtt_modle_read_data(Soft_I2C_Typedef *iic,const char *topic,char *iot_str)
{
	size_t len1;
	uint8_t checksum = 0;
//	char  string[30];
	uint8_t head[4] = {0};
	uint8_t i,s=0,sum=0;
	
	len1=strlen(topic);
	//LCD_DisplayNum(5, 200,len1, 0xffff, 0x000,0x8088); 
	//LCD_DisplayNum(5, 220,len2, 0xffff, 0x000,0x8088); 
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);
	Soft_I2C_Write(iic,0xDA);//写数据命令
	Soft_I2C_Write(iic,len1+1);//发送数据长度
	//memset(recv_str,0,str_len);		//清除数据
	for(i=0;i<len1;i++)
	{
		Soft_I2C_Write(iic,topic[i]);
		checksum += topic[i];
	}
	Soft_I2C_Write(iic,checksum);
	Soft_I2C_Stop(iic);
	Delay1ms(5);																										
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);//add
	Soft_I2C_Write(iic,0xFA);//读数据命令
	Soft_I2C_Write(iic,0x01);//读AT数据
	Soft_I2C_Stop(iic);
	Delay1ms(5);
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8B);//add+1
	//mp_hal_delay_ms(100);
	/*获取头四个自己,第四个字节为数据长度*/
	for ( i = 0; i < 4; i++)
	{
		head[i] = Soft_I2C_Read(iic,0);
		s= (uint8_t)(head[i]+s);
	}
	buf_len = head[3];
	//LCD_DisplayNum(5, 100,buf_len, 0xF800, 0x000,0x8088); 
	for(i=0;i<buf_len;i++)//只接30byte有效数据
	{
		iot_str[i]= Soft_I2C_Read(iic,0);
		s= (uint8_t)(iot_str[i]+s);
		
	}
	if(buf_len == 0)
		iot_str[0] = '0';
	sum= Soft_I2C_Read(iic,1);
	Soft_I2C_Stop(iic);
	if(sum == s)
	{
		//LCD_DisplayString(5, 100,(char *)(iot_str), 0xffff, 0x0000,0); 

	}
	//return (recv_str);
	return buf_len;

}



//连接wifi  例 AT+CWJAP="sxm","1234567890"
//<name>       wifi名称
//<password>   wifi密码
void mqtt_modle_connect_ap(Soft_I2C_Typedef *iic,const char *name,const char *password)
{
	//uint8_t checksum = 0;
	//uint16_t i;
	const char BTcmdbuf[strlen(name)+strlen(password)+20];
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	strcat((char*)BTcmdbuf,(char*)CONNECT);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)name);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)password);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
	mqtt_modle_send_str(iic,BTcmdbuf);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)
	// {
	// 	Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// 	checksum += BTcmdbuf[i];
	// }
	// Soft_I2C_Write(SCL,SDA,checksum);
	// Soft_I2C_Stop(SCL,SDA);

}



//配置 MQTT 属性  例 AT+MQTTUSERCFG=0,1,"NULL","admin","l12345678",0,0,""
//<client_id>：MQTT 客户端 ID，最大长度：256 字节。
//<username>：用户名，用于登陆 MQTT broker，最大长度：64 字节。
//<password>：密码，用于登陆 MQTT broker，最大长度：64 字节。
void mqtt_modle_usercfg(Soft_I2C_Typedef *iic,uint32_t client_id,const char *name,const char *password)
{
	//uint16_t i;
	//uint8_t checksum = 0;
	const char BTcmdbuf[strlen(name)+strlen(password)+70];
	char client_str[20] = { '\0' };
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	memset((void*)client_str,0, strlen(client_str));
    uBinaryToAscii(client_id,client_str);
	strcat((char*)BTcmdbuf,(char*)MQTTUSERCFG);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)client_str);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)name);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)password);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)MQTTUSERCFGEND);
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
	mqtt_modle_send_str(iic,BTcmdbuf);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)
	// {
	// 	Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// 	checksum += BTcmdbuf[i];
	// }
	// Soft_I2C_Write(SCL,SDA,checksum);
	// Soft_I2C_Stop(SCL,SDA);

}




//发送服务器的IP地址,连接 MQTT Broker   例 AT+MQTTCONN=0,"192.168.1.105",1883,0
//<host>：MQTT broker 域名，最大长度：128 字节。
//<port>：MQTT broker 端口，最大端口：65535。
void mqtt_modle_conn(Soft_I2C_Typedef *iic,const char *host,uint32_t port)
{
	//uint16_t i;
	//uint8_t checksum = 0;
	const char BTcmdbuf[strlen(host)+30];
	char port_str[10] = { '\0' };
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	memset((void*)port_str,0, strlen(port_str));
	//itoa(port,(char*)port_str,10);
    uBinaryToAscii(port,port_str);
	strcat((char*)BTcmdbuf,(char*)MQTTCONN);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)host);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)port_str);
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// Soft_I2C_Stop(SCL,SDA);
	mqtt_modle_send_str(iic,BTcmdbuf);

}
/*
//查询 ESP32 设备是否已连接的 MQTT broker
uint8_t mqtt_modle_conn_state(void)
{
	uint8_t state = 0;
	HAL_UART_Transmit(&uart2_handler,MQTTCONNSTATE,strlen((char*)MQTTCONNSTATE),500);
	return state;
}
*/

//发布 MQTT 消息  最大256个字节  //AT+MQTTPUB=0,"topicName","hello zmrobo",1,0
//<topic>：MQTT topic，最大长度：128 字节。
//<data>：MQTT 字符串消息。
//<qos>：发布消息的 QoS，参数可选 0、1、或 2，默认值：0。
void mqtt_modle_pub(Soft_I2C_Typedef *iic,const char *topic,uint32_t data,uint8_t qos)
{
	//uint16_t i;
	const char  BTcmdbuf[strlen(topic)+40];
	char qos_str[3] = { '\0' };
	char data_str[10] = { '\0' };
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	memset((void*)qos_str,0, strlen(qos_str));
	memset((void*)data_str,0, strlen(data_str));
	//itoa(qos,qos_str,10);
    uBinaryToAscii(data,data_str);
	uBinaryToAscii(qos,qos_str);
	strcat((char*)BTcmdbuf,(char*)MQTTPUB);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)topic);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	if(data == 0) strcat((char*)BTcmdbuf,"0");
	else strcat((char*)BTcmdbuf,(char*)data_str);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// Soft_I2C_Stop(SCL,SDA);
	mqtt_modle_send_str(iic,BTcmdbuf);

}

//发布 MQTT 消息  最大256个字节  //AT+MQTTPUB=0,"topicName","hello zmrobo",1,0
//<topic>：MQTT topic，最大长度：128 字节。
//<data>：MQTT 字符串消息。
//<qos>：发布消息的 QoS，参数可选 0、1、或 2，默认值：0。
void mqtt_modle_pub_str(Soft_I2C_Typedef *iic,const char *topic,const char *data,uint8_t qos)
{
	//uint16_t i;
	const char  BTcmdbuf[strlen(topic)+strlen(data)+30];
	char qos_str[3] = { '\0' };
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	memset((void*)qos_str,0, strlen(qos_str));
	//itoa(qos,qos_str,10);
    uBinaryToAscii(qos,qos_str);
	strcat((char*)BTcmdbuf,(char*)MQTTPUB);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)topic);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)data);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// Soft_I2C_Stop(SCL,SDA);
	mqtt_modle_send_str(iic,BTcmdbuf);

}

//订阅 MQTT 消息  可大于256个字节  //AT+MQTTSUB=0,"topicName",1
//<topic>：MQTT topic，最大长度：128 字节。
//<qos>：订阅消息的 QoS，参数可选 0、1、或 2，默认值：0。
void mqtt_modle_sub(Soft_I2C_Typedef *iic,const char *topic,uint8_t qos)
{
	//uint16_t i;
	const char  BTcmdbuf[strlen(topic)+30];
	char qos_str[3] = { '\0' };
	memset((void*)BTcmdbuf,0, strlen(BTcmdbuf));
	memset((void*)qos_str,0, strlen(qos_str));
	//itoa(qos,qos_str,10);
    uBinaryToAscii(qos,qos_str);
	strcat((char*)BTcmdbuf,(char*)MQTTSUB);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)topic);
	strcat((char*)BTcmdbuf,(char*)QUOTES);//引号
	strcat((char*)BTcmdbuf,(char*)COMMA);//逗号
	strcat((char*)BTcmdbuf,"0");
	strcat((char*)BTcmdbuf,(char*)ATEND);
	//HAL_UART_Transmit(&uart2_handler,BTcmdbuf,strlen(BTcmdbuf),500);
    // Soft_I2C_Start(SCL,SDA);
	// Soft_I2C_Write(SCL,SDA,0x8A);
	// Soft_I2C_Write(SCL,SDA,0xEA);//写数据命令
	// Soft_I2C_Write(SCL,SDA,strlen(BTcmdbuf));//发送数据长度
	// for(i=0;i<strlen(BTcmdbuf);i++)Soft_I2C_Write(SCL,SDA,BTcmdbuf[i]);
	// Soft_I2C_Stop(SCL,SDA);
	mqtt_modle_send_str(iic,BTcmdbuf);

}

/*
// void mqtt_modle_rev_data(const char *topic,char *data)
void mqtt_modle_rev_data(void)
{
	uint8_t data;
	while(1)
	{
		data = ReadCOMData();
		if(data == "\"") LCD_String(0,100,"mqtt rev ok",0xFFFF,0x0,0);
		Delay1ms(10);  
	}

}
*/

//设置IOT模块LED颜色  1:蓝灯常亮  2：红色常亮  3：红色慢闪  4：红色快闪 
void mqtt_modle_led_state(Soft_I2C_Typedef *iic,uint8_t CMD)
{
	Soft_I2C_Start(iic);
	Soft_I2C_Write(iic,0x8A);
	Soft_I2C_Write(iic,0xDC);//写LED命令
	Soft_I2C_Write(iic,CMD);
	Soft_I2C_Stop(iic);
}






#endif // JMDMQTT_H

