import {
  createApp,
  createRouter,
  createStore,
  html,
  signal,
  computed,
  effect,
  useState,
  useEffect,
  // Plugins
  DevToolsPlugin,
  LoggerPlugin,
  PerformancePlugin,
  I18nPlugin,
  TimeTravelPlugin,
  A11yPlugin,
  ServiceWorkerPlugin,
  ReactiveFormsPlugin,
  // Forms
  createForm,
  Validators,
  // Router
  TransitionManager,
  injectTransitionStyles,
  // Components
  Suspense,
  ErrorBoundary,
  createResource,
  lazy,
  // Testing
  TimeTravelDebugger,
} from '../../src/index.js';

// i18n messages
const messages = {
  en: {
    app: {
      title: 'Berryact Complete App',
      nav: {
        home: 'Home',
        forms: 'Forms',
        data: 'Data',
        about: 'About',
      },
    },
    home: {
      welcome: 'Welcome to Berryact Framework',
      description: 'This example demonstrates all the advanced features',
      features: {
        title: 'Features',
        forms: 'Reactive Forms with Validation',
        routing: 'Advanced Routing with Transitions',
        state: 'State Management with Time Travel',
        offline: 'Offline Support with Service Worker',
        a11y: 'Accessibility Features',
        i18n: 'Internationalization',
      },
    },
    forms: {
      title: 'Reactive Forms Demo',
      fields: {
        name: 'Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        age: 'Age',
        bio: 'Bio',
      },
      submit: 'Submit',
      reset: 'Reset',
      success: 'Form submitted successfully!',
    },
    data: {
      title: 'Data Management',
      loading: 'Loading data...',
      error: 'Failed to load data',
      retry: 'Retry',
      items: 'items',
    },
  },
  es: {
    app: {
      title: 'Aplicación Completa Berryact',
      nav: {
        home: 'Inicio',
        forms: 'Formularios',
        data: 'Datos',
        about: 'Acerca de',
      },
    },
    home: {
      welcome: 'Bienvenido a Berryact Framework',
      description: 'Este ejemplo demuestra todas las características avanzadas',
      features: {
        title: 'Características',
        forms: 'Formularios Reactivos con Validación',
        routing: 'Enrutamiento Avanzado con Transiciones',
        state: 'Gestión de Estado con Viaje en el Tiempo',
        offline: 'Soporte Sin Conexión con Service Worker',
        a11y: 'Características de Accesibilidad',
        i18n: 'Internacionalización',
      },
    },
    forms: {
      title: 'Demo de Formularios Reactivos',
      fields: {
        name: 'Nombre',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        age: 'Edad',
        bio: 'Biografía',
      },
      submit: 'Enviar',
      reset: 'Restablecer',
      success: '¡Formulario enviado con éxito!',
    },
    data: {
      title: 'Gestión de Datos',
      loading: 'Cargando datos...',
      error: 'Error al cargar datos',
      retry: 'Reintentar',
      items: 'elementos',
    },
  },
};

// Store setup
const store = createStore({
  state: {
    user: null,
    notifications: [],
    theme: 'light',
  },

  mutations: {
    setUser(state, user) {
      state.user = user;
    },

    addNotification(state, notification) {
      state.notifications.push({
        id: Date.now(),
        ...notification,
      });
    },

    removeNotification(state, id) {
      state.notifications = state.notifications.filter((n) => n.id !== id);
    },

    setTheme(state, theme) {
      state.theme = theme;
    },
  },

  actions: {
    login({ commit }, userData) {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          commit('setUser', userData);
          commit('addNotification', {
            type: 'success',
            message: 'Logged in successfully!',
          });
          resolve(userData);
        }, 1000);
      });
    },

    notify({ commit }, notification) {
      commit('addNotification', notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        commit('removeNotification', notification.id || Date.now());
      }, 5000);
    },
  },
});

