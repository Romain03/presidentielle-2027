import { candidats, getParti, nombrePropositions } from './data';
import type { Famille, Photo, Statut } from './schemas';

/**
 * Projections sérialisables passées aux composants client (filtres,
 * comparateur). Le site étant statique, ces objets sont calculés au build.
 */

export interface PartiResume {
  id: string;
  nom: string;
  sigle: string;
  couleur: string;
  famille: Famille;
}

export interface CandidatResume {
  id: string;
  nom: string;
  prenom: string;
  photo: Photo | null;
  statut: Statut;
  parti: PartiResume | null;
  nombrePropositions: number;
}

export function resumeDuCandidat(id: string): CandidatResume | undefined {
  const candidat = candidats.find((c) => c.id === id);
  if (!candidat) return undefined;
  const parti = getParti(candidat.parti_id);
  return {
    id: candidat.id,
    nom: candidat.nom,
    prenom: candidat.prenom,
    photo: candidat.photo,
    statut: candidat.statut,
    parti: parti
      ? {
          id: parti.id,
          nom: parti.nom,
          sigle: parti.sigle,
          couleur: parti.couleur,
          famille: parti.famille,
        }
      : null,
    nombrePropositions: nombrePropositions(candidat.id),
  };
}

/** Tous les candidats, par ordre alphabétique de nom de famille. */
export function resumesCandidats(): CandidatResume[] {
  return candidats.map((c) => resumeDuCandidat(c.id)!);
}
