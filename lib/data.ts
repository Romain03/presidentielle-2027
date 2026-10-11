import {
  Calendrier,
  Candidats,
  DocumentsProgramme,
  NATURES_DOCUMENT,
  Partis,
  Propositions,
  Journal,
  Questions,
  Themes,
  enLice,
  type Candidat,
  type DocumentProgramme,
  type EtapeCalendrier,
  type EntreeJournal,
  type Parti,
  type Proposition,
  type Question,
  type Theme,
} from './schemas';
import calendrierJson from '../data/calendrier.json';
import candidatsJson from '../data/candidats.json';
import documentsJson from '../data/documents.json';
import journalJson from '../data/journal.json';
import partisJson from '../data/partis.json';
import propositionsJson from '../data/propositions.json';
import questionsJson from '../data/questions.json';
import themesJson from '../data/themes.json';
import type { ZodTypeAny, z } from 'zod';

/**
 * Chargement des données. La validation a lieu à l'import : si un fichier de
 * /data est malformé, ou si une proposition n'a pas de source, `next build`
 * échoue ici plutôt que de publier une donnée douteuse.
 */

// Le type est déduit du schéma (sortie, après application des valeurs par
// défaut), et non de la forme attendue en entrée.
function valider<S extends ZodTypeAny>(schema: S, valeur: unknown, fichier: string): z.infer<S> {
  const resultat = schema.safeParse(valeur);
  if (!resultat.success) {
    const details = resultat.error.issues
      .map((i) => `  • ${i.path.join('.') || '(racine)'} - ${i.message}`)
      .join('\n');
    throw new Error(`Données invalides dans data/${fichier} :\n${details}`);
  }
  return resultat.data;
}

const parNom = (a: Candidat, b: Candidat) =>
  a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr');

const parLibelle = <T extends { libelle: string }>(a: T, b: T) =>
  a.libelle.localeCompare(b.libelle, 'fr');

const parNomParti = (a: Parti, b: Parti) => a.nom.localeCompare(b.nom, 'fr');

/** Ordre alphabétique par défaut, partout : aucun classement éditorial. */
export const partis: Parti[] = valider(Partis, partisJson, 'partis.json').sort(parNomParti);
export const candidats: Candidat[] = valider(Candidats, candidatsJson, 'candidats.json').sort(parNom);
export const themes: Theme[] = valider(Themes, themesJson, 'themes.json').sort(parLibelle);

/**
 * Les échéances du scrutin, par ordre chronologique. Seules y figurent les
 * dates officialisées : une étape dont la date dépend d'un décret non paru est
 * absente plutôt qu'estimée.
 */
export const calendrier: EtapeCalendrier[] = valider(
  Calendrier,
  calendrierJson,
  'calendrier.json',
).sort((x, y) => x.date.localeCompare(y.date));
export const propositions: Proposition[] = valider(
  Propositions,
  propositionsJson,
  'propositions.json',
);

/**
 * Documents de programme publiés en PDF sur les sites officiels, par ordre
 * alphabétique de candidat puis du plus récent au plus ancien. Un document sans
 * date établie passe en dernier : il n'y a pas de rang à lui inventer.
 */
export const documents: DocumentProgramme[] = valider(
  DocumentsProgramme,
  documentsJson,
  'documents.json',
).sort((a, b) => {
  const rangA = candidats.findIndex((c) => c.id === a.candidat_id);
  const rangB = candidats.findIndex((c) => c.id === b.candidat_id);
  if (rangA !== rangB) return rangA - rangB;
  if (a.date_document === null) return b.date_document === null ? 0 : 1;
  if (b.date_document === null) return -1;
  const parDate = b.date_document.localeCompare(a.date_document);
  if (parDate !== 0) return parDate;
  // À date égale - une lettre et sa synthèse paraissent le même jour - le
  // document le plus englobant passe devant : lire la synthèse en premier
  // laisserait croire qu'elle est le programme.
  const parNature = NATURES_DOCUMENT.indexOf(a.nature) - NATURES_DOCUMENT.indexOf(b.nature);
  return parNature || a.titre.localeCompare(b.titre, 'fr');
});

/** Journal des modifications des données, du plus récent au plus ancien. */
export const journal: EntreeJournal[] = valider(Journal, journalJson, 'journal.json');

export const questions: Question[] = valider(Questions, questionsJson, 'questions.json');

/* ------------------------------------------------- intégrité référentielle */

