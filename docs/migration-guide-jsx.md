# Migration Guide: React to Berryact with JSX Support

This guide helps you migrate existing React applications to Berryact while maintaining familiar JSX syntax. Berryact's dual syntax support allows gradual migration and mixing both approaches.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation & Setup](#installation--setup)
3. [Component Migration](#component-migration)
4. [Hook Migration](#hook-migration)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [Styling](#styling)
8. [Testing](#testing)
9. [Performance Tips](#performance-tips)
10. [Common Patterns](#common-patterns)

## Quick Start

### Before (React)
```jsx
import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(`Count: ${count}`);
  }, [count]);
  
  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### After (Berryact with JSX)
```jsx
import { createSignal, createEffect } from '@oxog/berryact';

function Counter() {
  const [count, setCount] = createSignal(0);
  
  createEffect(() => {
    console.log(`Count: ${count()}`);
  }, [count]);
  
  return (
    <div className="counter">
      <h1>Count: {count()}</h1>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Alternative (Berryact with Template Literals - No Build!)
```javascript
import { html, createSignal, createEffect } from '@oxog/berryact';

function Counter() {
  const [count, setCount] = createSignal(0);
  
  createEffect(() => {
    console.log(`Count: ${count()}`);
  }, [count]);
  
  return html`
    <div class="counter">
      <h1>Count: ${count()}</h1>
      <button @click=${() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  `;
}
```

## Installation & Setup

### Step 1: Install Berryact

```bash
npm install @oxog/berryact
npm install -D @oxog/berryact-vite-plugin # if using Vite
# or
npm install -D @oxog/berryact-webpack-plugin # if using Webpack
```

### Step 2: Configure Build Tool

#### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import berryact from '@oxog/berryact/build/vite-plugin';

export default defineConfig({
  plugins: [
    berryact({
      compat: true, // Enable React compatibility mode
      jsxImportSource: '@oxog/berryact'
    })
  ]
});
```

#### Webpack Configuration
```javascript
// webpack.config.js
const { BerryactWebpackPlugin } = require('@oxog/berryact/build/webpack-plugin');

module.exports = {
  // ... other config
  plugins: [
    new BerryactWebpackPlugin({
      compat: true // Enable React compatibility mode
    })
  ]
};
```

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': '@oxog/berryact/compat',
      'react-dom': '@oxog/berryact/compat'
    };
    return config;
  }
};
```

### Step 3: Update tsconfig.json (TypeScript)

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@oxog/berryact",
    "types": ["@oxog/berryact/types/jsx"]
  }
}
```

## Component Migration

### Function Components

React components work almost unchanged:

```jsx
// Works in both React and Berryact!
function Welcome({ name, age }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  );
}
```

### Class Components

Use compatibility mode for class components:

```jsx
import { Component } from '@oxog/berryact/compat';

class Welcome extends Component {
  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}!</h1>
      </div>
    );
  }
}
```

### Component Patterns

#### Children Props
```jsx
// React & Berryact
function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
```

#### Render Props
```jsx
// React & Berryact
function DataProvider({ render }) {
  const data = useData();
  return render(data);
}
```

#### Higher Order Components
```jsx
// React & Berryact
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const isAuth = useAuth();
    return isAuth ? <Component {...props} /> : <Login />;
  };
}
```

## Hook Migration

### State Hooks

```jsx
// React
const [value, setValue] = useState(0);
const [state, dispatch] = useReducer(reducer, initialState);

// Berryact (Compatibility Mode)
import { useState, useReducer } from '@oxog/berryact/compat';
const [value, setValue] = useState(0);
const [state, dispatch] = useReducer(reducer, initialState);

// Berryact (Native)
import { createSignal } from '@oxog/berryact';
const [value, setValue] = createSignal(0);
// Note: Signals are called as functions: value()
```

### Effect Hooks

```jsx
// React
useEffect(() => {
  console.log('Mounted');
  return () => console.log('Cleanup');
}, []);

useLayoutEffect(() => {
  // Synchronous effect
}, [dep]);

// Berryact
import { createEffect } from '@oxog/berryact';
createEffect(() => {
  console.log('Mounted');
  return () => console.log('Cleanup');
}, []);
```

### Memoization Hooks

```jsx
// React
const memoized = useMemo(() => compute(a, b), [a, b]);
const callback = useCallback(() => doSomething(a), [a]);

// Berryact
import { createMemo, useCallback } from '@oxog/berryact';
const memoized = createMemo(() => compute(a(), b()));
const callback = useCallback(() => doSomething(a()), [a]);
```

### Context

```jsx
// React
const ThemeContext = createContext('light');
const theme = useContext(ThemeContext);

// Berryact
import { createContext, useContext } from '@oxog/berryact';
const ThemeContext = createContext('light');
const theme = useContext(ThemeContext);
```

### Custom Hooks

Custom hooks work identically:

```jsx
// Works in both React and Berryact!
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initial);
  
  return { count, increment, decrement, reset };
}
```

## State Management

### Redux Migration

```jsx
// Before (Redux)
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  
  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      {count}
    </button>
  );
}

// After (Berryact Store)
import { useStore } from '@oxog/berryact';

function Counter() {
  const store = useStore();
  const count = store.state.count;
  
  return (
    <button onClick={() => store.commit('increment')}>
      {count()}
    </button>
  );
}
```

### Zustand Migration

```jsx
// Before (Zustand)
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

