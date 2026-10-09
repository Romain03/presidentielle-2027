import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LienRetour from '@/components/LienRetour';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import PositionsDuTheme, { type LigneTheme } from '@/components/PositionsDuTheme';
import { candidats, derniereMiseAJour, getTheme, propositionsDuCandidat, themes } from '@/lib/data';
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

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <LienRetour href="/themes/" libelle="Tous les thèmes" />
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{theme.libelle}</h1>
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">{theme.description}</p>
      </header>

      <PositionsDuTheme lignes={lignes} />
    </article>
  );
}
