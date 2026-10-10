import { describe, expect, it } from 'vitest';
import { candidats, propositions, questions } from '@/lib/data';
import {
  MIN_CANDIDATS_ELIGIBLES,
  MIN_CANDIDATS_PAR_QUESTION,
  MIN_QUESTIONS_ACTIVES,
  calculerResultats,
  etatDuTest,
  positionsPourQuestion,
  questionsActives,
  toutesLesQuestions,
} from '@/lib/test';

const question = (id: string) => questions.find((q) => q.id === id)!;

describe('positions déduites des indicateurs', () => {
  it('reprend la valeur comparable annoncée par chaque candidat', () => {
    const positions = positionsPourQuestion(question('age-depart-retraite'));
    const parCandidat = new Map(positions.map((p) => [p.candidatId, p.valeur]));
    expect(parCandidat.get('jean-luc-melenchon')).toBe(60);
    expect(parCandidat.get('marine-le-pen')).toBe(62);
    expect(parCandidat.get('bruno-retailleau')).toBe(63);
    expect(parCandidat.get('edouard-philippe')).toBe(65);
  });

  it('écarte les candidats dont la valeur n’est pas réductible à un nombre', () => {
    const positions = positionsPourQuestion(question('age-depart-retraite'));
    // Gabriel Attal veut supprimer l'âge légal : rien à comparer.
    expect(positions.some((p) => p.candidatId === 'gabriel-attal')).toBe(false);
  });

  it('ne retient qu’une position par candidat', () => {
    for (const { positions } of toutesLesQuestions()) {
      const ids = positions.map((p) => p.candidatId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('renvoie toujours à une proposition réelle, donc sourcée', () => {
    const idsPropositions = new Set(propositions.map((p) => p.id));
    for (const { positions } of toutesLesQuestions()) {
      for (const position of positions) {
        expect(idsPropositions.has(position.propositionId)).toBe(true);
      }
    }
  });

  it('classe les positions dans l’ordre alphabétique des candidats', () => {
    const rang = new Map(candidats.map((c, i) => [c.id, i]));
    for (const { positions } of toutesLesQuestions()) {
      const rangs = positions.map((p) => rang.get(p.candidatId)!);
      expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
    }
  });
});

describe('seuils d’activation', () => {
  it('n’active que les questions documentées par assez de candidats', () => {
    for (const { positions } of questionsActives()) {
      expect(positions.length).toBeGreaterThanOrEqual(MIN_CANDIDATS_PAR_QUESTION);
    }
  });

  it('reste éteint tant que les données ne suivent pas, en disant pourquoi', () => {
    const etat = etatDuTest();
    const assezDeQuestions = etat.questionsActives.length >= MIN_QUESTIONS_ACTIVES;
    const assezDeCandidats = etat.candidatsEligibles.length >= MIN_CANDIDATS_ELIGIBLES;
    expect(etat.actif).toBe(assezDeQuestions && assezDeCandidats);
    if (!etat.actif) expect(etat.manques.length).toBeGreaterThan(0);
  });

  it('répartit toutes les questions entre actives et écartées', () => {
    const etat = etatDuTest();
    expect(etat.questionsActives.length + etat.questionsEcartees.length).toBe(questions.length);
  });
});

describe('calcul des affinités', () => {
  const q = 'age-depart-retraite';

  it('donne 100 à qui annonce exactement la même valeur', () => {
    const resultats = calculerResultats({ [q]: 60 });
    const melenchon = resultats.candidats.find((c) => c.id === 'jean-luc-melenchon');
    expect(melenchon?.score).toBe(100);
  });

  it('donne 0 à la valeur la plus éloignée de l’échelle', () => {
    const resultats = calculerResultats({ [q]: 60 });
    // L'échelle va de 60 à 65 ans : Édouard Philippe est à l'autre extrémité.
    expect(resultats.candidats.find((c) => c.id === 'edouard-philippe')?.score).toBe(0);
  });

  it('décroît avec l’écart', () => {
    const resultats = calculerResultats({ [q]: 60 });
    const score = (id: string) => resultats.candidats.find((c) => c.id === id)!.score;
    expect(score('jean-luc-melenchon')).toBeGreaterThan(score('marine-le-pen'));
    expect(score('marine-le-pen')).toBeGreaterThan(score('bruno-retailleau'));
    expect(score('bruno-retailleau')).toBeGreaterThan(score('edouard-philippe'));
  });

  it('classe du plus proche au plus éloigné', () => {
    const scores = calculerResultats({ [q]: 65 }).candidats.map((c) => c.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('expose le dénominateur, jamais un pourcentage seul', () => {
    const resultats = calculerResultats({ [q]: 62 });
    for (const affinite of resultats.candidats) {
      expect(affinite.comparees).toBeGreaterThan(0);
      expect(affinite.comparees).toBeLessThanOrEqual(affinite.total);
      expect(affinite.total).toBe(resultats.questionsRepondues);
    }
  });

  it('ignore les questions sans réponse et le refus de se prononcer', () => {
    expect(calculerResultats({}).questionsRepondues).toBe(0);
    expect(calculerResultats({}).candidats).toEqual([]);
    expect(calculerResultats({ [q]: null }).questionsRepondues).toBe(0);
  });

  it('ignore une réponse à une question écartée', () => {
    const ecartee = etatDuTest().questionsEcartees[0];
    if (!ecartee) return;
    expect(calculerResultats({ [ecartee.question.id]: 60 }).questionsRepondues).toBe(0);
  });
});

