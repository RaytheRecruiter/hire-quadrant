// Self-destruct service worker.
//
// An earlier version of this file used a cache-first strategy that served
// stale index.html with dead asset hashes, producing whitepage errors and
// broken client-side navigation for users with the old worker installed
// (see PR #8 for context, 2026-04-23).
//
// This version takes over any existing hirequadrant SW registration, wipes
// the Cache Storage it left behind, and then unregisters itself so the
// browser falls back to the network for every request. The file must stay
// in place (returning 200) long enough for every active client to pick it
// up — removing it would 404 instead, and some browsers keep serving the
// old SW in that case.
//
// Cache deletion is scoped to the old SW's own cache name prefix
// ('hirequadrant-', from CACHE_NAME = 'hirequadrant-v1' in the pre-#8
// version — see git history) rather than every cache on the origin.
// Confirmed live 2026-10-09 (audit N20): Cache Storage is origin-scoped,
// so an unscoped caches.delete() here would also wipe out any caches a
// future unrelated feature on this origin creates, not just this SW's own.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const ownCaches = cacheNames.filter((name) => name.startsWith('hirequadrant-'));
    await Promise.all(ownCaches.map((name) => caches.delete(name)));
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'sw-self-destruct' });
    }
    await self.registration.unregister();
    for (const client of clients) {
      if ('navigate' in client) {
        try {
          await client.navigate(client.url);
        } catch {
          /* ignore */
        }
      }
    }
  })());
});

// No fetch handler — all requests go straight to the network.
