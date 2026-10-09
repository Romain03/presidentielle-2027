import { z } from 'zod';

/**
 * Schéma des données. C'est la seule source de vérité du format : les quatre
 * fichiers de /data sont validés contre ces schémas au chargement, donc un
 * `next build` échoue si une donnée est malformée ou non sourcée.
 */

export const DateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')
  // Date.parse accepte « 2026-02-31 » en le reportant au 3 mars : on vérifie
  // donc que la date relue est bien celle écrite.
  .refine((v) => {
    const [annee, mois, jour] = v.split('-').map(Number);
    const d = new Date(Date.UTC(annee, mois - 1, jour));
    return (
      d.getUTCFullYear() === annee && d.getUTCMonth() === mois - 1 && d.getUTCDate() === jour
    );
  }, 'Date inexistante dans le calendrier');

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Identifiant attendu en minuscules, mots séparés par des tirets');

export const CouleurHex = z
  .string()
  .regex(/^#[0-9a-f]{6}$/, 'Couleur attendue au format #rrggbb en minuscules');

/* ------------------------------------------------------------------ sources */

/**
 * Types de source, du plus primaire au moins primaire. L'ordre de cette liste
 * est utilisé pour afficher la nature de la source au lecteur.
 */
export const TYPES_SOURCE = [
  'programme-officiel',
  'site-de-campagne',
  'site-de-parti',
  'conseil-constitutionnel',
  'journal-officiel',
  'livre',
  'discours',
  'interview',
  'communique',
  'article-de-presse',
  'encyclopedie',
] as const;

export const Source = z
  .object({
    url: z.string().url(),
    titre: z.string().min(3),
    type: z.enum(TYPES_SOURCE),
    /** Date de publication de la source, pas la date de consultation. */
    date: DateISO,
  })
  .strict();

export type Source = z.infer<typeof Source>;

/* ------------------------------------------------------------------- partis */

/**
 * Regroupement grossier utilisé uniquement pour le filtre. La correspondance
 * entre nuance du ministère de l'Intérieur et famille est publiée sur la page
 * Méthodologie : aucun classement implicite.
 */
export const FAMILLES = [
  'extreme-gauche',
  'gauche',
  'ecologistes',
  'centre',
  'droite',
  'extreme-droite',
  'regionalistes',
  'divers',
] as const;

export const Famille = z.enum(FAMILLES);
export type Famille = z.infer<typeof Famille>;

export const LIBELLES_FAMILLE: Record<Famille, string> = {
  'extreme-gauche': 'Extrême gauche',
  gauche: 'Gauche',
  ecologistes: 'Écologistes',
  centre: 'Centre',
  droite: 'Droite',
  'extreme-droite': 'Extrême droite',
  regionalistes: 'Régionalistes',
  divers: 'Divers',
};

export const TYPES_DESIGNATION = [
  'primaire-ouverte',
  'primaire-fermee',
  'vote-des-adherents',
  'designation-par-instance',
  'candidature-autonome',
  'aucun-processus-connu',
] as const;

export const ProcessusDesignation = z
  .object({
    type: z.enum(TYPES_DESIGNATION),
    libelle: z.string().min(3),
    dates: z.array(DateISO).default([]),
    source: Source,
  })
  .strict();

export const Parti = z
  .object({
    id: Slug,
    nom: z.string().min(2),
    sigle: z.string().min(1),
    /** Repère visuel uniquement : jamais le seul vecteur d'une information. */
    couleur: CouleurHex,
    famille: Famille,
    nuance_ministerielle: z
      .object({ code: z.string().min(2).max(6), libelle: z.string().min(3) })
      .strict()
      .nullable(),
    /** Année de création, telle que Wikidata la documente. */
    fondation: z
      .object({ annee: z.number().int().min(1700).max(2100), source: Source })
      .strict()
      .nullable(),
    /** Dirigeant en exercice. Fonction et nom seulement : aucun jugement. */
    dirigeant: z
      .object({ nom: z.string().min(2), fonction: z.string().min(2), source: Source })
      .strict()
      .nullable(),
    /** Positionnement tel que le parti le formule lui-même, avec sa source. */
    positionnement_declare: z
      .object({ texte: z.string().min(5), source: Source })
      .strict()
      .nullable(),
    site_officiel: z.string().url().nullable(),
    processus_designation: ProcessusDesignation.nullable(),
    derniere_verification: DateISO,
  })
  .strict();

export type Parti = z.infer<typeof Parti>;

/* ---------------------------------------------------------------- candidats */

export const STATUTS = ['investi', 'declare', 'pressenti', 'retire'] as const;
export const Statut = z.enum(STATUTS);
export type Statut = z.infer<typeof Statut>;

export const LIBELLES_STATUT: Record<Statut, string> = {
  investi: 'Investi par son parti',
  declare: 'Candidature déclarée',
  pressenti: 'Pressenti',
  retire: 'Retiré',
};

/**
 * Portrait du candidat. Uniquement des images librement réutilisables, avec
 * leur auteur et leur licence : la même exigence que pour les propositions,
 * rien n'est publié sans sa source. Un candidat sans portrait libre garde son
 * monogramme.
 */
export const Photo = z
  .object({
    fichier: z.string().regex(/^[a-z0-9-]+\.webp$/, 'Nom de fichier attendu : identifiant.webp'),
    auteur: z.string().min(1),
    licence: z.string().min(2),
    licence_url: z.string().url().nullable(),
    /** Page du fichier sur Wikimedia Commons. */
    source_url: z.string().url(),
    description: z.string().min(5),
  })
  .strict();

export type Photo = z.infer<typeof Photo>;

export const Candidat = z
  .object({
    id: Slug,
    nom: z.string().min(2),
    prenom: z.string().min(1),
    /** null = sans étiquette ou parti non constitué. */
    parti_id: Slug.nullable(),
    photo: Photo.nullable(),
    statut: Statut,
    /** null quand la date n'a pas pu être vérifiée : l'écran l'indique. */
    statut_date: DateISO.nullable(),
    statut_source: Source.nullable(),
    parcours: z
      .array(
        z
          .object({
            annee: z.number().int().min(1900).max(2100),
            libelle: z.string().min(3),
            source: Source.nullable(),
          })
          .strict(),
      )
      .default([]),
    soutiens: z
      .array(z.object({ libelle: z.string().min(2), source: Source }).strict())
      .default([]),
    /** Faits complémentaires, obligatoirement sourcés (situation judiciaire…). */
    precisions: z
      .array(z.object({ libelle: z.string().min(10), source: Source }).strict())
      .default([]),
    liens_officiels: z
      .array(z.object({ libelle: z.string().min(2), url: z.string().url() }).strict())
      .default([]),
    derniere_verification: DateISO,
  })
  .strict();

export type Candidat = z.infer<typeof Candidat>;

/* ------------------------------------------------------------------- thèmes */

export const Theme = z
  .object({
    id: Slug,
    libelle: z.string().min(3),
    description: z.string().min(10),
  })
  .strict();

export type Theme = z.infer<typeof Theme>;

/* ------------------------------------------------------------- propositions */

/**
 * Distinction demandée par le cahier des charges : une mesure inscrite dans un
 * programme n'a pas le même statut qu'une déclaration publique.
 */
export const NATURES = ['programme_officiel', 'declaration_publique'] as const;
export const Nature = z.enum(NATURES);
export type Nature = z.infer<typeof Nature>;

export const LIBELLES_NATURE: Record<Nature, string> = {
  programme_officiel: 'Mesure de programme',
  declaration_publique: 'Déclaration publique',
};

/** Donnée chiffrée extraite de la proposition, pour un alignement factuel. */
export const Indicateur = z
  .object({
    libelle: z.string().min(2),
    valeur: z.union([z.number(), z.string()]),
    unite: z.string().nullable(),
    /**
     * Réduction numérique de la valeur affichée, pour les comparaisons
     * automatiques du test de proximité. `null` quand la réduction serait
     * trompeuse : « 2 000 euros bruts » et « 1 700 euros nets » ne se comparent
     * pas en l'état, pas plus que « 3 % par an » et « 20 % sur le quinquennat ».
     * Mieux vaut ne pas comparer que comparer de travers.
     */
    valeur_comparable: z.number().nullable().default(null),
  })
  .strict();

export type Indicateur = z.infer<typeof Indicateur>;

export const Proposition = z
  .object({
    id: Slug,
    candidat_id: Slug,
    theme_id: Slug,
    /** Formulé dans les termes du candidat, pas reformulé en jugement. */
    resume: z.string().min(10).max(260),
    detail: z.string().min(20),
    /** Verbatim court quand il éclaire la mesure. */
    citation: z.string().min(3).nullable(),
    nature: Nature,
    indicateurs: z.array(Indicateur).default([]),
    /** Obligatoire : une proposition sans source ne passe pas le build. */
    source: Source,
    derniere_verification: DateISO,
  })
  .strict();

export type Proposition = z.infer<typeof Proposition>;

/* ----------------------------------------------------- questions du test */

/**
 * Question du test de proximité.
 *
 * Une question n'est jamais inventée : elle porte sur un indicateur chiffré
 * que des candidats ont eux-mêmes énoncé. Leur position est donc déduite de
 * leurs propres déclarations, sans qu'on ait à interpréter s'ils seraient
 * « pour » ou « contre » une formulation abstraite.
 */
export const DIMENSIONS = ['economique', 'societal'] as const;
export const Dimension = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof Dimension>;

export const LIBELLES_DIMENSION: Record<Dimension, string> = {
  economique: 'Économie',
  societal: 'Société',
};

export const Question = z
  .object({
    id: Slug,
    theme_id: Slug,
    dimension: Dimension,
    intitule: z.string().min(10),
    precision: z.string().min(10).nullable(),
    /** Libellé exact de l'indicateur dont les positions sont déduites. */
    indicateur: z.string().min(2),
    unite: z.string().nullable(),
    /** Réponses proposées, de la plus basse à la plus haute. */
    options: z
      .array(z.object({ valeur: z.number(), libelle: z.string().min(1) }).strict())
      .min(2),
  })
  .strict()
  .refine(
    (q) => q.options.every((o, i) => i === 0 || o.valeur > q.options[i - 1].valeur),
    'Les options doivent être strictement croissantes',
  );

export type Question = z.infer<typeof Question>;

/* -------------------------------------------------------------- collections */

export const Partis = z.array(Parti);
export const Candidats = z.array(Candidat);
export const Themes = z.array(Theme);
export const Propositions = z.array(Proposition);
export const Questions = z.array(Question);
