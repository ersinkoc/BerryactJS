/**
 * Enhanced reactive system with performance optimizations
 * Includes plugin support, better memory management, and advanced features
 */

let currentEffect = null;
let batchDepth = 0;
const batchedEffects = new Set();
let effectId = 0;
let signalId = 0;

// Plugin context for hooks
let pluginContext = null;

// Memory management
const signalPool = [];
const effectPool = [];
const MAX_POOL_SIZE = 100;

// Performance tracking
const performanceMetrics = {
  signalsCreated: 0,
  signalsDisposed: 0,
  effectsCreated: 0,
  effectsDisposed: 0,
  computations: 0,
  batchedUpdates: 0,
};

export function setPluginContext(context) {
  pluginContext = context;
}

export function getPerformanceMetrics() {
  return { ...performanceMetrics };
}

// Signal factory with object pooling
function createSignalObject() {
  if (signalPool.length > 0) {
    const obj = signalPool.pop();
    obj.disposed = false;  // Reset disposed flag when reusing from pool
    return obj;
  }

  return {
    observers: new Set(),
    value: undefined,
    version: 0,
    id: 0,
    disposed: false,
  };
}

function recycleSignalObject(obj) {
  if (signalPool.length < MAX_POOL_SIZE) {
    obj.observers.clear();
    obj.value = undefined;
    obj.version = 0;
    obj.disposed = true;
    signalPool.push(obj);
  }
}

export function signal(initialValue, options = {}) {
  const sig = createSignalObject();
  sig.value = initialValue;
  sig.id = ++signalId;
  sig.disposed = false;
  sig.name = options.name || `signal_${sig.id}`;

  performanceMetrics.signalsCreated++;

  // Notify plugin system
  if (pluginContext) {
    pluginContext.callHook('global:signal:created', {
      id: sig.id,
      value: initialValue,
      name: sig.name,
    });
  }

  const signalObject = {
    get value() {
      if (currentEffect && !currentEffect.noTrack) {
        sig.observers.add(currentEffect);
        currentEffect.dependencies.add(signalObject);
      }
      return sig.value;
    },

    set value(newValue) {
      if (Object.is(sig.value, newValue)) return;

      const oldValue = sig.value;
      sig.value = newValue;
      sig.version++;

      // Notify plugin system
      if (pluginContext) {
        pluginContext.callHook('global:signal:updated', {
          id: sig.id,
          oldValue,
          newValue,
          name: sig.name,
        });
      }

      notify();
    },

    get version() {
      return sig.version;
    },

    peek() {
      return sig.value;
    },

    // Advanced features
    update(updater) {
      this.value = typeof updater === 'function' ? updater(sig.value) : updater;
    },

    subscribe(fn, options = {}) {
      const effect = createEffect(
        () => {
          fn(sig.value);
        },
        { immediate: false, ...options }
      );

      return () => effect.dispose();
    },

    // Async value updates
    async asyncUpdate(asyncFn) {
      try {
        const newValue = await asyncFn(sig.value);
        this.value = newValue;
      } catch (error) {
        if (pluginContext) {
          pluginContext.callHook('global:signal:error', { id: sig.id, error });
        }
        throw error;
      }
    },

    notify() {
      notify();
    },

    dispose() {
      if (sig.disposed) return;

      sig.observers.clear();
      performanceMetrics.signalsDisposed++;

      if (pluginContext) {
        pluginContext.callHook('global:signal:disposed', { id: sig.id });
      }

      recycleSignalObject(sig);
    },

    // Debugging helpers
    toString() {
      return `Signal(${sig.name}: ${JSON.stringify(sig.value)})`;
    },

    toJSON() {
      return sig.value;
    },

    // Internal properties
    _id: sig.id,
    _name: sig.name,
  };

  function notify() {
    if (batchDepth > 0) {
      sig.observers.forEach((observer) => batchedEffects.add(observer));
      performanceMetrics.batchedUpdates++;
    } else {
      const observers = [...sig.observers];
      observers.forEach((observer) => {
        if (observer.active && !observer.disposed) {
          observer.execute();
        }
      });
    }
  }

  return signalObject;
}

