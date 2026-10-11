import { describe, expect, it } from 'vitest';
import {
  calendrier,
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
import { accesLibre, hoteDe } from '@/lib/schemas';

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
      expect(proposition.sources.length).toBeGreaterThan(0);
      for (const source of proposition.sources) {
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  /*
    La méthodologie publiée promet qu'un article payant ne sert jamais de source
    unique. Ce test en fait une contrainte : la promesse ne peut plus être
    oubliée au moment où l'accès à un abonnement rend la facilité tentante.
  */
  it('portent toutes au moins une source librement accessible', () => {
    const captives = propositions.filter((p) => !p.sources.some(accesLibre));
    expect(
      captives.map((p) => `${p.id} : ${p.sources.map((s) => hoteDe(s.url)).join(', ')}`),
    ).toEqual([]);
  });

  it('n’ont pas de source postérieure à sa date de vérification', () => {
    for (const proposition of propositions) {
      for (const source of proposition.sources) {
        expect(source.date <= proposition.derniere_verification).toBe(true);
      }
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

describe('calendrier du scrutin', () => {
  it('est trié par ordre chronologique', () => {
    const dates = calendrier.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('ne porte que des dates postérieures au dernier relevé', () => {
    for (const etape of calendrier) expect(etape.date > derniereMiseAJour).toBe(true);
  });

  /*
    Une date de scrutin fausse est la pire erreur que ce site puisse faire :
    elle enverrait quelqu'un voter le mauvais jour. Chaque étape porte donc sa
    source, et le second tour tombe deux semaines après le premier, comme
    l'impose le code électoral.
  */
  it('porte une source par étape et respecte l’écart de deux semaines', () => {
    for (const etape of calendrier) expect(etape.sources.length).toBeGreaterThan(0);
    const premier = calendrier.find((e) => e.id === 'premier-tour');
    const second = calendrier.find((e) => e.id === 'second-tour');
    expect(premier && second).toBeTruthy();
    const ecart =
      (new Date(second!.date).getTime() - new Date(premier!.date).getTime()) / 86_400_000;
    expect(ecart).toBe(14);
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

describe('parcours des candidats', () => {
  it('sont classés du plus récent au plus ancien', () => {
    for (const candidat of candidats) {
      const debuts = candidat.parcours.map((j) => j.debut);
      expect(debuts).toEqual([...debuts].sort((a, b) => b - a));
    }
  });

  it('ne contiennent pas deux fois la même fonction sur la même période', () => {
    for (const candidat of candidats) {
      const cles = candidat.parcours.map((j) => `${j.debut}-${j.fin}-${j.libelle}`);
      expect(new Set(cles).size).toBe(cles.length);
    }
  });

  it('ne commencent jamais après la dernière vérification', () => {
    for (const candidat of candidats) {
      const limite = Number(candidat.derniere_verification.slice(0, 4));
      for (const jalon of candidat.parcours) {
        expect(jalon.debut).toBeLessThanOrEqual(limite);
      }
    }
  });

  it('suivent une date de naissance antérieure à la première fonction', () => {
    for (const candidat of candidats) {
      const naissance = candidat.biographie.naissance;
      if (naissance === null || candidat.parcours.length === 0) continue;
      const premier = Math.min(...candidat.parcours.map((j) => j.debut));
      expect(premier).toBeGreaterThan(naissance.annee);
    }
  });
});
