// Lazy loading and code splitting for Berryact router

export class LazyComponent {
  constructor(importFn, options = {}) {
    this.importFn = importFn;
    this.loading = options.loading || (() => 'Loading...');
    this.error = options.error || ((error) => `Error: ${error.message}`);
    this.delay = options.delay || 200;
    this.timeout = options.timeout || 10000;

    this.state = 'pending'; // pending, loading, loaded, error
    this.component = null;
    this.errorInfo = null;
    this.loadPromise = null;
  }

  async load() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  async performLoad() {
    try {
      this.state = 'loading';

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), this.timeout);
      });

      const loadPromise = this.importFn();
      const module = await Promise.race([loadPromise, timeoutPromise]);

      this.component = module.default || module;
      this.state = 'loaded';

      return this.component;
    } catch (error) {
      this.state = 'error';
      this.errorInfo = error;
      throw error;
    }
  }

  render(props = {}) {
    switch (this.state) {
      case 'pending':
        // Start loading after delay
        setTimeout(() => {
          if (this.state === 'pending') {
            this.load().catch(() => {}); // Ignore errors here, handled in render
          }
        }, this.delay);
        return this.loading();

      case 'loading':
        return this.loading();

      case 'loaded':
        return this.component(props);

      case 'error':
        return this.error(this.errorInfo);

      default:
        return this.loading();
    }
  }
}

export function defineLazyComponent(importFn, options) {
  return new LazyComponent(importFn, options);
}

// Preloading utilities
export class ComponentPreloader {
  constructor() {
    this.preloadCache = new Map();
    this.loadingPromises = new Map();
  }

  async preload(routePath, importFn) {
    if (this.preloadCache.has(routePath)) {
      return this.preloadCache.get(routePath);
    }

    if (this.loadingPromises.has(routePath)) {
      return this.loadingPromises.get(routePath);
    }

    const loadPromise = importFn()
      .then((module) => {
        const component = module.default || module;
        this.preloadCache.set(routePath, component);
        this.loadingPromises.delete(routePath);
        return component;
      })
      .catch((error) => {
        this.loadingPromises.delete(routePath);
        throw error;
      });

    this.loadingPromises.set(routePath, loadPromise);
    return loadPromise;
  }

  getPreloaded(routePath) {
    return this.preloadCache.get(routePath);
  }

  preloadOnHover(element, routePath, importFn) {
    let timeoutId = null;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preload(routePath, importFn).catch(() => {
          // Silent fail for preloading
        });
      }, 100); // Small delay to avoid preloading on quick hovers
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  preloadOnVisible(element, routePath, importFn) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preload(routePath, importFn).catch(() => {
              // Silent fail for preloading
            });
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }

  clear() {
    this.preloadCache.clear();
    this.loadingPromises.clear();
  }
}

export const componentPreloader = new ComponentPreloader();

// Bundle analyzer for code splitting insights
export class BundleAnalyzer {
  constructor() {
    this.chunks = new Map();
    this.loadTimes = new Map();
    this.enabled =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  }

  trackChunkLoad(chunkName, startTime, endTime, size) {
    if (!this.enabled) return;

    const loadTime = endTime - startTime;

    if (!this.chunks.has(chunkName)) {
      this.chunks.set(chunkName, {
        name: chunkName,
        size: size,
        loadTimes: [],
        averageLoadTime: 0,
        loadCount: 0,
      });
    }

    const chunk = this.chunks.get(chunkName);
    chunk.loadTimes.push(loadTime);
    chunk.loadCount++;
    chunk.averageLoadTime = chunk.loadTimes.reduce((a, b) => a + b, 0) / chunk.loadTimes.length;

    // Keep only last 10 load times
    if (chunk.loadTimes.length > 10) {
      chunk.loadTimes.shift();
    }
  }

  getChunkStats() {
    return Array.from(this.chunks.values()).map((chunk) => ({
      name: chunk.name,
      size: chunk.size,
      averageLoadTime: Math.round(chunk.averageLoadTime),
      loadCount: chunk.loadCount,
      lastLoadTime: chunk.loadTimes[chunk.loadTimes.length - 1] || 0,
    }));
  }

  getSlowestChunks(limit = 5) {
    return this.getChunkStats()
      .sort((a, b) => b.averageLoadTime - a.averageLoadTime)
      .slice(0, limit);
  }

