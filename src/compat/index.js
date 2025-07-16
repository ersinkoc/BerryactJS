// React Compatibility Layer for Berryact
// This module provides React-compatible APIs to ease migration

import { signal, computed, effect, batch, untrack } from '../core/signal.js';

import {
  defineComponent,
  createComponent,
  Component as BerryactComponent,
} from '../core/component.js';

import {
  useSignal,
  useComputed,
  useEffect as useBerryactEffect,
  useMemo as useBerryactMemo,
  useCallback as useBerryactCallback,
  useRef as useBerryactRef,
  useContext as useBerryactContext,
  createContext as createBerryactContext,
} from '../core/hooks.js';

import {
  jsx,
  jsxs,
  Fragment,
  isValidElement,
  cloneElement,
  createElement,
} from '../jsx-runtime.js';

import { createVNode } from '../core/vdom.js';

// React-compatible hooks
export function useState(initialValue) {
  const sig = useSignal(typeof initialValue === 'function' ? initialValue() : initialValue);

  const setter = (newValue) => {
    if (typeof newValue === 'function') {
      sig.value = newValue(sig.value);
    } else {
      sig.value = newValue;
    }
  };

  // Return array like React
  return [sig.value, setter];
}

export function useReducer(reducer, initialState, init) {
  const state = useSignal(init ? init(initialState) : initialState);

  const dispatch = (action) => {
    state.value = reducer(state.value, action);
  };

  return [state.value, dispatch];
}

export function useEffect(effectFn, deps) {
  // Map React's useEffect to Berryact's
  return useBerryactEffect(effectFn, deps);
}

export function useLayoutEffect(effectFn, deps) {
  // In Berryact, effects run synchronously like useLayoutEffect
  return useBerryactEffect(effectFn, deps);
}

export function useMemo(factory, deps) {
  return useBerryactMemo(factory, deps);
}

export function useCallback(callback, deps) {
  return useBerryactCallback(callback, deps);
}

export function useRef(initialValue) {
  const ref = useBerryactRef(initialValue);
  // Ensure it has React-compatible shape
  if (!('current' in ref)) {
    return { current: ref };
  }
  return ref;
}

export function useContext(context) {
  return useBerryactContext(context);
}

export function createContext(defaultValue) {
  return createBerryactContext(defaultValue);
}

// Additional React hooks
export function useImperativeHandle(ref, createHandle, deps) {
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(createHandle());
    } else if (ref && 'current' in ref) {
      ref.current = createHandle();
    }
  }, deps);
}

export function useDebugValue(value, format) {
  // No-op in production, could be used by devtools
  if (process.env.NODE_ENV !== 'production') {
    // Store debug value for devtools
    const currentComponent = getCurrentComponent();
    if (currentComponent) {
      currentComponent._debugValues = currentComponent._debugValues || [];
      currentComponent._debugValues.push(format ? format(value) : value);
    }
  }
}

export function useId() {
  const id = useRef(null);
  if (id.current === null) {
    id.current = `:r${Math.random().toString(36).substr(2, 9)}:`;
  }
  return id.current;
}

// React 18 concurrent features (simplified implementations)
export function useTransition() {
  const [isPending, setIsPending] = useState(false);

  const startTransition = (callback) => {
    setIsPending(true);
    // In Berryact, we'll use setTimeout to defer the update
    setTimeout(() => {
      batch(() => {
        callback();
        setIsPending(false);
      });
    }, 0);
  };

  return [isPending, startTransition];
}

export function useDeferredValue(value) {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return deferredValue;
}

export function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const value = useSignal(getSnapshot());

  useEffect(() => {
    const handleChange = () => {
      value.value = getSnapshot();
    };

    const unsubscribe = subscribe(handleChange);

    // Check for changes that might have happened between render and effect
    handleChange();

    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return value.value;
}

// Class component compatibility
export class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
    this._stateSignal = signal(this.state);
    this._mounted = false;
  }

  setState(updater, callback) {
    batch(() => {
      if (typeof updater === 'function') {
        this.state = { ...this.state, ...updater(this.state, this.props) };
      } else {
        this.state = { ...this.state, ...updater };
      }
      this._stateSignal.value = this.state;

      if (callback) {
        setTimeout(callback, 0);
      }
    });
  }

  forceUpdate(callback) {
    this._stateSignal.notify();
    if (callback) {
      setTimeout(callback, 0);
    }
  }

  // Lifecycle methods (will be called by the framework)
  componentDidMount() {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillUnmount() {}
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }
  componentDidCatch(error, errorInfo) {}

  render() {
    throw new Error('Component must implement render method');
  }
}

export class PureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }
}

// Helper function for shallow comparison
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

