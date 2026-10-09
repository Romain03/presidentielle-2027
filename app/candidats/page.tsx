import type { Metadata } from 'next';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import FiltresCandidats from '@/components/FiltresCandidats';
import { derniereMiseAJour, partis } from '@/lib/data';
import { resumesCandidats } from '@/lib/vues';

export const metadata: Metadata = {
  title: 'Candidats',
  description:
    'Les candidats à l’élection présidentielle de 2027, filtrables par parti, famille politique et statut.',
};

export default function PageCandidats() {
  const candidats = resumesCandidats();
  const resumesPartis = partis.map((p) => ({
    id: p.id,
    nom: p.nom,
    sigle: p.sigle,
    couleur: p.couleur,
    famille: p.famille,
  }));

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Candidats</h1>
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">
          Ordre alphabétique par nom de famille. Les parrainages n’étant pas encore déposés
          auprès du Conseil constitutionnel, cette liste n’est pas définitive.
        </p>
      </header>

      <FiltresCandidats candidats={candidats} partis={resumesPartis} />
    </div>
  );
}