  getLargestChunks(limit = 5) {
    return this.getChunkStats()
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  printReport() {
    if (!this.enabled) return;

    console.group('📦 Bundle Analysis Report');

    console.log('📊 Chunk Statistics:');
    this.getChunkStats().forEach((chunk) => {
      console.log(`  ${chunk.name}: ${chunk.size}B, ~${chunk.averageLoadTime}ms avg`);
    });

    console.log('\n🐌 Slowest Chunks:');
    this.getSlowestChunks().forEach((chunk, i) => {
      console.log(`  ${i + 1}. ${chunk.name}: ${chunk.averageLoadTime}ms`);
    });

    console.log('\n📦 Largest Chunks:');
    this.getLargestChunks().forEach((chunk, i) => {
      console.log(`  ${i + 1}. ${chunk.name}: ${chunk.size}B`);
    });

    console.groupEnd();
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Enhanced lazy route definition
export function createLazyRoute(path, importFn, options = {}) {
  const lazyComponent = defineLazyComponent(importFn, {
    loading: options.loading,
    error: options.error,
    delay: options.delay,
    timeout: options.timeout,
  });

  return {
    path,
    component: lazyComponent,
    meta: {
      ...options.meta,
      lazy: true,
      chunkName: options.chunkName || path.replace(/[^a-zA-Z0-9]/g, '_'),
    },
    beforeEnter: async (to, from, next) => {
      const startTime = performance.now();

      try {
        await lazyComponent.load();
        const endTime = performance.now();

        bundleAnalyzer.trackChunkLoad(
          to.meta.chunkName,
          startTime,
          endTime,
          options.estimatedSize || 0
        );

        if (options.beforeEnter) {
          return options.beforeEnter(to, from, next);
        }

        next();
      } catch (error) {
        console.error(`Failed to load route ${path}:`, error);
        next(false);
      }
    },
  };
}

// Route prefetching strategies
export class RoutePrefetcher {
  constructor(router) {
    this.router = router;
    this.strategies = new Set();
    this.prefetched = new Set();
  }

  addStrategy(strategy) {
    this.strategies.add(strategy);
    strategy.init(this.router, this);
  }

  removeStrategy(strategy) {
    this.strategies.delete(strategy);
    if (strategy.cleanup) {
      strategy.cleanup();
    }
  }

  async prefetch(routePath) {
    if (this.prefetched.has(routePath)) {
      return;
    }

    const route = this.router.matchRoute(routePath);
    if (route && route.meta?.lazy) {
      try {
        await componentPreloader.preload(routePath, route.component.importFn);
        this.prefetched.add(routePath);
      } catch (error) {
        console.warn(`Failed to prefetch route ${routePath}:`, error);
      }
    }
  }

  clear() {
    this.prefetched.clear();
  }
}

// Prefetching strategies
export class HoverPrefetchStrategy {
  init(router, prefetcher) {
    this.router = router;
    this.prefetcher = prefetcher;
    this.cleanup = this.setupHoverListeners();
  }

  setupHoverListeners() {
    const handleMouseOver = (event) => {
      const link = event.target.closest('a[href]');
      if (link && this.isInternalLink(link.href)) {
        const path = new URL(link.href, window.location.origin).pathname;
        this.prefetcher.prefetch(path);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }

  isInternalLink(href) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}

export class ViewportPrefetchStrategy {
  init(router, prefetcher) {
    this.router = router;
    this.prefetcher = prefetcher;
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      rootMargin: '200px',
    });

    this.observeLinks();
    this.cleanup = () => this.observer.disconnect();
  }

  observeLinks() {
    document.querySelectorAll('a[href]').forEach((link) => {
      if (this.isInternalLink(link.href)) {
        this.observer.observe(link);
      }
    });
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const link = entry.target;
        const path = new URL(link.href, window.location.origin).pathname;
        this.prefetcher.prefetch(path);
        this.observer.unobserve(link);
      }
    });
  }

  isInternalLink(href) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}

export class IdlePrefetchStrategy {
  init(router, prefetcher) {
    this.router = router;
    this.prefetcher = prefetcher;
    this.prefetchQueue = [];
    this.isIdle = false;

    this.setupIdleCallback();
  }

  setupIdleCallback() {
    const scheduleIdlePrefetch = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(this.handleIdle.bind(this), { timeout: 1000 });
      } else {
        setTimeout(this.handleIdle.bind(this), 100);
      }
    };

    // Collect all lazy routes for prefetching
    this.router.routes.forEach((route) => {
      if (route.meta?.lazy) {
        this.prefetchQueue.push(route.path);
      }
    });

    scheduleIdlePrefetch();
  }

  handleIdle(deadline) {
    this.isIdle = true;

    while (this.prefetchQueue.length > 0 && (!deadline || deadline.timeRemaining() > 0)) {
      const routePath = this.prefetchQueue.shift();
      this.prefetcher.prefetch(routePath);
    }

    if (this.prefetchQueue.length > 0) {
      this.setupIdleCallback();
    }
  }
}
