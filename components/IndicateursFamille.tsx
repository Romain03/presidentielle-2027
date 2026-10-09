import Link from 'next/link';
import { nomComplet } from '@/lib/format';
import type { IndicateurFamille } from '@/lib/familles';

/**
 * Valeurs chiffrées regroupées : chaque ligne porte une valeur et les
 * candidats qui l'énoncent. C'est une mise en commun de ce qui a été dit,
 * pas une interprétation : deux candidats peuvent annoncer le même chiffre
 * pour des raisons opposées.
 */
export default function IndicateursFamille({
  indicateurs,
}: {
  indicateurs: IndicateurFamille[];
}) {
  if (indicateurs.length === 0) return null;

  return (
    <div className="space-y-3">
      {indicateurs.map((indicateur) => (
        <div key={indicateur.libelle} className="rounded-lg bg-creme-ombre/60 p-3.5 dark:bg-nuit/50">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
            {indicateur.libelle}
            <span className="text-xs font-normal text-stone-600 dark:text-stone-400">
              {indicateur.unanime ? (
                <>
                  <span aria-hidden="true">=</span> même valeur annoncée
                </>
              ) : (
                <>
                  <span aria-hidden="true">≠</span> {indicateur.valeurs.length} valeurs différentes
                </>
              )}
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {indicateur.valeurs.map((valeur) => (
              <li key={valeur.valeur} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span className="min-w-28 font-semibold tabular-nums">{valeur.valeur}</span>
                <span className="text-stone-600 dark:text-stone-400">
                  {valeur.candidats.map((candidat, i) => (
                    <span key={candidat.id}>
                      {i > 0 && ', '}
                      <Link href={`/candidats/${candidat.id}/`} className="lien">
                        {nomComplet(candidat)}
                      </Link>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