function verifierIntegrite(): void {
  const erreurs: string[] = [];

  const doublons = (ids: string[], quoi: string) => {
    const vus = new Set<string>();
    for (const id of ids) {
      if (vus.has(id)) erreurs.push(`${quoi} : identifiant en doublon « ${id} »`);
      vus.add(id);
    }
  };

  doublons(partis.map((p) => p.id), 'partis.json');
  doublons(candidats.map((c) => c.id), 'candidats.json');
  doublons(themes.map((t) => t.id), 'themes.json');
  doublons(propositions.map((p) => p.id), 'propositions.json');

  const idsPartis = new Set(partis.map((p) => p.id));
  const idsCandidats = new Set(candidats.map((c) => c.id));
  const idsThemes = new Set(themes.map((t) => t.id));

  for (const c of candidats) {
    if (c.parti_id !== null && !idsPartis.has(c.parti_id)) {
      erreurs.push(`candidats.json : « ${c.id} » référence un parti inconnu « ${c.parti_id} »`);
    }
  }
  for (const p of propositions) {
    if (!idsCandidats.has(p.candidat_id)) {
      erreurs.push(`propositions.json : « ${p.id} » référence un candidat inconnu « ${p.candidat_id} »`);
    }
    if (!idsThemes.has(p.theme_id)) {
      erreurs.push(`propositions.json : « ${p.id} » référence un thème inconnu « ${p.theme_id} »`);
    }
  }

  doublons(documents.map((d) => d.id), 'documents.json');

  const urlsDocuments = new Set<string>();
  for (const d of documents) {
    if (!idsCandidats.has(d.candidat_id)) {
      erreurs.push(`documents.json : « ${d.id} » référence un candidat inconnu « ${d.candidat_id} »`);
    }
    for (const theme of d.themes) {
      if (!idsThemes.has(theme)) {
        erreurs.push(`documents.json : « ${d.id} » référence un thème inconnu « ${theme} »`);
      }
    }
    // Deux entrées pointant le même fichier afficheraient deux fois le même
    // document, et l'une des deux porterait forcément un titre inexact.
    if (urlsDocuments.has(d.url)) {
      erreurs.push(`documents.json : le fichier « ${d.url} » est référencé deux fois`);
    }
    urlsDocuments.add(d.url);
  }

  doublons(questions.map((q) => q.id), 'questions.json');

  const libellesIndicateurs = new Set(
    propositions.flatMap((p) => p.indicateurs.map((i) => i.libelle)),
  );
  for (const q of questions) {
    if (!idsThemes.has(q.theme_id)) {
      erreurs.push(`questions.json : « ${q.id} » référence un thème inconnu « ${q.theme_id} »`);
    }
    if (!libellesIndicateurs.has(q.indicateur)) {
      erreurs.push(
        `questions.json : « ${q.id} » porte sur l'indicateur « ${q.indicateur} », qui n'apparaît dans aucune proposition`,
      );
    }
  }

  if (erreurs.length > 0) {
    throw new Error(`Intégrité des données :\n${erreurs.map((e) => `  • ${e}`).join('\n')}`);
  }
}

verifierIntegrite();

/* --------------------------------------------------------------- accesseurs */

export function getCandidat(id: string): Candidat | undefined {
  return candidats.find((c) => c.id === id);
}

export function getParti(id: string | null): Parti | undefined {
  return id === null ? undefined : partis.find((p) => p.id === id);
}

export function getTheme(id: string): Theme | undefined {
  return themes.find((t) => t.id === id);
}

/**
 * Le candidat porteur de cette proposition concourt-il encore ?
 *
 * La question n'est pas rhétorique : les cinq candidats de la primaire du pôle
 * socialiste avaient tous des positions relevées, et quatre d'entre eux ne
 * concourent plus. Leurs propositions restent publiées - les effacer serait
 * réécrire l'histoire de la campagne - mais les compter avec les autres fait
 * annoncer « 68 propositions » à côté de « 27 candidatures engagées » quand
 * celles-ci n'en portent que 47.
 */
export function porteeParUnCandidatEnLice(proposition: Proposition): boolean {
  const candidat = candidats.find((c) => c.id === proposition.candidat_id);
  return candidat !== undefined && enLice(candidat.statut);
}

/** Propositions d'un candidat, éventuellement restreintes à un thème. */
export function propositionsDuCandidat(candidatId: string, themeId?: string): Proposition[] {
  return propositions.filter(
    (p) => p.candidat_id === candidatId && (themeId === undefined || p.theme_id === themeId),
  );
}

/** Propositions d'un thème, dans l'ordre alphabétique des candidats. */
export function propositionsDuTheme(themeId: string): Proposition[] {
  const rang = new Map(candidats.map((c, i) => [c.id, i]));
  return propositions
    .filter((p) => p.theme_id === themeId)
    .sort((a, b) => (rang.get(a.candidat_id) ?? 0) - (rang.get(b.candidat_id) ?? 0));
}

/** Documents de programme d'un candidat, du plus récent au plus ancien. */
export function documentsDuCandidat(candidatId: string): DocumentProgramme[] {
  return documents.filter((d) => d.candidat_id === candidatId);
}

/**
 * Documents portant sur un thème. Les programmes généraux n'y figurent pas :
 * ils traitent le thème parmi beaucoup d'autres, et les faire apparaître dans
 * les douze thèmes reviendrait à les y noyer.
 */
export function documentsDuTheme(themeId: string): DocumentProgramme[] {
  return documents.filter((d) => d.themes.includes(themeId));
}

export function candidatsDuParti(partiId: string): Candidat[] {
  return candidats.filter((c) => c.parti_id === partiId);
}

