// Minimal Service Worker to satisfy registration and cache basic assets
const CACHE_NAME = 'sandbox-proxy-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch requests directly by default
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
