/**
 * Calcul des affinités, sans aucune dépendance aux données.
 *
 * Ce module est volontairement pur : il tourne aussi bien au build que dans
 * le navigateur, sans embarquer les 57 propositions dans le bundle client.
 * Seules les questions retenues et les positions correspondantes y entrent.
 */

export interface OptionQuestion {
  valeur: number;
  libelle: string;
}

export interface QuestionCalcul {
  id: string;
  options: OptionQuestion[];
  positions: { candidatId: string; valeur: number }[];
}

export interface Appartenance {
  partiId: string | null;
  famille: string | null;
}

export interface Affinite {
  id: string;
  score: number;
  /** Questions sur lesquelles la comparaison a pu être faite. */
  comparees: number;
  /** Questions auxquelles l'utilisateur a répondu. */
  total: number;
}

export interface Resultats {
  questionsRepondues: number;
  candidats: Affinite[];
  partis: Affinite[];
  familles: Affinite[];
  /** Position sur l'axe gauche-droite, de -2 à +2, ou null si incalculable. */
  axe: number | null;
}

/** Réponses de l'utilisateur ; `null` quand il ne se prononce pas. */
export type Reponses = Record<string, number | null>;

/**
 * Position des familles sur l'axe gauche-droite. C'est une convention, comme
 * le regroupement en familles lui-même, et elle est publiée sur la page
 * Méthodologie. « Divers » et « Régionalistes » ne figurent pas sur cet axe.
 */
export const COORDONNEES_FAMILLE: Record<string, number> = {
  'extreme-gauche': -2,
  gauche: -1,
  ecologistes: -1,
  centre: 0,
  droite: 1,
  'extreme-droite': 2,
};

/** 1 quand la valeur est identique, 0 aux deux extrémités de l'échelle. */
export function accord(question: QuestionCalcul, choix: number, valeurCandidat: number): number {
  const valeurs = question.options.map((o) => o.valeur);
  const etendue = Math.max(...valeurs) - Math.min(...valeurs);
  if (etendue === 0) return 1;
  return Math.max(0, 1 - Math.abs(choix - valeurCandidat) / etendue);
}

const moyenne = (valeurs: number[]) => valeurs.reduce((s, v) => s + v, 0) / valeurs.length;

export function agreger(
  questions: QuestionCalcul[],
  appartenances: Record<string, Appartenance>,
  reponses: Reponses,
): Resultats {
  const repondues = questions.filter((q) => typeof reponses[q.id] === 'number');

  const parCandidat = new Map<string, number[]>();
  for (const question of repondues) {
    const choix = reponses[question.id] as number;
    for (const position of question.positions) {
      if (!parCandidat.has(position.candidatId)) parCandidat.set(position.candidatId, []);
      parCandidat.get(position.candidatId)!.push(accord(question, choix, position.valeur));
    }
  }

  const candidats: Affinite[] = [...parCandidat.entries()]
    .map(([id, accords]) => ({
      id,
      score: Math.round(moyenne(accords) * 100),
      comparees: accords.length,
      total: repondues.length,
    }))
    .sort((a, b) => b.score - a.score || b.comparees - a.comparees);

  const grouper = (cle: (id: string) => string | null): Affinite[] => {
    const groupes = new Map<string, Affinite[]>();
    for (const affinite of candidats) {
      const k = cle(affinite.id);
      if (k === null) continue;
      if (!groupes.has(k)) groupes.set(k, []);
      groupes.get(k)!.push(affinite);
    }
    return [...groupes.entries()]
      .map(([id, membres]) => ({
        id,
        score: Math.round(moyenne(membres.map((m) => m.score))),
        comparees: Math.max(...membres.map((m) => m.comparees)),
        total: repondues.length,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const partis = grouper((id) => appartenances[id]?.partiId ?? null);
  const familles = grouper((id) => appartenances[id]?.famille ?? null);

  // L'axe est la moyenne des coordonnées de familles, pondérée par l'affinité.
  const surLAxe = familles.filter((f) => COORDONNEES_FAMILLE[f.id] !== undefined && f.score > 0);
  const poids = surLAxe.reduce((s, f) => s + f.score, 0);
  const axe =
    poids === 0
      ? null
      : surLAxe.reduce((s, f) => s + COORDONNEES_FAMILLE[f.id] * f.score, 0) / poids;

  return { questionsRepondues: repondues.length, candidats, partis, familles, axe };
}
