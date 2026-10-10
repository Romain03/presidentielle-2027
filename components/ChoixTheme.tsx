'use client';

import { useEffect, useState } from 'react';

/**
 * Choix du thème, clair par défaut.
 *
 * Le réglage du système n'est volontairement pas suivi : il donnait au site
 * deux apparences selon l'appareil. Le lecteur peut passer au sombre, et ce
 * choix le suit sur cet appareil seulement - c'est une préférence d'affichage,
 * pas une donnée à conserver ailleurs.
 */

export const CLE = 'theme';

type Theme = 'clair' | 'sombre';

/** Exécuté avant le premier rendu, pour ne pas afficher la mauvaise couleur. */
export const SCRIPT_AVANT_PEINTURE = `try{var t=localStorage.getItem('${CLE}');if(t==='sombre')document.documentElement.dataset.theme='sombre'}catch(e){}`;

const DUREE_BASCULE = 240;

function appliquer(theme: Theme) {
  const racine = document.documentElement;

  // Les couleurs glissent le temps de la bascule, puis la transition est
  // retirée : la laisser en place animerait aussi survols et chargements.
  racine.classList.add('bascule-theme');
  window.setTimeout(() => racine.classList.remove('bascule-theme'), DUREE_BASCULE);

  if (theme === 'sombre') racine.dataset.theme = 'sombre';
  else delete racine.dataset.theme;

  // La barre d'adresse des navigateurs mobiles suit la couleur du papier.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'sombre' ? '#1a1714' : '#faf7f1');
}

export default function ChoixTheme() {
  const [theme, setTheme] = useState<Theme>('clair');
  // Le bouton n'est rendu qu'une fois monté : avant cela, le serveur ne
  // connaît pas le choix du lecteur et afficherait la mauvaise icône.
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    setMonte(true);
    try {
      if (localStorage.getItem(CLE) === 'sombre') setTheme('sombre');
    } catch {
      /* navigation privée, stockage refusé : on reste en clair */
    }
  }, []);

  function basculer() {
    const suivant: Theme = theme === 'sombre' ? 'clair' : 'sombre';
    setTheme(suivant);
    appliquer(suivant);
    try {
      localStorage.setItem(CLE, suivant);
    } catch {
      /* le choix ne survivra pas au rechargement, le site reste utilisable */
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={theme === 'sombre'}
      aria-label={theme === 'sombre' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      title={theme === 'sombre' ? 'Thème clair' : 'Thème sombre'}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-900/10 bg-white/70 text-stone-600 transition-colors hover:border-stone-900/20 hover:bg-white hover:text-stone-900 active:scale-95 motion-safe:transition-transform dark:border-nuit-bord dark:bg-nuit-clair/70 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:bg-nuit-clair dark:hover:text-stone-100"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {monte && theme === 'sombre' ? '☀' : '☾'}
      </span>
    </button>
  );
}
