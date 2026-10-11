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
  DocumentsProgramme,
  Partis,
  Propositions,
  Themes,
  HOTES_PAYANTS,
  hoteDe,
  type Source,
} from '../lib/schemas.ts';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHEMIN_EMPREINTES = join(racine, 'veille', 'empreintes.json');
const CHEMIN_ARTICLES = join(racine, 'veille', 'articles-vus.json');

/**
 * Fils d'actualité des rédactions librement accessibles.
 *
 * La veille des sources citées ne voyait pas les événements : le 11 octobre
 * 2026, Raphaël Glucksmann a remporté la primaire du pôle socialiste et le site
 * a continué d'afficher cinq candidatures déclarées, parce qu'aucune page citée
 * n'avait changé. Un résultat d'élection n'est pas une modification de source,
 * c'est une information nouvelle - et elle passe par les fils.
 *
 * LCP n'expose pas de flux : ses articles sont trouvés par la recherche, pas
 * par cette veille.
 */
const FLUX = [
  { nom: 'franceinfo - politique', url: 'https://www.franceinfo.fr/politique.rss' },
  { nom: 'franceinfo - présidentielle', url: 'https://www.franceinfo.fr/elections/presidentielle.rss' },
  { nom: 'Public Sénat', url: 'https://www.publicsenat.fr/feed' },
];

/**
 * Titres qui annoncent un changement d'état, et non un commentaire.
 *
 * Ce sont ceux qui rendent le site faux sans rien y toucher : une investiture,
 * un retrait, un résultat, la parution d'un programme. Ils sont signalés à
 * part, parce qu'ils demandent une correction et pas seulement une lecture.
 */
const MOTS_EVENEMENT =
  /\b(investi|investiture|d[ée]sign[ée]|remporte|vainqueur|[ée]limin[ée]|se retire|retire sa candidature|renonce|jette l'[ée]ponge|annonce sa candidature|se d[ée]clare|candidat[e]? [àa] l'[ée]lection|r[ée]sultats?|d[ée]voile (?:son|ses)|pr[ée]sente (?:son|ses)|programme|parrainages?|exclu[e]? (?:du|de)|quitte (?:le|les))\b/i;

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
const documents = lire(DocumentsProgramme, 'documents.json');

/* ---------------------------------------------------------------- empreintes */

type Empreinte = { hachage: string; caracteres: number; vu: string };
type Empreintes = Record<string, Empreinte>;

const empreintesConnues: Empreintes = existsSync(CHEMIN_EMPREINTES)
  ? JSON.parse(readFileSync(CHEMIN_EMPREINTES, 'utf8'))
  : {};
const empreintesObservees: Empreintes = {};

/** URL des articles déjà passés dans un rapport, pour ne les signaler qu'une fois. */
const premierPassage = !existsSync(CHEMIN_ARTICLES);
const articlesVus: Record<string, string> = premierPassage
  ? {}
  : JSON.parse(readFileSync(CHEMIN_ARTICLES, 'utf8'));

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

/**
 * Interroge un fichier sans le télécharger. Les documents de programme pèsent
 * jusqu'à 37 Mo : les rapatrier deux fois par jour serait inutile et impoli
 * envers des sites de campagne. Une requête HEAD suffit à savoir si le fichier
 * est toujours là, et s'il a changé de taille.
 */
type Fichier = { statut: number; octets: number | null; signature: string | null };

async function interroger(url: string): Promise<Fichier | { statut: number; erreur: string }> {
  const entetes = {
    'user-agent': 'presidentielle-2027-veille (+https://github.com/Romain03/presidentielle-2027)',
    accept: 'application/pdf',
  };
  try {
    let reponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: entetes,
      signal: AbortSignal.timeout(20_000),
    });
    // Tous les hébergeurs n'acceptent pas HEAD. On demande alors le premier
    // octet : la réponse porte les mêmes en-têtes pour un coût équivalent.
    if (reponse.status === 405 || reponse.status === 501) {
      reponse = await fetch(url, {
        redirect: 'follow',
        headers: { ...entetes, range: 'bytes=0-0' },
        signal: AbortSignal.timeout(20_000),
      });
    }
    if (!reponse.ok && reponse.status !== 206) {
      return { statut: reponse.status, erreur: reponse.statusText || 'réponse non OK' };
    }
    const brut = reponse.headers.get('content-range')?.split('/')[1]
      ?? reponse.headers.get('content-length');
    const octets = brut !== null && brut !== undefined && /^\d+$/.test(brut) ? Number(brut) : null;
    return {
      statut: reponse.status,
      octets,
      signature: reponse.headers.get('etag') ?? reponse.headers.get('last-modified'),
    };
  } catch (cause) {
    return { statut: 0, erreur: cause instanceof Error ? cause.message : String(cause) };
  }
}

