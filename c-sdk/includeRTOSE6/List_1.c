#include "list.h"






/*
函数功能：创建List和按顺序增加数据
参数：
	p：二级指针
	data：创建/增加的数据
返回值：0成功，非0失败
*/
int List_Append(char **p,char *data)
{
	for(int j=0;j<LIST_SIZE_ROW;++j)
	{
		if(*(p[j]) == NULL)		//判断数据为初始值
		{
			p[j] = data;
			//SetDisplayString(1,p[j],YELLOW,BLACK);
			return 0;
		}
	}
	return 1;
}

void List_Display(char **p)
{
	for(int x=0;x<LIST_SIZE_ROW;++x)	//遍历
	{
		//if(p[x][0] == 0)
		//{
		//	break;
		//}
		SetDisplayString(x+1,p[x],YELLOW,BLACK);
	
	}
}


/*
函数功能：插入数据
参数：
	p：二级指针
	num:插入的编号
	data：插入的数据
返回值：0成功，非0失败
*/
int List_Insert(char **p,int num,char *data)
{
	char *old_data=NULL,*new_data=data;
	if(num >= LIST_SIZE_ROW)
	{
		return 1;
	}
	if(*(p[num]) == NULL)								//插入的地方为空,直接插入
	{
		p[num] = new_data;							//将地址存入
		return 0;
	}
	else	//插入的地方有数据
	{
	
		for(int x=num;x<LIST_SIZE_ROW;++x)
		{
			if(*(p[x+1]) == NULL)						//如果插入的后一位里面没有数据返回
			{
				old_data = p[x];
				p[x] = new_data;
				p[x+1] = old_data;
				old_data = NULL;					//释放指针	
				new_data = NULL;
				return 0;
			}
			old_data = p[x];							//将原来的地址存入old里
			p[x] = new_data;						//将新的地址给new里
			new_data = old_data;						//将原来的地址重新赋给new
			
		}
	}
	return 0;
}



/*
函数功能：替换数据
参数：
	p：二级指针
	num:修改的编号
	data:修改的数据
返回值：0成功，非0失败
*/
int List_Replace(char **p,int num,char *data)
{
	if(num >= LIST_SIZE_ROW)				//大于数组范围
	{
		return 1;
	}
	if(*(p[num]) == NULL)
	{
		p[num] = data;					//指针里面没有数据，直接修改指针
		return 0;
	}
	memset(p[num],0,LIST_SIZE_ROW);				//清除指针里面的数据
	p[num] = NULL;						//指针指向空
	p[num] = data;						//替换数据
	return 0;
}


/*
函数功能：相互交换数据
参数：
	p：二级指针
	desc:被顶替的编号
	src:要顶替的编号
返回值：0成功，非0失败
*/
int List_Change(char **p,int desc,int src)
{
	char *data = NULL;
	if(desc >= LIST_SIZE_ROW || src >= LIST_SIZE_ROW)		//大于数组范围
	{
		return 1;
	}
	if(*(p[desc]) == NULL && *(p[src]) == NULL)					//都是空，直接返回
	{
		return 0;
	}
	data = p[desc];									//存储被顶替的数据
	p[desc] = p[src];									//存入要顶替的数据
	p[src] = data;									//替换数据
	data = NULL;
	return 0;
}





/*
函数功能：删除这一项的数据
参数：
	p：二级指针
	num:删除的编号
返回值：0成功，非0失败
*/
int List_Delete_One(char **p,int num)
{
	char *old_data = NULL;
	if(num >= LIST_SIZE_ROW)						//大于数组范围
	{
		return 1;
	}
	if(*(p[num]) == NULL)							//删除项没有数据,退出
	{
		return 0;
	}
	//删除项是最后一项
	if(*(p[num+1])  == NULL)
	{
		memset(p[num],0,LIST_SIZE_ROW);			//清除指针里面的数据
		p[num] = NULL;							//清除最后一项数据
		return 0;
	}
	//后面一项有数据
	for(int x=num;x<LIST_SIZE_ROW;++x)
	{
		if(p[x+1][0] == 0)						//如果插入的后一位里面没有数据返回
		{
			memset(p[x],0,LIST_SIZE_ROW);			//清除原来的数据	
			p[x] = NULL;
			old_data = NULL;
			return 0;
		}
		old_data = p[x+1];						//将原来的数据的后一位指针数据存储到old
		memset(p[x],0,LIST_SIZE_ROW);				//清除原来的数据
		p[x] = old_data;							//将后一位，放在清除位
			
	}
	return 0;
}




/*
函数功能：删除二维数据所有的数据
参数：
	p：二级指针
*/
void List_Delete_All(char **p)
{
	for(int x=0;x<LIST_SIZE_ROW;++x)
	{
		memset(p[x],0,LIST_SIZE_COLUMN);		//清除数据
		p[x] = NULL;						//指针指向NULL
	}
}



/*
函数功能：查找一项的数据是什么
参数：
	p：二级指针
	num:查找的号码
	find_data:查找的数据
返回值:0成功，非0失败
*/
char * List_Find_Data(char **p,int num)
{
	char *find_data = NULL;
	if(num >= LIST_SIZE_ROW)
	{
		return 1;
	}
	if(*(p[num]) == NULL)		//查找为空
	{
		find_data = "里面没有数据";
		return find_data;
	}
	//里面有数据
	find_data = p[num];
	return find_data;
	
} 


/*
函数功能：查找数据的编号
参数：
	p：二级指针
	data:查找的数据
返回值:查找到的编号，-1为查找失败
*/
int List_Find_Num(char **p,char *data)
{
	for(int x=0;x<LIST_SIZE_ROW;++x)
	{
		if(strcmp(p[x],data) == 0)		//查找到数据了
		{
			return x;
		}
	}
	return -1;
	
} 

/*
函数功能：查找列表有多少项
参数：
	p：二级指针
返回值:查找到的项的数量
*/
int List_Find_Node(char **p)
{
	int num = 0;
	for(int x=0;x<LIST_SIZE_ROW;++x)
	{
		if(*(p[x]) != NULL)		//查找到数据了
		{
			num++;
		}
	}
	return num;
}

/*
函数功能：列表是否包含数据
参数：
	p：二级指针
	data:包含的数据
返回值:true包含，false不包含
*/
bool List_Include_Data(char **p,char *data)
{
	for(int x=0;x<LIST_SIZE_ROW;++x)
	{
		if(strcmp(p[x],data) == 0)		//查找到数据了
		{
			return true;
		}
	}
	return false;
	
} 






