# Migrating from React to Berryact

This guide will help you migrate your React applications to the Berryact framework. While the concepts are similar, there are some key differences in syntax and patterns.

## Core Concepts Comparison

### Components

**React:**
```jsx
function MyComponent({ name, children }) {
  return <div className="card">Hello {name}! {children}</div>;
}
```

**Berryact:**
```javascript
function MyComponent({ name, children }) {
  return html`<div class="card">Hello ${name}! ${children}</div>`;
}
```

### State Management

**React:**
```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**Berryact:**
```javascript
import { useState, html } from '@oxog/berryact';

function Counter() {
  const [count, setCount] = useState(0);
  
  return html`
    <div>
      <p>${count}</p>
      <button @click=${() => setCount(count + 1)}>Increment</button>
    </div>
  `;
}
```

### Effects

**React:**
```jsx
import { useEffect } from 'react';

function DataLoader() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{data ? data.title : 'Loading...'}</div>;
}
```

**Berryact:**
```javascript
import { useState, useEffect, html } from '@oxog/berryact';

function DataLoader() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return html`<div>${data ? data.title : 'Loading...'}</div>`;
}
```

## Key Differences

### 1. Template Syntax

- **React** uses JSX: `<div className="container">{content}</div>`
- **Berryact** uses tagged template literals: `html\`<div class="container">${content}</div>\``

### 2. Event Handling

- **React**: `onClick={handler}`
- **Berryact**: `@click=${handler}`

### 3. CSS Classes

- **React**: `className="my-class"`
- **Berryact**: `class="my-class"`

### 4. Conditional Rendering

**React:**
```jsx
{condition && <div>Conditional content</div>}
{condition ? <div>True</div> : <div>False</div>}
```

**Berryact:**
```javascript
${condition ? html`<div>Conditional content</div>` : ''}
${condition ? html`<div>True</div>` : html`<div>False</div>`}
```

### 5. Lists

**React:**
```jsx
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

**Berryact:**
```javascript
${items.map(item => html`<li key=${item.id}>${item.name}</li>`)}
```

## Advanced Patterns

### Context

**React:**
```jsx
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}

function Header() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Header</div>;
}
```

**Berryact:**
```javascript
import { createContext, useContext, html } from '@oxog/berryact';

const ThemeContext = createContext();

function App() {
  return html`
    <${ThemeContext.Provider} value="dark">
      <${Header} />
    </${ThemeContext.Provider}>
  `;
}

function Header() {
  const theme = useContext(ThemeContext);
  return html`<div class=${theme}>Header</div>`;
}
```

### Reducers

**React:**
```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  
  return (
    <button onClick={() => dispatch({ type: 'increment' })}>
      {state.count}
    </button>
  );
}
```

**Berryact:**
```javascript
import { useReducer, html } from '@oxog/berryact';

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  
  return html`
    <button @click=${() => dispatch({ type: 'increment' })}>
      ${state.count}
    </button>
  `;
}
```

## State Management

### From Redux to Berryact Store

**React + Redux:**
```jsx
import { Provider, useSelector, useDispatch } from 'react-redux';

const store = createStore(reducer);

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  
  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      {count}
    </button>
  );
}
```

**Berryact Store:**
```javascript
import { createStore, html } from '@oxog/berryact';

const store = createStore({
  state: { count: 0 },
  
  mutations: {
    increment(state) {
      state.count++;
    }
  },
  
  actions: {
    increment({ commit }) {
      commit('increment');
    }
  }
});

function Counter() {
  const count = computed(() => store.state.count);
  
  return html`
    <button @click=${() => store.dispatch('increment')}>
      ${count}
    </button>
  `;
}

function App() {
  return html`<${Counter} />`;
}

const app = createApp(App);
app.useStore(store);
app.mount('#app');
```

## Routing

### From React Router to Berryact Router

**React Router:**
```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Berryact Router:**
```javascript
import { createRouter, html } from '@oxog/berryact';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

function App() {
  return html`
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
    <router-outlet></router-outlet>
  `;
}

const app = createApp(App);
app.useRouter(router);
app.mount('#app');
```

## Migration Strategy

### 1. Start Small
Begin by migrating individual components rather than the entire application. Berryact components can coexist with React components during the transition.

### 2. Update Templates First
Replace JSX with tagged template literals:
- Change `<div className="foo">` to `<div class="foo">`
- Change `{expression}` to `${expression}`
- Change `onClick` to `@click`

### 3. Migrate State Management
Replace React hooks with Berryact equivalents:
- `useState` works identically
- `useEffect` has the same API
- `useContext` works the same way

### 4. Update Build Process
Remove JSX compilation from your build process since Berryact doesn't require it.

### 5. Testing
Berryact components can be tested using the same testing libraries as React components, with minor syntax adjustments.

## Performance Benefits

After migration, you can expect:

- **Smaller bundle size**: ~5KB vs ~42KB for React
- **Faster startup**: No virtual DOM reconciliation
- **Better memory usage**: Direct DOM manipulation
- **Fine-grained reactivity**: Only update what changed

## Common Gotchas

### 1. Template Literal Escaping
Be careful with quotes in template literals:
```javascript
// Wrong
html`<div onclick="alert('hello')">Click</div>`

// Right
html`<div @click=${() => alert('hello')}>Click</div>`
```

### 2. Conditional Rendering
Always use ternary operators or short-circuit evaluation:
```javascript
// Wrong
${condition && html`<div>Content</div>`}

// Right
${condition ? html`<div>Content</div>` : ''}
```

### 3. Event Binding
Use arrow functions to maintain context:
```javascript
// Wrong
<button @click=${this.handleClick}>

// Right
<button @click=${() => this.handleClick()}>
```

## Tooling

### Development
- Use Vite or Rollup for fast builds
- ESLint with template literal support
- Browser dev tools work natively

### Testing
- Jest with jsdom
- Testing Library with Berryact adapters
- Cypress for e2e testing

### Code Style
- Prettier for template literal formatting
- EditorConfig for consistent spacing
- TypeScript for type safety

## Next Steps

1. **Start with a simple component** to get familiar with the syntax
2. **Set up the build process** without JSX compilation
3. **Migrate your state management** to Berryact's store or keep using React patterns
4. **Update your routing** to use Berryact's router
5. **Optimize performance** using Berryact's fine-grained reactivity

For more detailed examples, check out our [real-world application example](../examples/real-world/) which demonstrates a complete Conduit clone built with Berryact.