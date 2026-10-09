/*
 * Service worker : rend l'application consultable hors ligne après une
 * première visite.
 *
 * Stratégie volontairement prudente :
 *   - les actifs versionnés (/_next/static/) sont immuables → cache d'abord ;
 *   - les pages et les données passent par le réseau d'abord, le cache ne
 *     servant que de secours. Une mise à jour en ligne gagne donc toujours,
 *     et on ne risque pas de servir indéfiniment des données périmées.
 *
 * Seules les pages déjà visitées sont disponibles hors ligne.
 */

const VERSION = 'v1';
const CACHE = `presidentielle-2027-${VERSION}`;
const BASE = new URL('./', self.registration.scope).pathname;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function mettreEnCache(requete, reponse) {
  if (!reponse || !reponse.ok || reponse.type !== 'basic') return reponse;
  const copie = reponse.clone();
  caches.open(CACHE).then((cache) => cache.put(requete, copie));
  return reponse;
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/_next/static/')) {
    evenement.respondWith(
      caches
        .match(requete)
        .then((enCache) => enCache || fetch(requete).then((r) => mettreEnCache(requete, r))),
    );
    return;
  }

  evenement.respondWith(
    fetch(requete)
      .then((r) => mettreEnCache(requete, r))
      .catch(() =>
        caches
          .match(requete)
          .then((enCache) => enCache || caches.match(BASE) || caches.match(`${BASE}index.html`)),
      ),
  );
});
