/**
 * Service Worker Proxy
 * Intercepts all sub-requests (Web Workers, MediaSource buffers, API calls)
 */

const PROXY_ORIGIN = self.location.origin;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Leave direct proxy/websocket routes untouched
  if (url.origin === PROXY_ORIGIN && (url.pathname.startsWith('/proxy') || url.pathname.startsWith('/ws'))) {
    return;
  }

  // Bypass internal static files (e.g., index.html, sw.js)
  if (url.origin === PROXY_ORIGIN && (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/sw.js')) {
    return;
  }

  // Intercept and route everything else through /proxy
  const proxiedUrl = PROXY_ORIGIN + '/proxy?url=' + encodeURIComponent(request.url);

  event.respondWith(
    fetch(proxiedUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      credentials: 'omit',
      mode: 'cors'
    })
  );
});
