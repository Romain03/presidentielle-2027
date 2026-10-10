import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BadgeNature from '@/components/BadgeNature';
import BadgeStatut from '@/components/BadgeStatut';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import IndicateursGroupe from '@/components/IndicateursGroupe';
import LienRetour from '@/components/LienRetour';
import LienSource from '@/components/LienSource';
import Sources from '@/components/Sources';
import PortraitCandidat from '@/components/PortraitCandidat';
import { candidatsDuParti, getCandidat, getParti, nombrePropositions, partis } from '@/lib/data';
import { synthetiserGroupe } from '@/lib/synthese';
import { formaterDate, nomComplet, pluriel } from '@/lib/format';
import { LIBELLES_FAMILLE } from '@/lib/schemas';

const LIBELLES_DESIGNATION: Record<string, string> = {
  'primaire-ouverte': 'Primaire ouverte',
  'primaire-fermee': 'Primaire fermée',
  'vote-des-adherents': 'Vote des adhérents',
  'designation-par-instance': 'Désignation par une instance du parti',
  'candidature-autonome': 'Candidature autonome',
  'aucun-processus-connu': 'Aucun processus connu',
};

export function generateStaticParams() {
  return partis.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parti = getParti(slug);
  if (!parti) return { title: 'Parti introuvable' };
  return {
    title: `${parti.nom} (${parti.sigle})`,
    description: `Fondation, dirigeant, candidats et propositions de ${parti.nom} pour l’élection présidentielle de 2027.`,
  };
}

