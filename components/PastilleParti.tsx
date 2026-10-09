import Link from 'next/link';
import { LIBELLES_FAMILLE, type Parti } from '@/lib/schemas';

/**
 * La couleur du parti sert de repère. Le nom, le sigle et la famille sont
 * toujours écrits : la pastille seule ne porte aucune information.
 */
export default function PastilleParti({
  parti,
  avecFamille = false,
  lien = true,
}: {
  parti: Parti | undefined;
  avecFamille?: boolean;
  lien?: boolean;
}) {
  if (!parti) {
    return <span className="text-sm text-slate-600 dark:text-slate-400">Sans étiquette</span>;
  }

  const contenu = (
    <>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-sm ring-1 ring-slate-900/20 dark:ring-white/25"
        style={{ backgroundColor: parti.couleur }}
      />
      <span>
        {parti.nom} ({parti.sigle})
      </span>
    </>
  );

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-sm">
      {lien ? (
        <Link
          href={`/partis/${parti.id}/`}
          className="inline-flex items-center gap-1.5 rounded underline decoration-slate-400 underline-offset-2 hover:decoration-slate-900 dark:decoration-slate-500 dark:hover:decoration-slate-200"
        >
          {contenu}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5">{contenu}</span>
      )}
      {avecFamille && (
        <span className="text-slate-600 dark:text-slate-400">
          · {LIBELLES_FAMILLE[parti.famille]}
        </span>
      )}
    </span>
  );
}
