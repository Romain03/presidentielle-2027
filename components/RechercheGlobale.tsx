'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LIBELLES_TYPE, rechercher, type EntreeIndex, type TypeResultat } from '@/lib/recherche';

const ORDRE_TYPES: TypeResultat[] = ['candidat', 'parti', 'proposition'];

/** En dessous de deux lettres, la recherche ne renvoie rien : mieux vaut le dire. */
const LONGUEUR_MINIMALE = 2;

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

function pluriel(n: number, singulier: string, plurielMot = `${singulier}s`) {
  return n > 1 ? plurielMot : singulier;
}

export default function RechercheGlobale() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [actif, setActif] = useState(0);
  const [index, setIndex] = useState<EtatIndex>({ statut: 'vide' });
  const champ = useRef<HTMLInputElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLDivElement>(null);

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

  /* La fermeture rend le clavier au bouton d'origine : sans cela, le focus
     retombe sur le document et la tabulation repart du haut de la page. */
  const fermer = useCallback(() => {
    setOuvert(false);
    declencheur.current?.focus();
  }, []);

  const resultats = useMemo(
    () => (index.statut === 'pret' ? rechercher(index.entrees, requete) : []),
    [index, requete],
  );

  const groupes = useMemo(
    () =>
      ORDRE_TYPES.map((type) => ({
        type,
        entrees: resultats.filter((r) => r.type === type),
      })).filter((groupe) => groupe.entrees.length > 0),
    [resultats],
  );

  /* L'ordre des groupes, et non celui du score, gouverne les flèches :
     la sélection suit ce que l'oeil voit. */
  const ordonnes = useMemo(() => groupes.flatMap((groupe) => groupe.entrees), [groupes]);

  const cle = (entree: EntreeIndex) => `${entree.type}-${entree.id}`;
  const selection = ordonnes[actif];

  useEffect(() => setActif(0), [requete]);

  // Le raccourci reste celui que tous les navigateurs partagent ; la touche « / »
  // a été retirée, elle déclenchait la recherche au fil de la frappe.
  useEffect(() => {
    function auClavier(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ouvrir();
      }
    }
    document.addEventListener('keydown', auClavier);
    return () => document.removeEventListener('keydown', auClavier);
  }, [ouvrir]);

  /* Le fond ne défile plus derrière la fenêtre ouverte. */
  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    champ.current?.focus();
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [ouvert]);

  useEffect(() => {
    if (!selection) return;
    liste.current
      ?.querySelector(`[data-cle="${cle(selection)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selection]);

  function auClavierDeLaFenetre(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    // Première échappée : on vide le champ. Seconde : on ferme.
    if (requete.length > 0) {
      setRequete('');
      champ.current?.focus();
    } else {
      fermer();
    }
  }

  function auClavierDuChamp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (ordonnes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActif((n) => (n + 1) % ordonnes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActif((n) => (n - 1 + ordonnes.length) % ordonnes.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActif(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActif(ordonnes.length - 1);
    } else if (e.key === 'Enter' && selection) {
      e.preventDefault();
      setOuvert(false);
      router.push(selection.lien);
    }
  }

  const saisie = requete.trim().length;
  const tropCourt = saisie > 0 && saisie < LONGUEUR_MINIMALE;
  const cherchable = saisie >= LONGUEUR_MINIMALE;

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        onClick={ouvrir}
        aria-label="Rechercher sur le site"
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-2.5 py-2 text-sm text-stone-600 transition-colors hover:border-stone-900/20 hover:bg-white hover:text-stone-900 sm:px-3.5 dark:border-nuit-bord dark:bg-nuit-clair/70 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:bg-nuit-clair dark:hover:text-stone-100"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ⌕
        </span>
        <span className="hidden sm:inline">Rechercher</span>
      </button>

      {ouvert &&
        createPortal(
          <div
            className="fondu fixed inset-0 z-50 flex items-stretch justify-center bg-stone-900/40 backdrop-blur-sm sm:items-start sm:p-4 sm:pt-[10vh]"
            onClick={fermer}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Recherche"
              className="surgissement zone-sure-haut flex h-full w-full flex-col overflow-hidden border-stone-900/10 bg-creme shadow-2xl sm:h-auto sm:max-h-[70vh] sm:max-w-2xl sm:rounded-2xl sm:border dark:border-nuit-bord dark:bg-nuit-clair"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={auClavierDeLaFenetre}
            >
              <div className="flex items-center gap-1 border-b border-stone-900/10 px-3 transition-colors focus-within:border-ocre dark:border-nuit-bord dark:focus-within:border-ocre-clair">
                <span aria-hidden="true" className="pl-1 text-lg text-stone-400">
                  ⌕
                </span>
                <label htmlFor="recherche-champ" className="sr-only">
                  Rechercher un candidat, un parti ou une proposition
                </label>
                <input
                  ref={champ}
                  id="recherche-champ"
                  type="search"
                  role="combobox"
                  aria-expanded={ordonnes.length > 0}
                  aria-controls="recherche-resultats"
                  aria-activedescendant={selection ? `resultat-${cle(selection)}` : undefined}
                  aria-autocomplete="list"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  value={requete}
                  onChange={(e) => setRequete(e.target.value)}
                  onKeyDown={auClavierDuChamp}
                  placeholder="Candidat, parti, proposition…"
                  className="w-full min-w-0 bg-transparent py-4 text-base outline-none focus-visible:outline-none placeholder:text-stone-400 [&::-webkit-search-cancel-button]:appearance-none"
                />

                {requete.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRequete('');
                      champ.current?.focus();
                    }}
                    aria-label="Effacer la recherche"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-creme-ombre hover:text-stone-900 sm:h-9 sm:w-9 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                  >
                    <span aria-hidden="true" className="block h-5 w-5 leading-5">
                      ⨯
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={fermer}
                  aria-label="Fermer la recherche"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-creme-ombre hover:text-stone-900 sm:h-9 sm:w-9 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  <span aria-hidden="true" className="block h-5 w-5 text-lg leading-5">
                    ✕
                  </span>
                </button>
              </div>

              <div ref={liste} className="zone-sure-bas min-h-0 flex-1 overflow-y-auto">
                {index.statut === 'chargement' && (
                  <p className="px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
                    Chargement de l’index…
                  </p>
                )}

                {index.statut === 'erreur' && (
                  <div className="space-y-2 px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
                    <p>L’index de recherche n’a pas pu être chargé.</p>
                    <button
                      type="button"
                      onClick={() => void charger()}
                      className="rounded-md border border-stone-300 px-2.5 py-1 text-xs hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500"
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {index.statut === 'pret' && saisie === 0 && (
                  <p className="px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
                    Un nom de candidat, un parti, un mot d’une proposition - la recherche
                    parcourt les {index.entrees.length} fiches du site.
                  </p>
                )}

                {index.statut === 'pret' && tropCourt && (
                  <p className="px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
                    Saisissez au moins {LONGUEUR_MINIMALE} lettres.
                  </p>
                )}

                {index.statut === 'pret' && cherchable && ordonnes.length === 0 && (
                  <p className="px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
                    Aucun résultat pour « {requete.trim()} ».
                  </p>
                )}

                {/* Le décompte est annoncé par la synthèse vocale sans voler le focus. */}
                <p role="status" aria-live="polite" className="sr-only">
                  {cherchable && ordonnes.length > 0
                    ? `${ordonnes.length} ${pluriel(ordonnes.length, 'résultat')}`
                    : ''}
                </p>

                {groupes.length > 0 && (
                  <div
                    id="recherche-resultats"
                    role="listbox"
                    aria-label="Résultats de recherche"
                  >
                    {groupes.map((groupe) => (
                      <div key={groupe.type} role="group" aria-labelledby={`groupe-${groupe.type}`}>
                        <h2
                          id={`groupe-${groupe.type}`}
                          className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400"
                        >
                          {LIBELLES_TYPE[groupe.type]}
                        </h2>
                        {groupe.entrees.map((entree) => {
                          const choisi = selection ? cle(selection) === cle(entree) : false;
                          return (
                            <Link
                              key={cle(entree)}
                              href={entree.lien}
                              id={`resultat-${cle(entree)}`}
                              data-cle={cle(entree)}
                              role="option"
                              aria-selected={choisi}
                              tabIndex={-1}
                              onClick={() => setOuvert(false)}
                              onMouseMove={() => setActif(ordonnes.indexOf(entree))}
                              className={`block px-4 py-3 ${
                                choisi ? 'bg-creme-ombre dark:bg-stone-800' : ''
                              }`}
                            >
                              <span className="block text-sm font-medium">{entree.titre}</span>
                              <span className="block text-xs text-stone-600 dark:text-stone-400">
                                {entree.sousTitre}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
