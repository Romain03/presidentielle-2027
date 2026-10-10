#!/usr/bin/env python3
"""
Écrit dans data/partis.json ce que chaque parti dit de lui-même.

    python3 scripts/appliquer-positionnements.py

Le texte vient de scripts/positionnements.json, relevé à la main sur le site
officiel de chaque formation : page « Qui sommes-nous », manifeste, charte ou
statuts. Il n'est jamais reformulé - seulement raccourci, et toujours par
suppression de phrases entières.

Pourquoi à la main plutôt qu'automatiquement : il n'existe pas de page
normalisée où lire cela. Chaque site place sa présentation ailleurs, et la
plupart des pages d'accueil sont des fils d'actualité. Un script qui
devinerait la bonne phrase se tromperait souvent, et se tromper ici revient
à faire dire à un parti ce qu'il n'a pas dit.

Ce que le site ne reprend toujours pas : les caractérisations par des tiers.
Ni l'« idéologie » de Wikidata, ni les étiquettes de la presse. Un parti est
ici décrit par ses mots, ou pas décrit du tout.
"""

import io
import json
import time

# Les pages de présentation ne portent pas de date de publication. On
# enregistre donc la date de consultation, comme pour Wikidata, et
# DONNEES_A_VERIFIER.md le signale.
CONSULTATION = time.strftime('%Y-%m-%d')


def main():
    partis = json.load(io.open('data/partis.json', encoding='utf-8'))
    textes = json.load(io.open('scripts/positionnements.json', encoding='utf-8'))

    inconnus = set(textes) - {p['id'] for p in partis}
    if inconnus:
        raise SystemExit(f'identifiants inconnus dans positionnements.json : {sorted(inconnus)}')

    remplis = vides = 0
    for parti in partis:
        entree = textes.get(parti['id'])
        if entree is None:
            parti['positionnement_declare'] = None
            vides += 1
            print(f"  -  {parti['nom']:<36} aucune formulation relevée")
            continue
        parti['positionnement_declare'] = {
            'texte': entree['texte'],
            'source': {
                'url': entree['url'],
                'titre': entree['titre'],
                'type': entree.get('type', 'site-de-parti'),
                'date': entree.get('date', CONSULTATION),
            },
        }
        remplis += 1
        print(f"  ok {parti['nom']:<36} {len(entree['texte']):3} caractères")

    io.open('data/partis.json', 'w', encoding='utf-8').write(
        json.dumps(partis, ensure_ascii=False, indent=2) + '\n')
    print(f'\n  {remplis} partis décrits par leurs mots, {vides} sans formulation trouvée')


if __name__ == '__main__':
    main()
