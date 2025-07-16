/**
 * Suspense implementation for handling async components and data fetching
 */

import { signal, effect, computed } from './signal-enhanced.js';
import { createContext, useContext } from './hooks.js';
import { html } from '../template/parser.js';

// Suspense context
const SuspenseContext = createContext(null);

// Resource states
const ResourceState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Global resource cache
const resourceCache = new Map();
const suspenseRegistry = new WeakMap();

/**
 * Creates a resource for suspense
 * @param {Function} fetcher - Async function that fetches data
 * @param {*} key - Unique key for caching
 */
export function createResource(fetcher, key = null) {
  const cacheKey = key || fetcher.toString();

  // Check cache first
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey);
  }

  const resource = {
    state: signal(ResourceState.PENDING),
    data: signal(null),
    error: signal(null),
    promise: null,
    fetcher,
    key: cacheKey,
    version: 0,
  };

  // Start fetching immediately
  refresh();

  function refresh() {
    resource.version++;
    resource.state.value = ResourceState.PENDING;
    resource.error.value = null;

    resource.promise = Promise.resolve(fetcher())
      .then((data) => {
        resource.data.value = data;
        resource.state.value = ResourceState.SUCCESS;
        return data;
      })
      .catch((error) => {
        resource.error.value = error;
        resource.state.value = ResourceState.ERROR;
        throw error;
      });

    return resource.promise;
  }

  // Resource API
  const resourceAPI = {
    read() {
      const suspense = useContext(SuspenseContext);

      switch (resource.state.value) {
        case ResourceState.PENDING:
          if (suspense) {
            suspense.register(resource);
          }
          throw resource.promise;

        case ResourceState.ERROR:
          throw resource.error.value;

        case ResourceState.SUCCESS:
          return resource.data.value;
      }
    },

    // Get value without suspending
    peek() {
      return resource.data.value;
    },

    // Get current state
    getState() {
      return resource.state.value;
    },

    // Check if loading
    isLoading() {
      return resource.state.value === ResourceState.PENDING;
    },

    // Check if errored
    isError() {
      return resource.state.value === ResourceState.ERROR;
    },

    // Get error if any
    getError() {
      return resource.error.value;
    },

    // Refresh the resource
    refresh,

    // Mutate the data
    mutate(data) {
      resource.data.value = data;
      resource.state.value = ResourceState.SUCCESS;
      resource.error.value = null;
    },

    // Subscribe to changes
    subscribe(callback) {
      return effect(() => {
        callback({
          state: resource.state.value,
          data: resource.data.value,
          error: resource.error.value,
        });
      });
    },

    // Clear from cache
    clear() {
      resourceCache.delete(cacheKey);
    },
  };

  // Cache the resource
  resourceCache.set(cacheKey, resourceAPI);

  return resourceAPI;
}

/**
 * Suspense component
 * @param root0
 * @param root0.fallback
 * @param root0.children
 * @param root0.onError
 */
export function Suspense({ fallback, children, onError }) {
  const suspendedResources = signal(new Set());
  const hasError = signal(false);
  const error = signal(null);

  // Suspense state
  const suspenseState = {
    register(resource) {
      suspendedResources.value = new Set([...suspendedResources.value, resource]);
    },

    unregister(resource) {
      const newSet = new Set(suspendedResources.value);
      newSet.delete(resource);
      suspendedResources.value = newSet;
    },

    reset() {
      suspendedResources.value = new Set();
      hasError.value = false;
      error.value = null;
    },
  };

  // Check if all resources are ready
  const isReady = computed(() => {
    if (hasError.value) return false;

    for (const resource of suspendedResources.value) {
      if (resource.state.value === ResourceState.PENDING) {
        return false;
      }
    }

    return true;
  });

  // Watch for resource changes
  effect(() => {
    for (const resource of suspendedResources.value) {
      if (resource.state.value === ResourceState.ERROR) {
        hasError.value = true;
        error.value = resource.error.value;

        if (onError) {
          onError(resource.error.value);
        }
      }
    }
  });

  // Create error boundary
  function ErrorBoundary({ error, resetError }) {
    return html`
      <div class="berryact-error-boundary">
        <h2>Something went wrong</h2>
        <p>${error.message || 'An unexpected error occurred'}</p>
        <button @click=${resetError}>Try again</button>
      </div>
    `;
  }

  // Render function
  return () => {
    if (hasError.value) {
      return ErrorBoundary({
        error: error.value,
        resetError: () => suspenseState.reset(),
      });
    }

    if (!isReady.value) {
      return fallback || html`<div class="berryact-loading">Loading...</div>`;
    }

    // Provide suspense context
    return html`
      <${SuspenseContext.Provider} value=${suspenseState}>
        ${children}
      </${SuspenseContext.Provider}>
    `;
  };
}

