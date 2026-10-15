#ifndef _JMDMATH_H_
#define _JMDMATH_H_

#define __PI  3.1415926535897932384626433832795

//角度＝π/180 弧度
//弧度=角度*(π/180°）
//数学库弧度转角度
#define COS(a) cos(a*__PI/180)
#define SIN(a) sin(a*__PI/180)
#define TAN(a) tan(a*__PI/180)

#define ACOS(a) (acos(a)*180/__PI)
#define ASIN(a) (asin(a)*180/__PI)
#define ATAN(a) (atan(a)*180/__PI)


#endif