"""Read simulated sensors or evaluate a manually arranged scene; never execute a program."""
import json
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from multi_runner import worlds
from engine import number
from task_rules import Judge

def inspect(request):
    scene=request['scene'];robots=worlds(scene)
    for key,state in request.get('deviceStates',{}).items():
        if key not in robots:continue
        w=robots[key]
        for port,value in state.get('light_leds',{}).items():
            if int(port) in w.light_leds:w.light_leds[int(port)]=bool(value)
        for port,value in state.get('lamps',{}).items():
            if int(port) in w.lamps:w.lamps[int(port)]=number(value,0,7)
        device=state.get('devices',{})
        for port,colors in device.get('lineColors',{}).items():
            if int(port) in w.line_colors:w.device('line_colors',int(port),colors)
        for port,value in device.get('lineThresholds',{}).items():
            if int(port) in w.line_thresholds:w.device('line_threshold',int(port),value)
        for port,colors in device.get('eyeColors',{}).items():
            if int(port) in w.eye_colors:w.device('eye_colors',int(port),colors)
        for port,value in device.get('eyeModes',{}).items():
            if int(port) in w.eye_modes and value:w.device('eye_mode',int(port),value,device.get('eyeColor',{}).get(port,0xff0000))
        for port,value in device.get('eyeTx',{}).items():
            if int(port) in w.eye_tx and value is not None:w.device('eye_send',int(port),value)
        for port,value in device.get('gyroZero',{}).items():
            if int(port) in w.gyro_zero:w.gyro_zero[int(port)]=number(value,-1e8,1e8)
        if w.mechanism_port and state.get('mechanism'):w.refresh_mechanism(number(state['mechanism']['angle'],-1e8,1e8))
    result=dict(kind='inspection',requestId=request.get('requestId'),robots={k:w.snapshot() for k,w in robots.items()})
    if request.get('judge'):
        checkpoint=request.get('checkpoint')
        judge=Judge(scene,robots,checkpoint=checkpoint)
        if checkpoint:judge.tick(judge.time+max(0,min(60,float(request.get('advance',.1)))))
        result.update(task=judge.snapshot(),checkpoint=judge.checkpoint())
    return result

if __name__=='__main__':
    try:
        raw=sys.stdin.buffer.read(12_100_001)
        if len(raw)>12_100_000:raise ValueError('Запрос слишком большой.')
        print(json.dumps(inspect(json.loads(raw)),ensure_ascii=True))
    except Exception as exc:
        print(json.dumps(dict(kind='inspectionError',text=str(exc))),flush=True)
        sys.exit(1)
