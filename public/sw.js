// public/sw.js

const CACHE_NAME = 'spmwork-cache-v1';
const urlsToCache = [
  '/',
  '/orders',
  '/favicon.ico',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// При установке сервис‑воркера — предзагружаем ключевые ресурсы
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// При активации — очищаем старые кэши
self.addEventListener('activate', (event) => {
  console.log('Service Worker active.');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// На каждый запрос — пробуем сеть, а при неудаче — кэш, и на навигацию при оффлайне — страницу /offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированный ответ если есть
        if (response) {
          return response;
        }

        // Иначе делаем сетевой запрос
        return fetch(event.request).then(
          response => {
            // Не кэшируем если ответ невалидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Кэшируем ответ
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
