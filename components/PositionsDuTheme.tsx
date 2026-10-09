'use client';

import Link from 'next/link';
import { useState } from 'react';
import BadgeNature from './BadgeNature';
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={masquerVides}
            onChange={(e) => setMasquerVides(e.target.checked)}
            className="size-4 rounded border-stone-400"
          />
          Masquer les positions non communiquées
        </label>
        <p aria-live="polite" className="text-stone-600 dark:text-stone-400">
          {renseignees} {pluriel(renseignees, 'candidat s’est exprimé', 'candidats se sont exprimés')}{' '}
          sur {lignes.length}
        </p>
      </div>

      <div className="carte overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Positions des candidats sur ce thème, par ordre alphabétique
          </caption>
          <thead>
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
          <tbody>
            {affichees.map(({ candidat, propositions }) => (
              <tr
                key={candidat.id}
                className="border-b border-stone-200 last:border-0 dark:border-nuit-bord"
              >
                <th scope="row" className="p-3 align-top font-normal">
                  <span
                    className="block border-l-[3px] pl-2"
                    style={{ borderLeftColor: candidat.parti?.couleur ?? 'transparent' }}
                  >
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
                </th>

                <td className="p-3 align-top">
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

                <td className="p-3 align-top">
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
