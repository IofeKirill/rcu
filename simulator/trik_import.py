"""Read the geometric part of a TRIK Studio world; never execute its rules."""
import json
import math
import re
import sys
import xml.etree.ElementTree as ET

def read_world(data):
    if len(data) > 2_000_000:
        raise ValueError('XML должен быть не больше 2 МБ.')
    if re.search(r'<!\s*(DOCTYPE|ENTITY)\b', data, re.I):
        raise ValueError('XML с объявлениями DTD или сущностей не поддерживается.')
    root = ET.fromstring(data)
    world = root.find('world')
    if root.tag != 'root' or world is None:
        raise ValueError('Это не XML модели мира TRIK Studio.')
    bounds, shapes, segments, circles = [], [], [], []
    skipped = set()

    def num(raw):
        value = float(raw)
        if not math.isfinite(value) or abs(value) > 1e6:
            raise ValueError('Координаты TRIK вне допустимого диапазона.')
        return value

    def point(raw):
        x, y = (num(part) for part in raw.split(':'))
        bounds.append((x, y))
        return (x, y)

    def xy(element, x='x', y='y'):
        return point(element.attrib[x] + ':' + element.attrib[y])

    def color(raw):
        if re.fullmatch(r'#[0-9a-fA-F]{8}', raw):  # Qt uses #AARRGGBB.
            return '#' + raw[3:] + raw[1:3]
        return raw if re.fullmatch(r'#[0-9a-fA-F]{6}',raw) else '#000000'

    for item in world.findall('walls/wall'):
        a, b = point(item.attrib['begin']), point(item.attrib['end'])
        if a != b:
            segments.append([*a,*b,max(1,num(item.get('width','5')))])
    for group,tag,radius in (('skittles','skittle',10),('balls','ball',10)):
        for item in world.findall(f'{group}/{tag}'):
            x,y = xy(item)
            r = max(1,num(item.get('radius',str(radius))))
            bounds.extend([(x-r,y-r),(x+r,y+r)])
            circles.append([x,y,r])

    def paint(item, style=None):
        tag = item.tag
        if tag == 'stylus':
            for child in item:
                paint(child,item)
            return
        if tag not in ('line','rectangle','ellipse','cubicBezier','stylusLine'):
            skipped.add('часть рисунков')
            return
        style = item if style is None else style
        def prop(name,default):
            return item.get(name,style.get(name,default))
        points = [point(item.attrib['begin']),point(item.attrib['end'])]
        if tag == 'cubicBezier':
            points.extend(point(item.attrib[k]) for k in ('cp1','cp2'))
        shapes.append(dict(kind=tag,points=points,stroke=color(prop('stroke','#000000')),
            fill=color(prop('fill','#000000')) if prop('fill-style','none')=='solid' else None,
            width=max(0.1,num(prop('stroke-width','1'))),dash=prop('stroke-style','solid')))

    for item in world.findall('colorFields/*'):
        paint(item)
    for region in world.findall('regions/region'):
        if region.get('visible','true') != 'true':
            continue
        a=xy(region)
        b=point(f"{a[0]+num(region.attrib['width'])}:{a[1]+num(region.attrib['height'])}")
        kind=region.get('type','rectangle')
        if kind in ('rectangle','ellipse'):
            ink=color(region.get('color','#000000'))
            shapes.append(dict(kind=kind,points=[a,b],stroke=ink,fill=None,width=1,dash='dash',guide=True))
    robot = world.find('robot')
    if robot is None:
        robot = root.find('robots/robot')
    marker = robot.find('startPosition') if robot is not None else None
    if marker is not None:
        start, angle = xy(marker), num(marker.get('direction','0'))
    elif robot is not None and robot.get('position'):
        x,y = point(robot.attrib['position'])
        start,angle = (x+25,y+25),num(robot.get('direction','0'))
    else:
        start,angle = (0,0),0
    bounds.append(start)
    if world.findall('images/*'):
        skipped.add('фоновые изображения')
    if root.find('constraints') is not None or world.find('constraints') is not None:
        skipped.add('проверка задания')
    if len(segments)+len(circles)>200 or len(shapes)>4000:
        raise ValueError('Поле содержит слишком много объектов.')
    lo_x, hi_x = min(p[0] for p in bounds),max(p[0] for p in bounds)
    lo_y, hi_y = min(p[1] for p in bounds),max(p[1] for p in bounds)
    scale=min(.35, 704/max(1,hi_x-lo_x), 404/max(1,hi_y-lo_y))
    cx,cy=(lo_x+hi_x)/2,(lo_y+hi_y)/2
    def map_point(p):
        return [400+(p[0]-cx)*scale,250+(p[1]-cy)*scale]
    for shape in shapes:
        shape['points'] = [map_point(p) for p in shape['points']]
        shape['width'] *= scale
    return dict(start=[*map_point(start),(angle+180)%360-180], shapes=shapes,
        segments=[[*map_point((x,y)),*map_point((xx,yy)),max(1,w*scale)] for x,y,xx,yy,w in segments],
        circles=[[*map_point((x,y)),max(1,r*scale)] for x,y,r in circles],
        reduced=scale < .35, skipped=sorted(skipped))

if __name__=='__main__':
    try:
        print(json.dumps(read_world(sys.stdin.buffer.read(2_000_001).decode('utf-8-sig')),ensure_ascii=True))
    except (ValueError, KeyError, ET.ParseError) as error:
        print(json.dumps({'error': str(error)},ensure_ascii=True))
        sys.exit(1)
