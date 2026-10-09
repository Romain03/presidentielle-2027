import { describe, expect, it } from 'vitest';
import {
  MAX_CANDIDATS,
  MIN_CANDIDATS,
  construireComparaison,
  formaterIndicateur,
  paramDepuisSelection,
  selectionDepuisParam,
  validerSelection,
} from '@/lib/comparateur';
import type { Proposition, Theme } from '@/lib/schemas';

const idsConnus = new Set(['a', 'b', 'c', 'd', 'e']);

const theme = (id: string): Theme => ({
  id,
  libelle: id,
  description: 'Description du thème de test.',
});

const source = {
  url: 'https://exemple.fr/a',
  titre: 'Source de test',
  type: 'article-de-presse' as const,
  date: '2026-10-01',
};

function proposition(
  candidat: string,
  themeId: string,
  resume: string,
  indicateurs: Proposition['indicateurs'] = [],
): Proposition {
  return {
    id: `${candidat}-${themeId}`,
    candidat_id: candidat,
    theme_id: themeId,
    resume,
    detail: 'Un détail suffisamment long pour le schéma.',
    citation: null,
    nature: 'declaration_publique',
    indicateurs,
    source,
    derniere_verification: '2026-10-09',
  };
}

describe('validerSelection', () => {
  it('refuse une sélection trop courte', () => {
    expect(validerSelection(['a'], idsConnus).map((e) => e.code)).toContain('trop-peu');
    expect(validerSelection([], idsConnus).map((e) => e.code)).toContain('trop-peu');
  });

  it('refuse une sélection trop longue', () => {
    expect(validerSelection(['a', 'b', 'c', 'd', 'e'], idsConnus).map((e) => e.code)).toContain(
      'trop-nombreux',
    );
  });

  it('accepte les bornes exactes', () => {
    expect(validerSelection(['a', 'b'], idsConnus)).toEqual([]);
    expect(validerSelection(['a', 'b', 'c', 'd'], idsConnus)).toEqual([]);
    expect(MIN_CANDIDATS).toBe(2);
    expect(MAX_CANDIDATS).toBe(4);
  });

  it('refuse un candidat inconnu et un doublon', () => {
    expect(validerSelection(['a', 'zzz'], idsConnus).map((e) => e.code)).toContain('inconnu');
    expect(validerSelection(['a', 'a'], idsConnus).map((e) => e.code)).toContain('doublon');
  });
});

describe('sélection dans l’URL', () => {
  it('lit, dédoublonne, ignore les inconnus et plafonne au maximum', () => {
    expect(selectionDepuisParam('a,b', idsConnus)).toEqual(['a', 'b']);
    expect(selectionDepuisParam('a,a,b', idsConnus)).toEqual(['a', 'b']);
    expect(selectionDepuisParam('a,zzz,b', idsConnus)).toEqual(['a', 'b']);
    expect(selectionDepuisParam('a,b,c,d,e', idsConnus)).toEqual(['a', 'b', 'c', 'd']);
    expect(selectionDepuisParam(' a , b ', idsConnus)).toEqual(['a', 'b']);
  });

  it('traite une absence de paramètre comme une sélection vide', () => {
    expect(selectionDepuisParam(null, idsConnus)).toEqual([]);
    expect(selectionDepuisParam('', idsConnus)).toEqual([]);
  });

  it('fait l’aller-retour avec paramDepuisSelection', () => {
    const selection = ['a', 'c'];
    expect(selectionDepuisParam(paramDepuisSelection(selection), idsConnus)).toEqual(selection);
  });
});

