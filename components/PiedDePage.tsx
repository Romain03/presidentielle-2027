import Link from 'next/link';
import { derniereMiseAJour, statistiques } from '@/lib/data';
import { formaterDate } from '@/lib/format';

export default function PiedDePage() {
  return (
    <footer className="zone-sure-bas border-t border-stone-900/8 bg-white dark:border-nuit-bord dark:bg-nuit-clair">
      <div className="zone-sure-cotes mx-auto w-full max-w-6xl space-y-2 px-4 py-8 text-sm text-stone-600 sm:px-6 dark:text-stone-400">
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