// Enhanced computed with lazy evaluation and error handling
export function computed(fn, options = {}) {
  let cachedValue;
  let isValid = false;
  let error = null;
  const dependencies = new Set();
  const computedId = ++signalId;
  const name = options.name || `computed_${computedId}`;

  const computedSignal = signal(undefined, { name });

  function recompute() {
    const prevEffect = currentEffect;
    currentEffect = {
      dependencies,
      active: true,
      execute: () => {
        isValid = false;
        error = null;
        computedSignal.notify();
      },
      noTrack: false,
    };

    // Clear old dependencies
    dependencies.forEach((dep) => {
      if (dep._id && dep.peek) {
        const sig = dep;
        sig.observers?.delete(currentEffect);
      }
    });
    dependencies.clear();

    try {
      cachedValue = fn();
      isValid = true;
      error = null;
      performanceMetrics.computations++;

      if (pluginContext) {
        pluginContext.callHook('global:computed:evaluated', {
          id: computedId,
          value: cachedValue,
          name,
        });
      }
    } catch (e) {
      error = e;
      isValid = true; // Mark as valid to prevent infinite recomputation

      if (pluginContext) {
        pluginContext.callHook('global:computed:error', { id: computedId, error: e });
      }

      if (options.onError) {
        options.onError(e);
      } else {
        console.error(`Error in computed ${name}:`, e);
      }
    } finally {
      currentEffect = prevEffect;
    }

    return cachedValue;
  }

  Object.defineProperty(computedSignal, 'value', {
    get() {
      if (!isValid) {
        recompute();
      }

      if (error) {
        throw error;
      }

      // Track this computed as a dependency
      if (currentEffect) {
        currentEffect.dependencies.add(computedSignal);
      }

      return cachedValue;
    },
    set() {
      throw new Error(`Cannot set computed signal ${name}`);
    },
  });

  // Add computed-specific methods
  computedSignal.refresh = () => {
    isValid = false;
    recompute();
    return cachedValue;
  };

  computedSignal._isComputed = true;
  computedSignal._name = name;

  // Initial computation
  recompute();

  return computedSignal;
}

// Effect factory with pooling
function createEffectObject() {
  if (effectPool.length > 0) {
    return effectPool.pop();
  }

  return {
    dependencies: new Set(),
    active: true,
    disposed: false,
    id: 0,
    execute: null,
    scheduler: null,
    onStop: null,
  };
}

function recycleEffectObject(obj) {
  if (effectPool.length < MAX_POOL_SIZE) {
    obj.dependencies.clear();
    obj.active = true;
    obj.disposed = true;
    obj.execute = null;
    obj.scheduler = null;
    obj.onStop = null;
    effectPool.push(obj);
  }
}

// Enhanced effect with more control
export function effect(fn, options = {}) {
  const {
    immediate = true,
    scheduler = null,
    onStop = null,
    name = `effect_${++effectId}`,
    allowSignalReads = true,
  } = options;

  const eff = createEffectObject();
  eff.id = effectId;
  eff.active = true;
  eff.disposed = false;
  eff.scheduler = scheduler;
  eff.onStop = onStop;
  eff.name = name;
  eff.allowSignalReads = allowSignalReads;

  performanceMetrics.effectsCreated++;

  const effectObject = {
    dependencies: eff.dependencies,
    active: eff.active,
    noTrack: !allowSignalReads,

    execute() {
      if (!eff.active || eff.disposed) return;

      const prevEffect = currentEffect;
      currentEffect = effectObject;

      // Clean up old dependencies
      eff.dependencies.forEach((dep) => {
        if (dep.observers) {
          dep.observers.delete(effectObject);
        }
      });
      eff.dependencies.clear();

      try {
        const result = fn();

        if (pluginContext) {
          pluginContext.callHook('global:effect:executed', {
            id: eff.id,
            name: eff.name,
            dependencyCount: eff.dependencies.size,
          });
        }

        return result;
      } catch (error) {
        if (pluginContext) {
          pluginContext.callHook('global:effect:error', { id: eff.id, error });
        }

        if (options.onError) {
          options.onError(error);
        } else {
          console.error(`Error in effect ${eff.name}:`, error);
        }
      } finally {
        currentEffect = prevEffect;
      }
    },

    run() {
      if (eff.scheduler) {
        eff.scheduler(() => this.execute());
      } else {
        this.execute();
      }
    },

    stop() {
      eff.active = false;
      if (eff.onStop) {
        eff.onStop();
      }
    },

    resume() {
      eff.active = true;
    },

    dispose() {
      if (eff.disposed) return;

      this.stop();
      eff.dependencies.forEach((dep) => {
        if (dep.observers) {
          dep.observers.delete(effectObject);
        }
      });
      eff.dependencies.clear();

      performanceMetrics.effectsDisposed++;

      if (pluginContext) {
        pluginContext.callHook('global:effect:disposed', { id: eff.id });
      }

      recycleEffectObject(eff);
    },

    // Debugging
    toString() {
      return `Effect(${eff.name})`;
    },

    _id: eff.id,
    _name: eff.name,
  };

  if (immediate) {
    effectObject.execute();
  }

  return effectObject;
}

