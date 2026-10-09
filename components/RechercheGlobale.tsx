'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LIBELLES_TYPE, rechercher, type EntreeIndex, type TypeResultat } from '@/lib/recherche';

const ORDRE_TYPES: TypeResultat[] = ['candidat', 'parti', 'proposition'];

/**
 * L'index est chargé à la première ouverture, pas à l'affichage de la page.
 * Il est rendu dans l'en-tête, donc présent partout : l'inclure dans le rendu
 * ajoutait une centaine de kilo-octets à chacune des pages du site.
 */
const CHEMIN_INDEX = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/recherche-index.json`;

type EtatIndex =
  | { statut: 'vide' }
  | { statut: 'chargement' }
  | { statut: 'pret'; entrees: EntreeIndex[] }
  | { statut: 'erreur' };

export default function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [index, setIndex] = useState<EtatIndex>({ statut: 'vide' });
  const champ = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    setIndex((precedent) =>
      precedent.statut === 'pret' ? precedent : { statut: 'chargement' },
    );
    try {
      const reponse = await fetch(CHEMIN_INDEX);
      if (!reponse.ok) throw new Error(String(reponse.status));
      setIndex({ statut: 'pret', entrees: (await reponse.json()) as EntreeIndex[] });
    } catch {
      setIndex({ statut: 'erreur' });
    }
  }, []);

  const ouvrir = useCallback(() => {
    setOuvert(true);
    setIndex((precedent) => {
      if (precedent.statut === 'vide' || precedent.statut === 'erreur') void charger();
      return precedent;
    });
  }, [charger]);

  useEffect(() => {
    function auClavier(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      const dansUnChamp =
        cible instanceof HTMLInputElement ||
        cible instanceof HTMLTextAreaElement ||
        cible?.isContentEditable === true;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !dansUnChamp)) {
        e.preventDefault();
        ouvrir();
      }
      if (e.key === 'Escape') setOuvert(false);
    }
    document.addEventListener('keydown', auClavier);
    return () => document.removeEventListener('keydown', auClavier);
  }, [ouvrir]);

  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);

  const resultats = useMemo(
    () => (index.statut === 'pret' ? rechercher(index.entrees, requete) : []),
    [index, requete],
  );

  const groupes = ORDRE_TYPES.map((type) => ({
    type,
    entrees: resultats.filter((r) => r.type === type),
  })).filter((g) => g.entrees.length > 0);

  const requeteSaisie = requete.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
      >
        <span aria-hidden="true">⌕</span>
        Rechercher
        <kbd className="hidden rounded border border-slate-300 px-1 text-[0.7rem] text-slate-500 sm:inline dark:border-slate-600 dark:text-slate-400">
          /
        </kbd>
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[10vh] backdrop-blur-sm"
          onClick={() => setOuvert(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
              <span aria-hidden="true" className="text-slate-400">
                ⌕
              </span>
              <input
                ref={champ}
                type="search"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Candidat, parti, proposition…"
                className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Échap
              </button>
            </div>

            <div className="overflow-y-auto" aria-live="polite">
              {index.statut === 'chargement' && (
                <p className="px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
                  Chargement de l’index…
                </p>
              )}

              {index.statut === 'erreur' && (
                <div className="space-y-2 px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
                  <p>L’index de recherche n’a pas pu être chargé.</p>
                  <button
                    type="button"
                    onClick={() => void charger()}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:border-slate-500 dark:border-slate-700 dark:hover:border-slate-500"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {index.statut === 'pret' && requeteSaisie && groupes.length === 0 && (
                <p className="px-4 py-6 text-sm text-slate-600 dark:text-slate-400">
                  Aucun résultat pour « {requete} ».
                </p>
              )}

              {groupes.map((groupe) => (
                <section key={groupe.type}>
                  <h2 className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {LIBELLES_TYPE[groupe.type]}
                  </h2>
                  <ul>
                    {groupe.entrees.map((entree) => (
                      <li key={`${entree.type}-${entree.id}`}>
                        <Link
                          href={entree.lien}
                          onClick={() => setOuvert(false)}
                          className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span className="block text-sm font-medium">{entree.titre}</span>
                          <span className="block text-xs text-slate-600 dark:text-slate-400">
                            {entree.sousTitre}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
