"""Run the selected Python file with simulated device modules."""
import contextlib
import io
import json
import sys
import time
import traceback
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from engine import World, motor_power, TICK, number, port
from task_rules import Judge

def run(request, send, world=None, remote_advance=None):
    world = world if world is not None else World(request['scene'])
    judge=None if remote_advance else Judge(request['scene'],{request['scene'].get('id','robot1'):world})
    class TaskEnded(Exception):pass
    rate = number(request.get('rate',1),1,8)
    next_frame = 0.0
    timer_origin = 0.0
    program = request['program']
    filename = program['filename']

    def frame():
        if not remote_advance:
            send('state',task=judge.snapshot(),props=[[p.x,p.y] for p in world.props],**world.snapshot())

    def advance(duration):
        nonlocal next_frame
        if remote_advance:
            return remote_advance(duration)
        remaining = duration
        while remaining > 1e-9:
            dt = min(TICK,remaining)
            world.step(dt)
            world.advance_props(dt)
            remaining -= dt
            judge.tick(world.time)
            if judge.status in ('success','failed'):raise TaskEnded()
            time.sleep(dt/rate)
            if world.time >= next_frame:
                frame()
                next_frame = world.time+0.04*rate

    def read(p,kind,mode=None):
        advance(0.003)  # Polling loops also progress without an explicit wait.
        return world.read(p,kind,mode)

    def reset_timer():
        nonlocal timer_origin
        timer_origin = world.system_time()

    def get_timer():
        advance(.003)
        return round(max(0,world.system_time()-timer_origin),9)

    def get_bluetooth():
        # Yield model time so a busy polling loop lets the other program run.
        advance(.003)
        return world.get_bluetooth()

    def set_bluetooth(data):
        world.set_bluetooth(data)
        advance(.003)

    def set_angle(p,speed,angle,wait=False):
        p = port(p,world.count)
        angle = number(angle,-1e8,1e8)
        speed = motor_power(speed)
        if angle == 0:
            world.motor(p,0)
            return
        if speed == 0:
            raise ValueError('Для поворота на угол задай ненулевую скорость.')
        if angle < 0:
            speed = -abs(speed)
        world.motor(p,speed)
        world.targets[p] = world.encoders[p]+abs(angle)*(1 if speed > 0 else -1)
        if wait:
            while p in world.targets:
                advance(TICK)

    def set_second(p,speed,seconds):
        seconds = number(seconds,0,3600)
        world.motor(p,speed)
        advance(seconds)
        world.motor(p,0)

    def encoder(p):
        advance(0.003)
        return round(world.encoders[port(p,world.count)])

    def reset_encoder(p):
        p = port(p,world.count)
        if p in world.targets:
            world.targets[p] -= world.encoders[p]
        world.encoders[p] = 0.0

    def display(row,text,*colors):
        send('display',row=str(row),text=str(text)[:500])

    def set_data(i,v):
        if type(v) is not int or not 0<=v<=4095:
            raise ValueError('Ячейка принимает целые числа от 0 до 4095.')
        world.cells[port(i,128)] = v

    def stop_all():
        for p in range(1,world.count+1):
            world.motor(p,0)

    def module(name, **functions):
        mod = types.ModuleType(name)
        vars(mod).update(functions)
        sys.modules[name] = mod
        return mod

    motors = module('motor',SetMotor=world.motor,SetMotorStop=lambda p: world.motor(p,0),
        SetMotorCode=reset_encoder,GetMotorCode=encoder,SetMotorConstSpeed=world.motor,
        SetMotorSecond=set_second,SetMotorAngle=set_angle,SetMotorAngleDelay=lambda p,s,a: set_angle(p,s,a,True))
    sensors = module('sensor',GetLightSensor=lambda p: read(p,'light'),
        GetLightSensorData=lambda p: int(read(p,'light') < world.light_threshold(p)),
        Set3CLed=world.set_lamp,SetLightSensorLed=world.set_light_led,GetColorSensor=lambda p,mode: read(p,'color',mode),
        GetLaserDist=lambda p,mode=1: read(p,'laser',mode),GetUltrasound=lambda p: read(p,'sonar'))
    controller = module('rcu',GetBluetoothData=get_bluetooth,SetBluetoothData=set_bluetooth,SetSysTime=reset_timer,GetSysTime=get_timer,GetData=lambda i: world.cells.get(port(i,128),0),SetData=set_data,
        SetWaitForTime=lambda s: advance(number(s,0,3600)),SetRcuStop=stop_all,
        SetDisplayString=display,SetDisplayVar=display,SetDisplayVarU32=display,
        SetInBeep=lambda state: None)
    for mod in (motors,sensors):
        for key,value in vars(mod).items():
            if not key.startswith('_'):
                setattr(controller,key,value)

    class Log(io.TextIOBase):
        budget = 16000
        def write(self, text):
            if self.budget > 0 and text:
                send('log',text=text[:self.budget])
                self.budget -= len(text)
            return len(text)

    frame()
    sys.path.insert(1, str(Path(filename).parent))
    sys.argv = [filename]
    variables = {}
    last_report = 0
    def observe(frame, event, arg):
        nonlocal variables,last_report
        if frame.f_code.co_filename != filename:
            return None
        now = time.monotonic()
        if event == 'return' or now-last_report >= .10:
            values = {}
            for scope in (frame.f_globals,frame.f_locals):
                for key,val in list(scope.items())[:200]:
                    if key.startswith('_'):
                        continue
                    if type(val) in (str,bool,int,float,type(None)):
                        try:
                            values[key[:80]] = repr(val)[:160]
                        except ValueError:
                            pass
                    if len(values) >= 60:
                        break
            if values != variables:
                variables = values
                send('variables',values=values)
            last_report = now
        return observe
    try:
        if judge and judge.status in ('success','failed'):raise TaskEnded()
        with contextlib.redirect_stdout(Log()), contextlib.redirect_stderr(Log()):
            if remote_advance:
                sys.settrace(observe)
            exec(compile(program['source'], filename, 'exec'),
                 {'__name__':'__main__','__file__':filename})
    except TaskEnded:
        pass
    finally:
        if judge:judge.finish()
        sys.settrace(None)
        stop_all()
        frame()

def main():
    protocol = sys.stdout
    def send(kind,**payload):
        print(json.dumps(dict(kind=kind,**payload),ensure_ascii=True),file=protocol,flush=True)
    try:
        run(json.loads(sys.stdin.readline()),send)
    except SystemExit as exc:
        if exc.code not in (None,0):
            send('error',text=str(exc.code))
            return 1
    except Exception:
        send('error',text=traceback.format_exc(limit=12))
        return 1
    send('done')
    return 0

if __name__=='__main__':
    sys.exit(main())
