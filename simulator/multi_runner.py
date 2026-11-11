"""Advance a shared scene while robot programs run in separate interpreters."""
import base64
import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import threading
import time

sys.path.insert(0,str(Path(__file__).resolve().parent))
from engine import World,TICK,number
from task_rules import Judge

def send(kind,**data):
    print(json.dumps(dict(kind=kind,**data)),flush=True)

def worlds(scene):
    if not 1 <= len(scene['robots']) <= 8:
        raise ValueError('На поле должно быть от 1 до 8 роботов.')
    pixels = base64.b64decode(scene['floor'],validate=True)
    robots = {}
    props = None
    for row in scene['robots']:
        key = row['id']
        if key in robots:
            raise ValueError('У роботов должны быть разные идентификаторы.')
        try:
            robots[key] = World(dict(scene,**row,_pixels=pixels),props)
            props = robots[key].props
        except ValueError as exc:
            raise ValueError(f'{row["name"]}: {exc}') from exc
    for key,w in robots.items():
        w.others = [o for o in robots.values() if o is not w]
        if len(robots)==2:
            peer_key=next(other for other in robots if other!=key)
            w.bluetooth_peer=robots[peer_key]
            w.bluetooth_peer_key=peer_key
        if w.collides(w.x,w.y,w.heading):
            raise ValueError(f'Робот {key}: на старте роботы пересекаются.')
    return robots

