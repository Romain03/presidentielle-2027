import { LIBELLES_NATURE, type Nature } from '@/lib/schemas';

/**
 * Distingue une mesure inscrite dans un programme d'une simple déclaration
 * publique : forme pleine contre forme évidée, bordure continue contre
 * bordure discontinue, et libellé en clair.
 */
const STYLES: Record<Nature, { glyphe: string; classes: string }> = {
  programme_officiel: {
    glyphe: '▣',
    classes:
      'border-solid border-indigo-700/40 bg-indigo-50 text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-950/60 dark:text-indigo-100',
  },
  declaration_publique: {
    glyphe: '◻',
    classes:
      'border-dashed border-slate-500/50 bg-slate-50 text-slate-700 dark:border-slate-400/50 dark:bg-slate-800/60 dark:text-slate-200',
  },
};

export default function BadgeNature({ nature }: { nature: Nature }) {
  const { glyphe, classes } = STYLES[nature];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      <span aria-hidden="true">{glyphe}</span>
      {LIBELLES_NATURE[nature]}
    </span>
  );
}
