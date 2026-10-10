import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LienRetour from '@/components/LienRetour';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import PositionsDuTheme, { type LigneTheme } from '@/components/PositionsDuTheme';
import { candidats, derniereMiseAJour, getTheme, propositionsDuCandidat, themes } from '@/lib/data';
import { pluriel } from '@/lib/format';
import { resumeDuCandidat } from '@/lib/vues';

export function generateStaticParams() {
  return themes.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) return { title: 'Thème introuvable' };
  return {
    title: theme.libelle,
    description: `Positions des candidats à l’élection présidentielle de 2027 sur le thème « ${theme.libelle} ».`,
  };
}

/** En dessous, le thème est signalé comme en cours de collecte. */
const SEUIL_COLLECTE = 4;

export default async function PageTheme({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) notFound();

  // Tous les candidats figurent dans le tableau, y compris ceux sans position :
  // l'absence est affichée, jamais silencieuse.
  const lignes: LigneTheme[] = candidats.map((candidat) => ({
    candidat: resumeDuCandidat(candidat.id)!,
    propositions: propositionsDuCandidat(candidat.id, theme.id),
  }));
  const releves = lignes.reduce((total, ligne) => total + ligne.propositions.length, 0);

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <LienRetour href="/themes/" libelle="Tous les thèmes" />
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{theme.libelle}</h1>
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">{theme.description}</p>

        {/*
          Un thème peu couvert ne dit rien des programmes : il dit que les
          articles dépouillés n'en ont pas parlé. Le préciser sur le thème
          lui-même, et pas seulement dans la méthodologie.
        */}
        {releves < SEUIL_COLLECTE && (
          <p className="max-w-2xl rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
            <strong className="font-semibold">Collecte en cours sur ce thème.</strong>{' '}
            {releves === 0
              ? 'Aucune position n’y a encore été relevée.'
              : `${releves} ${pluriel(releves, 'position y a été relevée', 'positions y ont été relevées')}.`}{' '}
            Les propositions du site proviennent d’articles de presse, et ce sujet y est peu
            traité : l’absence mesure la couverture de ces articles, pas le silence des candidats.
          </p>
        )}
      </header>

      <PositionsDuTheme lignes={lignes} />
    </article>
  );
}
