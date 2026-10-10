'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import PortraitCandidat from './PortraitCandidat';
import { nomComplet, pluriel } from '@/lib/format';
import { agreger, type Appartenance } from '@/lib/test-calcul';
import { LIBELLES_DIMENSION, type Dimension, type Photo } from '@/lib/schemas';

export interface OptionClient {
  valeur: number;
  libelle: string;
}

export interface QuestionClient {
  id: string;
  intitule: string;
  precision: string | null;
  theme: { id: string; libelle: string };
  dimension: Dimension;
  options: OptionClient[];
  positions: { candidatId: string; valeur: number; valeurAffichee: string }[];
}

export interface CandidatClient {
  id: string;
  nom: string;
  prenom: string;
  photo: Photo | null;
  parti: { id: string; nom: string; sigle: string; couleur: string } | null;
}

export interface AffiniteClient {
  id: string;
  libelle: string;
  score: number;
  comparees: number;
  total: number;
  couleur?: string;
}

const PAS_DE_REPONSE = 'abstention';

/** Barre d'affinité. Le pourcentage est toujours accompagné de son dénominateur. */
function Barre({ affinite }: { affinite: AffiniteClient }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium">{affinite.libelle}</span>
        <span className="text-sm tabular-nums">
          <strong className="font-semibold">{affinite.score} %</strong>
          <span className="ml-1.5 text-xs text-stone-600 dark:text-stone-400">
            sur {affinite.comparees} {pluriel(affinite.comparees, 'question', 'questions')} sur{' '}
            {affinite.total}
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-creme-ombre dark:bg-nuit">
        <div
          className="h-full rounded-full"
          style={{
            width: `${affinite.score}%`,
            backgroundColor: affinite.couleur ?? 'var(--color-stone-500)',
          }}
        />
      </div>
    </div>
  );
}

