// Advanced performance optimizations for Berryact framework

export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.maxSize = 100;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.pool.push(obj);
    }
  }

  clear() {
    this.pool.length = 0;
  }
}

// Object pools for common operations
export const nodePool = new ObjectPool(
  () => ({ type: '', props: {}, children: [], key: null }),
  (obj) => {
    obj.type = '';
    obj.props = {};
    obj.children.length = 0;
    obj.key = null;
  }
);

export const effectPool = new ObjectPool(
  () => ({ dependencies: new Set(), active: true, execute: null }),
  (obj) => {
    obj.dependencies.clear();
    obj.active = true;
    obj.execute = null;
  }
);

// Micro-task scheduling for better performance
export class MicroTaskScheduler {
  constructor() {
    this.queue = [];
    this.isScheduled = false;
    this.channel = null;
    
    if (typeof MessageChannel !== 'undefined') {
      this.channel = new MessageChannel();
      this.channel.port2.onmessage = () => this.flush();
    }
  }

  schedule(callback) {
    this.queue.push(callback);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      
      if (this.channel) {
        this.channel.port1.postMessage(null);
      } else {
        Promise.resolve().then(() => this.flush());
      }
    }
  }

  flush() {
    this.isScheduled = false;
    const callbacks = this.queue.slice();
    this.queue.length = 0;
    
    for (const callback of callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    }
  }
}

export const microTaskScheduler = new MicroTaskScheduler();

// Fast path for primitive comparisons
export function fastEqual(a, b) {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  if (a.constructor !== b.constructor) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!fastEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key) || !fastEqual(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
}

// Memoization with LRU cache
export class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Debounced function for expensive operations
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttled function for frequent operations
export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory-efficient event delegation
export class EventDelegator {
  constructor() {
    this.handlers = new Map();
    this.setup();
  }

  setup() {
    const events = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'keydown', 'keyup'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.handleEvent(event);
      }, { passive: true, capture: true });
    });
  }

  handleEvent(event) {
    let target = event.target;
    
    while (target && target !== document) {
      const id = target._berryactId;
      if (id && this.handlers.has(id)) {
        const handler = this.handlers.get(id)[event.type];
        if (handler) {
          handler(event);
          break;
        }
      }
      target = target.parentNode;
    }
  }

  register(element, eventType, handler) {
    if (!element._berryactId) {
      element._berryactId = Math.random().toString(36).substr(2, 9);
    }
    
    if (!this.handlers.has(element._berryactId)) {
      this.handlers.set(element._berryactId, {});
    }
    
    this.handlers.get(element._berryactId)[eventType] = handler;
  }

  unregister(element, eventType) {
    if (element._berryactId && this.handlers.has(element._berryactId)) {
      delete this.handlers.get(element._berryactId)[eventType];
      
      const elementHandlers = this.handlers.get(element._berryactId);
      if (Object.keys(elementHandlers).length === 0) {
        this.handlers.delete(element._berryactId);
      }
    }
  }
}

export const eventDelegator = new EventDelegator();

// Efficient DOM manipulation utilities
export class DOMUtils {
  static fragmentFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
  }

  static cloneNode(node, deep = true) {
    return node.cloneNode(deep);
  }

  static insertBefore(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
  }

  static replaceNode(newNode, oldNode) {
    oldNode.parentNode.replaceChild(newNode, oldNode);
  }

  static removeNode(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  static setAttribute(element, name, value) {
    if (value === null || value === undefined || value === false) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value === true ? '' : String(value));
    }
  }

  static setProperty(element, name, value) {
    if (name in element) {
      element[name] = value;
    } else {
      this.setAttribute(element, name, value);
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renders: [],
      updates: [],
      mounts: [],
      unmounts: []
    };
    this.enabled = process.env.NODE_ENV !== 'production';
  }

  measureRender(component, fn) {
    if (!this.enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.metrics.renders.push({
      component: component.constructor.name,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (this.metrics.renders.length > 100) {
      this.metrics.renders.shift();
    }
    
    return result;
  }

  measureUpdate(component, fn) {
    if (!this.enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.metrics.updates.push({
      component: component.constructor.name,
      duration,
      timestamp: Date.now()
    });
    
    if (this.metrics.updates.length > 100) {
      this.metrics.updates.shift();
    }
    
    return result;
  }

  getAverageRenderTime(componentName) {
    const renders = this.metrics.renders.filter(r => 
      !componentName || r.component === componentName
    );
    
    if (renders.length === 0) return 0;
    
    const total = renders.reduce((sum, r) => sum + r.duration, 0);
    return total / renders.length;
  }

  getSlowestComponents(limit = 10) {
    const componentTimes = new Map();
    
    this.metrics.renders.forEach(render => {
      const current = componentTimes.get(render.component) || { total: 0, count: 0 };
      current.total += render.duration;
      current.count++;
      componentTimes.set(render.component, current);
    });
    
    return Array.from(componentTimes.entries())
      .map(([name, data]) => ({
        name,
        average: data.total / data.count,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, limit);
  }

  clearMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key].length = 0;
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Lazy evaluation for computed values
export class LazyComputed {
  constructor(fn) {
    this.fn = fn;
    this.cached = false;
    this.value = undefined;
    this.dependencies = new Set();
  }

  get() {
    if (!this.cached) {
      this.value = this.fn();
      this.cached = true;
    }
    return this.value;
  }

  invalidate() {
    this.cached = false;
  }
}