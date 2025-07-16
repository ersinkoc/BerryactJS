export class DevTools {
  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production';
    this.components = new Map();
    this.stores = new Map();
    this.performance = {
      renders: [],
      mutations: [],
      actions: [],
    };

    if (this.enabled && typeof window !== 'undefined') {
      window.__BERRYACT_DEVTOOLS__ = this;
      this.setupGlobalAPI();
    }
  }

  setupGlobalAPI() {
    window.$berryact = {
      inspectComponent: (id) => this.inspectComponent(id),
      inspectStore: (name) => this.inspectStore(name),
      getPerformance: () => this.getPerformance(),
      clearPerformance: () => this.clearPerformance(),
    };
  }

  registerComponent(component) {
    if (!this.enabled) return;

    const id = this.generateId();
    this.components.set(id, {
      id,
      component,
      name: component.constructor.name,
      props: component.props,
      state: component.state,
      hooks: component.hooks,
      renders: 0,
      lastRender: null,
    });

    return id;
  }

  updateComponent(id, data) {
    if (!this.enabled) return;

    const entry = this.components.get(id);
    if (entry) {
      entry.renders++;
      entry.lastRender = Date.now();
      Object.assign(entry, data);
    }
  }

  unregisterComponent(id) {
    if (!this.enabled) return;

    this.components.delete(id);
  }

  registerStore(name, store) {
    if (!this.enabled) return;

    this.stores.set(name, {
      name,
      store,
      state: store.state,
      mutations: store.mutations,
      actions: store.actions,
      history: store.history,
    });
  }

  trackRender(componentId, duration) {
    if (!this.enabled) return;

    this.performance.renders.push({
      componentId,
      duration,
      timestamp: Date.now(),
    });

    this.trimPerformanceData('renders');
  }

  trackMutation(type, payload, duration) {
    if (!this.enabled) return;

    this.performance.mutations.push({
      type,
      payload,
      duration,
      timestamp: Date.now(),
    });

    this.trimPerformanceData('mutations');
  }

  trackAction(type, payload, duration) {
    if (!this.enabled) return;

    this.performance.actions.push({
      type,
      payload,
      duration,
      timestamp: Date.now(),
    });

    this.trimPerformanceData('actions');
  }

  inspectComponent(id) {
    const component = this.components.get(id);
    if (component) {
      console.group(`Component: ${component.name} (${id})`);
      console.log('Props:', component.props);
      console.log('State:', component.state);
      console.log('Hooks:', component.hooks);
      console.log('Renders:', component.renders);
      console.log('Last Render:', new Date(component.lastRender));
      console.groupEnd();
    }
  }

  inspectStore(name) {
    const store = this.stores.get(name);
    if (store) {
      console.group(`Store: ${name}`);
      console.log('State:', store.state.value);
      console.log('History:', store.history);
      console.log('Mutations:', Object.keys(store.mutations));
      console.log('Actions:', Object.keys(store.actions));
      console.groupEnd();
    }
  }

  getPerformance() {
    return {
      renders: this.performance.renders.slice(),
      mutations: this.performance.mutations.slice(),
      actions: this.performance.actions.slice(),
    };
  }

  clearPerformance() {
    this.performance.renders = [];
    this.performance.mutations = [];
    this.performance.actions = [];
  }

  getComponents() {
    return Array.from(this.components.values());
  }

  getStores() {
    return Array.from(this.stores.values());
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  trimPerformanceData(type, maxEntries = 1000) {
    const data = this.performance[type];
    if (data.length > maxEntries) {
      data.splice(0, data.length - maxEntries);
    }
  }

  measure(name, fn) {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    console.log(`${name} took ${duration.toFixed(2)}ms`);

    return result;
  }

  profile(component, method) {
    if (!this.enabled) {
      return method;
    }

    return (...args) => {
      const start = performance.now();
      const result = method.apply(component, args);
      const duration = performance.now() - start;

      if (method.name === 'render') {
        this.trackRender(component._devtoolsId, duration);
      }

      return result;
    };
  }
}

export const devtools = new DevTools();
