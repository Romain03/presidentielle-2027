#!/usr/bin/env python3
"""
Complète data/partis.json avec des faits vérifiables issus de Wikidata.

    python3 scripts/recuperer-partis.py

Récupère, pour chaque parti : date de fondation (P571), dirigeant actuel
(P488) et site officiel (P856). Rien d'autre : les propriétés d'« idéologie »
et de « positionnement politique » de Wikidata sont des caractérisations par
des tiers, pas des faits, et le site n'en reprend aucune.

Chaque valeur est enregistrée avec sa source, comme tout le reste.
"""

import io
import json
import re
import time
import urllib.parse
import urllib.request

AGENT = 'presidentielle-2027/1.0 (https://github.com/Romain03/presidentielle-2027)'

# Titres d'articles explicites quand la recherche seule ne suffit pas.
TITRES = {
    'parti-socialiste': 'Parti socialiste (France)',
    'renaissance': 'Renaissance (parti)',
    'horizons': 'Horizons (parti politique)',
    'place-publique': 'Place publique (parti politique)',
    'generations': 'Génération.s',
    'l-apres': "L'Après",
    'nouvelle-energie': 'Nouvelle Énergie',
    'nous-france': 'Nous France',
    'trajectoire': 'Trajectoire (parti politique)',
    'elvita': 'Elvita',
    'france-libre': 'France Libre (parti politique)',
    'droite-souverainiste': 'Droite souverainiste',
    'la-france-humaniste': 'La France humaniste',
    'npa-revolutionnaires': 'Nouveau Parti anticapitaliste - Révolutionnaires',
}


# Entités à ne jamais retenir : homonymes avérés, vérifiés à la main.
#   Q62079328 : un parti « Debout ! » fondé par Guillaume Ancelet, homonyme du
#   mouvement de François Ruffin créé en 2025.
EXCLUSIONS = {'debout': {'Q62079328'}}

# Faits qu'aucune entité Wikidata ne porte encore, repris d'une source datée.
MANUELS = {
    'debout': {
        'fondation': {'annee': 2025},
        'dirigeant': {'nom': 'François Ruffin', 'fonction': 'Président'},
        'source': {
            'url': 'https://fr.wikipedia.org/wiki/Candidatures_%C3%A0_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027',
            'titre': "Candidatures à l'élection présidentielle française de 2027",
            'type': 'encyclopedie',
            'date': '2026-10-04',
        },
    },
}


def api(url: str) -> dict:
    requete = urllib.request.Request(url, headers={'User-Agent': AGENT})
    with urllib.request.urlopen(requete, timeout=30) as reponse:
        return json.loads(reponse.read().decode('utf-8'))


def entite_wikidata(titre: str):
    url = (
        'https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops'
        '&ppprop=wikibase_item&redirects=1&titles=' + urllib.parse.quote(titre)
    )
    for page in api(url).get('query', {}).get('pages', {}).values():
        if 'missing' in page:
            return None, None
        return page.get('pageprops', {}).get('wikibase_item'), page.get('title')
    return None, None


def rechercher_articles(nom: str, limite: int = 5):
    url = (
        'https://fr.wikipedia.org/w/api.php?action=query&format=json&list=search'
        f'&srlimit={limite}&srsearch=' + urllib.parse.quote(nom)
    )
    return [r['title'] for r in api(url).get('query', {}).get('search', [])]


def entite(identifiant: str, props: str = 'claims|labels'):
    url = (
        'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
        f'&props={props}&languages=fr|en&ids={identifiant}'
    )
    return api(url).get('entities', {}).get(identifiant, {})


def libelle(identifiant: str):
    labels = entite(identifiant, 'labels').get('labels', {})
    valeur = labels.get('fr') or labels.get('en')
    return valeur['value'] if valeur else None


def normaliser(texte: str) -> str:
    import unicodedata
    sans = unicodedata.normalize('NFD', (texte or '').lower())
    sans = ''.join(c for c in sans if unicodedata.category(c) != 'Mn')
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in sans).split())


def est_un_parti(claims_entite: dict) -> bool:
    """Vrai si l'entité est typée comme parti ou organisation politique.

    Garde-fou indispensable : la recherche ramène volontiers une page
    d'homonymie, ou la personne qui dirige le parti plutôt que le parti.
    """
    ids = [
        (r.get('mainsnak', {}).get('datavalue', {}).get('value') or {}).get('id')
        for r in claims_entite.get('P31', [])
    ]
    ids = [i for i in ids if i]
    if not ids:
        return False
    for identifiant in ids:
        nom_type = (libelle(identifiant) or '').lower()
        if any(
            motif in nom_type
            for motif in ('parti politique', 'political party', 'organisation politique',
                          'mouvement politique', 'political organization')
        ):
            return True
    return False


