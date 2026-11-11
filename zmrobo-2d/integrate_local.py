"""Enable the simulator in a local ZMROBO checkout without changing its version."""
import argparse
import json
from pathlib import Path
import shutil

MAIN = './simulator/integrated-host.js'
COMMAND = 'zmrobo2d.open'
FILES = ('task_rules.py','media/task-editor.js','media/big-travel.json','polygons/BigTravel.xml','car_model.py','mechanisms.py','extension.js','engine.py','runner.py','polygon_import.py','scene_xml.py','multi_runner.py','robot_worker.py','integrated-host.js',
         'media/beam-straight.png','media/beam-angle.png','media/claw-straight.png','media/claws.json','media/claw-small.png','media/claw-large.png','media/claw-narrow.png','media/index.html','media/view.js','media/view.css','media/robot-e6-standard.png','media/robot-car.png','media/robot-e6.png','media/robot-m6.png','media/device-laser.png','media/device-sonar.png','media/device-light.png','media/device-led.png','examples/bluetooth-first.py','examples/bluetooth-second.py','examples/car.py','examples/car-rally.py','examples/kicker-full-turn.py','examples/gripper.py','examples/kicker.py','examples/line.py','examples/line-light.py','examples/wall.py')
HERE = Path(__file__).resolve().parent

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project',type=Path,help='folder of the main extension with package.json')
    parser.add_argument('--undo',action='store_true')
    args=parser.parse_args()
    root=args.project.resolve()
    manifest=root/'package.json'
    package=json.loads(manifest.read_text(encoding='utf-8-sig'))
    if package.get('name') != 'rcu-extension' or str(package.get('publisher','')).lower()!='iofekirill':
        parser.error('Укажи папку основного расширения IofeKirill.rcu-extension.')
    target=root/'simulator'
    marker=target/'.zmrobo2d-local'
    original=package.get('zmrobo2dOriginalMain')
    if args.undo:
        if not marker.is_file() or package.get('main')!=MAIN or not original:
            parser.error('Локальное подключение симулятора не найдено.')
        package['main']=package.pop('zmrobo2dOriginalMain')
        package['activationEvents']=[x for x in package.get('activationEvents',[]) if x!='onCommand:'+COMMAND]
        contributes=package['contributes']
        contributes['commands']=[x for x in contributes['commands'] if x.get('command')!=COMMAND]
        for location in ('editor/title','view/title'):
            if location in contributes['menus']:
                contributes['menus'][location]=[x for x in contributes['menus'][location] if x.get('command')!=COMMAND]
        settings=contributes.get('configuration',[])
        if isinstance(settings,dict):
            settings=[settings]
        contributes['configuration']=[x for x in settings if x.get('id')!='zmrobo2d-local']
        # Keep the backup and local examples; no source files are deleted.
    else:
        if target.exists() and not marker.is_file():
            parser.error('В проекте уже есть папка simulator. Подключение ничего не изменило.')
        entry=original if package.get('main')==MAIN else package.get('main')
        if not isinstance(entry,str) or not entry or entry==MAIN:
            parser.error('Не удалось определить точку запуска расширения.')
        if not marker.is_file() and (root/'package.json.before-zmrobo2d').exists():
            parser.error('Уже есть резервная копия package.json.before-zmrobo2d.')
        simulator=json.loads((HERE/'package.json').read_text(encoding='utf8'))['contributes']
        contributes=package.setdefault('contributes',{})
        commands=contributes.setdefault('commands',[])
        menus=contributes.setdefault('menus',{}).setdefault('editor/title',[])
        settings=contributes.get('configuration',[])
        if isinstance(settings,dict):
            settings=[settings]
        if not marker.is_file() and (any(x.get('command')==COMMAND for x in commands+menus) or
                                    any('zmrobo2d.pythonPath' in x.get('properties',{}) for x in settings)):
            parser.error('В расширении уже есть команда или настройки ZMROBO 2D.')
        package['main']=MAIN
        package['zmrobo2dOriginalMain']=entry
        events=package.setdefault('activationEvents',[])
        if 'onCommand:'+COMMAND not in events:
            events.append('onCommand:'+COMMAND)
        contributes['commands']=[x for x in commands if x.get('command')!=COMMAND]+simulator['commands']
        contributes['menus']['editor/title']=[x for x in menus if x.get('command')!=COMMAND]
        titles=contributes['menus'].get('view/title',[])
        contributes['menus']['view/title']=[x for x in titles if x.get('command')!=COMMAND]
        contributes['configuration']=[x for x in settings if x.get('id')!='zmrobo2d-local']+[
            dict(simulator['configuration'],id='zmrobo2d-local')]
        if not marker.is_file():
            shutil.copyfile(manifest,root/'package.json.before-zmrobo2d')
        for name in FILES:
            dest=target/name
            dest.parent.mkdir(parents=True,exist_ok=True)
            if not dest.exists() or not name.startswith('examples/'):
                shutil.copyfile(HERE/name,dest)
        marker.touch()
    temp=manifest.with_suffix('.zmrobo2d.tmp')
    temp.write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    temp.replace(manifest)
    print('Локальный симулятор отключён.' if args.undo else 'Локальный симулятор подключён. Открой проект основного расширения и запусти тестовое окно.')

if __name__=='__main__':
    main()