// Router setup
const router = createRouter({
  routes: [
    {
      path: '/',
      component: () => import('./pages/Home.js').then((m) => m.default),
      meta: { title: 'Home', transition: { type: 'fade' } },
    },
    {
      path: '/forms',
      component: () => import('./pages/Forms.js').then((m) => m.default),
      meta: { title: 'Forms', transition: { type: 'slide' } },
    },
    {
      path: '/data',
      component: () => import('./pages/Data.js').then((m) => m.default),
      meta: { title: 'Data', transition: { type: 'scale' }, requiresAuth: true },
    },
    {
      path: '/about',
      component: lazy(() => import('./pages/About.js')),
      meta: { title: 'About' },
    },
  ],
});

// Add route guards
router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !store.state.user) {
    store.dispatch('notify', {
      type: 'error',
      message: 'Please login to access this page',
    });
    next('/');
  } else {
    next();
  }
});

// Layout component
function Layout({ children }) {
  const { t, locale, setLocale } = app.i18n;
  const notifications = computed(() => store.state.notifications);
  const currentRoute = router.currentRoute;

  return html`
    <div class="app-layout">
      <header>
        <div class="header-content">
          <a href="/" class="logo">${t('app.title')}</a>

          <nav role="navigation">
            <ul>
              <li>
                <a
                  href="/"
                  class=${currentRoute.value?.path === '/' ? 'active' : ''}
                  aria-current=${currentRoute.value?.path === '/' ? 'page' : undefined}
                >
                  ${t('app.nav.home')}
                </a>
              </li>
              <li>
                <a
                  href="/forms"
                  class=${currentRoute.value?.path === '/forms' ? 'active' : ''}
                  aria-current=${currentRoute.value?.path === '/forms' ? 'page' : undefined}
                >
                  ${t('app.nav.forms')}
                </a>
              </li>
              <li>
                <a
                  href="/data"
                  class=${currentRoute.value?.path === '/data' ? 'active' : ''}
                  aria-current=${currentRoute.value?.path === '/data' ? 'page' : undefined}
                >
                  ${t('app.nav.data')}
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  class=${currentRoute.value?.path === '/about' ? 'active' : ''}
                  aria-current=${currentRoute.value?.path === '/about' ? 'page' : undefined}
                >
                  ${t('app.nav.about')}
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <button
              class="btn-secondary"
              @click=${() => setLocale(locale.value === 'en' ? 'es' : 'en')}
              aria-label="Change language"
            >
              ${locale.value === 'en' ? 'ES' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      <main id="main" role="main">
        <router-outlet></router-outlet>
      </main>

      <!-- Notifications -->
      ${notifications.value.map(
        (notification) => html`
          <div class="notification ${notification.type}" role="alert" aria-live="polite">
            ${notification.message}
          </div>
        `
      )}

      <!-- Time Travel Debugger -->
      <div class="time-travel-toggle">
        <${TimeTravelDebugger} position="bottom-right" />
      </div>
    </div>
  `;
}

// Home page component
function Home() {
  const { t } = app.i18n;
  const [demoUser, setDemoUser] = useState(null);

  const handleLogin = async () => {
    const user = await store.dispatch('login', {
      name: 'Demo User',
      email: 'demo@example.com',
    });
    setDemoUser(user);
  };

  return html`
    <div class="card">
      <h1>${t('home.welcome')}</h1>
      <p>${t('home.description')}</p>

      ${!store.state.user
        ? html` <button class="btn-primary" @click=${handleLogin}>Demo Login</button> `
        : html` <p>Welcome, ${store.state.user.name}!</p> `}
    </div>

    <div class="card">
      <h2>${t('home.features.title')}</h2>
      <div class="grid">
        <div>
          <h3>📝 ${t('home.features.forms')}</h3>
          <p>Advanced form handling with validation and error messages</p>
        </div>
        <div>
          <h3>🚀 ${t('home.features.routing')}</h3>
          <p>Smooth page transitions and lazy loading</p>
        </div>
        <div>
          <h3>⏱️ ${t('home.features.state')}</h3>
          <p>Debug and travel through application state</p>
        </div>
        <div>
          <h3>📱 ${t('home.features.offline')}</h3>
          <p>Works offline with service worker caching</p>
        </div>
        <div>
          <h3>♿ ${t('home.features.a11y')}</h3>
          <p>Built with accessibility in mind</p>
        </div>
        <div>
          <h3>🌍 ${t('home.features.i18n')}</h3>
          <p>Support for multiple languages</p>
        </div>
      </div>
    </div>
  `;
}

