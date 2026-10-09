import { formaterDate } from '@/lib/format';

/** Affiché sur chaque page, comme demandé par le cahier des charges. */
export default function DerniereMiseAJour({ date }: { date: string }) {
  return (
    <p className="text-xs text-slate-600 dark:text-slate-400">
      Données vérifiées le <time dateTime={date}>{formaterDate(date)}</time>
    </p>
  );
}
