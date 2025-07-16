/**
 * Middleware system for Berryact framework
 * Provides composable middleware for router, store, and custom pipelines
 */

import { signal } from './signal-enhanced.js';

/**
 * Compose multiple middleware functions into a single function
 * @param {...any} middleware
 */
export function compose(...middleware) {
  if (middleware.length === 0) {
    return (context, next) => next();
  }

  if (middleware.length === 1) {
    return middleware[0];
  }

  return function composedMiddleware(context, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }

      index = i;
      const fn = middleware[i];

      if (!fn) {
        return Promise.resolve(next ? next() : undefined);
      }

      try {
        return Promise.resolve(fn(context, () => dispatch(i + 1)));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    return dispatch(0);
  };
}

/**
 * Create a middleware pipeline
 */
export class MiddlewarePipeline {
  constructor(options = {}) {
    this.middleware = [];
    this.options = {
      async: true,
      errorHandler: null,
      ...options,
    };
  }

  /**
   * Add middleware to the pipeline
   * @param middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }

    this.middleware.push(middleware);
    return this;
  }

  /**
   * Remove middleware from the pipeline
   * @param middleware
   */
  remove(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
    return this;
  }

  /**
   * Clear all middleware
   */
  clear() {
    this.middleware = [];
    return this;
  }

  /**
   * Execute the middleware pipeline
   * @param context
   * @param finalHandler
   */
  async execute(context, finalHandler) {
    const chain = compose(...this.middleware);

    try {
      if (this.options.async) {
        return await chain(context, finalHandler);
      } else {
        return chain(context, finalHandler);
      }
    } catch (error) {
      if (this.options.errorHandler) {
        return this.options.errorHandler(error, context);
      }
      throw error;
    }
  }

  /**
   * Create a bound execute function
   * @param finalHandler
   */
  createExecutor(finalHandler) {
    return (context) => this.execute(context, finalHandler);
  }
}

/**
 * Router middleware utilities
 */
export const RouterMiddleware = {
  /**
   * Authentication guard
   * @param options
   */
  auth: (options = {}) => {
    const { isAuthenticated, redirectTo = '/login', message = 'Authentication required' } = options;

    return async (context, next) => {
      const { to, from, router } = context;

      if (!isAuthenticated()) {
        if (message) {
          console.warn(message);
        }

        router.push(redirectTo, {
          query: { redirect: to.path },
        });

        return false;
      }

      return next();
    };
  },

  /**
   * Role-based access control
   * @param options
   */
  rbac: (options = {}) => {
    const { getUserRole, allowedRoles = [], redirectTo = '/forbidden' } = options;

    return async (context, next) => {
      const { to, router } = context;
      const userRole = getUserRole();

      if (!allowedRoles.includes(userRole)) {
        router.push(redirectTo);
        return false;
      }

      return next();
    };
  },

  /**
   * Logging middleware
   * @param options
   */
  logger: (options = {}) => {
    const { logger = console, level = 'info' } = options;

    return async (context, next) => {
      const { to, from } = context;
      const start = Date.now();

      logger[level](`Navigation: ${from.path} -> ${to.path}`);

      const result = await next();

      const duration = Date.now() - start;
      logger[level](`Navigation completed in ${duration}ms`);

      return result;
    };
  },

  /**
   * Progress bar middleware
   * @param options
   */
  progress: (options = {}) => {
    const { delay = 100 } = options;
    let timeoutId;

    return async (context, next) => {
      const { router } = context;

      // Start progress after delay
      timeoutId = setTimeout(() => {
        if (router.progress) {
          router.progress.start();
        }
      }, delay);

      try {
        const result = await next();

        clearTimeout(timeoutId);
        if (router.progress) {
          router.progress.finish();
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (router.progress) {
          router.progress.fail();
        }
        throw error;
      }
    };
  },

  /**
   * Cache middleware
   * @param options
   */
  cache: (options = {}) => {
    const {
      storage = sessionStorage,
      key = 'router-cache',
      ttl = 5 * 60 * 1000, // 5 minutes
    } = options;

    const cache = new Map();

    return async (context, next) => {
      const { to } = context;
      const cacheKey = `${key}:${to.path}`;

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ttl) {
        context.cachedData = cached.data;
        return cached.result;
      }

      // Execute and cache
      const result = await next();

      cache.set(cacheKey, {
        result,
        data: context.data,
        timestamp: Date.now(),
      });

      // Persist to storage
      try {
        storage.setItem(key, JSON.stringify([...cache]));
      } catch (e) {
        // Storage might be full
      }

      return result;
    };
  },
};

/**
 * Store middleware utilities
 */
