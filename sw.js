// ===== sw.js: Service Worker =====
const CACHE_NAME = 'hanmok-v3';
const ASSETS = [
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
  const url = new URL(e.request.url);

  // Dropbox APIはキャッシュしない（常にネットワーク）
  if (url.hostname.includes('dropbox')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // sw.js自体はキャッシュしない（常にネットワーク）
  if (url.pathname.endsWith('sw.js')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // JS・HTMLファイルは常にネットワーク優先（キャッシュは更新失敗時のフォールバック）
  if (url.pathname.match(/\.(js|html)$/)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // その他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
