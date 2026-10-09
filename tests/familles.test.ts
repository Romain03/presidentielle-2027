import { describe, expect, it } from 'vitest';
import { candidats, partis, propositions, themes } from '@/lib/data';
import {
  candidatsDeLaFamille,
  famillesPeuplees,
  partisDeLaFamille,
  synthetiserFamille,
} from '@/lib/familles';
import { FAMILLES, LIBELLES_FAMILLE } from '@/lib/schemas';

describe('composition des familles', () => {
  it('range chaque parti dans exactement une famille', () => {
    const comptes = FAMILLES.map((f) => partisDeLaFamille(f).length).reduce((a, b) => a + b, 0);
    expect(comptes).toBe(partis.length);
  });

  it('n’inclut que des candidats rattachés à un parti de la famille', () => {
    for (const famille of FAMILLES) {
      const idsPartis = new Set(partisDeLaFamille(famille).map((p) => p.id));
      for (const candidat of candidatsDeLaFamille(famille)) {
        expect(candidat.parti_id).not.toBeNull();
        expect(idsPartis.has(candidat.parti_id!)).toBe(true);
      }
    }
  });

  it('laisse de côté les candidats sans étiquette, qui n’ont pas de famille', () => {
    const dansUneFamille = new Set(FAMILLES.flatMap((f) => candidatsDeLaFamille(f).map((c) => c.id)));
    for (const candidat of candidats) {
      expect(dansUneFamille.has(candidat.id)).toBe(candidat.parti_id !== null);
    }
  });

  it('ne liste que les familles comptant au moins un parti, par ordre alphabétique', () => {
    const peuplees = famillesPeuplees();
    expect(peuplees.length).toBeGreaterThan(0);
    for (const s of peuplees) expect(s.partis.length).toBeGreaterThan(0);
    const libelles = peuplees.map((s) => s.libelle);
    expect(libelles).toEqual([...libelles].sort((a, b) => a.localeCompare(b, 'fr')));
  });
});

describe('synthèse d’une famille', () => {
  it('répartit les douze thèmes entre renseignés et muets, sans doublon', () => {
    for (const famille of FAMILLES) {
      const s = synthetiserFamille(famille);
      expect(s.themesRenseignes.length + s.themesMuets.length).toBe(themes.length);
      const ids = [...s.themesRenseignes.map((t) => t.theme.id), ...s.themesMuets.map((t) => t.id)];
      expect(new Set(ids).size).toBe(themes.length);
    }
  });

  it('ne compte que les propositions des candidats de la famille', () => {
    const s = synthetiserFamille('gauche');
    const ids = new Set(s.candidats.map((c) => c.id));
    const attendu = propositions.filter((p) => ids.has(p.candidat_id)).length;
    expect(s.nombrePropositions).toBe(attendu);
    for (const theme of s.themesRenseignes) {
      for (const proposition of theme.propositions) {
        expect(ids.has(proposition.candidat_id)).toBe(true);
      }
    }
  });

  it('compte les candidats exprimés, pas les propositions', () => {
    for (const famille of FAMILLES) {
      for (const theme of synthetiserFamille(famille).themesRenseignes) {
        expect(theme.exprimes).toBe(new Set(theme.propositions.map((p) => p.candidat_id)).size);
        expect(theme.exprimes).toBeLessThanOrEqual(theme.propositions.length);
      }
    }
  });

  it('porte un libellé cohérent avec la nomenclature', () => {
    for (const famille of FAMILLES) {
      expect(synthetiserFamille(famille).libelle).toBe(LIBELLES_FAMILLE[famille]);
    }
  });
});

describe('regroupement des indicateurs chiffrés', () => {
  it('rassemble sous une même valeur les candidats qui l’énoncent', () => {
    const retraites = synthetiserFamille('gauche').themesRenseignes.find(
      (t) => t.theme.id === 'retraites',
    );
    expect(retraites).toBeDefined();

    const age = retraites!.indicateurs.find((i) => i.libelle === 'Âge légal de départ');
    expect(age).toBeDefined();

    // Plusieurs candidats de gauche proposent 60 ans : ils doivent être
    // rassemblés sur une seule ligne, c'est tout l'intérêt de la vue.
    const soixante = age!.valeurs.find((v) => v.valeur === '60 ans');
    expect(soixante).toBeDefined();
    expect(soixante!.candidats.length).toBeGreaterThan(1);
  });

  it('classe les valeurs de la plus partagée à la moins partagée', () => {
    for (const famille of FAMILLES) {
      for (const theme of synthetiserFamille(famille).themesRenseignes) {
        for (const indicateur of theme.indicateurs) {
          const tailles = indicateur.valeurs.map((v) => v.candidats.length);
          expect(tailles).toEqual([...tailles].sort((a, b) => b - a));
        }
      }
    }
  });

  it('écarte un indicateur énoncé par un seul candidat', () => {
    for (const famille of FAMILLES) {
      for (const theme of synthetiserFamille(famille).themesRenseignes) {
        for (const indicateur of theme.indicateurs) {
          const total = indicateur.valeurs.reduce((n, v) => n + v.candidats.length, 0);
          expect(total).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('marque « unanime » quand une seule valeur est énoncée', () => {
    for (const famille of FAMILLES) {
      for (const theme of synthetiserFamille(famille).themesRenseignes) {
        for (const indicateur of theme.indicateurs) {
          expect(indicateur.unanime).toBe(indicateur.valeurs.length === 1);
        }
      }
    }
  });

  it('ne compte jamais deux fois le même candidat pour une valeur', () => {
    for (const famille of FAMILLES) {
      for (const theme of synthetiserFamille(famille).themesRenseignes) {
        for (const indicateur of theme.indicateurs) {
          for (const valeur of indicateur.valeurs) {
            const ids = valeur.candidats.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
          }
        }
      }
    }
  });
});
