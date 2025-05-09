// public/sw.js

// Здесь можно добавить логику кеширования и фоновых задач PWA
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});
self.addEventListener('activate', (event) => {
  console.log('Service Worker active.');
});
