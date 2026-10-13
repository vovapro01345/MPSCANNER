// MCscanner — Service Worker by Real_Studio
// Стратегия: network-first для статики, TTL-кэш для API
const VERSION = 'mcscanner-v5';
const STATIC_CACHE = `${VERSION}-static`;
const API_CACHE = `${VERSION}-api`;
const API_CACHE_TTL = 5 * 60 * 1000;

const API_HOSTS = [
  'api.mcsrvstat.us',
  'api.mcstatus.io',
  'mcapi.us'
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (API_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  if (url.origin === location.origin && event.request.method === 'GET') {
    event.respondWith(handleStaticRequest(event.request));
  }
});

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    const t = Number(cached.headers.get('x-cached-at') || 0);
    if (Date.now() - t < API_CACHE_TTL) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const body = await clone.blob();
      const headers = new Headers(clone.headers);
      headers.set('x-cached-at', String(Date.now()));
      const cachedResponse = new Response(body, {
        status: clone.status, statusText: clone.statusText, headers
      });
      cache.put(request, cachedResponse.clone());
      return response;
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function handleStaticRequest(request) {
  // Сначала сеть
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
      return response;
    }
    return response;
  } catch (err) {
    // Сеть упала — из кэша
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Офлайн', { status: 503 });
  }
}
