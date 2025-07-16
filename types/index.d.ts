// Core Types
export interface Signal<T = any> {
  value: T;
  peek(): T;
  notify(): void;
  dispose(): void;
  readonly version: number;
}

export interface ComputedSignal<T = any> extends Signal<T> {
  readonly value: T;
}

export interface Effect {
  dependencies: Set<Signal>;
  active: boolean;
  execute(): void;
  dispose(): void;
}

// Signal functions
export function signal<T>(initialValue: T): Signal<T>;
export function computed<T>(fn: () => T): ComputedSignal<T>;
export function effect(fn: () => void | (() => void), options?: { immediate?: boolean }): Effect;
export function batch<T>(fn: () => T): T;
export function untrack<T>(fn: () => T): T;
export function isSignal(value: any): value is Signal;

// Component Types
export interface ComponentProps {
  [key: string]: any;
  key?: string | number;
  children?: any;
}

export abstract class Component<P = ComponentProps> {
  props: Signal<P>;
  hooks: any[];
  effects: Effect[];
  isMounted: boolean;
  element: Element | null;
  children: Component[];
  parent: Component | null;
  key?: string | number;

  constructor(props?: P);
  abstract render(): any;
  mount(container?: Element): void;
  unmount(): void;
  update(): void;
  shouldUpdate(): boolean;
  setProps(newProps: Partial<P>): void;
}

export type ComponentFunction<P = ComponentProps> = (props: P) => any;

export function defineComponent<P = ComponentProps>(
  renderFn: ComponentFunction<P>
): new (props?: P) => Component<P>;

export function createComponent<P = ComponentProps>(
  renderFn: ComponentFunction<P>, 
  props?: P
): Component<P>;

// Hooks
export function useState<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void];
export function useSignal<T>(initialValue: T): Signal<T>;
export function useComputed<T>(fn: () => T): ComputedSignal<T>;
export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
export function useMemo<T>(fn: () => T, deps?: any[]): T;
export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;
export function useRef<T>(initialValue: T): { current: T };

export interface Context<T = any> {
  defaultValue: T;
  Provider: ComponentFunction<{ value: T; children: any }>;
}

export function useContext<T>(context: Context<T>): T;
export function createContext<T>(defaultValue: T): Context<T>;

// Template Types
export interface TemplateNode {
  type: 'element' | 'text' | 'fragment';
  tag?: string;
  props: Record<string, any>;
  children: any[];
  key?: string | number;
}

export function html(strings: TemplateStringsArray, ...values: any[]): TemplateNode;
export function fragment(...children: any[]): TemplateNode;

// Rendering Types
export interface RenderedElement {
  element: Element | DocumentFragment;
  update(): void;
  unmount(): void;
}

export class DOMRenderer {
  render(template: any, container: Element): RenderedElement | null;
  createElement(tag: string, props?: Record<string, any>, children?: any[]): Element;
  updateProps(element: Element, props: Record<string, any>): void;
  updateChildren(element: Element, children: any[]): void;
  createTextNode(content: string | Signal<string>): Text;
  createFragment(children: any[]): DocumentFragment;
  unmount(element: Element): void;
}

export const renderer: DOMRenderer;

// Router Types
export interface RouteRecord {
  path: string;
  component: ComponentFunction | Component;
  name?: string;
  beforeEnter?: RouteGuard;
  meta?: Record<string, any>;
  children?: RouteRecord[];
}

export interface RouteLocation {
  path: string;
  component: ComponentFunction | Component;
  params: Record<string, string>;
  meta: Record<string, any>;
  matched: RouteRecord[];
  name?: string;
}

export type RouteGuard = (
  to: RouteLocation,
  from: RouteLocation | null,
  next: (result?: boolean | string | { path: string; [key: string]: any }) => void
) => void | boolean | string | { path: string; [key: string]: any } | Promise<any>;

export interface RouterOptions {
  mode?: 'history' | 'hash' | 'memory';
  base?: string;
  notFound?: ComponentFunction;
}

export class Router {
  currentRoute: Signal<RouteLocation | null>;
  params: Signal<Record<string, string>>;
  query: Signal<Record<string, string>>;
  hash: Signal<string>;

  constructor(options?: RouterOptions);
  addRoute(path: string, component: ComponentFunction | Component, options?: Partial<RouteRecord>): Router;
  addRoutes(routes: RouteRecord[]): Router;
  navigate(to: string | { name: string; params?: Record<string, any>; query?: Record<string, any> }): void;
  push(path: string, options?: { replace?: boolean }): void;
  replace(path: string): void;
  go(delta: number): void;
  back(): void;
  forward(): void;
  beforeEach(guard: RouteGuard): void;
  afterEach(guard: (to: RouteLocation, from: RouteLocation | null) => void): void;
  getCurrentRoute(): RouteLocation | null;
  isCurrentRoute(path: string): boolean;
}

export function createRouter(options?: RouterOptions): Router;

