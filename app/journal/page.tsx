import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { derniereMiseAJour, journal } from '@/lib/data';
import { formaterDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Journal des données',
  description:
    'Ce qui a changé dans les données du site, à quelle date, et le lien vers la modification.',
};

const DEPOT = 'https://github.com/Romain03/presidentielle-2027';

const LIBELLES_FICHIER: Record<string, string> = {
  'candidats.json': 'Candidats',
  'partis.json': 'Partis',
  'propositions.json': 'Propositions',
  'themes.json': 'Thèmes',
  'questions.json': 'Questions du test',
  'journal.json': 'Journal',
};

export default function PageJournal() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold">Journal des données</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Un site qui corrige ses données sans le dire demande une confiance qu’il n’a pas
          méritée. Voici chaque modification, sa date, et le lien pour en lire le détail.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Cette liste n’est pas tenue à la main : elle est dérivée de l’historique du dépôt, en ne
          retenant que les modifications qui touchent réellement un fichier de données. Les
          changements d’affichage n’y figurent pas.
        </p>
      </header>

      <ol className="space-y-3">
        {journal.map((entree) => (
          <li key={entree.commit} className="carte flex flex-col gap-1 p-4 sm:flex-row sm:gap-5">
            <span className="shrink-0 text-sm tabular-nums text-stone-600 sm:w-36 dark:text-stone-400">
              {formaterDate(entree.date)}
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block text-sm">{entree.resume}</span>
              <span className="block text-xs text-stone-600 dark:text-stone-400">
                {entree.fichiers.map((f) => LIBELLES_FICHIER[f] ?? f).join(' · ')} ·{' '}
                <a
                  href={`${DEPOT}/commit/${entree.commit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lien"
                >
                  voir la modification
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Une erreur à signaler ?{' '}
        <Link href="/a-propos/" className="lien">
          La page À propos
        </Link>{' '}
        indique comment faire.
      </p>
    </div>
  );
}
