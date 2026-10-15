#ifndef _JMDMUSIC_H_
#define _JMDMUSIC_H_


#ifndef _INMUSIC_DATA_
  #define _INMUSIC_DATA_
uint16_t NoteList[3][7]=//
{// 1    2    3    4    5    6    7
	{ 262, 294, 330, 349, 392, 440, 494},//低音
	{ 523, 587, 659, 698, 784, 880, 988},//中音
	{1046,1175,1318,1397,1568,1760,1976}//高音
};
uint16_t NoteHList[3][7]=//#
{// 1#   2#   3    4#   5#   6#   7
	{ 277, 311, 330, 370, 415, 466, 494},//低音
	{ 554, 622, 659, 740, 831, 932, 988},//中音
	{1109,1245,1318,1480,1661,1865,1976}//高音
};
uint16_t TimeList[]={93,280,187,561,374,1122,748,2244,1496,4488,2992};//固定80拍/分钟
typedef struct
{
	uint16_t freq;
	uint16_t time;
}MUSIC_typedef;
void InMusic_DataProcess(MUSIC_typedef* music,uint8_t mdata,uint8_t time)//数据处理
{
	uint8_t i=mdata,j=0;
	uint16_t m_freq;
	if(mdata>7){i=mdata-7;	j=1;}
	else if(mdata>14){i=mdata-14;j=2;}
	//音符处理 
	if(mdata)
	{//0为停止，1-7为低音1-7 ,8-14为中音1-7,15-21为高音1-7
		m_freq=NoteList[j][i-1];
	}
	else{	m_freq=0;}
	music->freq=m_freq;//设置频率
	music->time=TimeList[time];//0:1/8 1:3/8 2:1/4 3:3/4 4:1/2 5:3/2 6:1 7:3 8:2 9:6 10:4
}
void MusicMeter(uint16_t *time,unsigned int meter)
{
//time=60*1000ms/meter (beat为每分钟节拍)
 *time++=meter/8;	//0 1/8
 *time++=meter*3/8;	//1 3/8
 *time++=meter/4;	//2 1/4
 *time++=meter*3/4;	//3 3/4
 *time++=meter*2;	//4 1/2
 *time++=meter;		//5 1
 *time++=meter*3/2;	//6 3/2
 *time++=meter*2;	//7 2
 *time++=meter*3;	//8 3
 *time++=meter*4;	//9 4
 *time=meter*6;		//10 6
}
#endif

#endif