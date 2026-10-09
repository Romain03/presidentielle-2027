import BadgeNature from './BadgeNature';
import LienSource from './LienSource';
import { formaterIndicateur } from '@/lib/comparateur';
import { formaterDateCourte } from '@/lib/format';
import type { Proposition } from '@/lib/schemas';

export default function BlocProposition({ proposition }: { proposition: Proposition }) {
  return (
    <article className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <BadgeNature nature={proposition.nature} />

      <p className="leading-relaxed">{proposition.resume}</p>

      {proposition.indicateurs.length > 0 && (
        <dl className="flex flex-wrap gap-x-5 gap-y-1.5 border-y border-slate-100 py-2 text-sm dark:border-slate-800">
          {proposition.indicateurs.map((indicateur) => (
            <div key={indicateur.libelle} className="min-w-0">
              <dt className="text-xs text-slate-600 dark:text-slate-400">{indicateur.libelle}</dt>
              <dd className="font-medium tabular-nums">{formaterIndicateur(indicateur)}</dd>
            </div>
          ))}
        </dl>
      )}

      {proposition.citation !== null && (
        <blockquote className="border-l-2 border-slate-300 pl-3 text-sm italic text-slate-700 dark:border-slate-600 dark:text-slate-300">
          «&nbsp;{proposition.citation}&nbsp;»
        </blockquote>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 dark:text-slate-300 dark:decoration-slate-600 dark:hover:text-slate-100">
          Détail de la proposition
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {proposition.detail}
        </p>
      </details>

      <footer className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1">
        <LienSource source={proposition.source} />
        <span className="text-xs text-slate-500 dark:text-slate-500">
          Vérifié le {formaterDateCourte(proposition.derniere_verification)}
        </span>
      </footer>
    </article>
  );
}
