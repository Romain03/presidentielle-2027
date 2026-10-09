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
      className="group inline-flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 hover:decoration-slate-600 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-100"
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
