/**
 * Service Worker Proxy
 */

const WORKER_URL = "https://sandbox-browser-proxy.the-troy-place.workers.dev";

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Allow static UI assets to load normally
  if (url.origin === self.location.origin) {
    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/404.html' || url.pathname === '/sw.js') {
      return;
    }
  }

  // Pass direct calls to the Cloudflare Worker straight through
  if (url.origin === new URL(WORKER_URL).origin) {
    return;
  }

  // Reconstruct target URL for relative paths using the referrer header
  let targetUrl = request.url;
  if (url.origin === self.location.origin && request.referrer) {
    try {
      const refUrl = new URL(request.referrer);
      const actualTarget = refUrl.searchParams.get('url');
      if (actualTarget) {
        targetUrl = new URL(url.pathname + url.search, new URL(actualTarget).origin).href;
      }
    } catch (e) {}
  }

  const proxiedUrl = WORKER_URL + '/proxy?url=' + encodeURIComponent(targetUrl);

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
