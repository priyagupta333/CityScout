const CACHE = 'cityscout-shell-v3';
const SHELL = ['/', '/manifest.webmanifest', '/cityscout-icon.svg', '/cityscout-192.png', '/cityscout-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && /^(cityscout|apnashehar|galli)-shell-/.test(key)).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if(request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if(request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if(response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put('/',copy))); }
      return response;
    }).catch(async () => (await caches.match('/')) || new Response('CityScout is offline. Reconnect to load your city guide.',{status:503,headers:{'Content-Type':'text/plain'}})));
    return;
  }
  if(url.pathname.startsWith('/images/') || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if(response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(request,copy))); }
      return response;
    })));
  }
});
