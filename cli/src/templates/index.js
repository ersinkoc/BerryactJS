// Template system for Berryact CLI

export async function getTemplateFiles(template, options) {
  const {
    typescript = false,
    router = false,
    store = false,
    ssr = false,
    pwa = false,
    features = []
  } = options;

  const ext = typescript ? 'ts' : 'js';
  const templateConfig = {
    directories: [
      'src',
      'src/components',
      'src/pages',
      'public',
      'tests'
    ],
    files: [],
    dependencies: {
      '@oxog/berryact': '^1.0.0'
    },
    devDependencies: {
      'vite': '^4.0.0'
    },
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    }
  };

  // Add router dependencies
  if (router) {
    templateConfig.directories.push('src/router');
    templateConfig.dependencies['@oxog/berryact-router'] = '^1.0.0';
  }

  // Add store dependencies
  if (store) {
    templateConfig.directories.push('src/store');
    templateConfig.dependencies['@oxog/berryact-store'] = '^1.0.0';
  }

  // Add SSR dependencies
  if (ssr) {
    templateConfig.dependencies['@oxog/berryact-ssr'] = '^1.0.0';
    templateConfig.dependencies['express'] = '^4.18.0';
    templateConfig.scripts['build:ssr'] = 'berryact build --ssr';
    templateConfig.scripts['start'] = 'node server.js';
  }

  // Add PWA dependencies
  if (pwa) {
    templateConfig.devDependencies['vite-plugin-pwa'] = '^0.16.0';
    templateConfig.directories.push('public/sw');
  }

  // Add TypeScript dependencies
  if (typescript) {
    templateConfig.devDependencies['typescript'] = '^5.0.0';
    templateConfig.devDependencies['@types/node'] = '^20.0.0';
  }

  // Add feature dependencies
  if (features.includes('linting')) {
    templateConfig.devDependencies['eslint'] = '^8.0.0';
    templateConfig.devDependencies['prettier'] = '^3.0.0';
    templateConfig.scripts['lint'] = 'eslint src --ext .js,.ts';
    templateConfig.scripts['format'] = 'prettier --write src';
  }

  if (features.includes('testing')) {
    templateConfig.devDependencies['jest'] = '^29.0.0';
    templateConfig.devDependencies['@testing-library/jest-dom'] = '^6.0.0';
    templateConfig.scripts['test'] = 'jest';
    templateConfig.scripts['test:watch'] = 'jest --watch';
  }

  // Generate template files based on configuration
  switch (template) {
    case 'default':
      templateConfig.files = getDefaultTemplate(ext, options);
      break;
    case 'spa':
      templateConfig.files = getSPATemplate(ext, options);
      break;
    case 'ssr':
      templateConfig.files = getSSRTemplate(ext, options);
      break;
    case 'pwa':
      templateConfig.files = getPWATemplate(ext, options);
      break;
    case 'library':
      templateConfig.files = getLibraryTemplate(ext, options);
      break;
    case 'minimal':
      templateConfig.files = getMinimalTemplate(ext, options);
      break;
    default:
      throw new Error(`Unknown template: ${template}`);
  }

  return templateConfig;
}

function getDefaultTemplate(ext, options) {
  return [
    // Main entry point
    {
      path: `src/main.${ext}`,
      template: true,
      content: `import { createApp } from '@oxog/berryact';
import App from './App.${ext}';
${options.router ? "import router from './router/index.js';" : ''}
${options.store ? "import store from './store/index.js';" : ''}

const app = createApp(App);

${options.router ? 'app.useRouter(router);' : ''}
${options.store ? 'app.useStore(store);' : ''}

app.mount('#app');`
    },
    
    // Root component
    {
      path: `src/App.${ext}`,
      template: true,
      content: `import { html, signal } from '@oxog/berryact';
${options.router ? "import { RouterOutlet } from '@oxog/berryact-router';" : ''}

export default function App() {
  const count = signal(0);

  return html\`
    <div class="app">
      <header class="app-header">
        <h1>Welcome to Berryact</h1>
        ${options.router ? '<nav><a href="/">Home</a> | <a href="/about">About</a></nav>' : ''}
      </header>
      <main class="app-main">
        ${options.router ? '<RouterOutlet />' : `
        <div class="counter">
          <p>Count: \${count}</p>
          <button @click=\${() => count.value++}>Increment</button>
        </div>`}
      </main>
    </div>
  \`;
}`
    },

    // HTML template
    {
      path: 'index.html',
      template: true,
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ projectName }}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>`
    },

    // Vite config
    {
      path: 'vite.config.js',
      template: true,
      content: `import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    target: 'es2020'
  }
});`
    },

    // Styles
    {
      path: 'src/style.css',
      template: false,
      content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.counter button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: #ffffff;
  cursor: pointer;
  transition: border-color 0.25s;
}

.counter button:hover {
  border-color: #646cff;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  
  .counter button {
    background-color: #f9f9f9;
    color: #213547;
  }
}`
    }
  ];
}

