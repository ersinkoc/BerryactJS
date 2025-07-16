// Core reactive system
import { 
  signal, 
  computed, 
  effect, 
  batch, 
  untrack, 
  isSignal 
} from './core/signal.js';

export { 
  signal, 
  computed, 
  effect, 
  batch, 
  untrack, 
  isSignal 
};

// SolidJS/React compatibility aliases
export const createSignal = (value) => {
  const sig = signal(value);
  return [() => sig.value, (newValue) => { sig.value = newValue; }];
};

export const createEffect = effect;

// Component system
import { 
  Component, 
  defineComponent, 
  createComponent 
} from './core/component.js';

export { 
  Component, 
  defineComponent, 
  createComponent 
};

// Hooks
export {
  useState,
  useSignal,
  useComputed,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  createContext
} from './core/hooks.js';

// Template engine - Enhanced version with JSX-like features
import { 
  html, 
  fragment, 
  component,
  portal
} from './template/enhanced-parser.js';

export { 
  html, 
  fragment, 
  component,
  portal
};

// Legacy template parser for backward compatibility
export { 
  html as htmlLegacy,
  TemplateNode 
} from './template/parser.js';

export { 
  compileTemplate 
} from './template/compiler.js';

export { 
  registerDirective, 
  processDirectives 
} from './template/directives.js';

// Rendering
export { 
  DOMRenderer, 
  renderer 
} from './render/dom.js';

export { 
  diffAndPatch, 
  createListDiffer 
} from './render/patch.js';

export { 
  scheduleRender, 
  schedulePostRender, 
  nextTick, 
  flushSync, 
  deferredUpdates, 
  unstable_batchedUpdates,
  scheduler
} from './render/scheduler.js';

// Router
import { 
  Router, 
  createRouter 
} from './router/index.js';

export { 
  Router, 
  createRouter 
};

export { 
  HistoryManager, 
  MemoryHistory 
} from './router/history.js';

export {
  RouteGuard,
  NavigationRedirect,
  createNavigationGuard,
  requireAuth,
  requireRole,
  confirmLeave,
  logNavigation,
  trackPageView,
  setDocumentTitle,
  scrollToTop,
  preserveScroll
} from './router/guards.js';

// Store
import { 
  Store, 
  createStore 
} from './store/index.js';

export { 
  Store, 
  createStore 
};

export {
  StoreModule,
  createModule,
  mapState,
  mapGetters,
  mapMutations,
  mapActions
} from './store/module.js';

export {
  createLogger,
  createPersistedState,
  createMultiTabSync,
  createSnapshot,
  createDevtools,
  createThrottledUpdates
} from './store/plugins.js';

// Utilities
export { 
  BerryactError, 
  createErrorHandler, 
  errorHandler, 
  warn, 
  deprecate 
} from './utils/error.js';

export {
  isObject,
  isPlainObject,
  isArray,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isUndefined,
  isNull,
  isPrimitive,
  isEmpty,
  isPromise,
  isElement,
  isComponent,
  isDefined,
  hasOwn,
  isEqual,
  clone
} from './utils/is.js';

// DevTools
export { 
  DevTools, 
  devtools 
} from './devtools/index.js';

// Plugin System
export {
  Plugin,
  PluginPhase,
  PluginContext,
  PluginManager,
  createPlugin,
  DevToolsPlugin,
  LoggerPlugin,
  PerformancePlugin
} from './core/plugin.js';

// Enhanced reactivity
export {
  signal as enhancedSignal,
  computed as enhancedComputed,
  effect as enhancedEffect,
  readonly,
  writable,
  debouncedSignal,
  isComputed,
  isReadonly,
  getPerformanceMetrics,
  resetReactiveSystem
} from './core/signal-enhanced.js';

// Advanced components
export {
  createPortal,
  Portal,
  getPortal,
  closePortal,
  createModal,
  createTooltip,
  PortalTargets
} from './core/portal.js';

export {
  Suspense,
  createResource,
  useResource,
  useDeferredValue,
  useTransition,
  lazy,
  preload,
  createFetcher,
  SuspenseList
} from './core/suspense.js';

export {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  AsyncErrorBoundary,
  ErrorOverlay,
  onError,
  createErrorLogger
} from './core/error-boundary.js';

// Middleware
export {
  compose,
  MiddlewarePipeline,
  RouterMiddleware,
  StoreMiddleware,
  createMiddlewarePipeline
} from './core/middleware.js';

