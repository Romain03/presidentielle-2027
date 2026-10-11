#!/usr/bin/env python3
"""Texte d'un PDF, en passant par les tables /ToUnicode.

Les PDF de campagne embarquent des sous-ensembles de polices dont les codes
n'ont aucun rapport avec l'ASCII : lire les chaines telles quelles donnait
« +++$,-..-/012 » pour « www.milliards ». Chaque police porte pourtant sa
table /ToUnicode, et c'est elle qui fait foi.

    python3 pdftexte.py fichier.pdf [page_debut] [page_fin]
"""
import re, sys, zlib

OBJ = re.compile(rb'(\d+)\s+(\d+)\s+obj\b(.*?)\bendobj', re.S)


def objets(raw):
    return {int(m.group(1)): m.group(3) for m in OBJ.finditer(raw)}


def flux(corps):
    m = re.search(rb'stream\r?\n', corps)
    if not m:
        return None
    fin = corps.rfind(b'endstream')
    donnees = corps[m.end():fin]
    if b'/FlateDecode' in corps[:m.start()]:
        try:
            donnees = zlib.decompress(donnees)
        except Exception:
            try:
                donnees = zlib.decompressobj().decompress(donnees)
            except Exception:
                return None
    return donnees


def resoudre(valeur, objs):
    """Suit une reference « 12 0 R » jusqu'au corps de l'objet."""
    m = re.match(rb'\s*(\d+)\s+\d+\s+R', valeur)
    return objs.get(int(m.group(1)), b'') if m else valeur


def entree(corps, cle):
    """La valeur brute d'une cle de dictionnaire, references comprises."""
    m = re.search(rb'/' + cle + rb'\s*(\d+\s+\d+\s+R|<<|\[|/[\w.+-]+|[\d.]+)', corps)
    if not m:
        return None
    debut = m.start(1)
    jeton = m.group(1)
    if jeton == b'<<':
        n, i = 0, debut
        while i < len(corps):
            if corps[i:i + 2] == b'<<':
                n += 1; i += 2
            elif corps[i:i + 2] == b'>>':
                n -= 1; i += 2
                if n == 0:
                    return corps[debut:i]
            else:
                i += 1
        return corps[debut:]
    if jeton == b'[':
        fin = corps.find(b']', debut)
        return corps[debut:fin + 1]
    return jeton


