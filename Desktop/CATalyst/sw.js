// CATalyst Service Worker
// Increment CACHE_VERSION on every deploy to bust stale caches.
const CACHE_VERSION = 'v1';
const CACHE_NAME    = `catalyst-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE = [
  '/',
  '/css/style.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/practice.js',
  '/js/test.js',
  '/js/errorlog.js',
  '/js/onboarding.js',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// ── Install: pre-cache all static assets ──────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for same-origin, network-only for external ──
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always go to network for: Supabase, KaTeX CDN, external APIs
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for same-origin static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // Not in cache — fetch and cache it
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
