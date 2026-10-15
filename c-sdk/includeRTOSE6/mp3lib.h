/*****************************************************************************
MP3:上电初始化时间<=500ms,实测约300ms
播放曲目响应速度约50ms
芯片内部对串口的处理是 10MS 处理一次，所以连续的指令发送时，必须要间隔 20MS 的延时。
否则前面的指令将会被覆盖而得不到执行
******************************************************************************/
#ifndef _MP3LIB_H_
#define _MP3LIB_H_

#define EEP_MP3_SOUND 188
#define _MP3_PWR_ON_TIME_	500	//ms

typedef enum
{
	USB_DISK_ON=0,
	USB_MP3_OFF=0,
	USB_MP3_ON=1,
	
	MP3_SW_OFF=0,
	MP3_SW_ON=1,
	
	MP3_STOP=0,//停止
	MP3_PLAY=1,//播放
	MP3_SUSPEND=2,//暂停
	MP3_NXT=3,//下一首
	MP3_FWD=4,//上一首
	MP3_PLAYSONG=5//播放指定音频
}USB_SW_STATE;
#define USB_SW_GPIO  	//GPIOE
#define USB_SW_PIN   	//GPIO_Pin_15
#define MP3_PWR_GPIO 	//GPIOA
#define MP3_PWR_PIN  	//GPIO_Pin_13
#define MP3_STATE_GPIO 	//GPIOE
#define MP3_STATE_PIN  	//GPIO_Pin_14
#define GET_MP3_STATE() //GPIO_ReadInputDataBit(MP3_STATE_GPIO,MP3_STATE_PIN)
typedef enum
{//MP3数据包格式:0X7E+0XFF(保留字节)+0x06(长度)+CMD+FB+D0+D1+2Byte校验和+0XEF
 //长度:不包含字头字尾和校验和
 //检验和=0-(0XFF(保留字节)+0x06(长度)+CMD+FB+D0+D1)
 //CMD:操作指令
 //FB:反馈信息,1反馈,0不反馈
	MP3_FIRST_BYTE=0X7E,//数据包头
	MP3_END_BYTE=0XEF,//数据包未
	//控制指令
	MP3_PNXT_SCMD=0X01,//下一曲
	MP3_PFWD_SCMD=0X02,//上一曲
	MP3_PSONG_SCMD=0X03,//指定曲目(NUM)
	MP3_SOUNDP_SCMD=0X04,//音量+
	MP3_SOUNDN_SCMD=0X05,//音量-
	MP3_SOUND_SCMD=0X06,//指定音量0-30
	MP3_SCSTP_SCMD=0X08,//单曲循环指定曲目播放
	MP3_SPD_SCMD=0X09,//指定播放设备
	MP3_SLEEP_SCMD=0X0A,//进入睡眠 -- 低功耗
	MP3_WAKE_SCMD=0X0B,//唤醒睡眠
	MP3_RST_SCMD=0X0C,//芯片复位
	MP3_PLAY_SCMD=0X0D,//播放
	MP3_SUSPEND_SCMD=0X0E,//暂停
	MP3_PFNSF_SCMD=0X0F,//指定文件夹文件名播放
	MP3_PADVERT_SCMD=0X13,//插播广告
	MP3_SADVERT_SCMD=0X15,//停止插播播放背景音乐
	MP3_STOP_SCMD=0X16,//停止插播播放背景音乐
	MP3_PFLOOP_SCMD=0X17,//指定文件夹循环播放
	MP3_PRRAND_SCMD=0X18,//指定根目录随机播放
	MP3_PSSLOOP_SCMD=0X19,//对当前播放的曲目设置为循环播放
	MP3_DACOUT_SCMD=0X1A,//开启和关闭芯片的 DAC 输出
	MP3_COMBP_SCMD=0X21,//组合播放
	MP3_SSSF_SCMD=0X22,//指定音量同时指定文件播放
	MP3_PMF_SCMD=0X25,//多文件夹插播
	//查询指令
	MP3_ONLINE_CCMD=0X3F,//查询在线设备
	MP3_CURSTATE_CCMD=0X42,//查询当前状态
	MP3_CURSOUND_CCMD=0X43,//查询当前音量
	MP3_CTFILENUM_CCMD=0X49,//查询 FLASH 的总文件数,5个文件夹的总文件数
	MP3_CFSPOINT_CCMD=0X4D,//FLASH当前文件夹曲目指针
	MP3_FTNUM_CCMD=0X4E,//查询指定文件夹的曲目总数
	MP3_FOLDERNUM_CCMD=0X4F,//查询当前设备的总文件夹数
	MP3_CFILEPOINT_CCMD=0X61,//查询当前文件夹指针
}MP3_ENUM_DEFINED;

#define MP3RX_MAX		    64
#define MP3SOUND_MAX	  28//30最大音量

void SetUsbSwitch(uint8_t state);
uint8_t CheckMP3OnlineState(void);
uint8_t MP3_BspInit(void);
uint8_t MP3_GetSound(void);
void MP3_SetSound(uint8_t sound);
uint16_t ReadMP3SongNum(uint16_t *SongSize);
void SetMP3PwrState(uint8_t state);//MP3电源
void ClearMP3Buffer(void);
void MP3_Cmd(uint8_t cmd,//控制指令
               uint8_t feedback,//1有反馈,0无反馈
			   uint16_t Data);//控制指令包含的参数
void MP3_Send(uint8_t cmd,//控制指令
                 uint8_t feedback,//1有反馈,0无反馈
				 uint8_t *Data,//控制指令包含的参数
				 uint16_t len);//参数*Data长度


#endif//_MP3LIB_EXT_H_
