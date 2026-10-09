import { describe, expect, it } from 'vitest';
import { Candidat, Parti, Proposition, Source, Theme } from '@/lib/schemas';

const sourceValide = {
  url: 'https://exemple.fr/article',
  titre: 'Un titre de source',
  type: 'article-de-presse' as const,
  date: '2026-10-01',
};

const propositionValide = {
  id: 'candidat-theme',
  candidat_id: 'un-candidat',
  theme_id: 'retraites',
  resume: 'Un résumé suffisamment long pour être accepté.',
  detail: 'Un détail suffisamment long pour passer la validation du schéma.',
  citation: null,
  nature: 'programme_officiel' as const,
  indicateurs: [],
  source: sourceValide,
  derniere_verification: '2026-10-09',
};

describe('Source', () => {
  it('accepte une source complète', () => {
    expect(Source.safeParse(sourceValide).success).toBe(true);
  });

  it('refuse une URL invalide', () => {
    expect(Source.safeParse({ ...sourceValide, url: 'pas-une-url' }).success).toBe(false);
  });

  it('refuse un type de source inconnu', () => {
    expect(Source.safeParse({ ...sourceValide, type: 'rumeur' }).success).toBe(false);
  });

  it('refuse une date qui n’est pas au format AAAA-MM-JJ', () => {
    expect(Source.safeParse({ ...sourceValide, date: '01/10/2026' }).success).toBe(false);
  });

  it('refuse une date inexistante', () => {
    expect(Source.safeParse({ ...sourceValide, date: '2026-02-31' }).success).toBe(false);
  });
});

describe('Proposition', () => {
  it('accepte une proposition sourcée', () => {
    expect(Proposition.safeParse(propositionValide).success).toBe(true);
  });

  it('refuse une proposition sans source : c’est la garantie centrale du site', () => {
    const { source, ...sansSource } = propositionValide;
    expect(Proposition.safeParse(sansSource).success).toBe(false);
  });

  it('refuse une source sans date', () => {
    const { date, ...sourceSansDate } = sourceValide;
    expect(
      Proposition.safeParse({ ...propositionValide, source: sourceSansDate }).success,
    ).toBe(false);
  });

  it('refuse un résumé trop long, pour garder la même densité partout', () => {
    expect(
      Proposition.safeParse({ ...propositionValide, resume: 'a'.repeat(261) }).success,
    ).toBe(false);
  });

  it('refuse une nature inventée', () => {
    expect(Proposition.safeParse({ ...propositionValide, nature: 'promesse' }).success).toBe(false);
  });

  it('refuse une clé inconnue, pour attraper les fautes de frappe', () => {
    expect(
      Proposition.safeParse({ ...propositionValide, soruce: sourceValide }).success,
    ).toBe(false);
  });

  it('accepte des indicateurs chiffrés ou textuels', () => {
    const resultat = Proposition.safeParse({
      ...propositionValide,
      indicateurs: [
        { libelle: 'Âge minimal de départ', valeur: 63, unite: 'ans' },
        { libelle: 'Durée de cotisation annoncée', valeur: 'non précisée', unite: null },
      ],
    });
    expect(resultat.success).toBe(true);
  });
});

