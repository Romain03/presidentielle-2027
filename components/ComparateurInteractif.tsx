'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import BadgeNature from './BadgeNature';
import {
  MAX_CANDIDATS,
  MIN_CANDIDATS,
  construireComparaison,
  paramDepuisSelection,
  selectionDepuisParam,
  validerSelection,
  type StatutLigne,
} from '@/lib/comparateur';
import { nomComplet } from '@/lib/format';
import type { Proposition, Theme } from '@/lib/schemas';
import type { CandidatResume } from '@/lib/vues';

/**
 * Repères de lecture. Ils décrivent un fait structurel sur les données
 * affichées - pas une appréciation du contenu des propositions.
 */
const REPERES: Record<StatutLigne, { glyphe: string; libelle: string; classes: string }> = {
  divergence: {
    glyphe: '⇄',
    libelle: 'Positions renseignées et formulées différemment',
    classes: 'text-amber-900 dark:text-amber-200',
  },
  'formulations-identiques': {
    glyphe: '=',
    libelle: 'Formulations identiques',
    classes: 'text-stone-700 dark:text-stone-300',
  },
  incomplete: {
    glyphe: '⊘',
    libelle: 'Non comparable : au moins une position manquante',
    classes: 'text-stone-600 dark:text-stone-400',
  },
  vide: {
    glyphe: '-',
    libelle: 'Aucune position communiquée',
    classes: 'text-stone-600 dark:text-stone-400',
  },
};

