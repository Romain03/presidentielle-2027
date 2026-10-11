import { formaterDate } from '@/lib/format';
import {
  LIBELLES_NATURE_DOCUMENT,
  LIBELLES_ORIGINE_DATE,
  type DocumentProgramme,
} from '@/lib/schemas';

/**
 * Taille de fichier en clair. Un lecteur sur données mobiles n'ouvre pas un
 * document de 36 Mo par curiosité : c'est une information, pas un détail
 * technique.
 */
function formaterPoids(ko: number): string {
  return ko >= 1024 ? `${(ko / 1024).toFixed(ko >= 10240 ? 0 : 1).replace('.', ',')} Mo` : `${ko} ko`;
}

function IconePdf() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-stone-500 dark:text-stone-400"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </svg>
  );
}

/**
 * Un document de programme. Tout ce qui est affiché ici a été relevé sur le
 * fichier lui-même : nombre de pages et poids viennent du PDF, et la date dit
 * d'où elle vient.
 *
 * Le lien ouvre le fichier chez le candidat, jamais une copie : le lecteur voit
 * la version en ligne au moment où il clique, et non celle que ce site aurait
 * figée.
 */
function Ligne({ document: doc }: { document: DocumentProgramme }) {
  const nature = LIBELLES_NATURE_DOCUMENT[doc.nature];

  return (
    <li className="flex gap-2.5">
      <IconePdf />
      <div className="min-w-0 space-y-0.5">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium underline decoration-stone-300 underline-offset-2 hover:decoration-stone-700 dark:decoration-stone-600"
        >
          {doc.titre}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (fichier PDF, nouvelle fenêtre)</span>
        </a>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {nature} en PDF, {doc.pages}&nbsp;pages, {formaterPoids(doc.poids_ko)}
          {doc.date_document !== null ? (
            <>
              {' · '}
              <span title={LIBELLES_ORIGINE_DATE[doc.origine_date!]}>
                {formaterDate(doc.date_document)}
              </span>
            </>
          ) : (
            <> · date non établie</>
          )}
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {doc.publie_par === 'candidat'
            ? `Publié par ${doc.editeur}`
            : `Publié par ${doc.editeur}, le parti et non le candidat`}
          {' · '}
          <a
            href={doc.page_source}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline decoration-stone-300 underline-offset-2 hover:decoration-stone-700 dark:decoration-stone-600"
          >
            page d&apos;origine
            <span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
        </p>
      </div>
    </li>
  );
}

export default function DocumentsProgramme({ documents }: { documents: DocumentProgramme[] }) {
  if (documents.length === 0) return null;

  return (
    <ul className="space-y-3">
      {documents.map((doc) => (
        <Ligne key={doc.id} document={doc} />
      ))}
    </ul>
  );
}
