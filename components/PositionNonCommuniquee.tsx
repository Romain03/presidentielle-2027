/**
 * Affiché lorsqu'aucune proposition sourcée n'existe pour ce couple
 * candidat / thème. L'absence n'est jamais stockée dans les données : elle est
 * calculée ici, ce qui évite d'affirmer par erreur qu'un candidat « n'a rien
 * dit ».
 */
export default function PositionNonCommuniquee({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`text-stone-600 dark:text-stone-400 ${compact ? 'text-sm' : 'text-sm italic'}`}
    >
      Position non communiquée
    </p>
  );
}
