import { nomComplet, normaliser } from './format.ts';
import type { Candidat, Parti, Proposition, Theme } from './schemas';

/**
 * Index de recherche construit au build et sérialisé vers le client : le site
 * est entièrement statique, il n'y a pas d'API à interroger.
 */

export type TypeResultat = 'candidat' | 'parti' | 'proposition';

export interface EntreeIndex {
  type: TypeResultat;
  id: string;
  titre: string;
  sousTitre: string;
  lien: string;
  /** Texte normalisé servant à la correspondance. */
  texte: string;
}

export const LIBELLES_TYPE: Record<TypeResultat, string> = {
  candidat: 'Candidats',
  parti: 'Partis',
  proposition: 'Propositions',
};

export function construireIndex(
  candidats: Candidat[],
  partis: Parti[],
  themes: Theme[],
  propositions: Proposition[],
): EntreeIndex[] {
  const parti = (id: string | null) => partis.find((p) => p.id === id);
  const theme = (id: string) => themes.find((t) => t.id === id);
  const candidat = (id: string) => candidats.find((c) => c.id === id);

  const entrees: EntreeIndex[] = [];

  for (const c of candidats) {
    const p = parti(c.parti_id);
    entrees.push({
      type: 'candidat',
      id: c.id,
      titre: nomComplet(c),
      sousTitre: p ? `${p.nom} (${p.sigle})` : 'Sans étiquette',
      lien: `/candidats/${c.id}/`,
      texte: normaliser([nomComplet(c), p?.nom, p?.sigle].filter(Boolean).join(' ')),
    });
  }

  for (const p of partis) {
    entrees.push({
      type: 'parti',
      id: p.id,
      titre: p.nom,
      sousTitre: p.sigle,
      lien: `/partis/${p.id}/`,
      texte: normaliser(`${p.nom} ${p.sigle}`),
    });
  }

  for (const prop of propositions) {
    const c = candidat(prop.candidat_id);
    const t = theme(prop.theme_id);
    entrees.push({
      type: 'proposition',
      id: prop.id,
      titre: prop.resume,
      sousTitre: [c ? nomComplet(c) : prop.candidat_id, t?.libelle].filter(Boolean).join(' · '),
      lien: `/candidats/${prop.candidat_id}/#${prop.theme_id}`,
      texte: normaliser(
        [prop.resume, prop.detail, prop.citation, c ? nomComplet(c) : '', t?.libelle]
          .filter(Boolean)
          .join(' '),
      ),
    });
  }

  return entrees;
}

/**
 * Tous les mots de la requête doivent correspondre. Le score privilégie le
 * titre, puis le sous-titre, puis le corps du texte.
 */
export function rechercher(index: EntreeIndex[], requete: string, limite = 20): EntreeIndex[] {
  const mots = normaliser(requete).split(' ').filter((m) => m.length > 1);
  if (mots.length === 0) return [];

  const notes: { entree: EntreeIndex; score: number }[] = [];

  for (const entree of index) {
    const titre = normaliser(entree.titre);
    const sousTitre = normaliser(entree.sousTitre);
    let score = 0;
    let tousPresents = true;

    for (const mot of mots) {
      if (titre.startsWith(mot)) score += 4;
      else if (titre.includes(mot)) score += 3;
      else if (sousTitre.includes(mot)) score += 2;
      else if (entree.texte.includes(mot)) score += 1;
      else {
        tousPresents = false;
        break;
      }
    }

    if (tousPresents) notes.push({ entree, score });
  }

  return notes
    .sort((a, b) => b.score - a.score || a.entree.titre.localeCompare(b.entree.titre, 'fr'))
    .slice(0, limite)
    .map((n) => n.entree);
}
