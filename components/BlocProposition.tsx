import BadgeNature from './BadgeNature';
import LienSource from './LienSource';
import Sources from './Sources';
import { formaterIndicateur } from '@/lib/comparateur';
import { formaterDateCourte } from '@/lib/format';
import type { Proposition } from '@/lib/schemas';

export default function BlocProposition({ proposition }: { proposition: Proposition }) {
  return (
    <article className="carte space-y-3.5 p-5">
      <BadgeNature proposition={proposition} />

      <p className="text-[1.0625rem] leading-relaxed">{proposition.resume}</p>

      {proposition.indicateurs.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-creme-ombre/60 px-3.5 py-2.5 text-sm dark:bg-nuit/50">
          {proposition.indicateurs.map((indicateur) => (
            <div key={indicateur.libelle} className="min-w-0">
              <dt className="text-xs text-stone-600 dark:text-stone-400">{indicateur.libelle}</dt>
              <dd className="font-medium tabular-nums">{formaterIndicateur(indicateur)}</dd>
            </div>
          ))}
        </dl>
      )}

      {proposition.citation !== null && (
        <blockquote className="border-l-2 border-stone-900/20 pl-3.5 font-serif text-[1.0625rem] italic leading-relaxed text-stone-700 dark:border-white/20 dark:text-stone-300">
          «&nbsp;{proposition.citation}&nbsp;»
        </blockquote>
      )}

      <details className="group">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
          <span aria-hidden="true" className="transition-transform group-open:rotate-90">
            ›
          </span>
          Détail de la proposition
        </summary>
        <p className="mt-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          {proposition.detail}
        </p>
      </details>

      <footer className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-stone-900/6 pt-3 dark:border-white/8">
        <Sources sources={proposition.sources} />
        <span className="text-xs text-stone-600 dark:text-stone-400">
          Relevé le {formaterDateCourte(proposition.derniere_verification)}
        </span>
      </footer>
    </article>
  );
}
