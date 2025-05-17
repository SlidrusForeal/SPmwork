// public/sw.js

const CACHE_NAME = 'spmwork-cache-v3';
const STATIC_CACHE = 'spmwork-static-v3';
const API_CACHE = 'spmwork-api-v3';
const IMAGE_CACHE = 'spmwork-images-v3';

const PRECACHE_URLS = [
  '/',
  '/orders',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/css/main.css',
  '/js/app.js'
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache size limits
const CACHE_LIMITS = {
  [STATIC_CACHE]: 100,
  [API_CACHE]: 50,
  [IMAGE_CACHE]: 100
};

// Utility: Check if response is still valid
function isResponseValid(response, maxAge) {
  if (!response || !response.headers) {
    return false;
  }
  const dateHeader = response.headers.get('date');
  if (!dateHeader) {
    return false;
  }
  const date = new Date(dateHeader).getTime();
  return date + maxAge > Date.now();
}

// Utility: limit cache size
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    console.log(`[SW] Trimming cache ${cacheName}, current size: ${keys.length}`);
    const itemsToDelete = keys.length - maxEntries;
    const oldKeys = keys.slice(0, itemsToDelete);
    await Promise.all(oldKeys.map(key => cache.delete(key)));
  }
}

// Install: pre-cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing new service worker version');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_URLS);
      }),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ])
    .then(() => self.skipWaiting())
    .catch(error => {
      console.error('[SW] Pre-cache error:', error);
      // Continue installation even if pre-cache fails
      return self.skipWaiting();
    })
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating new service worker version');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(key)) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      ))
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch: routing and caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different request types
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Request handlers
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('[SW] Navigation fetch failed:', error);
  }

  // Fallback to cache or offline page
  const cached = await caches.match(request);
  return cached || caches.match('/offline.html');
}

async function handleStaticAsset(request) {
  // Try cache first
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    // Fallback to network
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
      await trimCache(STATIC_CACHE, CACHE_LIMITS[STATIC_CACHE]);
      return response;
    }
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
  }

  return new Response('Not found', { status: 404 });
}

async function handleImageRequest(request) {
  // Try cache first
  const cached = await caches.match(request);
  if (cached && isResponseValid(cached, IMAGE_CACHE_DURATION)) {
    return cached;
  }

  try {
    // Fallback to network
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      await cache.put(request, response.clone());
      await trimCache(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE]);
      return response;
    }
  } catch (error) {
    console.log('[SW] Image fetch failed:', error);
  }

  return cached || new Response('Not found', { status: 404 });
}

async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, response.clone());
      await trimCache(API_CACHE, CACHE_LIMITS[API_CACHE]);
      return response;
    }
  } catch (error) {
    console.log('[SW] API fetch failed:', error);
  }

  // Fallback to cache if it's not too old
  const cached = await caches.match(request);
  if (cached && isResponseValid(cached, API_CACHE_DURATION)) {
    return cached;
  }

  return new Response(
    JSON.stringify({ error: 'Network error', offline: true }),
    { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function handleOtherRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Other request fetch failed:', error);
    return new Response('Not found', { status: 404 });
  }
}

// Helper functions
function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot)$/.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpe?g|gif|svg|webp|ico)$/.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Background sync for failed POST requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    const failedPosts = requests.filter(request => 
      request.method === 'POST' && 
      request.url.includes('/api/orders')
    );

    await Promise.all(failedPosts.map(async request => {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[SW] Failed to sync order:', error);
      }
    }));
  } catch (error) {
    console.error('[SW] Order sync failed:', error);
  }
}

// Periodic cache cleanup
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  try {
    const cacheNames = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
    await Promise.all(cacheNames.map(async cacheName => {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      const deletionPromises = requests.map(async request => {
        const response = await cache.match(request);
        if (!isResponseValid(response, 
          cacheName === IMAGE_CACHE ? IMAGE_CACHE_DURATION : API_CACHE_DURATION
        )) {
          await cache.delete(request);
        }
      });

      await Promise.all(deletionPromises);
      await trimCache(cacheName, CACHE_LIMITS[cacheName]);
    }));
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}