export default function TestProximite({
  questions,
  candidats,
  appartenances,
  libellesPartis,
  libellesFamilles,
  couleursPartis,
}: {
  questions: QuestionClient[];
  candidats: CandidatClient[];
  appartenances: Record<string, Appartenance>;
  libellesPartis: Record<string, string>;
  libellesFamilles: Record<string, string>;
  couleursPartis: Record<string, string>;
  /** Bornes de l'axe, fournies par le serveur pour rester cohérentes. */
}) {
  const [reponses, setReponses] = useState<Record<string, number | null>>({});
  const [affiches, setAffiches] = useState(false);
  const zoneResultats = useRef<HTMLDivElement>(null);

  const repondues = Object.values(reponses).filter((v) => typeof v === 'number').length;
  const parId = useMemo(() => new Map(candidats.map((c) => [c.id, c])), [candidats]);

  const resultats = useMemo(() => {
    if (!affiches) return null;
    const brut = agreger(
      questions.map((q) => ({ id: q.id, options: q.options, positions: q.positions })),
      appartenances,
      reponses,
    );
    const habiller = (
      affinites: typeof brut.candidats,
      libelle: (id: string) => string,
      couleur?: (id: string) => string | undefined,
    ): AffiniteClient[] =>
      affinites.map((a) => ({ ...a, libelle: libelle(a.id), couleur: couleur?.(a.id) }));

    return {
      ...brut,
      candidatsHabilles: habiller(
        brut.candidats,
        (id) => {
          const c = parId.get(id);
          return c ? nomComplet(c) : id;
        },
        (id) => parId.get(id)?.parti?.couleur,
      ),
      partisHabilles: habiller(
        brut.partis,
        (id) => libellesPartis[id] ?? id,
        (id) => couleursPartis[id],
      ),
      famillesHabillees: habiller(brut.familles, (id) => libellesFamilles[id] ?? id),
    };
  }, [
    affiches,
    reponses,
    questions,
    appartenances,
    parId,
    libellesPartis,
    libellesFamilles,
    couleursPartis,
  ]);

  function repondre(questionId: string, valeur: string) {
    setReponses((precedent) => ({
      ...precedent,
      [questionId]: valeur === PAS_DE_REPONSE ? null : Number(valeur),
    }));
  }

  function voirLesResultats() {
    setAffiches(true);
    requestAnimationFrame(() =>
      zoneResultats.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  return (
    <div className="space-y-8">
      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li key={question.id} className="carte p-5">
            <fieldset>
              <legend className="space-y-1.5">
                <span className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                  <span>
                    Question {index + 1} sur {questions.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <Link href={`/themes/${question.theme.id}/`} className="lien">
                    {question.theme.libelle}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <span>{LIBELLES_DIMENSION[question.dimension]}</span>
                </span>
                <span className="block font-serif text-lg font-semibold">{question.intitule}</span>
                {question.precision !== null && (
                  <span className="block text-sm text-stone-600 dark:text-stone-400">
                    {question.precision}
                  </span>
                )}
              </legend>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {[
                  ...question.options.map((o) => ({
                    cle: String(o.valeur),
                    libelle: o.libelle,
                  })),
                  { cle: PAS_DE_REPONSE, libelle: 'Je ne me prononce pas' },
                ].map((option) => {
                  const coche =
                    option.cle === PAS_DE_REPONSE
                      ? question.id in reponses && reponses[question.id] === null
                      : reponses[question.id] === Number(option.cle);
                  return (
                    <label
                      key={option.cle}
                      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        coche
                          ? 'border-transparent bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900'
                          : 'border-stone-900/15 hover:bg-creme-ombre dark:border-white/15 dark:hover:bg-nuit'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.cle}
                        checked={coche}
                        onChange={(e) => repondre(question.id, e.target.value)}
                        className="sr-only"
                      />
                      {option.libelle}
                    </label>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
                {question.positions.length}{' '}
                {pluriel(
                  question.positions.length,
                  'candidat a annoncé un chiffre',
                  'candidats ont annoncé un chiffre',
                )}{' '}
                sur cette question.
              </p>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={voirLesResultats}
          disabled={repondues === 0}
          className="rounded-full bg-stone-800 px-5 py-2.5 text-sm font-medium text-stone-50 transition-opacity disabled:opacity-40 dark:bg-stone-200 dark:text-stone-900"
        >
          Voir mes résultats
        </button>
        <p aria-live="polite" className="text-sm text-stone-600 dark:text-stone-400">
          {repondues} {pluriel(repondues, 'réponse', 'réponses')} sur {questions.length}
        </p>
        {affiches && (
          <button
            type="button"
            onClick={() => {
              setReponses({});
              setAffiches(false);
            }}
            className="text-sm text-stone-600 underline underline-offset-2 dark:text-stone-400"
          >
            Recommencer
          </button>
        )}
      </div>

      <div ref={zoneResultats}>
        {resultats !== null && resultats.questionsRepondues > 0 && (
          <div className="space-y-8 border-t border-stone-900/10 pt-8 dark:border-white/10">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Vos résultats</h2>
              <p className="max-w-2xl rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
                Ces pourcentages ne mesurent que l’écart entre vos réponses et les chiffres
                annoncés par les candidats sur ces {resultats.questionsRepondues}{' '}
                {pluriel(resultats.questionsRepondues, 'question', 'questions')}. Ils ne disent
                rien des thèmes non abordés, ni des raisons qui conduisent chacun à son chiffre.
                Le dénominateur est affiché partout : un candidat comparé sur deux questions
                n’est pas comparable à un candidat comparé sur dix.
              </p>
            </section>

            {resultats.famillesHabillees.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-serif text-lg font-semibold">Familles politiques</h3>
                <div className="carte space-y-4 p-5">
                  {resultats.famillesHabillees.map((f) => (
                    <Barre key={f.id} affinite={f} />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="font-serif text-lg font-semibold">Candidats</h3>
              <ul className="space-y-2">
                {resultats.candidatsHabilles.map((affinite) => {
                  const candidat = parId.get(affinite.id);
                  if (!candidat) return null;
                  return (
                    <li key={affinite.id}>
                      <Link
                        href={`/candidats/${affinite.id}/`}
                        className="carte carte-interactive flex items-center gap-3.5 p-3.5"
                      >
                        <PortraitCandidat candidat={candidat} taille={40} />
                        <span className="min-w-0 flex-1">
                          <Barre
                            affinite={{
                              ...affinite,
                              libelle: nomComplet(candidat),
                              couleur: candidat.parti?.couleur,
                            }}
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {resultats.partisHabilles.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-serif text-lg font-semibold">Partis</h3>
                <div className="carte space-y-4 p-5">
                  {resultats.partisHabilles.map((p) => (
                    <Barre key={p.id} affinite={p} />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="font-serif text-lg font-semibold">Question par question</h3>
              <ul className="space-y-3">
                {questions
                  .filter((q) => typeof reponses[q.id] === 'number')
                  .map((question) => {
                    const choix = reponses[question.id] as number;
                    return (
                      <li key={question.id} className="carte p-4">
                        <p className="text-sm font-medium">{question.intitule}</p>
                        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                          Votre réponse :{' '}
                          <strong className="font-semibold text-stone-900 dark:text-stone-100">
                            {question.options.find((o) => o.valeur === choix)?.libelle}
                          </strong>
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {question.positions.map((position) => {
                            const candidat = parId.get(position.candidatId);
                            if (!candidat) return null;
                            const identique = position.valeur === choix;
                            return (
                              <li
                                key={position.candidatId}
                                className={
                                  identique
                                    ? 'font-semibold'
                                    : 'text-stone-600 dark:text-stone-400'
                                }
                              >
                                {identique && <span aria-hidden="true">✓ </span>}
                                {nomComplet(candidat)} : {position.valeurAffichee}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  })}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
