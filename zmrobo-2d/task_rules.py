"""Declarative task rules. No eval/exec; XML and visual rules use the same AST."""
import copy
import math

TAGS=set('init timelimit constraint event condition conditions not inside count equals notEqual greater less settedUp dropped timer int double bool string variableValue objectState typeOf sum difference min max abs minus triggers trigger setter message replace setUp drop success fail'.split())

def xml_node(element):
    return dict(tag=element.tag,attrs=dict(element.attrib),children=[xml_node(c) for c in element if isinstance(c.tag,str)])

def validate(regions,task):
    seen=set()
    for r in regions:
        key=r.get('id')
        if not isinstance(key,str) or not 1<=len(key)<=100 or key in seen: raise ValueError('У регионов должны быть уникальные ID.')
        seen.add(key)
        if r.get('kind') not in ('rectangle','ellipse'): raise ValueError('Неизвестная форма региона.')
        rect=r.get('rect',[])
        if len(rect)!=4 or any(type(v) not in (int,float) or not math.isfinite(v) for v in rect) or max(abs(rect[0]),abs(rect[1]))>5000 or not all(.1<=v<=4000 for v in rect[2:]): raise ValueError('Некорректные размеры региона '+key)
    if len(regions)>100: raise ValueError('Допускается до 100 регионов.')
    if task is None: return
    if not isinstance(task,dict) or not isinstance(task.get('nodes'),list): raise ValueError('У задания должен быть список nodes.')
    if not isinstance(task.get('aliases',{}),dict) or any(not isinstance(k,str) or not isinstance(v,str) for k,v in task.get('aliases',{}).items()):raise ValueError('Некорректные псевдонимы роботов.')
    count=[0];events=set();refs=[]
    def visit(n,depth=0):
        count[0]+=1
        if count[0]>6000 or depth>30: raise ValueError('Правила задания слишком сложные.')
        if not isinstance(n,dict) or n.get('tag') not in TAGS: raise ValueError('Не поддерживается правило: '+str(n.get('tag') if isinstance(n,dict) else n))
        a=n.get('attrs',{});children=n.get('children',[])
        if not isinstance(a,dict) or not isinstance(children,list) or any(not isinstance(v,(str,int,float,bool)) for v in a.values()):raise ValueError('Некорректные параметры правила.')
        arity={'not':1,'condition':1,'setter':1,'replace':1,'abs':1,'minus':1,'equals':2,'notEqual':2,'greater':2,'less':2}
        if n['tag'] in arity and len(children)!=arity[n['tag']]:raise ValueError('Некорректное число аргументов: '+n['tag'])
        if n['tag']=='conditions' and a.get('glue','and') not in ('and','or'):raise ValueError('Условия соединяются через and или or.')
        if n['tag'] in ('int','double','timelimit'):
            try:value=float(a.get('value',0))
            except (ValueError,TypeError):raise ValueError('Некорректное число в '+n['tag'])
            if not math.isfinite(value) or (n['tag']=='timelimit' and value<0):raise ValueError('Некорректное число в '+n['tag'])
        if n['tag']=='event':
            key=a.get('id')
            if not isinstance(key,str) or not key or key in events:raise ValueError('У событий должны быть уникальные ID.')
            events.add(key)
        if n['tag'] in ('inside','count') and a.get('regionId') and a['regionId'] not in seen:raise ValueError('Не найден регион: '+a['regionId'])
        if n['tag'] in ('setUp','drop','settedUp','dropped'):refs.append(str(a.get('id','')))
        for c in children:visit(c,depth+1)
    for n in task['nodes']:
        if n.get('tag') not in ('init','event','constraint','timelimit'):raise ValueError('Недопустимое правило верхнего уровня.')
        visit(n)
    for key in refs:
        if key not in events:raise ValueError('Не найдено событие: '+key)

def polygon_area(poly):
    return abs(sum(x*b-a*y for (x,y),(a,b) in zip(poly,poly[1:]+poly[:1])))/2 if len(poly)>2 else 0

