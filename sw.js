const CACHE_NAME = 'hanmok-v9';
const ASSETS = ['./index.html','./app.js','./db.js','./dropbox.js','./csv.js','./manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/2.0.0/encoding.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('dropbox')) {
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503})));
    return;
  }
  if (url.pathname.endsWith('sw.js')) { e.respondWith(fetch(e.request)); return; }
  if (url.pathname.match(/\.(js|html)$/)) {
    e.respondWith(fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
