import os, yaml, sys
from cursesmenu import *
from cursesmenu.items import *

lambdas = {}

def read_templates(paths):
    for path in paths:
        for f in os.listdir(path):
            joined_path = os.path.join(path, f)
            if os.path.isdir(joined_path) and os.path.isfile(os.path.join(joined_path, 'template.yaml')):
                lambdas[joined_path] = read_lambdas(joined_path)

def read_lambdas(dir):
    dir_lambdas = []
    with open('{}/template.yaml'.format(dir)) as f:
        cf = yaml.safe_load(f)
        for key, value in cf['Resources'].items():
            if value['Type'] == 'AWS::Lambda::Function' and 'LogRetention' not in key :
                dir_lambdas.append(key)
    return dir_lambdas

read_templates(['marine', 'road'])

menu = CursesMenu("Run a Lambda with SAM")

for key, value in lambdas.items():
    for lambda_name in value:
        menu.append_item(CommandItem(key + ' - ' + lambda_name,  'cd {}; sam local invoke {} -d 9999; cd ..'.format(key, lambda_name), should_exit=True))

menu.show()