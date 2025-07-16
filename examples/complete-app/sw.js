// Berryact Service Worker
// Generated for complete app example

const CACHE_NAME = 'berryact-app-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.js',
  '/pages/Home.js',
  '/pages/Forms.js',
  '/pages/Data.js',
  '/pages/About.js'
];

// Cache strategies for different resources
const CACHE_STRATEGIES = {
  '/api/': 'network-first',      // API calls - network first, fallback to cache
  '\\.(js|css)$': 'cache-first',  // Static assets - cache first
  '\\.(png|jpg|jpeg|svg|gif)$': 'cache-first', // Images - cache first
  '/': 'network-first'            // HTML pages - network first
};

// Install event - cache precache URLs
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) return;
  
  const url = new URL(request.url);
  
  // Determine caching strategy
  let strategy = 'network-first';
  for (const [pattern, strategyName] of Object.entries(CACHE_STRATEGIES)) {
    if (new RegExp(pattern).test(url.pathname)) {
      strategy = strategyName;
      break;
    }
  }
  
  event.respondWith(
    executeStrategy(strategy, request)
  );
});

// Strategy implementations
async function executeStrategy(strategy, request) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request);
    case 'network-first':
      return networkFirst(request);
    case 'cache-only':
      return cacheOnly(request);
    case 'network-only':
      return networkOnly(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request);
    default:
      return networkFirst(request);
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    throw error;
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Cache only strategy
async function cacheOnly(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  return new Response('Not found in cache', { status: 404 });
}

// Network only strategy
async function networkOnly(request) {
  return fetch(request);
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    const cache = caches.open(CACHE_NAME);
    cache.then(c => c.put(request, response.clone()));
    return response;
  });
  
  return cached || fetchPromise;
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_ADD':
      caches.open(CACHE_NAME).then(cache => {
        cache.add(data.request);
      });
      break;
      
    case 'CACHE_DELETE':
      caches.open(CACHE_NAME).then(cache => {
        cache.delete(data.request);
      });
      break;
      
    case 'CACHE_CLEAR':
      caches.delete(data.cacheName || CACHE_NAME);
      break;
      
    case 'PREFETCH':
      prefetchUrls(data.urls);
      break;
  }
});

// Prefetch URLs
async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement your sync logic here
  console.log('[ServiceWorker] Syncing data...');
  
  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'BACKGROUND_SYNC_COMPLETE',
      data: { tag: 'sync-data' }
    });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Berryact App', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});