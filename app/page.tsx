import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { derniereMiseAJour, statistiques, themes } from '@/lib/data';

const VUES = [
  {
    href: '/candidats/',
    titre: 'Candidats',
    texte: 'Qui se présente, sous quelle étiquette, et où en est sa candidature.',
  },
  {
    href: '/themes/',
    titre: 'Thèmes',
    texte: 'Sur un sujet donné, ce que chacun propose, côte à côte.',
  },
  {
    href: '/comparateur/',
    titre: 'Comparateur',
    texte: 'Deux à quatre candidats, thème par thème, et ce qui les sépare.',
  },
  {
    href: '/partis/',
    titre: 'Partis',
    texte: 'Chaque formation, ses candidats, et comment elle les désigne.',
  },
  {
    href: '/familles/',
    titre: 'Familles politiques',
    texte: 'Qui compose chaque famille, et où ses candidats convergent ou divergent.',
  },
];

export default function Accueil() {
  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">
          Élection présidentielle française de 2027
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Qui sont les candidats, à quel parti ils appartiennent, et en quoi leurs programmes
          diffèrent - thème par thème. Chaque information renvoie à sa source et porte sa date.
        </p>
        <p className="max-w-2xl rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <strong className="font-semibold">Cette liste n’est pas définitive.</strong> Les
          parrainages ne sont pas encore déposés auprès du Conseil constitutionnel, et la plupart
          des programmes ne sont pas publiés. Ce qui manque est affiché comme manquant, jamais
          comblé.
        </p>
      </section>

      <section aria-labelledby="commencer" className="space-y-4">
        <h2 id="commencer" className="text-xl font-semibold">
          Par où commencer
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {VUES.map((vue) => (
            <li key={vue.href}>
              <Link
                href={vue.href}
                className="carte carte-interactive group flex h-full items-baseline gap-3 p-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl font-semibold">{vue.titre}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                    {vue.texte}
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
      </section>

      <section aria-labelledby="themes" className="space-y-4">
        <h2 id="themes" className="text-xl font-semibold">
          Entrer par un sujet
        </h2>
        <ul className="flex flex-wrap gap-2">
          {themes.map((theme) => (
            <li key={theme.id}>
              <Link
                href={`/themes/${theme.id}/`}
                className="inline-block rounded-full border border-stone-900/10 bg-white px-3.5 py-1.5 text-sm transition hover:border-stone-900/25 hover:bg-creme-ombre dark:border-nuit-bord dark:bg-nuit-clair dark:hover:border-stone-500"
              >
                {theme.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="etat" className="space-y-4">
        <h2 id="etat" className="text-xl font-semibold">
          État des données
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { libelle: 'Candidats recensés', valeur: statistiques.candidats },
            {
              libelle: 'Dont au moins une proposition',
              valeur: statistiques.candidatsAvecProposition,
            },
            { libelle: 'Propositions sourcées', valeur: statistiques.propositions },
            { libelle: 'Thèmes suivis', valeur: statistiques.themes },
          ].map((item) => (
            <div key={item.libelle} className="carte p-4">
              <dd className="font-serif text-3xl font-semibold tabular-nums">{item.valeur}</dd>
              <dt className="mt-1 text-xs leading-snug text-stone-600 dark:text-stone-400">
                {item.libelle}
              </dt>
            </div>
          ))}
        </dl>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Un candidat qui ne s’est pas exprimé sur un thème affiche « Position non communiquée » :
          aucune position n’est déduite ni extrapolée.{' '}
          <Link href="/methodologie/" className="lien">
            Lire la méthodologie
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
