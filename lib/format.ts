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

/**
 * Période d'un jalon de parcours : « depuis 2024 », « 2012-2017 », « 1999 ».
 * Le tiret reste un tiret du 6, comme partout sur le site.
 */
export function periode(debut: number, fin: number | null): string {
  if (fin === null) return `depuis ${debut}`;
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
