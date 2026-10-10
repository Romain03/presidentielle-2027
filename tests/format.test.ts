import { describe, expect, it } from 'vitest';
import { age, periode } from '@/lib/format';

describe('periode', () => {
  it('affiche une fonction achevée', () => {
    expect(periode(2012, 2017)).toBe('2012-2017');
  });

  it('affiche une fonction toujours exercée', () => {
    expect(periode(2024, null)).toBe('depuis 2024');
  });

  it('n’affiche qu’une année quand le mandat a duré moins d’un an', () => {
    expect(periode(1999, 1999)).toBe('1999');
  });
});

describe('age', () => {
  const naissance = (date: string) => ({ date, annee: Number(date.slice(0, 4)) });

  it('compte les années révolues', () => {
    expect(age(naissance('1954-08-12'), '2026-10-09')).toBe(72);
  });

  it('ne compte pas l’année en cours avant l’anniversaire', () => {
    expect(age(naissance('1960-11-20'), '2026-10-09')).toBe(65);
  });

  it('compte l’année le jour même de l’anniversaire', () => {
    expect(age(naissance('1960-10-09'), '2026-10-09')).toBe(66);
  });

  it('ne calcule rien quand seule l’année de naissance est connue', () => {
    expect(age({ date: null, annee: 1987 }, '2026-10-09')).toBeNull();
  });
});
