/**
 * Veille automatique sur les sources du site.
 *
 *   npm run veille            # rapport complet, avec appels réseau
 *   npm run veille -- --hors-ligne
 *   npm run veille -- --ecrire   # enregistre les empreintes observées
 *
 * Ce script ne publie rien et ne modifie aucune donnée de /data. Il prépare le
 * travail : il dit ce qui a changé, ce qui est mort, ce qui a vieilli et ce
 * qu'il reste à sourcer. La décision d'écrire une proposition suppose d'avoir
 * lu l'article, et cela ne s'automatise pas sans renoncer à ce qui fait la
 * valeur du site.
 *
 * Trois choses que lui seul peut voir :
 *
 *   1. Un lien mort. Une source qui ne répond plus n'est plus vérifiable par le
 *      lecteur, et le site cesse alors de tenir sa promesse sans rien afficher.
 *   2. Une page vivante qui a changé. Les pages de programme n'ont pas de date
 *      de publication : elles sont réécrites sous une citation qui, elle, ne
 *      bouge pas. C'est le risque le plus sournois de ce jeu de données.
 *   3. Une page de programme qui apparaît. C'est l'événement que le site
 *      attend : le jour où un candidat publie son programme, ses propositions
 *      doivent cesser de passer par une rédaction.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  Candidats,
  Partis,
  Propositions,
  Themes,
  HOTES_PAYANTS,
  hoteDe,
  type Source,
} from '../lib/schemas.ts';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHEMIN_EMPREINTES = join(racine, 'veille', 'empreintes.json');

const horsLigne = process.argv.includes('--hors-ligne');
const ecrire = process.argv.includes('--ecrire');

/** Au-delà, une proposition mérite d'être revérifiée. */
const JOURS_AVANT_PEREMPTION = 45;

/** Types de source qui désignent une page vivante, réécrite sans préavis. */
const TYPES_PAGE_VIVANTE = ['programme-officiel', 'site-de-campagne', 'site-de-parti'];

/** Segments d'URL qui trahissent une page de programme. */
const INDICES_PROGRAMME =
  /programme|projet|priorites|propositions|mesures|nos-idees|le-projet|plateforme/i;

/**
 * Faux positifs récurrents. Sans ce tri, la veille remonte chaque semaine le
 * programme de la Fête de l'Humanité, une feuille de style nommée
 * « styleprogramme.css » et les plateformes des scrutins passés.
 */
const FAUX_POSITIFS =
  /fete-de-l|legislatives|europeennes|\/actualites?\/|\/non-classe\/|\/evenements/i;

/** Extensions qui ne sont pas des pages. Le PDF, lui, peut être un programme. */
const PAS_UNE_PAGE = /\.(css|js|mjs|json|xml|rss|jpe?g|png|gif|svg|webp|ico|woff2?|ttf|zip)$/i;

/**
 * Une année antérieure à la campagne en cours dans l'adresse : c'est le
 * programme d'un scrutin passé, pas celui de 2027.
 */
function millesimePerime(url: string): boolean {
  return [...url.matchAll(/(?:^|[^\d])(19\d{2}|20[0-2]\d)(?:[^\d]|$)/g)].some(
    (m) => Number(m[1]) < 2026,
  );
}

/** Une adresse vaut d'être signalée comme page de programme possible. */
function candidateProgramme(url: string): boolean {
  return (
    INDICES_PROGRAMME.test(url) &&
    !FAUX_POSITIFS.test(url) &&
    !PAS_UNE_PAGE.test(url) &&
    !millesimePerime(url)
  );
}

/** Même page, écrite avec ou sans barre oblique finale. */
function normaliser(url: string): string {
  return url.replace(/\/+$/, '');
}

/* ------------------------------------------------------------------ données */

function lire<T>(schema: { parse: (v: unknown) => T }, fichier: string): T {
  return schema.parse(JSON.parse(readFileSync(join(racine, 'data', fichier), 'utf8')));
}

const candidats = lire(Candidats, 'candidats.json');
const partis = lire(Partis, 'partis.json');
const propositions = lire(Propositions, 'propositions.json');
const themes = lire(Themes, 'themes.json');

/* ---------------------------------------------------------------- empreintes */

type Empreinte = { hachage: string; caracteres: number; vu: string };
type Empreintes = Record<string, Empreinte>;

const empreintesConnues: Empreintes = existsSync(CHEMIN_EMPREINTES)
  ? JSON.parse(readFileSync(CHEMIN_EMPREINTES, 'utf8'))
  : {};
const empreintesObservees: Empreintes = {};

/**
 * Empreinte du texte d'une page, et non de son HTML : les attributs, les
 * scripts et les identifiants de cache changent à chaque déploiement sans que
 * le contenu bouge, et feraient sonner l'alarme en permanence.
 */