export default function ComparateurInteractif({
  candidats,
  themes,
  propositions,
}: {
  candidats: CandidatResume[];
  themes: Theme[];
  propositions: Proposition[];
}) {
  const idsConnus = useMemo(() => new Set(candidats.map((c) => c.id)), [candidats]);
  const [selection, setSelection] = useState<string[]>([]);
  const [masquerVides, setMasquerVides] = useState(true);
  const [pret, setPret] = useState(false);

  // Sélection initiale lue dans l'URL : le lien est partageable sans serveur.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('c');
    setSelection(selectionDepuisParam(param, idsConnus));
    setPret(true);
  }, [idsConnus]);

  useEffect(() => {
    if (!pret) return;
    const url = new URL(window.location.href);
    if (selection.length > 0) url.searchParams.set('c', paramDepuisSelection(selection));
    else url.searchParams.delete('c');
    window.history.replaceState(null, '', url);
  }, [selection, pret]);

  const erreurs = validerSelection(selection, idsConnus);
  const selectionnes = selection
    .map((id) => candidats.find((c) => c.id === id))
    .filter((c): c is CandidatResume => c !== undefined);

  const comparaison = useMemo(
    () => construireComparaison(selectionnes, themes, propositions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection.join(','), themes, propositions],
  );

  const lignes = comparaison.lignes.filter((l) => !masquerVides || l.statut !== 'vide');
  const disponibles = candidats.filter((c) => !selection.includes(c.id));
  const complet = selection.length >= MAX_CANDIDATS;

  return (
    <div className="space-y-5">
      <section
        aria-label="Sélection des candidats"
        className="space-y-3 carte p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          {selectionnes.map((candidat) => (
            <span
              key={candidat.id}
              className="inline-flex items-center gap-2 rounded-full bg-stone-100 py-1 pl-2.5 pr-1.5 text-sm dark:bg-stone-800"
              style={
                candidat.parti
                  ? { boxShadow: `inset 3px 0 0 0 ${candidat.parti.couleur}` }
                  : undefined
              }
            >
              {nomComplet(candidat)}
              <button
                type="button"
                onClick={() => setSelection(selection.filter((id) => id !== candidat.id))}
                className="grid size-5 place-items-center rounded-full text-stone-600 hover:bg-stone-200 hover:text-stone-900 dark:hover:bg-stone-700 dark:hover:text-stone-100"
                aria-label={`Retirer ${nomComplet(candidat)} de la comparaison`}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </span>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Ajouter un candidat à la comparaison</span>
            <select
              value=""
              disabled={complet || disponibles.length === 0}
              onChange={(e) => {
                if (e.target.value !== '') setSelection([...selection, e.target.value]);
              }}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm disabled:opacity-50 dark:border-stone-700 dark:bg-nuit-clair"
            >
              <option value="">
                {complet ? `Maximum ${MAX_CANDIDATS} candidats` : '+ Ajouter un candidat'}
              </option>
              {disponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {nomComplet(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erreurs.length > 0 && (
          <ul aria-live="polite" className="text-sm text-stone-700 dark:text-stone-300">
            {erreurs.map((e) => (
              <li key={e.code}>{e.message}</li>
            ))}
          </ul>
        )}

        {erreurs.length === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 text-sm dark:border-nuit-bord">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={masquerVides}
                onChange={(e) => setMasquerVides(e.target.checked)}
                className="size-4 rounded border-stone-400"
              />
              Masquer les thèmes sans aucune position
            </label>
            <p className="text-stone-600 dark:text-stone-400">
              {comparaison.nombreDivergences} thème(s) où les positions diffèrent ·{' '}
              {comparaison.nombreIncompletes} non comparable(s)
            </p>
          </div>
        )}
      </section>

      {erreurs.length > 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
          Choisissez entre {MIN_CANDIDATS} et {MAX_CANDIDATS} candidats pour afficher le tableau
          comparatif.
        </p>
      ) : (
        <>
          <div className="carte overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Comparaison des positions par thème, candidats par ordre alphabétique
              </caption>
              <thead>
                <tr className="border-b border-stone-200 dark:border-nuit-bord">
                  <th scope="col" className="w-48 p-3 align-bottom font-semibold">
                    Thème
                  </th>
                  {selectionnes.map((candidat) => (
                    <th key={candidat.id} scope="col" className="p-3 align-bottom font-semibold">
                      <span
                        className="block border-l-[3px] pl-2"
                        style={{
                          borderLeftColor: candidat.parti?.couleur ?? 'transparent',
                        }}
                      >
                        <Link href={`/candidats/${candidat.id}/`} className="underline-offset-2 hover:underline">
                          {nomComplet(candidat)}
                        </Link>
                        <span className="block text-xs font-normal text-stone-600 dark:text-stone-400">
                          {candidat.parti ? candidat.parti.sigle : 'Sans étiquette'}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              {lignes.map((ligne) => {
                  const repere = REPERES[ligne.statut];
                  return (
                    <tbody key={ligne.theme.id} className="border-b border-stone-200 dark:border-nuit-bord">
                      <tr>
                        <th scope="row" className="p-3 align-top font-medium">
                          <Link
                            href={`/themes/${ligne.theme.id}/`}
                            className="underline-offset-2 hover:underline"
                          >
                            {ligne.theme.libelle}
                          </Link>
                          <span className={`mt-1 block text-xs font-normal ${repere.classes}`}>
                            <span aria-hidden="true">{repere.glyphe}</span> {repere.libelle}
                          </span>
                        </th>
                        {ligne.cellules.map((propositionsCellule, i) => (
                          <td key={selectionnes[i].id} className="p-3 align-top">
                            {propositionsCellule.length === 0 ? (
                              <span className="text-stone-600 dark:text-stone-400">
                                Position non communiquée
                              </span>
                            ) : (
                              <div className="space-y-2">
                                {propositionsCellule.map((proposition) => (
                                  <div key={proposition.id} className="space-y-1.5">
                                    <BadgeNature nature={proposition.nature} />
                                    <p className="leading-relaxed">{proposition.resume}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {ligne.indicateurs.map((indicateur) => (
                        <tr
                          key={indicateur.libelle}
                          className="bg-creme-ombre/60 text-xs dark:bg-nuit/40"
                        >
                          <th scope="row" className="py-1.5 pl-6 pr-3 font-normal text-stone-600 dark:text-stone-400">
                            {indicateur.libelle}
                            {indicateur.divergent && (
                              <span className="ml-1.5 text-amber-800 dark:text-amber-300">
                                <span aria-hidden="true">⇄</span>
                                <span className="sr-only">valeurs différentes</span>
                              </span>
                            )}
                          </th>
                          {indicateur.valeurs.map((valeur, i) => (
                            <td
                              key={selectionnes[i].id}
                              className={`px-3 py-1.5 tabular-nums ${
                                indicateur.divergent ? 'font-semibold' : ''
                              }`}
                            >
                              {valeur ?? <span className="text-stone-600 dark:text-stone-400">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  );
              })}
            </table>
          </div>

          <section
            aria-label="Légende"
            className="space-y-1 carte p-4 text-xs text-stone-600 dark:text-stone-400"
          >
            <p className="font-medium text-stone-900 dark:text-stone-100">Comment lire ce tableau</p>
            {(Object.keys(REPERES) as StatutLigne[]).map((statut) => (
              <p key={statut}>
                <span aria-hidden="true" className="mr-1.5">
                  {REPERES[statut].glyphe}
                </span>
                {REPERES[statut].libelle}
              </p>
            ))}
            <p className="pt-1">
              La mise en évidence est structurelle : elle signale que des positions renseignées
              sont formulées différemment, et aligne les chiffres que les candidats ont eux-mêmes
              énoncés. Aucun score de proximité ni classement n’est calculé.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
