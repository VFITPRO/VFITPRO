const CACHE = 'vfit-pro-v28';
const ASSETS = ['./', './index.html', './accounts.css?v=23', './accounts.js?v=28', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './assets/custom-exercise.svg',
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
