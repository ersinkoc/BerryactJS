# Berryact Dual Syntax Support 🚀

Berryact now supports both **JSX syntax** (with build step) and **template literals** (no build step), making it the perfect framework for both React developers and those who prefer a buildless approach.

## 🎯 Quick Comparison

| Feature | JSX Syntax | Template Literals |
|---------|------------|------------------|
| **Build Step** | Required | Optional |
| **Syntax** | `<div className="test">` | `html\`<div class="test">\`` |
| **React Compatibility** | Excellent | Good |
| **Performance** | Great | Excellent |
| **Learning Curve** | Minimal (for React devs) | Low |
| **Bundle Size** | Standard | Smaller |

## 🔧 Installation

```bash
npm install @oxog/berryact
```

For JSX support, also install build tools:

```bash
# Vite
npm install -D @oxog/berryact-vite-plugin

# Webpack
npm install -D @oxog/berryact-webpack-plugin

# Babel
npm install -D @babel/core @babel/preset-react
```

## 🎨 JSX Syntax (Build Step Required)

### Setup with Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import berryact from '@oxog/berryact/build/vite-plugin';

export default defineConfig({
  plugins: [
    berryact({
      jsxImportSource: '@oxog/berryact',
      compat: true // Enable React compatibility
    })
  ]
});
```

### Example Component

```jsx
import { createSignal, createEffect } from '@oxog/berryact';

