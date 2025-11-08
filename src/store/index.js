import { signal, computed, effect, batch } from '../core/signal.js';

export class Store {
  constructor(options = {}) {
    this.state = signal(options.state || {});
    this.getters = {};
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};
    this.modules = new Map();
    this.plugins = [];
    this.strict = options.strict !== false;
    this.devtools = options.devtools !== false;

    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = options.maxHistory || 50;

    this.setupGetters(options.getters || {});
    this.setupModules(options.modules || {});
    this.setupPlugins(options.plugins || []);
    this.setupDevtools();

    this.saveStateSnapshot();
  }

  setupGetters(getters) {
    Object.entries(getters).forEach(([key, getter]) => {
      this.getters[key] = computed(() => {
        return getter(this.state.value, this.getters);
      });
    });
  }

  setupModules(modules) {
    Object.entries(modules).forEach(([name, moduleConfig]) => {
      this.registerModule(name, moduleConfig);
    });
  }

  setupPlugins(plugins) {
    plugins.forEach((plugin) => {
      this.use(plugin);
    });
  }

  setupDevtools() {
    if (this.devtools && typeof window !== 'undefined' && window.__NANO_DEVTOOLS__) {
      window.__NANO_DEVTOOLS__.connect(this);
    }
  }

  commit(type, payload, options = {}) {
    if (typeof type === 'object') {
      options = payload;
      payload = type.payload;
      type = type.type;
    }

    const mutation = this.mutations[type];
    if (!mutation) {
      if (this.strict) {
        throw new Error(`Unknown mutation type: ${type}`);
      }
      return;
    }

    if (this.strict && !options.silent) {
      this.assertNotMutatingOutsideHandler();
    }

    const prevState = { ...this.state.value };

    batch(() => {
      // Create a proxy for the state that mutations can modify
      const stateProxy = { ...this.state.value };
      mutation(stateProxy, payload);
      this.state.value = stateProxy;
    });

    if (!options.silent) {
      this.saveStateSnapshot(type, payload);
      this.notifyPlugins('mutation', { type, payload, prevState, state: this.state.value });
    }
  }

  async dispatch(type, payload) {
    if (typeof type === 'object') {
      payload = type.payload;
      type = type.type;
    }

    const action = this.actions[type];
    if (!action) {
      if (this.strict) {
        throw new Error(`Unknown action type: ${type}`);
      }
      return Promise.resolve();
    }

    const context = {
      state: this.state.value,
      getters: this.getters,
      commit: this.commit.bind(this),
      dispatch: this.dispatch.bind(this),
    };

    this.notifyPlugins('action', { type, payload });

    try {
      const result = await action(context, payload);
      this.notifyPlugins('actionComplete', { type, payload, result });
      return result;
    } catch (error) {
      this.notifyPlugins('actionError', { type, payload, error });
      throw error;
    }
  }

  subscribe(fn) {
    let isFirst = true;
    const effectInstance = effect(() => {
      if (isFirst) {
        isFirst = false;
        // Just track the dependency, don't call fn
        this.state.value;
      } else {
        fn(this.state.value);
      }
    });

    return () => effectInstance.dispose();
  }

  subscribeAction(fn) {
    this.plugins.push({
      action: fn,
    });

    return () => {
      const index = this.plugins.findIndex((p) => p.action === fn);
      if (index >= 0) {
        this.plugins.splice(index, 1);
      }
    };
  }

  watch(getter, callback, options = {}) {
    const { immediate = false, deep = false } = options;

    const computedValue = computed(() => {
      if (typeof getter === 'function') {
        return getter(this.state.value, this.getters);
      }

      // If getter is a string, look up in getters first, then in state
      if (this.getters[getter]) {
        return this.getters[getter].value;
      }

      return this.state.value[getter];
    });

    let oldValue = computedValue.value;
    let isFirst = true;

    return effect(() => {
      const newValue = computedValue.value;

      if (isFirst) {
        isFirst = false;
        if (immediate) {
          callback(newValue, oldValue);
        }
      } else if (newValue !== oldValue || deep) {
        callback(newValue, oldValue);
        oldValue = deep ? JSON.parse(JSON.stringify(newValue)) : newValue;
      }
    });
  }

  registerModule(name, module) {
    if (this.modules.has(name)) {
      throw new Error(`Module ${name} already registered`);
    }

    const moduleStore = new Store({
      state: module.state || {},
      getters: module.getters || {},
      mutations: module.mutations || {},
      actions: module.actions || {},
      strict: this.strict,
      devtools: false,
    });

    this.modules.set(name, moduleStore);

    Object.defineProperty(this.state.value, name, {
      get: () => moduleStore.state.value,
      enumerable: true,
      configurable: true,
    });

    Object.entries(module.getters || {}).forEach(([key, getter]) => {
      this.getters[`${name}/${key}`] = moduleStore.getters[key];
    });

    return moduleStore;
  }

  unregisterModule(name) {
    if (!this.modules.has(name)) {
      return;
    }

    this.modules.delete(name);
    delete this.state.value[name];

    Object.keys(this.getters).forEach((key) => {
      if (key.startsWith(`${name}/`)) {
        delete this.getters[key];
      }
    });
  }

  hasModule(name) {
    return this.modules.has(name);
  }

  use(plugin) {
    if (typeof plugin === 'function') {
      plugin(this);
    } else {
      this.plugins.push(plugin);
    }
  }

  replaceState(newState) {
    batch(() => {
      this.state.value = newState;
    });
    this.saveStateSnapshot('replaceState');
  }

  saveStateSnapshot(mutationType = null, payload = null) {
    const currentState = this.state.value;

    // Handle undefined state gracefully
    if (currentState === undefined) {
      return;
    }

    const snapshot = {
      state: JSON.parse(JSON.stringify(currentState)),
      mutation: mutationType ? { type: mutationType, payload } : null,
      timestamp: Date.now(),
    };

    this.historyIndex++;
    this.history = this.history.slice(0, this.historyIndex);
    this.history.push(snapshot);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  timeTravel(index) {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    this.historyIndex = index;
    const snapshot = this.history[index];

    batch(() => {
      this.state.value = JSON.parse(JSON.stringify(snapshot.state));
    });

    return true;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  undo() {
    if (this.canUndo()) {
      return this.timeTravel(this.historyIndex - 1);
    }
    return false;
  }

  redo() {
    if (this.canRedo()) {
      return this.timeTravel(this.historyIndex + 1);
    }
    return false;
  }

  getHistory() {
    return this.history.slice();
  }

  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.saveStateSnapshot();
  }

  notifyPlugins(event, data) {
    this.plugins.forEach((plugin) => {
      if (plugin[event]) {
        try {
          plugin[event](data);
        } catch (error) {
          console.error(`Plugin error on ${event}:`, error);
        }
      }
    });
  }

  assertNotMutatingOutsideHandler() {
    // In strict mode, state mutations should only happen in mutation handlers
    // This is a simplified check - in a real implementation, this would be more sophisticated
  }

  /**
   * Dispose the store and clean up all resources
   * @description Call this when the store is no longer needed to prevent memory leaks
   */
  dispose() {
    // Dispose state signal
    if (this.state && typeof this.state.dispose === 'function') {
      this.state.dispose();
    }

    // Dispose all getters (computed values)
    Object.values(this.getters).forEach((getter) => {
      if (getter && typeof getter.dispose === 'function') {
        getter.dispose();
      }
    });

    // Dispose all modules
    this.modules.forEach((module) => {
      if (module && typeof module.dispose === 'function') {
        module.dispose();
      }
    });

    // Clear arrays and maps
    this.plugins = [];
    this.history = [];
    this.modules.clear();
    this.getters = {};
    this.mutations = {};
    this.actions = {};
  }
}

export function createStore(options) {
  return new Store(options);
}
