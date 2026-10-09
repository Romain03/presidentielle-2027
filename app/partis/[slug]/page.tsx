import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LienRetour from '@/components/LienRetour';
import BadgeStatut from '@/components/BadgeStatut';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import LienSource from '@/components/LienSource';
import { candidatsDuParti, getParti, nombrePropositions, partis } from '@/lib/data';
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
    description: `Candidats, positionnement et processus de désignation de ${parti.nom} pour l’élection présidentielle de 2027.`,
  };
}

export default async function PageParti({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parti = getParti(slug);
  if (!parti) notFound();

  const candidats = candidatsDuParti(parti.id);

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <LienRetour href="/partis/" libelle="Tous les partis" />
        <DerniereMiseAJour date={parti.derniere_verification} />
        <h1
          className="border-l-4 pl-3 text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{ borderLeftColor: parti.couleur }}
        >
          {parti.nom} ({parti.sigle})
        </h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">Famille politique</dt>
            <dd>
              <Link href={`/familles/${parti.famille}/`} className="lien">
                {LIBELLES_FAMILLE[parti.famille]}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-600 dark:text-stone-400">
              Nuance du ministère de l’Intérieur
            </dt>
            <dd>
              {parti.nuance_ministerielle !== null
                ? `${parti.nuance_ministerielle.code} - ${parti.nuance_ministerielle.libelle}`
                : 'Non renseignée'}
            </dd>
          </div>
          {parti.site_officiel !== null && (
            <div>
              <dt className="text-xs text-stone-600 dark:text-stone-400">Site officiel</dt>
              <dd>
                <a
                  href={parti.site_officiel}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2"
                >
                  {parti.site_officiel.replace(/^https?:\/\//, '')}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <section aria-labelledby="positionnement" className="space-y-2">
        <h2 id="positionnement" className="text-lg font-semibold">
          Positionnement déclaré
        </h2>
        {parti.positionnement_declare === null ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun positionnement formulé par le parti lui-même n’a été relevé et sourcé à ce stade.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-stone-700 dark:text-stone-300">
              «&nbsp;{parti.positionnement_declare.texte}&nbsp;»
            </p>
            <LienSource source={parti.positionnement_declare.source} />
          </div>
        )}
      </section>

      <section aria-labelledby="designation" className="space-y-2">
        <h2 id="designation" className="text-lg font-semibold">
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
            <p className="text-stone-700 dark:text-stone-300">
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
        <h2 id="candidats" className="text-lg font-semibold">
          Candidats
        </h2>
        {candidats.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Aucun candidat rattaché à ce parti n’est recensé.
          </p>
        ) : (
          <ul className="space-y-2">
            {candidats.map((candidat) => {
              const nombre = nombrePropositions(candidat.id);
              return (
                <li key={candidat.id}>
                  <Link
                    href={`/candidats/${candidat.id}/`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 carte carte-interactive p-3 text-sm"
                  >
                    <span className="font-medium">{nomComplet(candidat)}</span>
                    <BadgeStatut statut={candidat.statut} />
                    <span className="text-stone-600 dark:text-stone-400">
                      {nombre} {pluriel(nombre, 'proposition sourcée', 'propositions sourcées')}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
