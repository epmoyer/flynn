#!/usr/bin/env python

import glob
import os
import pprint
import subprocess
from colorama import init, Fore
init(autoreset=True)

pp = pprint.PrettyPrinter(indent=4)

def main():
    os.chdir(os.path.join('js', 'lib', 'flynn'))
    filenames = glob.glob('flynn[A-Z,0-9]*.js')

    # Sort and them move flynnMain first
    filenames.sort()
    for filename in filenames:
        if 'flynnMain.js' in filename:
            filenames.remove(filename)
            filenames.insert(0, filename)
            break

    #---------------------------
    # Build flynn.min.js
    #---------------------------
    print('Found files:')
    print(Fore.YELLOW + pp.pformat(filenames))
    uglify(filenames, 'flynn.min.js')

    #---------------------------
    # Build flynn.core.min.js
    #---------------------------
    not_core_filenames = ['flynnPhysics.js']
    dropped_filenames = [filename for filename in filenames if filename in not_core_filenames]
    core_filenames = [filename for filename in filenames if filename not in dropped_filenames]
    print('The following files will be removed from the core build:')
    print(Fore.YELLOW + pp.pformat(dropped_filenames))
    uglify(core_filenames, 'flynn.core.min.js')

def uglify(filenames, out_filename):
    command = 'uglifyjs'
    for filename in filenames:
        command += ' ' + filename
    command += f' -o {out_filename} --source-map -c -m'
    print(f'Building "{out_filename}"...')
    print(Fore.GREEN + command)
    subprocess.run(command, shell=True)

if __name__ == "__main__":
    main()
