import type { Metadata } from 'next';
import Link from 'next/link';
import BadgeStatut from '@/components/BadgeStatut';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { candidatsDuParti, derniereMiseAJour, partis } from '@/lib/data';
import { nomComplet } from '@/lib/format';
import { LIBELLES_FAMILLE } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Partis',
  description:
    'Les partis engagés dans l’élection présidentielle de 2027, leurs candidats et leur processus de désignation.',
};

export default function PagePartis() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Partis</h1>
        <p className="max-w-2xl text-sm text-slate-700 dark:text-slate-300">
          Ordre alphabétique. La famille politique sert de repère pour le filtre des candidats ;
          sa construction est expliquée dans la{' '}
          <Link href="/methodologie/" className="underline underline-offset-2">
            méthodologie
          </Link>
          .
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {partis.map((parti) => {
          const candidats = candidatsDuParti(parti.id);
          return (
            <li key={parti.id}>
              <Link
                href={`/partis/${parti.id}/`}
                className="block h-full rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                style={{ borderLeftWidth: '4px', borderLeftColor: parti.couleur }}
              >
                <span className="block font-medium">
                  {parti.nom} ({parti.sigle})
                </span>
                <span className="block text-sm text-slate-600 dark:text-slate-400">
                  {LIBELLES_FAMILLE[parti.famille]}
                  {parti.nuance_ministerielle !== null &&
                    ` · nuance ${parti.nuance_ministerielle.code}`}
                </span>
                <span className="mt-2 block space-y-1">
                  {candidats.length === 0 ? (
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Aucun candidat recensé
                    </span>
                  ) : (
                    candidats.map((candidat) => (
                      <span key={candidat.id} className="flex flex-wrap items-center gap-2 text-sm">
                        {nomComplet(candidat)}
                        <BadgeStatut statut={candidat.statut} />
                      </span>
                    ))
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
