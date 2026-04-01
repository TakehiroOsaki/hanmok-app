// ===== sw.js: Service Worker =====
const CACHE_NAME = 'hanmok-v2';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './db.js',
  './dropbox.js',
  './csv.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/2.0.0/encoding.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Dropbox APIはキャッシュしない
  if (e.request.url.includes('dropbox')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
