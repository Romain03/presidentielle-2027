import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import BadgeNature from '@/components/BadgeNature';
import BadgeStatut from '@/components/BadgeStatut';
import { candidats, derniereMiseAJour, statistiques } from '@/lib/data';
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
        <p className="max-w-2xl text-sm text-stone-700 dark:text-stone-300">
          Ce site décrit des positions publiques. Il ne les évalue pas, ne les classe pas et ne
          recommande aucun vote.
        </p>
      </header>

      <section aria-labelledby="sources" className="max-w-2xl space-y-3">
        <h2 id="sources" className="text-lg font-semibold">
          Sources
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Chaque information publiée ici porte une source, un type de source et une date de
          publication. Les sources primaires sont privilégiées dans cet ordre : programme
          officiel, site de campagne, site du parti, décisions du Conseil constitutionnel,
          Journal officiel. À défaut - c’est fréquent tant que les programmes ne sont pas publiés -
          nous citons un article de presse daté qui rapporte une déclaration, et la nature de la
          proposition le signale.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les sites agrégateurs de programmes, souvent générés automatiquement et sans source
          vérifiable, sont exclus : plusieurs d’entre eux attribuaient à des candidats des
          positions que leurs déclarations récentes contredisent.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Une proposition sans URL de source et sans date de source ne peut pas être enregistrée :
          la validation des données échoue et le site ne se construit pas.
        </p>
      </section>

      <section aria-labelledby="nature" className="max-w-2xl space-y-3">
        <h2 id="nature" className="text-lg font-semibold">
          Mesure de programme ou déclaration publique
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Ces deux statuts ne sont pas équivalents et sont distingués partout, par une forme, une
          bordure et un libellé :
        </p>
        <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature nature="programme_officiel" />
            <span>mesure inscrite dans un programme ou un projet publié par le candidat.</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature nature="declaration_publique" />
            <span>
              position exprimée publiquement - interview, discours, conférence de presse - sans
              être encore inscrite dans un programme publié.
            </span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="absence" className="max-w-2xl space-y-3">
        <h2 id="absence" className="text-lg font-semibold">
          « Position non communiquée »
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
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
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Toute candidature publiquement annoncée est recensée, sans seuil de sondage ni
          appréciation de son « poids politique ». Comme la liste comporte un grand nombre de
          candidatures dont certaines ne sont documentées par aucune proposition, la vue Candidats
          applique par défaut un filtre factuel : <em>au moins une proposition sourcée</em>. Ce
          filtre se désactive d’un clic et n’exclut personne des données.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Un candidat <em>pressenti</em> n’est recensé que s’il exerce ou a exercé un mandat
          électif ou une fonction gouvernementale. Ce critère est factuel et évite de présenter
          comme candidate une personnalité qui ne s’est jamais exprimée sur le sujet et n’a aucune
          activité politique - plusieurs noms circulant dans la presse sont dans ce cas et ne
          figurent pas ici.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
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
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          C’est le champ le plus discutable de ce site, parce que tout regroupement est une
          convention. Nous en publions donc la règle plutôt que de la laisser implicite. Chaque
          parti porte deux informations distinctes : la <strong>nuance du ministère de
          l’Intérieur</strong>, qui est une donnée officielle, et son <strong>positionnement
          déclaré</strong>, formulé par le parti lui-même. La famille, utilisée uniquement pour le
          filtre, regroupe les nuances ainsi :
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          La nuance n’est renseignée que lorsque son code officiel est certain ; elle s’affiche
          « Non renseignée » dans le cas contraire, plutôt que d’être devinée.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Chaque famille dispose d’une{' '}
          <Link href="/familles/" className="lien">
            page dédiée
          </Link>
          . Elle indique qui la compose et rapproche ce que ses candidats ont déclaré, en
          regroupant les valeurs chiffrées identiques. Elle ne formule aucune définition de ce que
          la famille « pense » : appartenir à la même famille n’implique aucun accord, et deux
          candidats peuvent avancer le même chiffre pour des raisons opposées. Un indicateur
          énoncé par un seul candidat n’y figure pas, puisqu’il n’apprend rien sur la famille.
        </p>
        {/* Deux colonnes dans 340 pixels : empilées sous 640, comme ailleurs. */}
        <div className="carte sm:overflow-x-auto">
          <table className="block w-full border-collapse text-left text-sm sm:table sm:min-w-[32rem]">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-stone-200 dark:border-nuit-bord">
                <th scope="col" className="p-3 font-semibold">
                  Famille (filtre)
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Nuances regroupées
                </th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {CORRESPONDANCE_FAMILLES.map((ligne) => (
                <tr
                  key={ligne.famille}
                  className="block border-b border-stone-200 last:border-0 sm:table-row dark:border-nuit-bord"
                >
                  <th
                    scope="row"
                    className="block p-3 pb-0.5 text-left font-medium sm:table-cell sm:pb-3"
                  >
                    <Link href={`/familles/${ligne.famille}/`} className="lien">
                      {LIBELLES_FAMILLE[ligne.famille]}
                    </Link>
                  </th>
                  <td className="block px-3 pb-3 pt-0 text-stone-700 sm:table-cell sm:p-3 dark:text-stone-300">
                    {ligne.nuances}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="comparateur" className="max-w-2xl space-y-3">
        <h2 id="comparateur" className="text-lg font-semibold">
          Ce que fait - et ne fait pas - le comparateur
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          La mise en évidence des divergences est structurelle. Le comparateur signale qu’un thème
          est renseigné chez tous les candidats sélectionnés et que les formulations diffèrent, ou
          qu’une position manque et que la ligne n’est donc pas comparable. Il aligne par ailleurs
          les indicateurs chiffrés que les candidats ont eux-mêmes énoncés, et marque ceux dont les
          valeurs diffèrent.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les libellés et les unités de ces indicateurs sont harmonisés d’un candidat à l’autre
          pour que la comparaison porte sur la même notion - « 40 années de cotisation » et
          « 40 annuités » sont ramenés à une même unité. Le résumé et le détail de la proposition
          conservent, eux, les termes employés par le candidat. Lorsqu’un candidat n’a pas chiffré
          un indicateur, la cellule reste vide : une absence n’est jamais comptée comme une valeur
          différente.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <strong className="font-semibold">Le comparateur</strong> ne calcule aucun score de
          proximité, ne place aucun candidat sur un axe et ne qualifie jamais une position de plus
          ou moins radicale, réaliste ou coûteuse. Deux positions marquées comme divergentes
          peuvent être très proches sur le fond : seule leur formulation est comparée. Cet
          engagement vaut pour le comparateur et pour lui seul ; le{' '}
          <Link href="/test/" className="lien">
            test de proximité
          </Link>{' '}
          est un outil distinct, dont la méthode et les limites sont décrites ci-dessous.
        </p>
      </section>

      <section aria-labelledby="test" className="max-w-2xl space-y-3">
        <h2 id="test" className="text-lg font-semibold">
          Le test de proximité
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Le test compare vos réponses aux chiffres que les candidats ont annoncés. C'est le seul
          endroit du site qui produit un pourcentage, et il obéit à des règles strictes, parce
          qu'un score de proximité mal construit est plus trompeur qu'une absence de score.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <li>
            <strong className="font-semibold">Aucune question n'est inventée.</strong> Chacune
            porte sur un indicateur chiffré qu'au moins quatre candidats ont énoncé eux-mêmes -
            un âge de départ, une durée de cotisation. Leur position est reprise telle quelle,
            sans qu'on ait à deviner s'ils seraient « pour » ou « contre » une formulation
            abstraite. C'est ce qui distingue ce test de la plupart des questionnaires du genre,
            où le rédacteur des questions décide du résultat.
          </li>
          <li>
            <strong className="font-semibold">Certaines valeurs ne sont pas comparables</strong> et
            sont écartées plutôt que converties : « 2 000 euros bruts » et « 1 700 euros nets » ne
            se comparent pas en l'état, pas plus que « 3 % par an » et « 20 % sur le quinquennat ».
          </li>
          <li>
            <strong className="font-semibold">Le dénominateur est toujours affiché.</strong> Un
            candidat comparé sur deux questions n'est pas comparable à un candidat comparé sur
            dix, et le site le montre au lieu de le masquer derrière un pourcentage unique.
          </li>
          <li>
            <strong className="font-semibold">Le test reste éteint tant que les données ne
            suivent pas.</strong> Il faut au moins huit questions retenues et six candidats ayant
            une position sur la moitié d'entre elles. Ces seuils sont dans le code, pas dans une
            appréciation, et le test s'allumera de lui-même quand ils seront franchis.
          </li>
          <li>
            <strong className="font-semibold">L'axe gauche-droite</strong> n'est pas une note
            attribuée à chaque réponse. Il est déduit de vos affinités avec chaque famille, en
            plaçant les familles dans l'ordre conventionnel des blocs : extrême gauche à -2,
            gauche et écologistes à -1, centre à 0, droite à +1, extrême droite à +2. « Divers »
            et « Régionalistes » n'y figurent pas. C'est une convention de plus, au même titre
            que le regroupement en familles.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Ce que le test ne mesure pas : les raisons qui conduisent un candidat à son chiffre, sa
          crédibilité, sa capacité à l'appliquer, et tous les sujets sur lesquels il ne s'est pas
          exprimé. Un test de proximité ne dit pas pour qui voter.
        </p>
      </section>

      <section aria-labelledby="redaction" className="max-w-2xl space-y-3">
        <h2 id="redaction" className="text-lg font-semibold">
          Règles de rédaction
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
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
            Les portraits proviennent de Wikimedia Commons et sont librement réutilisables. Leur
            choix est mécanique - c’est l’image principale de l’article Wikipédia en français -
            pour ne pas décider quelle photographie avantage ou dessert qui.
          </li>
          <li>
            Les couleurs attribuées aux partis suivent les conventions habituelles de la presse ;
            elles n’ont aucun caractère officiel.
          </li>
        </ul>
      </section>

      <section aria-labelledby="parcours" className="max-w-2xl space-y-3">
        <h2 id="parcours" className="text-lg font-semibold">
          Repères biographiques et parcours
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Chaque fiche de candidat ouvre sur les mêmes quatre repères - naissance, études
          supérieures, métiers exercés, fonction du moment - puis sur la liste des mandats et
          fonctions, du plus récent au plus ancien. Les cases vides restent affichées : une
          biographie mal documentée ne doit pas ressembler à une biographie courte.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Ces faits sont repris de Wikidata, de façon automatique et reproductible, par un script
          publié avec le code. Quatre règles le gouvernent :
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <li>
            les métiers sont retenus par liste blanche. Wikidata range parmi les professions des
            catégories statistiques de l’INSEE et des qualificatifs d’opinion comme
            « polémiste » ou « théoricien du complot » : ce sont des caractérisations par des
            tiers, le site n’en reprend aucune, pour personne. Tout libellé inconnu est écarté et
            signalé plutôt que publié ;
          </li>
          <li>
            l’enseignement secondaire est écarté. Le lycée ne dit rien d’un parcours d’adulte, et
            sa présence dépend surtout de l’assiduité des contributeurs ;
          </li>
          <li>
            une fonction dont l’intitulé reste vague faute d’organisation ou de territoire
            rattaché n’est pas affichée. Les périodes successives d’une même fonction sont
            réunies en une seule ligne ;
          </li>
          <li>
            les intitulés sont accordés au genre déclaré de la personne sur sa fiche Wikidata :
            une députée n’est pas désignée comme député. L’accord porte sur le nom de la fonction
            et sur ce qui le suit immédiatement, jamais au-delà.
          </li>
        </ul>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Wikidata est une source encyclopédique, donc secondaire : les dates y sont parfois
          incomplètes et les mandats les plus anciens lacunaires. Elles ont vocation à être
          reprises du Journal officiel et des sites des assemblées. La fonction du moment, elle,
          est saisie à la main à partir d’une source datée, car c’est celle que Wikidata met à
          jour le plus tard.
        </p>
      </section>

      <section aria-labelledby="photos" className="max-w-3xl space-y-3">
        <h2 id="photos" className="text-lg font-semibold">
          Crédits photographiques
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les portraits viennent de Wikimedia Commons, qui n’héberge que des fichiers librement
          réutilisables. Chacun est repris avec son auteur et sa licence, comme toute autre
          source du site. Les {statistiques.candidats - candidats.filter((c) => c.photo !== null).length}{' '}
          candidats pour lesquels aucune image libre n’existe conservent un monogramme.
        </p>
        <ul className="grid gap-x-6 gap-y-1.5 text-xs text-stone-600 sm:grid-cols-2 dark:text-stone-400">
          {candidats
            .filter((candidat) => candidat.photo !== null)
            .map((candidat) => (
              <li key={candidat.id}>
                <span className="text-stone-900 dark:text-stone-100">
                  {candidat.prenom} {candidat.nom}
                </span>{' '}
                : {candidat.photo!.auteur}, {candidat.photo!.licence} ·{' '}
                <a
                  href={candidat.photo!.source_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="lien"
                >
                  fichier
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="limites" className="max-w-2xl space-y-3">
        <h2 id="limites" className="text-lg font-semibold">
          Limites connues
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
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
            fichier <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">DONNEES_A_VERIFIER.md</code>{' '}
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