export function nombrePropositions(candidatId: string): number {
  return propositions.filter((p) => p.candidat_id === candidatId).length;
}

/** Thèmes sur lesquels le candidat s'est exprimé, par ordre alphabétique. */
export function themesRenseignes(candidatId: string): Theme[] {
  const ids = new Set(propositionsDuCandidat(candidatId).map((p) => p.theme_id));
  return themes.filter((t) => ids.has(t.id));
}

/* ------------------------------------------------------------ mise à jour */

/**
 * Date de dernière mise à jour, dérivée des données : jamais saisie à la main,
 * donc jamais fausse.
 */
export const derniereMiseAJour: string = [
  ...partis.map((p) => p.derniere_verification),
  ...candidats.map((c) => c.derniere_verification),
  ...propositions.map((p) => p.derniere_verification),
  ...documents.map((d) => d.derniere_verification),
].sort().at(-1)!;

/** Médias d'où proviennent les propositions, et leur poids. Calculé, jamais saisi. */
export const sourcesDesPropositions = (() => {
  const parMedia = new Map<string, number>();
  const articles = new Set<string>();
  let citations = 0;
  for (const proposition of propositions) {
    for (const source of proposition.sources) {
      articles.add(source.url);
      citations += 1;
      const hote = new URL(source.url).hostname.replace(/^www\./, '');
      parMedia.set(hote, (parMedia.get(hote) ?? 0) + 1);
    }
  }
  return {
    citations,
    /** Propositions ne reposant que sur une seule rédaction. */
    sourceUnique: propositions.filter((p) => p.sources.length === 1).length,
    /**
     * Propositions adossées aux mots du candidat - programme, site de campagne,
     * site de parti - et non au seul compte rendu d'une rédaction.
     */
    auxMotsDuCandidat: propositions.filter((p) =>
      p.sources.some(
        (s) =>
          s.type === 'programme-officiel' ||
          s.type === 'site-de-campagne' ||
          s.type === 'site-de-parti',
      ),
    ).length,
    articles: articles.size,
    medias: [...parMedia.entries()]
      .map(([hote, nombre]) => ({ hote, nombre }))
      .sort((a, b) => b.nombre - a.nombre || a.hote.localeCompare(b.hote)),
  };
})();

/**
 * Indicateurs réellement comparables d'un thème : ceux qu'au moins deux
 * candidatures en lice ont renseignés sur la même grandeur.
 *
 * C'est la seule mesure honnête de ce que le comparateur peut faire. Le site
 * annonçait auparavant des « positions formulées différemment » sur chaque
 * ligne remplie - vrai, puisque deux résumés rédigés séparément diffèrent
 * toujours, et donc sans valeur. Compter les chiffres communs dit au lecteur
 * où la comparaison porte, et où elle ne porte pas encore.
 */
export function indicateursPartages(themeId: string): { libelle: string; candidats: number }[] {
  const parLibelle = new Map<string, Set<string>>();
  for (const proposition of propositions) {
    if (proposition.theme_id !== themeId) continue;
    if (!porteeParUnCandidatEnLice(proposition)) continue;
    for (const indicateur of proposition.indicateurs) {
      const vus = parLibelle.get(indicateur.libelle) ?? new Set<string>();
      vus.add(proposition.candidat_id);
      parLibelle.set(indicateur.libelle, vus);
    }
  }
  return [...parLibelle.entries()]
    .filter(([, candidats]) => candidats.size >= 2)
    .map(([libelle, candidats]) => ({ libelle, candidats: candidats.size }))
    .sort((a, b) => b.candidats - a.candidats || a.libelle.localeCompare(b.libelle, 'fr'));
}

export const statistiques = {
  candidats: candidats.length,
  /** Candidatures engagées : investies ou déclarées. */
  enLice: candidats.filter((c) => enLice(c.statut)).length,
  pressentis: candidats.filter((c) => c.statut === 'pressenti').length,
  retires: candidats.filter((c) => c.statut === 'retire').length,
  partis: partis.length,
  themes: themes.length,
  propositions: propositions.length,
  /** Propositions portées par une candidature encore en course. */
  propositionsEnLice: propositions.filter(porteeParUnCandidatEnLice).length,
  /** Propositions d'anciens candidats et de pressentis, conservées et signalées. */
  propositionsHorsLice: propositions.filter((p) => !porteeParUnCandidatEnLice(p)).length,
  candidatsAvecProposition: candidats.filter((c) => nombrePropositions(c.id) > 0).length,
  propositionsDeProgramme: propositions.filter((p) => p.nature === 'programme_officiel').length,
  partisSansNuance: partis.filter((p) => p.nuance_ministerielle === null).length,
  propositionsSansCitation: propositions.filter((p) => p.citation === null).length,
  documents: documents.length,
  candidatsAvecDocument: new Set(documents.map((d) => d.candidat_id)).size,
  pagesDeDocuments: documents.reduce((somme, d) => somme + d.pages, 0),
  /** Thèmes où le comparateur peut aligner au moins un chiffre commun. */
  themesComparables: themes.filter((t) => indicateursPartages(t.id).length > 0).length,
};