// After (Berryact)
import { createStore } from '@oxog/berryact';

const store = createStore({
  state: { count: 0 },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});
```

## Routing

### React Router Migration

```jsx
// Before (React Router)
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

// After (Berryact Router)
import { createRouter, RouterLink, RouterView } from '@oxog/berryact';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
      <RouterView />
    </div>
  );
}
```

## Styling

### CSS Modules
```jsx
// Works identically in Berryact!
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container}>...</div>;
}
```

### CSS-in-JS

Most CSS-in-JS libraries work with minor adjustments:

```jsx
// Styled Components
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px 20px;
`;

// Use normally in Berryact
function App() {
  return <Button primary>Click me</Button>;
}
```

### Tailwind CSS
```jsx
// Works identically!
function Card({ title, content }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700">{content}</p>
    </div>
  );
}
```

## Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^react$': '@oxog/berryact/compat',
    '^react-dom$': '@oxog/berryact/compat'
  },
  transform: {
    '^.+\\.jsx?$': ['babel-jest', {
      presets: ['@oxog/berryact/build/babel-preset']
    }]
  }
};
```

### Testing Library

```jsx
// Before (React Testing Library)
import { render, fireEvent } from '@testing-library/react';

test('increments counter', () => {
  const { getByText } = render(<Counter />);
  fireEvent.click(getByText('Increment'));
  expect(getByText('Count: 1')).toBeInTheDocument();
});

// After (Berryact Testing Utils)
import { render, fireEvent } from '@oxog/berryact/testing';

test('increments counter', () => {
  const { getByText } = render(<Counter />);
  fireEvent.click(getByText('Increment'));
  expect(getByText('Count: 1')).toBeInTheDocument();
});
```

## Performance Tips

### 1. Use Signals for Fine-Grained Reactivity

```jsx
// React (Re-renders entire component)
function App() {
  const [user, setUser] = useState({ name: 'John', age: 30 });
  
  return (
    <div>
      <UserName name={user.name} />
      <UserAge age={user.age} />
    </div>
  );
}

// Berryact (Only updates what changes)
function App() {
  const name = createSignal('John');
  const age = createSignal(30);
  
  return (
    <div>
      <UserName name={name} />
      <UserAge age={age} />
    </div>
  );
}
```

### 2. Leverage Template Literals for Static Parts

```jsx
// Mix JSX with templates for optimal performance
function ProductList({ products }) {
  return (
    <div className="product-list">
      {products().map(product => html`
        <div key=${product.id} class="product-card">
          <img src=${product.image} alt=${product.name} />
          <h3>${product.name}</h3>
          <p>${product.price}</p>
        </div>
      `)}
    </div>
  );
}
```

### 3. Use Computed Values

```jsx
// Automatically memoized and cached
const filteredProducts = createComputed(() => 
  products().filter(p => p.category === selectedCategory())
);
```

## Common Patterns

### Conditional Rendering

```jsx
// React & Berryact JSX
{isLoading && <Spinner />}
{error ? <Error message={error} /> : <Content />}

// Berryact Template Literals
${isLoading() && html`<${Spinner} />`}
${error() ? html`<${Error} message=${error()} />` : html`<${Content} />`}
```

### Lists and Keys

```jsx
// React & Berryact JSX
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// Berryact Template Literals
${items().map(item => html`
  <${Item} key=${item.id} ...${item} />
`)}
```

### Event Handling

```jsx
// React & Berryact JSX
<button onClick={handleClick}>Click</button>
<input onChange={(e) => setValue(e.target.value)} />

// Berryact Template Literals
<button @click=${handleClick}>Click</button>
<input @change=${(e) => setValue(e.target.value)} />
```

### Forms

```jsx
// React & Berryact JSX
function Form() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Migration Strategy

### Phase 1: Setup (Day 1)
1. Install Berryact with compatibility mode
2. Configure build tools
3. Update TypeScript configuration
4. Run tests to ensure nothing breaks

### Phase 2: Leaf Components (Week 1)
1. Start with simple, stateless components
2. Migrate utility components
3. Update component library

### Phase 3: Features (Week 2-3)
1. Migrate feature by feature
2. Update state management
3. Migrate routing

### Phase 4: Optimization (Week 4)
1. Convert useState to createSignal
2. Replace class components
3. Optimize with template literals
4. Remove compatibility mode

## Troubleshooting

### Common Issues

**Issue**: Signals showing as functions in JSX
```jsx
// Wrong
<div>{count}</div> // Shows: function() { ... }

// Correct
<div>{count()}</div> // Shows: 0
```

**Issue**: Event handlers not working
```jsx
// React style (works with compat mode)
<button onClick={handler}>

// Berryact native
<button onClick={handler}> // JSX
<button @click=${handler}> // Template
```

**Issue**: Props not updating
```jsx
// Make sure to call signal functions
<Child value={signal()} /> // Not just {signal}
```

## Resources

- [Berryact Documentation](https://berryact.dev)
- [API Reference](https://berryact.dev/api)
- [Examples Repository](https://github.com/oxog/berryact-examples)
- [Community Discord](https://discord.gg/berryact)
- [Migration Codemods](https://github.com/oxog/berryact-codemods)

## Need Help?

- Check our [FAQ](https://berryact.dev/faq)
- Join our [Discord community](https://discord.gg/berryact)
- Open an issue on [GitHub](https://github.com/oxog/berryact)
- Contact support at support@berryact.dev