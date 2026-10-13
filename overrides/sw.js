const CACHE = 'vfit-pro-v49';
const ASSETS = ['./', './index.html', './accounts.css?v=23', './v49-catalog.js?v=49', './accounts.js?v=47', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './v36.js?v=36', './v37.js?v=37', './v38.js?v=38', './v39.js?v=39', './v40.js?v=40', './v41.js?v=41', './v42.js?v=42', './v43.js?v=43', './v44.js?v=44', './v45.js?v=45', './v46.js?v=46', './v47.js?v=47', './v48.js?v=48', './v49.js?v=49', './v49-compat.js?v=49', './assets/custom-exercise.svg',
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
