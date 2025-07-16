/**
 * Service Worker Plugin for Berryact
 * Provides offline support, caching, and PWA features
 */

import { signal, computed, effect } from '../core/signal-enhanced.js';
import { createPlugin } from '../core/plugin.js';

// Cache strategies
export const CacheStrategy = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Service Worker states
export const WorkerState = {
  INSTALLING: 'installing',
  INSTALLED: 'installed',
  ACTIVATING: 'activating',
  ACTIVATED: 'activated',
  REDUNDANT: 'redundant',
};

export const ServiceWorkerPlugin = createPlugin({
  name: 'service-worker',
  version: '1.0.0',

  setup(app, context) {
    const options = this.options || {};
    const {
      swUrl = '/sw.js',
      scope = '/',
      updateInterval = 60 * 60 * 1000, // 1 hour
      enableOfflineAnalytics = true,
      enableBackgroundSync = true,
      enablePushNotifications = false,
      onUpdate = null,
      onOffline = null,
      onOnline = null,
    } = options;

    // State
    const registration = signal(null);
    const workerState = signal(null);
    const isOnline = signal(navigator.onLine);
    const isUpdateAvailable = signal(false);
    const syncTags = signal([]);
    const cachedRequests = signal([]);

    // Computed states
    const isRegistered = computed(() => registration.value !== null);
    const isReady = computed(() => workerState.value === WorkerState.ACTIVATED);
    const hasOfflineSupport = computed(() => isRegistered.value && !isOnline.value);

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[ServiceWorker] Not supported in this browser');
      return;
    }

    // Register service worker
    async function register() {
      try {
        const reg = await navigator.serviceWorker.register(swUrl, { scope });
        registration.value = reg;

        console.log('[ServiceWorker] Registered successfully');

        // Set up update checking
        setupUpdateChecking(reg);

        // Set up message handling
        setupMessageHandling();

        // Check for updates immediately
        checkForUpdates();

        return reg;
      } catch (error) {
        console.error('[ServiceWorker] Registration failed:', error);
        throw error;
      }
    }

    // Unregister service worker
    async function unregister() {
      const reg = registration.value;
      if (!reg) return;

      try {
        await reg.unregister();
        registration.value = null;
        workerState.value = null;
        console.log('[ServiceWorker] Unregistered successfully');
      } catch (error) {
        console.error('[ServiceWorker] Unregistration failed:', error);
        throw error;
      }
    }

    // Check for updates
    async function checkForUpdates() {
      const reg = registration.value;
      if (!reg) return;

      try {
        await reg.update();
      } catch (error) {
        console.error('[ServiceWorker] Update check failed:', error);
      }
    }

    // Skip waiting and activate new worker
    function skipWaiting() {
      const reg = registration.value;
      if (!reg || !reg.waiting) return;

      // Send skip waiting message
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Set up update checking
    function setupUpdateChecking(reg) {
      // Listen for state changes
      const trackState = (worker) => {
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          workerState.value = worker.state;

          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            isUpdateAvailable.value = true;

            if (onUpdate) {
              onUpdate({
                skipWaiting: () => skipWaiting(),
              });
            }
          }
        });
      };

      // Track all workers
      trackState(reg.installing);
      trackState(reg.waiting);
      trackState(reg.active);

      // Listen for new installations
      reg.addEventListener('updatefound', () => {
        trackState(reg.installing);
      });

      // Periodic update checks
      if (updateInterval > 0) {
        setInterval(() => checkForUpdates(), updateInterval);
      }
    }

    // Set up message handling
    function setupMessageHandling() {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;

        switch (type) {
          case 'CACHE_UPDATED':
            console.log('[ServiceWorker] Cache updated:', data);
            break;

          case 'OFFLINE_READY':
            console.log('[ServiceWorker] Offline ready');
            break;

          case 'BACKGROUND_SYNC_COMPLETE':
            console.log('[ServiceWorker] Background sync complete:', data);
            syncTags.value = syncTags.value.filter((tag) => tag !== data.tag);
            break;
        }
      });
    }

    // Send message to service worker
    function sendMessage(message) {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;

      controller.postMessage(message);
    }

    // Cache management
    const cache = {
      async add(request, response) {
        sendMessage({
          type: 'CACHE_ADD',
          request: request.url || request,
          response: response,
        });
      },

      async delete(request) {
        sendMessage({
          type: 'CACHE_DELETE',
          request: request.url || request,
        });
      },

      async clear(cacheName) {
        sendMessage({
          type: 'CACHE_CLEAR',
          cacheName,
        });
      },

      async match(request) {
        const cache = await caches.open('berryact-cache-v1');
        return cache.match(request);
      },
    };

    // Background sync
    const sync = {
      async register(tag, options = {}) {
        const reg = registration.value;
        if (!reg || !enableBackgroundSync) return;

        try {
          await reg.sync.register(tag);
          syncTags.value = [...syncTags.value, tag];
          console.log('[ServiceWorker] Sync registered:', tag);
        } catch (error) {
          console.error('[ServiceWorker] Sync registration failed:', error);

          // Fallback: store for later
          cachedRequests.value = [
            ...cachedRequests.value,
            {
              tag,
              options,
              timestamp: Date.now(),
            },
          ];
        }
      },

      async getTags() {
        const reg = registration.value;
        if (!reg || !reg.sync) return [];

        return reg.sync.getTags();
      },
    };

    // Push notifications
    const push = {
      async subscribe(options = {}) {
        if (!enablePushNotifications) return;

        const reg = registration.value;
        if (!reg) throw new Error('Service worker not registered');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: options.vapidKey,
        });

        return subscription;
      },

      async unsubscribe() {
        const reg = registration.value;
        if (!reg) return;

        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      },

      async getSubscription() {
        const reg = registration.value;
        if (!reg) return null;

        return reg.pushManager.getSubscription();
      },
    };

    // Network status handling
    function handleOnline() {
      isOnline.value = true;

      if (onOnline) {
        onOnline();
      }

      // Process cached requests
      processCachedRequests();
    }

    function handleOffline() {
      isOnline.value = false;

      if (onOffline) {
        onOffline();
      }
    }

    // Process cached requests when back online
    async function processCachedRequests() {
      const requests = cachedRequests.value;
      if (requests.length === 0) return;

      for (const request of requests) {
        try {
          await sync.register(request.tag, request.options);
        } catch (error) {
          console.error('[ServiceWorker] Failed to process cached request:', error);
        }
      }

      // Clear processed requests
      cachedRequests.value = [];
    }

    // Set up network listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Prefetch resources
    async function prefetch(urls) {
      sendMessage({
        type: 'PREFETCH',
        urls: Array.isArray(urls) ? urls : [urls],
      });
    }

    // Get cache statistics
    async function getCacheStats() {
      const cacheNames = await caches.keys();
      const stats = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();

        stats[name] = {
          count: requests.length,
          urls: requests.map((r) => r.url),
        };
      }

      return stats;
    }

    // Service Worker API
    const sw = {
      // State
      registration,
      workerState,
      isOnline,
      isUpdateAvailable,
      isRegistered,
      isReady,
      hasOfflineSupport,

      // Methods
      register,
      unregister,
      checkForUpdates,
      skipWaiting,
      sendMessage,
      prefetch,
      getCacheStats,

      // Sub-APIs
      cache,
      sync,
      push,
    };

    // Auto-register on app mount
    this.registerAppHook('mounted', () => {
      register().catch((error) => {
        console.error('[ServiceWorker] Auto-registration failed:', error);
      });
    });

    // Cleanup on unmount
    this.registerAppHook('unmounted', () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });

    // Provide API
    this.provide('serviceWorker', sw);

    // Global access
    app.serviceWorker = sw;
  },
});

