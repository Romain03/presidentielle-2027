import { formaterDate } from '@/lib/format';

/**
 * Affiché sur chaque page, comme demandé par le cahier des charges.
 *
 * « Dernier relevé » et non « données vérifiées » : c'est le vocabulaire du
 * pied de page et de la page À propos, qui explique pourquoi le mot
 * « vérifié » n'est pas employé ici. Trois formulations pour une même date
 * laissaient croire à trois choses différentes.
 */
export default function DerniereMiseAJour({ date }: { date: string }) {
  return (
    <p className="text-xs text-stone-600 dark:text-stone-400">
      Dernier relevé le <time dateTime={date}>{formaterDate(date)}</time>
    </p>
  );
}
