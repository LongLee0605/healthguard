const CACHE_NAME = 'healthguard-v5';
const SHELL_ASSETS = ['/', '/manifest.json', '/icon.svg', '/icon.png', '/icon-192.png', '/icon-512.png', '/logo.svg', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        SHELL_ASSETS.map((url) => cache.add(url).catch(() => undefined)),
      );
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api') || url.hostname.includes('localhost:3001')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) return response;
          return fetch('/').catch(() => caches.match('/') || caches.match('/offline.html'));
        })
        .catch(() => caches.match('/') || caches.match('/offline.html')),
    );
    return;
  }

  if (url.pathname.match(/\.(png|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && url.protocol.startsWith('http')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          }
          return response;
        });
      }),
    );
  }
});
