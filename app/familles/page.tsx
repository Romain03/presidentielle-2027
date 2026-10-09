import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { derniereMiseAJour } from '@/lib/data';
import { famillesPeuplees } from '@/lib/familles';
import { pluriel } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Familles politiques',
  description:
    'Composition de chaque famille politique en vue de l’élection présidentielle de 2027, et ce que ses candidats ont déclaré, thème par thème.',
};

export default function PageFamilles() {
  const familles = famillesPeuplees();

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold sm:text-4xl">Familles politiques</h1>
        <p className="max-w-2xl leading-relaxed text-stone-700 dark:text-stone-300">
          Qui compose chaque famille, et ce que ses candidats ont déclaré sur chaque thème. Quand
          plusieurs d’entre eux avancent le même chiffre, il est regroupé sur une seule ligne :
          c’est le moyen le plus direct de voir où une famille converge et où elle se divise.
        </p>
        <p className="max-w-2xl rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <strong className="font-semibold">Ces regroupements sont une convention de ce site</strong>,
          construite à partir des nuances du ministère de l’Intérieur et expliquée dans la{' '}
          <Link href="/methodologie/" className="lien">
            méthodologie
          </Link>
          . Ces pages décrivent qui est dans une famille et ce que ses membres disent. Elles ne
          définissent pas ce qu’une famille « pense » : appartenir à la même famille n’implique
          aucun accord, et deux candidats peuvent annoncer le même chiffre pour des raisons
          opposées.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {familles.map((famille) => (
          <li key={famille.famille}>
            <Link
              href={`/familles/${famille.famille}/`}
              className="carte carte-interactive group flex h-full items-baseline gap-3 p-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-xl font-semibold">{famille.libelle}</span>
                <span className="mt-1.5 block text-sm text-stone-600 dark:text-stone-400">
                  {famille.partis.length} {pluriel(famille.partis.length, 'parti', 'partis')} ·{' '}
                  {famille.candidats.length}{' '}
                  {pluriel(famille.candidats.length, 'candidat', 'candidats')} ·{' '}
                  {famille.nombrePropositions}{' '}
                  {pluriel(famille.nombrePropositions, 'proposition', 'propositions')}
                </span>
                <span className="mt-1 block text-xs text-stone-600 dark:text-stone-400">
                  {famille.themesRenseignes.length}{' '}
                  {pluriel(
                    famille.themesRenseignes.length,
                    'thème renseigné',
                    'thèmes renseignés',
                  )}{' '}
                  sur 12
                </span>
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 dark:text-stone-600"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
