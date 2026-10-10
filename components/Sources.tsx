import LienSource from './LienSource';
import type { Source } from '@/lib/schemas';

/**
 * Les sources d'une proposition. La première est la principale ; les suivantes
 * corroborent ou portent un détail qu'elle ne donne pas.
 *
 * Toutes sont affichées, sans hiérarchie visuelle marquée : savoir qu'une
 * mesure n'est rapportée que par une rédaction, ou au contraire par trois,
 * fait partie de ce que le lecteur doit pouvoir juger.
 */
export default function Sources({ sources }: { sources: Source[] }) {
  return (
    <ul className="space-y-0.5">
      {sources.map((source) => (
        <li key={source.url}>
          <LienSource source={source} />
        </li>
      ))}
    </ul>
  );
}
