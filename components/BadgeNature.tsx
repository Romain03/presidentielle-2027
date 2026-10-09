import { LIBELLES_NATURE, type Nature } from '@/lib/schemas';

/**
 * Distingue une mesure inscrite dans un programme d'une simple déclaration
 * publique. Trois signaux redondants : la forme du glyphe, le remplissage
 * contre le contour discontinu, et le libellé en clair. Aucune couleur n'est
 * nécessaire pour faire la différence.
 */
const STYLES: Record<Nature, { glyphe: string; classes: string }> = {
  programme_officiel: {
    glyphe: '▣',
    classes: 'border-transparent bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900',
  },
  declaration_publique: {
    glyphe: '◻',
    classes:
      'border-dashed border-stone-900/30 bg-transparent text-stone-600 dark:border-white/30 dark:text-stone-300',
  },
};

export default function BadgeNature({ nature }: { nature: Nature }) {
  const { glyphe, classes } = STYLES[nature];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      <span aria-hidden="true" className="text-[0.75em]">
        {glyphe}
      </span>
      {LIBELLES_NATURE[nature]}
    </span>
  );
}
