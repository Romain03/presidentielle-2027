import { describe, expect, it } from 'vitest';
import { candidats, partis, propositions, themes } from '@/lib/data';
import { construireIndex, rechercher } from '@/lib/recherche';

const index = construireIndex(candidats, partis, themes, propositions);

describe('index de recherche', () => {
  it('couvre les candidats, les partis et les propositions', () => {
    expect(index.filter((e) => e.type === 'candidat')).toHaveLength(candidats.length);
    expect(index.filter((e) => e.type === 'parti')).toHaveLength(partis.length);
    expect(index.filter((e) => e.type === 'proposition')).toHaveLength(propositions.length);
  });

  it('pointe vers des liens internes valides', () => {
    for (const entree of index) expect(entree.lien.startsWith('/')).toBe(true);
  });
});

describe('rechercher', () => {
  it('ignore une requête vide ou trop courte', () => {
    expect(rechercher(index, '')).toEqual([]);
    expect(rechercher(index, '  ')).toEqual([]);
    expect(rechercher(index, 'a')).toEqual([]);
  });

  it('trouve un candidat sans tenir compte des accents ni de la casse', () => {
    const resultats = rechercher(index, 'MELENCHON');
    expect(resultats.some((r) => r.type === 'candidat' && r.id === 'jean-luc-melenchon')).toBe(true);
  });

  it('trouve un parti par son sigle', () => {
    const resultats = rechercher(index, 'LR');
    expect(resultats.some((r) => r.type === 'parti' && r.id === 'les-republicains')).toBe(true);
  });

  it('trouve une proposition par un mot de son contenu', () => {
    const resultats = rechercher(index, 'capitalisation');
    expect(resultats.some((r) => r.type === 'proposition')).toBe(true);
  });

  it('exige que tous les mots de la requête correspondent', () => {
    expect(rechercher(index, 'retraite licorne')).toEqual([]);
  });

  it('classe le candidat avant les propositions qui le mentionnent', () => {
    const resultats = rechercher(index, 'retailleau');
    expect(resultats[0].type).toBe('candidat');
  });

  it('respecte la limite demandée', () => {
    expect(rechercher(index, 'retraite', 2).length).toBeLessThanOrEqual(2);
  });
});
