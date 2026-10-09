import type { Photo } from '@/lib/schemas';

/** Attribution exigée par les licences Creative Commons, affichée sous le portrait. */
export default function CreditPhoto({ photo }: { photo: Photo }) {
  return (
    <p className="text-xs leading-snug text-stone-600 dark:text-stone-400">
      Photo&nbsp;: {photo.auteur} ·{' '}
      {photo.licence_url !== null ? (
        <a
          href={photo.licence_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="lien"
        >
          {photo.licence}
        </a>
      ) : (
        photo.licence
      )}{' '}
      ·{' '}
      <a
        href={photo.source_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="lien"
      >
        Wikimedia Commons
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (nouvelle fenêtre)</span>
      </a>
    </p>
  );
}
