/**
 * Affiché lorsqu'aucune proposition sourcée n'existe pour ce couple
 * candidat / thème. L'absence n'est jamais stockée dans les données : elle est
 * calculée ici, ce qui évite d'affirmer par erreur qu'un candidat « n'a rien
 * dit ».
 *
 * Le libellé dit explicitement que la lacune est celle du site. « Position non
 * communiquée » laissait entendre que le candidat s'était tu, alors que le
 * site n'a, le plus souvent, simplement rien relevé : les 57 propositions
 * publiées proviennent de treize articles, et c'est leur couverture que l'on
 * lit ici, pas l'état des programmes.
 */
export default function PositionNonCommuniquee({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`text-stone-600 dark:text-stone-400 ${compact ? 'text-sm' : 'text-sm italic'}`}>
      Rien relevé par ce site à ce jour
    </p>
  );
}
