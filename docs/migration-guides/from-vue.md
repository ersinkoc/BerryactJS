# Migrating from Vue to Berryact

This guide will help you migrate your Vue applications to the Berryact framework. Vue developers will find many familiar concepts, but with a more functional approach.

## Core Concepts Comparison

### Components

**Vue 3 (Composition API):**
```vue
<template>
  <div class="card">
    Hello {{ name }}!
    <slot></slot>
  </div>
</template>

<script setup>
defineProps(['name'])
</script>
```

**Berryact:**
```javascript
function MyComponent({ name, children }) {
  return html`
    <div class="card">
      Hello ${name}!
      ${children}
    </div>
  `;
}
```

### Reactive State

**Vue 3:**
```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>
```

**Berryact:**
```javascript
import { signal, html } from '@oxog/berryact';

function Counter() {
  const count = signal(0);
  
  function increment() {
    count.value++;
  }
  
  return html`
    <div>
      <p>${count}</p>
      <button @click=${increment}>Increment</button>
    </div>
  `;
}
```

### Computed Properties

**Vue 3:**
```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubled }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

**Berryact:**
```javascript
import { signal, computed, html } from '@oxog/berryact';

function Calculator() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);
  
  return html`
    <div>
      <p>Count: ${count}</p>
      <p>Double: ${doubled}</p>
    </div>
  `;
}
```

### Watchers/Effects

**Vue 3:**
```vue
<script setup>
import { ref, watch, onMounted } from 'vue'

const data = ref(null)

onMounted(async () => {
  data.value = await fetchData()
})

watch(data, (newData) => {
  console.log('Data changed:', newData)
})
</script>
```

**Berryact:**
```javascript
import { signal, effect, useEffect, html } from '@oxog/berryact';

function DataComponent() {
  const data = signal(null);
  
  useEffect(async () => {
    data.value = await fetchData();
  }, []);
  
  effect(() => {
    console.log('Data changed:', data.value);
  });
  
  return html`<div>${data ? data.title : 'Loading...'}</div>`;
}
```

## Key Differences

### 1. Template Syntax

- **Vue** uses template directives: `v-if`, `v-for`, `@click`
- **Berryact** uses tagged template literals with JavaScript expressions

### 2. Reactivity System

**Vue 3:**
```javascript
const state = reactive({
  count: 0,
  name: 'Vue'
});

const count = ref(0);
```

**Berryact:**
```javascript
const state = signal({
  count: 0,
  name: 'Berryact'
});

const count = signal(0);
```

### 3. Event Handling

**Vue:**
```vue
<button @click="handleClick">Click</button>
<button @click="handleClick($event, 'param')">Click</button>
```

**Berryact:**
```javascript
html`<button @click=${handleClick}>Click</button>`
html`<button @click=${(e) => handleClick(e, 'param')}>Click</button>`
```

### 4. Conditional Rendering

**Vue:**
```vue
<div v-if="condition">Conditional content</div>
<div v-else>Alternative content</div>
```

**Berryact:**
```javascript
${condition ? html`<div>Conditional content</div>` : html`<div>Alternative content</div>`}
```

### 5. List Rendering

**Vue:**
```vue
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

**Berryact:**
```javascript
html`
  <ul>
    ${items.map(item => html`
      <li key=${item.id}>${item.name}</li>
    `)}
  </ul>
`
```

## Advanced Patterns

### Provide/Inject to Context

**Vue 3:**
```vue
<!-- Parent -->
<script setup>
import { provide } from 'vue'

provide('theme', 'dark')
</script>

<!-- Child -->
<script setup>
import { inject } from 'vue'

const theme = inject('theme')
</script>
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

### Component Communication

**Vue 3 (props & emits):**
```vue
<!-- Parent -->
<template>
  <ChildComponent :message="msg" @update="handleUpdate" />
</template>

<!-- Child -->
<template>
  <button @click="$emit('update', newValue)">Update</button>
</template>

<script setup>
defineProps(['message'])
defineEmits(['update'])
</script>
```

**Berryact:**
```javascript
function Parent() {
  const [msg, setMsg] = useState('Hello');
  
  const handleUpdate = (newValue) => {
    setMsg(newValue);
  };
  
  return html`<${ChildComponent} message=${msg} onUpdate=${handleUpdate} />`;
}

function ChildComponent({ message, onUpdate }) {
  return html`
    <button @click=${() => onUpdate('new value')}>
      Update
    </button>
  `;
}
```

## State Management

### From Pinia to Berryact Store

**Pinia:**
```javascript
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  
  function increment() {
    count.value++
  }
  
  return { count, increment }
})

// In component
const store = useCounterStore()
```

**Berryact Store:**
```javascript
import { createStore } from '@oxog/berryact';

