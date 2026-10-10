#!/usr/bin/env python3
"""
Corrige la direction de chaque parti dans data/partis.json.

    python3 scripts/appliquer-dirigeants.py

Deux défauts à réparer :

1. L'intitulé était « Président » pour tout le monde, parce que le script
   Wikidata écrivait cette constante. Or Olivier Faure est premier secrétaire,
   Marine Tondelier secrétaire nationale, Nathalie Arthaud porte-parole.
   L'intitulé est désormais relevé, et `null` quand il n'est pas établi - le
   site affiche alors « Direction », sans supposer un titre.

2. Wikidata donnait pour Génération écologie Yves Piétrasanta, mort le
   28 mai 2022, sans date de fin sur la revendication. Vérifier la date de fin
   ne suffisait donc pas : on vérifie aussi que la personne est vivante.

Deux origines pour un intitulé, par ordre de préférence :
  - le site du parti (`url` dans scripts/dirigeants.json) ;
  - la fonction déjà sourcée dans la fiche d'un candidat du site
    (`depuis_candidat`), qui porte sa propre source.
"""

import io
import json
import sys
import urllib.request


def api(url):
    requete = urllib.request.Request(
        url, headers={'User-Agent': 'presidentielle-2027/1.0 (https://github.com/Romain03)'})
    return json.loads(urllib.request.urlopen(requete, timeout=30).read().decode('utf-8'))


def est_decede(qid):
    """Wikidata laisse des dirigeants morts sans date de fin de mandat."""
    entites = api(
        'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
        f'&props=claims&ids={qid}').get('entities', {})
    return bool(entites.get(qid, {}).get('claims', {}).get('P570'))


def main():
    partis = json.load(io.open('data/partis.json', encoding='utf-8'))
    candidats = json.load(io.open('data/candidats.json', encoding='utf-8'))
    table = json.load(io.open('scripts/dirigeants.json', encoding='utf-8'))
    par_id = {c['id']: c for c in candidats}

    inconnus = set(table) - {p['id'] for p in partis}
    if inconnus:
        raise SystemExit(f'identifiants inconnus : {sorted(inconnus)}')

    corriges = neutralises = 0
    for parti in partis:
        entree = table.get(parti['id'])

        if entree is None:
            dirigeant = parti.get('dirigeant')
            if dirigeant is None:
                continue
            # Hérité de Wikidata : on n'affirme plus l'intitulé, et on écarte
            # la personne si elle est morte.
            qid = dirigeant['source']['url'].rsplit('/', 1)[-1]
            try:
                personnes = api(
                    'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
                    f'&props=claims&ids={qid}')['entities'][qid]['claims'].get('P488', [])
                cible = ((personnes[0]['mainsnak'].get('datavalue') or {}).get('value') or {}).get('id') if personnes else None
            except Exception as erreur:
                print(f"  !  {parti['nom']} : {erreur}")
                cible = None
            if cible and est_decede(cible):
                print(f"  ✕  {parti['nom']:<34} {dirigeant['nom']} est décédé : retiré")
                parti['dirigeant'] = None
                continue
            dirigeant['fonction'] = None
            neutralises += 1
            print(f"  ~  {parti['nom']:<34} {dirigeant['nom']} (intitulé non établi)")
            continue

        if 'depuis_candidat' in entree:
            candidat = par_id[entree['depuis_candidat']]
            situation = (candidat.get('biographie') or {}).get('situation')
            if situation is None:
                raise SystemExit(f"{entree['depuis_candidat']} n'a pas de situation sourcée")
            nom = f"{candidat['prenom']} {candidat['nom']}"
            source = situation['source']
        else:
            nom = entree['nom']
            source = {
                'url': entree['url'],
                'titre': entree['titre'],
                'type': entree.get('type', 'site-de-parti'),
                'date': entree.get('date', '2026-10-10'),
            }

        parti['dirigeant'] = {'nom': nom, 'fonction': entree['fonction'], 'source': source}
        corriges += 1
        print(f"  ok {parti['nom']:<34} {entree['fonction']} : {nom}")

    io.open('data/partis.json', 'w', encoding='utf-8').write(
        json.dumps(partis, ensure_ascii=False, indent=2) + '\n')
    print(f'\n  {corriges} intitulés sourcés, {neutralises} laissés sans intitulé')


if __name__ == '__main__':
    main()
