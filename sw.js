/**
 * Service Worker Proxy
 * Intercepts page navigations and asset requests.
 */

const PROXY_ORIGIN = self.location.origin;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass host UI & root files
  if (url.origin === PROXY_ORIGIN) {
    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/sw.js') {
      return;
    }
    // Already formatted proxy requests
    if (url.pathname.startsWith('/proxy') || url.pathname.startsWith('/ws')) {
      return;
    }
  }

  // Handle relative navigation routes (e.g. /watch?v=... on youtube)
  // Reconstruct target URL using referrer header if available
  let targetUrl = request.url;
  if (url.origin === PROXY_ORIGIN && request.referrer) {
    try {
      const refUrl = new URL(request.referrer);
      const actualTarget = refUrl.searchParams.get('url');
      if (actualTarget) {
        targetUrl = new URL(url.pathname + url.search, new URL(actualTarget).origin).href;
      }
    } catch (e) {}
  }

  const proxiedUrl = PROXY_ORIGIN + '/proxy?url=' + encodeURIComponent(targetUrl);

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
