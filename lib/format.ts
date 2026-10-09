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

/** Nom en liste : « Le Pen, Marine » — rend l'ordre alphabétique lisible. */
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