def clipped(poly,clip):
    for a,b in zip(clip,clip[1:]+clip[:1]):
        if not poly:break
        out=[]
        def side(p):return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
        previous=poly[-1];sp=side(previous)
        for current in poly:
            sc=side(current)
            if (sc>=0)!=(sp>=0):
                f=sp/(sp-sc)
                out.append((previous[0]+f*(current[0]-previous[0]),previous[1]+f*(current[1]-previous[1])))
            if sc>=0:out.append(current)
            previous,sp=current,sc
        poly=out
    return poly

def union_area(polys):
    polys=[p for p in polys if polygon_area(p)>1e-10]
    if not polys:return 0.
    if len(polys)==1:return polygon_area(polys[0])
    xs={x for p in polys for x,y in p};edges=[(a,b) for p in polys for a,b in zip(p,p[1:]+p[:1])]
    for i,(a,b) in enumerate(edges):
        dx,dy=b[0]-a[0],b[1]-a[1]
        for c,d in edges[i+1:]:
            ex,ey=d[0]-c[0],d[1]-c[1];den=dx*ey-dy*ex
            if abs(den)<1e-12:continue
            t=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den
            u=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/den
            if 0<t<1 and 0<u<1:xs.add(a[0]+t*dx)
    area=0.;xs=sorted(xs)
    for left,right in zip(xs,xs[1:]):
        if right-left<1e-10:continue
        x=(left+right)/2;intervals=[]
        for p in polys:
            ys=[a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]) for a,b in zip(p,p[1:]+p[:1]) if min(a[0],b[0])<x<max(a[0],b[0])]
            if ys:intervals.append((min(ys),max(ys)))
        end=-math.inf;length=0
        for lo,hi in sorted(intervals):
            length+=max(0,hi-max(lo,end));end=max(end,hi)
        area+=(right-left)*length
    return area

def region_polygon(r):
    x,y,w,h=r['rect']
    if r['kind']=='rectangle':return [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]
    return [(x+w/2+w/2*math.cos(i*math.tau/96),y+h/2+h/2*math.sin(i*math.tau/96)) for i in range(96)]

def projection(w):
    polys=[list(p) for p in w.corners]
    sizes={'light':(-2,-1,3,2,0),'laser':(-1,-2,2,3,-math.pi/2),'sonar':(-3,-2.5,6,5,-math.pi/2),'led':(-1,-1,2,3,math.pi/2)}
    sizes['color']=sizes['light']
    for kind,f,r,angle in w.sensors.values():
        if kind not in sizes:continue
        x,y,ww,hh,offset=sizes[kind];a=math.radians(angle)+offset;c,s=math.cos(a),math.sin(a)
        polys.append([(f+c*u-s*v,r+s*u+c*v) for u,v in ((x,y),(x+ww,y),(x+ww,y+hh),(x,y+hh))])
    c,s=math.cos(w.heading),math.sin(w.heading)
    return [[(w.x+c*x-s*y,w.y+s*x+c*y) for x,y in p] for p in polys]

