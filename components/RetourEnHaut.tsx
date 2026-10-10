'use client';

import { useEffect, useState } from 'react';

/**
 * Retour en haut de page.
 *
 * Les pages de thème listent quarante-quatre candidats et les fiches douze
 * thèmes : au doigt, le chemin de retour est long. Le bouton n'apparaît
 * qu'une fois deux écrans parcourus, pour ne pas encombrer les pages courtes.
 */
export default function RetourEnHaut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function auDefilement() {
      setVisible(window.scrollY > window.innerHeight * 2);
    }
    auDefilement();
    window.addEventListener('scroll', auDefilement, { passive: true });
    return () => window.removeEventListener('scroll', auDefilement);
  }, []);

  // Monté seulement une fois visible : laissé en place et simplement caché,
  // son apparition en fondu se jouerait hors écran, donc jamais.
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
      }
      aria-label="Revenir en haut de la page"
      className="fondu fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 grid size-11 place-items-center rounded-full border border-stone-900/10 bg-white/90 text-stone-700 shadow-lg backdrop-blur transition-colors hover:bg-white hover:text-stone-900 active:scale-95 motion-safe:transition-transform dark:border-nuit-bord dark:bg-nuit-clair/90 dark:text-stone-300 dark:hover:bg-nuit-clair dark:hover:text-stone-100"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ↑
      </span>
    </button>
  );
}
