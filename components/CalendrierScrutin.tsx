import { calendrier } from '@/lib/data';
import { formaterDate } from '@/lib/format';
import LienSource from './LienSource';

/**
 * Le calendrier du scrutin.
 *
 * Il manquait, et ce n'était pas un refus d'inventer : les dates étaient
 * officialisées en conseil des ministres depuis le 1er juillet 2026 et
 * rapportées par plusieurs rédactions. Le site ne les affichait pas faute
 * d'avoir cherché.
 *
 * Ne figurent ici que des dates officialisées. Celles qui dépendent d'un
 * décret non paru - convocation des électeurs, dépôt des parrainages - restent
 * absentes : les estimer donnerait au lecteur une précision que personne n'a
 * encore arrêtée.
 */
export default function CalendrierScrutin() {
  return (
    <section aria-labelledby="calendrier" className="space-y-3">
      <h2 id="calendrier" className="text-xl font-semibold">
        Le calendrier
      </h2>
      <ol className="space-y-2.5">
        {calendrier.map((etape) => (
          <li
            key={etape.id}
            className="carte flex flex-col gap-x-5 gap-y-1.5 p-4 sm:flex-row sm:items-baseline"
          >
            <p className="shrink-0 sm:w-44">
              <time dateTime={etape.date} className="font-medium tabular-nums">
                {formaterDate(etape.date)}
              </time>
            </p>
            <div className="min-w-0 space-y-1.5">
              <p className="font-serif text-lg leading-snug">{etape.libelle}</p>
              {etape.precision !== null && (
                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {etape.precision}
                </p>
              )}
              <ul className="space-y-0.5">
                {etape.sources.map((source) => (
                  <li key={source.url}>
                    <LienSource source={source} />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Les étapes dont la date dépend d’un décret non paru - convocation des électeurs, dépôt
        des cinq cents parrainages - ne sont pas affichées : elles seront ajoutées quand elles
        seront fixées, pas estimées d’ici là.
      </p>
    </section>
  );
}
