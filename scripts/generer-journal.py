#!/usr/bin/env python3
"""
Construit data/journal.json à partir de l'historique Git des données.

    python3 scripts/generer-journal.py

Le lecteur d'un site politique doit pouvoir savoir ce qui a changé, et quand.
Le journal n'est pas écrit à la main : il est dérivé des commits qui touchent
`data/`, ce qui le rend impossible à oublier et vérifiable ligne par ligne
dans le dépôt public.

Le résumé de chaque entrée est **calculé sur le contenu des fichiers**, et non
repris du message de commit. Un message de commit est écrit pour un
développeur : il est sans accents, il emploie le jargon du dépôt (« roster »,
« pile serif »), et il parle parfois d'affichage alors que le journal ne doit
parler que des données. Compter les entités ajoutées, modifiées et retirées
donne une phrase lisible, exacte, et qui ne dépend pas de la prose de celui qui
a validé le commit.
"""

import io
import json
import re
import subprocess

FORMAT = '%H%x1f%ad'

# Fichiers décrits au lecteur, avec le nom de ce qu'ils contiennent.
ENTITES = {
    'propositions.json': ('proposition', 'propositions'),
    'candidats.json': ('candidature', 'candidatures'),
    'partis.json': ('parti', 'partis'),
    'themes.json': ('thème', 'thèmes'),
    'questions.json': ('question', 'questions'),
    'calendrier.json': ('étape du calendrier', 'étapes du calendrier'),
}

# Dérivé des autres : le mentionner reviendrait à journaliser le journal.
IGNORES = {'journal.json'}


def git(*args, verifier=True):
    r = subprocess.run(['git', *args], capture_output=True, text=True)
    if verifier and r.returncode != 0:
        raise RuntimeError(r.stderr.strip())
    return r.stdout


def charger(empreinte, chemin):
    """Les entités d'un fichier de données à un commit donné, par identifiant.

    Renvoie None quand le fichier n'existe pas encore à ce commit, ce qui
    distingue « rien ajouté » de « tout ajouté ».
    """
    brut = git('show', f'{empreinte}:{chemin}', verifier=False)
    if not brut.strip():
        return None
    try:
        donnees = json.loads(brut)
    except json.JSONDecodeError:
        return None
    if not isinstance(donnees, list):
        return None
    return {e['id']: json.dumps(e, sort_keys=True, ensure_ascii=False)
            for e in donnees if isinstance(e, dict) and 'id' in e}


def accorder(nombre, singulier, pluriel, participe):
    nom = singulier if nombre == 1 else pluriel
    accord = participe if nombre == 1 else participe + 's'
    return f'{nombre} {nom} {accord}'


def decrire(avant, apres, singulier, pluriel):
    """Les mouvements d'un fichier entre deux commits, en français."""
    if avant is None:
        return [f'{len(apres)} {pluriel if len(apres) > 1 else singulier} au départ']
    ajoutes = [i for i in apres if i not in avant]
    retires = [i for i in avant if i not in apres]
    modifies = [i for i in apres if i in avant and avant[i] != apres[i]]
    morceaux = []
    if ajoutes:
        morceaux.append(accorder(len(ajoutes), singulier, pluriel, 'ajoutée'
                                 if singulier in ('proposition', 'candidature', 'question')
                                 else 'ajouté'))
    if modifies:
        morceaux.append(accorder(len(modifies), singulier, pluriel, 'modifiée'
                                 if singulier in ('proposition', 'candidature', 'question')
                                 else 'modifié'))
    if retires:
        morceaux.append(accorder(len(retires), singulier, pluriel, 'retirée'
                                 if singulier in ('proposition', 'candidature', 'question')
                                 else 'retiré'))
    return morceaux


def main():
    brut = git('log', '--date=short', '--reverse', f'--pretty=%x1e{FORMAT}',
               '--name-only', '--', 'data/')
    entrees = []
    for bloc in brut.split('\x1e'):
        lignes = [l for l in bloc.split('\n') if l.strip()]
        if not lignes or '\x1f' not in lignes[0]:
            continue
        empreinte, date = lignes[0].split('\x1f')
        fichiers = sorted({re.sub(r'^data/', '', f) for f in lignes[1:]
                           if f.startswith('data/')} - IGNORES)
        if not fichiers:
            continue

        morceaux = []
        for fichier in fichiers:
            if fichier not in ENTITES:
                continue
            singulier, pluriel = ENTITES[fichier]
            avant = charger(f'{empreinte}~1', f'data/{fichier}')
            apres = charger(empreinte, f'data/{fichier}')
            if apres is None:
                morceaux.append(f'{pluriel} retirés du dépôt')
                continue
            morceaux.extend(decrire(avant, apres, singulier, pluriel))

        # Un commit peut toucher un fichier de données sans en changer le
        # contenu : reformatage, tri. Le dire plutôt que de l'inventer.
        resume = ' · '.join(morceaux) if morceaux else 'Mise en forme des données, sans changement de contenu'
        entrees.append({
            'date': date,
            'resume': resume[0].upper() + resume[1:],
            'fichiers': fichiers,
            'commit': empreinte[:10],
        })

    entrees.reverse()
    io.open('data/journal.json', 'w', encoding='utf-8').write(
        json.dumps(entrees, ensure_ascii=False, indent=2) + '\n')
    print(f'  {len(entrees)} entrées de journal écrites')


if __name__ == '__main__':
    main()
