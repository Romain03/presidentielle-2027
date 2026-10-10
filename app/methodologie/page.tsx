import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import BadgeNature from '@/components/BadgeNature';
import BadgeStatut from '@/components/BadgeStatut';
import { candidats, derniereMiseAJour, sourcesDesPropositions, statistiques } from '@/lib/data';
import { LIBELLES_FAMILLE, STATUTS, type Proposition } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Méthodologie',
  description:
    'Sources, règles de rédaction, critères d’inclusion et limites connues des données publiées sur ce site.',
};

/**
 * Propositions fictives servant uniquement à montrer les trois repères. Elles
 * ne sont jamais affichées comme des données : seuls leur nature et leur type
 * de source comptent ici.
 */
const SOURCE_FICTIVE = {
  url: 'https://example.org',
  titre: 'Exemple',
  date: '2026-01-01',
};

const EXEMPLE_BASE: Omit<Proposition, 'nature' | 'sources'> = {
  id: 'exemple',
  candidat_id: 'exemple',
  theme_id: 'exemple',
  resume: 'Exemple de mesure servant à illustrer les repères.',
  detail: 'Exemple de mesure servant à illustrer les repères.',
  citation: null,
  indicateurs: [],
  programme_anterieur: null,
  derniere_verification: '2026-01-01',
};

