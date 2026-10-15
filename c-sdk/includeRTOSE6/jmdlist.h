#ifndef _JMDLIST_H_
#define _JMDLIST_H_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>



#define LIST_SIZE_ROW  128		//数据行的长度
#define LIST_SIZE_COLUMN  64		//数据列的长度

typedef struct List_Test
{
	char *data[LIST_SIZE_ROW];
	int (*Append)(char **p,double *data);       				//创建，增加数据
	int (*Display)(char **p);       						//显示数据
	int (*Insert)(char **p,double num,double *data);			//插入数据
	int (*Replace)(char **p,double num,double *data);			//替换数据
	int (*Change)(char **p,int desc,int src);				//交换两项数据
	int (*Delete_One)(char **p,double num);				//删除莫一项数据
	void (*Delete_All)(char **p);						//删除所有数据
	int (*Find_Num)(char **p,double *data);				//查找数据的编号
	double *(*Find_Data)(char **p,double num);		//查找莫一项的数据
	int (*Find_Node)(char **p);						//查找列表的项
	int (*Include_Data)(char **p,double *data);			//是否包含数据
}List;

int List_Append(char **p,double *data);					//创建，增加数据
void List_Display(char **p);							//显示数据
int List_Insert(char **p,double num,double *data);				//插入数据
int List_Replace(char **p,double num,double *data);				//替换数据
int List_Change(char **p,int desc,int src);				//交换两项数据
int List_Delete_One(char **p,double num);					//删除莫一项数据
void List_Delete_All(char **p);							//删除所有数据
double *List_Find_Data(char **p,double num);		//查找莫一项的数据
int List_Find_Num(char **p,double *data);					//查找数据的编号
int List_Find_Node(char **p);							//查找列表的项
int List_Include_Data(char **p,double *data);				//是否包含数据
#endif