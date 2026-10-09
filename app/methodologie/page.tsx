import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import BadgeNature from '@/components/BadgeNature';
import BadgeStatut from '@/components/BadgeStatut';
import { derniereMiseAJour, statistiques } from '@/lib/data';
import { LIBELLES_FAMILLE, STATUTS } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Méthodologie',
  description:
    'Sources, règles de rédaction, critères d’inclusion et limites connues des données publiées sur ce site.',
};

const CORRESPONDANCE_FAMILLES: { famille: keyof typeof LIBELLES_FAMILLE; nuances: string }[] = [
  { famille: 'extreme-gauche', nuances: 'EXG' },
  { famille: 'gauche', nuances: 'FI, COM, SOC, RDG, UG, DVG' },
  { famille: 'ecologistes', nuances: 'VEC, ECO' },
  { famille: 'centre', nuances: 'ENS, UDI, DVC' },
  { famille: 'droite', nuances: 'LR, DVD, DSV' },
  { famille: 'extreme-droite', nuances: 'RN, REC, UXD, EXD' },
  { famille: 'regionalistes', nuances: 'REG' },
  { famille: 'divers', nuances: 'DIV et nuances non classées' },
];

export default function PageMethodologie() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Méthodologie</h1>
        <p className="max-w-2xl text-sm text-slate-700 dark:text-slate-300">
          Ce site décrit des positions publiques. Il ne les évalue pas, ne les classe pas et ne
          recommande aucun vote.
        </p>
      </header>

      <section aria-labelledby="sources" className="max-w-2xl space-y-3">
        <h2 id="sources" className="text-lg font-semibold">
          Sources
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Chaque information publiée ici porte une source, un type de source et une date de
          publication. Les sources primaires sont privilégiées dans cet ordre : programme
          officiel, site de campagne, site du parti, décisions du Conseil constitutionnel,
          Journal officiel. À défaut — c’est fréquent tant que les programmes ne sont pas publiés —
          nous citons un article de presse daté qui rapporte une déclaration, et la nature de la
          proposition le signale.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Les sites agrégateurs de programmes, souvent générés automatiquement et sans source
          vérifiable, sont exclus : plusieurs d’entre eux attribuaient à des candidats des
          positions que leurs déclarations récentes contredisent.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Une proposition sans URL de source et sans date de source ne peut pas être enregistrée :
          la validation des données échoue et le site ne se construit pas.
        </p>
      </section>

      <section aria-labelledby="nature" className="max-w-2xl space-y-3">
        <h2 id="nature" className="text-lg font-semibold">
          Mesure de programme ou déclaration publique
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Ces deux statuts ne sont pas équivalents et sont distingués partout, par une forme, une
          bordure et un libellé :
        </p>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature nature="programme_officiel" />
            <span>mesure inscrite dans un programme ou un projet publié par le candidat.</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature nature="declaration_publique" />
            <span>
              position exprimée publiquement — interview, discours, conférence de presse — sans
              être encore inscrite dans un programme publié.
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="absence" className="max-w-2xl space-y-3">
        <h2 id="absence" className="text-lg font-semibold">
          « Position non communiquée »
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Lorsqu’aucune proposition sourcée n’existe pour un couple candidat / thème, le site
          affiche « Position non communiquée ». Cette mention est calculée à l’affichage : l’absence
          n’est jamais stockée comme une donnée, ce qui évite d’affirmer qu’un candidat « n’a rien
          dit » alors que nous n’avons simplement rien trouvé de sourçable. Elle ne signifie donc
          pas que le candidat refuse de se prononcer.
        </p>
      </section>

      <section aria-labelledby="inclusion" className="max-w-2xl space-y-3">
        <h2 id="inclusion" className="text-lg font-semibold">
          Qui figure dans la liste
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Toute candidature publiquement annoncée est recensée, sans seuil de sondage ni
          appréciation de son « poids politique ». Comme la liste comporte un grand nombre de
          candidatures dont certaines ne sont documentées par aucune proposition, la vue Candidats
          applique par défaut un filtre factuel : <em>au moins une proposition sourcée</em>. Ce
          filtre se désactive d’un clic et n’exclut personne des données.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Un candidat <em>pressenti</em> n’est recensé que s’il exerce ou a exercé un mandat
          électif ou une fonction gouvernementale. Ce critère est factuel et évite de présenter
          comme candidate une personnalité qui ne s’est jamais exprimée sur le sujet et n’a aucune
          activité politique — plusieurs noms circulant dans la presse sont dans ce cas et ne
          figurent pas ici.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Les parrainages n’étant pas encore déposés auprès du Conseil constitutionnel, aucune
          candidature n’est officiellement validée. Les statuts utilisés sont :
        </p>
        <ul className="flex flex-wrap gap-2">
          {STATUTS.map((statut) => (
            <li key={statut}>
              <BadgeStatut statut={statut} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="familles" className="max-w-3xl space-y-3">
        <h2 id="familles" className="text-lg font-semibold">
          Famille politique
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          C’est le champ le plus discutable de ce site, parce que tout regroupement est une
          convention. Nous en publions donc la règle plutôt que de la laisser implicite. Chaque
          parti porte deux informations distinctes : la <strong>nuance du ministère de
          l’Intérieur</strong>, qui est une donnée officielle, et son <strong>positionnement
          déclaré</strong>, formulé par le parti lui-même. La famille, utilisée uniquement pour le
          filtre, regroupe les nuances ainsi :
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          La nuance n’est renseignée que lorsque son code officiel est certain ; elle s’affiche
          « Non renseignée » dans le cas contraire, plutôt que d’être devinée.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[32rem] border-collapse bg-white text-left text-sm dark:bg-slate-900">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="p-3 font-semibold">
                  Famille (filtre)
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Nuances regroupées
                </th>
              </tr>
            </thead>
            <tbody>
              {CORRESPONDANCE_FAMILLES.map((ligne) => (
                <tr
                  key={ligne.famille}
                  className="border-b border-slate-200 last:border-0 dark:border-slate-800"
                >
                  <th scope="row" className="p-3 font-medium">
                    {LIBELLES_FAMILLE[ligne.famille]}
                  </th>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{ligne.nuances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="comparateur" className="max-w-2xl space-y-3">
        <h2 id="comparateur" className="text-lg font-semibold">
          Ce que fait — et ne fait pas — le comparateur
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          La mise en évidence des divergences est structurelle. Le comparateur signale qu’un thème
          est renseigné chez tous les candidats sélectionnés et que les formulations diffèrent, ou
          qu’une position manque et que la ligne n’est donc pas comparable. Il aligne par ailleurs
          les indicateurs chiffrés que les candidats ont eux-mêmes énoncés, et marque ceux dont les
          valeurs diffèrent.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Les libellés et les unités de ces indicateurs sont harmonisés d’un candidat à l’autre
          pour que la comparaison porte sur la même notion — « 40 années de cotisation » et
          « 40 annuités » sont ramenés à une même unité. Le résumé et le détail de la proposition
          conservent, eux, les termes employés par le candidat. Lorsqu’un candidat n’a pas chiffré
          un indicateur, la cellule reste vide : une absence n’est jamais comptée comme une valeur
          différente.
        </p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Il ne calcule aucun score de proximité, ne place aucun candidat sur un axe et ne qualifie
          jamais une position de plus ou moins radicale, réaliste ou coûteuse. Deux positions
          marquées comme divergentes peuvent être très proches sur le fond : seule leur formulation
          est comparée.
        </p>
      </section>

      <section aria-labelledby="redaction" className="max-w-2xl space-y-3">
        <h2 id="redaction" className="text-lg font-semibold">
          Règles de rédaction
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            Même structure, même niveau de détail et même ton factuel pour tous les candidats.
          </li>
          <li>
            Les propositions sont résumées dans les termes du candidat ; les verbatim sont entre
            guillemets.
          </li>
          <li>Ordre alphabétique partout : candidats par nom de famille, partis et thèmes par libellé.</li>
          <li>
            Les couleurs de parti sont un repère ; une forme et un libellé portent toujours la même
            information, pour rester lisible sans distinguer les couleurs.
          </li>
          <li>
            Aucune photographie de candidat : les portraits de presse sont soumis à droits. Un
            monogramme tient lieu de repère visuel.
          </li>
          <li>
            Les couleurs attribuées aux partis suivent les conventions habituelles de la presse ;
            elles n’ont aucun caractère officiel.
          </li>
        </ul>
      </section>

      <section aria-labelledby="limites" className="max-w-2xl space-y-3">
        <h2 id="limites" className="text-lg font-semibold">
          Limites connues
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            Le site compte {statistiques.propositions} propositions pour{' '}
            {statistiques.candidats} candidats : la couverture est très inégale d’un candidat et
            d’un thème à l’autre, parce que la plupart des programmes ne sont pas publiés.
          </li>
          <li>
            Une position rapportée par la presse peut être résumée ou tronquée par rapport à ce que
            le candidat a dit. Le lien vers la source permet de le vérifier.
          </li>
          <li>
            Les positions évoluent. La date de source et la date de dernière vérification sont
            affichées pour que l’ancienneté d’une information soit visible.
          </li>
          <li>
            Les informations incertaines, contradictoires ou non sourçables sont consignées dans le
            fichier <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">DONNEES_A_VERIFIER.md</code>{' '}
            du dépôt plutôt que publiées ici.
          </li>
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/" className="underline underline-offset-2">
          Retour à l’accueil
        </Link>
      </p>
    </article>
  );
}
