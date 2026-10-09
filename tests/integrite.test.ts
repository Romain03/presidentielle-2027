import { describe, expect, it } from 'vitest';
import {
  candidats,
  derniereMiseAJour,
  getCandidat,
  getParti,
  getTheme,
  partis,
  propositions,
  propositionsDuTheme,
  themes,
} from '@/lib/data';

/**
 * Ces tests portent sur les données réelles de /data. Le simple fait
 * d'importer lib/data.ts les valide : l'import lève si un fichier est
 * malformé, si une source manque ou si une référence est cassée.
 */
describe('données publiées', () => {
  it('se chargent et se valident', () => {
    expect(candidats.length).toBeGreaterThan(0);
    expect(partis.length).toBeGreaterThan(0);
    expect(propositions.length).toBeGreaterThan(0);
    expect(themes).toHaveLength(12);
  });

  it('n’ont aucun identifiant en doublon', () => {
    for (const collection of [candidats, partis, themes, propositions]) {
      const ids = collection.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ne référencent que des partis, candidats et thèmes existants', () => {
    for (const candidat of candidats) {
      if (candidat.parti_id !== null) expect(getParti(candidat.parti_id)).toBeDefined();
    }
    for (const proposition of propositions) {
      expect(getCandidat(proposition.candidat_id)).toBeDefined();
      expect(getTheme(proposition.theme_id)).toBeDefined();
    }
  });

  it('portent toutes une source avec une URL et une date', () => {
    for (const proposition of propositions) {
      expect(proposition.source.url).toMatch(/^https?:\/\//);
      expect(proposition.source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('n’ont pas de source postérieure à sa date de vérification', () => {
    for (const proposition of propositions) {
      expect(proposition.source.date <= proposition.derniere_verification).toBe(true);
    }
  });

  it('exposent une date de mise à jour dérivée, égale au maximum des vérifications', () => {
    const toutes = [
      ...partis.map((p) => p.derniere_verification),
      ...candidats.map((c) => c.derniere_verification),
      ...propositions.map((p) => p.derniere_verification),
    ];
    expect(derniereMiseAJour).toBe(toutes.sort().at(-1));
  });
});

describe('neutralité de présentation', () => {
  it('trie les candidats par ordre alphabétique de nom de famille', () => {
    const noms = candidats.map((c) => c.nom);
    const tries = [...noms].sort((a, b) => a.localeCompare(b, 'fr'));
    expect(noms).toEqual(tries);
  });

  it('trie les thèmes par ordre alphabétique de libellé', () => {
    const libelles = themes.map((t) => t.libelle);
    const tries = [...libelles].sort((a, b) => a.localeCompare(b, 'fr'));
    expect(libelles).toEqual(tries);
  });

  it('présente les positions d’un thème dans l’ordre alphabétique des candidats', () => {
    const rang = new Map(candidats.map((c, i) => [c.id, i]));
    for (const theme of themes) {
      const rangs = propositionsDuTheme(theme.id).map((p) => rang.get(p.candidat_id)!);
      expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
    }
  });
});