// Forms page component
function Forms() {
  const { t } = app.i18n;

  const form = createForm({
    name: {
      value: '',
      validators: [Validators.required(), Validators.minLength(2)],
    },
    email: {
      value: '',
      validators: [Validators.required(), Validators.email()],
    },
    password: {
      value: '',
      validators: [
        Validators.required(),
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain uppercase, lowercase, and number'
        ),
      ],
    },
    confirmPassword: {
      value: '',
      validators: [Validators.required(), Validators.match('password', 'Passwords do not match')],
    },
    age: {
      value: '',
      validators: [Validators.min(18, 'Must be at least 18'), Validators.max(120, 'Invalid age')],
    },
    bio: {
      value: '',
      validators: [Validators.maxLength(500)],
    },
  });

  const handleSubmit = async (values) => {
    console.log('Form submitted:', values);

    store.dispatch('notify', {
      type: 'success',
      message: t('forms.success'),
    });

    // Reset form after success
    setTimeout(() => form.reset(), 2000);
  };

  return html`
    <div class="card">
      <h1>${t('forms.title')}</h1>

      <form
        ...${form.bind()}
        @submit=${(e) => {
          e.preventDefault();
          form.submit(handleSubmit);
        }}
      >
        <div class="form-group">
          <label for="name">${t('forms.fields.name')}</label>
          <input
            id="name"
            type="text"
            ...${form.getField('name').bind()}
            class=${form.getField('name').invalid.value ? 'invalid' : ''}
            aria-invalid=${form.getField('name').invalid.value}
            aria-describedby=${form.getField('name').error.value ? 'name-error' : undefined}
          />
          ${form.getField('name').error.value &&
          html`
            <div id="name-error" class="error-message" role="alert">
              ${form.getField('name').error.value}
            </div>
          `}
        </div>

        <div class="form-group">
          <label for="email">${t('forms.fields.email')}</label>
          <input
            id="email"
            type="email"
            ...${form.getField('email').bind()}
            class=${form.getField('email').invalid.value ? 'invalid' : ''}
          />
          ${form.getField('email').error.value &&
          html`
            <div class="error-message" role="alert">${form.getField('email').error.value}</div>
          `}
        </div>

        <div class="form-group">
          <label for="password">${t('forms.fields.password')}</label>
          <input
            id="password"
            type="password"
            ...${form.getField('password').bind()}
            class=${form.getField('password').invalid.value ? 'invalid' : ''}
          />
          ${form.getField('password').error.value &&
          html`
            <div class="error-message" role="alert">${form.getField('password').error.value}</div>
          `}
        </div>

        <div class="form-group">
          <label for="confirmPassword">${t('forms.fields.confirmPassword')}</label>
          <input
            id="confirmPassword"
            type="password"
            ...${form.getField('confirmPassword').bind()}
            class=${form.getField('confirmPassword').invalid.value ? 'invalid' : ''}
          />
          ${form.getField('confirmPassword').error.value &&
          html`
            <div class="error-message" role="alert">
              ${form.getField('confirmPassword').error.value}
            </div>
          `}
        </div>

        <div class="form-group">
          <label for="age">${t('forms.fields.age')}</label>
          <input
            id="age"
            type="number"
            ...${form.getField('age').bind()}
            class=${form.getField('age').invalid.value ? 'invalid' : ''}
          />
          ${form.getField('age').error.value &&
          html` <div class="error-message" role="alert">${form.getField('age').error.value}</div> `}
        </div>

        <div class="form-group">
          <label for="bio">${t('forms.fields.bio')}</label>
          <textarea
            id="bio"
            rows="4"
            ...${form.getField('bio').bind()}
            class=${form.getField('bio').invalid.value ? 'invalid' : ''}
          ></textarea>
          ${form.getField('bio').error.value &&
          html` <div class="error-message" role="alert">${form.getField('bio').error.value}</div> `}
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary"
            disabled=${form.invalid.value || form.submitting.value}
          >
            ${form.submitting.value
              ? html`
                  <span class="spinner" aria-hidden="true"></span>
                  <span>${t('forms.submit')}...</span>
                `
              : t('forms.submit')}
          </button>

          <button type="button" class="btn-secondary" @click=${() => form.reset()}>
            ${t('forms.reset')}
          </button>
        </div>
      </form>
    </div>
  `;
}