/**
 * Hook to use a resource with suspense
 * @param fetcher
 * @param deps
 */
export function useResource(fetcher, deps = []) {
  const [resource, setResource] = useState(null);

  useEffect(() => {
    const newResource = createResource(fetcher);
    setResource(newResource);

    return () => {
      newResource.clear();
    };
  }, deps);

  return resource;
}

/**
 * Hook to create a deferred value
 * @param value
 * @param options
 */
export function useDeferredValue(value, options = {}) {
  const { delay = 0 } = options;
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return deferredValue;
}

/**
 * Hook for transition state
 */
export function useTransition() {
  const [isPending, setIsPending] = useState(false);

  const startTransition = (callback) => {
    setIsPending(true);

    // Use microtask to ensure state updates are batched
    Promise.resolve().then(() => {
      callback();
      setIsPending(false);
    });
  };

  return [isPending, startTransition];
}

/**
 * Lazy loading helper
 * @param importFn
 */
export function lazy(importFn) {
  let Component = null;
  let promise = null;
  let error = null;

  return function LazyComponent(props) {
    if (error) {
      throw error;
    }

    if (Component) {
      return Component(props);
    }

    if (!promise) {
      promise = importFn()
        .then((module) => {
          Component = module.default || module;
        })
        .catch((err) => {
          error = err;
          throw err;
        });
    }

    throw promise;
  };
}

/**
 * Preload a lazy component
 * @param lazyComponent
 */
export function preload(lazyComponent) {
  // Trigger the import by calling the component
  try {
    lazyComponent({});
  } catch (promise) {
    if (promise instanceof Promise) {
      return promise;
    }
  }
  return Promise.resolve();
}

/**
 * Create a suspense-enabled data fetcher
 * @param fetchFn
 * @param options
 */
export function createFetcher(fetchFn, options = {}) {
  const {
    cache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retries = 3,
    retryDelay = 1000,
    onSuccess = null,
    onError = null,
  } = options;

  const cacheMap = new Map();

  return function fetcher(...args) {
    const key = JSON.stringify(args);

    // Check cache
    if (cache && cacheMap.has(key)) {
      const cached = cacheMap.get(key);
      if (Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }
    }

    // Create fetcher with retry logic
    const fetchWithRetry = async (attempt = 0) => {
      try {
        const data = await fetchFn(...args);

        // Cache result
        if (cache) {
          cacheMap.set(key, {
            data,
            timestamp: Date.now(),
          });
        }

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          return fetchWithRetry(attempt + 1);
        }

        if (onError) {
          onError(error);
        }

        throw error;
      }
    };

    return createResource(() => fetchWithRetry(), key);
  };
}

/**
 * Suspense list for coordinating multiple suspended items
 * @param root0
 * @param root0.children
 * @param root0.revealOrder
 * @param root0.tail
 */
export function SuspenseList({ children, revealOrder = 'together', tail = 'hidden' }) {
  const items = Array.isArray(children) ? children : [children];
  const itemStates = items.map(() => signal(false));

  // Coordinate reveal based on order
  switch (revealOrder) {
    case 'forwards':
      // Reveal items from first to last
      items.forEach((item, index) => {
        if (index === 0 || itemStates[index - 1].value) {
          itemStates[index].value = true;
        }
      });
      break;

    case 'backwards':
      // Reveal items from last to first
      items.reverse().forEach((item, index) => {
        const realIndex = items.length - 1 - index;
        if (realIndex === items.length - 1 || itemStates[realIndex + 1].value) {
          itemStates[realIndex].value = true;
        }
      });
      break;

    case 'together':
    default:
      // Reveal all items at once when all are ready
      const allReady = itemStates.every((state) => state.value);
      if (allReady) {
        itemStates.forEach((state) => (state.value = true));
      }
      break;
  }

  // Handle tail behavior
  const visibleItems = items.filter((_, index) => {
    if (tail === 'collapsed') {
      // Show items up to first suspended one
      for (let i = 0; i <= index; i++) {
        if (!itemStates[i].value) return false;
      }
      return true;
    }

    return tail === 'hidden' ? itemStates[index].value : true;
  });

  return html`<div class="berryact-suspense-list">${visibleItems}</div>`;
}
