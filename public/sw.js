// public/sw.js

const VERSION = 'v4';
const STATIC_CACHE = `static-${VERSION}`;
const API_CACHE    = `api-${VERSION}`;
const IMG_CACHE    = `images-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/orders',
  '/offline',            // React-маршрут Offline
  '/favicon.ico',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Ограничения
const MAX_ITEMS = {
  [STATIC_CACHE]: 100,
  [API_CACHE]:    50,
  [IMG_CACHE]:    100
};

const API_MAX_AGE   = 5 * 60 * 1000;
const IMG_MAX_AGE   = 7 * 24 * 60 * 60 * 1000;

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![STATIC_CACHE, API_CACHE, IMG_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  const { request } = evt;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    evt.respondWith(navigateHandler(request));
  } else if (/\.(js|css|woff2?|ttf|eot)$/.test(url.pathname)) {
    evt.respondWith(cacheFirst(request, STATIC_CACHE, MAX_ITEMS[STATIC_CACHE]));
  } else if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(url.pathname)) {
    evt.respondWith(imageHandler(request));
  } else if (url.pathname.startsWith('/api/')) {
    evt.respondWith(networkFirst(request, API_CACHE, MAX_ITEMS[API_CACHE], API_MAX_AGE));
  } else {
    evt.respondWith(cacheFirst(request, STATIC_CACHE, MAX_ITEMS[STATIC_CACHE]));
  }
});

async function navigateHandler(req) {
  try {
    const resp = await fetch(req);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(req, resp.clone());
    return resp;
  } catch {
    const cached = await caches.match(req);
    return cached || await caches.match('/offline');
  }
}

async function cacheFirst(req, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      cache.put(req, resp.clone());
      trimCache(cacheName, maxItems);
    }
    return resp;
  } catch {
    return new Response(null, { status: 504 });
  }
}

async function networkFirst(req, cacheName, maxItems, maxAge) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      cache.put(req, resp.clone());
      trimCache(cacheName, maxItems);
      return resp;
    }
  } catch {}
  const cached = await cache.match(req);
  if (cached && isFresh(cached, maxAge)) {
    return cached;
  }
  return new Response(JSON.stringify({ error: 'Offline' }), {
    status: 503, headers: { 'Content-Type': 'application/json' }
  });
}

async function imageHandler(req) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(req);
  if (cached && isFresh(cached, IMG_MAX_AGE)) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      cache.put(req, resp.clone());
      trimCache(IMG_CACHE, MAX_ITEMS[IMG_CACHE]);
    }
    return resp;
  } catch {
    return cached || new Response(null, { status: 504 });
  }
}

function isFresh(response, maxAge) {
  const date = response.headers.get('date');
  if (!date) return false;
  return (new Date(date).getTime() + maxAge) > Date.now();
}

async function trimCache(name, maxItems) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
  }
}
