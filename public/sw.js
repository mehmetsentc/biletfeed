/* BiletFeed organizer scanner — offline shell cache */
const CACHE = 'bf-scanner-v1';
const SHELL = ['/organizator-panel/tarayici', '/organizator-panel/baslangic'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  if (SHELL.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r || caches.match('/organizator-panel/tarayici'))
      )
    );
  }
});
