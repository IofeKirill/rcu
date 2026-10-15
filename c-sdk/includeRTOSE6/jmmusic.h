#ifndef _JMMUSIC_H_
#define _JMMUSIC_H_


#ifndef _INMUSIC_DATA_
  #define _INMUSIC_DATA_
u16 NoteList[3][7]=//
{// 1    2    3    4    5    6    7
	{ 262, 294, 330, 349, 392, 440, 494},//低音
	{ 523, 587, 659, 698, 784, 880, 988},//中音
	{1046,1175,1318,1397,1568,1760,1976}//高音
};
u16 NoteHList[3][7]=//#
{// 1#   2#   3    4#   5#   6#   7
	{ 277, 311, 330, 370, 415, 466, 494},//低音
	{ 554, 622, 659, 740, 831, 932, 988},//中音
	{1109,1245,1318,1480,1661,1865,1976}//高音
};
u16 TimeList[]={93,280,187,561,374,1122,748,2244,1496,4488,2992};//固定80拍/分钟
typedef struct
{
	u16 freq;
	u16 time;
}MUSIC_typedef;
void InMusic_DataProcess(MUSIC_typedef* music,u8 mdata,u8 time)//数据处理
{
	u8 i=mdata,j=0;
	u16 m_freq;
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
void MusicMeter(u16 *time,unsigned int meter)
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