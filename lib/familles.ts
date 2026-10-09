import { candidats, partis, propositions, themes } from './data';
import { formaterIndicateur } from './comparateur';
import { normaliser } from './format';
import { LIBELLES_FAMILLE, type Candidat, type Famille, type Parti, type Proposition, type Theme } from './schemas';

/**
 * Synthèse par famille politique.
 *
 * Ce que ces pages font : dire qui compose la famille, et rapprocher ce que
 * ses candidats ont dit, thème par thème, en regroupant les valeurs chiffrées
 * identiques.
 *
 * Ce qu'elles ne font pas : définir ce que la famille « pense ». Le
 * regroupement en familles est une convention du site, documentée sur la page
 * Méthodologie ; écrire que telle famille défend telle idée serait une
 * affirmation que rien dans les données ne soutient.
 */

export interface CandidatBref {
  id: string;
  nom: string;
  prenom: string;
}

/** Une valeur d'indicateur et les candidats qui l'énoncent. */
export interface ValeurPartagee {
  valeur: string;
  candidats: CandidatBref[];
}

export interface IndicateurFamille {
  libelle: string;
  valeurs: ValeurPartagee[];
  /** Tous les candidats qui ont chiffré cet indicateur donnent la même valeur. */
  unanime: boolean;
}

export interface ThemeFamille {
  theme: Theme;
  propositions: Proposition[];
  /** Nombre de candidats de la famille s'étant exprimés sur ce thème. */
  exprimes: number;
  indicateurs: IndicateurFamille[];
}

export interface SyntheseFamille {
  famille: Famille;
  libelle: string;
  partis: Parti[];
  candidats: Candidat[];
  /** Thèmes où au moins un candidat de la famille s'est exprimé. */
  themesRenseignes: ThemeFamille[];
  /** Thèmes où aucun ne s'est exprimé. */
  themesMuets: Theme[];
  nombrePropositions: number;
}

const bref = (c: Candidat): CandidatBref => ({ id: c.id, nom: c.nom, prenom: c.prenom });

export function partisDeLaFamille(famille: Famille): Parti[] {
  return partis.filter((p) => p.famille === famille);
}

export function candidatsDeLaFamille(famille: Famille): Candidat[] {
  const ids = new Set(partisDeLaFamille(famille).map((p) => p.id));
  return candidats.filter((c) => c.parti_id !== null && ids.has(c.parti_id));
}

/**
 * Regroupe les valeurs identiques d'un même indicateur. « 60 ans » énoncé par
 * cinq candidats devient une seule ligne portant les cinq noms : c'est ce qui
 * rend une famille lisible d'un coup d'œil.
 */
function regrouperIndicateurs(
  membres: Candidat[],
  propositionsDuTheme: Proposition[],
): IndicateurFamille[] {
  const parCandidat = new Map(membres.map((c) => [c.id, c]));
  const ordre: string[] = [];
  const groupes = new Map<string, Map<string, { valeur: string; candidats: CandidatBref[] }>>();

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
      if (!entree.candidats.some((c) => c.id === candidat.id)) {
        entree.candidats.push(bref(candidat));
      }
    }
  }

  return ordre
    .map((libelle) => {
      const valeurs = [...groupes.get(libelle)!.values()].sort(
        (a, b) => b.candidats.length - a.candidats.length || a.valeur.localeCompare(b.valeur, 'fr'),
      );
      return { libelle, valeurs, unanime: valeurs.length === 1 };
    })
    // Un indicateur énoncé par un seul candidat n'apprend rien sur la famille.
    .filter((i) => i.valeurs.reduce((n, v) => n + v.candidats.length, 0) >= 2);
}

export function synthetiserFamille(famille: Famille): SyntheseFamille {
  const membres = candidatsDeLaFamille(famille);
  const idsMembres = new Set(membres.map((c) => c.id));
  const leurs = propositions.filter((p) => idsMembres.has(p.candidat_id));

  const renseignes: ThemeFamille[] = [];
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

  return {
    famille,
    libelle: LIBELLES_FAMILLE[famille],
    partis: partisDeLaFamille(famille),
    candidats: membres,
    themesRenseignes: renseignes,
    themesMuets: muets,
    nombrePropositions: leurs.length,
  };
}

/** Familles comptant au moins un parti, par ordre alphabétique de libellé. */
export function famillesPeuplees(): SyntheseFamille[] {
  return (Object.keys(LIBELLES_FAMILLE) as Famille[])
    .map(synthetiserFamille)
    .filter((s) => s.partis.length > 0)
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}
