#!/usr/bin/env python3
"""
Complète data/candidats.json avec le parcours de chaque candidat, depuis Wikidata.

    python3 scripts/recuperer-parcours.py            # tout le monde
    python3 scripts/recuperer-parcours.py hollande   # un seul candidat

Récupère quatre choses, et rien d'autre :

  - naissance : date (P569) et commune (P19) ;
  - formation : établissements d'enseignement supérieur (P69) ;
  - métiers   : professions exercées (P106), filtrées par une liste explicite ;
  - parcours  : mandats et fonctions (P39) avec leurs dates (P580, P582).

Ce qui est volontairement écarté, et pourquoi :

  - les catégories socio-professionnelles de l'INSEE que Wikidata mêle aux
    métiers (« cadres de la fonction publique », « personnes diverses sans
    activité professionnelle ») : ce sont des codes statistiques, pas des
    métiers, et certains sont franchement désobligeants ;
  - les qualificatifs d'opinion rangés eux aussi parmi les métiers
    (« polémiste », « théoricien du complot ») : ce sont des caractérisations
    par des tiers. Le site n'en reprend aucune, pour personne ;
  - l'enseignement secondaire : un lycée ne dit rien d'un parcours d'adulte, et
    sa présence dépend surtout de l'assiduité des contributeurs.

Les métiers retenus le sont donc par liste blanche : tout libellé inconnu est
écarté et signalé en fin d'exécution, pour être ajouté sciemment ou laissé de
côté. Un filtre par liste noire laisserait passer la prochaine étiquette
douteuse sans que personne ne le remarque.
"""

import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

AGENT = 'presidentielle-2027/1.0 (https://github.com/Romain03/presidentielle-2027)'
CACHE = '.cache/wikidata'

# Articles à viser directement quand le nom seul est ambigu ou absent.
TITRES = {}

# Entités à ne jamais retenir, homonymes vérifiés à la main.
EXCLUSIONS = {}

# ---------------------------------------------------------------- vocabulaire

# Métiers retenus, et leur forme féminine. La clé est le libellé français de
# Wikidata ; la valeur, le couple (masculin, féminin) tel qu'il sera affiché.
METIERS = {
    'acteur ou actrice': ('Acteur', 'Actrice'),
    "agent général ou agente générale d'assurance": ("Agent général d'assurance", "Agente générale d'assurance"),
    'artiste': ('Artiste', 'Artiste'),
    'auteur ou autrice de non-fiction': ('Auteur', 'Autrice'),
    'auteur-compositeur ou autrice-compositrice': ('Auteur-compositeur', 'Autrice-compositrice'),
    'auteur-compositeur-interprète ou auteure-compositrice-interprète': (
        'Auteur-compositeur-interprète', 'Autrice-compositrice-interprète'),
    'avocat ou avocate': ('Avocat', 'Avocate'),
    'chanteur ou chanteuse': ('Chanteur', 'Chanteuse'),
    "chef ou cheffe d'entreprise": ("Chef d'entreprise", "Cheffe d'entreprise"),
    'cheminot': ('Cheminot', 'Cheminote'),
    'chroniqueur ou chroniqueuse de presse': ('Chroniqueur de presse', 'Chroniqueuse de presse'),
    'consultant ou consultante': ('Consultant', 'Consultante'),
    'correcteur': ('Correcteur', 'Correctrice'),
    'dessinateur ou dessinatrice de presse': ('Dessinateur de presse', 'Dessinatrice de presse'),
    'diplomate': ('Diplomate', 'Diplomate'),
    'documentaliste': ('Documentaliste', 'Documentaliste'),
    'économiste': ('Économiste', 'Économiste'),
    'éditorialiste': ('Éditorialiste', 'Éditorialiste'),
    'enseignant ou enseignante': ('Enseignant', 'Enseignante'),
    'enseignant ou enseignante du secondaire': ('Enseignant du secondaire', 'Enseignante du secondaire'),
    'essayiste': ('Essayiste', 'Essayiste'),
    'fonctionnaire': ('Fonctionnaire', 'Fonctionnaire'),
    'footballeur ou footballeuse': ('Footballeur', 'Footballeuse'),
    'galeriste': ('Galeriste', 'Galeriste'),
    'historien ou historienne': ('Historien', 'Historienne'),
    'instituteur': ('Instituteur', 'Institutrice'),
    'journaliste': ('Journaliste', 'Journaliste'),
    'juriste': ('Juriste', 'Juriste'),
    'magistrat ou magistrate': ('Magistrat', 'Magistrate'),
    'musicien ou musicienne': ('Musicien', 'Musicienne'),
    'poète ou poétesse': ('Poète', 'Poétesse'),
    'politologue': ('Politologue', 'Politologue'),
    'réalisateur ou réalisatrice de cinéma': ('Réalisateur de cinéma', 'Réalisatrice de cinéma'),
    'réalisateur ou réalisatrice de documentaire': (
        'Réalisateur de documentaire', 'Réalisatrice de documentaire'),
    'syndicaliste': ('Syndicaliste', 'Syndicaliste'),
    'vidéaste': ('Vidéaste', 'Vidéaste'),
    'écrivain ou écrivaine': ('Écrivain', 'Écrivaine'),
}