const EXEMPLES: Record<'programme' | 'rapporte' | 'declaration', Proposition> = {
  programme: {
    ...EXEMPLE_BASE,
    nature: 'programme_officiel',
    sources: [{ ...SOURCE_FICTIVE, type: 'programme-officiel' }],
  },
  rapporte: {
    ...EXEMPLE_BASE,
    nature: 'programme_officiel',
    sources: [{ ...SOURCE_FICTIVE, type: 'article-de-presse' }],
  },
  declaration: {
    ...EXEMPLE_BASE,
    nature: 'declaration_publique',
    sources: [{ ...SOURCE_FICTIVE, type: 'interview' }],
  },
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
          publication, et <strong className="font-semibold">une proposition peut en porter
          plusieurs</strong> : la première établit l’essentiel de la mesure, les suivantes la
          corroborent ou apportent un détail qu’elle ne donne pas.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          L’ordre de préférence est le suivant, et il repose sur ce qui est vérifiable, non sur
          une appréciation de la qualité des rédactions :
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <li>
            <strong className="font-semibold">les mots du candidat</strong> : programme publié,
            site de campagne, site du parti. Rien n’est alors interprété.
          </li>
          <li>
            <strong className="font-semibold">les médias à indépendance statutaire</strong> -
            service public et chaînes parlementaires - et les agences de presse. Le critère est
            juridique, pas éditorial : leur indépendance est inscrite dans un texte, ce qui se
            vérifie, là où « média objectif » ne se vérifie pas.
          </li>
          <li>
            <strong className="font-semibold">tout autre titre de presse daté</strong>, sans
            exclusive, à condition qu’il rapporte une déclaration identifiable.
          </li>
        </ol>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Une source n’est jamais remplacée par une autre sans que l’article ait été lu et
          vérifié : échanger une adresse contre une autre sans la lire reviendrait à inventer la
          provenance d’une information. Et une source d’origine n’est pas retirée lorsqu’une
          meilleure est trouvée : elle porte souvent un détail que la nouvelle ne donne pas, et
          savoir qui a rapporté quoi fait partie de ce que le lecteur doit pouvoir juger.
        </p>

        {/*
          Le décompte est calculé sur les données publiées, jamais saisi : il ne
          peut pas devenir faux sans que le site change avec lui.
        */}
        <div className="space-y-2 rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <p>
            <strong className="font-semibold">En pratique, aucune proposition n’est aujourd’hui
            sourcée à un document primaire.</strong>{' '}
            Les programmes ne sont pas publiés : les {statistiques.propositions} propositions
            viennent toutes d’articles de presse, soit{' '}
            {sourcesDesPropositions.citations} citations réparties sur{' '}
            {sourcesDesPropositions.articles} articles de{' '}
            {sourcesDesPropositions.medias.length} médias.
          </p>
          <ul className="space-y-0.5">
            {sourcesDesPropositions.medias.map((media) => (
              <li key={media.hote} className="flex items-baseline gap-2">
                <span className="w-32 shrink-0 font-medium">{media.hote}</span>
                {/* Le dénominateur est le nombre de citations, pas celui des
                    propositions : une proposition peut en porter plusieurs. */}
                <span className="tabular-nums">
                  {media.nombre} citation{media.nombre > 1 ? 's' : ''} ·{' '}
                  {Math.round((media.nombre / sourcesDesPropositions.citations) * 100)} %
                </span>
              </li>
            ))}
          </ul>
          <p>
            La conséquence est à connaître : ce que le site montre dépend de ce que ces articles
            ont choisi de couvrir. Un thème peu traité par eux paraîtra déserté par les candidats,
            ce qui n’est pas la même chose.
          </p>
          <p>
            {sourcesDesPropositions.sourceUnique} propositions sur {statistiques.propositions} ne
            reposent encore que sur une seule rédaction. Elles sont reconnaissables : leur fiche
            ne porte qu’un seul lien de source. Les corroborer, puis les re-sourcer aux programmes
            quand ils paraîtront, est la première des corrections à venir.
          </p>
        </div>
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
          Ce qu’une proposition engage
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Trois statuts, distingués partout par une forme, une bordure et un libellé. Le statut
          n’est pas saisi : il est déduit de la nature de la mesure et du type de sa source, de
          sorte qu’il ne peut pas affirmer davantage que ce que la source établit.
        </p>
        <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature proposition={EXEMPLES.programme} />
            <span>mesure lue dans le programme publié par le candidat, lien à l’appui.</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature proposition={EXEMPLES.rapporte} />
            <span>
              mesure présentée comme figurant au programme, mais connue par un article de presse.
              C’est aujourd’hui le cas des {statistiques.propositionsDeProgramme} mesures de
              programme du site : aucune n’est sourcée au programme lui-même.
            </span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <BadgeNature proposition={EXEMPLES.declaration} />
            <span>
              position exprimée publiquement - interview, discours, conférence de presse - sans
              être encore inscrite dans un programme publié.
            </span>
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Un quatrième repère s’ajoute lorsque la mesure est reprise d’un scrutin antérieur, faute
          de programme 2027 publié : il nomme le scrutin et son année.
        </p>
      </section>

      <section aria-labelledby="absence" className="max-w-2xl space-y-3">
        <h2 id="absence" className="text-lg font-semibold">
          « Rien relevé par ce site »
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Lorsqu’aucune proposition sourcée n’existe pour un couple candidat / thème, le site
          affiche « Rien relevé par ce site ». Cette mention est calculée à l’affichage : l’absence
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
        <div className="max-w-2xl space-y-2 rounded-xl border border-amber-700/20 bg-amber-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-stone-300">
          <p>
            <strong className="font-semibold">En pratique, la règle ci-dessus ne s’applique
            qu’à une minorité des partis.</strong>{' '}
            {statistiques.partisSansNuance} des {statistiques.partis} formations recensées n’ont
            pas de nuance ministérielle établie - les nuances sont publiées à l’occasion des
            scrutins, et plusieurs de ces formations n’en ont pas encore disputé. Leur famille est
            donc attribuée à la main, d’après leur dénomination et leurs déclarations.
          </p>
          <p>
            C’est un classement éditorial, et il est présenté comme tel : la fiche de chaque parti
            indique si sa nuance est connue, et la famille ne sert qu’au filtre. Les
            incohérences apparentes - deux formations souverainistes rangées différemment, par
            exemple - viennent de là.
          </p>
        </div>
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
            <strong className="font-semibold">Aucun axe gauche-droite n'est calculé.</strong> Une
            version antérieure plaçait le lecteur sur un axe allant de -2 à +2, déduit de ses
            affinités avec chaque famille. C'était contradictoire deux fois : le site promet de ne
            placer personne sur un axe, et cet axe reposait sur le classement en familles, qui est
            une convention de ce site et non une donnée. Il a été retiré.
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

      <section aria-labelledby="positionnements" className="max-w-2xl space-y-3">
        <h2 id="positionnements" className="text-lg font-semibold">
          Ce que les partis disent d’eux-mêmes
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Chaque fiche de parti porte un extrait de la façon dont la formation se présente
          elle-même, relevé sur son site officiel - page « Qui sommes-nous », manifeste, charte ou
          statuts - et accompagné du lien. L’extrait n’est jamais reformulé : il est au besoin
          raccourci, par suppression de phrases entières, jamais par réécriture.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          C’est la seule manière que nous ayons trouvée de répondre à une question légitime - « en
          quoi croit ce parti ? » - sans y répondre à sa place. Les caractérisations par des tiers
          sont écartées : ni les étiquettes de la presse, ni la propriété « idéologie » de
          Wikidata, qui engagent leur auteur et non la formation. Un parti est décrit ici par ses
          mots, ou n’est pas décrit.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          La page d’une famille politique rassemble ces extraits pour les formations qui la
          composent. Elle ne les résume pas en une doctrine commune : les rapprochements que l’on
          peut y lire sont ceux du lecteur. Sept formations sur trente-trois n’ont pas de site
          officiel identifié et restent sans formulation.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Ces pages ne portent pas de date de publication. La date affichée est donc celle de la
          consultation, comme pour les relevés Wikidata, et non celle d’une mise en ligne.
        </p>
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
            {statistiques.enLice} candidatures engagées : la couverture est très inégale d’un
            candidat et d’un thème à l’autre, parce que la plupart des programmes ne sont pas
            publiés et parce que les articles dépouillés n’ont pas traité tous les sujets.
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
            <strong className="font-semibold">Une seule proposition par couple candidat / thème,
            c’est trop grossier pour comparer.</strong> Chaque résumé condense trois à cinq
            mesures, et le comparateur ne peut alors conclure qu’à des formulations différentes,
            ce qui est toujours vrai. Seuls les indicateurs chiffrés - âge de départ, durée de
            cotisation, montant - sont réellement comparables, et ce sont eux qu’il faudra
            prendre comme grille : trois à cinq sous-questions fixes par thème, plutôt qu’un
            résumé par thème. C’est la refonte la plus utile qui reste à faire, et elle suppose
            de reprendre les sources une par une.
          </li>
          <li>
            <strong className="font-semibold">{statistiques.propositionsSansCitation} propositions
            sur {statistiques.propositions} ne portent aucune citation</strong>, alors que la règle
            de rédaction en fait un appui. Un résumé sans verbatim est une paraphrase de
            paraphrase : le lien vers la source reste le seul recours.
          </li>
          <li>
            <strong className="font-semibold">Les portraits ne sont pas homogènes.</strong> Ils
            sont choisis mécaniquement sur Wikimedia Commons, ce qui garantit l’égalité de
            traitement mais pas l’égalité de rendu : certains datent de 2010, d’autres de 2026,
            l’un est détouré sur fond blanc, un autre pris sous un éclairage de scène. Un choix
            mécanique n’est pas un traitement égal, et une harmonisation supposerait un jugement
            esthétique que ce site s’interdit par ailleurs.
          </li>
          <li>
            Les informations incertaines, contradictoires ou non sourçables sont consignées dans le
            fichier <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">DONNEES_A_VERIFIER.md</code>{' '}
            du dépôt plutôt que publiées ici, et chaque modification des données figure au{' '}
            <Link href="/journal/" className="lien">
              journal
            </Link>
            .
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
