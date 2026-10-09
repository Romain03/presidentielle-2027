import { candidats, partis } from './data';
import { synthetiserGroupe, type SyntheseGroupe } from './synthese';
import { LIBELLES_FAMILLE, type Candidat, type Famille, type Parti } from './schemas';

/**
 * Synthèse par famille politique.
 *
 * Ces pages disent qui compose la famille et rapprochent ce que ses candidats
 * ont déclaré. Elles ne définissent pas ce que la famille « pense » : le
 * regroupement est une convention du site, documentée sur la page
 * Méthodologie.
 */

export type { CandidatBref, IndicateurGroupe, ThemeGroupe, ValeurPartagee } from './synthese';
export type IndicateurFamille = import('./synthese').IndicateurGroupe;
export type ThemeFamille = import('./synthese').ThemeGroupe;

export interface SyntheseFamille extends SyntheseGroupe {
  famille: Famille;
  libelle: string;
  partis: Parti[];
  candidats: Candidat[];
}

export function partisDeLaFamille(famille: Famille): Parti[] {
  return partis.filter((p) => p.famille === famille);
}

export function candidatsDeLaFamille(famille: Famille): Candidat[] {
  const ids = new Set(partisDeLaFamille(famille).map((p) => p.id));
  return candidats.filter((c) => c.parti_id !== null && ids.has(c.parti_id));
}

export function synthetiserFamille(famille: Famille): SyntheseFamille {
  const membres = candidatsDeLaFamille(famille);
  return {
    famille,
    libelle: LIBELLES_FAMILLE[famille],
    partis: partisDeLaFamille(famille),
    candidats: membres,
    ...synthetiserGroupe(membres),
  };
}

/** Familles comptant au moins un parti, par ordre alphabétique de libellé. */
export function famillesPeuplees(): SyntheseFamille[] {
  return (Object.keys(LIBELLES_FAMILLE) as Famille[])
    .map(synthetiserFamille)
    .filter((s) => s.partis.length > 0)
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}
