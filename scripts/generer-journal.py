#!/usr/bin/env python3
"""
Construit data/journal.json à partir de l'historique Git des données.

    python3 scripts/generer-journal.py

Le lecteur d'un site politique doit pouvoir savoir ce qui a changé, et quand.
Le journal n'est pas écrit à la main : il est dérivé des commits qui touchent
`data/`, ce qui le rend impossible à oublier et vérifiable ligne par ligne
dans le dépôt public.

Ne sont retenus que les commits modifiant réellement un fichier de données :
une refonte d'affichage n'a pas sa place dans un journal des données.
"""

import io
import json
import re
import subprocess

FORMAT = '%H%x1f%ad%x1f%s'


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True, check=True).stdout


def main():
    # Un sujet de commit peut tenir sur plusieurs lignes : on repère les
    # en-têtes à leur séparateur plutôt qu'en découpant sur les lignes vides.
    brut = git('log', '--date=short', f'--pretty=%x1e{FORMAT}', '--name-only', '--', 'data/')
    entrees = []
    for bloc in brut.split('\x1e'):
        lignes = [l for l in bloc.split('\n') if l.strip()]
        if not lignes or '\x1f' not in lignes[0]:
            continue
        empreinte, date, sujet = lignes[0].split('\x1f')
        fichiers = sorted({re.sub(r'^data/', '', f) for f in lignes[1:] if f.startswith('data/')})
        if not fichiers:
            continue
        entrees.append({
            'date': date,
            'resume': sujet.split('\n')[0],
            'fichiers': fichiers,
            'commit': empreinte[:10],
        })

    io.open('data/journal.json', 'w', encoding='utf-8').write(
        json.dumps(entrees, ensure_ascii=False, indent=2) + '\n')
    print(f'  {len(entrees)} entrées de journal écrites')


if __name__ == '__main__':
    main()