def run(request, remainder=b''):
    robots = worlds(request['scene'])
    judge=Judge(dict(request['scene'],task=None) if request.get('training') else request['scene'],robots)
    rate = number(request.get('rate',1),1,8)
    children,active,pending = {},set(),{}
    events = queue.Queue()
    elapsed,next_frame = 0.,0.
    def read(key, stream):
        try:
            for line in stream:
                events.put((key,json.loads(line)))
        except (ValueError,OSError):
            pass
        finally:
            events.put((key,None))
    def reply(key, **data):
        try:
            pipe = children[key].stdin
            pipe.write(json.dumps(data)+'\n')
            pipe.flush()
        except (BrokenPipeError,OSError,ValueError):
            pass
    def frame():
        send('state',time=elapsed,task=judge.snapshot(),robots={k:w.snapshot() for k,w in robots.items()},
             props=[[p.x,p.y] for p in next(iter(robots.values())).props])
    def terminal_frame():
        for w in robots.values():
            for port in range(1,w.count+1):w.motor(port,0)
        frame()
    def control():
        if not remainder:
            os.read(sys.stdin.fileno(),4096)
        events.put((None,None))
    if request.get('interactive'):
        threading.Thread(target=control,daemon=True).start()
    try:
        if judge.status in ('success','failed'):
            terminal_frame();return
        for key, program in request['programs'].items():
            w = robots[key]
            proc = subprocess.Popen([sys.executable,'-I','-u',str(Path(__file__).with_name('robot_worker.py'))],
                stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,
                text=True,encoding='utf8',creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),cwd=str(Path(program['filename']).parent))
            children[key] = proc
            active.add(key)
            reply(key,program=program,robot={k:getattr(w,k) for k in ('count','sensor_count','sensors','light_min','light_max','left','right','reversed','left_mount_sign')})
            threading.Thread(target=read,args=(key,proc.stdout),daemon=True).start()
        frame()
        clock_wall=time.monotonic()
        while active or (getattr(judge,'players',None) and judge.status=='running'):
            if getattr(judge,'players',None) and active!=pending.keys() and time.monotonic()-clock_wall>=TICK/rate:
                # Memory/button polling can produce continuous protocol messages
                # without an advance request. It must not freeze a tennis set.
                dt=min(TICK,max(0,min(pending.values())-elapsed)) if pending else TICK
                if dt:
                    for w in robots.values():w.step(dt)
                    next(iter(robots.values())).advance_props(dt)
                    elapsed+=dt;judge.tick(elapsed)
                    clock_wall=time.monotonic()
                    if judge.status in ('success','failed'):terminal_frame();return
                clock_wall=time.monotonic()
                if elapsed>=next_frame:frame();next_frame=elapsed+.04*rate
                for key,end in list(pending.items()):
                    if end<=elapsed+1e-9:del pending[key];reply(key,result=None)
            if active == pending.keys() and events.empty():
                goal = min(pending.values()) if pending else elapsed+TICK
                dt = min(TICK,max(0,goal-elapsed))
                if dt:
                    for w in robots.values():
                        w.step(dt)
                    next(iter(robots.values())).advance_props(dt)
                    elapsed += dt
                    judge.tick(elapsed)
                    clock_wall=time.monotonic()
                    if judge.status in ('success','failed'):
                        terminal_frame();return
                    if request.get('interactive'):
                        time.sleep(dt/rate)
                if elapsed >= next_frame:
                    frame()
                    next_frame = elapsed+.04*rate
                for key,end in list(pending.items()):
                    if end <= elapsed+1e-9:
                        del pending[key]
                        reply(key,result=None)
                continue
            try:
                key,msg = events.get(timeout=TICK/rate if getattr(judge,'players',None) else None)
            except queue.Empty:
                # Tennis clocks also run when user code computes forever without
                # calling a robot API. Other task modes retain their old clock.
                dt=min(TICK,max(0,min(pending.values())-elapsed)) if pending else TICK
                if dt:
                    for w in robots.values():w.step(dt)
                    next(iter(robots.values())).advance_props(dt)
                    elapsed+=dt;judge.tick(elapsed)
                    clock_wall=time.monotonic()
                    if judge.status in ('success','failed'):terminal_frame();return
                if elapsed>=next_frame:frame();next_frame=elapsed+.04*rate
                for key,end in list(pending.items()):
                    if end<=elapsed+1e-9:del pending[key];reply(key,result=None)
                continue
            if key is None:
                judge.finish()
                if judge.status=='incomplete':judge.reason='Остановлено пользователем'
                terminal_frame()
                send('stopped')
                return
            if msg is None:
                pending.pop(key,None)
                active.discard(key)
                w = robots[key]
                for p in range(1,w.count+1):
                    w.motor(p,0)
                continue
            kind = msg.pop('kind')
            if kind != 'call':
                send(kind,robot=key,**msg)
                continue
            op,args = msg['op'],msg['args']
            w = robots[key]
            try:
                if op == 'advance':
                    pending[key] = elapsed+number(args[0],0,3600)
                    continue
                if op in ('motor','read','set_lamp','set_light_led','light_threshold','system_time','set_bluetooth','get_bluetooth','device'):
                    result = getattr(w,op)(*args)
                else:
                    name,i,*val = args
                    if name not in ('cells','targets','encoders'):
                        raise ValueError('Неизвестный регистр.')
                    slots = getattr(w,name)
                    if op == 'get':
                        result = slots[i]
                    elif op == 'contains':
                        result = i in slots
                    elif op == 'set':
                        slots[i] = val[0]
                        result = None
                    elif op == 'get_default':
                        result = slots.get(i,val[0])
                    else:
                        raise ValueError('Неизвестная команда.')
                reply(key,result=result)
            except (ValueError,TypeError,KeyError,IndexError) as exc:
                reply(key,error=str(exc))
        judge.finish()
        terminal_frame()
    finally:
        for proc in children.values():
            if proc.poll() is None:
                proc.kill()
        for proc in children.values():
            proc.wait()

if __name__ == '__main__':
    try:
        request = bytearray()
        while b'\n' not in request[-65536:]:
            chunk=os.read(sys.stdin.fileno(),65536)
            if not chunk:
                break
            request.extend(chunk)
            if len(request)>12_100_000:
                raise ValueError('Запрос слишком большой.')
        line,_,remainder=request.partition(b'\n')
        run(json.loads(line),remainder)
    except Exception as exc:
        send('error',text=str(exc))
        sys.exit(1)
