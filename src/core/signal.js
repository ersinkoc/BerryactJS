/**
 * @fileoverview Berryact Signal System - Fine-grained reactive state management
 * @author OXOG
 * @version 1.0.0
 */

/* eslint-disable no-console */

let currentEffect = null;
let batchDepth = 0;
const batchedEffects = new Set();

/**
 * Creates a reactive signal that can be observed and updated
 * @description Creates a signal that notifies observers when its value changes
 * @param {*} initialValue - The initial value of the signal
 * @returns {object} A signal object with value getter/setter and utility methods
 * @throws {Error} If initialValue is a function (use computed instead)
 * @example
 * const count = signal(0);
 * count.value = 5; // Triggers reactive updates
 * console.log(count.peek()); // 5 (without tracking)
 */
export function signal(initialValue) {
  // Defensive programming: Validate input
  if (typeof initialValue === 'function') {
    throw new Error('Signal initialValue cannot be a function. Use computed() instead.');
  }

  // Memory leak protection: Track disposal state
  const observers = new Set();
  let value = initialValue;
  let version = 0;
  let isDisposed = false;

  const signalObject = {
    /**
     * Gets the current value and establishes reactive dependency
     * @returns {*} The current value of the signal
     * @throws {Error} If signal has been disposed
     */
    get value() {
      // Defensive programming: Check disposal state
      if (isDisposed) {
        throw new Error('Cannot access disposed signal');
      }

      // Establish reactive dependency if within an effect
      if (currentEffect && currentEffect.active) {
        observers.add(currentEffect);
        if (currentEffect.dependencies) {
          currentEffect.dependencies.add(signalObject);
        }
      }

      return value;
    },

    /**
     * Sets a new value and triggers reactive updates
     * @param {*} newValue - The new value to set
     * @throws {Error} If signal has been disposed
     */
    set value(newValue) {
      // Defensive programming: Check disposal state
      if (isDisposed) {
        throw new Error('Cannot set value on disposed signal');
      }

      // Only update if value actually changed (prevents unnecessary updates)
      if (!Object.is(value, newValue)) {
        value = newValue;
        version++;
        notify();
      }
    },

    /**
     * Gets the version number of the signal (for debugging)
     * @returns {number} The current version number
     */
    get version() {
      return version;
    },

    /**
     * Peeks at the value without establishing reactive dependency
     * @description Use this when you need the value but don't want to track it
     * @returns {*} The current value without tracking
     */
    peek() {
      // Allow peeking even if disposed for debugging purposes
      return value;
    },

    /**
     * Manually triggers notification to all observers
     * @description Useful for forcing updates when object properties change
     */
    notify() {
      if (!isDisposed) {
        notify();
      }
    },

    /**
     * Disposes the signal and cleans up all observers
     * @description Prevents memory leaks by clearing all references
     */
    dispose() {
      if (!isDisposed) {
        isDisposed = true;
        observers.clear();
        // Help GC by nullifying references
        value = null;
      }
    },

    /**
     * Checks if the signal has been disposed
     * @returns {boolean} True if disposed, false otherwise
     */
    get isDisposed() {
      return isDisposed;
    },
  };

  function notify() {
    if (batchDepth > 0) {
      observers.forEach((observer) => batchedEffects.add(observer));
    } else {
      observers.forEach((observer) => {
        if (observer.active) {
          observer.execute();
        }
      });
    }
  }

  return signalObject;
}

export function computed(fn) {
  let cachedValue;
  let isValid = false;
  const dependencies = new Set();
  const observers = new Set();

  const effectObject = {
    dependencies,
    active: true,
    execute: () => {
      isValid = false;
      notify();
    },
  };

  function recompute() {
    const prevEffect = currentEffect;
    currentEffect = effectObject;

    // Clean up old dependencies
    dependencies.forEach((dep) => {
      if (dep.observers) {
        dep.observers.delete(effectObject);
      }
    });
    dependencies.clear();

    try {
      cachedValue = fn();
      isValid = true;
    } finally {
      currentEffect = prevEffect;
    }

    return cachedValue;
  }

  function notify() {
    if (batchDepth > 0) {
      observers.forEach((observer) => batchedEffects.add(observer));
    } else {
      observers.forEach((observer) => {
        if (observer.active) {
          observer.execute();
        }
      });
    }
  }

  const computedSignal = {
    get value() {
      if (currentEffect) {
        observers.add(currentEffect);
        currentEffect.dependencies.add(computedSignal);
      }

      if (!isValid) {
        recompute();
      }
      return cachedValue;
    },

    set value(newValue) {
      throw new Error('Cannot set computed signal');
    },

    get version() {
      return 0;
    },

    peek() {
      return cachedValue;
    },

    notify() {
      notify();
    },

    dispose() {
      effectObject.active = false;
      dependencies.forEach((dep) => {
        if (dep.observers) {
          dep.observers.delete(effectObject);
        }
      });
      dependencies.clear();
      observers.clear();
      cachedValue = null;
    },
  };

  recompute();
  return computedSignal;
}

export function effect(fn, options = {}) {
  const { immediate = true } = options;
  const dependencies = new Set();
  let isActive = true;
  let cleanup = null;

  const effectObject = {
    dependencies,
    active: isActive,
    execute() {
      if (!isActive) return;

      // Run cleanup from previous execution
      if (cleanup) {
        cleanup();
        cleanup = null;
      }

      const prevEffect = currentEffect;
      currentEffect = effectObject;

      dependencies.forEach((dep) => {
        if (dep.observers) {
          dep.observers.delete(effectObject);
        }
      });
      dependencies.clear();

      try {
        const result = fn();
        if (typeof result === 'function') {
          cleanup = result;
        }
      } finally {
        currentEffect = prevEffect;
      }
    },

    dispose() {
      isActive = false;
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      dependencies.forEach((dep) => {
        if (dep.observers) {
          dep.observers.delete(effectObject);
        }
      });
      dependencies.clear();
    },
  };

  if (immediate) {
    effectObject.execute();
  }

  return effectObject;
}

export function batch(fn) {
  if (batchDepth === 0) {
    batchedEffects.clear();
  }

  batchDepth++;

  try {
    const result = fn();

    if (batchDepth === 1) {
      batchedEffects.forEach((effect) => {
        if (effect.active) {
          effect.execute();
        }
      });
      batchedEffects.clear();
    }

    return result;
  } finally {
    batchDepth--;
  }
}

export function untrack(fn) {
  const prevEffect = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prevEffect;
  }
}

export function isSignal(value) {
  return value && typeof value === 'object' && 'value' in value && 'peek' in value;
}
