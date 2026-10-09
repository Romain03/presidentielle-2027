/**
 * Rapport de validation lisible des quatre fichiers de /data.
 *
 *   npm run valider
 *
 * La construction du site valide déjà les données (lib/data.ts lève à
 * l'import). Ce script sert à obtenir une liste d'erreurs complète et
 * compréhensible pendant la mise à jour des données, plutôt que la première
 * erreur rencontrée.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Candidats, Partis, Propositions, Themes } from '../lib/schemas.ts';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const erreurs: string[] = [];
const avertissements: string[] = [];

function lire(fichier: string): unknown {
  return JSON.parse(readFileSync(join(racine, 'data', fichier), 'utf8'));
}

function valider<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: any } },
  fichier: string,
): T[] {
  const resultat = schema.safeParse(lire(fichier));
  if (!resultat.success) {
    for (const probleme of resultat.error.issues) {
      erreurs.push(`${fichier} → ${probleme.path.join('.') || '(racine)'} : ${probleme.message}`);
    }
    return [];
  }
  return resultat.data as T[];
}

const partis = valider<any>(Partis, 'partis.json');
const candidats = valider<any>(Candidats, 'candidats.json');
const themes = valider<any>(Themes, 'themes.json');
const propositions = valider<any>(Propositions, 'propositions.json');

/* --------------------------------------------------- intégrité référentielle */

const idsPartis = new Set(partis.map((p) => p.id));
const idsCandidats = new Set(candidats.map((c) => c.id));
const idsThemes = new Set(themes.map((t) => t.id));

for (const c of candidats) {
  if (c.parti_id !== null && !idsPartis.has(c.parti_id)) {
    erreurs.push(`candidats.json → ${c.id} : parti inconnu « ${c.parti_id} »`);
  }
}
for (const p of propositions) {
  if (!idsCandidats.has(p.candidat_id)) {
    erreurs.push(`propositions.json → ${p.id} : candidat inconnu « ${p.candidat_id} »`);
  }
  if (!idsThemes.has(p.theme_id)) {
    erreurs.push(`propositions.json → ${p.id} : thème inconnu « ${p.theme_id} »`);
  }
  if (p.source.date > p.derniere_verification) {
    erreurs.push(
      `propositions.json → ${p.id} : source du ${p.source.date} postérieure à la vérification du ${p.derniere_verification}`,
    );
  }
}

/* ----------------------------------------------- avertissements de couverture */

const aujourdhui = new Date().toISOString().slice(0, 10);
const ilYaSixMois = new Date(Date.now() - 182 * 86_400_000).toISOString().slice(0, 10);

for (const p of propositions) {
  if (p.derniere_verification < ilYaSixMois) {
    avertissements.push(
      `propositions.json → ${p.id} : non revérifiée depuis le ${p.derniere_verification}`,
    );
  }
  if (p.derniere_verification > aujourdhui) {
    erreurs.push(`propositions.json → ${p.id} : date de vérification dans le futur`);
  }
}

for (const c of candidats) {
  const nombre = propositions.filter((p) => p.candidat_id === c.id).length;
  if (nombre === 0) {
    avertissements.push(
      `candidats.json → ${c.id} : aucune proposition sourcée (masqué par le filtre par défaut)`,
    );
  }
  if (c.statut_date === null) {
    avertissements.push(`candidats.json → ${c.id} : date de statut non vérifiée`);
  }
}

for (const t of themes) {
  const nombre = new Set(
    propositions.filter((p) => p.theme_id === t.id).map((p) => p.candidat_id),
  ).size;
  if (nombre === 0) avertissements.push(`themes.json → ${t.id} : aucun candidat ne s'est exprimé`);
}

/* ------------------------------------------------------------------- rapport */

const couverture = candidats.length * themes.length;
const renseignees = new Set(propositions.map((p) => `${p.candidat_id}|${p.theme_id}`)).size;

console.log('');
console.log(`  ${partis.length} partis · ${candidats.length} candidats · ${themes.length} thèmes · ${propositions.length} propositions`);
console.log(
  `  Couverture : ${renseignees}/${couverture} couples candidat × thème renseignés (${Math.round((renseignees / couverture) * 100)} %)`,
);
console.log('');

if (avertissements.length > 0) {
  console.log(`  ${avertissements.length} avertissement(s) - données incomplètes, pas invalides :`);
  for (const a of avertissements) console.log(`    · ${a}`);
  console.log('');
}

if (erreurs.length > 0) {
  console.error(`  ${erreurs.length} erreur(s) bloquante(s) :`);
  for (const e of erreurs) console.error(`    ✗ ${e}`);
  console.error('');
  process.exit(1);
}

console.log('  ✓ Données valides.');
console.log('');