export default async function PageParti({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parti = getParti(slug);
  if (!parti) notFound();

  const membres = candidatsDuParti(parti.id);
  const synthese = synthetiserGroupe(membres);

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <LienRetour href="/partis/" libelle="Tous les partis" />
        <DerniereMiseAJour date={parti.derniere_verification} />
        <h1
          className="border-l-4 pl-4 text-3xl font-semibold sm:text-4xl"
          style={{ borderLeftColor: parti.couleur }}
        >
          {parti.nom}
          <span className="block text-lg font-normal text-stone-600 dark:text-stone-400">
            {parti.sigle}
          </span>
        </h1>

        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">Famille politique</dt>
            <dd className="text-sm">
              <Link href={`/familles/${parti.famille}/`} className="lien">
                {LIBELLES_FAMILLE[parti.famille]}
              </Link>
            </dd>
          </div>

          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">Fondation</dt>
            <dd className="space-y-0.5 text-sm">
              {parti.fondation === null ? (
                <span className="text-stone-600 dark:text-stone-400">Non renseignée</span>
              ) : (
                <>
                  <span className="block tabular-nums">{parti.fondation.annee}</span>
                  <LienSource source={parti.fondation.source} />
                </>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">Direction</dt>
            <dd className="space-y-0.5 text-sm">
              {parti.dirigeant === null ? (
                <span className="text-stone-600 dark:text-stone-400">Non renseignée</span>
              ) : (
                <>
                  <span className="block">
                    {parti.dirigeant.nom}
                    {parti.dirigeant.fonction !== null && (
                      <span className="text-stone-600 dark:text-stone-400">
                        {' '}
                        ({parti.dirigeant.fonction.toLowerCase()})
                      </span>
                    )}
                  </span>
                  <LienSource source={parti.dirigeant.source} />
                </>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">
              Nuance du ministère de l’Intérieur
            </dt>
            <dd className="text-sm">
              {parti.nuance_ministerielle !== null ? (
                `${parti.nuance_ministerielle.code} - ${parti.nuance_ministerielle.libelle}`
              ) : (
                <span className="text-stone-600 dark:text-stone-400">Non renseignée</span>
              )}
            </dd>
          </div>

          {parti.site_officiel !== null && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-stone-600 dark:text-stone-400">Site officiel</dt>
              <dd className="text-sm">
                <a
                  href={parti.site_officiel}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="lien"
                >
                  {parti.site_officiel.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <section aria-labelledby="positionnement" className="max-w-2xl space-y-2">
        <h2 id="positionnement" className="text-xl font-semibold">
          Positionnement déclaré
        </h2>
        {parti.positionnement_declare === null ? (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Aucune formulation du parti sur lui-même n’a été relevée et sourcée à ce stade. Le
            site ne reprend pas les caractérisations faites par des tiers - ni celles de la
            presse, ni celles des encyclopédies - parce qu’elles engagent leur auteur, pas le
            parti.
          </p>
        ) : (
          <div className="space-y-1.5">
            <blockquote className="border-l-2 border-stone-900/20 pl-3.5 font-serif text-lg italic leading-relaxed dark:border-white/20">
              «&nbsp;{parti.positionnement_declare.texte}&nbsp;»
            </blockquote>
            <LienSource source={parti.positionnement_declare.source} />
          </div>
        )}
      </section>

      <section aria-labelledby="designation" className="max-w-2xl space-y-2">
        <h2 id="designation" className="text-xl font-semibold">
          Processus de désignation
        </h2>
        {parti.processus_designation === null ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun processus de désignation sourcé n’est renseigné à ce stade.
          </p>
        ) : (
          <div className="space-y-1.5 text-sm">
            <p className="font-medium">
              {LIBELLES_DESIGNATION[parti.processus_designation.type] ??
                parti.processus_designation.type}
            </p>
            <p className="leading-relaxed text-stone-700 dark:text-stone-300">
              {parti.processus_designation.libelle}
            </p>
            {parti.processus_designation.dates.length > 0 && (
              <p className="text-stone-700 dark:text-stone-300">
                {parti.processus_designation.dates.map(formaterDate).join(' · ')}
              </p>
            )}
            <LienSource source={parti.processus_designation.source} />
          </div>
        )}
      </section>

      <section aria-labelledby="candidats" className="space-y-3">
        <h2 id="candidats" className="text-xl font-semibold">
          Candidats
        </h2>
        {membres.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun candidat rattaché à ce parti n’est recensé.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {membres.map((candidat) => {
              const nombre = nombrePropositions(candidat.id);
              return (
                <li key={candidat.id}>
                  <Link
                    href={`/candidats/${candidat.id}/`}
                    className="carte carte-interactive flex items-center gap-3.5 p-3.5"
                  >
                    <PortraitCandidat candidat={candidat} taille={44} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block font-medium">{nomComplet(candidat)}</span>
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <BadgeStatut statut={candidat.statut} />
                        <span className="text-xs text-stone-600 dark:text-stone-400">
                          {nombre} {pluriel(nombre, 'proposition', 'propositions')}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="propositions" className="space-y-4">
        <h2 id="propositions" className="text-xl font-semibold">
          Ce que proposent ses candidats
        </h2>

        {synthese.themesRenseignes.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun candidat de ce parti ne s’est exprimé de manière sourçable sur l’un des douze
            thèmes suivis.
          </p>
        ) : (
          <div className="space-y-4">
            {synthese.themesRenseignes.map((bloc) => (
              <section key={bloc.theme.id} className="carte p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-serif text-lg font-semibold">
                    <Link
                      href={`/themes/${bloc.theme.id}/`}
                      className="underline-offset-2 hover:underline"
                    >
                      {bloc.theme.libelle}
                    </Link>
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {bloc.exprimes}{' '}
                    {pluriel(bloc.exprimes, 'candidat s’est exprimé', 'candidats se sont exprimés')}
                    {membres.length > 1 && ` sur ${membres.length}`}
                  </p>
                </div>

                {bloc.indicateurs.length > 0 && (
                  <div className="mt-3.5">
                    <IndicateursGroupe indicateurs={bloc.indicateurs} />
                  </div>
                )}

                <ul className="mt-3.5 space-y-4">
                  {bloc.propositions.map((proposition) => {
                    const candidat = getCandidat(proposition.candidat_id);
                    return (
                      <li
                        key={proposition.id}
                        className="space-y-1.5 border-l-2 border-stone-900/10 pl-3.5 dark:border-white/12"
                      >
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          {membres.length > 1 && (
                            <Link
                              href={`/candidats/${proposition.candidat_id}/#${proposition.theme_id}`}
                              className="text-sm font-medium underline-offset-2 hover:underline"
                            >
                              {candidat ? nomComplet(candidat) : proposition.candidat_id}
                            </Link>
                          )}
                          <BadgeNature proposition={proposition} />
                        </p>
                        <p className="text-sm leading-relaxed">{proposition.resume}</p>
                        <Sources sources={proposition.sources} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {synthese.themesMuets.length > 0 && membres.length > 0 && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Aucun candidat de ce parti ne s’est exprimé de manière sourçable sur :{' '}
            {synthese.themesMuets.map((theme, i) => (
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