// Built-in plugins
export {
  I18nPlugin,
  createI18n,
  T as TranslationComponent,
  createI18nDirective
} from './plugins/i18n.js';

export {
  VirtualScrollerPlugin,
  VirtualScroller
} from './plugins/virtual-scroller.js';

export {
  TimeTravelPlugin,
  TimeTravelDebugger
} from './plugins/time-travel.js';

export {
  A11yPlugin,
  createA11yDirective,
  ConformanceLevel as A11yConformanceLevel
} from './plugins/a11y.js';

export {
  ServiceWorkerPlugin,
  CacheStrategy,
  WorkerState,
  generateServiceWorker
} from './plugins/service-worker.js';

export {
  BuildOptimizerPlugin
} from './plugins/build-optimizer.js';

// Forms
export {
  FormField,
  FormGroup,
  FormArray,
  Validators,
  createForm,
  useForm,
  ReactiveFormsPlugin
} from './forms/reactive-forms.js';

// Router enhancements
export {
  TransitionManager,
  TransitionState,
  TransitionType,
  Transition,
  TransitionGroup,
  createTransition,
  createTransitionDirective,
  injectTransitionStyles
} from './router/transitions.js';

// Testing utilities
export {
  TestRenderer,
  render,
  cleanup,
  act,
  waitFor,
  waitForEffects,
  fireEvent,
  screen,
  createMockFunction,
  renderHook,
  createTestStore,
  toMatchSnapshot,
  matchers as testMatchers
} from './testing/test-utils.js';

// Main application API
import { PluginManager } from './core/plugin.js';

export function createApp(component, options = {}) {
  const app = {
    component,
    options,
    router: null,
    store: null,
    plugins: [],
    pluginManager: null,
    version: '1.0.0',
    
    use(plugin, ...args) {
      // Initialize plugin manager on first use
      if (!this.pluginManager) {
        this.pluginManager = new PluginManager(this);
        this.pluginContext = this.pluginManager.context;
      }
      
      // Use new plugin system
      this.pluginManager.use(plugin, ...args);
      
      // Keep backward compatibility
      if (typeof plugin === 'function') {
        plugin(this, ...args);
      } else if (plugin && typeof plugin.install === 'function' && !plugin.setup) {
        plugin.install(this, ...args);
      }
      
      this.plugins.push(plugin);
      return this;
    },
    
    useRouter(router) {
      this.router = router;
      if (this.pluginManager) {
        this.pluginManager.callHook('app:router', router);
      }
      return this;
    },
    
    useStore(store) {
      this.store = store;
      if (this.pluginManager) {
        this.pluginManager.callHook('app:store', store);
      }
      return this;
    },
    
    mount(container) {
      if (typeof container === 'string') {
        container = document.querySelector(container);
      }
      
      if (!container) {
        throw new Error('Container element not found');
      }
      
      // Call before mount hooks
      if (this.pluginManager) {
        this.pluginManager.callHook('app:beforeMount', container);
      }
      
      // Handle both component classes and render functions
      let instance;
      if (typeof component === 'function' && component.prototype && component.prototype.render) {
        // It's a component class
        instance = new component(this.options);
      } else {
        // It's a render function
        instance = createComponent(component, this.options);
      }
      
      if (this.router) {
        instance.router = this.router;
      }
      
      if (this.store) {
        instance.store = this.store;
      }
      
      instance.mount(container);
      
      // Call mounted hooks
      if (this.pluginManager) {
        this.pluginManager.callHook('app:mounted', instance);
      }
      
      return {
        unmount: () => {
          if (this.pluginManager) {
            this.pluginManager.callHook('app:beforeUnmount', instance);
          }
          instance.unmount();
          if (this.pluginManager) {
            this.pluginManager.callHook('app:unmounted');
          }
        },
        component: instance
      };
    }
  };
  
  return app;
}

// Version
export const version = '1.0.0';

// Development mode check
export const isDev = process.env.NODE_ENV !== 'production';

// JSX Runtime exports
import { jsx, jsxs, Fragment } from './jsx-runtime.js';
export * from './jsx-runtime.js';

// VDOM exports
export {
  createVNode,
  Fragment as BerryactFragment,
  Portal as BerryactPortal,
  isVNode,
  cloneVNode
} from './core/vdom.js';

// Default export for convenience
export default {
  createApp,
  signal,
  computed,
  effect,
  html,
  defineComponent,
  createRouter,
  createStore,
  version,
  jsx,
  jsxs,
  Fragment
};