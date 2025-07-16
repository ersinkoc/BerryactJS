import { 
  createApp, 
  html, 
  signal, 
  computed, 
  effect,
  useState,
  useEffect,
  // Plugin system
  DevToolsPlugin,
  LoggerPlugin,
  PerformancePlugin,
  // Enhanced features
  createPortal,
  createModal,
  Suspense,
  createResource,
  ErrorBoundary,
  // Middleware
  RouterMiddleware,
  StoreMiddleware,
  // Built-in plugins
  I18nPlugin,
  VirtualScrollerPlugin,
  // Enhanced signals
  enhancedSignal,
  debouncedSignal,
  readonly
} from '../../src/index.js';

// Create some example plugins
const CustomPlugin = {
  name: 'custom-plugin',
  version: '1.0.0',
  
  install(app, options) {
    console.log('Custom plugin installed!', options);
    
    // Add global property
    app.customData = signal({
      clicks: 0,
      lastClick: null
    });
    
    // Register hooks
    app.pluginContext.registerHook('custom:click', (data) => {
      app.customData.value = {
        clicks: app.customData.value.clicks + 1,
        lastClick: new Date()
      };
      console.log('Custom click event:', data);
    });
  }
};

// i18n messages
const messages = {
  en: {
    welcome: 'Welcome to Berryact Plugin Showcase',
    description: 'Explore the powerful plugin system and enhanced features',
    tabs: {
      plugins: 'Plugins',
      reactivity: 'Enhanced Reactivity',
      components: 'Advanced Components',
      middleware: 'Middleware',
      performance: 'Performance'
    },
    buttons: {
      click: 'Click Me',
      openModal: 'Open Modal',
      throwError: 'Throw Error',
      loadData: 'Load Data',
      refresh: 'Refresh'
    },
    messages: {
      hello: 'Hello {name}!',
      clickCount: 'Clicked {count} times',
      items: {
        zero: 'No items',
        one: '1 item',
        other: '{count} items'
      }
    }
  },
  es: {
    welcome: 'Bienvenido a Berryact Plugin Showcase',
    description: 'Explora el poderoso sistema de plugins y características mejoradas',
    tabs: {
      plugins: 'Plugins',
      reactivity: 'Reactividad Mejorada',
      components: 'Componentes Avanzados',
      middleware: 'Middleware',
      performance: 'Rendimiento'
    },
    buttons: {
      click: 'Haz Clic',
      openModal: 'Abrir Modal',
      throwError: 'Lanzar Error',
      loadData: 'Cargar Datos',
      refresh: 'Actualizar'
    },
    messages: {
      hello: '¡Hola {name}!',
      clickCount: 'Clickeado {count} veces',
      items: {
        zero: 'Sin elementos',
        one: '1 elemento',
        other: '{count} elementos'
      }
    }
  }
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('plugins');
  const [modalOpen, setModalOpen] = useState(false);
  
  // Access i18n
  const { t, locale, setLocale } = app.i18n;
  
  // Demo states
  const clickCount = signal(0);
  const searchTerm = debouncedSignal('', 300);
  const readOnlyValue = readonly(signal('This is readonly'));
  
  // Performance tracking
  const metrics = computed(() => {
    if (app.performance) {
      return app.performance.getMetrics();
    }
    return null;
  });

  return html`
    <div class="app">
      <header>
        <h1>${t('welcome')}</h1>
        <p>${t('description')}</p>
        
        <div class="language-selector">
          <button 
            class=${locale.value === 'en' ? 'active' : ''}
            @click=${() => setLocale('en')}
          >
            English
          </button>
          <button 
            class=${locale.value === 'es' ? 'active' : ''}
            @click=${() => setLocale('es')}
          >
            Español
          </button>
        </div>
      </header>

      <div class="tabs">
        ${['plugins', 'reactivity', 'components', 'middleware', 'performance'].map(tab => html`
          <button 
            class="tab ${activeTab === tab ? 'active' : ''}"
            @click=${() => setActiveTab(tab)}
          >
            ${t(`tabs.${tab}`)}
          </button>
        `)}
      </div>

      <div class="content">
        ${activeTab === 'plugins' && html`<${PluginsDemo} />`}
        ${activeTab === 'reactivity' && html`<${ReactivityDemo} />`}
        ${activeTab === 'components' && html`<${ComponentsDemo} />`}
        ${activeTab === 'middleware' && html`<${MiddlewareDemo} />`}
        ${activeTab === 'performance' && html`<${PerformanceDemo} />`}
      </div>
    </div>
  `;
}

