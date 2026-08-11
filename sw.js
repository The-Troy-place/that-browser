/**
 * Service Worker Proxy
 * Intercepts internal iframe navigation & network calls, routing them through Cloudflare Workers.
 */

// REPLACE THIS WITH YOUR CLOUDFLARE WORKER URL
const WORKER_URL = "https://your-worker-name.subdomain.workers.dev";

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass GitHub Pages UI assets
  if (url.origin === self.location.origin) {
    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/sw.js') {
      return;
    }
  }

  // Pass through direct requests to the Cloudflare Worker domain
  if (url.origin === new URL(WORKER_URL).origin) {
    return;
  }

  // Handle relative navigation paths (e.g., clicking /watch?v=... on YouTube)
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
