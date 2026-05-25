// CATalyst Service Worker
const CACHE_VERSION = 'v4';
const CACHE_NAME    = `catalyst-${CACHE_VERSION}`;

const PRECACHE = [
  '/',
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

// ── Install: pre-cache JS and static assets ────────────────────
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

// ── Fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always network for external (Supabase, CDN, fonts)
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first for HTML and CSS — always get fresh styles/markup
  // Falls back to cache only when offline
  if (url.pathname.endsWith('.css') || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for JS and other static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});

// ── Push: show notification ────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}

  const title   = data.title || 'CATalyst ⚡';
  const options = {
    body:    data.body  || 'Your mistakes are waiting.',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    data:    { url: data.url || 'https://catalyst-app-six.vercel.app/' },
    vibrate: [100, 50, 100],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: open / focus the app ──────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url || 'https://catalyst-app-six.vercel.app/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If app is already open, focus it and navigate to the target URL
      for (const client of windowClients) {
        if (client.url.startsWith('https://catalyst-app-six.vercel.app') && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(target);
    })
  );
});