// Plugins Demo
function PluginsDemo() {
  const customData = app.customData;
  const { t } = app.i18n;
  
  const handleClick = () => {
    app.pluginContext.callHook('custom:click', { 
      timestamp: Date.now() 
    });
  };

  return html`
    <div class="section">
      <h2>Active Plugins</h2>
      <div class="demo-box">
        <p>The following plugins are currently active:</p>
        <ul>
          ${app.pluginManager.loadOrder.map(name => html`
            <li>${name}</li>
          `)}
        </ul>
      </div>

      <h2>Custom Plugin Demo</h2>
      <div class="demo-box">
        <button @click=${handleClick}>
          ${t('buttons.click')}
        </button>
        <p>${t('messages.clickCount', { count: customData.value.clicks })}</p>
        ${customData.value.lastClick && html`
          <p>Last clicked: ${customData.value.lastClick.toLocaleTimeString()}</p>
        `}
      </div>

      <h2>Logger Plugin</h2>
      <div class="demo-box">
        <button @click=${() => app.logger.info('Info message')}>
          Log Info
        </button>
        <button @click=${() => app.logger.warn('Warning message')}>
          Log Warning
        </button>
        <button @click=${() => app.logger.error('Error message')}>
          Log Error
        </button>
        <p>Check the console for log output</p>
      </div>

      <h2>Plugin Communication</h2>
      <div class="code-block">
        // Plugin A provides an API
        this.provide('api', myApi);
        
        // Plugin B consumes it
        const api = this.inject('plugin-a', 'api');
      </div>
    </div>
  `;
}

// Enhanced Reactivity Demo
function ReactivityDemo() {
  const [count, setCount] = useState(0);
  const doubled = computed(() => count * 2);
  const tripled = computed(() => count * 3);
  
  // Enhanced signal features
  const enhanced = enhancedSignal(0);
  const debounced = debouncedSignal('', 500);
  const readOnly = readonly(enhanced);
  
  // Track computations
  const computationCount = signal(0);
  effect(() => {
    // This will run whenever dependencies change
    const _ = doubled.value + tripled.value;
    computationCount.value++;
  });

  return html`
    <div class="section">
      <h2>Enhanced Signals</h2>
      <div class="demo-box">
        <p>Basic counter: ${count}</p>
        <p>Doubled: ${doubled}</p>
        <p>Tripled: ${tripled}</p>
        <p>Computations run: ${computationCount}</p>
        <button @click=${() => setCount(count + 1)}>Increment</button>
      </div>

      <h2>Debounced Signal</h2>
      <div class="demo-box">
        <input 
          type="text" 
          placeholder="Type to see debouncing..."
          @input=${(e) => debounced.value = e.target.value}
        />
        <p>Debounced value: ${debounced.value || '(empty)'}</p>
      </div>

      <h2>Advanced Signal Methods</h2>
      <div class="demo-box">
        <p>Enhanced signal: ${enhanced.value}</p>
        <button @click=${() => enhanced.update(v => v + 1)}>
          Update with function
        </button>
        <button @click=${() => enhanced.value = Date.now()}>
          Set timestamp
        </button>
        
        <p>Read-only mirror: ${readOnly.value}</p>
        <button @click=${() => {
          try {
            readOnly.value = 999;
          } catch (e) {
            alert('Cannot modify read-only signal!');
          }
        }}>
          Try to modify (will fail)
        </button>
      </div>
    </div>
  `;
}

