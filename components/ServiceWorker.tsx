'use client';

import { useEffect } from 'react';

/**
 * Enregistre le service worker qui rend l'application consultable hors ligne.
 * Les navigateurs refusent l'enregistrement hors HTTPS (sauf sur localhost) :
 * il ne s'active donc qu'une fois le site déployé.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      // Hors ligne ou contexte non sécurisé : l'application reste utilisable.
    });
  }, []);

  return null;
}
