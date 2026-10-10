import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import { derniereMiseAJour, sourcesDesPropositions, statistiques } from '@/lib/data';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Qui publie ce site, comment signaler une erreur, et ce que le site ne fait pas.',
};

const DEPOT = 'https://github.com/Romain03/presidentielle-2027';

export default function PageAPropos() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold">À propos</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Un site politique sans auteur identifié ni moyen de le corriger ne mérite pas qu’on lui
          fasse confiance. Voici l’un et l’autre.
        </p>
      </header>

      <section aria-labelledby="qui" className="max-w-2xl space-y-3">
        <h2 id="qui" className="text-lg font-semibold">
          Qui publie ce site
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Un projet personnel, sans but commercial, sans publicité, sans mesure d’audience et sans
          lien avec un parti, un candidat ou un média. Il n’est financé par personne et ne reçoit
          aucune contribution extérieure.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Le code et les données sont publics et versionnés :{' '}
          <a
            href={DEPOT}
            target="_blank"
            rel="noopener noreferrer"
            className="lien"
          >
            github.com/Romain03/presidentielle-2027
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
          . Chaque modification du jeu de données y laisse une trace datée, consultable par
          n’importe qui.
        </p>
      </section>

      <section aria-labelledby="corriger" className="max-w-2xl space-y-3">
        <h2 id="corriger" className="text-lg font-semibold">
          Signaler une erreur
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Une date fausse, une mesure mal résumée, une source périmée, un intitulé de fonction
          inexact : c’est utile à savoir, et c’est réparable.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <a
            href={`${DEPOT}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="lien font-medium"
          >
            Ouvrir un signalement
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (nouvelle fenêtre)</span>
          </a>{' '}
          - en indiquant si possible la page concernée et la source qui établit la correction.
          Une correction sourcée est appliquée ; une correction non sourcée est discutée.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les limites déjà connues sont tenues à jour dans{' '}
          <a
            href={`${DEPOT}/blob/main/DONNEES_A_VERIFIER.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="lien"
          >
            DONNEES_A_VERIFIER.md
            <span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (nouvelle fenêtre)</span>
          </a>{' '}
          : contradictions entre sources, champs non renseignés, sources à remplacer. Les y lire
          avant de signaler évite les doublons.
        </p>
      </section>

      <section aria-labelledby="comment" className="max-w-2xl space-y-3">
        <h2 id="comment" className="text-lg font-semibold">
          Comment les données sont collectées
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les propositions sont relevées et résumées à la main à partir d’articles de presse, puis
          saisies avec leur source. Les éléments factuels et répétitifs - portraits, dates de
          naissance, mandats, fondation des partis - sont récupérés par des scripts publiés avec
          le code, depuis Wikidata et Wikimedia Commons. Ce que chaque parti dit de lui-même est
          relevé à la main sur son site.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Quelques sites refusent les requêtes automatiques : leurs pages ont été lues dans un
          navigateur ordinaire, et la source est la même que pour les autres.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les {statistiques.propositions} propositions portent toutes la même date de relevé :
          c’est celle de la passe de collecte, pas d’une vérification individuelle. Le mot employé
          est donc « relevé le », et non « vérifié le ».{' '}
          <Link href="/methodologie/#sources" className="lien">
            D’où viennent les {sourcesDesPropositions.articles} articles
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="donnees" className="max-w-2xl space-y-3">
        <h2 id="donnees" className="text-lg font-semibold">
          Vie privée et hébergement
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Le site est entièrement statique. Il ne dépose aucun cookie, n’utilise aucun outil de
          mesure d’audience et ne transmet rien à personne. Le choix du thème clair ou sombre est
          conservé dans le navigateur, sur l’appareil, et n’en sort pas.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Hébergement : GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco,
          CA 94107, États-Unis). Les journaux de connexion éventuels relèvent de l’hébergeur.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Les portraits proviennent de Wikimedia Commons et sont repris avec leur auteur et leur
          licence. Les extraits de programmes et de sites de partis sont cités à des fins
          d’information, avec le lien vers la source. Toute demande de retrait peut passer par le
          dépôt.
        </p>
      </section>
    </div>
  );
}
