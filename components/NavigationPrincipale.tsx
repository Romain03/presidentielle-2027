'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface LienNav {
  href: string;
  libelle: string;
}

/**
 * Navigation principale, avec la rubrique courante marquée.
 *
 * Le site compte sept rubriques et des pages de détail à trois niveaux : sans
 * repère, on ne sait plus d'où l'on vient. La marque est portée par le texte
 * et par `aria-current`, jamais par la seule couleur.
 */
function estCourant(chemin: string, href: string) {
  return chemin === href || chemin.startsWith(href);
}

export default function NavigationPrincipale({
  liens,
  variante,
}: {
  liens: LienNav[];
  variante: 'ligne' | 'defilante';
}) {
  const chemin = usePathname();

  if (variante === 'ligne') {
    return (
      <nav aria-label="Navigation principale" className="hidden lg:block">
        <ul className="flex items-center gap-5 text-sm">
          {liens.map((lien) => {
            const courant = estCourant(chemin, lien.href);
            return (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  aria-current={courant ? 'page' : undefined}
                  className={
                    courant
                      ? 'font-medium text-stone-900 underline decoration-ocre decoration-2 underline-offset-[6px] dark:text-stone-100 dark:decoration-ocre-clair'
                      : 'text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }
                >
                  {lien.libelle}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Navigation principale" className="lg:hidden">
      {/*
        La barre de défilement est masquée, et les sept pastilles ne tiennent
        pas sur un écran de téléphone : la dernière était coupée sans que rien
        n'indique qu'on pouvait faire défiler. Le dégradé du bord droit le dit.
      */}
      <ul className="sans-barre-defilement indice-defilement -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {liens.map((lien) => {
          const courant = estCourant(chemin, lien.href);
          return (
            <li key={lien.href} className="shrink-0">
              <Link
                href={lien.href}
                aria-current={courant ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-sm transition-colors ${
                  courant
                    ? 'bg-stone-900 font-medium text-creme dark:bg-stone-100 dark:text-nuit'
                    : 'text-stone-600 hover:bg-creme-ombre hover:text-stone-900 dark:text-stone-400 dark:hover:bg-nuit-clair dark:hover:text-stone-100'
                }`}
              >
                {lien.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
