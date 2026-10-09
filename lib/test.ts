import { candidats, getCandidat, getParti, propositions, questions } from './data';
import { formaterIndicateur } from './comparateur';
import { agreger, COORDONNEES_FAMILLE, type Appartenance, type Reponses, type Resultats } from './test-calcul';
import { LIBELLES_FAMILLE, type Question } from './schemas';

export { COORDONNEES_FAMILLE } from './test-calcul';
export type { Affinite, Appartenance, Reponses, Resultats } from './test-calcul';

/**
 * Test de proximité.
 *
 * Principe : aucune question n'est inventée. Chacune porte sur un indicateur
 * chiffré que des candidats ont eux-mêmes énoncé, et leur position est déduite
 * de leur propre déclaration. On ne cherche jamais à savoir s'ils seraient
 * « pour » ou « contre » une formulation abstraite - ce serait de
 * l'interprétation, et le site n'en fait pas.
 *
 * Conséquence directe : le test ne peut exister que là où les données
 * existent. Les seuils ci-dessous décident de son activation, et ils sont
 * publics plutôt que laissés à l'appréciation.
 */

/** En dessous, une question ne discrimine rien : elle est écartée. */
export const MIN_CANDIDATS_PAR_QUESTION = 4;
/** En dessous, le test n'est pas proposé du tout. */
export const MIN_QUESTIONS_ACTIVES = 8;
/** Part des questions actives qu'un candidat doit renseigner pour être classé. */
export const PART_MINIMALE_RENSEIGNEE = 0.5;
/** En dessous, un classement n'aurait pas de sens : le test reste éteint. */
export const MIN_CANDIDATS_ELIGIBLES = 6;

export interface PositionCandidat {
  candidatId: string;
  valeur: number;
  valeurAffichee: string;
  propositionId: string;
}

export interface QuestionPositions {
  question: Question;
  positions: PositionCandidat[];
}

/** Positions déduites des indicateurs, pour une question donnée. */
export function positionsPourQuestion(question: Question): PositionCandidat[] {
  const vues = new Set<string>();
  const trouvees: PositionCandidat[] = [];

  for (const proposition of propositions) {
    if (proposition.theme_id !== question.theme_id) continue;
    if (vues.has(proposition.candidat_id)) continue;

    for (const indicateur of proposition.indicateurs) {
      if (indicateur.libelle !== question.indicateur) continue;
      if (indicateur.valeur_comparable === null) continue;
      vues.add(proposition.candidat_id);
      trouvees.push({
        candidatId: proposition.candidat_id,
        valeur: indicateur.valeur_comparable,
        valeurAffichee: formaterIndicateur(indicateur),
        propositionId: proposition.id,
      });
      break;
    }
  }

  const rang = new Map(candidats.map((c, i) => [c.id, i]));
  return trouvees.sort((a, b) => (rang.get(a.candidatId) ?? 0) - (rang.get(b.candidatId) ?? 0));
}

export function toutesLesQuestions(): QuestionPositions[] {
  return questions.map((question) => ({ question, positions: positionsPourQuestion(question) }));
}

/** Questions suffisamment documentées pour être posées. */
export function questionsActives(): QuestionPositions[] {
  return toutesLesQuestions().filter((q) => q.positions.length >= MIN_CANDIDATS_PAR_QUESTION);
}

export interface EtatTest {
  actif: boolean;
  questionsActives: QuestionPositions[];
  questionsEcartees: QuestionPositions[];
  candidatsEligibles: string[];
  /** Ce qui manque pour que le test s'active, en clair. */
  manques: string[];
}

/**
 * Le test s'allume tout seul quand les données le permettent. Tant que ce
 * n'est pas le cas, la page explique ce qui manque plutôt que d'afficher des
 * pourcentages fabriqués par la méthode.
 */
export function etatDuTest(): EtatTest {
  const toutes = toutesLesQuestions();
  const actives = toutes.filter((q) => q.positions.length >= MIN_CANDIDATS_PAR_QUESTION);
  const ecartees = toutes.filter((q) => q.positions.length < MIN_CANDIDATS_PAR_QUESTION);

  const requises = Math.ceil(actives.length * PART_MINIMALE_RENSEIGNEE);
  const eligibles = candidats
    .filter((candidat) => {
      const n = actives.filter((q) =>
        q.positions.some((p) => p.candidatId === candidat.id),
      ).length;
      return actives.length > 0 && n >= Math.max(1, requises);
    })
    .map((c) => c.id);

  const manques: string[] = [];
  if (actives.length < MIN_QUESTIONS_ACTIVES) {
    manques.push(
      `${actives.length} question${actives.length > 1 ? 's' : ''} sur ${MIN_QUESTIONS_ACTIVES} : il faut des questions portant sur un chiffre annoncé par au moins ${MIN_CANDIDATS_PAR_QUESTION} candidats.`,
    );
  }
  if (eligibles.length < MIN_CANDIDATS_ELIGIBLES) {
    manques.push(
      `${eligibles.length} candidat${eligibles.length > 1 ? 's' : ''} classable${eligibles.length > 1 ? 's' : ''} sur ${MIN_CANDIDATS_ELIGIBLES} : il faut avoir une position sur au moins la moitié des questions.`,
    );
  }

  return {
    actif: manques.length === 0,
    questionsActives: actives,
    questionsEcartees: ecartees,
    candidatsEligibles: eligibles,
    manques,
  };
}

/* ------------------------------------------------------------------ calcul */

/** Rattachement de chaque candidat à son parti et à sa famille. */
export function appartenances(): Record<string, Appartenance> {
  const table: Record<string, Appartenance> = {};
  for (const candidat of candidats) {
    const parti = getParti(candidat.parti_id);
    table[candidat.id] = { partiId: candidat.parti_id, famille: parti?.famille ?? null };
  }
  return table;
}

/** Calcul côté serveur, utilisé par les tests ; le client appelle `agreger`. */
export function calculerResultats(reponses: Reponses): Resultats {
  const posees = etatDuTest().questionsActives.map(({ question, positions }) => ({
    id: question.id,
    options: question.options,
    positions: positions.map((p) => ({ candidatId: p.candidatId, valeur: p.valeur })),
  }));
  return agreger(posees, appartenances(), reponses);
}

/** Libellé de la position sur l'axe, volontairement prudent. */
export function libelleAxe(axe: number): string {
  if (axe <= -1.5) return LIBELLES_FAMILLE['extreme-gauche'];
  if (axe <= -0.5) return LIBELLES_FAMILLE.gauche;
  if (axe < 0.5) return LIBELLES_FAMILLE.centre;
  if (axe < 1.5) return LIBELLES_FAMILLE.droite;
  return LIBELLES_FAMILLE['extreme-droite'];
}

