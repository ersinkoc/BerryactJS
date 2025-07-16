# Berryact Plugin Development Guide

The Berryact framework provides a powerful plugin system that allows you to extend and customize the framework's functionality. This guide will teach you how to create, distribute, and use plugins.

## Table of Contents

1. [Plugin Architecture](#plugin-architecture)
2. [Creating Your First Plugin](#creating-your-first-plugin)
3. [Plugin Lifecycle](#plugin-lifecycle)
4. [Core Plugin APIs](#core-plugin-apis)
5. [Built-in Plugins](#built-in-plugins)
6. [Advanced Plugin Patterns](#advanced-plugin-patterns)
7. [Testing Plugins](#testing-plugins)
8. [Publishing Plugins](#publishing-plugins)

## Plugin Architecture

Berryact's plugin system is designed to be:
- **Modular**: Plugins can be easily added or removed
- **Composable**: Multiple plugins can work together
- **Type-safe**: Full TypeScript support
- **Performance-focused**: Minimal overhead

### Basic Plugin Structure

```javascript
import { Plugin } from '@oxog/berryact';

export class MyPlugin extends Plugin {
  constructor(options = {}) {
    super({
      name: 'my-plugin',
      version: '1.0.0',
      dependencies: [] // Other plugins this depends on
    });
    
    this.options = options;
  }

  setup(app, context) {
    // Plugin initialization logic
    console.log('MyPlugin installed!');
    
    // Register hooks
    this.registerComponentHook('mounted', (component) => {
      console.log('Component mounted:', component);
    });
    
    // Provide data to other plugins
    this.provide('api', {
      doSomething: () => console.log('Doing something!')
    });
  }
}
```

## Creating Your First Plugin

### Functional Plugin

The simplest way to create a plugin is using a function:

```javascript
export function simplePlugin(app, options = {}) {
  console.log('Simple plugin installed with options:', options);
  
  // Add global property
  app.myGlobalMethod = () => {
    console.log('Global method called!');
  };
  
  // Register lifecycle hooks
  app.pluginContext.registerHook('app:mounted', () => {
    console.log('App mounted!');
  });
}

// Usage
app.use(simplePlugin, { debug: true });
```

### Class-based Plugin

For more complex plugins, use the Plugin class:

```javascript
import { Plugin, createPlugin } from '@oxog/berryact';

export const AnalyticsPlugin = createPlugin({
  name: 'analytics',
  version: '1.0.0',
  
  setup(app, context) {
    const analytics = {
      events: [],
      
      track(event, data = {}) {
        this.events.push({
          event,
          data,
          timestamp: Date.now()
        });
        
        // Send to analytics service
        if (this.options.endpoint) {
          fetch(this.options.endpoint, {
            method: 'POST',
            body: JSON.stringify({ event, data })
          });
        }
      },
      
      getEvents() {
        return this.events;
      }
    };
    
    // Provide analytics API
    this.provide('analytics', analytics);
    
    // Track navigation
    this.registerAppHook('route:after', (to, from) => {
      analytics.track('page_view', {
        path: to.path,
        from: from.path
      });
    });
    
    // Track component lifecycle
    this.registerComponentHook('mounted', (component) => {
      analytics.track('component_mounted', {
        name: component.constructor.name
      });
    });
    
    // Expose globally
    app.analytics = analytics;
  }
});
```

## Plugin Lifecycle

### Installation Phase

```javascript
class LifecyclePlugin extends Plugin {
  install(app, options) {
    // Called when plugin is registered
    console.log('Installing plugin...');
    
    // Call parent install
    super.install(app, options);
    
    // Custom installation logic
    this.setupDependencies();
  }
  
  setup(app, context) {
    // Called after install
    console.log('Setting up plugin...');
  }
}
```

### Hook Registration

Plugins can register hooks at different levels:

```javascript
setup(app, context) {
  // Component hooks
  this.registerComponentHook('beforeCreate', (component) => {});
  this.registerComponentHook('created', (component) => {});
  this.registerComponentHook('beforeMount', (component) => {});
  this.registerComponentHook('mounted', (component) => {});
  this.registerComponentHook('beforeUpdate', (component) => {});
  this.registerComponentHook('updated', (component) => {});
  this.registerComponentHook('beforeUnmount', (component) => {});
  this.registerComponentHook('unmounted', (component) => {});
  
  // App hooks
  this.registerAppHook('beforeMount', (container) => {});
  this.registerAppHook('mounted', (instance) => {});
  this.registerAppHook('beforeUnmount', (instance) => {});
  this.registerAppHook('unmounted', () => {});
  this.registerAppHook('router', (router) => {});
  this.registerAppHook('store', (store) => {});
  
  // Global hooks
  this.registerGlobalHook('signal:created', ({ id, value }) => {});
  this.registerGlobalHook('signal:updated', ({ id, oldValue, newValue }) => {});
  this.registerGlobalHook('computed:evaluated', ({ id, value }) => {});
  this.registerGlobalHook('effect:executed', ({ id, name }) => {});
}
```

## Core Plugin APIs

### Context API

The plugin context provides shared functionality:

```javascript
setup(app, context) {
  // Store data
  context.set('my-data', { foo: 'bar' });
  
  // Retrieve data
  const data = context.get('my-data');
  
  // Register custom hooks
  context.registerHook('my-plugin:event', (data) => {
    console.log('Custom event:', data);
  });
  
  // Call custom hooks
  context.callHook('my-plugin:event', { message: 'Hello' });
  
  // Register middleware
  context.registerMiddleware('router', async (ctx, next) => {
    console.log('Before routing');
    await next();
    console.log('After routing');
  });
}
```

### Inter-plugin Communication

Plugins can communicate with each other:

```javascript
// Plugin A - Provider
class PluginA extends Plugin {
  setup(app, context) {
    this.provide('apiClient', {
      get: (url) => fetch(url).then(r => r.json()),
      post: (url, data) => fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    });
  }
}

// Plugin B - Consumer
class PluginB extends Plugin {
  constructor() {
    super({
      name: 'plugin-b',
      dependencies: ['plugin-a'] // Declare dependency
    });
  }
  
  setup(app, context) {
    // Use API from Plugin A
    const apiClient = this.inject('plugin-a', 'apiClient');
    
    apiClient.get('/api/data').then(data => {
      console.log('Data from Plugin A:', data);
    });
  }
}
```

## Built-in Plugins

### DevTools Plugin

```javascript
import { DevToolsPlugin } from '@oxog/berryact';

app.use(DevToolsPlugin);

// Access dev tools
window.__BERRYACT_DEVTOOLS__.componentTree;
window.__BERRYACT_DEVTOOLS__.inspectComponent(id);
```

### Logger Plugin

```javascript
import { LoggerPlugin } from '@oxog/berryact';

app.use(LoggerPlugin, {
  level: 'debug', // debug, info, warn, error
  prefix: '[MyApp]',
  logLifecycle: true,
  logRouting: true,
  logStore: true
});

// Use logger
app.logger.info('Application started');
app.logger.debug('Debug information');
app.logger.error('Error occurred', error);
```

### Performance Plugin

```javascript
import { PerformancePlugin } from '@oxog/berryact';

app.use(PerformancePlugin);

// Access metrics
const metrics = app.performance.getMetrics();
console.log('Components created:', metrics.components.created);
console.log('Average render time:', app.performance.getAverageRenderTime());

// Reset metrics
app.performance.reset();
```

## Advanced Plugin Patterns

### Composition Plugin

Create plugins that compose other plugins:

```javascript
export function createSuperPlugin(options = {}) {
  return {
    install(app) {
      // Install multiple plugins
      app.use(LoggerPlugin, { level: options.logLevel });
      app.use(PerformancePlugin);
      app.use(DevToolsPlugin);
      
      // Add custom functionality
      app.use((app, context) => {
        context.registerHook('app:error', (error) => {
          app.logger.error('Application error:', error);
          
          // Send to error tracking service
          if (options.errorTracking) {
            options.errorTracking.captureException(error);
          }
        });
      });
    }
  };
}
```

### Reactive Plugin State

Use signals for reactive plugin state:

```javascript
import { signal, computed } from '@oxog/berryact';

class StatePlugin extends Plugin {
  setup(app, context) {
    // Reactive state
    const state = signal({
      users: [],
      currentUser: null
    });
    
    // Computed values
    const isLoggedIn = computed(() => state.value.currentUser !== null);
    const userCount = computed(() => state.value.users.length);
    
    // Methods
    const api = {
      login(user) {
        state.value = {
          ...state.value,
          currentUser: user
        };
      },
      
      logout() {
        state.value = {
          ...state.value,
          currentUser: null
        };
      },
      
      addUser(user) {
        state.value = {
          ...state.value,
          users: [...state.value.users, user]
        };
      }
    };
    
    // Provide reactive API
    this.provide('auth', {
      state,
      isLoggedIn,
      userCount,
      ...api
    });
    
    // Global access
    app.auth = api;
  }
}
```

### Middleware Plugin

Create plugins that add middleware:

```javascript
class AuthMiddlewarePlugin extends Plugin {
  setup(app, context) {
    // Add router middleware
    if (app.router) {
      app.router.beforeEach(async (to, from, next) => {
        const auth = this.inject('auth-plugin', 'auth');
        
        if (to.meta.requiresAuth && !auth.isLoggedIn.value) {
          next('/login');
        } else {
          next();
        }
      });
    }
    
    // Add store middleware
    if (app.store) {
      app.store.subscribe((mutation, state) => {
        console.log('State mutation:', mutation.type);
      });
    }
  }
}
```

### UI Component Plugin

Plugins can provide UI components:

```javascript
import { html } from '@oxog/berryact';

class UIPlugin extends Plugin {
  setup(app, context) {
    // Provide components
    this.provide('components', {
      Button: ({ variant = 'primary', children, ...props }) => html`
        <button class="berryact-btn berryact-btn-${variant}" ...${props}>
          ${children}
        </button>
      `,
      
      Card: ({ title, children }) => html`
        <div class="berryact-card">
          ${title && html`<h3 class="berryact-card-title">${title}</h3>`}
          <div class="berryact-card-body">${children}</div>
        </div>
      `,
      
      Modal: ({ isOpen, onClose, children }) => {
        if (!isOpen) return null;
        
        return html`
          <div class="berryact-modal-backdrop" @click=${onClose}>
            <div class="berryact-modal" @click=${e => e.stopPropagation()}>
              ${children}
            </div>
          </div>
        `;
      }
    });
    
    // Inject styles
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .berryact-btn { /* button styles */ }
        .berryact-card { /* card styles */ }
        .berryact-modal { /* modal styles */ }
      `;
      document.head.appendChild(style);
    }
  }
}
```

## Testing Plugins

### Unit Testing

```javascript
import { createApp, signal } from '@oxog/berryact';
import { MyPlugin } from './my-plugin';

describe('MyPlugin', () => {
  let app;
  let plugin;
  
  beforeEach(() => {
    app = createApp(() => null);
    plugin = new MyPlugin({ debug: true });
  });
  
  test('installs correctly', () => {
    app.use(plugin);
    
    expect(app.pluginManager.has('my-plugin')).toBe(true);
  });
  
  test('provides API', () => {
    app.use(plugin);
    
    const api = app.pluginContext.get('my-plugin:api');
    expect(api).toBeDefined();
    expect(typeof api.doSomething).toBe('function');
  });
  
  test('hooks are called', async () => {
    const hookSpy = jest.fn();
    
    app.use(plugin);
    app.pluginContext.registerHook('test:hook', hookSpy);
    
    await app.pluginContext.callHook('test:hook', 'data');
    
    expect(hookSpy).toHaveBeenCalledWith('data');
  });
});
```

### Integration Testing

```javascript
import { createApp, html } from '@oxog/berryact';
import { render, screen } from '@testing-library/berryact';

test('plugin integrates with app', async () => {
  const TestComponent = () => html`
    <div>
      <button @click=${() => app.myPlugin.doAction()}>
        Click me
      </button>
    </div>
  `;
  
  const app = createApp(TestComponent);
  app.use(MyPlugin);
  
  const { container } = render(app);
  
  const button = screen.getByText('Click me');
  fireEvent.click(button);
  
  // Assert plugin behavior
});
```

## Publishing Plugins

### Package Structure

```
my-berryact-plugin/
├── src/
│   ├── index.js
│   ├── plugin.js
│   └── utils.js
├── dist/
│   ├── index.js
│   ├── index.esm.js
│   └── index.d.ts
├── package.json
├── README.md
├── LICENSE
└── tsconfig.json
```

### Package.json

```json
{
  "name": "@myorg/berryact-plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for Berryact framework",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "src"
  ],
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  },
  "peerDependencies": {
    "@oxog/berryact": "^1.0.0"
  },
  "keywords": [
    "berryact",
    "berryact-plugin",
    "frontend",
    "plugin"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/berryact-plugin-example"
  }
}
```

### TypeScript Definitions

```typescript
import { Plugin, PluginContext } from '@oxog/berryact';

export interface MyPluginOptions {
  debug?: boolean;
  apiKey?: string;
}

export class MyPlugin extends Plugin {
  constructor(options?: MyPluginOptions);
  setup(app: any, context: PluginContext): void;
}

declare module '@oxog/berryact' {
  interface App {
    myPlugin?: {
      doAction(): void;
      getData(): any;
    };
  }
}
```

### Documentation Template

```markdown
# Berryact Plugin Example

A plugin for the Berryact framework that provides...

## Installation

\`\`\`bash
npm install @myorg/berryact-plugin-example
\`\`\`

## Usage

\`\`\`javascript
import { createApp } from '@oxog/berryact';
import { MyPlugin } from '@myorg/berryact-plugin-example';

const app = createApp(App);
app.use(MyPlugin, {
  debug: true,
  apiKey: 'your-api-key'
});
\`\`\`

## API

### Options

- `debug` (boolean): Enable debug logging
- `apiKey` (string): API key for external service

### Methods

- `app.myPlugin.doAction()`: Performs the main action
- `app.myPlugin.getData()`: Returns plugin data

## Examples

[Include practical examples]

## License

MIT
```

## Best Practices

1. **Keep plugins focused**: Each plugin should have a single, well-defined purpose
2. **Document thoroughly**: Include examples and API documentation
3. **Handle errors gracefully**: Don't let plugin errors break the app
4. **Minimize dependencies**: Keep your plugin lightweight
5. **Test extensively**: Unit and integration tests are essential
6. **Version carefully**: Follow semantic versioning
7. **Provide TypeScript types**: Even if written in JavaScript
8. **Consider performance**: Avoid heavy operations in hooks
9. **Clean up resources**: Implement proper disposal logic
10. **Respect user privacy**: Don't collect data without permission

## Conclusion

The Berryact plugin system provides a powerful way to extend the framework while maintaining its lightweight philosophy. By following this guide, you can create plugins that are modular, performant, and easy to use.

For more examples, check out the [official plugins repository](https://github.com/oxog/berryact-plugins).