function getSPATemplate(ext, options) {
  const files = getDefaultTemplate(ext, options);
  
  // Add router configuration
  if (options.router) {
    files.push({
      path: `src/router/index.${ext}`,
      template: true,
      content: `import { createRouter } from '@oxog/berryact-router';
import Home from '../pages/Home.${ext}';
import About from '../pages/About.${ext}';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

export default router;`
    });

    files.push({
      path: `src/pages/Home.${ext}`,
      template: true,
      content: `import { html } from '@oxog/berryact';

export default function Home() {
  return html\`
    <div class="page">
      <h2>Home Page</h2>
      <p>Welcome to your Berryact SPA!</p>
    </div>
  \`;
}`
    });

    files.push({
      path: `src/pages/About.${ext}`,
      template: true,
      content: `import { html } from '@oxog/berryact';

export default function About() {
  return html\`
    <div class="page">
      <h2>About Page</h2>
      <p>This is a single page application built with Berryact.</p>
    </div>
  \`;
}`
    });
  }

  return files;
}

function getSSRTemplate(ext, options) {
  const files = getSPATemplate(ext, options);
  
  // Add SSR server
  files.push({
    path: 'server.js',
    template: true,
    content: `import express from 'express';
import { createSSRApp } from '@oxog/berryact-ssr';
import App from './src/App.${ext}';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('dist'));

app.get('*', async (req, res) => {
  try {
    const ssrApp = createSSRApp(App);
    const { html } = await ssrApp.renderToString({
      url: req.url
    });
    
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`
    });

  return files;
}

function getPWATemplate(ext, options) {
  const files = getSPATemplate(ext, options);
  
  // Add PWA manifest
  files.push({
    path: 'public/manifest.json',
    template: true,
    content: JSON.stringify({
      name: '{{ projectName }}',
      short_name: '{{ projectName }}',
      description: 'A Berryact PWA',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }, null, 2)
  });

  // Add service worker
  files.push({
    path: 'public/sw.js',
    template: false,
    content: `const CACHE_NAME = 'berryact-pwa-v1';
const urlsToCache = [
  '/',
  '/src/main.js',
  '/src/style.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});`
  });

  return files;
}

function getLibraryTemplate(ext, options) {
  return [
    {
      path: `src/index.${ext}`,
      template: true,
      content: `// Export your components here
export { default as Button } from './components/Button.${ext}';
export { default as Input } from './components/Input.${ext}';`
    },
    {
      path: `src/components/Button.${ext}`,
      template: true,
      content: `import { html } from '@oxog/berryact';

export default function Button({ children, variant = 'primary', ...props }) {
  return html\`
    <button class="btn btn-\${variant}" ...props>
      \${children}
    </button>
  \`;
}`
    }
  ];
}

function getMinimalTemplate(ext, options) {
  return [
    {
      path: `src/main.${ext}`,
      template: true,
      content: `import { createApp, html, signal } from '@oxog/berryact';

function App() {
  const message = signal('Hello Berryact!');
  
  return html\`
    <div>
      <h1>\${message}</h1>
    </div>
  \`;
}

createApp(App).mount('#app');`
    },
    {
      path: 'index.html',
      template: true,
      content: `<!DOCTYPE html>
<html>
  <head>
    <title>{{ projectName }}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>`
    }
  ];
}