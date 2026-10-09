import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { derniereMiseAJour, statistiques } from '@/lib/data';

const VUES = [
  {
    href: '/candidats/',
    titre: 'Candidats',
    texte: 'La liste des candidats, filtrable par parti, famille politique et statut.',
  },
  {
    href: '/partis/',
    titre: 'Partis',
    texte: 'Chaque parti, ses candidats et son processus de désignation.',
  },
  {
    href: '/themes/',
    titre: 'Thèmes',
    texte: 'Pour un thème donné, les positions de tous les candidats côte à côte.',
  },
  {
    href: '/comparateur/',
    titre: 'Comparateur',
    texte: 'De 2 à 4 candidats, thème par thème, avec les points de divergence.',
  },
];

export default function Accueil() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Élection présidentielle française de 2027
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Qui sont les candidats, à quel parti ils appartiennent, et en quoi leurs programmes
          diffèrent — thème par thème. Chaque information renvoie à sa source et porte sa date.
        </p>
        <p className="max-w-2xl rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <strong className="font-semibold">Liste non définitive.</strong> Les parrainages ne sont
          pas encore déposés auprès du Conseil constitutionnel : aucune candidature n’est
          officiellement validée à ce stade. Plusieurs programmes ne sont pas encore publiés.
        </p>
      </section>

      <section aria-label="Les quatre vues">
        <ul className="grid gap-3 sm:grid-cols-2">
          {VUES.map((vue) => (
            <li key={vue.href}>
              <Link
                href={vue.href}
                className="block h-full rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <span className="block font-medium">{vue.titre}</span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                  {vue.texte}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="État des données" className="space-y-3">
        <h2 className="text-lg font-semibold">État des données</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { libelle: 'Candidats recensés', valeur: statistiques.candidats },
            { libelle: 'Dont au moins une proposition', valeur: statistiques.candidatsAvecProposition },
            { libelle: 'Propositions sourcées', valeur: statistiques.propositions },
            { libelle: 'Thèmes suivis', valeur: statistiques.themes },
          ].map((item) => (
            <div
              key={item.libelle}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <dt className="text-xs text-slate-600 dark:text-slate-400">{item.libelle}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{item.valeur}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Un candidat qui ne s’est pas exprimé sur un thème affiche « Position non communiquée » :
          aucune position n’est déduite ni extrapolée.{' '}
          <Link href="/methodologie/" className="underline underline-offset-2">
            Lire la méthodologie
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
