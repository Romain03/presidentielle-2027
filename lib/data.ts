import {
  Candidats,
  Partis,
  Propositions,
  Themes,
  type Candidat,
  type Parti,
  type Proposition,
  type Theme,
} from './schemas';
import candidatsJson from '../data/candidats.json';
import partisJson from '../data/partis.json';
import propositionsJson from '../data/propositions.json';
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
      .map((i) => `  • ${i.path.join('.') || '(racine)'} — ${i.message}`)
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
export const propositions: Proposition[] = valider(
  Propositions,
  propositionsJson,
  'propositions.json',
);

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
].sort().at(-1)!;

export const statistiques = {
  candidats: candidats.length,
  partis: partis.length,
  themes: themes.length,
  propositions: propositions.length,
  candidatsAvecProposition: candidats.filter((c) => nombrePropositions(c.id) > 0).length,
};
