"""Execute one robot's program in a dedicated interpreter."""
import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent))
from runner import run

inp,out = sys.stdin,sys.stdout

def send(kind, **data):
    out.write(json.dumps(dict(kind=kind,**data))+'\n')
    out.flush()

def call(op,*args):
    send('call',op=op,args=args)
    line = inp.readline()
    if not line:
        raise SystemExit()
    reply = json.loads(line)
    if 'error' in reply:
        raise ValueError(reply['error'])
    return reply.get('result')

class Slots:
    def __init__(self,name):
        self.name=name
    def __contains__(self,key):
        return call('contains',self.name,key)
    def __getitem__(self,key):
        return call('get',self.name,key)
    def __setitem__(self,key,value):
        call('set',self.name,key,value)
    def get(self,key,default=None):
        return call('get_default',self.name,key,default)

class Robot:
    def __init__(self,metadata):
        vars(self).update(metadata)
        self.sensors = {int(k):v for k,v in self.sensors.items()}
        for name in ('cells','encoders','targets'):
            setattr(self,name,Slots(name))
    def system_time(self):
        return call('system_time')

    def set_bluetooth(self,data):
        return call('set_bluetooth',data)
    def get_bluetooth(self):
        return call('get_bluetooth')

    def motor(self,*args):
        return call('motor',*args)
    def read(self,*args):
        return call('read',*args)

    def set_lamp(self,*args):
        return call('set_lamp',*args)
    def set_light_led(self,*args):
        return call('set_light_led',*args)
    def light_threshold(self,*args):
        return call('light_threshold',*args)

if __name__ == '__main__':
    try:
        request = json.loads(inp.readline())
        run(request,send,Robot(request['robot']),lambda d: call('advance',d))
    except SystemExit as exc:
        if exc.code not in (None,0):
            send('error',text=str(exc.code))
    except Exception:
        send('error',text=traceback.format_exc(limit=8))
