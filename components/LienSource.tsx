import { formaterDateCourte } from '@/lib/format';
import type { Source } from '@/lib/schemas';

const LIBELLES_TYPE_SOURCE: Record<Source['type'], string> = {
  'programme-officiel': 'Programme officiel',
  'site-de-campagne': 'Site de campagne',
  'site-de-parti': 'Site de parti',
  'conseil-constitutionnel': 'Conseil constitutionnel',
  'journal-officiel': 'Journal officiel',
  livre: 'Livre',
  discours: 'Discours',
  interview: 'Interview',
  communique: 'Communiqué',
  'article-de-presse': 'Article de presse',
  encyclopedie: 'Encyclopédie',
};

export default function LienSource({ source }: { source: Source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group inline-flex flex-wrap items-baseline gap-x-1.5 text-xs text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 hover:decoration-stone-600 dark:text-stone-400 dark:decoration-stone-600 dark:hover:text-stone-100"
    >
      <span className="font-medium">{LIBELLES_TYPE_SOURCE[source.type]}</span>
      <span aria-hidden="true">·</span>
      <span>{source.titre}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums whitespace-nowrap">
        {formaterDateCourte(source.date)}
        <span aria-hidden="true" className="ml-1">
          ↗
        </span>
        <span className="sr-only"> (nouvelle fenêtre)</span>
      </span>
    </a>
  );
}
