import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BoutonPartager from '@/components/BoutonPartager';
import LienRetour from '@/components/LienRetour';
import BadgeStatut from '@/components/BadgeStatut';
import BlocProposition from '@/components/BlocProposition';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import LienSource from '@/components/LienSource';
import PastilleParti from '@/components/PastilleParti';
import PositionNonCommuniquee from '@/components/PositionNonCommuniquee';
import { candidats, getCandidat, getParti, propositionsDuCandidat, themes } from '@/lib/data';
import { formaterDate, initiales, nomComplet } from '@/lib/format';

export function generateStaticParams() {
  return candidats.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const candidat = getCandidat(slug);
  if (!candidat) return { title: 'Candidat introuvable' };
  return {
    title: nomComplet(candidat),
    description: `Parcours, parti, soutiens et positions par thème de ${nomComplet(candidat)} pour l’élection présidentielle de 2027.`,
  };
}

export default async function PageCandidat({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const candidat = getCandidat(slug);
  if (!candidat) notFound();

  const parti = getParti(candidat.parti_id);

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LienRetour href="/candidats/" libelle="Tous les candidats" />
          <BoutonPartager
            titre={`${nomComplet(candidat)} - positions pour la présidentielle 2027`}
            chemin={`/candidats/${candidat.id}/`}
          />
        </div>
        <DerniereMiseAJour date={candidat.derniere_verification} />

        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-semibold tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-300"
            style={parti ? { boxShadow: `inset 0 0 0 3px ${parti.couleur}` } : undefined}
          >
            {initiales(candidat)}
          </span>
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {nomComplet(candidat)}
            </h1>
            <PastilleParti parti={parti} avecFamille />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <BadgeStatut statut={candidat.statut} />
              <span className="text-xs text-stone-600 dark:text-stone-400">
                {candidat.statut_date !== null
                  ? `le ${formaterDate(candidat.statut_date)}`
                  : 'date non vérifiée'}
              </span>
            </div>
            {candidat.statut_source !== null && <LienSource source={candidat.statut_source} />}
          </div>
        </div>

        {candidat.liens_officiels.length > 0 && (
          <nav aria-label="Liens officiels">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {candidat.liens_officiels.map((lien) => (
                <li key={lien.url}>
                  <a
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline decoration-stone-300 underline-offset-2 hover:decoration-stone-700 dark:decoration-stone-600"
                  >
                    {lien.libelle}
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (nouvelle fenêtre)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {candidat.precisions.length > 0 && (
        <section aria-labelledby="precisions" className="space-y-3">
          <h2 id="precisions" className="text-lg font-semibold">
            Précisions factuelles
          </h2>
          <ul className="space-y-3">
            {candidat.precisions.map((precision) => (
              <li
                key={precision.source.url + precision.libelle.slice(0, 20)}
                className="space-y-1.5 carte p-4 text-sm"
              >
                <p className="leading-relaxed text-stone-700 dark:text-stone-300">
                  {precision.libelle}
                </p>
                <LienSource source={precision.source} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="parcours" className="space-y-3">
        <h2 id="parcours" className="text-lg font-semibold">
          Parcours
        </h2>
        {candidat.parcours.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun jalon sourcé n’est renseigné à ce stade.
          </p>
        ) : (
          <ul className="space-y-3">
            {candidat.parcours.map((jalon) => (
              <li key={`${jalon.annee}-${jalon.libelle}`} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 tabular-nums font-medium">{jalon.annee}</span>
                <span className="space-y-1">
                  <span className="block text-stone-700 dark:text-stone-300">{jalon.libelle}</span>
                  {jalon.source !== null && <LienSource source={jalon.source} />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="soutiens" className="space-y-3">
        <h2 id="soutiens" className="text-lg font-semibold">
          Soutiens
        </h2>
        {candidat.soutiens.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun soutien sourcé n’est renseigné à ce stade.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidat.soutiens.map((soutien) => (
              <li key={soutien.libelle} className="space-y-1 text-sm">
                <span className="block text-stone-700 dark:text-stone-300">{soutien.libelle}</span>
                <LienSource source={soutien.source} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="positions" className="space-y-4">
        <h2 id="positions" className="text-lg font-semibold">
          Positions par thème
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Les douze thèmes suivis sont affichés dans l’ordre alphabétique, y compris ceux sur
          lesquels le candidat ne s’est pas exprimé.
        </p>
        <div className="space-y-6">
          {themes.map((theme) => {
            const propositions = propositionsDuCandidat(candidat.id, theme.id);
            return (
              <section key={theme.id} id={theme.id} className="space-y-2.5">
                <h3 className="font-medium">
                  <Link href={`/themes/${theme.id}/`} className="underline-offset-2 hover:underline">
                    {theme.libelle}
                  </Link>
                </h3>
                {propositions.length === 0 ? (
                  <PositionNonCommuniquee />
                ) : (
                  propositions.map((proposition) => (
                    <BlocProposition key={proposition.id} proposition={proposition} />
                  ))
                )}
              </section>
            );
          })}
        </div>
      </section>
    </article>
  );
}
