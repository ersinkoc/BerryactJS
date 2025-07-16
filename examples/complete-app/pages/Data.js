import { 
  html, 
  Suspense, 
  ErrorBoundary, 
  createResource 
} from '../../../src/index.js';

export default function Data() {
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
            <button class="btn-primary" @click=${reset}>
              ${t('data.retry')}
            </button>
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

function DataList({ resource }) {
  const { t } = app.i18n;
  const data = resource.read();
  
  return html`
    <div>
      <p>${data.length} ${t('data.items')}</p>
      <div class="grid">
        ${data.slice(0, 9).map(item => html`
          <article class="card" key=${item.id}>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
          </article>
        `)}
      </div>
    </div>
  `;
}