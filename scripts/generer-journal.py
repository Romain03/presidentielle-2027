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
    'documents.json': ('document de programme', 'documents de programme'),
}

# Accord du participe, par fichier. Le déduire du mot était source d'erreurs :
# « document » est masculin, « étape » féminin, et la liste ci-dessus mélange
# les deux.
FEMININS = {'proposition', 'candidature', 'question', 'étape du calendrier'}

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
    return {e['id']: e for e in donnees if isinstance(e, dict) and 'id' in e}


def empreinte_entite(entite):
    return json.dumps(entite, sort_keys=True, ensure_ascii=False)


def libelles_statut():
    """Les libellés de statut, lus dans lib/schemas.ts.

    Les recopier ici les aurait figés : « Investi par son parti » a été corrigé
    en « Candidature investie » parce qu'il était faux pour Raphaël Glucksmann,
    désigné par une primaire de trois partis. Le journal doit suivre.
    """
    source = io.open('lib/schemas.ts', encoding='utf-8').read()
    bloc = re.search(r'LIBELLES_STATUT[^{]*\{(.*?)\n\};', source, re.S)
    if not bloc:
        return {}
    return dict(re.findall(r"(\w+):\s*'([^']+)'", bloc.group(1)))


STATUTS = libelles_statut()


def nom(entite):
    """Nom lisible d'une entité, quel que soit le fichier."""
    if 'prenom' in entite and 'nom' in entite:
        return f"{entite['prenom']} {entite['nom']}"
    return entite.get('nom') or entite.get('titre') or entite.get('libelle') or entite['id']


def faits_saillants(avant, apres, fichier, candidats):
    """Les changements qui méritent une phrase, et non un décompte.

    « 15 candidatures modifiées » n'apprend rien, et l'investiture de Raphaël
    Glucksmann disparaissait dans ce total alors que c'est l'événement le plus
    important de la semaine. Un changement de statut est donc nommé, toujours ;
    les ajouts le sont quand ils sont assez peu nombreux pour tenir en une
    ligne.
    """
    if avant is None:
        return []
    faits = []

    if fichier == 'candidats.json':
        for id_, apr in apres.items():
            av = avant.get(id_)
            if av is None:
                faits.append(f'entrée de {nom(apr)}')
            elif av.get('statut') != apr.get('statut'):
                depuis = STATUTS.get(av.get('statut', ''), av.get('statut', ''))
                vers = STATUTS.get(apr.get('statut', ''), apr.get('statut', ''))
                faits.append(f'{nom(apr)} passe de « {depuis} » à « {vers} »')

        # « 15 candidatures modifiées » désignait en réalité quinze fiches qui
        # venaient de recevoir leur site officiel. L'ampleur sans la teneur
        # n'apprend rien ; l'agrégat la donne sans allonger la ligne.
        liens = sum(
            1
            for id_, apr in apres.items()
            if id_ in avant
            and len(apr.get('liens_officiels', [])) > len(avant[id_].get('liens_officiels', []))
        )
        if liens > 0:
            faits.append(
                f"{liens} {'fiche reçoit' if liens == 1 else 'fiches reçoivent'} un lien officiel"
            )

    elif fichier in ('propositions.json', 'documents.json'):
        ajoutes = [a for i, a in apres.items() if i not in avant]
        # Au-delà de quatre, nommer chacun donnerait une phrase illisible : le
        # décompte reste, et c'est lui qui est juste.
        if fichier == 'propositions.json':
            sourcees = sum(
                1
                for id_, apr in apres.items()
                if id_ in avant
                and len(apr.get('sources', [])) > len(avant[id_].get('sources', []))
            )
            if sourcees > 0:
                faits.append(
                    f"{sourcees} {'position gagne' if sourcees == 1 else 'positions gagnent'}"
                    ' une source'
                )
        if 1 <= len(ajoutes) <= 4:
            for entite in ajoutes:
                qui = candidats.get(entite.get('candidat_id'), {})
                libelle = nom(qui) if qui else entite.get('candidat_id', '')
                if fichier == 'propositions.json':
                    faits.append(f"position de {libelle} sur « {entite.get('theme_id', '')} »")
                else:
                    faits.append(f"{entite.get('titre', '')} ({libelle})")

    return faits


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
    modifies = [i for i in apres
                if i in avant and empreinte_entite(avant[i]) != empreinte_entite(apres[i])]
    morceaux = []
    e = 'e' if singulier in FEMININS else ''
    if ajoutes:
        morceaux.append(accorder(len(ajoutes), singulier, pluriel, 'ajouté' + e))
    if modifies:
        morceaux.append(accorder(len(modifies), singulier, pluriel, 'modifié' + e))
    if retires:
        morceaux.append(accorder(len(retires), singulier, pluriel, 'retiré' + e))
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

        # Les candidatures du commit servent à nommer qui porte une position
        # ou un document ajouté.
        candidats = charger(empreinte, 'data/candidats.json') or {}

        morceaux = []
        faits = []
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
            faits.extend(faits_saillants(avant, apres, fichier, candidats))

        # Un commit peut toucher un fichier de données sans en changer le
        # contenu : reformatage, tri. Le dire plutôt que de l'inventer.
        resume = ' · '.join(morceaux) if morceaux else 'Mise en forme des données, sans changement de contenu'
        resume = resume[0].upper() + resume[1:]
        # Le décompte dit l'ampleur, les faits disent la teneur. Les deux, dans
        # cet ordre : « 15 candidatures modifiées » reste vrai, mais ce que le
        # lecteur retient est l'investiture qu'il contenait.
        if faits:
            resume += ' — ' + ' ; '.join(faits[:4])
            if len(faits) > 4:
                reste = len(faits) - 4
                resume += f" ; et {reste} {'autre' if reste == 1 else 'autres'}"
        entrees.append({
            'date': date,
            'resume': resume,
            'fichiers': fichiers,
            'commit': empreinte[:10],
        })

    entrees.reverse()
    io.open('data/journal.json', 'w', encoding='utf-8').write(
        json.dumps(entrees, ensure_ascii=False, indent=2) + '\n')
    print(f'  {len(entrees)} entrées de journal écrites')


if __name__ == '__main__':
    main()
