import type { Candidat } from './schemas';

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 2026-10-09 » → « 9 octobre 2026 ». */
export function formaterDate(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number);
  return `${j} ${MOIS[m - 1]} ${a}`;
}

/** « 2026-10-09 » → « 09/10/2026 ». */
export function formaterDateCourte(iso: string): string {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

/** Nom en prose : « Marine Le Pen ». */
export function nomComplet(c: Pick<Candidat, 'nom' | 'prenom'>): string {
  return `${c.prenom} ${c.nom}`;
}

/** Nom en liste : « Le Pen, Marine » - rend l'ordre alphabétique lisible. */
export function nomListe(c: Pick<Candidat, 'nom' | 'prenom'>): string {
  return `${c.nom}, ${c.prenom}`;
}

/** Monogramme de substitution : aucune photo n'est utilisée (droits d'auteur). */
export function initiales(c: Pick<Candidat, 'nom' | 'prenom'>): string {
  const lettres = [c.prenom, ...c.nom.split(/[\s-]+/)].map((m) => m[0] ?? '');
  return lettres.join('').slice(0, 3).toUpperCase();
}

/** Minuscules, sans accents, sans ponctuation : base des comparaisons et de la recherche. */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function pluriel(n: number, singulier: string, pluriel: string): string {
  return n <= 1 ? singulier : pluriel;
}

/** En deçà, la période est affichée au jour près plutôt qu'en années. */
const COURT_EN_JOURS = 92;

/**
 * Période d'un jalon de parcours : « depuis 2024 », « 2012-2017 », « 1999 ».
 * Le tiret reste un tiret du 6, comme partout sur le site.
 *
 * Un mandat très court est affiché au jour près : « 2017-2017 Ministre de
 * l'Intérieur » laissait croire à une année de fonction, là où il s'agissait
 * de treize jours d'intérim. La précision n'est donnée que si la source la
 * porte.
 */
export function periode(
  debut: number,
  fin: number | null,
  debutDate: string | null = null,
  finDate: string | null = null,
): string {
  if (fin === null) return `depuis ${debut}`;

  if (debutDate !== null && finDate !== null) {
    const jours = (Date.parse(finDate) - Date.parse(debutDate)) / 86_400_000;
    if (jours >= 0 && jours < COURT_EN_JOURS) {
      const [aD, mD, jD] = debutDate.split('-').map(Number);
      const [aF, mF, jF] = finDate.split('-').map(Number);
      if (aD === aF && mD === mF) return `${jD} au ${jF} ${MOIS[mF - 1]} ${aF}`;
      if (aD === aF) return `${jD} ${MOIS[mD - 1]} au ${jF} ${MOIS[mF - 1]} ${aF}`;
      return `${jD} ${MOIS[mD - 1]} ${aD} au ${jF} ${MOIS[mF - 1]} ${aF}`;
    }
  }

  if (fin === debut) return String(debut);
  return `${debut}-${fin}`;
}

/**
 * Âge atteint à une date donnée. La date de référence est celle de la dernière
 * vérification des données, affichée en haut de chaque page : un âge sans date
 * de référence vieillit en silence.
 */
export function age(naissance: { date: string | null; annee: number }, reference: string): number | null {
  const [anneeRef, moisRef, jourRef] = reference.split('-').map(Number);
  if (naissance.date === null) return null;
  const [a, m, j] = naissance.date.split('-').map(Number);
  const revolu = moisRef > m || (moisRef === m && jourRef >= j);
  return anneeRef - a - (revolu ? 0 : 1);
}

/**
 * Groupe les milliers à la française : 160000 devient « 160 000 ». L'espace est
 * insécable fine, comme le veut la typographie française, et les années sont
 * laissées telles quelles.
 */
export function formaterNombre(valeur: number | string): string {
  const texte = String(valeur);
  return texte.replace(/\d+/g, (bloc) =>
    bloc.length <= 4 && /^(19|20)\d\d$/.test(bloc)
      ? bloc
      : bloc.replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  );
}

/**
 * Élide la préposition devant une voyelle : « de Édouard » devient
 * « d'Édouard ». Le H est laissé de côté : il est aspiré une fois sur deux, et
 * se tromper se voit plus que de ne rien faire.
 */
export function elider(preposition: 'de' | 'que', mot: string): string {
  const premiere = mot.normalize('NFD').replace(/[̀-ͯ]/g, '')[0]?.toLowerCase() ?? '';
  return 'aeiou'.includes(premiere) ? `${preposition.slice(0, -1)}’${mot}` : `${preposition} ${mot}`;
}
