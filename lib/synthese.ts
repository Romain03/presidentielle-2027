import { formaterIndicateur } from './comparateur';
import { normaliser } from './format';
import { propositions, themes } from './data';
import type { Candidat, Proposition, Theme } from './schemas';

/**
 * Synthèse thématique d'un groupe de candidats - une famille politique, un
 * parti. Rapproche ce que les membres ont dit, en regroupant les valeurs
 * chiffrées identiques.
 *
 * Ce qu'elle ne fait pas : attribuer une opinion au groupe. Appartenir au même
 * parti n'implique pas d'être d'accord, et deux candidats peuvent avancer le
 * même chiffre pour des raisons opposées.
 */

export interface CandidatBref {
  id: string;
  nom: string;
  prenom: string;
}

export interface ValeurPartagee {
  valeur: string;
  candidats: CandidatBref[];
}

export interface IndicateurGroupe {
  libelle: string;
  valeurs: ValeurPartagee[];
  /** Tous ceux qui ont chiffré cet indicateur annoncent la même valeur. */
  unanime: boolean;
}

export interface ThemeGroupe {
  theme: Theme;
  propositions: Proposition[];
  /** Nombre de membres s'étant exprimés sur ce thème. */
  exprimes: number;
  indicateurs: IndicateurGroupe[];
}

export interface SyntheseGroupe {
  themesRenseignes: ThemeGroupe[];
  themesMuets: Theme[];
  nombrePropositions: number;
}

const bref = (c: Candidat): CandidatBref => ({ id: c.id, nom: c.nom, prenom: c.prenom });

/**
 * Regroupe les valeurs identiques d'un même indicateur : « 60 ans » annoncé
 * par cinq candidats devient une seule ligne portant les cinq noms.
 */
function regrouperIndicateurs(
  membres: Candidat[],
  propositionsDuTheme: Proposition[],
): IndicateurGroupe[] {
  const parCandidat = new Map(membres.map((c) => [c.id, c]));
  const ordre: string[] = [];
  const groupes = new Map<string, Map<string, ValeurPartagee>>();

  for (const proposition of propositionsDuTheme) {
    const candidat = parCandidat.get(proposition.candidat_id);
    if (!candidat) continue;

    for (const indicateur of proposition.indicateurs) {
      if (!groupes.has(indicateur.libelle)) {
        ordre.push(indicateur.libelle);
        groupes.set(indicateur.libelle, new Map());
      }
      const valeurs = groupes.get(indicateur.libelle)!;
      const affichee = formaterIndicateur(indicateur);
      const cle = normaliser(affichee);
      if (!valeurs.has(cle)) valeurs.set(cle, { valeur: affichee, candidats: [] });
      const entree = valeurs.get(cle)!;
      if (!entree.candidats.some((c) => c.id === candidat.id)) entree.candidats.push(bref(candidat));
    }
  }

  return ordre
    .map((libelle) => {
      const valeurs = [...groupes.get(libelle)!.values()].sort(
        (a, b) => b.candidats.length - a.candidats.length || a.valeur.localeCompare(b.valeur, 'fr'),
      );
      return { libelle, valeurs, unanime: valeurs.length === 1 };
    })
    // Un indicateur annoncé par un seul membre n'apprend rien sur le groupe.
    .filter((i) => i.valeurs.reduce((n, v) => n + v.candidats.length, 0) >= 2);
}

export function synthetiserGroupe(membres: Candidat[]): SyntheseGroupe {
  const ids = new Set(membres.map((c) => c.id));
  const leurs = propositions.filter((p) => ids.has(p.candidat_id));

  const renseignes: ThemeGroupe[] = [];
  const muets: Theme[] = [];

  for (const theme of themes) {
    const duTheme = leurs.filter((p) => p.theme_id === theme.id);
    if (duTheme.length === 0) {
      muets.push(theme);
      continue;
    }
    renseignes.push({
      theme,
      propositions: duTheme,
      exprimes: new Set(duTheme.map((p) => p.candidat_id)).size,
      indicateurs: regrouperIndicateurs(membres, duTheme),
    });
  }

  return { themesRenseignes: renseignes, themesMuets: muets, nombrePropositions: leurs.length };
}