// Enhanced batch with nested support and error handling
export function batch(fn) {
  if (batchDepth === 0) {
    batchedEffects.clear();
  }

  batchDepth++;

  try {
    const result = fn();

    if (batchDepth === 1) {
      // Sort effects by priority if needed
      const effects = [...batchedEffects];

      effects.forEach((effect) => {
        if (effect.active && !effect.disposed) {
          try {
            effect.execute();
          } catch (error) {
            console.error('Error in batched effect:', error);
          }
        }
      });

      batchedEffects.clear();
    }

    return result;
  } finally {
    batchDepth--;
  }
}

// Run without tracking
export function untrack(fn) {
  const prevEffect = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prevEffect;
  }
}

// New utility functions

// Create a readonly signal
export function readonly(signal) {
  return {
    get value() {
      return signal.value;
    },
    set value(_) {
      throw new Error('Cannot set readonly signal');
    },
    peek: () => signal.peek(),
    subscribe: (fn, options) => signal.subscribe(fn, options),
    toString: () => `Readonly(${signal.toString()})`,
    _id: signal._id,
    _name: `readonly_${signal._name}`,
  };
}

// Create a derived signal with custom setter
export function writable(getter, setter) {
  const internalSignal = signal(getter());

  return {
    get value() {
      return getter();
    },
    set value(newValue) {
      setter(newValue);
    },
    peek: () => getter(),
    subscribe: (fn, options) => internalSignal.subscribe(fn, options),
    _name: 'writable_signal',
  };
}

// Create a debounced signal
export function debouncedSignal(initialValue, delay = 0) {
  const source = signal(initialValue);
  const debounced = signal(initialValue);
  let timeoutId = null;

  effect(() => {
    const value = source.value;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      debounced.value = value;
    }, delay);
  });

  return {
    get value() {
      return debounced.value;
    },
    set value(newValue) {
      source.value = newValue;
    },
    peek: () => debounced.peek(),
    flush: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        debounced.value = source.peek();
      }
    },
    _name: `debounced_${source._name}`,
  };
}

// Type checking utilities
export function isSignal(value) {
  return (
    value && typeof value === 'object' && 'value' in value && 'peek' in value && '_id' in value
  );
}

export function isComputed(value) {
  return isSignal(value) && value._isComputed === true;
}

export function isReadonly(value) {
  return isSignal(value) && value._name?.startsWith('readonly_');
}

// Cleanup utilities
export function disposeAll(...disposables) {
  disposables.forEach((disposable) => {
    if (disposable && typeof disposable.dispose === 'function') {
      disposable.dispose();
    }
  });
}

// Export a way to reset the system (useful for testing)
export function resetReactiveSystem() {
  currentEffect = null;
  batchDepth = 0;
  batchedEffects.clear();
  signalPool.length = 0;
  effectPool.length = 0;

  // Reset metrics
  Object.keys(performanceMetrics).forEach((key) => {
    performanceMetrics[key] = 0;
  });
}
