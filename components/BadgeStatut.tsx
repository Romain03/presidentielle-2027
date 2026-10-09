import { LIBELLES_STATUT, type Statut } from '@/lib/schemas';

/**
 * Statut du candidat. La couleur n'est jamais le seul vecteur d'information :
 * chaque statut porte aussi une forme distincte et son libellé en clair.
 */
const STYLES: Record<Statut, { glyphe: string; classes: string }> = {
  investi: {
    glyphe: '◆',
    classes:
      'bg-emerald-50 text-emerald-900 ring-emerald-700/30 dark:bg-emerald-950/60 dark:text-emerald-100 dark:ring-emerald-400/30',
  },
  declare: {
    glyphe: '●',
    classes:
      'bg-sky-50 text-sky-900 ring-sky-700/30 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-400/30',
  },
  pressenti: {
    glyphe: '○',
    classes:
      'bg-amber-50 text-amber-900 ring-amber-700/30 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-400/30',
  },
  retire: {
    glyphe: '✕',
    classes:
      'bg-slate-100 text-slate-700 ring-slate-500/30 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/30',
  },
};

export default function BadgeStatut({ statut }: { statut: Statut }) {
  const { glyphe, classes } = STYLES[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${classes}`}
    >
      <span aria-hidden="true">{glyphe}</span>
      {LIBELLES_STATUT[statut]}
    </span>
  );
}
