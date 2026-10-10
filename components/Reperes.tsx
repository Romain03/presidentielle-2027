import LienSource from '@/components/LienSource';
import { age, formaterDate } from '@/lib/format';
import type { Biographie, Source } from '@/lib/schemas';

/**
 * Repères biographiques, dans le même ordre et avec les mêmes intitulés pour
 * tout le monde. Une case non documentée s'affiche vide plutôt que d'être
 * comblée ou escamotée : l'absence est une information, et la masquer
 * donnerait aux fiches les mieux renseignées l'apparence d'une norme.
 */

function Case({
  intitule,
  children,
  source,
  large,
}: {
  intitule: string;
  children: React.ReactNode;
  source?: Source;
  large?: boolean;
}) {
  return (
    <div className={large ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-stone-600 dark:text-stone-400">{intitule}</dt>
      <dd className="space-y-0.5 text-sm">
        {children}
        {source !== undefined && <LienSource source={source} />}
      </dd>
    </div>
  );
}

function NonRenseigne({ accord = '' }: { accord?: string }) {
  return <span className="text-stone-600 dark:text-stone-400">Non renseigné{accord}</span>;
}

export default function Reperes({
  biographie,
  reference,
}: {
  biographie: Biographie;
  reference: string;
}) {
  const { naissance, formations, metiers, situation } = biographie;
  const annees = naissance !== null ? age(naissance, reference) : null;

  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      <Case intitule="Naissance" source={naissance?.source}>
        {naissance === null ? (
          <NonRenseigne accord="e" />
        ) : (
          <span className="block">
            {naissance.date !== null ? formaterDate(naissance.date) : naissance.annee}
            {naissance.lieu !== null && ` à ${naissance.lieu}`}
            {annees !== null && (
              <span className="text-stone-600 dark:text-stone-400"> - {annees} ans</span>
            )}
          </span>
        )}
      </Case>

      <Case intitule="Études supérieures" source={formations[0]?.source}>
        {formations.length === 0 ? (
          <NonRenseigne accord="es" />
        ) : (
          <span className="block">{formations.map((f) => f.libelle).join(', ')}</span>
        )}
      </Case>

      <Case intitule="Métiers exercés" source={metiers[0]?.source}>
        {metiers.length === 0 ? (
          <NonRenseigne accord="s" />
        ) : (
          <span className="block">{metiers.map((m) => m.libelle).join(', ')}</span>
        )}
      </Case>

      <Case
        intitule={situation !== null ? `Fonction en ${situation.annee}` : 'Fonction actuelle'}
        source={situation?.source}
      >
        {situation === null ? <NonRenseigne accord="e" /> : (
          <span className="block">{situation.libelle}</span>
        )}
      </Case>
    </dl>
  );
}