const store = createStore({
  state: {
    count: 0
  },
  
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

// In component
function Counter() {
  const count = computed(() => store.state.count);
  
  return html`
    <button @click=${() => store.dispatch('increment')}>
      ${count}
    </button>
  `;
}
```

## Routing

### From Vue Router to Berryact Router

**Vue Router:**
```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
})

// In component
import { useRouter } from 'vue-router'
const router = useRouter()
router.push('/about')
```

**Berryact Router:**
```javascript
import { createRouter } from '@oxog/berryact';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

// In component
router.push('/about');
```

## Lifecycle Hooks

### Vue to Berryact Hook Mapping

**Vue 3:**
```vue
<script setup>
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  console.log('Component mounted')
})

onUpdated(() => {
  console.log('Component updated')
})

onUnmounted(() => {
  console.log('Component unmounted')
})
</script>
```

**Berryact:**
```javascript
import { useEffect } from '@oxog/berryact';

function MyComponent() {
  // onMounted + onUnmounted
  useEffect(() => {
    console.log('Component mounted');
    
    return () => {
      console.log('Component unmounted');
    };
  }, []);
  
  // onUpdated (runs after every render)
  useEffect(() => {
    console.log('Component updated');
  });
  
  return html`<div>Component</div>`;
}
```

## Directives to Patterns

### v-model

**Vue:**
```vue
<input v-model="text" />
```

**Berryact:**
```javascript
const [text, setText] = useState('');

html`<input value=${text} @input=${(e) => setText(e.target.value)} />`
```

### v-show/v-if

**Vue:**
```vue
<div v-show="visible">Shown/Hidden</div>
<div v-if="condition">Conditional</div>
```

**Berryact:**
```javascript
html`<div style=${visible ? '' : 'display: none'}>Shown/Hidden</div>`
${condition ? html`<div>Conditional</div>` : ''}
```

### v-for

**Vue:**
```vue
<div v-for="(item, index) in items" :key="item.id">
  {{ index }}: {{ item.name }}
</div>
```

**Berryact:**
```javascript
${items.map((item, index) => html`
  <div key=${item.id}>${index}: ${item.name}</div>
`)}
```

## Migration Strategy

### 1. Component by Component
Start migrating individual components, beginning with leaf components that have no dependencies.

### 2. Template Translation
Convert Vue templates to tagged template literals:
- Replace `{{ }}` with `${}`
- Replace `v-if` with ternary operators
- Replace `v-for` with `.map()`
- Replace `@click` syntax (this stays the same!)

### 3. State Migration
- Replace `ref()` with `signal()`
- Replace `reactive()` with `signal()` for objects
- Replace `computed()` with `computed()` (same API!)
- Replace `watch()` with `effect()`

### 4. Store Migration
Convert Pinia stores to Berryact stores:
- Move state to the `state` object
- Convert actions to mutations and actions
- Update component usage

### 5. Router Migration
Replace Vue Router with Berryact Router:
- Similar route configuration
- Update navigation calls
- Adjust component integration

## Performance Benefits

After migration, you can expect:

- **Smaller bundle size**: ~5KB vs ~34KB for Vue
- **Fine-grained reactivity**: More efficient updates
- **No template compilation**: Templates are pure JavaScript
- **Better tree-shaking**: Only import what you use

## Common Gotchas

### 1. Reactive Object Properties
**Vue** automatically makes nested properties reactive, **Berryact** requires explicit signals:

```javascript
// Vue - automatic reactivity
const state = reactive({ user: { name: 'John' } });
state.user.name = 'Jane'; // triggers update

// Berryact - explicit reactivity
const user = signal({ name: 'John' });
user.value = { ...user.value, name: 'Jane' }; // triggers update
```

### 2. Template Expressions
Be careful with complex expressions in templates:

```javascript
// Vue template
{{ user?.profile?.name || 'Guest' }}

// Berryact template
${user.value?.profile?.name || 'Guest'}
```

### 3. Event Modifiers
Vue's event modifiers need to be handled manually:

```vue
<!-- Vue -->
<form @submit.prevent="handleSubmit">

<!-- Berryact -->
<form @submit=${(e) => { e.preventDefault(); handleSubmit(); }}>
```

## Tooling

### Development
- Vite for fast builds (same as Vue)
- ESLint with template literal support
- Browser dev tools work natively

### Testing
- Vitest (same testing setup as Vue)
- Vue Testing Library patterns can be adapted
- Cypress for e2e testing

## Next Steps

1. **Start with simple components** to learn the template syntax
2. **Migrate your state management** gradually
3. **Update your build process** to remove template compilation
4. **Convert your router** to Berryact's routing system
5. **Optimize with fine-grained reactivity** for better performance

The transition from Vue to Berryact should feel familiar due to similar reactive concepts, but with the benefits of a smaller footprint and more explicit control over reactivity.