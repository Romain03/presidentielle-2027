'use client';

import { useState } from 'react';

/**
 * Partage natif. Dans l'application iOS, ouvre la feuille de partage du
 * système ; sur le web, utilise l'API de partage du navigateur quand elle
 * existe, et se rabat sinon sur la copie du lien.
 *
 * Le lien partagé pointe toujours vers le site public : à l'intérieur de
 * l'application le site est servi localement, une adresse interne n'aurait
 * aucun sens pour le destinataire.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? '';

type Etat = 'pret' | 'copie' | 'echec';

export default function BoutonPartager({
  titre,
  chemin,
}: {
  titre: string;
  chemin: string;
}) {
  const [etat, setEtat] = useState<Etat>('pret');

  async function partager() {
    const url = `${SITE}${chemin}`;
    const charge = { title: titre, text: titre, url };

    try {
      if ('Capacitor' in window) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ ...charge, dialogTitle: 'Partager' });
        return;
      }
      if (typeof navigator.share === 'function') {
        await navigator.share(charge);
        return;
      }
      await navigator.clipboard.writeText(url);
      setEtat('copie');
      setTimeout(() => setEtat('pret'), 2500);
    } catch (erreur) {
      // Un partage annulé par l'utilisateur lève aussi : ce n'est pas un échec.
      if (erreur instanceof Error && erreur.name === 'AbortError') return;
      setEtat('echec');
      setTimeout(() => setEtat('pret'), 2500);
    }
  }

  const libelle =
    etat === 'copie' ? 'Lien copié' : etat === 'echec' ? 'Partage impossible' : 'Partager';

  return (
    <button
      type="button"
      onClick={partager}
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/12 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-stone-900/25 hover:bg-creme-ombre dark:border-white/15 dark:text-stone-300 dark:hover:bg-nuit"
    >
      <span aria-hidden="true">{etat === 'copie' ? '✓' : '↗'}</span>
      {libelle}
    </button>
  );
}
