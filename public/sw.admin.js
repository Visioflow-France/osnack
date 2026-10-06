/* Service worker du dashboard admin O'Snack.
 * Scope : /admin/ (nécessite l'en-tête Service-Worker-Allowed, cf. next.config.mjs).
 * Stratégie :
 *  - Navigations (page /admin) : network-first avec fallback offline.
 *  - Assets statiques (JS/CSS/fonts/icônes Next) : stale-while-revalidate.
 *  - Données Firebase / API : jamais mises en cache (toujours réseau).
 */
const VERSION = 'admin-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

const OFFLINE_URL = '/admin-pwa/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/admin-pwa/manifest.json',
  '/admin-pwa/icon-192.png',
  '/admin-pwa/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/admin-pwa/') ||
    /\.(?:css|js|png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Hors origine (Firebase, Google APIs, images distantes…) : réseau uniquement.
  if (url.origin !== self.location.origin) return;

  // Navigations : network-first, fallback cache puis page offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Assets statiques : stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const refresh = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || refresh;
      })
    );
  }
});
