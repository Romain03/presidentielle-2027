import LienSource from '@/components/LienSource';
import { periode, pluriel } from '@/lib/format';
import type { Jalon } from '@/lib/schemas';

/** Au-delà de ce nombre, les fonctions les plus anciennes sont repliées. */
const VISIBLES = 6;

function Ligne({ jalon, avecSource }: { jalon: Jalon; avecSource: boolean }) {
  return (
    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-sm font-medium tabular-nums sm:w-32">
        {periode(jalon.debut, jalon.fin)}
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm text-stone-700 dark:text-stone-300">{jalon.libelle}</span>
        {avecSource && <LienSource source={jalon.source} />}
      </span>
    </li>
  );
}

export default function ParcoursCandidat({ jalons }: { jalons: Jalon[] }) {
  if (jalons.length === 0) {
    return (
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Aucun mandat ni fonction n’est documenté à ce stade.
      </p>
    );
  }

  // Les jalons viennent le plus souvent d'une même source : la rappeler à
  // chaque ligne noierait la chronologie sous les liens.
  const sources = [...new Set(jalons.map((j) => j.source.url))];
  const sourceUnique = sources.length === 1;

  const recents = jalons.slice(0, VISIBLES);
  const anciens = jalons.slice(VISIBLES);

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {recents.map((jalon) => (
          <Ligne
            key={`${jalon.debut}-${jalon.libelle}`}
            jalon={jalon}
            avecSource={!sourceUnique}
          />
        ))}
      </ol>

      {anciens.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-400 dark:decoration-stone-600 dark:hover:text-stone-100">
            Afficher les {anciens.length}{' '}
            {pluriel(anciens.length, 'fonction antérieure', 'fonctions antérieures')}
          </summary>
          <ol className="mt-3 space-y-3">
            {anciens.map((jalon) => (
              <Ligne
                key={`${jalon.debut}-${jalon.libelle}`}
                jalon={jalon}
                avecSource={!sourceUnique}
              />
            ))}
          </ol>
        </details>
      )}

      {sourceUnique && <LienSource source={jalons[0].source} />}
    </div>
  );
}
