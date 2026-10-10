'use client';

import Link from 'next/link';
import { useState } from 'react';
import BadgeNature from './BadgeNature';
import PortraitCandidat from './PortraitCandidat';
import LienSource from './LienSource';
import { formaterIndicateur } from '@/lib/comparateur';
import { formaterDateCourte, nomComplet, pluriel } from '@/lib/format';
import type { Proposition } from '@/lib/schemas';
import type { CandidatResume } from '@/lib/vues';

export interface LigneTheme {
  candidat: CandidatResume;
  propositions: Proposition[];
}

export default function PositionsDuTheme({ lignes }: { lignes: LigneTheme[] }) {
  const [masquerVides, setMasquerVides] = useState(false);
  const affichees = lignes.filter((l) => !masquerVides || l.propositions.length > 0);
  const renseignees = lignes.filter((l) => l.propositions.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="-my-2 flex items-center gap-2.5 py-2">
          <input
            type="checkbox"
            checked={masquerVides}
            onChange={(e) => setMasquerVides(e.target.checked)}
            className="size-4.5 rounded border-stone-400"
          />
          Masquer les positions non communiquées
        </label>
        <p aria-live="polite" className="text-stone-600 dark:text-stone-400">
          {renseignees} {pluriel(renseignees, 'candidat s’est exprimé', 'candidats se sont exprimés')}{' '}
          sur {lignes.length}
        </p>
      </div>

      {/*
        Sous 640 pixels, le tableau se déplie en blocs empilés : trois colonnes
        dans 340 pixels obligeaient à faire défiler chacune des quarante-quatre
        lignes horizontalement pour lire une position.
      */}
      <div className="carte sm:overflow-x-auto">
        <table className="block w-full border-collapse text-left text-sm sm:table sm:min-w-[42rem]">
          <caption className="sr-only">
            Positions des candidats sur ce thème, par ordre alphabétique
          </caption>
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-stone-200 dark:border-nuit-bord">
              <th scope="col" className="w-52 p-3 font-semibold">
                Candidat
              </th>
              <th scope="col" className="p-3 font-semibold">
                Position
              </th>
              <th scope="col" className="w-64 p-3 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="block sm:table-row-group">
            {affichees.map(({ candidat, propositions }) => (
              <tr
                key={candidat.id}
                className="block border-b border-stone-200 last:border-0 sm:table-row dark:border-nuit-bord"
              >
                <th scope="row" className="block p-3 pb-1.5 text-left align-top font-normal sm:table-cell sm:pb-3">
                  <span
                    className="flex items-center gap-2.5 border-l-[3px] pl-2"
                    style={{ borderLeftColor: candidat.parti?.couleur ?? 'transparent' }}
                  >
                    <PortraitCandidat candidat={candidat} taille={32} />
                    <span className="min-w-0">
                    <Link
                      href={`/candidats/${candidat.id}/`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {nomComplet(candidat)}
                    </Link>
                    <span className="block text-xs text-stone-600 dark:text-stone-400">
                      {candidat.parti ? candidat.parti.sigle : 'Sans étiquette'}
                    </span>
                    </span>
                  </span>
                </th>

                <td className="block px-3 pb-3 pt-0 align-top sm:table-cell sm:p-3">
                  {propositions.length === 0 ? (
                    <span className="text-stone-600 dark:text-stone-400">
                      Position non communiquée
                    </span>
                  ) : (
                    <div className="space-y-3">
                      {propositions.map((proposition) => (
                        <div key={proposition.id} className="space-y-1.5">
                          <BadgeNature nature={proposition.nature} />
                          <p className="leading-relaxed">{proposition.resume}</p>
                          {proposition.indicateurs.length > 0 && (
                            <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-600 dark:text-stone-400">
                              {proposition.indicateurs.map((indicateur) => (
                                <li key={indicateur.libelle}>
                                  {indicateur.libelle} :{' '}
                                  <span className="font-medium tabular-nums text-stone-900 dark:text-stone-100">
                                    {formaterIndicateur(indicateur)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                <td
                  className={
                    propositions.length === 0
                      ? 'hidden align-top sm:table-cell sm:p-3'
                      : 'block px-3 pb-3 pt-0 align-top sm:table-cell sm:p-3'
                  }
                >
                  {propositions.length === 0 ? (
                    <span aria-hidden="true" className="text-stone-400">
                      -
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {propositions.map((proposition) => (
                        <div key={proposition.id} className="space-y-0.5">
                          <LienSource source={proposition.source} />
                          <p className="text-xs text-stone-600 dark:text-stone-400">
                            Vérifié le {formaterDateCourte(proposition.derniere_verification)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