export const StoreMiddleware = {
  /**
   * Logger middleware
   * @param options
   */
  logger: (options = {}) => {
    const { logger = console, collapsed = true, filter = null, transformer = null } = options;

    return (store) => (next) => (action) => {
      if (filter && !filter(action, store.getState())) {
        return next(action);
      }

      const prevState = store.getState();
      const started = Date.now();

      const result = next(action);

      const duration = Date.now() - started;
      const nextState = store.getState();

      const data = transformer
        ? transformer({
            action,
            prevState,
            nextState,
            duration,
          })
        : {
            action,
            prevState,
            nextState,
            duration,
          };

      if (collapsed) {
        logger.groupCollapsed(`${action.type} (${duration}ms)`);
      } else {
        logger.group(`${action.type} (${duration}ms)`);
      }

      logger.log('Action:', data.action);
      logger.log('Previous State:', data.prevState);
      logger.log('Next State:', data.nextState);
      logger.log('Duration:', `${data.duration}ms`);

      logger.groupEnd();

      return result;
    };
  },

  /**
   * Thunk middleware for async actions
   * @param options
   */
  thunk: (options = {}) => {
    const { extraArgument } = options;

    return (store) => (next) => (action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState, extraArgument);
      }

      return next(action);
    };
  },

  /**
   * Promise middleware
   */
  promise: () => {
    return (store) => (next) => (action) => {
      if (!action.promise) {
        return next(action);
      }

      const { type, promise, ...rest } = action;

      // Dispatch pending action
      next({ ...rest, type: `${type}_PENDING` });

      return promise
        .then((result) => {
          // Dispatch success action
          next({ ...rest, type: `${type}_SUCCESS`, payload: result });
          return result;
        })
        .catch((error) => {
          // Dispatch error action
          next({ ...rest, type: `${type}_ERROR`, error: true, payload: error });
          throw error;
        });
    };
  },

  /**
   * Validation middleware
   * @param options
   */
  validator: (options = {}) => {
    const { rules = {} } = options;

    return (store) => (next) => (action) => {
      const rule = rules[action.type];

      if (rule) {
        const state = store.getState();
        const validation = rule(action, state);

        if (validation !== true) {
          console.error(`Validation failed for ${action.type}:`, validation);
          return;
        }
      }

      return next(action);
    };
  },

  /**
   * Persistence middleware
   * @param options
   */
  persist: (options = {}) => {
    const {
      key = 'store',
      storage = localStorage,
      whitelist = null,
      blacklist = null,
      throttle = 1000,
    } = options;

    let timeoutId;

    return (store) => {
      // Load initial state
      try {
        const savedState = storage.getItem(key);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          store.replaceState(parsed);
        }
      } catch (e) {
        console.error('Failed to load persisted state:', e);
      }

      return (next) => (action) => {
        const result = next(action);

        // Save state (throttled)
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const state = store.getState();
            const stateToPersist = filterState(state, whitelist, blacklist);
            storage.setItem(key, JSON.stringify(stateToPersist));
          } catch (e) {
            console.error('Failed to persist state:', e);
          }
        }, throttle);

        return result;
      };
    };
  },

  /**
   * Undo/Redo middleware
   * @param options
   */
  undoable: (options = {}) => {
    const { limit = 10 } = options;
    const history = [];
    let currentIndex = -1;

    return (store) => {
      // Add undo/redo methods to store
      store.undo = () => {
        if (currentIndex > 0) {
          currentIndex--;
          store.replaceState(history[currentIndex]);
        }
      };

      store.redo = () => {
        if (currentIndex < history.length - 1) {
          currentIndex++;
          store.replaceState(history[currentIndex]);
        }
      };

      store.canUndo = () => currentIndex > 0;
      store.canRedo = () => currentIndex < history.length - 1;

      return (next) => (action) => {
        // Skip undo/redo actions
        if (action.type === 'UNDO' || action.type === 'REDO') {
          return;
        }

        const result = next(action);

        // Add to history
        currentIndex++;
        history.splice(currentIndex, history.length - currentIndex, store.getState());

        // Limit history size
        if (history.length > limit) {
          history.shift();
          currentIndex--;
        }

        return result;
      };
    };
  },
};

/**
 * Create custom middleware pipeline
 * @param name
 * @param options
 */
export function createMiddlewarePipeline(name, options = {}) {
  const pipeline = new MiddlewarePipeline(options);
  const state = signal({
    executing: false,
    lastExecution: null,
    errorCount: 0,
  });

  return {
    name,
    pipeline,
    state,

    use(middleware) {
      pipeline.use(middleware);
      return this;
    },

    async execute(context) {
      state.value = {
        ...state.value,
        executing: true,
      };

      try {
        const result = await pipeline.execute(context);

        state.value = {
          executing: false,
          lastExecution: new Date(),
          errorCount: 0,
        };

        return result;
      } catch (error) {
        state.value = {
          executing: false,
          lastExecution: new Date(),
          errorCount: state.value.errorCount + 1,
        };

        throw error;
      }
    },

    createBoundMiddleware() {
      return (context, next) => {
        return this.execute({ ...context, next });
      };
    },
  };
}

// Helper functions
function filterState(state, whitelist, blacklist) {
  if (!whitelist && !blacklist) {
    return state;
  }

  const filtered = {};

  Object.keys(state).forEach((key) => {
    if (blacklist && blacklist.includes(key)) {
      return;
    }

    if (whitelist && !whitelist.includes(key)) {
      return;
    }

    filtered[key] = state[key];
  });

  return filtered;
}
