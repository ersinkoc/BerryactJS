# Berryact JS Framework

A modern, lightweight JavaScript UI framework designed to be a simpler alternative to React and Vue. At under 15KB uncompressed (~5KB gzipped), Berryact provides a powerful reactive system, component model, and full-featured ecosystem while maintaining exceptional performance.

## Key Features

- 🚀 **Ultra Lightweight**: < 15KB uncompressed, ~5KB gzipped
- ⚡ **Zero Dependencies**: No external runtime dependencies
- 🎯 **No Build Step Required**: Works directly in browsers via ES modules
- 🔄 **Fine-grained Reactivity**: Only updates what changes, no virtual DOM
- 🔥 **Modern JavaScript**: Uses Proxy, async/await, ES modules
- 📘 **TypeScript Support**: Full TypeScript definitions included
- 🛠️ **Great DX**: Intuitive API, helpful error messages, devtools

## Quick Start

### Installation

```bash
npm install @oxog/berryact
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Berryact App</title>
</head>
<body>
    <div id="app"></div>
    
    <script type="module">
        import { createApp, signal, computed, html } from '@oxog/berryact';

        function Counter() {
            const count = signal(0);
            const double = computed(() => count.value * 2);
            
            return html`
                <div>
                    <h1>Count: ${count}</h1>
                    <h2>Double: ${double}</h2>
                    <button @click=${() => count.value++}>
                        Increment
                    </button>
                </div>
            `;
        }

        const app = createApp(Counter);
        app.mount('#app');
    </script>
</body>
</html>
```

## Core Concepts

### Reactive Signals

Signals are the foundation of Berryact's reactivity system:

```javascript
import { signal, computed, effect } from '@oxog/berryact';

// Create reactive state
const count = signal(0);
const name = signal('John');

// Create computed values
const greeting = computed(() => `Hello, ${name.value}!`);
const doubled = computed(() => count.value * 2);

// Create side effects
effect(() => {
    console.log(`Count is: ${count.value}`);
});

// Update values
count.value = 5; // Automatically triggers effects and updates UI
name.value = 'Jane';
```

### Component System

Create reusable components with hooks:

```javascript
import { defineComponent, useState, useEffect } from '@oxog/berryact';

function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(async () => {
        setLoading(true);
        const userData = await fetchUser(userId);
        setUser(userData);
        setLoading(false);
    }, [userId]);

    if (loading) {
        return html`<div>Loading...</div>`;
    }

    return html`
        <div class="user-profile">
            <h2>${user.name}</h2>
            <p>${user.email}</p>
        </div>
    `;
}
```

### Template System

Use tagged template literals for JSX-like syntax without build tools:

```javascript
import { html } from '@oxog/berryact';

function TodoList({ todos }) {
    return html`
        <ul class="todo-list">
            ${todos.map(todo => html`
                <li class="todo-item ${todo.completed ? 'completed' : ''}">
                    <input 
                        type="checkbox" 
                        checked=${todo.completed}
                        @change=${() => toggleTodo(todo.id)}
                    />
                    <span>${todo.text}</span>
                </li>
            `)}
        </ul>
    `;
}
```

### State Management

Built-in store for application state:

```javascript
import { createStore } from '@oxog/berryact';

const store = createStore({
    state: {
        count: 0,
        user: null
    },
    getters: {
        doubledCount: (state) => state.count * 2,
        isLoggedIn: (state) => !!state.user
    },
    mutations: {
        increment(state) {
            state.count++;
        },
        setUser(state, user) {
            state.user = user;
        }
    },
    actions: {
        async login(context, credentials) {
            const user = await api.login(credentials);
            context.commit('setUser', user);
        }
    }
});

// Use in components
store.commit('increment');
await store.dispatch('login', { email, password });
```

### Routing

Client-side routing with nested routes:

```javascript
import { createRouter } from '@oxog/berryact';

const router = createRouter({
    mode: 'history',
    routes: [
        { path: '/', component: Home },
        { path: '/about', component: About },
        { path: '/users/:id', component: UserProfile },
        {
            path: '/admin',
            component: AdminLayout,
            beforeEnter: requireAuth,
            children: [
                { path: 'users', component: AdminUsers },
                { path: 'settings', component: AdminSettings }
            ]
        }
    ]
});

const app = createApp(App);
app.useRouter(router);
app.mount('#app');
```

## Advanced Features

### Directives

Built-in directives for common patterns:

```javascript
// Conditional rendering
html`<div n-if=${isVisible}>Content</div>`

// Show/hide
html`<div n-show=${isVisible}>Content</div>`

// Two-way data binding
html`<input n-model=${inputValue} />`

// Class binding
html`<div n-class=${{ active: isActive, disabled: isDisabled }}>Content</div>`

// Style binding
html`<div n-style=${{ color: textColor, fontSize: size + 'px' }}>Content</div>`
```

### Custom Directives

Register your own directives:

```javascript
import { registerDirective } from '@oxog/berryact';

registerDirective('focus', (element, value) => {
    if (value) {
        element.focus();
    }
});

// Usage
html`<input n-focus=${shouldFocus} />`
```

### Plugins

Extend functionality with plugins:

```javascript
import { createLogger, createPersistedState } from '@oxog/berryact';

const store = createStore({
    // ... store config
    plugins: [
        createLogger({ collapsed: false }),
        createPersistedState({ key: 'my-app' })
    ]
});
```

## Performance

Berryact is designed for exceptional performance:

- **Fine-grained reactivity**: Only components that depend on changed data re-render
- **No virtual DOM**: Direct DOM manipulation with efficient diffing
- **Lazy evaluation**: Computed values only recalculate when dependencies change
- **Automatic batching**: Multiple updates in the same tick are batched
- **Memory efficient**: Weak references prevent memory leaks

## Browser Support

- Chrome 63+
- Firefox 67+
- Safari 11.1+
- Edge 79+

## Comparison

| Feature | Berryact | React | Vue |
|---------|------|-------|-----|
| Bundle Size | 5KB | 42KB | 34KB |
| Runtime Dependencies | 0 | 2 | 1 |
| Build Step Required | No | Yes | Optional |
| Learning Curve | Low | Medium | Low |
| Performance | Excellent | Good | Good |
| TypeScript Support | Built-in | Good | Good |

## Examples

See the `examples/` directory for complete applications:

- [Counter](examples/counter/) - Basic reactivity
- [Todo App](examples/todo-app/) - State management
- [Real World](examples/real-world/) - Full application
- [Benchmarks](examples/benchmarks/) - Performance tests

## Documentation

- [API Reference](docs/API.md)
- [User Guide](docs/GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © OXOG

---

**Berryact**: Modern web development, simplified. 🚀