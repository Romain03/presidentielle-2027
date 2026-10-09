import { LIBELLES_STATUT, type Statut } from '@/lib/schemas';

/**
 * Statut du candidat. La couleur n'est jamais le seul vecteur d'information :
 * chaque statut porte aussi une forme distincte et son libellé en clair. Les
 * teintes restent sobres pour ne pas entrer en concurrence avec les couleurs
 * de parti, seules couleurs vives du site.
 */
const STYLES: Record<Statut, { glyphe: string; classes: string }> = {
  investi: {
    glyphe: '◆',
    classes:
      'bg-emerald-50 text-emerald-900 ring-emerald-800/20 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-400/25',
  },
  declare: {
    glyphe: '●',
    classes:
      'bg-creme-ombre text-stone-700 ring-stone-900/12 dark:bg-nuit dark:text-stone-300 dark:ring-white/12',
  },
  pressenti: {
    glyphe: '○',
    classes:
      'bg-amber-50 text-amber-900 ring-amber-800/20 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-400/25',
  },
  retire: {
    glyphe: '✕',
    classes:
      'bg-transparent text-stone-600 ring-stone-900/10 dark:text-stone-400 dark:ring-white/10',
  },
};

export default function BadgeStatut({ statut }: { statut: Statut }) {
  const { glyphe, classes } = STYLES[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${classes}`}
    >
      <span aria-hidden="true" className="text-[0.65em]">
        {glyphe}
      </span>
      {LIBELLES_STATUT[statut]}
    </span>
  );
}
