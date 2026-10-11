import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BoutonPartager from '@/components/BoutonPartager';
import LienRetour from '@/components/LienRetour';
import BadgeStatut from '@/components/BadgeStatut';
import BlocProposition from '@/components/BlocProposition';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import LienSource from '@/components/LienSource';
import Sources from '@/components/Sources';
import CreditPhoto from '@/components/CreditPhoto';
import PastilleParti from '@/components/PastilleParti';
import PortraitCandidat from '@/components/PortraitCandidat';
import ParcoursCandidat from '@/components/ParcoursCandidat';
import Reperes from '@/components/Reperes';
import { candidats, getCandidat, getParti, propositionsDuCandidat, themes } from '@/lib/data';
import { formaterDate, nomComplet, elider } from '@/lib/format';

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
    description: `Parcours, parti, soutiens et positions par thème ${elider('de', nomComplet(candidat))} pour l’élection présidentielle de 2027.`,
  };
}

export default async function PageCandidat({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const candidat = getCandidat(slug);
  if (!candidat) notFound();

  const parti = getParti(candidat.parti_id);
  const couverts = themes.filter((t) => propositionsDuCandidat(candidat.id, t.id).length > 0);
  const muets = themes.filter(
    (theme) => propositionsDuCandidat(candidat.id, theme.id).length === 0,
  );

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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <span
            className="block w-fit shrink-0 rounded-full p-1"
            style={parti ? { boxShadow: `inset 0 0 0 3px ${parti.couleur}` } : undefined}
          >
            <PortraitCandidat candidat={candidat} taille={112} prioritaire />
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
            {candidat.statut_sources.length > 0 && <Sources sources={candidat.statut_sources} />}
          </div>
        </div>

        {candidat.photo !== null && <CreditPhoto photo={candidat.photo} />}

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

      <section aria-labelledby="positions" className="space-y-4">
        <h2 id="positions" className="text-lg font-semibold">
          Positions par thème
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {couverts.length} des {themes.length} thèmes suivis portent une position relevée. Les
          autres sont listés à la fin : une case vide est une lacune de ce site, pas un silence du
          candidat.
        </p>

        {/*
          Les thèmes sans position sont regroupés au lieu d'être intercalés un
          par un. Intercalés, ils doublaient la longueur de la page et il
          fallait franchir dix « Rien relevé » pour aller d'une position à la
          suivante. Chaque thème muet garde son ancre : les fiches de parti
          pointent vers /candidats/x/#theme.
        */}
        <div className="space-y-6">
          {themes
            .filter((theme) => propositionsDuCandidat(candidat.id, theme.id).length > 0)
            .map((theme) => (
              <section key={theme.id} id={theme.id} className="space-y-2.5">
                <h3 className="font-medium">
                  <Link href={`/themes/${theme.id}/`} className="underline-offset-2 hover:underline">
                    {theme.libelle}
                  </Link>
                </h3>
                {propositionsDuCandidat(candidat.id, theme.id).map((proposition) => (
                  <BlocProposition key={proposition.id} proposition={proposition} />
                ))}
              </section>
            ))}
        </div>

        {muets.length > 0 && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Rien relevé par ce site à ce jour sur{' '}
            {muets.map((theme, i) => (
              <span key={theme.id} id={theme.id}>
                {i > 0 && (i === muets.length - 1 ? ' et ' : ', ')}
                <Link href={`/themes/${theme.id}/`} className="lien">
                  {theme.libelle.toLowerCase()}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </section>
      <section aria-labelledby="reperes" className="space-y-3">
        <h2 id="reperes" className="text-lg font-semibold">
          Repères
        </h2>
        <Reperes biographie={candidat.biographie} reference={candidat.derniere_verification} />
      </section>

      <section aria-labelledby="parcours" className="space-y-3">
        <h2 id="parcours" className="text-lg font-semibold">
          Parcours
        </h2>
        <ParcoursCandidat jalons={candidat.parcours} />
      </section>

      <section aria-labelledby="soutiens" className="space-y-3">
        <h2 id="soutiens" className="text-lg font-semibold">
          Soutiens{candidat.soutiens.length > 0 && ` (${candidat.soutiens.length})`}
        </h2>
        {candidat.soutiens.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun soutien sourcé n’est renseigné à ce stade.
          </p>
        ) : (
          /* Replié au-delà de quelques noms : cinquante-quatre soutiens
             repoussaient tout le reste de la fiche hors de l'écran. */
          <details open={candidat.soutiens.length <= 8}>
            <summary className="cursor-pointer text-sm text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-400 dark:decoration-stone-600 dark:hover:text-stone-100">
              Afficher les {candidat.soutiens.length} soutiens recensés
            </summary>
            <ul className="mt-3 space-y-2">
              {candidat.soutiens.map((soutien) => (
                <li key={soutien.libelle} className="space-y-1 text-sm">
                  <span className="block text-stone-700 dark:text-stone-300">
                    {soutien.libelle}
                  </span>
                  <LienSource source={soutien.source} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

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

    </article>
  );
}
