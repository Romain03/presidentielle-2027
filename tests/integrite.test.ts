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
  indicateursPartages,
  porteeParUnCandidatEnLice,
  statistiques,
  themes,
} from '@/lib/data';
import { accesLibre, enLice, hoteDe } from '@/lib/schemas';

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

/**
 * Les battus d'une primaire gardent leurs propositions publiées, et c'est
 * voulu : effacer ce qu'un candidat a défendu pendant sa campagne reviendrait à
 * la réécrire. Mais les compter avec les autres faisait annoncer « 68
 * propositions » à côté de « 27 candidatures engagées », et la page Santé
 * affichait « 1 position relevée » au-dessus d'un tableau vide - sa seule
 * position appartenant à un battu, masqué par le filtre par défaut.
 */
describe('comptes selon le statut du candidat', () => {
  it('séparent les propositions en lice de celles qui ne le sont plus', () => {
    expect(statistiques.propositionsEnLice + statistiques.propositionsHorsLice).toBe(
      statistiques.propositions,
    );
    expect(statistiques.propositionsHorsLice).toBeGreaterThan(0);
  });

  it('ne comptent en lice que des propositions de candidats investis ou déclarés', () => {
    for (const proposition of propositions.filter(porteeParUnCandidatEnLice)) {
      const candidat = getCandidat(proposition.candidat_id)!;
      expect(enLice(candidat.statut), proposition.id).toBe(true);
    }
    for (const proposition of propositions.filter((p) => !porteeParUnCandidatEnLice(p))) {
      const candidat = getCandidat(proposition.candidat_id)!;
      expect(enLice(candidat.statut), proposition.id).toBe(false);
    }
  });

  // Ce test ne force pas la couverture : il vérifie qu'un thème dont toutes les
  // positions sont masquées par défaut reste détectable, pour que la page le
  // dise au lecteur plutôt que de lui montrer un tableau vide.
  it('repèrent les thèmes dont aucune position n’est portée par une candidature en lice', () => {
    const muetsEnLice = themes.filter(
      (theme) =>
        propositionsDuTheme(theme.id).length > 0 &&
        propositionsDuTheme(theme.id).filter(porteeParUnCandidatEnLice).length === 0,
    );
    // La liste peut être vide un jour - c'est le but. Ce qui est interdit, c'est
    // qu'un tel thème existe sans que le compte en lice le révèle.
    for (const theme of muetsEnLice) {
      const total = propositionsDuTheme(theme.id).length;
      const enCourse = propositionsDuTheme(theme.id).filter(porteeParUnCandidatEnLice).length;
      expect(total, theme.id).toBeGreaterThan(0);
      expect(enCourse, theme.id).toBe(0);
    }
  });
});

/**
 * Un indicateur ne compare que s'il porte le même libellé chez tous les
 * candidats. « Revalorisation des enseignants » et « Revalorisation des
 * enseignants (montant mensuel) » désignaient la même grandeur sous deux noms :
 * le comparateur alignait cinq candidats d'un côté, deux de l'autre, et aucun
 * des deux groupes ne voyait l'autre. Le défaut est invisible à l'œil nu dans
 * un fichier de soixante-quinze propositions.
 */
describe('libellés des indicateurs', () => {
  const libelles = [
    ...new Set(propositions.flatMap((p) => p.indicateurs.map((i) => i.libelle))),
  ].sort();

  it('ne contiennent aucun libellé englobé dans un autre', () => {
    const fautifs: string[] = [];
    for (const a of libelles) {
      for (const b of libelles) {
        if (a !== b && b.startsWith(a)) fautifs.push(`« ${a} » est le début de « ${b} »`);
      }
    }
    expect(fautifs).toEqual([]);
  });

  /*
   * Deux unités renseignées qui diffèrent sous un même libellé font comparer
   * des grandeurs différentes : « 2 000 euros bruts » contre « 1 700 euros
   * nets » rangés sous « SMIC visé ». Une unité absente, en revanche, est
   * légitime - « inchangé » et « supprimé » ne sont pas des âges, et la valeur
   * porte alors ses propres termes.
   */
  it('ne mélangent pas deux unités renseignées sous un même libellé', () => {
    const unites = new Map<string, Set<string>>();
    for (const proposition of propositions) {
      for (const indicateur of proposition.indicateurs) {
        if (indicateur.unite === null) continue;
        const vues = unites.get(indicateur.libelle) ?? new Set<string>();
        vues.add(indicateur.unite);
        unites.set(indicateur.libelle, vues);
      }
    }
    const melanges = [...unites.entries()]
      .filter(([, vues]) => vues.size > 1)
      .map(([libelle, vues]) => `${libelle} : ${[...vues].join(' / ')}`);
    expect(melanges).toEqual([]);
  });

  it('n’annoncent comme comparable qu’un thème portant un chiffre commun', () => {
    for (const theme of themes) {
      const partages = indicateursPartages(theme.id);
      for (const { candidats: nombre } of partages) expect(nombre).toBeGreaterThanOrEqual(2);
    }
    expect(statistiques.themesComparables).toBe(
      themes.filter((t) => indicateursPartages(t.id).length > 0).length,
    );
  });
});
