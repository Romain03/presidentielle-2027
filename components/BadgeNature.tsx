import { LIBELLES_NATURE, type Proposition } from '@/lib/schemas';

/**
 * Qualifie ce qu'est une proposition, d'après sa nature *et* sa source.
 *
 * Le badge « Mesure de programme » affirmait plus que la source ne prouve :
 * les neuf mesures ainsi étiquetées sont toutes sourcées à un article de
 * presse, pas au programme lui-même. Un troisième niveau le dit. La règle est
 * calculée, jamais saisie : le badge ne peut donc pas se désynchroniser de la
 * source.
 *
 * Trois signaux redondants, comme ailleurs : la forme du glyphe, le
 * remplissage contre le contour discontinu, et le libellé en clair. Aucune
 * couleur n'est nécessaire pour faire la différence.
 */

type Niveau = 'programme' | 'programme-rapporte' | 'declaration';

const STYLES: Record<Niveau, { glyphe: string; libelle: string; classes: string }> = {
  programme: {
    glyphe: '▣',
    libelle: LIBELLES_NATURE.programme_officiel,
    classes: 'border-transparent bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900',
  },
  'programme-rapporte': {
    glyphe: '▥',
    libelle: 'Programme, rapporté par la presse',
    classes:
      'border-stone-900/30 bg-stone-900/5 text-stone-700 dark:border-white/30 dark:bg-white/10 dark:text-stone-200',
  },
  declaration: {
    glyphe: '◻',
    libelle: LIBELLES_NATURE.declaration_publique,
    classes:
      'border-dashed border-stone-900/30 bg-transparent text-stone-600 dark:border-white/30 dark:text-stone-300',
  },
};

export function niveauDeLaSource(proposition: Proposition): Niveau {
  if (proposition.nature !== 'programme_officiel') return 'declaration';
  return proposition.source.type === 'programme-officiel' ||
    proposition.source.type === 'site-de-campagne'
    ? 'programme'
    : 'programme-rapporte';
}

export default function BadgeNature({ proposition }: { proposition: Proposition }) {
  const { glyphe, libelle, classes } = STYLES[niveauDeLaSource(proposition)];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
      >
        <span aria-hidden="true" className="text-[0.75em]">
          {glyphe}
        </span>
        {libelle}
      </span>

      {/* Une mesure reprise d'un scrutin antérieur n'engage pas de la même
          façon : le dire dans le détail replié ne suffisait pas. */}
      {proposition.programme_anterieur !== null && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/30 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100">
          <span aria-hidden="true" className="text-[0.75em]">
            ↺
          </span>
          {proposition.programme_anterieur.scrutin} de {proposition.programme_anterieur.annee}
        </span>
      )}
    </span>
  );
}
