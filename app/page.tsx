import Link from 'next/link';
import BadgeStatut from '@/components/BadgeStatut';
import CalendrierScrutin from '@/components/CalendrierScrutin';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import PortraitCandidat from '@/components/PortraitCandidat';
import {
  candidats,
  derniereMiseAJour,
  getParti,
  nombrePropositions,
  propositionsDuTheme,
  sourcesDesPropositions,
  statistiques,
  themes,
} from '@/lib/data';
import { nomListe, pluriel } from '@/lib/format';
import { enLice } from '@/lib/schemas';

const VUES = [
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
    texte: 'Chaque formation dans ses propres mots, ses candidats, sa désignation.',
  },
  {
    href: '/familles/',
    titre: 'Familles politiques',
    texte: 'Qui compose chaque famille, et où ses candidats convergent ou divergent.',
  },
];

export default function Accueil() {
  const engages = candidats.filter((c) => enLice(c.statut));
  const couverts = engages.filter((c) => nombrePropositions(c.id) > 0).length;
  const principal = sourcesDesPropositions.medias[0];
  // Denominateur : les citations, comme en methodologie. Le rapporter aux
  // propositions donnait 46 % contre 25 % pour la meme realite, une
  // proposition pouvant porter plusieurs sources.
  const partDuPrincipal = Math.round(
    (principal.nombre / sourcesDesPropositions.citations) * 100,
  );

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">
          Élection présidentielle française de 2027
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Qui se présente, sous quelle étiquette, et ce que chacun a dit - thème par thème. Chaque
          information renvoie à sa source et porte sa date.
        </p>

        {/*
          L'état de la collecte est annoncé avant le contenu, pas relégué en bas
          de page : lire « 18 candidats sur 31 » change la façon dont on lit
          tout le reste du site.
        */}
        <div className="max-w-2xl space-y-2 rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <p>
            <strong className="font-semibold">Ce site est une collecte en cours, pas un
            panorama.</strong>{' '}
            {statistiques.propositions} propositions ont été relevées, dans{' '}
            {sourcesDesPropositions.articles} articles de {sourcesDesPropositions.medias.length}{' '}
            sources - dont {partDuPrincipal} % des citations dans une seule. {couverts} des{' '}
            {statistiques.enLice}{' '}
            candidatures engagées ont au moins une position relevée.
          </p>
          <p>
            Ce qui manque est affiché comme manquant, jamais comblé. Les parrainages ne sont pas
            déposés et la plupart des programmes ne sont pas publiés.{' '}
            <Link href="/methodologie/#sources" className="lien">
              D’où viennent ces informations
            </Link>
            .
          </p>
        </div>
      </section>

      <CalendrierScrutin />

      {/*
        Les sujets passent avant la liste des candidatures. Sur mobile, les 31
        cartes s'empilent sur une colonne : « Entrer par un sujet » arrivait à
        3 000 px du haut, soit après les trois quarts de la page, alors que
        c'est la porte d'entrée la plus utile pour qui ne connaît pas encore
        les candidats.
      */}
      <section aria-labelledby="themes" className="space-y-4">
        <h2 id="themes" className="text-xl font-semibold">
          Entrer par un sujet
        </h2>
        <p className="max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Le nombre indique les positions relevées, pas l’importance du sujet : il mesure ce que le
          site a trouvé.
        </p>
        <ul className="flex flex-wrap gap-2">
          {themes.map((theme) => {
            const nombre = propositionsDuTheme(theme.id).length;
            return (
              <li key={theme.id}>
                <Link
                  href={`/themes/${theme.id}/`}
                  className="inline-flex items-baseline gap-2 rounded-full border border-stone-900/10 bg-white px-3.5 py-2 text-sm transition hover:border-stone-900/25 hover:bg-creme-ombre dark:border-nuit-bord dark:bg-nuit-clair dark:hover:border-stone-500"
                >
                  {theme.libelle}
                  <span
                    className={`tabular-nums text-xs ${
                      nombre === 0
                        ? 'text-stone-500 dark:text-stone-500'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {nombre === 0 ? 'rien relevé' : nombre}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="en-lice" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="en-lice" className="text-xl font-semibold">
            Les {statistiques.enLice} candidatures engagées
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {statistiques.pressentis} pressentis et {statistiques.retires} retraits sont recensés à
            part :{' '}
            <Link href="/candidats/" className="lien">
              voir les {statistiques.candidats} personnes recensées
            </Link>
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {engages.map((candidat) => {
            const parti = getParti(candidat.parti_id);
            const positions = nombrePropositions(candidat.id);
            return (
              <li key={candidat.id}>
                <Link
                  href={`/candidats/${candidat.id}/`}
                  className="carte carte-interactive relative flex h-full items-center gap-3 overflow-hidden p-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: parti?.couleur ?? 'transparent' }}
                  />
                  <span className="pl-1.5">
                    <PortraitCandidat candidat={candidat} taille={40} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {nomListe(candidat)}
                    </span>
                    <span className="block truncate text-xs text-stone-600 dark:text-stone-400">
                      {parti ? parti.sigle : 'Sans étiquette'} ·{' '}
                      {positions === 0
                        ? 'aucune position relevée'
                        : `${positions} ${pluriel(positions, 'position', 'positions')}`}
                    </span>
                  </span>
                  {candidat.statut === 'investi' && (
                    <span className="shrink-0">
                      <BadgeStatut statut={candidat.statut} />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="commencer" className="space-y-4">
        <h2 id="commencer" className="text-xl font-semibold">
          Autres entrées
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
    </div>
  );
}