describe('construireComparaison — statut des lignes', () => {
  const candidats = [{ id: 'a' }, { id: 'b' }];

  it('marque « vide » quand personne ne s’est exprimé', () => {
    const c = construireComparaison(candidats, [theme('t')], []);
    expect(c.lignes[0].statut).toBe('vide');
    expect(c.nombreDivergences).toBe(0);
  });

  it('marque « incomplete » quand une position manque', () => {
    const c = construireComparaison(candidats, [theme('t')], [proposition('a', 't', 'Mesure A')]);
    expect(c.lignes[0].statut).toBe('incomplete');
    expect(c.nombreIncompletes).toBe(1);
    expect(c.lignes[0].cellules[1]).toEqual([]);
  });

  it('marque « divergence » quand les deux positions existent et diffèrent', () => {
    const c = construireComparaison(
      candidats,
      [theme('t')],
      [proposition('a', 't', 'Retraite à 60 ans'), proposition('b', 't', 'Retraite à 65 ans')],
    );
    expect(c.lignes[0].statut).toBe('divergence');
    expect(c.nombreDivergences).toBe(1);
  });

  it('marque « formulations-identiques » malgré accents, casse et ponctuation', () => {
    const c = construireComparaison(
      candidats,
      [theme('t')],
      [
        proposition('a', 't', 'Retraite à 60 ans.'),
        proposition('b', 't', 'RETRAITE A 60 ANS !'),
      ],
    );
    expect(c.lignes[0].statut).toBe('formulations-identiques');
    expect(c.nombreDivergences).toBe(0);
  });

  it('respecte l’ordre des candidats dans les cellules', () => {
    const c = construireComparaison(
      [{ id: 'b' }, { id: 'a' }],
      [theme('t')],
      [proposition('a', 't', 'Mesure A'), proposition('b', 't', 'Mesure B')],
    );
    expect(c.lignes[0].cellules[0][0].candidat_id).toBe('b');
    expect(c.lignes[0].cellules[1][0].candidat_id).toBe('a');
  });

  it('produit une ligne par thème, même sans aucune proposition', () => {
    const c = construireComparaison(candidats, [theme('t1'), theme('t2')], []);
    expect(c.lignes).toHaveLength(2);
  });
});

describe('construireComparaison — indicateurs', () => {
  const candidats = [{ id: 'a' }, { id: 'b' }];

  it('aligne les indicateurs par libellé et marque les valeurs différentes', () => {
    const c = construireComparaison(
      candidats,
      [theme('t')],
      [
        proposition('a', 't', 'Mesure A', [{ libelle: 'Âge', valeur: 60, unite: 'ans' }]),
        proposition('b', 't', 'Mesure B', [{ libelle: 'Âge', valeur: 65, unite: 'ans' }]),
      ],
    );
    const [indicateur] = c.lignes[0].indicateurs;
    expect(indicateur.libelle).toBe('Âge');
    expect(indicateur.valeurs).toEqual(['60 ans', '65 ans']);
    expect(indicateur.divergent).toBe(true);
  });

  it('ne marque pas de divergence quand les valeurs sont identiques', () => {
    const c = construireComparaison(
      candidats,
      [theme('t')],
      [
        proposition('a', 't', 'Mesure A', [{ libelle: 'Âge', valeur: 60, unite: 'ans' }]),
        proposition('b', 't', 'Mesure B', [{ libelle: 'Âge', valeur: 60, unite: 'ans' }]),
      ],
    );
    expect(c.lignes[0].indicateurs[0].divergent).toBe(false);
  });

  it('écarte un indicateur présent chez un seul candidat : il n’est pas comparable', () => {
    const c = construireComparaison(
      candidats,
      [theme('t')],
      [
        proposition('a', 't', 'Mesure A', [{ libelle: 'Économies', valeur: 40, unite: 'Md€' }]),
        proposition('b', 't', 'Mesure B', []),
      ],
    );
    expect(c.lignes[0].indicateurs).toEqual([]);
  });

  it('formate une valeur avec et sans unité', () => {
    expect(formaterIndicateur({ libelle: 'Âge', valeur: 63, unite: 'ans' })).toBe('63 ans');
    expect(
      formaterIndicateur({ libelle: 'Durée', valeur: 'non précisée', unite: null }),
    ).toBe('non précisée');
  });
});