// Data page component with Suspense
function Data() {
  const { t } = app.i18n;

  // Simulate API call
  const dataResource = createResource(async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  });

  return html`
    <div class="card">
      <h1>${t('data.title')}</h1>
      
      <${ErrorBoundary}
        fallback=${({ error, reset }) => html`
          <div class="error">
            <p>${t('data.error')}: ${error.message}</p>
            <button class="btn-primary" @click=${reset}>${t('data.retry')}</button>
          </div>
        `}
      >
        <${Suspense}
          fallback=${html`
            <div class="loading">
              <div class="spinner"></div>
              <p>${t('data.loading')}</p>
            </div>
          `}
        >
          <${DataList} resource=${dataResource} />
        </${Suspense}>
      </${ErrorBoundary}>
    </div>
  `;
}

// Data list component
function DataList({ resource }) {
  const { t } = app.i18n;
  const data = resource.read();

  return html`
    <div>
      <p>${data.length} ${t('data.items')}</p>
      <div class="grid">
        ${data.slice(0, 9).map(
          (item) => html`
            <div class="card">
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </div>
          `
        )}
      </div>
    </div>
  `;
}

// About page (lazy loaded)
export function About() {
  return html`
    <div class="card">
      <h1>About</h1>
      <p>This is a complete example of the Berryact framework showcasing:</p>
      <ul>
        <li>Plugin system with multiple built-in plugins</li>
        <li>Reactive forms with comprehensive validation</li>
        <li>Advanced routing with transitions and guards</li>
        <li>State management with time-travel debugging</li>
        <li>Internationalization (i18n) support</li>
        <li>Accessibility features (a11y)</li>
        <li>Service worker for offline support</li>
        <li>Suspense for async data loading</li>
        <li>Error boundaries for graceful error handling</li>
        <li>Testing utilities</li>
      </ul>

      <p>
        The entire framework is under 15KB gzipped while providing a comprehensive set of features
        for building modern web applications.
      </p>
    </div>
  `;
}

// Main App
function App() {
  return html`
    <${ErrorBoundary}
      fallback=${({ error }) => html`
        <div class="error">
          <h1>Application Error</h1>
          <p>${error.message}</p>
        </div>
      `}
    >
      <${Layout}>
        <router-outlet></router-outlet>
      </${Layout}>
    </${ErrorBoundary}>
  `;
}

// Initialize app
const app = createApp(App);

// Install plugins
app.use(DevToolsPlugin);
app.use(LoggerPlugin, {
  level: 'info',
  logLifecycle: true,
});
app.use(PerformancePlugin);
app.use(I18nPlugin, {
  defaultLocale: 'en',
  messages,
});
app.use(TimeTravelPlugin, {
  maxHistory: 50,
  persistHistory: true,
});
app.use(A11yPlugin, {
  level: 'AA',
  autoScan: true,
  announceRouteChanges: true,
});
app.use(ServiceWorkerPlugin, {
  swUrl: '/sw.js',
  enableOfflineAnalytics: true,
});
app.use(ReactiveFormsPlugin);

// Set up router and store
app.useRouter(router);
app.useStore(store);

// Track store for time travel
app.timeTravel.trackStore('main', store);

// Inject transition styles
injectTransitionStyles();

// Mount app
app.mount('#app');

// Export for debugging
window.app = app;