// Advanced Components Demo
function ComponentsDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [suspenseDemo, setSuspenseDemo] = useState('idle');
  
  // Create async resource
  const dataResource = suspenseDemo === 'loading' 
    ? createResource(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (Math.random() > 0.7) {
          throw new Error('Random error occurred!');
        }
        return { 
          data: 'Successfully loaded data!',
          timestamp: new Date().toLocaleTimeString()
        };
      })
    : null;

  return html`
    <div class="section">
      <h2>Portal Demo</h2>
      <div class="demo-box">
        <button @click=${() => setShowModal(true)}>
          Open Modal
        </button>
        
        ${showModal && Portal({
          to: document.body,
          children: html`
            <div class="modal-backdrop" @click=${() => setShowModal(false)}>
              <div class="modal" @click=${(e) => e.stopPropagation()}>
                <h3>Modal Title</h3>
                <p>This modal is rendered outside the component tree using a portal!</p>
                <button @click=${() => setShowModal(false)}>Close</button>
              </div>
            </div>
          `
        })}
      </div>

      <h2>Suspense Demo</h2>
      <div class="demo-box">
        <button 
          @click=${() => setSuspenseDemo('loading')}
          disabled=${suspenseDemo === 'loading'}
        >
          Load Async Data
        </button>
        <button 
          @click=${() => setSuspenseDemo('idle')}
        >
          Reset
        </button>
        
        ${suspenseDemo === 'loading' && html`
          <${ErrorBoundary} 
            fallback=${({ error, retry }) => html`
              <div class="error-box">
                <p>Error: ${error.message}</p>
                <button @click=${retry}>Retry</button>
              </div>
            `}
          >
            <${Suspense} 
              fallback=${html`
                <div class="loading">
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                </div>
              `}
            >
              <${AsyncDataDisplay} resource=${dataResource} />
            </${Suspense}>
          </${ErrorBoundary}>
        `}
      </div>

      <h2>Error Boundary Demo</h2>
      <div class="demo-box">
        <${ErrorBoundary} 
          fallback=${({ error, reset }) => html`
            <div class="error-box">
              <p>Caught error: ${error.message}</p>
              <button @click=${reset}>Reset</button>
            </div>
          `}
        >
          <${ErrorThrowingComponent} />
        </${ErrorBoundary}>
      </div>
    </div>
  `;
}

// Helper Components
function AsyncDataDisplay({ resource }) {
  const data = resource.read();
  
  return html`
    <div class="success-box">
      <p>${data.data}</p>
      <p>Loaded at: ${data.timestamp}</p>
    </div>
  `;
}

function ErrorThrowingComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);
  
  if (shouldThrow) {
    throw new Error('Component error!');
  }
  
  return html`
    <div>
      <p>This component can throw an error</p>
      <button @click=${() => setShouldThrow(true)}>
        Throw Error
      </button>
    </div>
  `;
}

