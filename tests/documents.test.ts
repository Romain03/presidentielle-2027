import { describe, expect, it } from 'vitest';
import { candidats, documents, documentsDuCandidat, documentsDuTheme, getCandidat, getTheme } from '@/lib/data';
import { DocumentProgramme, NATURES_DOCUMENT } from '@/lib/schemas';

/**
 * Les documents de programme sont la source la plus primaire du site, et la
 * plus piégeuse : un PDF n'affiche pas sa date, vit à une adresse stable, et
 * peut dater d'une campagne précédente sans que rien ne le dise.
 *
 * Seize livrets thématiques du Rassemblement national, encore publiés
 * aujourd'hui sous l'intitulé « Découvrez le programme », ont été fabriqués en
 * janvier et février 2022. Un livret du Parti animaliste porte sur les
 * européennes de 2024, et le PDF publié sur melenchon2027.fr est le contrat de
 * législature du Nouveau Front populaire de juin 2024. Aucun de ces documents
 * ne concerne 2027. C'est ce que verrouille le test sur le millésime.
 */
describe('documents de programme', () => {
  it('se chargent et sont rattachés à un candidat connu', () => {
    expect(documents.length).toBeGreaterThan(0);
    for (const document of documents) {
      expect(getCandidat(document.candidat_id), document.id).toBeDefined();
      for (const theme of document.themes) expect(getTheme(theme), document.id).toBeDefined();
    }
  });

  it('n’ont aucun identifiant ni aucun fichier en doublon', () => {
    const ids = documents.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const urls = documents.map((d) => d.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('mènent au fichier lui-même quand le document est un PDF', () => {
    for (const document of documents.filter((d) => d.format === 'pdf')) {
      expect(new URL(document.url).pathname.toLowerCase().endsWith('.pdf'), document.id).toBe(true);
    }
  });

  /*
   * Le site ne listait que des PDF, et c'était un critère de format déguisé en
   * critère de fond : le programme de Gabriel Attal, « L'Avenir en commun » et
   * les cahiers de François Ruffin sont des programmes officiels publiés, mais
   * en pages web.
   */
  it('n’annoncent ni pagination ni poids pour un programme publié en page', () => {
    const pages = documents.filter((d) => d.format === 'page');
    expect(pages.length).toBeGreaterThan(0);
    for (const document of pages) {
      expect(document.pages, document.id).toBeNull();
      expect(document.poids_ko, document.id).toBeNull();
      expect(new URL(document.url).pathname.toLowerCase().endsWith('.pdf'), document.id).toBe(false);
    }
  });

  // La raison d'être de cette liste : lire un programme ne doit pas coûter une
  // adresse électronique. Un lien vers un formulaire de téléchargement
  // reviendrait à relayer le formulaire.
  it('donnent aussi la page d’origine d’un PDF, distincte du fichier', () => {
    for (const document of documents.filter((d) => d.format === 'pdf')) {
      expect(document.page_source, document.id).not.toBeNull();
      expect(document.page_source, document.id).not.toBe(document.url);
      expect(new URL(document.page_source!).protocol).toMatch(/^https?:$/);
    }
    // Une page web est sa propre source : lui en inventer une seconde
    // reviendrait à la faire passer pour un fichier publié ailleurs.
    for (const document of documents.filter((d) => d.format === 'page')) {
      expect(document.page_source, document.id).toBeNull();
    }
  });

  it('ne retiennent aucun document antérieur à 2026', () => {
    for (const document of documents) {
      if (document.date_document === null) continue;
      expect(document.date_document >= '2026-01-01', document.id).toBe(true);
    }
  });

  it('ne portent aucune date postérieure à sa vérification', () => {
    for (const document of documents) {
      if (document.date_document === null) continue;
      expect(document.date_document <= document.derniere_verification, document.id).toBe(true);
    }
  });

  it('disent d’où vient leur date, ou n’en annoncent aucune', () => {
    for (const document of documents) {
      expect(document.date_document === null, document.id).toBe(document.origine_date === null);
    }
  });

  it('annoncent un nombre de pages et un poids relevés sur le fichier', () => {
    for (const document of documents.filter((d) => d.format === 'pdf')) {
      expect(document.pages, document.id).toBeGreaterThan(0);
      // Un PDF de programme fait au moins quelques dizaines de kilo-octets :
      // un chiffre plus bas trahirait une erreur de saisie, ou une page
      // d'erreur enregistrée à la place du document.
      expect(document.poids_ko, document.id).toBeGreaterThan(50);
    }
  });

  it('nomment l’éditeur, et distinguent le candidat de son parti', () => {
    for (const document of documents) {
      expect(document.editeur.length, document.id).toBeGreaterThan(1);
      expect(['candidat', 'parti']).toContain(document.publie_par);
    }
  });

  it('rattachent chaque livret thématique à au moins un thème du site', () => {
    for (const document of documents.filter((d) => d.nature === 'livret-thematique')) {
      expect(document.themes.length, document.id).toBeGreaterThan(0);
    }
  });

  it('sont classés par candidat, puis du plus récent au plus ancien', () => {
    const rang = new Map(candidats.map((c, i) => [c.id, i]));
    for (let i = 1; i < documents.length; i += 1) {
      const avant = documents[i - 1];
      const apres = documents[i];
      const rangAvant = rang.get(avant.candidat_id)!;
      const rangApres = rang.get(apres.candidat_id)!;
      expect(rangAvant).toBeLessThanOrEqual(rangApres);
      if (rangAvant !== rangApres) continue;
      // Une date absente passe en dernier : il n'y a pas de rang à lui inventer.
      if (avant.date_document === null) expect(apres.date_document).toBeNull();
      else if (apres.date_document !== null) {
        expect(avant.date_document >= apres.date_document).toBe(true);
        // À date égale, le document le plus englobant d'abord.
        if (avant.date_document === apres.date_document) {
          expect(NATURES_DOCUMENT.indexOf(avant.nature)).toBeLessThanOrEqual(
            NATURES_DOCUMENT.indexOf(apres.nature),
          );
        }
      }
    }
  });

  it('ne ressortent par thème que les livrets, jamais les programmes généraux', () => {
    for (const document of documentsDuTheme('sante')) {
      expect(document.themes).toContain('sante');
    }
    const generaux = documents.filter((d) => d.nature === 'programme');
    expect(generaux.length).toBeGreaterThan(0);
    for (const document of generaux) expect(document.themes).toHaveLength(0);
  });

  it('se retrouvent depuis la fiche de leur candidat', () => {
    for (const document of documents) {
      expect(documentsDuCandidat(document.candidat_id).map((d) => d.id)).toContain(document.id);
    }
  });
});

describe('schéma des documents', () => {
  const valide = {
    id: 'exemple',
    candidat_id: 'fabien-roussel',
    titre: 'Un document',
    nature: 'programme' as const,
    publie_par: 'candidat' as const,
    editeur: 'Un mouvement',
    url: 'https://exemple.fr/doc.pdf',
    page_source: 'https://exemple.fr/programme',
    pages: 12,
    poids_ko: 400,
    format: 'pdf' as const,
    date_document: '2026-10-06',
    origine_date: 'metadonnees-pdf' as const,
    themes: [],
    derniere_verification: '2026-10-11',
  };

  it('accepte un document complet', () => {
    expect(DocumentProgramme.safeParse(valide).success).toBe(true);
  });

  it('refuse un PDF dont le lien ne mène pas au fichier', () => {
    const resultat = DocumentProgramme.safeParse({ ...valide, url: 'https://exemple.fr/programme' });
    expect(resultat.success).toBe(false);
  });

  it('accepte un programme publié en page, sans pagination ni poids', () => {
    const resultat = DocumentProgramme.safeParse({
      ...valide,
      format: 'page',
      url: 'https://exemple.fr/programme',
      page_source: null,
      pages: null,
      poids_ko: null,
    });
    expect(resultat.success).toBe(true);
  });

  it('refuse une page qui annonce une pagination', () => {
    const resultat = DocumentProgramme.safeParse({
      ...valide,
      format: 'page',
      url: 'https://exemple.fr/programme',
      page_source: null,
      poids_ko: null,
    });
    expect(resultat.success).toBe(false);
  });

  it('refuse un PDF sans pagination, sans poids ou sans page d’origine', () => {
    for (const manque of [{ pages: null }, { poids_ko: null }, { page_source: null }]) {
      expect(DocumentProgramme.safeParse({ ...valide, ...manque }).success).toBe(false);
    }
  });

  it('refuse un format « page » pointant sur un fichier PDF', () => {
    const resultat = DocumentProgramme.safeParse({
      ...valide,
      format: 'page',
      page_source: null,
      pages: null,
      poids_ko: null,
    });
    expect(resultat.success).toBe(false);
  });

  it('refuse une date sans origine, et une origine sans date', () => {
    expect(DocumentProgramme.safeParse({ ...valide, origine_date: null }).success).toBe(false);
    expect(DocumentProgramme.safeParse({ ...valide, date_document: null }).success).toBe(false);
  });

  it('refuse un livret thématique qui ne dit pas sur quoi il porte', () => {
    const resultat = DocumentProgramme.safeParse({
      ...valide,
      nature: 'livret-thematique',
      themes: [],
    });
    expect(resultat.success).toBe(false);
  });

  it('refuse un champ inattendu', () => {
    expect(DocumentProgramme.safeParse({ ...valide, resume: 'x' }).success).toBe(false);
  });
});
