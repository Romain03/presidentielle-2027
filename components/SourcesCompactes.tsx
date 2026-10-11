import { hoteDe, type Source } from '@/lib/schemas';

/**
 * Les sources d'une proposition sur une seule ligne, réduites à leur hôte.
 *
 * Dans les tableaux par thème, la colonne « Source » empilait jusqu'à quatre
 * lignes « Article de presse · domaine · date » pour une seule case, ce qui
 * déformait la hauteur des lignes et rendait le tableau illisible. Le détail
 * complet - type, titre, date - reste affiché sur la fiche du candidat et sur
 * celle du parti, où il y a la place de le lire.
 *
 * Les hôtes sont dédoublonnés : deux articles d'une même rédaction comptent
 * pour une provenance, et c'est la provenance que cette colonne annonce.
 */
export default function SourcesCompactes({ sources }: { sources: Source[] }) {
  const parHote = new Map<string, Source>();
  for (const source of sources) {
    if (!parHote.has(hoteDe(source.url))) parHote.set(hoteDe(source.url), source);
  }
  const hotes = [...parHote.entries()];

  return (
    <span className="text-xs leading-snug">
      {hotes.map(([hote, source], i) => (
        <span key={hote}>
          {i > 0 && <span className="text-stone-400">, </span>}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lien"
            title={source.titre}
          >
            {hote}
          </a>
        </span>
      ))}
      {sources.length > hotes.length && (
        <span className="text-stone-600 dark:text-stone-400">
          {' '}
          ({sources.length} citations)
        </span>
      )}
    </span>
  );
}
