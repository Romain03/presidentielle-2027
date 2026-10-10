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
}

/** Réponses de l'utilisateur ; `null` quand il ne se prononce pas. */
export type Reponses = Record<string, number | null>;

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

  /*
   * Aucun axe gauche-droite n'est calculé. Le site promet de ne placer
   * personne sur un axe, et le faire ici l'aurait contredit deux fois : en
   * plaçant le lecteur, et en le plaçant d'après le classement en familles,
   * qui est une convention de ce site et non une donnée.
   */
  return { questionsRepondues: repondues.length, candidats, partis, familles };
}
