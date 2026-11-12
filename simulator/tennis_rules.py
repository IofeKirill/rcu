"""Two-player tennis judging for the supplied RoboFinist regulation excerpts.

Ball positions on black/neutral markings do not score. The entire ball must
cross an out boundary. Referee decisions (clinch, ambiguous out, draws) are
reported for review, never silently converted to a win.
"""
import copy
import math
from task_rules import projection

def validate_spec(task):
    if task.get('version')!=1:raise ValueError('Неизвестная версия правил тенниса.')
    cfg=task.get('tennis',{})
    if not isinstance(cfg,dict):raise ValueError('Некорректные правила тенниса.')
    if task.get('nodes')!=[]:raise ValueError('Для тенниса используются отдельные правила сета.')
    field=cfg.get('field')
    if not isinstance(field,list) or len(field)!=4 or any(type(v)not in(int,float)or not math.isfinite(v)for v in field):raise ValueError('Некорректное поле тенниса.')
    if field[2:]!=[200,100] or max(abs(field[0]),abs(field[1]))>4500:raise ValueError('Поле тенниса должно быть 200 × 100 см до линий аута.')
    players=cfg.get('players')
    if not isinstance(players,list)or len(players)!=2 or any(not isinstance(x,str)for x in players) or len(set(players))!=2:raise ValueError('В теннисе нужны два разных робота.')

def distance(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)

def touching(a,b):
    # Contact, including the tiny separation retained by the collision solver.
    from engine import polygons_overlap
    return any(polygons_overlap(p,q)or min(distance(v,c,d)for poly,other in ((p,q),(q,p))for v in poly for c,d in zip(other,other[1:]+other[:1]))<.12 for p in a for q in b)