// Store Types
export interface StoreOptions<S = any> {
  state?: S;
  getters?: Record<string, (state: S, getters: any) => any>;
  mutations?: Record<string, (state: S, payload?: any) => S | void>;
  actions?: Record<string, (context: ActionContext<S>, payload?: any) => any>;
  modules?: Record<string, StoreModule>;
  plugins?: StorePlugin<S>[];
  strict?: boolean;
  devtools?: boolean;
  maxHistory?: number;
}

export interface ActionContext<S = any> {
  state: S;
  getters: Record<string, any>;
  commit: (type: string, payload?: any, options?: { silent?: boolean }) => void;
  dispatch: (type: string, payload?: any) => Promise<any>;
  rootState?: S;
  rootGetters?: Record<string, any>;
}

export interface StoreModule<S = any> {
  state?: S;
  getters?: Record<string, (state: S, getters: any, rootState: any, rootGetters: any) => any>;
  mutations?: Record<string, (state: S, payload?: any) => S | void>;
  actions?: Record<string, (context: ActionContext<S>, payload?: any) => any>;
  modules?: Record<string, StoreModule>;
  namespaced?: boolean;
}

export type StorePlugin<S = any> = (store: Store<S>) => void;

export class Store<S = any> {
  state: Signal<S>;
  getters: Record<string, ComputedSignal>;

  constructor(options?: StoreOptions<S>);
  commit(type: string, payload?: any, options?: { silent?: boolean }): void;
  dispatch(type: string, payload?: any): Promise<any>;
  subscribe(fn: (state: S) => void): Effect;
  subscribeAction(fn: (action: { type: string; payload?: any }) => void): () => void;
  watch<T>(
    getter: string | ((state: S, getters: any) => T),
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean; deep?: boolean }
  ): Effect;
  registerModule(name: string, module: StoreModule): Store;
  unregisterModule(name: string): void;
  hasModule(name: string): boolean;
  use(plugin: StorePlugin<S>): void;
  replaceState(newState: S): void;
  timeTravel(index: number): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): boolean;
  redo(): boolean;
  getHistory(): Array<{ state: S; mutation: { type: string; payload?: any } | null; timestamp: number }>;
  clearHistory(): void;
}

export function createStore<S = any>(options?: StoreOptions<S>): Store<S>;

// Store Plugins
export interface LoggerOptions {
  collapsed?: boolean;
  filter?: (mutation: any, prevState: any, state: any) => boolean;
  transformer?: (state: any) => any;
  mutationTransformer?: (mutation: any) => any;
  actionFilter?: (action: any, state: any) => boolean;
  actionTransformer?: (action: any) => any;
  logMutations?: boolean;
  logActions?: boolean;
  logger?: Console;
}

export function createLogger<S = any>(options?: LoggerOptions): StorePlugin<S>;

export interface PersistedStateOptions {
  key?: string;
  paths?: string[];
  reducer?: (state: any) => any;
  subscriber?: (store: Store) => (handler: (mutation: any, state: any) => void) => void;
  storage?: Storage;
  getState?: (key: string, storage: Storage) => any;
  setState?: (key: string, state: any, storage: Storage) => void;
}

export function createPersistedState<S = any>(options?: PersistedStateOptions): StorePlugin<S>;

// Application API
export interface App {
  use(plugin: any, ...args: any[]): App;
  useRouter(router: Router): App;
  useStore(store: Store): App;
  mount(container: string | Element): { unmount(): void; component: Component };
}

export function createApp<P = ComponentProps>(
  component: ComponentFunction<P> | Component<P>,
  options?: P
): App;

// Utility Types
export function warn(message: string, component?: Component): void;
export function deprecate(message: string, version: string): void;

export class BerryactError extends Error {
  code?: string;
  component?: Component;
}

// JSX Runtime exports
export function jsx(type: any, props: any, key?: any): any;
export function jsxs(type: any, props: any, key?: any): any;
export function jsxDEV(type: any, props: any, key?: any, isStaticChildren?: boolean, source?: any, self?: any): any;

// Type Guards
export function isObject(value: any): value is object;
export function isArray(value: any): value is any[];
export function isFunction(value: any): value is Function;
export function isString(value: any): value is string;
export function isNumber(value: any): value is number;
export function isBoolean(value: any): value is boolean;
export function isPromise(value: any): value is Promise<any>;
export function isElement(value: any): value is Element;
export function isComponent(value: any): value is Component | ComponentFunction;

// Constants
export const version: string;
export const isDev: boolean;

// Default Export
declare const Berryact: {
  createApp: typeof createApp;
  signal: typeof signal;
  computed: typeof computed;
  effect: typeof effect;
  html: typeof html;
  defineComponent: typeof defineComponent;
  createRouter: typeof createRouter;
  createStore: typeof createStore;
  version: string;
};

export default Berryact;

// JSX namespace
export as namespace JSX;