const CACHE = 'vfit-pro-v40';
const ASSETS = ['./', './index.html', './accounts.css?v=23', './accounts.js?v=40', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './v36.js?v=36', './v37.js?v=37', './v38.js?v=38', './v39.js?v=39', './v40.js?v=40', './assets/custom-exercise.svg',
  './vendor/supabase-2.57.4.js', './assets/home-hero-v15.jpg',
  './manifest.webmanifest', './icon-premium-192.png', './icon-premium-512.png'];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('vfit-pro-') && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
  // Do not reload an active workout or interrupt pending user changes.
})()));
self.addEventListener('fetch', event => {
  // Never cache auth tokens, Supabase responses or other external requests.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(async response => {
      if (response.ok) await (await caches.open(CACHE)).put('./index.html', response.clone());
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(async response => {
    if (response.ok) await (await caches.open(CACHE)).put(event.request, response.clone());
    return response;
  })));
});