/* ------------------------------------------------------------- fils d'actualité */

type Article = { titre: string; url: string; date: string; flux: string };

/** Décode les entités XML d'un titre : les fils les échappent deux fois. */
function detexter(brut: string): string {
  return brut
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function champ(bloc: string, nom: string): string {
  const m = bloc.match(new RegExp(`<${nom}[^>]*>([\\s\\S]*?)</${nom}>`, 'i'));
  return m ? detexter(m[1]) : '';
}

async function lireFlux(flux: { nom: string; url: string }): Promise<Article[]> {
  const reponse = await recuperer(flux.url);
  if ('erreur' in reponse) return [];
  const blocs = reponse.html.split(/<(?:item|entry)[\s>]/i).slice(1);
  const articles: Article[] = [];
  for (const bloc of blocs) {
    const titre = champ(bloc, 'title');
    // Atom met l'adresse dans un attribut, RSS dans un élément.
    const lien =
      champ(bloc, 'link') ||
      (bloc.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '');
    if (!titre || !lien) continue;
    articles.push({
      titre,
      // Les fils ajoutent un marqueur de provenance (?xtor=, #xtor=) : sans le
      // retirer, la même adresse serait signalée à chaque changement de marqueur.
      url: lien.split(/[?#]/)[0],
      date: (champ(bloc, 'pubDate') || champ(bloc, 'updated') || champ(bloc, 'published')).slice(0, 25),
      flux: flux.nom,
    });
  }
  return articles;
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

/**
 * Patronymes des candidatures recensées, et libellés des partis engagés.
 * Un titre qui n'en contient aucun ne concerne pas ce site.
 */
const NOMS_SUIVIS = [
  ...new Set([
    ...candidats.map((c) => c.nom),
    ...partis.filter((p) => candidats.some((c) => c.parti_id === p.id)).map((p) => p.sigle),
  ]),
].filter((n) => n.length >= 4);

function concerneLeSite(titre: string): string | null {
  return NOMS_SUIVIS.find((nom) => new RegExp(`\\b${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(titre)) ?? null;
}

const evenements: string[] = [];
const actualites: string[] = [];
const liensMorts: string[] = [];
const pagesModifiees: string[] = [];
const pagesNouvelles: string[] = [];
const programmesDecouverts: string[] = [];
const documentsAbsents: string[] = [];
const documentsRemplaces: string[] = [];
const documentsNonControlables: string[] = [];

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

  // 3. Fils d'actualité : un événement a-t-il eu lieu ?
  for (const flux of FLUX) {
    for (const article of await lireFlux(flux)) {
      if (articlesVus[article.url]) continue;
      const nom = concerneLeSite(article.titre);
      if (nom === null) continue;
      articlesVus[article.url] = new Date().toISOString().slice(0, 10);
      const ligne = `**${nom}** — ${article.titre}\n  ${article.flux} · ${article.date} · ${article.url}`;
      // Au premier passage, les fils contiennent des semaines d'archives :
      // tout signaler noierait le rapport. Seuls les changements d'état le sont.
      if (MOTS_EVENEMENT.test(article.titre)) evenements.push(ligne);
      else if (!premierPassage) actualites.push(ligne);
    }
  }

  // 4. Sites officiels : une page de programme est-elle apparue ?
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

  // 5. Documents de programme : le fichier est-il toujours là, et le même ?
  //
  // Un PDF vit à une adresse stable et peut être remplacé sans que rien ne
  // l'indique : une « v2 » publiée sous le même nom, et le nombre de pages
  // affiché ici devient faux. La taille annoncée par l'hébergeur est comparée
  // au poids relevé à la main dans /data, ce qui attrape les deux cas - le
  // fichier remplacé, et le chiffre erroné de notre côté.
  for (const document of documents) {
    const reponse = await interroger(document.url);
    if ('erreur' in reponse) {
      // Un 403 ne veut pas dire que le fichier a disparu : plusieurs
      // hébergeurs refusent toute requête automatique alors que le même
      // fichier s'ouvre sans difficulté dans un navigateur. Le signaler comme
      // lien mort serait faux - mais le passer sous silence laisserait croire
      // que le document est surveillé alors qu'il ne l'est pas. Il change donc
      // de colonne au lieu de disparaître.
      if ([401, 403, 429].includes(reponse.statut)) {
        documentsNonControlables.push(
          `${document.id} — l'hébergeur refuse la requête automatique (${reponse.statut}),`
            + ` à vérifier à la main\n  ${document.url}`,
        );
      } else {
        documentsAbsents.push(
          `${document.id} → ${reponse.statut || 'injoignable'} ${reponse.erreur}\n  ${document.url}`,
        );
      }
      continue;
    }
    if (reponse.octets === null) continue;
    const attendus = document.poids_ko * 1024;
    // Une tolérance de 2 %, parce que le poids est arrondi au kilo-octet et que
    // certains hébergeurs recompressent à la volée.
    const ecart = Math.abs(reponse.octets - attendus) / attendus;
    if (ecart > 0.02) {
      const observes = Math.round(reponse.octets / 1024);
      documentsRemplaces.push(
        `${document.id} — ${observes} ko en ligne, ${document.poids_ko} ko dans les données`
          + ` (écart de ${Math.round(ecart * 100)} %)\n  ${document.url}`,
      );
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
    evenements.length +
    liensMorts.length +
    pagesModifiees.length +
    programmesDecouverts.length +
    documentsAbsents.length +
    documentsRemplaces.length +
    payantesSeules.length;

  const rapport = [
    `# Veille des sources — ${aujourdhui.toISOString().slice(0, 10)}`,
    '',
    horsLigne
      ? '_Exécution hors ligne : seuls les contrôles sur les données ont été faits._'
      : `_${sourcesUniques.size} sources citées et ${documents.length} documents de programme contrôlés._`,
    '',
    '## Ce qui demande une action',
    '',
    bloc(
      'Changements d’état annoncés dans la presse',
      evenements,
      'Aucune investiture, aucun retrait, aucun résultat annoncé depuis la dernière veille.',
    ),
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
      'Documents de programme injoignables',
      documentsAbsents,
      'Les documents de programme répondent tous.',
    ),
    bloc(
      'Documents de programme dont la taille a changé',
      documentsRemplaces,
      'Aucun document n’a été remplacé sous son adresse.',
    ),
    bloc(
      'Propositions sans aucune source en accès libre',
      payantesSeules.map((p) => p.id),
      'Aucune : la règle sur les articles payants est tenue.',
    ),
    '## Ce qui attend du travail',
    '',
    bloc(
      'Documents de programme que la veille ne peut pas contrôler',
      documentsNonControlables,
      'Tous les documents listés sont contrôlables automatiquement.',
    ),
    bloc(
      'Autres articles mentionnant une candidature suivie',
      actualites.slice(0, 25),
      premierPassage
        ? 'Premier passage : les archives des fils ne sont pas listées.'
        : 'Aucun.',
    ),
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

    // Les articles sont oubliés au bout de 120 jours : la mémoire sert à ne pas
    // signaler deux fois, pas à archiver la campagne.
    const limite = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
    const recents = Object.fromEntries(
      Object.entries(articlesVus)
        .filter(([, vu]) => vu >= limite)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    writeFileSync(CHEMIN_ARTICLES, `${JSON.stringify(recents, null, 2)}\n`);
    console.error(
      `\nEmpreintes : ${Object.keys(triees).length} · articles mémorisés : ${Object.keys(recents).length}`,
    );
  }

  /*
    Deux signaux distincts, sur la sortie d'erreur pour ne pas polluer le
    rapport :

    - `evenements` compte les changements d'état annoncés dans la presse. Le
      workflow s'en sert pour n'appeler un modèle que les jours où il y a
      vraiment quelque chose à vérifier. Sans ce compteur, la vérification
      tournerait deux fois par jour pour conclure « rien à faire », et serait
      facturée pour ça.
    - `a_agir` couvre tout ce qui demande une lecture, événements compris.
  */
  console.error(`evenements=${evenements.length}`);
  console.error(`a_agir=${aAgir}`);

  // Code de sortie non nul quand quelque chose demande une action : le
  // workflow s'en sert pour ouvrir un ticket plutôt que passer inaperçu.
  process.exitCode = aAgir > 0 ? 1 : 0;
}

await principal();