# Établissements d'enseignement secondaire : écartés de la formation.
PREFIXES_SECONDAIRE = ('lycee', 'college', 'pensionnat', 'ensemble scolaire', 'cours ')
SECONDAIRE = {'ecole alsacienne', 'etablissement la rochefoucauld', 'ecole de gaulle adenauer'}

# Accords en genre appliqués au premier mot d'un intitulé de fonction.
FEMININ = {
    'adjoint': 'adjointe',
    'ambassadeur': 'ambassadrice',
    'chef': 'cheffe',
    'conseiller': 'conseillère',
    'délégué': 'déléguée',
    'député': 'députée',
    'directeur': 'directrice',
    'dirigeant': 'dirigeante',
    'inspecteur': 'inspectrice',
    'premier': 'première',
    'président': 'présidente',
    'professeur': 'professeure',
    'représentant': 'représentante',
    'sénateur': 'sénatrice',
    'sous-préfet': 'sous-préfète',
    'vice-président': 'vice-présidente',
}

# Qualificatifs accordés lorsqu'ils suivent immédiatement le nom de la fonction.
ACCORDS = {
    'adjoint': 'adjointe',
    'associé': 'associée',
    'chargé': 'chargée',
    'communautaire': 'communautaire',
    'délégué': 'déléguée',
    'départemental': 'départementale',
    'européen': 'européenne',
    'général': 'générale',
    'municipal': 'municipale',
    'national': 'nationale',
    'régional': 'régionale',
}

# Intitulés trop vagues pour être affichés seuls : il leur faut une
# organisation ou un territoire, sans quoi le jalon est écarté.
VAGUES = {
    'chef adjoint',
    'conseiller',
    'conseiller général',
    'conseiller régional',
    'délégué général',
    'directeur de cabinet',
    'dirigeant',
    'maire',
    "membre du conseil d'administration",
    'ministre délégué',
    'porte-parole',
    'professeur associé',
    'président',
    'président du conseil de surveillance',
    'président du conseil général',
}

# Qualificatifs qui précisent une fonction, du plus au moins parlant. La
# circonscription (P768) passe avant le territoire (P1001) : « canton de
# Mortagne-sur-Sèvre » situe mieux un conseiller général que « Vendée ».
PRECISIONS = ('P2389', 'P1268', 'P768', 'P108', 'P102', 'P1416', 'P2210', 'P1001', 'P101')

# Intitulés réécrits : le libellé Wikidata est exact mais illisible tel quel.
REECRITURES = {
    'sénateur de la Cinquième République': 'sénateur',
    'député français': 'député',
    'Premier ministre français': 'Premier ministre',
    'président de conseil général': 'président du conseil général',
    'dirigeant de parti politique': 'dirigeant',
}


def preciser(titre, precision):
    """« Président du conseil général » + « conseil général de la Vendée »
    donne « Président du conseil général (Vendée) ».

    La précision est mise entre parenthèses plutôt que raccordée par une
    préposition : « de » exigerait de connaître le genre et le nombre de chaque
    nom de territoire, et produisait « conseiller régional d'Haute-Normandie ».
    """
    mots_titre = normaliser(titre).split(' ')
    mots_precision = normaliser(precision).split(' ')
    # Le qualificatif répète souvent l'institution déjà nommée dans l'intitulé.
    for taille in range(min(len(mots_titre), len(mots_precision)), 1, -1):
        if mots_titre[-taille:] == mots_precision[:taille]:
            precision = ' '.join(precision.split(' ')[taille:])
            break
    precision = re.sub(r"^(?:de la |de l'|du |des |de |d')", '', precision.strip())
    # Les parenthèses imbriquées sont illisibles : « groupe X (Sénat) » devient
    # « groupe X - Sénat ».
    precision = precision.replace(' (', ' - ').replace(')', '')
    return f'{titre} ({precision})' if precision else titre