describe('Candidat', () => {
  const candidatValide = {
    id: 'prenom-nom',
    nom: 'Nom',
    prenom: 'Prénom',
    parti_id: 'un-parti',
    photo: null,
    statut: 'declare' as const,
    statut_date: '2026-07-07',
    statut_source: sourceValide,
    parcours: [],
    soutiens: [],
    precisions: [],
    liens_officiels: [],
    derniere_verification: '2026-10-09',
  };

  it('accepte un candidat complet', () => {
    expect(Candidat.safeParse(candidatValide).success).toBe(true);
  });

  it('accepte un candidat sans étiquette', () => {
    expect(Candidat.safeParse({ ...candidatValide, parti_id: null }).success).toBe(true);
  });

  it('accepte une date de statut non vérifiée', () => {
    expect(Candidat.safeParse({ ...candidatValide, statut_date: null }).success).toBe(true);
  });

  it('refuse un statut hors des quatre valeurs prévues', () => {
    expect(Candidat.safeParse({ ...candidatValide, statut: 'favori' }).success).toBe(false);
  });

  it('refuse un identifiant qui n’est pas un slug', () => {
    expect(Candidat.safeParse({ ...candidatValide, id: 'Prénom Nom' }).success).toBe(false);
  });

  it('accepte un portrait sourcé', () => {
    const resultat = Candidat.safeParse({
      ...candidatValide,
      photo: {
        fichier: 'prenom-nom.webp',
        auteur: 'Une photographe',
        licence: 'CC BY-SA 4.0',
        licence_url: 'https://creativecommons.org/licenses/by-sa/4.0',
        source_url: 'https://commons.wikimedia.org/wiki/File:Exemple.jpg',
        description: 'Portrait de Prénom Nom',
      },
    });
    expect(resultat.success).toBe(true);
  });

  it('refuse un portrait sans auteur ni licence : l’attribution est obligatoire', () => {
    const resultat = Candidat.safeParse({
      ...candidatValide,
      photo: {
        fichier: 'prenom-nom.webp',
        source_url: 'https://commons.wikimedia.org/wiki/File:Exemple.jpg',
        description: 'Portrait de Prénom Nom',
      },
    });
    expect(resultat.success).toBe(false);
  });

  it('refuse un fichier de portrait qui n’est pas un .webp nommé en slug', () => {
    const base = {
      auteur: 'Une photographe',
      licence: 'CC0',
      licence_url: null,
      source_url: 'https://commons.wikimedia.org/wiki/File:Exemple.jpg',
      description: 'Portrait de Prénom Nom',
    };
    for (const fichier of ['Prénom Nom.jpg', '../secret.webp', 'photo.png']) {
      expect(Candidat.safeParse({ ...candidatValide, photo: { ...base, fichier } }).success).toBe(
        false,
      );
    }
  });

  it('refuse une précision non sourcée', () => {
    const resultat = Candidat.safeParse({
      ...candidatValide,
      precisions: [{ libelle: 'Une précision factuelle suffisamment longue.' }],
    });
    expect(resultat.success).toBe(false);
  });
});

describe('Parti', () => {
  const partiValide = {
    id: 'un-parti',
    nom: 'Un Parti',
    sigle: 'UP',
    couleur: '#1e4b8f',
    famille: 'droite' as const,
    nuance_ministerielle: { code: 'LR', libelle: 'Les Républicains' },
    positionnement_declare: null,
    site_officiel: 'https://exemple.fr',
    processus_designation: null,
    derniere_verification: '2026-10-09',
  };

  it('accepte un parti complet', () => {
    expect(Parti.safeParse(partiValide).success).toBe(true);
  });

  it('refuse une couleur qui n’est pas au format #rrggbb', () => {
    expect(Parti.safeParse({ ...partiValide, couleur: 'bleu' }).success).toBe(false);
    expect(Parti.safeParse({ ...partiValide, couleur: '#FFF' }).success).toBe(false);
  });

  it('refuse une famille hors nomenclature', () => {
    expect(Parti.safeParse({ ...partiValide, famille: 'modérés' }).success).toBe(false);
  });

  it('exige une source pour un processus de désignation', () => {
    const resultat = Parti.safeParse({
      ...partiValide,
      processus_designation: {
        type: 'vote-des-adherents',
        libelle: 'Vote des adhérents',
        dates: ['2026-04-19'],
      },
    });
    expect(resultat.success).toBe(false);
  });
});

describe('Theme', () => {
  it('exige une description', () => {
    expect(Theme.safeParse({ id: 'retraites', libelle: 'Retraites' }).success).toBe(false);
  });
});
