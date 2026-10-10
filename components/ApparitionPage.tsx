'use client';

import { usePathname } from 'next/navigation';

/**
 * Brève apparition du contenu à chaque changement de page.
 *
 * La clé force le remontage à chaque adresse : sans elle, l'animation ne
 * jouerait qu'au premier chargement, et la navigation interne paraîtrait
 * figée par comparaison.
 */
export default function ApparitionPage({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  return (
    <div key={chemin} className="apparition">
      {children}
    </div>
  );
}
