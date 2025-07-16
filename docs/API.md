# Berryact API Reference

## Core API

### Signals

#### `signal(initialValue)`

Creates a reactive signal.

```javascript
const count = signal(0);
console.log(count.value); // 0
count.value = 5;
console.log(count.value); // 5
```

**Methods:**
- `peek()` - Get value without tracking dependencies
- `notify()` - Manually trigger updates
- `dispose()` - Clean up signal

#### `computed(fn)`

Creates a computed signal that automatically updates when dependencies change.

```javascript
const count = signal(0);
const doubled = computed(() => count.value * 2);
```

#### `effect(fn, options?)`

Creates a side effect that runs when dependencies change.

```javascript
const count = signal(0);
effect(() => {
    console.log('Count:', count.value);
});
```

**Options:**
- `immediate?: boolean` - Run immediately (default: true)

#### `batch(fn)`

Batches multiple updates into a single update cycle.

```javascript
batch(() => {
    count.value = 1;
    name.value = 'John';
    // UI updates once after both changes
});
```

#### `untrack(fn)`

Runs function without tracking dependencies.

```javascript
const result = untrack(() => {
    return someSignal.value; // Won't create dependency
});
```

## Components

### `defineComponent(renderFn)`

Creates a component class from a render function.

```javascript
const Counter = defineComponent((props) => {
    const count = signal(props.initial || 0);
    return html`<div>${count}</div>`;
});
```

### `createComponent(renderFn, props?)`

Creates a component instance.

```javascript
const instance = createComponent(Counter, { initial: 5 });
```

### Component Class

```javascript
class MyComponent extends Component {
    render() {
        return html`<div>Hello World</div>`;
    }
}
```

**Methods:**
- `mount(container?)` - Mount component to DOM
- `unmount()` - Remove component from DOM
- `update()` - Force update component
- `setProps(newProps)` - Update component props

## Hooks

### `useState(initialValue)`

Returns stateful value and setter.

```javascript
const [count, setCount] = useState(0);
setCount(count() + 1);
```

### `useSignal(initialValue)`

Returns a signal for state management.

```javascript
const count = useSignal(0);
count.value++; // Direct mutation
```

### `useComputed(fn)`

Returns a computed signal.

```javascript
const doubled = useComputed(() => count.value * 2);
```

### `useEffect(fn, deps?)`

Runs side effect on component updates.

```javascript
useEffect(() => {
    document.title = `Count: ${count()}`;
}, [count]);
```

### `useMemo(fn, deps?)`

Memoizes expensive computations.

```javascript
const expensiveValue = useMemo(() => {
    return heavyComputation(data);
}, [data]);
```

### `useCallback(fn, deps?)`

Memoizes function references.

```javascript
const handleClick = useCallback(() => {
    setCount(count() + 1);
}, [count]);
```

### `useRef(initialValue)`

Returns mutable ref object.

```javascript
const inputRef = useRef(null);
// In template: <input ref=${inputRef} />
```

### `useContext(context)`

Consumes context value.

```javascript
const theme = useContext(ThemeContext);
```

### `createContext(defaultValue)`

Creates context object.

```javascript
const ThemeContext = createContext('light');

// Provider
function App() {
    return html`
        <${ThemeContext.Provider} value="dark">
            <Content />
        </ThemeContext.Provider>
    `;
}
```

## Templates

### `html\`template\``

Tagged template literal for creating templates.

```javascript
const template = html`
    <div class="container">
        <h1>${title}</h1>
        <button @click=${handleClick}>Click me</button>
    </div>
`;
```

**Supported features:**
- Expressions: `${value}`
- Event handlers: `@click=${handler}` or `onclick=${handler}`
- Attributes: `class=${className}`
- Directives: `n-if=${condition}`

### `fragment(...children)`

Creates document fragment.

```javascript
const items = fragment(
    html`<li>Item 1</li>`,
    html`<li>Item 2</li>`
);
```

## Directives

### Built-in Directives

#### `n-if`
Conditional rendering.

```javascript
html`<div n-if=${isVisible}>Content</div>`
```

#### `n-show`
Show/hide element.

```javascript
html`<div n-show=${isVisible}>Content</div>`
```

#### `n-model`
Two-way data binding.

```javascript
const value = signal('');
html`<input n-model=${value} />`
```

#### `n-for`
List rendering.

```javascript
html`
    <template n-for=${items}>
        <li n-for-item></li>
    </template>
`
```

#### `n-class`
Class binding.

