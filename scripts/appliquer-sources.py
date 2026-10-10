#!/usr/bin/env python3
"""
Ajoute ou promeut des sources dans data/propositions.json.

    python3 scripts/appliquer-sources.py

Chaque entrée de scripts/sources-complementaires.json a été ajoutée après
lecture de l'article et vérification qu'il porte bien le contenu de la
proposition. Une source n'est jamais substituée à une autre sans avoir été
lue : échanger une URL contre une autre sans la vérifier reviendrait à
inventer la provenance d'une information.

`principale` place la source en tête de liste ; les `ajouts` viennent ensuite.
La source d'origine n'est pas retirée : elle porte souvent un détail que la
nouvelle ne donne pas, et savoir qui a rapporté quoi fait partie de ce que le
lecteur doit pouvoir juger.
"""

import io
import json


def main():
    table = json.load(io.open('scripts/sources-complementaires.json', encoding='utf-8'))
    catalogue = table['sources']
    consignes = table['propositions']
    propositions = json.load(io.open('data/propositions.json', encoding='utf-8'))
    par_id = {p['id']: p for p in propositions}

    inconnues = set(consignes) - set(par_id)
    if inconnues:
        raise SystemExit(f'propositions inconnues : {sorted(inconnues)}')

    for identifiant, consigne in consignes.items():
        proposition = par_id[identifiant]
        deja = {s['url'] for s in proposition['sources']}
        ajoutees = 0

        for cle in consigne.get('ajouts', []):
            source = catalogue[cle]
            if source['url'] not in deja:
                proposition['sources'].append(source)
                deja.add(source['url'])
                ajoutees += 1

        if 'principale' in consigne:
            source = catalogue[consigne['principale']]
            autres = [s for s in proposition['sources'] if s['url'] != source['url']]
            if source['url'] not in deja:
                ajoutees += 1
            proposition['sources'] = [source, *autres]

        print(f"  {identifiant:26} {len(proposition['sources'])} sources "
              f"(+{ajoutees})  principale : {proposition['sources'][0]['titre'][:52]}")

    io.open('data/propositions.json', 'w', encoding='utf-8').write(
        json.dumps(propositions, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