async function empreinteDe(html: string): Promise<Empreinte> {
  const texte = html
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const octets = new TextEncoder().encode(texte);
  const condense = await crypto.subtle.digest('SHA-256', octets);
  return {
    hachage: [...new Uint8Array(condense)].map((o) => o.toString(16).padStart(2, '0')).join(''),
    caracteres: texte.length,
    vu: new Date().toISOString().slice(0, 10),
  };
}

/* -------------------------------------------------------------------- réseau */

type Reponse = { statut: number; html: string } | { statut: number; erreur: string };

async function recuperer(url: string): Promise<Reponse> {
  try {
    const reponse = await fetch(url, {
      redirect: 'follow',
      headers: {
        // Un agent identifiable : un site qui ne veut pas de cette veille doit
        // pouvoir la refuser, et savoir qui frappe à sa porte.
        'user-agent': 'presidentielle-2027-veille (+https://github.com/Romain03/presidentielle-2027)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!reponse.ok) return { statut: reponse.status, erreur: reponse.statusText || 'réponse non OK' };
    return { statut: reponse.status, html: await reponse.text() };
  } catch (cause) {
    return { statut: 0, erreur: cause instanceof Error ? cause.message : String(cause) };
  }
}

/* ------------------------------------------------------------- contrôles secs */

const aujourdhui = new Date();
function joursDepuis(date: string): number {
  return Math.floor((aujourdhui.getTime() - new Date(date).getTime()) / 86_400_000);
}

const perimees = propositions
  .map((p) => ({ id: p.id, jours: joursDepuis(p.derniere_verification) }))
  .filter((p) => p.jours > JOURS_AVANT_PEREMPTION)
  .sort((a, b) => b.jours - a.jours);

const sourceUnique = propositions.filter((p) => p.sources.length === 1);

const payantesSeules = propositions.filter(
  (p) => !p.sources.some((s) => !HOTES_PAYANTS.includes(hoteDe(s.url))),
);

const idsAvecProposition = new Set(propositions.map((p) => p.candidat_id));
const engagesSansProposition = candidats
  .filter((c) => (c.statut === 'investi' || c.statut === 'declare') && !idsAvecProposition.has(c.id))
  .map((c) => `${c.prenom} ${c.nom}`);

const themesVides = themes
  .filter((t) => !propositions.some((p) => p.theme_id === t.id))
  .map((t) => t.libelle);

/**
 * Une adresse de programme déjà connue mais qu'aucune proposition ne cite :
 * la source primaire est à portée de main et le site s'en passe encore.
 */
const urlsCitees = new Set(propositions.flatMap((p) => p.sources.map((s) => s.url)));
const programmesNonExploites = candidats
  .flatMap((c) =>
    c.liens_officiels
      .filter((l) => candidateProgramme(l.url) && !urlsCitees.has(l.url))
      .map((l) => `${c.prenom} ${c.nom} - ${l.libelle} : ${l.url}`),
  )
  .sort();

/* ----------------------------------------------------------- contrôles réseau */

const liensMorts: string[] = [];
const pagesModifiees: string[] = [];
const pagesNouvelles: string[] = [];
const programmesDecouverts: string[] = [];

/**
 * Déduplication globale, et non par site : melenchon2027.fr est atteint à la
 * fois comme site de parti et comme lien officiel du candidat, et ses pages de
 * programme apparaissaient deux fois dans le rapport.
 */
const dejaSignalees = new Set<string>();

/** Toutes les sources citées, dédoublonnées, avec leur type le plus primaire. */
const sourcesUniques = new Map<string, Source>();
for (const proposition of propositions) {
  for (const source of proposition.sources) sourcesUniques.set(source.url, source);
}
for (const candidat of candidats) {
  for (const source of candidat.statut_sources) sourcesUniques.set(source.url, source);
}

async function surveiller(): Promise<void> {
  // 1. Liens morts, sur l'ensemble des sources citées.
  for (const [url] of sourcesUniques) {
    const reponse = await recuperer(url);
    if ('erreur' in reponse) {
      // Les hôtes payants et les murs anti-robot répondent 401/403 à une
      // requête automatique sans que l'article ait disparu : ce n'est pas un
      // lien mort, et le signaler chaque semaine noierait les vrais.
      const refusAttendu = [401, 403, 429].includes(reponse.statut);
      if (!refusAttendu) liensMorts.push(`${url} → ${reponse.statut || 'injoignable'} ${reponse.erreur}`);
    }
  }

  // 2. Pages vivantes citées : le texte sous la citation a-t-il changé ?
  const pagesVivantes = [...sourcesUniques.values()].filter((s) =>
    TYPES_PAGE_VIVANTE.includes(s.type),
  );
  for (const source of pagesVivantes) {
    const reponse = await recuperer(source.url);
    if ('erreur' in reponse) continue;
    const observee = await empreinteDe(reponse.html);
    empreintesObservees[source.url] = observee;
    const connue = empreintesConnues[source.url];
    if (!connue) {
      pagesNouvelles.push(`${source.url} (${observee.caracteres} caractères)`);
    } else if (connue.hachage !== observee.hachage) {
      const delta = observee.caracteres - connue.caracteres;
      pagesModifiees.push(
        `${source.url} — vue le ${connue.vu}, ${delta >= 0 ? '+' : ''}${delta} caractères`,
      );
    }
  }

  // 3. Sites officiels : une page de programme est-elle apparue ?
  const sitesOfficiels = [
    ...partis.flatMap((p) => (p.site_officiel ? [p.site_officiel] : [])),
    ...candidats.flatMap((c) => c.liens_officiels.map((l) => l.url)),
  ];
  for (const site of [...new Set(sitesOfficiels)]) {
    const reponse = await recuperer(site);
    if ('erreur' in reponse) continue;
    const liens = [...reponse.html.matchAll(/href="([^"#?]+)"/gi)]
      .map((m) => m[1])
      .map((h) => {
        try {
          return normaliser(new URL(h, site).toString());
        } catch {
          return null;
        }
      })
      .filter((u): u is string => u !== null && candidateProgramme(u) && !urlsCitees.has(u));
    for (const lien of [...new Set(liens)]) {
      if (dejaSignalees.has(lien)) continue;
      dejaSignalees.add(lien);
      if (!empreintesConnues[lien]) programmesDecouverts.push(`${hoteDe(site)} → ${lien}`);
      empreintesObservees[lien] = empreintesObservees[lien] ?? {
        hachage: 'decouvert',
        caracteres: 0,
        vu: new Date().toISOString().slice(0, 10),
      };
    }
  }
}

/* ------------------------------------------------------------------- rapport */

function bloc(titre: string, lignes: string[], vide: string): string {
  if (lignes.length === 0) return `### ${titre}\n\n${vide}\n`;
  return `### ${titre}\n\n${lignes.map((l) => `- ${l}`).join('\n')}\n`;
}

async function principal(): Promise<void> {
  if (!horsLigne) await surveiller();

  const aAgir =
    liensMorts.length +
    pagesModifiees.length +
    programmesDecouverts.length +
    payantesSeules.length;

  const rapport = [
    `# Veille des sources — ${aujourdhui.toISOString().slice(0, 10)}`,
    '',
    horsLigne
      ? '_Exécution hors ligne : seuls les contrôles sur les données ont été faits._'
      : `_${sourcesUniques.size} sources citées contrôlées._`,
    '',
    '## Ce qui demande une action',
    '',
    bloc(
      'Pages de programme apparues',
      programmesDecouverts,
      'Aucune nouvelle page de programme détectée.',
    ),
    bloc(
      'Pages vivantes modifiées sous une citation',
      pagesModifiees,
      'Aucune page citée n’a changé depuis la dernière veille.',
    ),
    bloc('Liens morts', liensMorts, 'Toutes les sources joignables répondent.'),
    bloc(
      'Propositions sans aucune source en accès libre',
      payantesSeules.map((p) => p.id),
      'Aucune : la règle sur les articles payants est tenue.',
    ),
    '## Ce qui attend du travail',
    '',
    bloc(
      'Programmes connus mais non exploités',
      programmesNonExploites,
      'Aucune adresse de programme connue n’est laissée de côté.',
    ),
    bloc(
      `Propositions non vérifiées depuis plus de ${JOURS_AVANT_PEREMPTION} jours`,
      perimees.map((p) => `${p.id} (${p.jours} jours)`),
      'Toutes les propositions ont été vérifiées récemment.',
    ),
    bloc(
      'Propositions à source unique',
      [`${sourceUnique.length} sur ${propositions.length}`],
      '',
    ),
    bloc(
      'Candidatures engagées sans aucune proposition',
      engagesSansProposition,
      'Toutes les candidatures engagées portent au moins une proposition.',
    ),
    bloc('Thèmes sans aucune position', themesVides, 'Tous les thèmes sont couverts.'),
    '## Pages nouvellement surveillées',
    '',
    bloc('Premières empreintes', pagesNouvelles, 'Aucune.'),
  ].join('\n');

  console.log(rapport);

  if (ecrire && !horsLigne) {
    mkdirSync(dirname(CHEMIN_EMPREINTES), { recursive: true });
    const fusion = { ...empreintesConnues, ...empreintesObservees };
    const triees = Object.fromEntries(Object.entries(fusion).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(CHEMIN_EMPREINTES, `${JSON.stringify(triees, null, 2)}\n`);
    console.error(`\nEmpreintes enregistrées : ${Object.keys(triees).length}`);
  }

  // Code de sortie non nul quand quelque chose demande une action : le
  // workflow s'en sert pour ouvrir un ticket plutôt que passer inaperçu.
  process.exitCode = aAgir > 0 ? 1 : 0;
}

await principal();
