import Link from 'next/link';
import BadgeStatut from './BadgeStatut';
import PortraitCandidat from './PortraitCandidat';
import { LIBELLES_FAMILLE } from '@/lib/schemas';
import { nomListe, pluriel } from '@/lib/format';
import type { CandidatResume } from '@/lib/vues';

export default function CandidatCarte({ candidat }: { candidat: CandidatResume }) {
  const { parti } = candidat;

  return (
    <li className="h-full">
      <Link
        href={`/candidats/${candidat.id}/`}
        className="carte carte-interactive relative flex h-full flex-col gap-3.5 overflow-hidden p-5"
      >
        {/* Filet de couleur du parti : repère visuel, jamais porteur unique d'information. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: parti?.couleur ?? 'transparent' }}
        />

        <div className="flex items-start gap-3.5">
          <PortraitCandidat candidat={candidat} taille={48} />
          <span className="min-w-0">
            <span className="block font-serif text-lg font-semibold leading-tight">
              {nomListe(candidat)}
            </span>
            <span className="mt-1 block text-sm text-stone-600 dark:text-stone-400">
              {parti ? `${parti.nom} (${parti.sigle})` : 'Sans étiquette'}
            </span>
            {parti && (
              <span className="block text-xs text-stone-600 dark:text-stone-400">
                {LIBELLES_FAMILLE[parti.famille]}
              </span>
            )}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-900/6 pt-3 dark:border-white/8">
          <BadgeStatut statut={candidat.statut} />
          <span className="text-xs text-stone-600 dark:text-stone-400">
            {candidat.nombrePropositions}{' '}
            {pluriel(candidat.nombrePropositions, 'proposition sourcée', 'propositions sourcées')}
          </span>
        </div>
      </Link>
    </li>
  );
}
