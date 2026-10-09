import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { candidats, derniereMiseAJour, propositionsDuTheme, themes } from '@/lib/data';
import { pluriel } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Thèmes',
  description:
    'Les douze thèmes suivis pour l’élection présidentielle de 2027, avec les positions de tous les candidats.',
};

export default function PageThemes() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Thèmes</h1>
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">
          Ordre alphabétique. Pour chaque thème, les positions de tous les candidats sont
          présentées côte à côte, avec la même structure et le même niveau de détail.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => {
          const nombre = new Set(propositionsDuTheme(theme.id).map((p) => p.candidat_id)).size;
          return (
            <li key={theme.id}>
              <Link
                href={`/themes/${theme.id}/`}
                className="block h-full carte carte-interactive p-4"
              >
                <span className="block font-medium">{theme.libelle}</span>
                <span className="mt-1 block text-sm text-stone-600 dark:text-stone-400">
                  {theme.description}
                </span>
                <span className="mt-2 block text-xs text-stone-600 dark:text-stone-400">
                  {nombre} {pluriel(nombre, 'candidat s’est exprimé', 'candidats se sont exprimés')}{' '}
                  sur {candidats.length}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
