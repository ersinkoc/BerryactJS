import { signal, computed, effect } from './signal.js';
import { scheduleComponentUpdate } from './scheduler.js';

let currentComponent = null;
let hookIndex = 0;

export function getCurrentComponent() {
  if (!currentComponent) {
    throw new Error('Hooks can only be called inside component render functions');
  }
  return currentComponent;
}

export function setCurrentComponent(component) {
  currentComponent = component;
}

export function resetHookIndex() {
  hookIndex = 0;
}

export function getNextHookIndex() {
  return hookIndex++;
}

export function useState(initialValue) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    const state = signal(initialValue);

    const setState = (newValue) => {
      if (typeof newValue === 'function') {
        state.value = newValue(state.value);
      } else {
        state.value = newValue;
      }
      scheduleComponentUpdate(component);
    };

    component.hooks[index] = [state, setState];
  }

  const [state, setState] = component.hooks[index];
  return [state.value, setState];
}

export function useSignal(initialValue) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    const state = signal(initialValue);

    // Create effect and track it for cleanup
    const updateEffect = effect(() => {
      state.value;
      scheduleComponentUpdate(component);
    });

    // Track effect for cleanup on unmount
    if (!component.effects) {
      component.effects = [];
    }
    component.effects.push(updateEffect);

    component.hooks[index] = state;
  }

  return component.hooks[index];
}

export function useComputed(fn) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    const computedValue = computed(fn);

    // Create effect and track it for cleanup
    const updateEffect = effect(() => {
      computedValue.value;
      scheduleComponentUpdate(component);
    });

    // Track effect for cleanup on unmount
    if (!component.effects) {
      component.effects = [];
    }
    component.effects.push(updateEffect);

    component.hooks[index] = computedValue;
  }

  return component.hooks[index];
}

export function useEffect(fn, deps) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    component.hooks[index] = { deps: [], cleanup: null, initialized: false };
  }

  const hook = component.hooks[index];
  const hasChanged =
    !deps ||
    !hook.initialized ||
    deps.some((dep, i) => dep !== hook.deps[i]);

  if (hasChanged) {
    if (hook.cleanup) {
      hook.cleanup();
    }

    const result = fn();
    hook.cleanup = typeof result === 'function' ? result : null;
    hook.deps = deps ? [...deps] : [];
    hook.initialized = true;
  }

  // Store cleanup function for component unmount
  if (!component.effectCleanups) {
    component.effectCleanups = [];
  }

  // Clean up old cleanup if it's different (defensive programming to prevent memory leaks)
  if (
    component.effectCleanups[index] &&
    component.effectCleanups[index] !== hook.cleanup &&
    typeof component.effectCleanups[index] === 'function'
  ) {
    try {
      component.effectCleanups[index]();
    } catch (error) {
      console.error('Error in effect cleanup:', error);
    }
  }

  // Replace existing cleanup for this hook
  component.effectCleanups[index] = hook.cleanup;
}

export function useMemo(fn, deps) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    component.hooks[index] = { value: undefined, deps: [] };
  }

  const hook = component.hooks[index];
  const hasChanged = !deps || !hook.deps || deps.some((dep, i) => dep !== hook.deps[i]);

  if (hasChanged) {
    hook.value = fn();
    hook.deps = deps ? [...deps] : [];
  }

  return hook.value;
}

export function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
}

export function useRef(initialValue) {
  const component = getCurrentComponent();
  const index = getNextHookIndex();

  if (!component.hooks[index]) {
    component.hooks[index] = { current: initialValue };
  }

  return component.hooks[index];
}

export function useContext(context) {
  const component = getCurrentComponent();

  // Start from current component and walk up the tree
  let current = component;
  while (current) {
    if (current.providedContext === context) {
      return current.contextValue;
    }
    current = current.parent;
  }

  return context.defaultValue;
}

export function createContext(defaultValue) {
  const context = {
    defaultValue,
    Provider: (props) => {
      const component = getCurrentComponent();
      component.providedContext = context;
      component.contextValue = props.value;
      return props.children;
    },
  };

  return context;
}

export function cleanupComponentEffects(component) {
  if (component.effectCleanups) {
    component.effectCleanups.forEach((cleanup) => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    });
    component.effectCleanups = [];
  }
}
