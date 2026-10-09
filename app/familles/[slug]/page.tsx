import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BadgeNature from '@/components/BadgeNature';
import BadgeStatut from '@/components/BadgeStatut';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import IndicateursFamille from '@/components/IndicateursFamille';
import LienRetour from '@/components/LienRetour';
import LienSource from '@/components/LienSource';
import PortraitCandidat from '@/components/PortraitCandidat';
import { candidatsDuParti, derniereMiseAJour, getCandidat } from '@/lib/data';
import { synthetiserFamille } from '@/lib/familles';
import { nomComplet, pluriel } from '@/lib/format';
import { FAMILLES, Famille, LIBELLES_FAMILLE } from '@/lib/schemas';

/** Nuances du ministère regroupées sous chaque famille, comme sur la Méthodologie. */
const NUANCES: Record<string, string> = {
  'extreme-gauche': 'EXG',
  gauche: 'FI, COM, SOC, RDG, UG, DVG',
  ecologistes: 'VEC, ECO',
  centre: 'ENS, UDI, DVC',
  droite: 'LR, DVD, DSV',
  'extreme-droite': 'RN, REC, UXD, EXD',
  regionalistes: 'REG',
  divers: 'DIV et nuances non classées',
};

export function generateStaticParams() {
  return FAMILLES.map((famille) => ({ slug: famille }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resultat = Famille.safeParse(slug);
  if (!resultat.success) return { title: 'Famille introuvable' };
  return {
    title: LIBELLES_FAMILLE[resultat.data],
    description: `Partis, candidats et positions de la famille « ${LIBELLES_FAMILLE[resultat.data]} » pour l’élection présidentielle de 2027.`,
  };
}

export default async function PageFamille({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resultat = Famille.safeParse(slug);
  if (!resultat.success) notFound();

  const f = synthetiserFamille(resultat.data);

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <LienRetour href="/familles/" libelle="Toutes les familles" />
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold sm:text-4xl">{f.libelle}</h1>
        <p className="text-stone-700 dark:text-stone-300">
          {f.partis.length} {pluriel(f.partis.length, 'parti', 'partis')} ·{' '}
          {f.candidats.length} {pluriel(f.candidats.length, 'candidat', 'candidats')} ·{' '}
          {f.nombrePropositions}{' '}
          {pluriel(f.nombrePropositions, 'proposition sourcée', 'propositions sourcées')}
        </p>
        <p className="max-w-2xl rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          Cette page dit <strong className="font-semibold">qui compose cette famille et ce que ses
          candidats ont déclaré</strong>. Elle ne dit pas ce que la famille « pense » :
          l’appartenance n’implique aucun accord entre ses membres. Le regroupement est une
          convention de ce site, bâtie sur les nuances du ministère de l’Intérieur -{' '}
          <span className="whitespace-nowrap">{NUANCES[f.famille]}</span> - et détaillée dans la{' '}
          <Link href="/methodologie/" className="lien">
            méthodologie
          </Link>
          .
        </p>
      </header>

      <section aria-labelledby="partis" className="space-y-3">
        <h2 id="partis" className="text-xl font-semibold">
          Partis
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {f.partis.map((parti) => {
            const leurs = candidatsDuParti(parti.id);
            return (
              <li key={parti.id}>
                <Link
                  href={`/partis/${parti.id}/`}
                  className="carte carte-interactive relative flex items-baseline gap-3 overflow-hidden p-3.5 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: parti.couleur }}
                  />
                  <span className="flex-1 pl-1.5">
                    <span className="font-medium">
                      {parti.nom} ({parti.sigle})
                    </span>
                    <span className="block text-xs text-stone-600 dark:text-stone-400">
                      {leurs.length === 0
                        ? 'Aucun candidat recensé'
                        : leurs.map((c) => nomComplet(c)).join(', ')}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {f.candidats.length > 0 && (
        <section aria-labelledby="candidats" className="space-y-3">
          <h2 id="candidats" className="text-xl font-semibold">
            Candidats
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {f.candidats.map((candidat) => (
              <li key={candidat.id}>
                <Link
                  href={`/candidats/${candidat.id}/`}
                  className="carte carte-interactive flex items-center gap-3 p-3"
                >
                  <PortraitCandidat candidat={candidat} taille={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{nomComplet(candidat)}</span>
                    <span className="mt-0.5 block">
                      <BadgeStatut statut={candidat.statut} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="positions" className="space-y-4">
        <h2 id="positions" className="text-xl font-semibold">
          Ce que disent ses candidats
        </h2>

        {f.themesRenseignes.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun candidat de cette famille ne s’est exprimé de manière sourçable sur l’un des
            douze thèmes suivis.
          </p>
        ) : (
          <div className="space-y-4">
            {f.themesRenseignes.map((bloc) => (
              <section key={bloc.theme.id} className="carte p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-serif text-lg font-semibold">
                    <Link href={`/themes/${bloc.theme.id}/`} className="underline-offset-2 hover:underline">
                      {bloc.theme.libelle}
                    </Link>
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {bloc.exprimes}{' '}
                    {pluriel(bloc.exprimes, 'candidat s’est exprimé', 'candidats se sont exprimés')}{' '}
                    sur {f.candidats.length}
                  </p>
                </div>

                {bloc.indicateurs.length > 0 && (
                  <div className="mt-3.5">
                    <IndicateursFamille indicateurs={bloc.indicateurs} />
                  </div>
                )}

                <details className="group mt-3.5">
                  <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                    <span aria-hidden="true" className="transition-transform group-open:rotate-90">
                      ›
                    </span>
                    Lire les {bloc.propositions.length}{' '}
                    {pluriel(bloc.propositions.length, 'proposition', 'propositions')}
                  </summary>
                  <ul className="mt-3 space-y-4">
                    {bloc.propositions.map((proposition) => {
                      const candidat = getCandidat(proposition.candidat_id);
                      return (
                        <li
                          key={proposition.id}
                          className="space-y-1.5 border-l-2 border-stone-900/10 pl-3.5 dark:border-white/12"
                        >
                          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <Link
                              href={`/candidats/${proposition.candidat_id}/#${proposition.theme_id}`}
                              className="text-sm font-medium underline-offset-2 hover:underline"
                            >
                              {candidat ? nomComplet(candidat) : proposition.candidat_id}
                            </Link>
                            <BadgeNature nature={proposition.nature} />
                          </p>
                          <p className="text-sm leading-relaxed">{proposition.resume}</p>
                          <LienSource source={proposition.source} />
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </section>
            ))}
          </div>
        )}

        {f.themesMuets.length > 0 && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Aucun candidat de cette famille ne s’est exprimé de manière sourçable sur :{' '}
            {f.themesMuets.map((theme, i) => (
              <span key={theme.id}>
                {i > 0 && ', '}
                <Link href={`/themes/${theme.id}/`} className="lien">
                  {theme.libelle.toLowerCase()}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </section>
    </article>
  );
}
