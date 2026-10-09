#!/usr/bin/env python3
"""
Récupère un portrait librement réutilisable pour chaque candidat.

    python3 scripts/recuperer-photos.py

Source : Wikimedia Commons, via l'image principale de l'article Wikipédia en
français. Commons n'héberge que du contenu librement réutilisable - sa
politique interdit l'« usage loyal », contrairement à Wikipédia qui peut
héberger localement des images non libres. Un fichier dont les métadonnées
reviennent de l'API Commons est donc réutilisable. Par prudence, toute licence
sans nom ou portant une mention NC, ND ou « fair use » est quand même écartée.

Pour chaque photo retenue, l'auteur, la licence et l'URL de la page du fichier
sont enregistrés dans data/candidats.json et affichés sous le portrait. C'est
la même exigence que pour les propositions : rien n'est publié sans sa source.

Un candidat sans portrait libre garde son monogramme.
"""

import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

AGENT = 'presidentielle-2027/1.0 (https://github.com/Romain03/presidentielle-2027)'
DOSSIER = 'public/photos'
COTE = 480
# Sur une image verticale, on rogne au ras du haut : le visage est presque
# toujours en haut, et mieux vaut un peu de ciel au-dessus qu'un crâne coupé.
DEPUIS_LE_HAUT = 0.0

# Wikimedia Commons n'héberge que du contenu librement réutilisable : sa
# politique interdit l'« usage loyal ». Un fichier dont les métadonnées
# reviennent de l'API Commons est donc libre. On refuse malgré tout toute
# mention restrictive explicite, par prudence, et toute licence sans nom.
LICENCES_INTERDITES = (
    'non-commercial', 'noncommercial', '-nc', 'nc-',
    'no derivative', 'noderiv', '-nd', 'nd-',
    'fair use', 'non-free', 'all rights reserved', 'tous droits réservés',
)


def appeler(url: str) -> dict:
    requete = urllib.request.Request(url, headers={'User-Agent': AGENT})
    with urllib.request.urlopen(requete, timeout=30) as reponse:
        return json.loads(reponse.read().decode('utf-8'))


def telecharger(url: str) -> bytes:
    requete = urllib.request.Request(url, headers={'User-Agent': AGENT})
    with urllib.request.urlopen(requete, timeout=60) as reponse:
        return reponse.read()


def sans_balises(html: str) -> str:
    texte = re.sub(r'<[^>]+>', '', html or '')
    texte = re.sub(r'\s+', ' ', texte).strip()
    return texte


def licence_libre(nom: str) -> bool:
    n = (nom or '').strip().lower()
    if not n:
        return False
    return not any(interdit in n for interdit in LICENCES_INTERDITES)


def image_de_larticle(titre: str):
    """Nom du fichier Commons servant d'image principale à l'article."""
    url = (
        'https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages'
        '&piprop=name&redirects=1&titles=' + urllib.parse.quote(titre)
    )
    pages = appeler(url).get('query', {}).get('pages', {})
    for page in pages.values():
        if 'missing' in page:
            return None, None
        if 'pageimage' in page:
            return page['pageimage'], page.get('title')
        return None, page.get('title')
    return None, None


def metadonnees(fichier: str):
    url = (
        'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
        '&iiprop=url|extmetadata|size&iiurlwidth=1024&titles='
        + urllib.parse.quote('File:' + fichier)
    )
    pages = appeler(url).get('query', {}).get('pages', {})
    for page in pages.values():
        infos = (page.get('imageinfo') or [None])[0]
        if not infos:
            return None
        meta = infos.get('extmetadata', {})
        return {
            'url_image': infos.get('thumburl') or infos.get('url'),
            'page': infos.get('descriptionurl'),
            'licence': sans_balises(meta.get('LicenseShortName', {}).get('value', '')),
            'licence_url': meta.get('LicenseUrl', {}).get('value') or None,
            'auteur': sans_balises(meta.get('Artist', {}).get('value', '')) or 'Auteur non précisé',
        }
    return None


def carre(img: Image.Image) -> Image.Image:
    largeur, hauteur = img.size
    cote = min(largeur, hauteur)
    if hauteur > largeur:
        haut = int((hauteur - cote) * DEPUIS_LE_HAUT)
        boite = (0, haut, cote, haut + cote)
    else:
        gauche = (largeur - cote) // 2
        boite = (gauche, 0, gauche + cote, cote)
    return img.crop(boite).resize((COTE, COTE), Image.LANCZOS)


def main():
    os.makedirs(DOSSIER, exist_ok=True)
    candidats = json.load(io.open('data/candidats.json', encoding='utf-8'))

    retenus, ecartes, absents = 0, [], []

    for candidat in candidats:
        nom = f"{candidat['prenom']} {candidat['nom']}"
        try:
            fichier, titre = image_de_larticle(nom)
        except Exception as erreur:
            print(f"  !  {nom} : {erreur}")
            continue

        if not fichier:
            absents.append(f'{nom} (pas d\'image sur l\'article « {titre or nom} »)')
            candidat['photo'] = None
            continue

        infos = metadonnees(fichier)
        if not infos or not infos['url_image']:
            absents.append(f'{nom} (métadonnées introuvables)')
            candidat['photo'] = None
            continue

        if not licence_libre(infos['licence']):
            ecartes.append(f"{nom} : licence « {infos['licence'] or 'inconnue'} »")
            candidat['photo'] = None
            continue

        try:
            brut = telecharger(infos['url_image'])
            img = Image.open(io.BytesIO(brut)).convert('RGB')
        except Exception as erreur:
            absents.append(f'{nom} (téléchargement : {erreur})')
            candidat['photo'] = None
            continue

        destination = f"{DOSSIER}/{candidat['id']}.webp"
        carre(img).save(destination, 'WEBP', quality=82, method=6)

        candidat['photo'] = {
            'fichier': f"{candidat['id']}.webp",
            'auteur': infos['auteur'],
            'licence': infos['licence'],
            'licence_url': infos['licence_url'],
            'source_url': infos['page'],
            'description': f'Portrait de {nom}',
        }
        retenus += 1
        poids = os.path.getsize(destination) // 1024
        print(f"  ok {nom:<28} {infos['licence']:<16} {poids} Ko")
        time.sleep(0.3)

    io.open('data/candidats.json', 'w', encoding='utf-8').write(
        json.dumps(candidats, ensure_ascii=False, indent=2) + '\n'
    )

    print()
    print(f"  {retenus} portraits libres sur {len(candidats)} candidats")
    if ecartes:
        print(f"  {len(ecartes)} écartés pour cause de licence :")
        for e in ecartes:
            print(f'     {e}')
    if absents:
        print(f"  {len(absents)} sans image disponible :")
        for a in absents:
            print(f'     {a}')


if __name__ == '__main__':
    sys.exit(main())
