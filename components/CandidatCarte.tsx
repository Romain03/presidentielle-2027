import Link from 'next/link';
import BadgeStatut from './BadgeStatut';
import { LIBELLES_FAMILLE } from '@/lib/schemas';
import { initiales, nomListe, pluriel } from '@/lib/format';
import type { CandidatResume } from '@/lib/vues';

export default function CandidatCarte({ candidat }: { candidat: CandidatResume }) {
  const { parti } = candidat;

  return (
    <li className="h-full">
      <Link
        href={`/candidats/${candidat.id}/`}
        className="flex h-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
        // La couleur du parti borde la carte : repère visuel redondant avec le texte.
        style={
          parti ? { borderLeftWidth: '4px', borderLeftColor: parti.couleur } : undefined
        }
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {initiales(candidat)}
          </span>
          <span className="min-w-0">
            <span className="block font-medium leading-snug">{nomListe(candidat)}</span>
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              {parti ? `${parti.nom} (${parti.sigle})` : 'Sans étiquette'}
            </span>
            {parti && (
              <span className="block text-xs text-slate-500 dark:text-slate-500">
                {LIBELLES_FAMILLE[parti.famille]}
              </span>
            )}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <BadgeStatut statut={candidat.statut} />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {candidat.nombrePropositions}{' '}
            {pluriel(candidat.nombrePropositions, 'proposition sourcée', 'propositions sourcées')}
          </span>
        </div>
      </Link>
    </li>
  );
}