// Synthetic events
export function createSyntheticEvent(nativeEvent, eventType) {
  const syntheticEvent = {
    nativeEvent,
    type: eventType,
    target: nativeEvent.target,
    currentTarget: nativeEvent.currentTarget,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    defaultPrevented: false,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    timeStamp: nativeEvent.timeStamp,

    preventDefault() {
      this.defaultPrevented = true;
      nativeEvent.preventDefault();
    },

    stopPropagation() {
      nativeEvent.stopPropagation();
    },

    persist() {
      // No-op - Berryact doesn't pool events
    },
  };

  // Copy event-specific properties
  if (nativeEvent instanceof MouseEvent) {
    Object.assign(syntheticEvent, {
      clientX: nativeEvent.clientX,
      clientY: nativeEvent.clientY,
      pageX: nativeEvent.pageX,
      pageY: nativeEvent.pageY,
      screenX: nativeEvent.screenX,
      screenY: nativeEvent.screenY,
      button: nativeEvent.button,
      buttons: nativeEvent.buttons,
      ctrlKey: nativeEvent.ctrlKey,
      shiftKey: nativeEvent.shiftKey,
      altKey: nativeEvent.altKey,
      metaKey: nativeEvent.metaKey,
    });
  } else if (nativeEvent instanceof KeyboardEvent) {
    Object.assign(syntheticEvent, {
      key: nativeEvent.key,
      code: nativeEvent.code,
      keyCode: nativeEvent.keyCode,
      charCode: nativeEvent.charCode,
      ctrlKey: nativeEvent.ctrlKey,
      shiftKey: nativeEvent.shiftKey,
      altKey: nativeEvent.altKey,
      metaKey: nativeEvent.metaKey,
    });
  } else if (nativeEvent instanceof Event && nativeEvent.target instanceof HTMLInputElement) {
    Object.assign(syntheticEvent, {
      value: nativeEvent.target.value,
      checked: nativeEvent.target.checked,
    });
  }

  return syntheticEvent;
}

// React API exports
export const Children = {
  map(children, fn, thisArg) {
    if (children == null) return null;
    const result = [];
    Children.forEach(children, (child, index) => {
      result.push(fn.call(thisArg, child, index));
    });
    return result;
  },

  forEach(children, fn, thisArg) {
    if (children == null) return;
    const childrenArray = Array.isArray(children) ? children : [children];
    childrenArray.forEach((child, index) => {
      fn.call(thisArg, child, index);
    });
  },

  count(children) {
    if (children == null) return 0;
    return Array.isArray(children) ? children.length : 1;
  },

  only(children) {
    if (!isValidElement(children)) {
      throw new Error('React.Children.only expected to receive a single React element child.');
    }
    return children;
  },

  toArray(children) {
    if (children == null) return [];
    return Array.isArray(children) ? children : [children];
  },
};

// Portals
export function createPortal(children, container) {
  return createVNode('portal', { container }, children);
}

// Memo and forwardRef
export function memo(Component, propsAreEqual) {
  const MemoizedComponent = (props) => {
    const prevPropsRef = useRef();
    const prevResultRef = useRef();

    if (
      prevPropsRef.current &&
      (propsAreEqual
        ? propsAreEqual(prevPropsRef.current, props)
        : shallowEqual(prevPropsRef.current, props))
    ) {
      return prevResultRef.current;
    }

    prevPropsRef.current = props;
    prevResultRef.current = Component(props);

    return prevResultRef.current;
  };

  MemoizedComponent.displayName = `memo(${Component.displayName || Component.name || 'Component'})`;

  return MemoizedComponent;
}

export function forwardRef(render) {
  const ForwardRefComponent = (props, ref) => {
    return render(props, ref);
  };

  ForwardRefComponent.displayName = `forwardRef(${render.displayName || render.name || 'Component'})`;
  ForwardRefComponent.$$typeof = Symbol.for('react.forward_ref');
  ForwardRefComponent.render = render;

  return ForwardRefComponent;
}

// Lazy loading
export function lazy(importFn) {
  let status = 'pending';
  let result;
  let promise;

  const LazyComponent = (props) => {
    if (status === 'pending') {
      if (!promise) {
        promise = importFn().then(
          (module) => {
            status = 'resolved';
            result = module.default || module;
          },
          (error) => {
            status = 'rejected';
            result = error;
          }
        );
      }
      throw promise;
    }

    if (status === 'rejected') {
      throw result;
    }

    return createElement(result, props);
  };

  LazyComponent.$$typeof = Symbol.for('react.lazy');

  return LazyComponent;
}

// Suspense (simplified)
export function Suspense({ children, fallback }) {
  // This is a simplified implementation
  // Real Suspense would catch promises thrown by children
  return children;
}

// StrictMode (no-op in Berryact)
export function StrictMode({ children }) {
  return children;
}

// Profiler (simplified)
export function Profiler({ id, onRender, children }) {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    if (onRender) {
      onRender(id, 'mount', endTime - startTime);
    }
  });

  return children;
}

// Re-export JSX runtime functions
export { jsx, jsxs, Fragment, isValidElement, cloneElement, createElement };

// Main React namespace export
const React = {
  // Core
  createElement,
  cloneElement,
  isValidElement,

  // Components
  Component,
  PureComponent,
  memo,
  forwardRef,
  lazy,
  Suspense,
  StrictMode,
  Profiler,
  Fragment,

  // Hooks
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  createContext,
  useImperativeHandle,
  useDebugValue,
  useId,
  useTransition,
  useDeferredValue,
  useSyncExternalStore,

  // Utilities
  Children,
  createPortal,

  // Version
  version: '18.2.0-berryact',
};

export default React;

// Helper to get current component (for devtools)
function getCurrentComponent() {
  // This would be implemented by the framework
  return null;
}
