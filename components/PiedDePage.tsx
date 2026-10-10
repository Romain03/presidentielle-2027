import Link from 'next/link';
import { derniereMiseAJour, statistiques } from '@/lib/data';
import { formaterDate } from '@/lib/format';

export default function PiedDePage() {
  return (
    <footer className="zone-sure-bas border-t border-stone-900/8 bg-white dark:border-nuit-bord dark:bg-nuit-clair">
      <div className="gouttiere mx-auto w-full max-w-6xl space-y-2 py-8 text-sm text-stone-600 dark:text-stone-400">
        <p>
          Dernier relevé le {formaterDate(derniereMiseAJour)} · {statistiques.enLice} candidatures
          engagées, {statistiques.pressentis} pressentis, {statistiques.retires} retraits ·{' '}
          {statistiques.propositions} propositions sourcées.
        </p>
        <p>
          Chaque information renvoie à sa source. Aucune proposition n’est reformulée en
          jugement, et les candidats sont présentés par ordre alphabétique.
        </p>
        <nav aria-label="Liens de bas de page">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link href="/methodologie/" className="underline underline-offset-2">
                Méthodologie et limites
              </Link>
            </li>
            <li>
              <Link href="/a-propos/" className="underline underline-offset-2">
                À propos et signaler une erreur
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Romain03/presidentielle-2027"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Code et données
                <span aria-hidden="true"> ↗</span>
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
