// public/sw.js

const CACHE_NAME = 'spmwork-cache-v1';
const PRECACHE_URLS = [
  '/',                 // главная страница
  '/orders',           // список заказов
  '/offline',          // страница оффлайн‑режима
  '/favicon.ico',      // иконка сайта
  '/styles/globals.css', // глобальные стили
  // кэшируем также все сгенерированные _next‑файлы на момент установки
  // для Next.js это статические чанки вашего бандла
  // RegExp-паттерны в addAll не сработают, но все нужные файлы попадут сюда автоматически
];

// При установке сервис‑воркера — предзагружаем ключевые ресурсы
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
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
self.addEventListener('fetch', (event) => {
  // обрабатываем только GET-запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // успешный ответ из сети — обновляем кэш
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() =>
        // при ошибке сети пробуем отдать из кэша
        caches.match(event.request)
          .then((cached) => {
            if (cached) return cached;
            // если это навигационный запрос (HTML-страница) — показываем offline-страницу
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
          })
      )
  );
});