function TodoApp() {
  const [todos, setTodos] = createSignal([]);
  const [input, setInput] = createSignal('');

  const addTodo = () => {
    if (input().trim()) {
      setTodos([...todos(), {
        id: Date.now(),
        text: input(),
        done: false
      }]);
      setInput('');
    }
  };

  return (
    <div className="todo-app">
      <h1>My Todos</h1>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        addTodo();
      }}>
        <input
          value={input()}
          onInput={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos().map(todo => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🏷️ Template Literals (No Build Step)

### Direct Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Berryact App</title>
</head>
<body>
    <div id="app"></div>
    
    <script type="module">
        import { createApp, html, createSignal } from '@oxog/berryact';
        
        function TodoApp() {
          const [todos, setTodos] = createSignal([]);
          const [input, setInput] = createSignal('');
          
          const addTodo = () => {
            if (input().trim()) {
              setTodos([...todos(), {
                id: Date.now(),
                text: input(),
                done: false
              }]);
              setInput('');
            }
          };
          
          return html`
            <div class="todo-app">
              <h1>My Todos</h1>
              
              <form @submit=${(e) => {
                e.preventDefault();
                addTodo();
              }}>
                <input
                  value=${input()}
                  @input=${(e) => setInput(e.target.value)}
                  placeholder="Add a todo..."
                />
                <button type="submit">Add</button>
              </form>

              <ul>
                ${todos().map(todo => html`
                  <li key=${todo.id} class=${todo.done ? 'done' : ''}>
                    <input
                      type="checkbox"
                      checked=${todo.done}
                      @change=${() => toggleTodo(todo.id)}
                    />
                    <span>${todo.text}</span>
                  </li>
                `)}
              </ul>
            </div>
          `;
        }
        
        createApp(TodoApp).mount('#app');
    </script>
</body>
</html>
```

## 🔄 React Migration Guide

### Step 1: Install with Compatibility Mode

```bash
npm install @oxog/berryact
```

### Step 2: Update Imports (Gradual)

```jsx
// Before
import React, { useState, useEffect } from 'react';

// After (compatibility mode)
import React, { useState, useEffect } from '@oxog/berryact/compat';

// Or native Berryact
import { createSignal, createEffect } from '@oxog/berryact';
```

### Step 3: Update Components

```jsx
// React Component (works as-is with compat mode)
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

// Berryact Component (better performance)
function Counter() {
  const [count, setCount] = createSignal(0);
  
  createEffect(() => {
    document.title = `Count: ${count()}`;
  });
  
  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}
```

### Step 4: Mix Both Syntaxes

```jsx
// JSX Component
function Header({ title }) {
  return <h1 className="header">{title}</h1>;
}

// Template Literal Component
function Content() {
  return html`
    <div class="content">
      <${Header} title="Welcome" />
      <p>This shows mixed syntax support!</p>
    </div>
  `;
}
```

## 🎪 Advanced Features

### Component Interpolation (Templates)

```javascript
const Modal = ({ children, isOpen }) => html`
  <div class="modal ${isOpen ? 'open' : 'closed'}">
    ${children}
  </div>
`;

const App = () => html`
  <div>
    <${Modal} isOpen=${true}>
      <h2>Modal Content</h2>
    </Modal>
  </div>
`;
```

### Fragments

```jsx
// JSX
function App() {
  return (
    <>
      <div>First</div>
      <div>Second</div>
    </>
  );
}

// Template Literals
function App() {
  return html`
    <>
      <div>First</div>
      <div>Second</div>
    </>
  `;
}
```

### Portals

```jsx
// JSX
import { createPortal } from '@oxog/berryact';

function Modal({ children }) {
  return createPortal(children, document.body);
}

// Template Literals
function Modal({ children }) {
  return html`
    <portal to="body">
      ${children}
    </portal>
  `;
}
```

## ⚡ Performance Tips

### 1. Use Signals for Fine-Grained Updates

```jsx
// Less efficient (re-renders whole component)
function App() {
  const [user, setUser] = useState({ name: 'John', age: 30 });
  return <div>{user.name} is {user.age}</div>;
}

// More efficient (only updates what changes)
function App() {
  const [name, setName] = createSignal('John');
  const [age, setAge] = createSignal(30);
  return <div>{name()} is {age()}</div>;
}
```

### 2. Static Template Hoisting

```javascript
// Automatically optimized
const staticTemplate = html`
  <div class="static">
    <h1>This never changes</h1>
  </div>
`;

// Use multiple times without re-parsing
function App() {
  return html`
    <div>
      ${staticTemplate}
      <p>Dynamic content: ${signal()}</p>
    </div>
  `;
}
```

### 3. Computed Values

```jsx
function ProductList({ products, category }) {
  // Automatically memoized
  const filteredProducts = createComputed(() => 
    products().filter(p => p.category === category())
  );
  
  return (
    <ul>
      {filteredProducts().map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

## 🧪 Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@oxog/berryact$': '<rootDir>/src/index.js',
    '^@oxog/berryact/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['@oxog/berryact/build/babel-preset']
    }]
  }
};
```

### Test Example

```javascript
import { render, fireEvent } from '@oxog/berryact/testing';

test('both syntaxes work identically', () => {
  // JSX version
  const JSXComponent = () => (
    <button onClick={() => console.log('clicked')}>
      Click me
    </button>
  );
  
  // Template version
  const TemplateComponent = () => html`
    <button @click=${() => console.log('clicked')}>
      Click me
    </button>
  `;
  
  const { container: jsxContainer } = render(JSXComponent);
  const { container: templateContainer } = render(TemplateComponent);
  
  // Both should work identically
  fireEvent.click(jsxContainer.querySelector('button'));
  fireEvent.click(templateContainer.querySelector('button'));
});
```

## 📦 Build Configuration

### TypeScript Support

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@oxog/berryact",
    "types": ["@oxog/berryact/types/jsx"]
  }
}
```

### Webpack Configuration

```javascript
const { BerryactWebpackPlugin } = require('@oxog/berryact/build/webpack-plugin');

module.exports = {
  plugins: [
    new BerryactWebpackPlugin({
      compat: true // React compatibility mode
    })
  ]
};
```

## 🎭 Examples

Check out the `examples/` directory for complete applications:

- **todo-app-jsx/**: JSX syntax with build step
- **todo-app-template/**: Template literals, no build step
- **mixed-syntax/**: Both syntaxes in one app
- **react-migration/**: Step-by-step migration from React

## 🤝 Contributing

We welcome contributions! Whether you prefer JSX or template literals, there's something for everyone.

1. Fork the repository
2. Create your feature branch
3. Add tests for both syntax modes
4. Submit a pull request

## 📄 License

MIT © OXOG

---

**Choose your syntax, keep your performance!** 🚀

Whether you're a React developer looking for better performance or prefer the simplicity of template literals, Berryact has you covered. The choice is yours!