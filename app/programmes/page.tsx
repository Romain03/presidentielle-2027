import type { Metadata } from 'next';
import Link from 'next/link';
import DerniereMiseAJour from '@/components/DerniereMiseAJour';
import DocumentsProgramme from '@/components/DocumentsProgramme';
import PastilleParti from '@/components/PastilleParti';
import {
  candidats,
  derniereMiseAJour,
  documents,
  documentsDuCandidat,
  getParti,
  statistiques,
} from '@/lib/data';
import { nomComplet } from '@/lib/format';
import { enLice } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Programmes en PDF',
  description:
    'Les documents de programme publiés en PDF par les candidats et leurs partis, en lien direct : nombre de pages, poids du fichier, date, et page d’origine.',
};

export default function PageProgrammes() {
  const avecDocument = candidats.filter((c) => documentsDuCandidat(c.id).length > 0);

  // La liste des candidatures engagées qui ne publient aucun document est
  // aussi informative que la liste de celles qui en publient. Elle est donnée,
  // pas cachée.
  const sansDocument = candidats.filter(
    (c) => enLice(c.statut) && documentsDuCandidat(c.id).length === 0,
  );

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <DerniereMiseAJour date={derniereMiseAJour} />
        <h1 className="text-3xl font-semibold">Programmes en PDF</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          Un programme écrit par le candidat lui-même est la source la plus directe qui existe :
          ni résumé, ni compte rendu, ni interprétation. Ces documents sont pourtant difficiles à
          trouver - enfouis dans une page de matériel militant, publiés sans date, ou accessibles
          seulement en échange d’une adresse électronique.
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          Les liens mènent directement au fichier, chez le candidat, sans formulaire et sans
          inscription. {statistiques.documents} documents,{' '}
          {statistiques.pagesDeDocuments.toLocaleString('fr-FR')} pages, pour{' '}
          {statistiques.candidatsAvecDocument} candidats sur {statistiques.enLice} candidatures
          engagées.
        </p>
      </header>

      <section aria-labelledby="liste" className="space-y-7">
        <h2 id="liste" className="text-lg font-semibold">
          Les documents, par candidat
        </h2>
        {avecDocument.map((candidat) => (
          <section key={candidat.id} className="space-y-2.5">
            <h3 className="font-medium">
              <Link href={`/candidats/${candidat.id}/`} className="lien">
                {nomComplet(candidat)}
              </Link>
            </h3>
            <PastilleParti parti={getParti(candidat.parti_id)} />
            <DocumentsProgramme documents={documentsDuCandidat(candidat.id)} />
          </section>
        ))}
      </section>

      <section aria-labelledby="dates" className="carte space-y-2 p-4">
        <h2 id="dates" className="font-semibold">
          Pourquoi la date compte autant que le document
        </h2>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Un PDF n’affiche presque jamais sa date, et un site garde rarement trace de l’année où il
          l’a mis en ligne. Un document de la campagne précédente reste donc consultable, sous le
          même intitulé, à la même adresse - et rien ne signale au lecteur qu’il lit un programme
          périmé. Chaque document listé ici a été ouvert et daté avant d’être retenu ; la date
          affichée dit d’où elle vient, au survol.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Aucun document n’est recopié ici : vous obtenez la version en ligne au moment où vous
          cliquez, et non celle que ce site aurait figée. Nombre de pages et poids sont relevés
          dans le fichier lui-même.
        </p>
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          Plusieurs documents ont été écartés pour cette seule raison : ils dataient d’un autre
          scrutin.{' '}
          <Link href="/methodologie/#documents" className="lien">
            La méthodologie
          </Link>{' '}
          dit lesquels, et pourquoi.
        </p>
      </section>

      {sansDocument.length > 0 && (
        <section aria-labelledby="sans" className="space-y-3">
          <h2 id="sans" className="text-lg font-semibold">
            Candidatures engagées sans document relevé
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {sansDocument.length} des {statistiques.enLice} candidatures engagées ne publient aucun
            document de programme téléchargeable, ou n’en publient qu’un qui porte sur un scrutin
            passé. Une absence ici n’est pas un reproche : une campagne commence souvent par des
            prises de parole et écrit son programme ensuite.
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {sansDocument.map((candidat) => (
              <li key={candidat.id}>
                <Link href={`/candidats/${candidat.id}/`} className="lien">
                  {nomComplet(candidat)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Un document manquant, un lien mort, une date fausse ?{' '}
        <Link href="/a-propos/" className="lien">
          La page À propos
        </Link>{' '}
        indique comment le signaler. Ces fichiers sont par ailleurs interrogés deux fois par jour :
        un lien qui tombe, ou un document remplacé sous la même adresse, ouvre un signalement. Un
        document y échappe sur les {documents.length} : son hébergeur refuse les requêtes
        automatiques, et il est revérifié à la main.
      </p>
    </div>
  );
}