def normaliser(texte):
    sans = unicodedata.normalize('NFD', (texte or '').lower())
    sans = ''.join(c for c in sans if unicodedata.category(c) != 'Mn')
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in sans).split())


def api(url):
    requete = urllib.request.Request(url, headers={'User-Agent': AGENT})
    for essai in range(3):
        try:
            with urllib.request.urlopen(requete, timeout=30) as reponse:
                return json.loads(reponse.read().decode('utf-8'))
        except Exception:
            if essai == 2:
                raise
            time.sleep(2)


def cache_lire(nom):
    chemin = os.path.join(CACHE, nom + '.json')
    if os.path.exists(chemin):
        return json.load(io.open(chemin, encoding='utf-8'))
    return None


def cache_ecrire(nom, valeur):
    os.makedirs(CACHE, exist_ok=True)
    json.dump(valeur, io.open(os.path.join(CACHE, nom + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False)


def entite_wikidata(titre):
    url = ('https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops'
           '&ppprop=wikibase_item&redirects=1&titles=' + urllib.parse.quote(titre))
    for page in api(url).get('query', {}).get('pages', {}).values():
        if 'missing' in page:
            return None
        return page.get('pageprops', {}).get('wikibase_item')
    return None


def entite(identifiant, props='claims|labels'):
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
           f'&props={props}&languages=fr|en&ids={identifiant}')
    return api(url).get('entities', {}).get(identifiant, {})


LIBELLES = {}


def libelle(identifiant):
    """Libellé français d'une entité, mis en cache sur le disque."""
    if identifiant in LIBELLES:
        return LIBELLES[identifiant]
    disque = cache_lire('labels')
    if disque is not None and not LIBELLES:
        LIBELLES.update(disque)
    if identifiant in LIBELLES:
        return LIBELLES[identifiant]
    labels = entite(identifiant, 'labels').get('labels', {})
    valeur = labels.get('fr') or labels.get('en')
    LIBELLES[identifiant] = valeur['value'] if valeur else None
    cache_ecrire('labels', LIBELLES)
    return LIBELLES[identifiant]


def valeur(snak):
    return (snak.get('datavalue', {}) or {}).get('value')


def identifiant_de(revendication):
    v = valeur(revendication.get('mainsnak', {})) or {}
    return v.get('id') if isinstance(v, dict) else None


def est_humain(claims):
    return any(identifiant_de(r) == 'Q5' for r in claims.get('P31', []))


def feminin(intitule):
    """Accorde l'intitulé d'une fonction au féminin.

    Seuls le nom de la fonction et les qualificatifs qui le suivent
    immédiatement sont accordés : « conseiller municipal de Troyes » donne
    « conseillère municipale de Troyes », mais « président du conseil général »
    ne donne pas « présidente du conseil générale » - « général » y qualifie le
    conseil, pas la personne. D'où l'arrêt dès le premier mot hors de la liste.
    """
    mots = intitule.split(' ')
    if not mots:
        return intitule
    if mots[0] in FEMININ:
        mots[0] = FEMININ[mots[0]]
    position = 1
    while position < len(mots) and mots[position] in ACCORDS:
        mots[position] = ACCORDS[mots[position]]
        position += 1
    return ' '.join(mots)


def doublet(intitule):
    """« sénateur ou sénatrice de la Cinquième République » -> « sénateur de la
    Cinquième République ». Wikidata écrit les deux genres ; l'accord est fait
    ensuite, à partir du genre déclaré de la personne.
    """
    return re.sub(r'^(\S+?) ou \S+?( |$)', r'\1\2', intitule)


def annee_de(temps):
    if not temps or not temps.get('time'):
        return None
    if temps.get('precision', 11) < 9:
        return None
    return int(temps['time'][1:5])


def date_de(temps):
    """Date exacte, uniquement quand la source est précise au jour."""
    if not temps or not temps.get('time') or temps.get('precision') != 11:
        return None
    return temps['time'][1:11]


def qualificatif(revendication, propriete):
    for q in revendication.get('qualifiers', {}).get(propriete, []):
        v = valeur(q)
        if isinstance(v, dict) and v.get('id'):
            nom = libelle(v['id'])
            if nom:
                return nom
        elif isinstance(v, dict) and v.get('time'):
            return v
    return None


def intitule_du_jalon(revendication, feminine, signale):
    identifiant = identifiant_de(revendication)
    brut = libelle(identifiant) if identifiant else None
    if not brut:
        return None
    titre = doublet(brut)
    titre = REECRITURES.get(titre, titre)

    circonscription = qualificatif(revendication, 'P768')
    if normaliser(titre) == 'depute':
        if circonscription:
            titre = f'député de la {circonscription}'
    elif normaliser(titre) == 'depute europeen':
        titre = 'député européen'
    elif normaliser(titre) == 'senateur':
        titre = preciser('sénateur', circonscription) if circonscription else 'sénateur'

    if normaliser(titre) in {normaliser(v) for v in VAGUES}:
        precision = None
        for propriete in PRECISIONS:
            precision = qualificatif(revendication, propriete)
            if precision:
                break
        if not precision:
            signale.append(f'intitulé trop vague, sans organisation : « {brut} »')
            return None
        titre = preciser(titre, precision)

    if feminine:
        titre = feminin(titre)
    return titre[0].upper() + titre[1:]


def fusionner(jalons):
    """Regroupe les périodes consécutives d'un même intitulé : cinq mandats de
    député successifs forment une seule ligne.
    """
    par_intitule = {}
    for jalon in jalons:
        par_intitule.setdefault(jalon['libelle'], []).append(jalon)

    fusionnes = []
    for intitule, periodes in par_intitule.items():
        periodes.sort(key=lambda j: j['debut'])
        courant = dict(periodes[0])
        for suivant in periodes[1:]:
            fin_courante = courant['fin'] if courant['fin'] is not None else 9999
            if suivant['debut'] - fin_courante <= 1:
                if courant['fin'] is None or suivant['fin'] is None:
                    courant['fin'] = None
                    courant['fin_date'] = None
                elif suivant['fin'] >= courant['fin']:
                    courant['fin'] = suivant['fin']
                    courant['fin_date'] = suivant['fin_date']
            else:
                fusionnes.append(courant)
                courant = dict(suivant)
        fusionnes.append(courant)
    fusionnes.sort(key=lambda j: (-j['debut'], j['debut_date'] or '', j['libelle']), reverse=False)
    fusionnes.sort(key=lambda j: (-j['debut'], '' if j['debut_date'] is None else
                                  ''.join(chr(255 - ord(c)) for c in j['debut_date']), j['libelle']))
    return fusionnes


def resoudre(candidat):
    nom = f"{candidat['prenom']} {candidat['nom']}"
    for titre in [TITRES.get(candidat['id']), nom]:
        if not titre:
            continue
        qid = entite_wikidata(titre)
        if not qid or qid in EXCLUSIONS.get(candidat['id'], set()):
            continue
        donnees = entite(qid)
        claims = donnees.get('claims', {})
        if not est_humain(claims):
            continue
        return qid, claims
    return None, None


def extraire(candidat, claims, source, signale):
    feminine = any(identifiant_de(r) == 'Q6581072' for r in claims.get('P21', []))

    naissance = None
    for r in claims.get('P569', []):
        if r.get('rank') == 'deprecated':
            continue
        temps = valeur(r.get('mainsnak', {})) or {}
        annee = annee_de(temps)
        if annee is None:
            continue
        exacte = temps.get('precision') == 11
        lieu = None
        for rl in claims.get('P19', []):
            identifiant = identifiant_de(rl)
            lieu = libelle(identifiant) if identifiant else None
            if lieu:
                break
        naissance = {
            'date': temps['time'][1:11] if exacte else None,
            'annee': annee,
            'lieu': lieu,
            'source': source,
        }
        break

    formations = []
    for r in claims.get('P69', []):
        if r.get('rank') == 'deprecated':
            continue
        identifiant = identifiant_de(r)
        nom = libelle(identifiant) if identifiant else None
        if not nom:
            continue
        cle = normaliser(nom)
        if cle in SECONDAIRE or cle.startswith(PREFIXES_SECONDAIRE):
            continue
        affiche = nom[0].upper() + nom[1:]
        if affiche not in [f['libelle'] for f in formations]:
            formations.append({'libelle': affiche, 'source': source})

    metiers = []
    for r in claims.get('P106', []):
        if r.get('rank') == 'deprecated':
            continue
        identifiant = identifiant_de(r)
        nom = libelle(identifiant) if identifiant else None
        if not nom:
            continue
        if nom not in METIERS:
            signale.append(f'métier hors liste, écarté : « {nom} »')
            continue
        affiche = METIERS[nom][1 if feminine else 0]
        if affiche not in [m['libelle'] for m in metiers]:
            metiers.append({'libelle': affiche, 'source': source})

    jalons = []
    for r in claims.get('P39', []):
        if r.get('rank') == 'deprecated':
            continue
        debut = annee_de(qualificatif(r, 'P580') or {})
        if debut is None:
            debut = annee_de(qualificatif(r, 'P585') or {})
        if debut is None:
            identifiant = identifiant_de(r)
            signale.append(f'fonction sans date de début, écartée : « {libelle(identifiant)} »')
            continue
        intitule = intitule_du_jalon(r, feminine, signale)
        if not intitule:
            continue
        jalons.append({
            'debut': debut,
            'fin': annee_de(qualificatif(r, 'P582') or {}),
            'debut_date': date_de(qualificatif(r, 'P580') or {}),
            'fin_date': date_de(qualificatif(r, 'P582') or {}),
            'libelle': intitule,
            'source': source,
        })

    return naissance, formations, metiers, fusionner(jalons)


def main():
    filtre = sys.argv[1] if len(sys.argv) > 1 else None
    candidats = json.load(io.open('data/candidats.json', encoding='utf-8'))
    modele = {'titre': 'Wikidata', 'type': 'encyclopedie', 'date': time.strftime('%Y-%m-%d')}

    signale_global = []
    trouves = manquants = 0

    for candidat in candidats:
        nom = f"{candidat['prenom']} {candidat['nom']}"
        if filtre and normaliser(filtre) not in normaliser(nom):
            continue

        cle = 'candidat-' + candidat['id']
        cache = cache_lire(cle)
        if cache is None:
            try:
                qid, claims = resoudre(candidat)
            except Exception as erreur:
                print(f'  !  {nom} : {erreur}')
                continue
            cache = {'qid': qid, 'claims': claims or {}}
            cache_ecrire(cle, cache)
            time.sleep(0.2)
        qid, claims = cache['qid'], cache['claims']

        if not qid:
            print(f'  -  {nom:<26} aucune entité fiable trouvée')
            candidat['biographie'] = {
                'naissance': None, 'formations': [], 'metiers': [],
                'situation': candidat.get('biographie', {}).get('situation'),
            }
            manquants += 1
            continue

        signale = []
        source = {**modele, 'url': f'https://www.wikidata.org/wiki/{qid}'}
        naissance, formations, metiers, jalons = extraire(candidat, claims, source, signale)

        # La situation du jour est saisie à la main, à partir d'une source
        # datée : Wikidata la connaît mal et la met à jour tard.
        candidat['biographie'] = {
            'naissance': naissance,
            'formations': formations,
            'metiers': metiers,
            'situation': candidat.get('biographie', {}).get('situation'),
        }
        candidat['parcours'] = jalons
        trouves += 1
        print(f'  ok {nom:<26} {naissance["annee"] if naissance else "----"}  '
              f'{len(formations)} formation(s)  {len(metiers)} métier(s)  {len(jalons)} jalon(s)')
        signale_global += [f'{nom} : {s}' for s in signale]

    for candidat in candidats:
        candidat.setdefault('biographie',
                            {'naissance': None, 'formations': [], 'metiers': [], 'situation': None})

    io.open('data/candidats.json', 'w', encoding='utf-8').write(
        json.dumps(candidats, ensure_ascii=False, indent=2) + '\n')

    print(f'\n  {trouves} candidats complétés, {manquants} sans correspondance')
    if signale_global:
        print(f'\n  {len(signale_global)} éléments écartés :')
        for ligne in sorted(set(signale_global)):
            print('   ·', ligne)


if __name__ == '__main__':
    main()