def correspond(nom_parti: str, sigle: str, label_entite: str) -> bool:
    """Le libellé Wikidata doit vraiment désigner ce parti, pas un homonyme.

    L'égalité est exigée, après découpage du libellé sur les séparateurs de
    dénominations alternatives : « Les Écologistes - Europe Écologie Les
    Verts » désigne bien Les Écologistes, alors que « Debout la France » ne
    désigne pas « Debout ! ». Une simple inclusion confondrait les deux.
    """
    attendu = {normaliser(nom_parti), normaliser(sigle)} - {''}
    parties = re.split(r'[\u2013\u2014\-/()]', label_entite or '')
    obtenus = {normaliser(partie) for partie in parties} - {''}
    return bool(attendu & obtenus)


def resoudre(parti: dict):
    """Renvoie (qid, claims) pour le parti, ou (None, None)."""
    titres = []
    if parti['id'] in TITRES:
        titres.append(TITRES[parti['id']])
    titres.append(parti['nom'])
    try:
        titres += rechercher_articles(f"{parti['nom']} parti politique")
    except Exception:
        pass

    vus = set()
    for titre in titres:
        if titre in vus:
            continue
        vus.add(titre)
        try:
            qid, _ = entite_wikidata(titre)
        except Exception:
            continue
        if not qid:
            continue
        if qid in EXCLUSIONS.get(parti['id'], set()):
            continue
        donnees = entite(qid)
        if not est_un_parti(donnees.get('claims', {})):
            continue
        label = ((donnees.get('labels', {}).get('fr') or {}).get('value')) or ''
        if not correspond(parti['nom'], parti['sigle'], label):
            continue
        return qid, donnees.get('claims', {})
    return None, None


def valeur_simple(claims_parti: dict, propriete: str):
    revendications = claims_parti.get(propriete)
    if not revendications:
        return None
    retenues = [r for r in revendications if r.get('rank') != 'deprecated']
    if not retenues:
        return None
    preferees = [r for r in retenues if r.get('rank') == 'preferred'] or retenues
    return preferees[0].get('mainsnak', {}).get('datavalue', {}).get('value')


def main():
    partis = json.load(io.open('data/partis.json', encoding='utf-8'))
    source_modele = {
        'titre': 'Wikidata',
        'type': 'encyclopedie',
        'date': time.strftime('%Y-%m-%d'),
    }

    trouves = manquants = 0
    for parti in partis:
        try:
            qid, donnees = resoudre(parti)
        except Exception as erreur:
            print(f"  !  {parti['nom']} : {erreur}")
            parti['fondation'] = None
            parti['dirigeant'] = None
            continue

        if not qid:
            manuel = MANUELS.get(parti['id'])
            if manuel:
                parti['fondation'] = {**manuel['fondation'], 'source': manuel['source']}
                parti['dirigeant'] = {**manuel['dirigeant'], 'source': manuel['source']}
                print(
                    f"  ok {parti['nom']:<36} {manuel['fondation']['annee']}  "
                    f"{manuel['dirigeant']['nom']:<26} (saisie manuelle sourcée)"
                )
                trouves += 1
                continue
            print(f"  -  {parti['nom']:<36} aucune entité fiable trouvée")
            parti['fondation'] = None
            parti['dirigeant'] = None
            manquants += 1
            continue

        source = {**source_modele, 'url': f'https://www.wikidata.org/wiki/{qid}'}

        fondation = valeur_simple(donnees, 'P571')
        if fondation and fondation.get('time'):
            annee = int(fondation['time'][1:5])
            parti['fondation'] = {'annee': annee, 'source': source}
        else:
            parti['fondation'] = None

        dirigeant_id = (valeur_simple(donnees, 'P488') or {}).get('id')
        nom_dirigeant = libelle(dirigeant_id) if dirigeant_id else None
        parti['dirigeant'] = (
            {'nom': nom_dirigeant, 'fonction': 'Président', 'source': source}
            if nom_dirigeant
            else None
        )

        site = valeur_simple(donnees, 'P856')
        if site and parti.get('site_officiel') is None:
            parti['site_officiel'] = site

        trouves += 1
        print(
            f"  ok {parti['nom']:<36} "
            f"{parti['fondation']['annee'] if parti['fondation'] else '----'}  "
            f"{(nom_dirigeant or '-'):<26} {site or ''}"
        )
        time.sleep(0.2)

    for parti in partis:
        parti.setdefault('fondation', None)
        parti.setdefault('dirigeant', None)

    io.open('data/partis.json', 'w', encoding='utf-8').write(
        json.dumps(partis, ensure_ascii=False, indent=2) + '\n'
    )
    print(f"\n  {trouves} partis complétés, {manquants} sans correspondance")


if __name__ == '__main__':
    main()