// Service Worker script generator
export function generateServiceWorker(config = {}) {
  const {
    cacheName = 'berryact-cache-v1',
    precacheUrls = [],
    cacheStrategies = {},
    skipWaiting = true,
    clientsClaim = true,
  } = config;

  return `
// Berryact Service Worker
// Generated on ${new Date().toISOString()}

const CACHE_NAME = '${cacheName}';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};

// Install event
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  ${skipWaiting ? 'self.skipWaiting();' : ''}
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => console.log('[ServiceWorker] Precache complete'))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  ${clientsClaim ? 'clients.claim();' : ''}
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Determine strategy
  const strategy = getStrategyForUrl(url.pathname);
  
  event.respondWith(
    executeStrategy(strategy, request)
  );
});

// Message event
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

// Sync event
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync:', event.tag);
  
  event.waitUntil(
    handleBackgroundSync(event.tag)
  );
});

// Push event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Berryact App', {
      body: data.body || 'New update available',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      data: data.data
    })
  );
});

// Helper functions
function getStrategyForUrl(pathname) {
  const strategies = ${JSON.stringify(cacheStrategies)};
  
  for (const [pattern, strategy] of Object.entries(strategies)) {
    if (new RegExp(pattern).test(pathname)) {
      return strategy;
    }
  }
  
  return 'network-first';
}

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

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheOnly(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return new Response('Not found in cache', { status: 404 });
}

async function networkOnly(request) {
  return fetch(request);
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    const cache = caches.open(CACHE_NAME);
    cache.then(c => c.put(request, response.clone()));
    return response;
  });
  
  return cached || fetchPromise;
}

async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

async function handleBackgroundSync(tag) {
  // Implement your sync logic here
  console.log('[ServiceWorker] Handling sync:', tag);
  
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'BACKGROUND_SYNC_COMPLETE',
      data: { tag }
    });
  });
}
`;
}
