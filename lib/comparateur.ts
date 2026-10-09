import { normaliser } from './format';
import type { Candidat, Indicateur, Proposition, Theme } from './schemas';

/**
 * Logique du comparateur.
 *
 * Choix de neutralité : la mise en évidence est **structurelle**, jamais
 * sémantique. On signale que des positions renseignées sont formulées
 * différemment, et on aligne les indicateurs chiffrés que les candidats ont
 * eux-mêmes énoncés. Aucun score de proximité, aucun placement sur un axe,
 * aucune appréciation du contenu.
 */

export const MIN_CANDIDATS = 2;
export const MAX_CANDIDATS = 4;

export type StatutLigne =
  /** Tous les candidats se sont exprimés, et les formulations diffèrent. */
  | 'divergence'
  /** Tous se sont exprimés dans des termes identiques après normalisation. */
  | 'formulations-identiques'
  /** Au moins un candidat ne s'est pas exprimé : la ligne n'est pas comparable. */
  | 'incomplete'
  /** Aucun candidat de la sélection ne s'est exprimé sur ce thème. */
  | 'vide';

export interface IndicateurCompare {
  libelle: string;
  /** Même ordre que `candidats` ; null = indicateur absent chez ce candidat. */
  valeurs: (string | null)[];
  /** Au moins deux valeurs renseignées et différentes. */
  divergent: boolean;
}

export interface LigneComparaison {
  theme: Theme;
  /** Même ordre que `candidats` ; tableau vide = position non communiquée. */
  cellules: Proposition[][];
  statut: StatutLigne;
  indicateurs: IndicateurCompare[];
}

/** Générique sur le type de candidat : le composant client ne manipule qu'un résumé sérialisable. */
export interface Comparaison<C extends { id: string } = Candidat> {
  candidats: C[];
  lignes: LigneComparaison[];
  nombreDivergences: number;
  nombreIncompletes: number;
}

export interface ErreurSelection {
  code: 'trop-peu' | 'trop-nombreux' | 'inconnu' | 'doublon';
  message: string;
}

/** « 63 » + « ans » → « 63 ans ». */
export function formaterIndicateur(i: Indicateur): string {
  return i.unite === null ? String(i.valeur) : `${i.valeur} ${i.unite}`;
}

export function validerSelection(ids: string[], idsConnus: Set<string>): ErreurSelection[] {
  const erreurs: ErreurSelection[] = [];

  if (new Set(ids).size !== ids.length) {
    erreurs.push({ code: 'doublon', message: 'Un même candidat est sélectionné plusieurs fois.' });
  }
  for (const id of ids) {
    if (!idsConnus.has(id)) {
      erreurs.push({ code: 'inconnu', message: `Candidat inconnu : « ${id} ».` });
    }
  }
  if (ids.length < MIN_CANDIDATS) {
    erreurs.push({
      code: 'trop-peu',
      message: `Sélectionnez au moins ${MIN_CANDIDATS} candidats à comparer.`,
    });
  }
  if (ids.length > MAX_CANDIDATS) {
    erreurs.push({
      code: 'trop-nombreux',
      message: `Le comparateur accepte au maximum ${MAX_CANDIDATS} candidats.`,
    });
  }
  return erreurs;
}

/** « a,b,c » → identifiants connus, dédoublonnés, plafonnés à MAX_CANDIDATS. */
export function selectionDepuisParam(param: string | null, idsConnus: Set<string>): string[] {
  if (!param) return [];
  const vus = new Set<string>();
  const retenus: string[] = [];
  for (const brut of param.split(',')) {
    const id = brut.trim();
    if (id === '' || vus.has(id) || !idsConnus.has(id)) continue;
    vus.add(id);
    retenus.push(id);
    if (retenus.length === MAX_CANDIDATS) break;
  }
  return retenus;
}

export function paramDepuisSelection(ids: string[]): string {
  return ids.join(',');
}

function comparerIndicateurs(cellules: Proposition[][]): IndicateurCompare[] {
  const ordre: string[] = [];
  const parLibelle = new Map<string, (string | null)[]>();

  cellules.forEach((propositions, colonne) => {
    for (const proposition of propositions) {
      for (const indicateur of proposition.indicateurs) {
        if (!parLibelle.has(indicateur.libelle)) {
          ordre.push(indicateur.libelle);
          parLibelle.set(indicateur.libelle, Array(cellules.length).fill(null));
        }
        const valeurs = parLibelle.get(indicateur.libelle)!;
        // Première valeur rencontrée pour ce candidat : on ne fusionne pas.
        valeurs[colonne] ??= formaterIndicateur(indicateur);
      }
    }
  });

  return ordre
    .map((libelle) => {
      const valeurs = parLibelle.get(libelle)!;
      const renseignees = valeurs.filter((v): v is string => v !== null);
      return {
        libelle,
        valeurs,
        divergent: new Set(renseignees.map(normaliser)).size > 1,
      };
    })
    // Un indicateur présent chez un seul candidat n'est pas comparable.
    .filter((i) => i.valeurs.filter((v) => v !== null).length >= 2);
}

function statutDeLigne(cellules: Proposition[][]): StatutLigne {
  const renseignees = cellules.filter((c) => c.length > 0).length;
  if (renseignees === 0) return 'vide';
  if (renseignees < cellules.length) return 'incomplete';

  const textes = cellules.map((propositions) =>
    normaliser(propositions.map((p) => p.resume).join(' ')),
  );
  return new Set(textes).size > 1 ? 'divergence' : 'formulations-identiques';
}

export function construireComparaison<C extends { id: string }>(
  candidatsSelectionnes: C[],
  themes: Theme[],
  propositions: Proposition[],
): Comparaison<C> {
  const lignes: LigneComparaison[] = themes.map((theme) => {
    const cellules = candidatsSelectionnes.map((candidat) =>
      propositions.filter((p) => p.candidat_id === candidat.id && p.theme_id === theme.id),
    );
    return {
      theme,
      cellules,
      statut: statutDeLigne(cellules),
      indicateurs: comparerIndicateurs(cellules),
    };
  });

  return {
    candidats: candidatsSelectionnes,
    lignes,
    nombreDivergences: lignes.filter((l) => l.statut === 'divergence').length,
    nombreIncompletes: lignes.filter((l) => l.statut === 'incomplete').length,
  };
}
