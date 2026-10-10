import type { MetadataRoute } from 'next';
import { candidats, derniereMiseAJour, partis, themes } from '@/lib/data';

export const dynamic = 'force-static';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const modifie = new Date(derniereMiseAJour);
  const url = (chemin: string) => `${SITE}/${chemin}`.replace(/([^:]\/)\/+/g, '$1');

  // Le test n'y figure pas tant qu'il est éteint : référencer une page qui
  // annonce son propre report n'aide personne.
  const racines = [
    '',
    'candidats/',
    'partis/',
    'themes/',
    'familles/',
    'comparateur/',
    'methodologie/',
    'a-propos/',
    'journal/',
  ];

  return [
    ...racines.map((chemin) => ({
      url: url(chemin),
      lastModified: modifie,
      priority: chemin === '' ? 1 : 0.8,
    })),
    ...candidats.map((c) => ({
      url: url(`candidats/${c.id}/`),
      lastModified: new Date(c.derniere_verification),
      priority: 0.6,
    })),
    ...partis.map((p) => ({
      url: url(`partis/${p.id}/`),
      lastModified: new Date(p.derniere_verification),
      priority: 0.5,
    })),
    ...themes.map((t) => ({
      url: url(`themes/${t.id}/`),
      lastModified: modifie,
      priority: 0.7,
    })),
  ];
}
