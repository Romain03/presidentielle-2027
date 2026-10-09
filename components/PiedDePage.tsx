import Link from 'next/link';
import { derniereMiseAJour, statistiques } from '@/lib/data';
import { formaterDate } from '@/lib/format';

export default function PiedDePage() {
  return (
    <footer className="zone-sure-bas border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="zone-sure-cotes mx-auto w-full max-w-6xl space-y-2 px-4 py-8 text-sm text-slate-600 sm:px-6 dark:text-slate-400">
        <p>
          Données vérifiées le {formaterDate(derniereMiseAJour)} · {statistiques.candidats}{' '}
          candidats · {statistiques.propositions} propositions sourcées.
        </p>
        <p>
          Chaque information renvoie à sa source. Aucune proposition n’est reformulée en
          jugement, et les candidats sont présentés par ordre alphabétique.{' '}
          <Link href="/methodologie/" className="underline underline-offset-2">
            Méthodologie et limites
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