def table_unicode(cmap):
    """Les correspondances code -> texte d'une table /ToUnicode."""
    table, octets = {}, 1
    for bloc in re.findall(rb'beginbfchar(.*?)endbfchar', cmap, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>', bloc):
            if len(src) > 2:
                octets = 2
            table[int(src, 16)] = ''.join(
                chr(int(dst[i:i + 4], 16)) for i in range(0, len(dst), 4) if dst[i:i + 4])
    for bloc in re.findall(rb'beginbfrange(.*?)endbfrange', cmap, re.S):
        for bas, haut, dst in re.findall(
                rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', bloc):
            if len(bas) > 2:
                octets = 2
            d = int(dst, 16)
            for c in range(int(bas, 16), int(haut, 16) + 1):
                table[c] = chr(d + c - int(bas, 16))
        for bas, haut, liste in re.findall(
                rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]', bloc, re.S):
            if len(bas) > 2:
                octets = 2
            for i, dst in enumerate(re.findall(rb'<([0-9A-Fa-f]+)>', liste)):
                table[int(bas, 16) + i] = ''.join(
                    chr(int(dst[j:j + 4], 16)) for j in range(0, len(dst), 4) if dst[j:j + 4])
    return table, octets


# --- noms de glyphes Adobe

def table_agl():
    """Noms de glyphes Adobe -> caractere, pour le latin-1 et la ponctuation.

    La liste complete d'Adobe compte des milliers d'entrees ; celle-ci couvre
    ce qu'un programme en francais emploie. Les noms non couverts ressortent
    comme des trous visibles, pas comme du silence.
    """
    t = {}
    for c in range(0x20, 0x7F):
        t[{
            32: 'space', 33: 'exclam', 34: 'quotedbl', 35: 'numbersign', 36: 'dollar',
            37: 'percent', 38: 'ampersand', 39: 'quotesingle', 40: 'parenleft',
            41: 'parenright', 42: 'asterisk', 43: 'plus', 44: 'comma', 45: 'hyphen',
            46: 'period', 47: 'slash', 58: 'colon', 59: 'semicolon', 60: 'less',
            61: 'equal', 62: 'greater', 63: 'question', 64: 'at', 91: 'bracketleft',
            92: 'backslash', 93: 'bracketright', 94: 'asciicircum', 95: 'underscore',
            96: 'grave', 123: 'braceleft', 124: 'bar', 125: 'braceright',
            126: 'asciitilde',
        }.get(c, chr(c) if chr(c).isalpha() else None) or chr(c)] = chr(c)
    for i, nom in enumerate(['zero', 'one', 'two', 'three', 'four', 'five', 'six',
                             'seven', 'eight', 'nine']):
        t[nom] = str(i)
    t.update({
        'eacute': 'é', 'egrave': 'è', 'ecircumflex': 'ê', 'edieresis': 'ë',
        'agrave': 'à', 'acircumflex': 'â', 'adieresis': 'ä', 'aacute': 'á',
        'ccedilla': 'ç', 'ugrave': 'ù', 'ucircumflex': 'û', 'udieresis': 'ü',
        'icircumflex': 'î', 'idieresis': 'ï', 'igrave': 'ì', 'iacute': 'í',
        'ocircumflex': 'ô', 'odieresis': 'ö', 'ograve': 'ò', 'oacute': 'ó',
        'Eacute': 'É', 'Egrave': 'È', 'Ecircumflex': 'Ê', 'Agrave': 'À',
        'Acircumflex': 'Â', 'Ccedilla': 'Ç', 'Ocircumflex': 'Ô', 'Ugrave': 'Ù',
        'Icircumflex': 'Î', 'Idieresis': 'Ï', 'ae': 'æ', 'oe': 'œ', 'AE': 'Æ',
        'OE': 'Œ', 'quoteright': '\u2019', 'quoteleft': '\u2018',
        'quotedblleft': '\u201c', 'quotedblright': '\u201d',
        'guillemotleft': '\u00ab', 'guillemotright': '\u00bb',
        'endash': '\u2013', 'emdash': '\u2014', 'bullet': '\u2022',
        'periodcentered': '\u00b7', 'ellipsis': '\u2026', 'euro': '\u20ac',
        'degree': '\u00b0', 'germandbls': 'ß', 'ntilde': 'ñ', 'atilde': 'ã',
        'fi': 'fi', 'fl': 'fl', 'nbspace': ' ', 'uni00A0': ' ',
    })
    return t


AGL = table_agl()

# Encodages nommes par le PDF, et le codec Python correspondant.
CODECS = {b'MacRoman': 'mac_roman', b'WinAnsi': 'cp1252', b'Standard': 'cp1252', b'': 'cp1252'}


def glyphe(nom):
    if nom in AGL:
        return AGL[nom]
    m = re.fullmatch(r'uni([0-9A-Fa-f]{4})', nom)
    if m:
        return chr(int(m.group(1), 16))
    m = re.fullmatch(r'g\d+|cid\d+|index\d+', nom)
    return None


def table_differences(corps, objs):
    """Table code -> caractere tiree de /Encoding /Differences."""
    enc = entree(corps, b'Encoding')
    if enc is None:
        return None
    enc = resoudre(enc, objs)
    diff = entree(enc, b'Differences') if b'Differences' in enc else None
    if diff is None:
        return None
    table, code = {}, 0
    for jeton in re.findall(rb'\d+|/[\w.+-]+', diff):
        if jeton.startswith(b'/'):
            c = glyphe(jeton[1:].decode('latin-1'))
            if c is not None:
                table[code] = c
            code += 1
        else:
            code = int(jeton)
    return table


def polices(corps, objs):
    """Les tables /ToUnicode des polices declarees dans /Resources."""
    res = resoudre(entree(corps, b'Resources') or b'', objs)
    dico = entree(res, b'Font')
    if dico is None:
        return {}
    dico = resoudre(dico, objs)
    sortie = {}
    for nom, num in re.findall(rb'/([\w.+-]+)\s+(\d+)\s+\d+\s+R', dico):
        police = objs.get(int(num), b'')
        tu = entree(police, b'ToUnicode')
        if tu is None:
            # Police composite : la table est portee par le descendant.
            desc = entree(police, b'DescendantFonts')
            if desc is not None:
                m = re.search(rb'(\d+)\s+\d+\s+R', resoudre(desc, objs) or desc)
                if m:
                    police = objs.get(int(m.group(1)), b'')
                    tu = entree(police, b'ToUnicode')
        if tu is not None:
            cmap = flux(resoudre(tu, objs))
            if cmap:
                table, _ = table_unicode(cmap)
                # La largeur du code vient du type de la police, jamais de
                # l'ecriture de la table : les /ToUnicode de Type1 notent
                # volontiers « <0041> » pour un code tenant sur un octet, et
                # lire deux octets donnait 95 % de trous sur les livrets des
                # Republicains.
                composite = re.search(rb'/Subtype\s*/Type0', police) is not None
                sortie[nom] = (table, 2 if composite else 1)
                continue
        # Pas de /ToUnicode : /Differences, sinon encodage standard. Roussel
        # publie ainsi, et son texte se lit tel quel.
        diff = table_differences(police, objs)
        if diff:
            sortie[nom] = (diff, 1)
            continue
        # Ni table, ni differences : c'est un encodage nomme. Le lire plutot
        # que de supposer Windows - la lettre de Bernard Cazeneuve est en
        # MacRoman, et la supposition rendait « abîmée » en « ab”mŽe ».
        enc = entree(police, b'Encoding')
        nom_enc = b''
        if enc is not None:
            brut_enc = resoudre(enc, objs) if re.match(rb'\s*\d+\s+\d+\s+R', enc) else enc
            m = re.search(rb'/(MacRoman|WinAnsi|MacExpert|Standard)Encoding', brut_enc or b'')
            if m:
                nom_enc = m.group(1)
        sortie[nom] = (CODECS.get(nom_enc, 'cp1252'), 1)
    return sortie


def decoder(brut, table, octets):
    brut = re.sub(rb'\\(\d{1,3})', lambda m: bytes([int(m.group(1), 8) & 0xFF]), brut)
    brut = re.sub(rb'\\([()\\nrt])', lambda m: {b'n': b'\n', b'r': b'\r', b't': b'\t'}.get(
        m.group(1), m.group(1)), brut)
    if octets == 2:
        codes = [int.from_bytes(brut[i:i + 2], 'big') for i in range(0, len(brut) - 1, 2)]
    else:
        codes = list(brut)
    if isinstance(table, str):
        return bytes(c & 0xFF for c in codes).decode(table, 'replace')
    if table is None:
        return bytes(c & 0xFF for c in codes).decode('cp1252', 'replace')
    # Un code absent de la table devient un losange visible, jamais rien : un
    # trou silencieux se recopie sans qu'on le voie, et c'est ainsi qu'on cite
    # une phrase amputee.
    return ''.join(table.get(c, '\ufffd') for c in codes)


CHAINE = re.compile(rb'\((?:\\.|[^\\()])*\)', re.S)

# Un jeton utile du flux de contenu : changement de police, position du texte,
# ou texte lui-meme.
JETON = re.compile(
    rb'/([\w.+-]+)\s+[\d.]+\s+Tf'                                  # 1 police
    rb'|((?:-?[\d.]+\s+){6})Tm'                                      # 2 matrice
    rb'|((?:-?[\d.]+\s+){2})(Td|TD)'                                 # 3,4 deplacement
    rb'|\bT\*|(-?[\d.]+)\s+TL'                                      # 5 interligne
    rb'|(\[(?:[^\[\]\\]|\\.)*\])\s*TJ'                            # 6 tableau
    rb'|(\((?:\\.|[^\\()])*\))\s*(?:Tj|\')'                        # 7 chaine
    rb'|\bBT\b',
    re.S)


def fragments(contenu, fontes):
    """Les morceaux de texte d'une page, avec leur position.

    Sans la position, un document en colonnes se lit de travers : le livret
    Sante de Nouvelle Energie rendait « nous sommes des millions de Francais a
    rencontrer soins », deux colonnes entrelacees. Une phrase amputee de cette
    facon se recopie sans qu'on la voie amputee, et c'est exactement ce qu'il
    ne faut pas publier.
    """
    table, octets = None, 1
    x = y = 0.0
    interligne = 0.0
    sortie = []
    for m in JETON.finditer(contenu):
        if m.group(1):
            table, octets = fontes.get(m.group(1), (None, 1))
        elif m.group(2):
            nombres = [float(v) for v in m.group(2).split()]
            x, y = nombres[4], nombres[5]
        elif m.group(3):
            dx, dy = (float(v) for v in m.group(3).split())
            x += dx
            y += dy
            if m.group(4) == b'TD':
                interligne = -dy
        elif m.group(5):
            interligne = float(m.group(5))
        elif m.group(6):
            texte = ''.join(decoder(c[1:-1], table, octets) for c in CHAINE.findall(m.group(6)))
            if texte:
                sortie.append((x, y, texte))
        elif m.group(7):
            texte = decoder(m.group(7)[1:-1], table, octets)
            if texte:
                sortie.append((x, y, texte))
        elif m.group(0) == b'T*':
            y -= interligne
    return sortie


def colonnes(morceaux, largeur_trou=48.0):
    """Regroupe les morceaux en colonnes, par trou horizontal.

    Une page a une seule colonne renvoie une seule liste : le cas general n'est
    pas penalise.
    """
    if not morceaux:
        return []
    xs = sorted({round(x) for x, _, _ in morceaux})
    coupures = [xs[i + 1] for i in range(len(xs) - 1) if xs[i + 1] - xs[i] >= largeur_trou]
    if not coupures:
        return [morceaux]
    groupes = [[] for _ in range(len(coupures) + 1)]
    for frag in morceaux:
        rang = sum(1 for c in coupures if frag[0] >= c)
        groupes[rang].append(frag)
    # Une « colonne » de deux morceaux est un artefact de mise en page, pas une
    # colonne : on la rend a sa voisine plutot que d'en faire un bloc.
    fusionnes = []
    for g in groupes:
        if len(g) < 3 and fusionnes:
            fusionnes[-1].extend(g)
        else:
            fusionnes.append(g)
    return fusionnes


def lignes(morceaux, tolerance=3.0):
    """Les morceaux ordonnes en lignes, de haut en bas puis de gauche a droite."""
    restants = sorted(morceaux, key=lambda f: (-f[1], f[0]))
    sortie, courante, y_ligne = [], [], None
    for frag in restants:
        if y_ligne is None or abs(frag[1] - y_ligne) <= tolerance:
            courante.append(frag)
            y_ligne = frag[1] if y_ligne is None else y_ligne
        else:
            sortie.append(sorted(courante, key=lambda f: f[0]))
            courante, y_ligne = [frag], frag[1]
    if courante:
        sortie.append(sorted(courante, key=lambda f: f[0]))
    return sortie


def texte_page(contenu, fontes):
    morceaux = fragments(contenu, fontes)
    blocs = []
    for colonne in colonnes(morceaux):
        lignes_texte = []
        for ligne in lignes(colonne):
            lignes_texte.append(''.join(t for _, _, t in ligne))
        blocs.append('\n'.join(lignes_texte))
    return '\n\n'.join(blocs)


def pages(chemin):
    raw = open(chemin, 'rb').read()
    objs = objets(raw)
    vues, resultat = set(), []
    for num, corps in objs.items():
        if not re.search(rb'/Type\s*/Page[^s]', corps):
            continue
        fontes = polices(corps, objs)
        refs = entree(corps, b'Contents') or b''
        nums = [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', refs)]
        contenu = b''.join(flux(objs.get(n, b'')) or b'' for n in nums)
        cle = (contenu[:200], num)
        if contenu and cle not in vues:
            vues.add(cle)
            resultat.append((num, texte_page(contenu, fontes)))
    resultat.sort(key=lambda x: x[0])
    return [t for _, t in resultat]


if __name__ == '__main__':
    p = pages(sys.argv[1])
    a = int(sys.argv[2]) - 1 if len(sys.argv) > 2 else 0
    b = int(sys.argv[3]) if len(sys.argv) > 3 else len(p)
    for i, t in enumerate(p[a:b], a + 1):
        t = re.sub(r'[ \t]{2,}', ' ', t)
        t = re.sub(r'\n{2,}', '\n', t).strip()
        print(f'----- page {i}\n{t}\n')
