'use client';

import { useMemo, useState } from 'react';
import CandidatCarte from './CandidatCarte';
import { FAMILLES, LIBELLES_FAMILLE, LIBELLES_STATUT, STATUTS } from '@/lib/schemas';
import { pluriel } from '@/lib/format';
import type { CandidatResume, PartiResume } from '@/lib/vues';

// Hauteur confortable au doigt sur mobile, compacte au pointeur fin.
const CLASSES_CHAMP =
  'min-h-11 w-full rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm sm:min-h-0 sm:py-1.5 dark:border-stone-700 dark:bg-nuit-clair';

export default function FiltresCandidats({
  candidats,
  partis,
}: {
  candidats: CandidatResume[];
  partis: PartiResume[];
}) {
  const [parti, setParti] = useState('');
  const [famille, setFamille] = useState('');
  const [statut, setStatut] = useState('');
  // Critère d'inclusion par défaut, documenté dans la méthodologie : factuel,
  // il n'écarte personne sur un jugement de « poids politique ».
  const [avecPropositions, setAvecPropositions] = useState(true);

  const affiches = useMemo(
    () =>
      candidats.filter(
        (c) =>
          (parti === '' || c.parti?.id === parti) &&
          (famille === '' || c.parti?.famille === famille) &&
          (statut === '' || c.statut === statut) &&
          (!avecPropositions || c.nombrePropositions > 0),
      ),
    [candidats, parti, famille, statut, avecPropositions],
  );

  const filtreActif =
    parti !== '' || famille !== '' || statut !== '' || avecPropositions !== true;

  function reinitialiser() {
    setParti('');
    setFamille('');
    setStatut('');
    setAvecPropositions(true);
  }

  // Familles et statuts réellement présents dans les données.
  const famillesPresentes = FAMILLES.filter((f) => candidats.some((c) => c.parti?.famille === f));
  const statutsPresents = STATUTS.filter((s) => candidats.some((c) => c.statut === s));

  return (
    <>
      <section
        aria-label="Filtres"
        className="carte p-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="filtre-parti" className="block pb-1 text-xs font-medium">
              Parti
            </label>
            <select
              id="filtre-parti"
              value={parti}
              onChange={(e) => setParti(e.target.value)}
              className={CLASSES_CHAMP}
            >
              <option value="">Tous les partis</option>
              {partis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.sigle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtre-famille" className="block pb-1 text-xs font-medium">
              Famille politique
            </label>
            <select
              id="filtre-famille"
              value={famille}
              onChange={(e) => setFamille(e.target.value)}
              className={CLASSES_CHAMP}
            >
              <option value="">Toutes les familles</option>
              {famillesPresentes.map((f) => (
                <option key={f} value={f}>
                  {LIBELLES_FAMILLE[f]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtre-statut" className="block pb-1 text-xs font-medium">
              Statut
            </label>
            <select
              id="filtre-statut"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className={CLASSES_CHAMP}
            >
              <option value="">Tous les statuts</option>
              {statutsPresents.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-nuit-bord">
          <label className="-my-2 flex items-center gap-2.5 py-2 text-sm">
            <input
              type="checkbox"
              checked={avecPropositions}
              onChange={(e) => setAvecPropositions(e.target.checked)}
              className="size-4.5 rounded border-stone-400"
            />
            Seulement les candidats ayant au moins une proposition sourcée
          </label>

          <div className="flex items-center gap-3">
            <p aria-live="polite" className="text-sm text-stone-600 dark:text-stone-400">
              {affiches.length} {pluriel(affiches.length, 'candidat affiché', 'candidats affichés')}{' '}
              sur {candidats.length}
            </p>
            {filtreActif && (
              <button
                type="button"
                onClick={reinitialiser}
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </section>

      {affiches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
          Aucun candidat ne correspond à ces filtres.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {affiches.map((c) => (
            <CandidatCarte key={c.id} candidat={c} />
          ))}
        </ul>
      )}
    </>
  );
}
