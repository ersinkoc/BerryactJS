import { html, computed } from '../../../src/index.js';

export default function Home() {
  const { t } = app.i18n;
  const user = computed(() => app.store.state.user);
  
  const handleLogin = async () => {
    await app.store.dispatch('login', {
      name: 'Demo User',
      email: 'demo@example.com'
    });
  };
  
  return html`
    <div class="card">
      <h1>${t('home.welcome')}</h1>
      <p>${t('home.description')}</p>
      
      ${!user.value ? html`
        <button class="btn-primary" @click=${handleLogin}>
          Demo Login
        </button>
      ` : html`
        <p>Welcome, ${user.value.name}!</p>
      `}
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