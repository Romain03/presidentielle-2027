import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import TestProximite, { type CandidatClient, type QuestionClient } from '@/components/TestProximite';
import { derniereMiseAJour, getCandidat, getParti, getTheme, partis } from '@/lib/data';
import {
  MIN_CANDIDATS_ELIGIBLES,
  MIN_CANDIDATS_PAR_QUESTION,
  MIN_QUESTIONS_ACTIVES,
  appartenances,
  etatDuTest,
} from '@/lib/test';
import { LIBELLES_FAMILLE } from '@/lib/schemas';
import { pluriel } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Test de proximité',
  description:
    'Comparer ses réponses aux chiffres annoncés par les candidats à l’élection présidentielle de 2027, thème par thème.',
};

export default function PageTest() {
  const etat = etatDuTest();

  const questions: QuestionClient[] = etat.questionsActives.map(({ question, positions }) => ({
    id: question.id,
    intitule: question.intitule,
    precision: question.precision,
    dimension: question.dimension,
    theme: {
      id: question.theme_id,
      libelle: getTheme(question.theme_id)?.libelle ?? question.theme_id,
    },
    options: question.options,
    positions: positions.map((p) => ({
      candidatId: p.candidatId,
      valeur: p.valeur,
      valeurAffichee: p.valeurAffichee,
    })),
  }));

  const idsConcernes = new Set(questions.flatMap((q) => q.positions.map((p) => p.candidatId)));
  const candidatsClient: CandidatClient[] = [...idsConcernes]
    .map((id) => getCandidat(id)!)
    .map((candidat) => {
      const parti = getParti(candidat.parti_id);
      return {
        id: candidat.id,
        nom: candidat.nom,
        prenom: candidat.prenom,
        photo: candidat.photo,
        parti: parti
          ? { id: parti.id, nom: parti.nom, sigle: parti.sigle, couleur: parti.couleur }
          : null,
      };
    });

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold sm:text-4xl">Test de proximité</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Répondez sur des mesures chiffrées que des candidats ont réellement annoncées, et voyez
          de qui vos réponses vous rapprochent.
        </p>
        <div className="max-w-2xl space-y-3 rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <p>
            <strong className="font-semibold">Aucune question n’est inventée.</strong> Chacune
            porte sur un chiffre qu’au moins {MIN_CANDIDATS_PAR_QUESTION} candidats ont eux-mêmes
            énoncé, et leur position est reprise telle quelle. Le site ne cherche jamais à deviner
            si un candidat serait « pour » ou « contre » une formulation abstraite.
          </p>
          <p>
            <strong className="font-semibold">Un test de proximité ne dit pas pour qui voter.</strong>{' '}
            Il mesure un écart entre des chiffres, sur un petit nombre de sujets. Il ignore tout
            des raisons qui conduisent chacun à son chiffre, de sa crédibilité et des thèmes non
            abordés.
          </p>
        </div>
      </header>

      {etat.actif ? (
        <TestProximite
          questions={questions}
          candidats={candidatsClient}
          appartenances={appartenances()}
          libellesPartis={Object.fromEntries(partis.map((p) => [p.id, `${p.nom} (${p.sigle})`]))}
          libellesFamilles={LIBELLES_FAMILLE}
          couleursPartis={Object.fromEntries(partis.map((p) => [p.id, p.couleur]))}
        />
      ) : (
        <section className="space-y-5">
          <div className="carte space-y-4 p-6">
            <h2 className="font-serif text-xl font-semibold">
              Le test n’est pas encore disponible
            </h2>
            <p className="leading-relaxed text-stone-700 dark:text-stone-300">
              Il s’allumera tout seul dès que les programmes publiés permettront un calcul qui
              veuille dire quelque chose. Afficher aujourd’hui « 87 % d’affinité » calculé sur
              deux questions sur quinze ne serait pas une approximation : ce serait un chiffre
              fabriqué par la méthode.
            </p>
            <div>
              <h3 className="text-sm font-semibold">Ce qui manque</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                {etat.manques.map((manque) => (
                  <li key={manque}>{manque}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Les règles d’activation</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                <li>
                  Une question n’est posée que si au moins {MIN_CANDIDATS_PAR_QUESTION} candidats
                  ont annoncé un chiffre dessus.
                </li>
                <li>Il faut au moins {MIN_QUESTIONS_ACTIVES} questions de ce type.</li>
                <li>
                  Il faut au moins {MIN_CANDIDATS_ELIGIBLES} candidats ayant une position sur la
                  moitié des questions au minimum.
                </li>
              </ul>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Où en sont les questions</h2>
            <ul className="space-y-2">
              {[...etat.questionsActives, ...etat.questionsEcartees]
                .sort((a, b) => b.positions.length - a.positions.length)
                .map(({ question, positions }) => {
                  const prete = positions.length >= MIN_CANDIDATS_PAR_QUESTION;
                  return (
                    <li
                      key={question.id}
                      className="carte flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{question.intitule}</span>
                        <span className="block text-xs text-stone-600 dark:text-stone-400">
                          <Link href={`/themes/${question.theme_id}/`} className="lien">
                            {getTheme(question.theme_id)?.libelle}
                          </Link>
                        </span>
                      </span>
                      <span className="text-sm tabular-nums">
                        <span className={prete ? 'font-semibold' : ''}>
                          {positions.length}
                        </span>
                        <span className="text-xs text-stone-600 dark:text-stone-400">
                          {' '}
                          {pluriel(positions.length, 'candidat', 'candidats')} ·{' '}
                          {prete ? 'retenue' : `il en faut ${MIN_CANDIDATS_PAR_QUESTION}`}
                        </span>
                      </span>
                    </li>
                  );
                })}
            </ul>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Les prochaines échéances qui devraient débloquer le test : la parution de
              « L’Avenir en commun » le 6 novembre 2026, le résultat de la primaire socialiste, et
              la publication du programme du Rassemblement national. Voir la{' '}
              <Link href="/methodologie/" className="lien">
                méthodologie
              </Link>{' '}
              pour la méthode de calcul.
            </p>
          </section>
        </section>
      )}
    </article>
  );
}
