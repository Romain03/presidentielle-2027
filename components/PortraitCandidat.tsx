import { initiales } from '@/lib/format';
import type { Photo } from '@/lib/schemas';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Portrait, ou monogramme quand aucune image librement réutilisable n'existe.
 * Les quatre candidats sans photo ne sont pas traités différemment des autres :
 * l'absence se voit, comme pour une position non communiquée.
 */
export default function PortraitCandidat({
  candidat,
  taille,
  prioritaire = false,
}: {
  candidat: { nom: string; prenom: string; photo: Photo | null };
  taille: number;
  prioritaire?: boolean;
}) {
  if (candidat.photo === null) {
    return (
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center rounded-full bg-creme-ombre font-semibold tracking-wide text-stone-600 dark:bg-nuit dark:text-stone-300"
        style={{ width: taille, height: taille, fontSize: Math.round(taille * 0.3) }}
      >
        {initiales(candidat)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/photos/${candidat.photo.fichier}`}
      alt={candidat.photo.description}
      width={taille}
      height={taille}
      loading={prioritaire ? 'eager' : 'lazy'}
      decoding="async"
      className="shrink-0 rounded-full bg-creme-ombre object-cover dark:bg-nuit"
      style={{ width: taille, height: taille }}
    />
  );
}
