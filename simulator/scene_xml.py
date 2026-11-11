"""Read and write the local XML scene format (no embedded program code)."""
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# The extension runs Python with -I, so add only the trusted simulator folder.
sys.path.insert(0,str(Path(__file__).resolve().parent))
from polygon_import import read_world
from task_rules import validate
from devices import validate_settings

LIMIT = 4_000_000

def csv(values):
    return ' '.join(map(str,values))

def nums(raw,count, convert=float):
    values = [convert(x) for x in raw.split()]
    if len(values) != count or any(not math.isfinite(x) for x in values):
        raise ValueError('Некорректные координаты или параметры XML.')
    return values

def serialize(scene):
    validate(scene.get('regions',[]),scene.get('task'))
    ids=scene.get('propIds',[])
    if ids and (len(ids)!=len(scene.get('props',[])) or len(set(ids))!=len(ids)):raise ValueError('Некорректные идентификаторы предметов.')
    root = ET.Element('zmrobo-scene',version='1.0',realistic=str(bool(scene.get('realistic',False))).lower(),fieldLocked=str(bool(scene.get('fieldLocked',False))).lower())
    diameter=float(scene.get('ballDiameter',6.7))
    if not math.isfinite(diameter) or not 5.6<=diameter<=6.7:raise ValueError('Некорректный диаметр мяча.')
    field = ET.SubElement(root,'field',ballDiameter=str(diameter))
    if scene.get('background'):
        image = ET.SubElement(field,'image',format='png')
        if scene.get('backgroundRect'):
            image.set('rect',csv(scene['backgroundRect']))
        image.text = scene['background']
    for name,tag in [('walls','wall'),('segments','segment'),('circles','circle')]:
        for row in scene[name]:
            ET.SubElement(field,tag,coords=csv(row))
    for i,(x,y,kind) in enumerate(scene.get('props',[])):
        attrs=dict(kind=kind,coords=csv((x,y)))
        if scene.get('propIds'):attrs['id']=scene['propIds'][i]
        ET.SubElement(field,'prop',**attrs)
    for region in scene.get('regions',[]):
        ET.SubElement(field,'region',id=region['id'],name=region.get('name',region['id']),kind=region['kind'],rect=csv(region['rect']),color=region.get('color','#bb55aa'),visible=str(region.get('visible',True)).lower())
    if scene.get('task'):
        ET.SubElement(root,'task',format='rules-json').text=json.dumps(scene['task'],ensure_ascii=False)
    for row in scene['shapes']:
        attrs = dict(type=row['kind'],points=csv(v for p in row['points'] for v in p),
                     width=str(row['width']),stroke=row['stroke'])
        for name in ('fill','dash','guide','lineCap'):
            if row.get(name):
                attrs[name] = str(row[name])
        ET.SubElement(field,'shape',attrs)
    robots = ET.SubElement(root,'robots')
    for r in scene['robots']:
        attrs = dict(id=r['id'],name=r['name'],model=r['model'],start=csv(r['start']),
                     body=str(r['bodySize']),wheelDiameter=str(r['wheelDiameter']),
                     motorType=r['motorType'],wear=str(r.get('wear',0)),motors=csv(r['wheels']),reverse=csv(int(x) for x in r['reversed']))
        if r['model']=='Car':
            attrs['differential']=str(bool(r.get('differential',True))).lower()
        if r.get('program'):
            attrs['program'] = r['program']
        robot = ET.SubElement(robots,'robot',attrs)
        if r.get('claw'):
            claw = r['claw']
            el = ET.SubElement(robot,'claw',kind=claw['kind'],pose=csv((claw['forward'],claw['right'],claw['angle'])))
            if claw['kind'] in ('gripper','kicker'):
                el.set('motor',str(claw['motor']))
            if claw['kind']=='gripper':
                el.set('maxOpening',str(claw.get('maxOpening',50)))
            if claw['kind']=='kicker':
                el.set('initialAngle',str(claw.get('initialAngle',0)))
                length=claw.get('length','short')
                if length not in ('short','medium','long','extraLong'):raise ValueError('Неизвестная длина пиналки.')
                el.set('length',length)
        if r.get('deviceSettings'):
            ET.SubElement(robot,'device-settings').text=json.dumps(validate_settings(r['deviceSettings'],r['sensors']))
        for p,(kind,*pose) in r['sensors'].items():
            el = ET.SubElement(robot,'sensor',port=p,type=kind,pose=csv(pose[:3]))
            if kind in ('light','color','line') and len(pose)>3:
                el.set('height',str(pose[3]))
        memory = ET.SubElement(robot,'memory')
        for i,v in r['cells'].items():
            if v:
                ET.SubElement(memory,'cell',index=i,value=str(v))
    ET.indent(root)
    return ET.tostring(root,encoding='utf-8',xml_declaration=True)

