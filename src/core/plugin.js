/**
 * Plugin System for Berryact Framework
 * Provides extensibility and modularity through a powerful plugin architecture
 */

import { signal, computed, effect } from './signal.js';
import { getCurrentComponent } from './hooks.js';

// Plugin phases for lifecycle hooks
export const PluginPhase = {
  BEFORE_CREATE: 'beforeCreate',
  CREATED: 'created',
  BEFORE_MOUNT: 'beforeMount',
  MOUNTED: 'mounted',
  BEFORE_UPDATE: 'beforeUpdate',
  UPDATED: 'updated',
  BEFORE_UNMOUNT: 'beforeUnmount',
  UNMOUNTED: 'unmounted',
  ERROR: 'error'
};

// Plugin context for sharing data between plugins
export class PluginContext {
  constructor() {
    this.store = new Map();
    this.hooks = new Map();
    this.middleware = new Map();
  }

  set(key, value) {
    this.store.set(key, value);
  }

  get(key) {
    return this.store.get(key);
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  // Register a hook for plugins to tap into
  registerHook(name, handler) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    this.hooks.get(name).add(handler);
  }

  // Call all handlers for a hook
  async callHook(name, ...args) {
    const handlers = this.hooks.get(name);
    if (!handlers) return;

    const results = [];
    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Error in hook ${name}:`, error);
      }
    }
    return results;
  }

  // Register middleware for specific functionality
  registerMiddleware(type, middleware) {
    if (!this.middleware.has(type)) {
      this.middleware.set(type, []);
    }
    this.middleware.get(type).push(middleware);
  }

  // Apply middleware chain
  async applyMiddleware(type, context, next) {
    const middlewares = this.middleware.get(type) || [];
    let index = -1;

    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error('Middleware called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return next ? next() : undefined;
      }

      return middleware(context, () => dispatch(i + 1));
    };

    return dispatch(0);
  }
}

// Base Plugin class
export class Plugin {
  constructor(options = {}) {
    this.name = options.name || 'unnamed-plugin';
    this.version = options.version || '1.0.0';
    this.dependencies = options.dependencies || [];
    this.options = options;
    this._installed = false;
  }

  // Called when plugin is installed
  install(app, options = {}) {
    if (this._installed) {
      console.warn(`Plugin ${this.name} is already installed`);
      return;
    }

    this._installed = true;
    this.app = app;
    this.context = app.pluginContext;

    // Merge options
    Object.assign(this.options, options);

    // Call setup if defined
    if (this.setup) {
      this.setup(app, this.context);
    }
  }

  // To be implemented by plugins
  setup(app, context) {
    throw new Error('Plugin must implement setup method');
  }

  // Helper to register component hooks
  registerComponentHook(phase, handler) {
    this.context.registerHook(`component:${phase}`, handler);
  }

  // Helper to register app hooks
  registerAppHook(name, handler) {
    this.context.registerHook(`app:${name}`, handler);
  }

  // Helper to register global hooks
  registerGlobalHook(name, handler) {
    this.context.registerHook(`global:${name}`, handler);
  }

  // Helper to provide data to other plugins
  provide(key, value) {
    this.context.set(`${this.name}:${key}`, value);
  }

  // Helper to inject data from other plugins
  inject(pluginName, key) {
    return this.context.get(`${pluginName}:${key}`);
  }
}

// Plugin manager for the app
export class PluginManager {
  constructor(app) {
    this.app = app;
    this.plugins = new Map();
    this.context = new PluginContext();
    this.loadOrder = [];
  }

  // Register a plugin
  use(plugin, options = {}) {
    if (typeof plugin === 'function') {
      // Functional plugin
      plugin = new FunctionalPlugin(plugin);
    }

    if (!(plugin instanceof Plugin)) {
      throw new Error('Invalid plugin: must be a Plugin instance or function');
    }

    // Check if already registered
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`);
      return this;
    }

    // Check dependencies
    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Plugin ${plugin.name} requires ${dep} to be installed first`);
      }
    }

    // Register plugin
    this.plugins.set(plugin.name, plugin);
    this.loadOrder.push(plugin.name);

    // Install plugin
    plugin.install(this.app, options);

    return this;
  }

  // Get a plugin by name
  get(name) {
    return this.plugins.get(name);
  }

  // Check if plugin is installed
  has(name) {
    return this.plugins.has(name);
  }

  // Call hooks on all plugins
  async callHook(name, ...args) {
    return this.context.callHook(name, ...args);
  }

  // Apply middleware
  async applyMiddleware(type, context, next) {
    return this.context.applyMiddleware(type, context, next);
  }
}

// Functional plugin wrapper
class FunctionalPlugin extends Plugin {
  constructor(setupFn, options = {}) {
    super(options);
    this.setupFn = setupFn;
  }

  setup(app, context) {
    return this.setupFn(app, context);
  }
}

// Create a plugin helper
export function createPlugin(options) {
  return class extends Plugin {
    constructor() {
      super({
        name: options.name,
        version: options.version,
        dependencies: options.dependencies || []
      });
    }

    setup(app, context) {
      if (options.setup) {
        return options.setup.call(this, app, context);
      }
    }
  };
}

// Built-in plugins

// DevTools Plugin
export const DevToolsPlugin = createPlugin({
  name: 'devtools',
  version: '1.0.0',
  
  setup(app, context) {
    // Track component tree
    const componentTree = signal([]);
    const componentMap = new WeakMap();
    let componentId = 0;

    // Register component hooks
    this.registerComponentHook(PluginPhase.CREATED, (component) => {
      const id = ++componentId;
      const info = {
        id,
        name: component.constructor.name || 'Anonymous',
        props: component.props,
        state: {},
        children: []
      };

      componentMap.set(component, info);
      
      // Add to tree
      componentTree.value = [...componentTree.value, info];
    });

    this.registerComponentHook(PluginPhase.UPDATED, (component) => {
      const info = componentMap.get(component);
      if (info) {
        // Update component info
        info.props = component.props;
        info.state = component.getState ? component.getState() : {};
        
        // Trigger tree update
        componentTree.value = [...componentTree.value];
      }
    });

    this.registerComponentHook(PluginPhase.UNMOUNTED, (component) => {
      const info = componentMap.get(component);
      if (info) {
        componentTree.value = componentTree.value.filter(c => c.id !== info.id);
        componentMap.delete(component);
      }
    });

    // Expose to window for dev tools
    if (typeof window !== 'undefined') {
      window.__NANO_DEVTOOLS__ = {
        version: app.version,
        componentTree,
        getComponent: (id) => {
          return componentTree.value.find(c => c.id === id);
        },
        inspectComponent: (id) => {
          const component = componentTree.value.find(c => c.id === id);
          return component ? {
            ...component,
            hooks: component._hooks || []
          } : null;
        },
        getStore: () => app.store?.state,
        getRouter: () => app.router?.currentRoute
      };
    }

    // Provide devtools API
    this.provide('componentTree', componentTree);
    this.provide('enabled', true);
  }
});

// Logger Plugin
export const LoggerPlugin = createPlugin({
  name: 'logger',
  version: '1.0.0',
  
  setup(app, context) {
    const logLevel = this.options.level || 'info';
    const logPrefix = this.options.prefix || '[Berryact]';
    
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    const logger = {
      debug(...args) {
        if (levels[logLevel] <= levels.debug) {
          console.debug(logPrefix, ...args);
        }
      },
      info(...args) {
        if (levels[logLevel] <= levels.info) {
          console.info(logPrefix, ...args);
        }
      },
      warn(...args) {
        if (levels[logLevel] <= levels.warn) {
          console.warn(logPrefix, ...args);
        }
      },
      error(...args) {
        if (levels[logLevel] <= levels.error) {
          console.error(logPrefix, ...args);
        }
      }
    };

    // Log lifecycle events
    if (this.options.logLifecycle) {
      Object.values(PluginPhase).forEach(phase => {
        this.registerComponentHook(phase, (component) => {
          logger.debug(`Component ${phase}:`, component);
        });
      });
    }

    // Log routing
    if (this.options.logRouting) {
      this.registerAppHook('route:before', (to, from) => {
        logger.info('Navigation:', from.path, '->', to.path);
      });
    }

    // Log store mutations
    if (this.options.logStore) {
      this.registerAppHook('store:mutation', (mutation, state) => {
        logger.info('Mutation:', mutation.type, mutation.payload);
        logger.debug('New State:', state);
      });
    }

    // Provide logger
    this.provide('logger', logger);
    
    // Also expose globally
    app.logger = logger;
  }
});

// Performance Monitor Plugin
export const PerformancePlugin = createPlugin({
  name: 'performance',
  version: '1.0.0',
  
  setup(app, context) {
    const metrics = signal({
      components: {
        created: 0,
        updated: 0,
        destroyed: 0,
        renderTime: []
      },
      signals: {
        created: 0,
        updated: 0,
        computations: 0
      },
      memory: {
        used: 0,
        peak: 0
      }
    });

    // Component performance tracking
    this.registerComponentHook(PluginPhase.BEFORE_CREATE, (component) => {
      component._perfStart = performance.now();
    });

    this.registerComponentHook(PluginPhase.CREATED, (component) => {
      const duration = performance.now() - component._perfStart;
      metrics.value.components.created++;
      metrics.value.components.renderTime.push(duration);
      
      // Keep only last 100 render times
      if (metrics.value.components.renderTime.length > 100) {
        metrics.value.components.renderTime.shift();
      }
    });

    this.registerComponentHook(PluginPhase.UPDATED, () => {
      metrics.value.components.updated++;
    });

    this.registerComponentHook(PluginPhase.UNMOUNTED, () => {
      metrics.value.components.destroyed++;
    });

    // Signal performance tracking
    this.registerGlobalHook('signal:created', () => {
      metrics.value.signals.created++;
    });

    this.registerGlobalHook('signal:updated', () => {
      metrics.value.signals.updated++;
    });

    this.registerGlobalHook('computed:evaluated', () => {
      metrics.value.signals.computations++;
    });

    // Memory tracking
    if (typeof window !== 'undefined' && performance.memory) {
      setInterval(() => {
        const used = performance.memory.usedJSHeapSize / 1048576; // MB
        metrics.value.memory.used = used;
        metrics.value.memory.peak = Math.max(metrics.value.memory.peak, used);
      }, 1000);
    }

    // Calculate averages
    const averageRenderTime = computed(() => {
      const times = metrics.value.components.renderTime;
      if (times.length === 0) return 0;
      return times.reduce((a, b) => a + b, 0) / times.length;
    });

    // Provide metrics
    this.provide('metrics', metrics);
    this.provide('averageRenderTime', averageRenderTime);

    // Expose performance API
    app.performance = {
      getMetrics: () => metrics.value,
      reset: () => {
        metrics.value = {
          components: { created: 0, updated: 0, destroyed: 0, renderTime: [] },
          signals: { created: 0, updated: 0, computations: 0 },
          memory: { used: 0, peak: metrics.value.memory.peak }
        };
      },
      getAverageRenderTime: () => averageRenderTime.value
    };
  }
});