class Judge:
    def __init__(self,scene,robots):
        self.regions={r['id']:r for r in scene.get('regions',[])}
        self.spec=scene.get('task');validate(scene.get('regions',[]),self.spec)
        self.robots=robots;self.props=next(iter(robots.values())).props
        ids=scene.get('propIds',[])
        if ids and (len(ids)!=len(self.props) or len(set(ids))!=len(ids)):raise ValueError('Некорректные идентификаторы предметов.')
        self.objects={key:('robot',w) for key,w in robots.items()}
        for i,w in enumerate(robots.values()):self.objects.setdefault('robot'+str(i+1),('robot',w))
        for alias,key in (self.spec or {}).get('aliases',{}).items():
            if key not in robots:raise ValueError('Не найден робот: '+key)
            self.objects[alias]=('robot',robots[key])
        for i,obj in enumerate(self.props):
            key=ids[i] if ids else 'prop'+str(i+1)
            if key in self.objects:raise ValueError('Повторяется ID объекта: '+key)
            self.objects[key]=(obj.kind,obj)
        self.vars={};self.events=[];self.messages=[];self.fired=[];self.cache={};self.geometry_cache={};self.area_cache={};self.region_shapes={key:region_polygon(r) for key,r in self.regions.items()};self.time=0.;self.current=None
        self.status='running' if self.spec and self.spec.get('nodes') else 'none';self.reason='';self.limit=None
        if self.status=='none':return
        for n in self.spec['nodes']:
            if n['tag']=='event':
                group=n.get('attrs',{}).get('foreach')
                targets=[key for key,(kind,obj) in self.objects.items() if kind==group] if group else [None]
                for target in targets:
                    node=copy.deepcopy(n)
                    if target:
                        def bind(v):
                            if v.get('attrs',{}).get('objectId')=='$object':v['attrs']['objectId']=target
                            for child in v.get('children',[]):bind(child)
                        bind(node)
                    a=node.get('attrs',{});self.events.append(dict(node=node,id=a['id'],target=target,enabled=self.flag(a,'settedUpInitially',True),since=0.,last=False))
            elif n['tag']=='timelimit':self.limit=float(n.get('attrs',{}).get('value',0))/1000
        self.events.sort(key=lambda e:float(e['node'].get('attrs',{}).get('priority',0)),reverse=True)
        def references(n):
            a=n.get('attrs',{})
            key=a.get('objectId') or (a.get('object','').partition('.')[0] if n['tag']=='objectState' else None)
            if key and key!='$object':self.get_object(key)
            for c in n.get('children',[]):references(c)
        for n in self.spec['nodes']:references(n)
        for n in self.spec['nodes']:
            if n['tag']=='init':self.actions(n.get('children',[]))
        self.tick(0)

    @staticmethod
    def flag(attrs,key,default=False):return str(attrs.get(key,str(default))).lower()=='true'
    def get_object(self,key):
        if key not in self.objects:raise ValueError('Не найден объект задания: '+str(key))
        return self.objects[key]
    def inside(self,key,region):
        kind,obj=self.get_object(key);r=self.regions[region]
        stamp=(obj.x,obj.y,getattr(obj,'heading',None),getattr(obj,'joint',None),getattr(obj,'car_steer',None))
        cached=self.cache.get((key,region))
        if cached and cached[0]==stamp:return cached[1]
        cached=self.geometry_cache.get(key)
        if cached and cached[0]==stamp:polys,area,bounds=cached[1:]
        else:
            if kind=='robot':polys=projection(obj)
            else:polys=[[(obj.x+obj.radius*math.cos(i*math.tau/64),obj.y+obj.radius*math.sin(i*math.tau/64)) for i in range(64)]]
            area_key=(key,stamp[3],stamp[4])
            if area_key not in self.area_cache:
                self.area_cache[area_key]=union_area([[(x-obj.x,y-obj.y) for x,y in p] for p in polys])
                if len(self.area_cache)>128:self.area_cache={area_key:self.area_cache[area_key]}
            area=self.area_cache[area_key]
            points=[v for p in polys for v in p];bounds=(min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points))
            self.geometry_cache[key]=(stamp,polys,area,bounds)
        x,y,w,h=r['rect'];a,b,c,d=bounds
        if c<x or a>x+w or d<y or b>y+h:result=False
        elif r['kind']=='rectangle' and x<=a and c<=x+w and y<=b and d<=y+h:result=True
        else:
            overlap=union_area([clipped(p,self.region_shapes[region]) for p in polys])
            result=overlap+1e-7>=area*.5
        self.cache[(key,region)]=(stamp,result)
        return result
    def value(self,n):
        t=n['tag'];a=n.get('attrs',{});cs=n.get('children',[])
        if t in ('condition','trigger'):return self.value(cs[0]) if cs else False
        if t=='conditions':return (all if a.get('glue','and')=='and' else any)(self.value(c) for c in cs)
        if t=='not':return not self.value(cs[0])
        if t=='inside':return self.inside(a['objectId'],a['regionId'])
        if t=='count':
            return sum(1 for key,(kind,obj) in self.objects.items() if kind in ('can','ball') and (a.get('type','all') in ('all',kind)) and (not a.get('regionId') or self.inside(key,a['regionId'])!=self.flag(a,'outside')))
        if t in ('int','double'):return (int if t=='int' else float)(a.get('value',0))
        if t=='bool':return self.flag(a,'value')
        if t=='string':return str(a.get('value',''))
        if t=='variableValue':return self.vars.get(a['name'],0)
        if t in ('settedUp','dropped'):
            enabled=any(e['enabled'] for e in self.events if e['id']==a['id'])
            return enabled if t=='settedUp' else not enabled
        if t=='timer':return (self.time-(self.current['since'] if self.current else 0))*1000>=float(a['timeout'])
        if t=='typeOf':return self.get_object(a['objectId'])[0]
        if t=='objectState':
            key,_,path=a['object'].partition('.');kind,obj=self.get_object(key)
            state=dict(x=obj.x,y=obj.y,rotation=math.degrees(getattr(obj,'heading',0)),time=self.time)
            if kind=='robot':state.update(encoders=obj.encoders,motors=obj.speeds,speed=getattr(obj,'car_speed',0))
            value=state
            for part in path.split('.'):
                if isinstance(value,list):value=value[int(part)]
                elif isinstance(value,dict) and part in value:value=value[part]
                else:raise ValueError('Не поддерживается состояние: '+a['object'])
            return value
        values=[self.value(c) for c in cs]
        if t=='equals':return values[0]==values[1]
        if t=='notEqual':return values[0]!=values[1]
        if t=='greater':return values[0]>values[1]
        if t=='less':return values[0]<values[1]
        if t=='sum':return sum(values)
        if t=='difference':return values[0]-sum(values[1:])
        if t=='min':return min(values)
        if t=='max':return max(values)
        if t=='abs':return abs(values[0])
        if t=='minus':return -values[0]
        raise ValueError('Не поддерживается выражение: '+t)
    def actions(self,nodes):
        for n in nodes:
            if self.status not in ('running','none'):break
            t=n['tag'];a=n.get('attrs',{});cs=n.get('children',[])
            if t in ('triggers','trigger','init'):self.actions(cs)
            elif t=='setter':self.vars[a['name']]=self.value(cs[0])
            elif t=='message':
                text=str(a.get('text',''))
                values=dict(self.vars)
                for c in cs:
                    if c['tag']=='replace':values[c['attrs']['var']]=self.value(c['children'][0])
                for key,value in values.items():text=text.replace('%'+key+'%',str(value))
                self.messages.append(dict(time=round(self.time,3),text=text[:1000]));self.messages=self.messages[-200:]
            elif t in ('setUp','drop'):
                for e in self.events:
                    if e['id']==a['id']:e.update(enabled=t=='setUp',since=self.time,last=False)
            elif t in ('success','fail'):
                self.status='success' if t=='success' else 'failed';self.reason=a.get('message','Задание выполнено' if t=='success' else 'Задание не выполнено')
            else:raise ValueError('Не поддерживается действие: '+t)
    def tick(self,time):
        self.time=time
        if self.status!='running':return
        if self.limit is not None and time>=self.limit:
            self.status='failed';self.reason='Истекло время задания';return
        for n in self.spec['nodes']:
            if n['tag']=='constraint' and (time==0 or not self.flag(n.get('attrs',{}),'checkOnce')):
                if not all(self.value(c) for c in n.get('children',[])):
                    self.status='failed';self.reason=n.get('attrs',{}).get('failMessage','Нарушено условие задания');return
        for e in self.events:
            if not e['enabled'] or self.status!='running':continue
            self.current=e;n=e['node'];a=n.get('attrs',{});cs=n.get('children',[])
            cond=next((c for c in cs if c['tag'] in ('condition','conditions','inside')),None)
            true=bool(cond and self.value(cond))
            if true and (not self.flag(a,'edge') or not e['last']):
                if self.flag(a,'dropsOnFire',True):e['enabled']=False
                self.fired.append(dict(id=e['id'],object=e['target'],time=round(time,3)));self.fired=self.fired[-500:]
                self.actions([c for c in cs if c['tag'] in ('trigger','triggers')])
            e['last']=true
        self.current=None
    def finish(self):
        if self.status=='running':self.status='incomplete';self.reason='Программа завершена до выполнения задания'
    def snapshot(self):
        if self.status=='none':return None
        return dict(status=self.status,reason=self.reason,score=self.vars.get('total_score',self.vars.get('score',0)),variables=self.vars.copy(),messages=self.messages[:],events=self.fired[:],time=round(self.time,3),limit=self.limit)
