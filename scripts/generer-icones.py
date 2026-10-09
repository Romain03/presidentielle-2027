#!/usr/bin/env python3
"""
Génère les icônes et écrans de lancement, pour le web et pour iOS.

    python3 scripts/generer-icones.py

Sortie :
  public/            icônes PWA et favicon
  ios-ressources/    icône App Store 1024 et écrans de lancement 2732
  ios/App/App/Assets.xcassets/   installées directement dans le projet Xcode

Le motif est volontairement sobre : fond ardoise, « 2027 », filet tricolore.
Le tricolore est le drapeau de la République, pas une couleur de parti.
"""

import json
import os
import shutil

from PIL import Image, ImageDraw, ImageFont

ARDOISE = (26, 23, 20)
CREME = (250, 247, 241)
BLEU = (0, 85, 164)
ROUGE = (239, 65, 53)

POLICES = [
    '/System/Library/Fonts/Supplemental/Helvetica.ttc',
    '/System/Library/Fonts/HelveticaNeue.ttc',
    '/Library/Fonts/Arial Bold.ttf',
]


def police(taille):
    for chemin in POLICES:
        if os.path.exists(chemin):
            for index in (1, 0):
                try:
                    return ImageFont.truetype(chemin, taille, index=index)
                except Exception:
                    continue
    return ImageFont.load_default()


def dessiner(taille, marge=0.12, fond=ARDOISE, encre=CREME):
    """marge : proportion de vide autour du contenu (zone sûre des icônes maskable)."""
    img = Image.new('RGB', (taille, taille), fond)
    d = ImageDraw.Draw(img)
    interieur = taille * (1 - 2 * marge)

    corps = int(interieur * 0.40)
    f = police(corps)
    texte = '2027'
    while True:
        bbox = d.textbbox((0, 0), texte, font=f)
        if bbox[2] - bbox[0] <= interieur or corps <= 8:
            break
        corps -= 2
        f = police(corps)

    bbox = d.textbbox((0, 0), texte, font=f)
    larg, haut = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (taille - larg) / 2 - bbox[0]
    y = (taille - haut) / 2 - bbox[1] - interieur * 0.07
    d.text((x, y), texte, font=f, fill=encre)

    epaisseur = max(2, int(taille * 0.035))
    largeur_filet = interieur * 0.62
    x0 = (taille - largeur_filet) / 2
    y0 = y + haut + interieur * 0.16
    tiers = largeur_filet / 3
    for k, couleur in enumerate((BLEU, encre, ROUGE)):
        d.rectangle([x0 + k * tiers, y0, x0 + (k + 1) * tiers, y0 + epaisseur], fill=couleur)
    return img


def lancement(fond):
    img = Image.new('RGB', (2732, 2732), fond)
    marque = dessiner(820, marge=0.14, fond=fond)
    img.paste(marque, ((2732 - 820) // 2, (2732 - 820) // 2))
    return img


def main():
    os.makedirs('public', exist_ok=True)
    os.makedirs('ios-ressources', exist_ok=True)

    dessiner(180).save('public/apple-touch-icon.png')
    dessiner(192).save('public/icone-192.png')
    dessiner(512).save('public/icone-512.png')
    dessiner(512, marge=0.22).save('public/icone-512-maskable.png')
    dessiner(32, marge=0.06).save('public/favicon.png')

    dessiner(1024).save('ios-ressources/icone-app-1024.png')
    lancement(CREME).save('ios-ressources/lancement-2732.png')
    lancement(ARDOISE).save('ios-ressources/lancement-2732-sombre.png')

    catalogue = 'ios/App/App/Assets.xcassets'
    if not os.path.isdir(catalogue):
        print('  Projet iOS absent : « npx cap add ios » puis relancer pour installer les icônes.')
        return

    shutil.copy('ios-ressources/icone-app-1024.png',
                f'{catalogue}/AppIcon.appiconset/AppIcon-512@2x.png')

    splash = f'{catalogue}/Splash.imageset'
    for f in os.listdir(splash):
        if f.endswith('.png'):
            os.remove(os.path.join(splash, f))
    for suffixe, source in (('', 'ios-ressources/lancement-2732.png'),
                            ('-sombre', 'ios-ressources/lancement-2732-sombre.png')):
        for echelle in ('1x', '2x', '3x'):
            shutil.copy(source, f'{splash}/lancement{suffixe}-{echelle}.png')

    contenu = {
        'images': [
            {'idiom': 'universal', 'filename': f'lancement-{e}.png', 'scale': e}
            for e in ('1x', '2x', '3x')
        ] + [
            {'appearances': [{'appearance': 'luminosity', 'value': 'dark'}],
             'idiom': 'universal', 'filename': f'lancement-sombre-{e}.png', 'scale': e}
            for e in ('1x', '2x', '3x')
        ],
        'info': {'version': 1, 'author': 'xcode'},
    }
    with open(f'{splash}/Contents.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(contenu, indent=2) + '\n')

    print('  Icônes web et iOS régénérées.')


if __name__ == '__main__':
    main()
