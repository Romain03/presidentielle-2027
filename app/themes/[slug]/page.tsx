import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LienRetour from '@/components/LienRetour';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import PositionsDuTheme, { type LigneTheme } from '@/components/PositionsDuTheme';
import { candidats, derniereMiseAJour, getTheme, propositionsDuCandidat, themes } from '@/lib/data';
import { pluriel } from '@/lib/format';
import { enLice } from '@/lib/schemas';
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
  /*
    Deux comptes, et non un seul. Le tableau masque par défaut les pressentis et
    les retraits : annoncer « 1 position relevée » puis afficher un tableau vide
    sous « 0 sur 27 » était contradictoire pour le lecteur, alors que les deux
    chiffres étaient justes - ils ne portaient simplement pas sur le même
    ensemble. C'est le cas de la santé et du logement, dont les seules positions
    relevées appartiennent à des battus de la primaire socialiste.
  */
  const relevesEnLice = lignes
    .filter((ligne) => enLice(ligne.candidat.statut))
    .reduce((total, ligne) => total + ligne.propositions.length, 0);
  const releves = lignes.reduce((total, ligne) => total + ligne.propositions.length, 0);
  const relevesHorsLice = releves - relevesEnLice;

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
            {relevesEnLice === 0
              ? 'Aucune position n’y a été relevée chez les candidatures encore en course.'
              : `${relevesEnLice} ${pluriel(relevesEnLice, 'position y a été relevée', 'positions y ont été relevées')} chez les candidatures encore en course.`}{' '}
            {relevesHorsLice > 0 && (
              <>
                {relevesHorsLice}{' '}
                {pluriel(
                  relevesHorsLice,
                  'autre appartient à une candidature retirée ou pressentie, et n’apparaît qu’en décochant le filtre du tableau.',
                  'autres appartiennent à des candidatures retirées ou pressenties, et n’apparaissent qu’en décochant le filtre du tableau.',
                )}{' '}
              </>
            )}
            Les propositions du site proviennent d’articles de presse, et ce sujet y est peu
            traité : l’absence mesure la couverture de ces articles, pas le silence des candidats.
          </p>
        )}
      </header>

      <PositionsDuTheme lignes={lignes} />
    </article>
  );
}
