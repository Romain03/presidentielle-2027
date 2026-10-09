import Link from 'next/link';

/**
 * Retour explicite vers la vue d'ensemble. Indispensable en mode
 * « application installée » sur iOS : il n'y a pas de bouton retour du
 * navigateur, et l'en-tête ne mène qu'aux grandes sections.
 */
export default function LienRetour({ href, libelle }: { href: string; libelle: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
        ←
      </span>
      {libelle}
    </Link>
  );
}
