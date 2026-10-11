import type { Metadata } from 'next';
import ComparateurInteractif from '@/components/ComparateurInteractif';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { MAX_CANDIDATS, MIN_CANDIDATS } from '@/lib/comparateur';
import { derniereMiseAJour, propositions, statistiques, themes } from '@/lib/data';
import { resumesCandidats } from '@/lib/vues';

export const metadata: Metadata = {
  title: 'Comparateur',
  description:
    'Comparer de 2 à 4 candidats à l’élection présidentielle de 2027, thème par thème, en alignant les chiffres qu’ils ont eux-mêmes énoncés.',
};

export default function PageComparateur() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Comparateur</h1>
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">
          Sélectionnez de {MIN_CANDIDATS} à {MAX_CANDIDATS} candidats. L’adresse de la page suit
          votre sélection : le lien est partageable en l’état.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Un thème n’est dit comparable que si deux candidats au moins ont avancé un chiffre sur la
          même grandeur : {statistiques.themesComparables} des {statistiques.themes} thèmes le
          sont aujourd’hui. Ailleurs, le tableau juxtapose deux textes et le dit, plutôt que
          d’annoncer une divergence qu’il n’a pas mesurée.
        </p>
      </header>

      <ComparateurInteractif
        candidats={resumesCandidats()}
        themes={themes}
        propositions={propositions}
      />
    </div>
  );
}