class TennisJudge:
    def __init__(self,scene,robots,checkpoint=None):
        validate_spec(scene['task']);self.spec=scene['task'];self.scene=scene;self.robots=robots
        self.players=self.spec['tennis']['players'];self.names=[next((r.get('name',k)for r in scene['robots']if r['id']==k),k)for k in self.players]
        if set(robots)!=set(self.players):raise ValueError('Для тенниса назначь ровно двух роботов.')
        self.worlds=[robots[k]for k in self.players];self.props=self.worlds[0].props
        self.x,self.y,self.width,self.height=self.spec['tennis']['field']
        self.left=self.x+87.5;self.neutral_left=self.x+92.5;self.neutral_right=self.x+107.5;self.right=self.x+112.5
        self.time=0.;self.limit=60.;self.status='running';self.reason='';self.result='running';self.winner=None
        self.goals=[0,0];self.outs=[0,0];self.penalties=[0,0];self.unknown=[];self.scored={}
        self.messages=[];self.fired=[];self.line_inside=[False,False];self.outside_since=[None,None]
        self.last_motion=[0.,0.];self.moved=[False,False];self.anchors=[[w.x,w.y,w.heading]for w in self.worlds]
        self.last_zone=[self.zone(p.x,p.y)for p in self.props];self.clinch_since=None;self.dimensions=[]
        self.start_positions=[(w.x,w.y)for w in self.worlds]
        if checkpoint is not None:
            self.restore(checkpoint);return
        self.preflight()
    def log(self,text):
        self.messages.append(dict(time=round(self.time,3),text=text));self.messages=self.messages[-200:]
    def zone(self,x,y):
        if self.y<=y<=self.y+100:
            if self.x<=x<self.left:return 0
            if self.right<x<=self.x+200:return 1
            if self.left<=x<=self.right:return 'neutral'
        return 'out'
    def geometry(self,w):
        polys=projection(w);points=[p for poly in polys for p in poly]
        return polys,(min(p[0]for p in points),min(p[1]for p in points),max(p[0]for p in points),max(p[1]for p in points))
    def size(self,w,polys):
        c,s=math.cos(w.heading),math.sin(w.heading)
        points=[(c*(x-w.x)+s*(y-w.y),-s*(x-w.x)+c*(y-w.y))for poly in polys for x,y in poly]
        return max(x for x,y in points)-min(x for x,y in points),max(y for x,y in points)-min(y for x,y in points)
    def preflight(self):
        errors=[]
        if len(self.props)!=6 or any(p.kind!='ball'or not 2.8<=p.radius<=2.9 for p in self.props):errors.append('Нужны шесть теннисных мячей диаметром 5,6–5,8 см.')
        radius=self.props[0].radius if self.props else 2.85
        left_y=self.y+85-12.5-radius;right_y=self.y+15+12.5+radius
        pitch=10+2*radius
        for i,w in enumerate(self.worlds):
            polys,b=self.geometry(w);size=self.size(w,polys);self.dimensions.append(size)
            if max(size)>20+1e-6:errors.append(self.names[i]+': конструкция с датчиками превышает 20 × 20 см.')
            if w.claw and w.claw.get('kind') not in ('small','large','narrow','straight'):errors.append(self.names[i]+': моторные захваты и пиналки запрещены; разрешены только неподвижные клешни.')
            edge=b[0]if i==0 else b[2];expected=self.x if i==0 else self.x+200
            angle=abs(math.atan2(math.sin(w.heading-i*math.pi),math.cos(w.heading-i*math.pi)))
            expected_y=left_y if i==0 else right_y
            if abs(edge-expected)>.5 or abs(w.y-expected_y)>.5 or angle>math.radians(2):errors.append(self.names[i]+': старт у задней границы напротив своего правого мяча.')
        if not errors:
            # Distances in the regulation are clear gaps, not centre distances.
            # With 5.7 cm balls, a 10 cm gap gives a 15.7 cm centre pitch.
            for side in (0,1):
                rows=sorted([p for p in self.props if self.zone(p.x,p.y)==side],key=lambda p:p.y)
                if len(rows)!=3:errors.append('На каждой половине должно быть по три мяча.');continue
                expected_y=[left_y-2*pitch,left_y-pitch,left_y]if side==0 else [right_y,right_y+pitch,right_y+2*pitch]
                for p,yy in zip(rows,expected_y):
                    gap=self.left-p.x-p.radius if side==0 else p.x-p.radius-self.right
                    if not 2-1e-6<=gap<=3+1e-6 or abs(p.y-yy)>.5:errors.append('Расстановка мячей не соответствует регламенту.');break
        if errors:self.end('Подготовка: '+' '.join(errors),result='invalid')
    def ball_update(self):
        for i,p in enumerate(self.props):
            if str(i)in self.scored:continue
            old_zone=self.last_zone[i]
            # A full crossing prevents a ball on the line becoming a goal.
            conceded=0 if p.x+p.radius<self.x else 1 if p.x-p.radius>self.x+200 else None
            if conceded is not None:
                self.goals[conceded]+=1;self.scored[str(i)]={'kind':'goal','side':conceded};self.log(f'Мяч {i+1}: гол в ворота {self.names[conceded]}.')
            elif p.y+p.radius<self.y or p.y-p.radius>self.y+100:
                toucher=getattr(p,'last_touch',None)
                side=self.players.index(toucher)if toucher in self.players else old_zone if old_zone in (0,1) else None
                if side is None:
                    self.unknown.append(i);self.scored[str(i)]={'kind':'unknown'};self.log(f'Мяч {i+1}: боковой аут, нужен судья — неизвестен последний толчок.')
                else:
                    self.outs[side]+=1;self.scored[str(i)]={'kind':'out','side':side};self.log(f'Мяч {i+1}: аут у {self.names[side]}.')
            if str(i) in self.scored:p.inactive=True;p.vx=p.vy=0.
            self.last_zone[i]=self.zone(p.x,p.y)
    def tally(self):
        counts=[0,0];neutral=0
        for i,p in enumerate(self.props):
            if str(i)in self.scored:continue
            # Before a full out crossing, a ball straddling its rear/side
            # boundary still belongs to that defending half.
            zone=0 if p.x<self.left else 1 if p.x>self.right else 'neutral'
            if zone in (0,1):counts[zone]+=1
            elif zone=='neutral':neutral+=1
        lost=[counts[i]+self.goals[i]+self.outs[i]+self.penalties[i]for i in (0,1)]
        return counts,neutral,[lost[1],lost[0]]
    def decide(self):
        _,_,scores=self.tally()
        if self.unknown:return None
        if scores[0]!=scores[1]:return 0 if scores[0]>scores[1]else 1
        goal_scores=[self.goals[1],self.goals[0]]
        if goal_scores[0]!=goal_scores[1]:return 0 if goal_scores[0]>goal_scores[1]else 1
        return None
    def end(self,reason,winner=None,result='final'):
        self.status='success'if result!='invalid'else 'failed';self.reason=reason;self.result=result
        self.winner=winner if winner is not None else self.decide()if result=='final'else None
        if result=='final'and self.unknown:self.result='review';self.reason+=' Требуется решение по спорному ауту.'
        elif result=='final'and self.winner is None:self.result='draw';self.reason+=' Равный счёт и число голов — переигровка или решение судьи.'
        self.log(self.reason)
    def tick(self,time):
        if self.status!='running':return
        self.time=min(float(time),self.limit)
        self.ball_update();polygons=[];boxes=[];losers=[]
        for i,w in enumerate(self.worlds):
            polys,b=self.geometry(w);polygons.append(polys);boxes.append(b)
            size=self.size(w,polys)
            if max(size)>20+1e-6 or any(abs(a-c)>.02 for a,c in zip(size,self.dimensions[i])):
                losers.append(i);self.log(self.names[i]+': нарушены размеры конструкции.')
            anchor=self.anchors[i];delta=abs(math.atan2(math.sin(w.heading-anchor[2]),math.cos(w.heading-anchor[2])))
            if math.hypot(w.x-anchor[0],w.y-anchor[1])>.05 or delta>.005:
                self.moved[i]=True;self.last_motion[i]=self.time;self.anchors[i]=[w.x,w.y,w.heading]
            if self.time+1e-9>=5 and not self.moved[i]:losers.append(i);self.log(self.names[i]+': нет движения в течение 5 с после старта.')
            line=(self.neutral_right,self.right)if i==0 else (self.left,self.neutral_left)
            on_line=b[2]>=line[0]and b[0]<=line[1]and b[3]>=self.y and b[1]<=self.y+100
            if on_line and not self.line_inside[i]:self.penalties[i]+=1;self.log(self.names[i]+': наезд на чужую ограничительную линию, 1 штрафной мяч.')
            self.line_inside[i]=on_line
            foreign=b[0]>self.right if i==0 else b[2]<self.left
            if foreign and b[1]>=self.y and b[3]<=self.y+100:losers.append(i);self.log(self.names[i]+': робот полностью на поле соперника.')
            lo,hi=(self.x,self.neutral_left)if i==0 else(self.neutral_right,self.x+200)
            outside=b[0]<lo-1e-6 or b[2]>hi+1e-6 or b[1]<self.y-1e-6 or b[3]>self.y+100+1e-6
            self.outside_since[i]=self.time if outside and self.outside_since[i]is None else self.outside_since[i]if outside else None
            if outside and self.time-self.outside_since[i]>5+1e-9:losers.append(i);self.log(self.names[i]+': более 5 с за границей своей игровой зоны.')
        if losers:
            unique=set(losers);self.end('Поражение по нарушению регламента.'if len(unique)==1 else 'Обоюдное нарушение — решение судьи.',winner=1-next(iter(unique))if len(unique)==1 else None,result='forfeit'if len(unique)==1 else 'review');return
        if self.time+1e-9>=self.limit:self.time=self.limit;self.end('Закончилось время сета (60 с).');return
        # May be stopped early by a referee; do not automatically award a set.
        in_neutral=all(b[2]>=self.neutral_left and b[0]<=self.neutral_right for b in boxes)
        quiet=all(self.time-v>=.05 for v in self.last_motion)
        contact=in_neutral and quiet and touching(*polygons)
        self.clinch_since=max(self.last_motion) if contact and self.clinch_since is None else self.clinch_since if contact else None
        if contact and self.time-self.clinch_since>=5-1e-9:self.end('Клинч в нейтральной зоне 5 с. Судья может назначить переигровку.',result='review');return
        if all(self.moved)and all(self.time-v>15 for v in self.last_motion):self.end('Оба робота не двигаются более 15 с. Судья может завершить сет.',result='review');return
        if len(self.scored)==len(self.props):self.end('На игровом поле не осталось мячей.');return
    def finish(self):
        if self.status=='running':self.ball_update();self.end('Сет остановлен судьёй.')
    def snapshot(self):
        counts,neutral,scores=self.tally()
        data=dict(players=self.players,names=self.names,fieldBalls=counts,neutral=neutral,goalsConceded=self.goals[:],outs=self.outs[:],penalties=self.penalties[:],scores=scores,winner=self.winner,result=self.result,unknown=self.unknown[:],scored=copy.deepcopy(self.scored))
        variables={'Слева: мячи на поле':counts[0],'Справа: мячи на поле':counts[1],'Слева: пропущено голов':self.goals[0],'Справа: пропущено голов':self.goals[1],'Слева: штрафы':self.penalties[0],'Справа: штрафы':self.penalties[1],'Нейтральные мячи':neutral}
        return dict(status=self.status,reason=self.reason,score=scores[0],variables=variables,messages=self.messages[:],events=self.fired[:],time=round(self.time,3),limit=60,tennis=data)
    def checkpoint(self):
        keys=['time','status','reason','result','winner','goals','outs','penalties','unknown','scored','messages','fired','line_inside','outside_since','last_motion','moved','anchors','last_zone','clinch_since','dimensions','start_positions']
        return {'kind':'tennis',**{k:copy.deepcopy(getattr(self,k))for k in keys}}
    def restore(self,data):
        if data.get('kind')!='tennis':raise ValueError('Некорректная контрольная точка тенниса.')
        allowed=set(self.checkpoint())-{'kind'}
        for k,v in data.items():
            if k in allowed:setattr(self,k,copy.deepcopy(v))
        for i,p in enumerate(self.props):p.inactive=str(i) in self.scored
