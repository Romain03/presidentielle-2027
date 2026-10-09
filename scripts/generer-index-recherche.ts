/**
 * Écrit public/recherche-index.json avant la construction du site.
 *
 * Sans cela, l'index complet était sérialisé dans chacune des pages, parce que
 * l'en-tête - donc la recherche - est rendu partout. Chaque page pesait une
 * centaine de kilo-octets de données redondantes. L'index est désormais un
 * fichier unique, chargé seulement quand le lecteur ouvre la recherche.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { construireIndex } from '../lib/recherche.ts';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (fichier: string) =>
  JSON.parse(readFileSync(join(racine, 'data', fichier), 'utf8'));

const index = construireIndex(
  lire('candidats.json'),
  lire('partis.json'),
  lire('themes.json'),
  lire('propositions.json'),
);

const destination = join(racine, 'public', 'recherche-index.json');
writeFileSync(destination, JSON.stringify(index));

const poids = Math.round(readFileSync(destination).byteLength / 1024);
console.log(`  Index de recherche : ${index.length} entrées, ${poids} Ko`);