// Middleware Demo
function MiddlewareDemo() {
  const [logs, setLogs] = useState([]);
  
  const addLog = (message) => {
    setLogs([...logs, {
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Simulate middleware execution
  const executeMiddleware = async () => {
    addLog('Starting middleware chain...');
    
    const pipeline = compose(
      async (ctx, next) => {
        addLog('Middleware 1: Before');
        await next();
        addLog('Middleware 1: After');
      },
      async (ctx, next) => {
        addLog('Middleware 2: Before');
        await new Promise(r => setTimeout(r, 500));
        await next();
        addLog('Middleware 2: After');
      },
      async (ctx, next) => {
        addLog('Middleware 3: Executing');
        ctx.result = 'Success!';
      }
    );
    
    const context = {};
    await pipeline(context, () => {});
    addLog(`Result: ${context.result}`);
  };

  return html`
    <div class="section">
      <h2>Middleware Pipeline</h2>
      <div class="demo-box">
        <button @click=${executeMiddleware}>
          Execute Middleware Chain
        </button>
        <button @click=${() => setLogs([])}>
          Clear Logs
        </button>
        
        <div style="margin-top: 20px">
          ${logs.map(log => html`
            <div style="margin: 5px 0">
              <span style="color: #6c757d">${log.timestamp}</span>
              <span style="margin-left: 10px">${log.message}</span>
            </div>
          `)}
        </div>
      </div>

      <h2>Router Middleware</h2>
      <div class="code-block">
// Authentication middleware
router.beforeEach(RouterMiddleware.auth({
  isAuthenticated: () => user.value !== null,
  redirectTo: '/login'
}));

// Logging middleware
router.beforeEach(RouterMiddleware.logger());

// Progress bar middleware
router.beforeEach(RouterMiddleware.progress());
      </div>

      <h2>Store Middleware</h2>
      <div class="code-block">
// Apply multiple middleware
store.use([
  StoreMiddleware.logger({ collapsed: true }),
  StoreMiddleware.thunk(),
  StoreMiddleware.persist({ key: 'app-state' })
]);
      </div>
    </div>
  `;
}

// Performance Demo
function PerformanceDemo() {
  const metrics = app.performance?.getMetrics() || {};
  const [renderTimes, setRenderTimes] = useState([]);
  
  // Simulate heavy computation
  const runPerformanceTest = () => {
    const start = performance.now();
    
    // Create many signals
    const signals = [];
    for (let i = 0; i < 1000; i++) {
      signals.push(signal(i));
    }
    
    // Create computed values
    const computed = signals.map(s => computed(() => s.value * 2));
    
    // Trigger updates
    signals.forEach((s, i) => s.value = i * 2);
    
    const duration = performance.now() - start;
    setRenderTimes([...renderTimes.slice(-19), duration]);
  };

  return html`
    <div class="section">
      <h2>Performance Metrics</h2>
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-value">${metrics.components?.created || 0}</div>
          <div class="metric-label">Components Created</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${metrics.signals?.created || 0}</div>
          <div class="metric-label">Signals Created</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${metrics.signals?.computations || 0}</div>
          <div class="metric-label">Computations</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${metrics.memory?.used?.toFixed(1) || 0} MB</div>
          <div class="metric-label">Memory Usage</div>
        </div>
      </div>

      <h2>Virtual Scroller Demo</h2>
      <div class="demo-box">
        <${VirtualList} />
      </div>

      <h2>Performance Test</h2>
      <div class="demo-box">
        <button @click=${runPerformanceTest}>
          Run Performance Test
        </button>
        <button @click=${() => app.performance.reset()}>
          Reset Metrics
        </button>
        
        ${renderTimes.length > 0 && html`
          <div class="performance-graph">
            ${renderTimes.map(time => html`
              <div 
                class="performance-bar" 
                style="height: ${(time / Math.max(...renderTimes)) * 100}%"
              ></div>
            `)}
          </div>
          <p>Last test: ${renderTimes[renderTimes.length - 1]?.toFixed(2)}ms</p>
        `}
      </div>
    </div>
  `;
}

// Virtual List Component
function VirtualList() {
  // Generate large dataset
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    description: `This is item number ${i + 1}`,
    value: Math.random()
  }));

  const scroller = app.virtualScroller.create({
    items,
    itemHeight: 60,
    containerHeight: 400
  });

  return html`
    <div class="virtual-list">
      <${scroller.component}
        items=${items}
        renderItem=${(item) => html`
          <div class="list-item">
            <strong>${item.name}</strong>
            <p>${item.description}</p>
            <small>Value: ${item.value.toFixed(3)}</small>
          </div>
        `}
      />
    </div>
  `;
}

// Helper middleware compose function
function compose(...fns) {
  return (ctx, next) => {
    let index = -1;
    
    const dispatch = (i) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      
      const fn = fns[i];
      if (!fn) return next ? next() : Promise.resolve();
      
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    };
    
    return dispatch(0);
  };
}

// Initialize app
const app = createApp(App);

// Install plugins
app.use(DevToolsPlugin);
app.use(LoggerPlugin, {
  level: 'debug',
  logLifecycle: true
});
app.use(PerformancePlugin);
app.use(CustomPlugin, { debug: true });
app.use(I18nPlugin, {
  defaultLocale: 'en',
  messages
});
app.use(VirtualScrollerPlugin);

// Mount app
app.mount('#app');

// Expose to window for debugging
window.app = app;
window.berryactDevTools = window.__NANO_DEVTOOLS__;