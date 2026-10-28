// Kyoto Void Service Worker // Offline Cache & Instant PWA Warmup
const CACHE_NAME = 'kyoto-void-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/secret-pathways-assets/three.min.js',
  '/secret-pathways-assets/fonts.css',
  '/secret-pathways-assets/foreground/png/temple-wall.webp',
  '/secret-pathways-assets/foreground/png/pine-tree.webp',
  '/secret-pathways-assets/foreground/png/tall-grass.webp',
  '/secret-pathways-assets/foreground/png/maple-leaves.webp',
  '/secret-pathways-assets/foreground/png/basalt-stones.webp',
  '/secret-pathways-assets/foreground/png/stone-lantern.webp',
  '/secret-pathways-assets/foreground/png/sakura-branch.webp',
  '/secret-pathways-assets/foreground/png/garden-bush.webp',
  '/secret-pathways-assets/foreground/png/hill.webp',
  '/secret-pathways-assets/foreground/png/shrine-ruins.webp',
  '/secret-pathways-assets/generated/kage-sanmon-preview.webp',
  '/secret-pathways-assets/generated/kage-approach.webp',
  '/secret-pathways-assets/generated/kage-lantern-court.webp',
  '/secret-pathways-assets/generated/kage-moonwater.webp',
  '/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => cached);
    })
  );
});