def parse(data):
    if len(data) > LIMIT:
        raise ValueError('XML должен быть не больше 4 МБ.')
    if re.search(r'<!\s*(DOCTYPE|ENTITY)\b',data,re.I):
        raise ValueError('Объявления DTD и сущностей не поддерживаются.')
    root = ET.fromstring(data)
    if root.tag != 'zmrobo-scene':
        return {'polygon':read_world(data)}
    if root.get('version') != '1.0' or root.find('field') is None:
        raise ValueError('Неподдерживаемый формат сцены ZMROBO.')
    field = root.find('field')
    diameter=float(field.get('ballDiameter','6.7'))
    if not math.isfinite(diameter) or not 5.6<=diameter<=6.7:raise ValueError('Некорректный диаметр мяча.')
    scene = {name:[nums(row.attrib['coords'],length) for row in field.findall(tag)]
             for name,tag,length in [('walls','wall',4),('segments','segment',5),('circles','circle',3)]}
    if sum(map(len,scene.values())) > 200:
        raise ValueError('На поле допускается до 200 препятствий.')
    if root.get('realistic','false') not in ('true','false'):
        raise ValueError('Некорректный режим реалистичности.')
    scene['realistic'] = root.get('realistic','false')=='true'
    if root.get('fieldLocked','false') not in ('true','false'):raise ValueError('Некорректная блокировка поля.')
    scene['fieldLocked']=root.get('fieldLocked','false')=='true'
    scene['ballDiameter']=diameter
    scene['regions']=[dict(id=e.attrib['id'],name=e.get('name',e.attrib['id']),kind=e.attrib['kind'],rect=nums(e.attrib['rect'],4),color=e.get('color','#bb55aa'),visible=e.get('visible','true')=='true') for e in field.findall('region')]
    scene['task']=json.loads(root.findtext('task')) if root.find('task') is not None else None
    validate(scene['regions'],scene['task'])
    scene['props'] = []
    prop_ids=[]
    for el in field.findall('prop'):
        kind = el.attrib['kind']
        x,y = nums(el.attrib['coords'],2)
        if kind not in ('can','ball') or max(abs(x),abs(y))>5000:
            raise ValueError('Некорректный подвижный объект.')
        scene['props'].append([x,y,kind])
        prop_ids.append(el.get('id','prop'+str(len(prop_ids)+1)))
    if prop_ids:scene['propIds']=prop_ids
    if len(set(prop_ids))!=len(prop_ids):raise ValueError('Повторяется ID предмета.')
    if len(scene['props'])>64:
        raise ValueError('На поле допускается до 64 подвижных объектов.')
    scene['background'] = field.findtext('image') or ''
    if not re.fullmatch(r'[A-Za-z0-9+/]*={0,2}',scene['background']):
        raise ValueError('Некорректное изображение поля.')
    image = field.find('image')
    if image is not None and 'rect' in image.attrib:
        rect = nums(image.attrib['rect'],4)
        if max(abs(rect[0]),abs(rect[1]))>5000 or not all(1<=d<=4000 for d in rect[2:]):
            raise ValueError('Недопустимый размер или положение изображения поля.')
        scene['backgroundRect'] = rect
    scene['shapes'] = []
    for row in field.findall('shape'):
        kind = row.attrib['type']
        if kind not in ('cubicBezier','line','rectangle','ellipse','stylusLine'):
            raise ValueError('Неизвестная фигура.')
        pts = nums(row.attrib['points'],8 if kind=='cubicBezier' else 4)
        color = row.attrib['stroke']
        fill = row.get('fill')
        if any(not re.fullmatch(r'#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?',c) for c in [color]+([fill] if fill else [])):
            raise ValueError('Некорректный цвет.')
        width, = nums(row.attrib['width'],1)
        if not (0 < width <= 800 or (width==0 and fill and kind in ('rectangle','ellipse'))):
            raise ValueError('Некорректная толщина.')
        if row.get('lineCap','butt') not in ('butt','round','square'):raise ValueError('Неизвестный стык линии.')
        scene['shapes'].append(dict(lineCap=row.get('lineCap','butt'),kind=kind,points=[pts[i:i+2] for i in range(0,len(pts),2)],
            width=width,stroke=color,fill=fill,dash=row.get('dash','solid'),guide=row.get('guide')=='True'))
    if len(scene['shapes']) > 4000:
        raise ValueError('Слишком много фигур.')
    scene['robots'] = []
    seen = set()
    for el in root.findall('robots/robot'):
        a = el.attrib
        key,model = a['id'],a['model']
        if not re.fullmatch(r'[a-zA-Z0-9_-]{1,40}',key) or key in seen or model not in ('E6','M6','E7','Car'):
            raise ValueError('Некорректный идентификатор или модель робота.')
        seen.add(key)
        size, = nums(a['body'],1)
        diameter, = nums(a['wheelDiameter'],1)
        motor_type = a.get('motorType')
        wear, = nums(a.get('wear','0'),1)
        wheels = nums(a['motors'],2,int)
        rev = nums(a['reverse'],2,int)
        start = nums(a['start'],3)
        if (not 0<=wear<=100 or motor_type not in ('standard','sport') or not 10 <= size <= 70 or not 20 <= diameter <= 200 or not all(1 <= p <= (8 if model=='E7' else 4) for p in wheels)
            or wheels[0]==wheels[1] or not all(x in (0,1) for x in rev) or abs(start[2])>360
            or any(abs(x)>5000 for x in start[:2])):
            raise ValueError('Некорректные настройки робота.')
        claw = None
        item = el.find('claw')
        if item is not None:
            f,r,angle = nums(item.attrib['pose'],3)
            kind = item.attrib['kind']
            if kind not in ('small','large','narrow','straight','gripper','kicker') or max(abs(f),abs(r))>100 or abs(angle)>180:
                raise ValueError('Некорректное крепление клешни.')
            claw = dict(kind=kind,forward=f,right=r,angle=angle)
            if kind in ('gripper','kicker'):
                motor = int(item.attrib['motor'])
                if not 1<=motor<=(8 if model=='E7' else 4) or motor in wheels:
                    raise ValueError('У механизма должен быть свободный моторный порт.')
                claw['motor'] = motor
            if kind=='gripper':
                opening=float(item.get('maxOpening','50'))
                if not math.isfinite(opening) or not 0<=opening<=180:
                    raise ValueError('Максимальное раскрытие захвата должно быть от 0° до 180°.')
                claw['maxOpening']=opening
            if kind=='kicker':
                initial=float(item.get('initialAngle','0'))
                if not math.isfinite(initial) or not 0<=initial<=360:
                    raise ValueError('Начальный угол пиналки должен быть от 0° до 360°.')
                claw['initialAngle']=initial
                claw['length']=item.get('length','short')
                if claw['length'] not in ('short','medium','long','extraLong'):raise ValueError('Неизвестная длина пиналки.')
        if model=='Car' and a.get('differential','true') not in ('true','false'):
            raise ValueError('Некорректный режим дифференциала.')
        sensors,cells = {},{}
        for sensor in el.findall('sensor'):
            p = int(sensor.attrib['port'])
            f,r,angle = nums(sensor.attrib['pose'],3)
            kind = sensor.attrib['type']
            if not 1<=p<=8 or max(abs(f),abs(r))>100 or abs(angle)>360 or kind not in ('light','color','laser','sonar','led','touch','ir','gyro','line','eye'):
                raise ValueError('Некорректные настройки датчика.')
            sensors[str(p)] = [kind,f,r,angle]
            if kind in ('light','color','line') and 'height' in sensor.attrib:
                height = int(sensor.attrib['height'])
                if not 1<=height<=5:
                    raise ValueError('Высота датчика должна быть от 1 до 5 см.')
                sensors[str(p)].append(height)
        for cell in el.findall('memory/cell'):
            i,v = int(cell.attrib['index']),int(cell.attrib['value'])
            if not 1<=i<=128 or not 0<=v<=4095:
                raise ValueError('Некорректная ячейка памяти.')
            cells[str(i)] = v
        scene['robots'].append(dict(id=key,name=a.get('name','Робот')[:80],model=model,bodySize=size,wheelDiameter=diameter,
            wear=wear,claw=claw,motorType=motor_type,wheels=wheels,reversed=list(map(bool,rev)),start=start,sensors=sensors,cells=cells,deviceSettings=validate_settings(json.loads(el.findtext('device-settings') or '{}'),sensors),program=a.get('program','')))
        if model=='Car':
            scene['robots'][-1]['differential']=a.get('differential','true')=='true'
    if not 1 <= len(seen) <= 8:
        raise ValueError('На поле должно быть от 1 до 8 роботов.')
    return {'scene':scene}

if __name__ == '__main__':
    try:
        data = sys.stdin.buffer.read(LIMIT+1).decode('utf-8-sig')
        if len(data)>LIMIT:
            raise ValueError('Файл сцены слишком большой.')
        if len(sys.argv)>1 and sys.argv[1]=='save':
            result=serialize(json.loads(data))
            parse(result.decode('utf-8'))
            sys.stdout.buffer.write(result)
        else:
            print(json.dumps(parse(data)))
    except (ValueError,KeyError,TypeError,ET.ParseError) as exc:
        sys.stderr.buffer.write(str(exc).encode('utf8'))
        sys.exit(1)