```javascript
html`<div n-class=${{ active: isActive, disabled: !enabled }}>Content</div>`
```

#### `n-style`
Style binding.

```javascript
html`<div n-style=${{ color: textColor, fontSize: size + 'px' }}>Content</div>`
```

### `registerDirective(name, handler)`

Register custom directive.

```javascript
registerDirective('focus', (element, value) => {
    if (value) element.focus();
});
```

## Router

### `createRouter(options?)`

Creates router instance.

```javascript
const router = createRouter({
    mode: 'history', // 'history' | 'hash' | 'memory'
    base: '/app',
    routes: [
        { path: '/', component: Home },
        { path: '/users/:id', component: User }
    ]
});
```

### Router Methods

#### `addRoute(path, component, options?)`

Add single route.

```javascript
router.addRoute('/users/:id', UserComponent, {
    name: 'user',
    beforeEnter: requireAuth,
    meta: { requiresAuth: true }
});
```

#### `addRoutes(routes)`

Add multiple routes.

```javascript
router.addRoutes([
    { path: '/home', component: Home },
    { path: '/about', component: About }
]);
```

#### Navigation

```javascript
router.push('/users/123');
router.replace('/home');
router.go(-1);
router.back();
router.forward();
```

#### Guards

```javascript
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        next('/login');
    } else {
        next();
    }
});

router.afterEach((to, from) => {
    trackPageView(to.path);
});
```

### Router Properties

- `currentRoute` - Signal containing current route
- `params` - Signal containing route parameters  
- `query` - Signal containing query parameters
- `hash` - Signal containing hash fragment

## Store

### `createStore(options)`

Creates store instance.

```javascript
const store = createStore({
    state: { count: 0 },
    getters: {
        doubled: state => state.count * 2
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    },
    actions: {
        async incrementAsync(context) {
            await delay(1000);
            context.commit('increment');
        }
    }
});
```

### Store Methods

#### `commit(type, payload?, options?)`

Commit mutation.

```javascript
store.commit('increment');
store.commit('setUser', userData);
```

#### `dispatch(type, payload?)`

Dispatch action.

```javascript
await store.dispatch('fetchUser', userId);
```

#### `subscribe(fn)`

Subscribe to state changes.

```javascript
const unsubscribe = store.subscribe((state) => {
    console.log('State changed:', state);
});
```

#### `watch(getter, callback, options?)`

Watch specific state.

```javascript
store.watch(
    state => state.user.name,
    (newName, oldName) => {
        console.log(`Name changed: ${oldName} -> ${newName}`);
    }
);
```

### Modules

```javascript
const userModule = {
    namespaced: true,
    state: { profile: null },
    mutations: {
        setProfile(state, profile) {
            state.profile = profile;
        }
    }
};

const store = createStore({
    modules: {
        user: userModule
    }
});

// Usage
store.commit('user/setProfile', profileData);
```

### Plugins

Built-in plugins:

```javascript
import { createLogger, createPersistedState } from '@oxog/berryact';

const store = createStore({
    plugins: [
        createLogger(),
        createPersistedState({ key: 'app-state' })
    ]
});
```

## Application

### `createApp(component, options?)`

Creates application instance.

```javascript
const app = createApp(RootComponent, { title: 'My App' });
```

### App Methods

#### `use(plugin, ...args)`

Install plugin.

```javascript
app.use(router);
app.use(store);
app.use(myPlugin, { option: true });
```

#### `mount(container)`

Mount application.

```javascript
const instance = app.mount('#app');
// Returns: { unmount(), component }
```

## Utilities

### Type Checking

```javascript
import { isSignal, isComponent, isArray } from '@oxog/berryact';

if (isSignal(value)) {
    console.log(value.value);
}
```

### Error Handling

```javascript
import { warn, BerryactError } from '@oxog/berryact';

warn('Component prop missing');
throw new BerryactError('Invalid state', 'STATE_ERROR');
```

### DevTools

```javascript
import { devtools } from '@oxog/berryact';

// Available in development
window.$berryact.inspectComponent(id);
window.$berryact.getPerformance();
```

## Configuration

### Environment Variables

- `NODE_ENV` - Controls development warnings and devtools
- Development mode enables additional checks and warnings

### TypeScript

Full TypeScript support with included definitions:

```typescript
import { Signal, Component } from '@oxog/berryact';

interface Props {
    count: number;
    onIncrement: () => void;
}

const Counter: Component<Props> = (props) => {
    // Type-safe component
};
```