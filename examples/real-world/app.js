import {
  createApp,
  createRouter,
  createStore,
  signal,
  computed,
  html,
  useState,
  useEffect,
} from '../../src/index.js';

// API Service
class ApiService {
  constructor(baseURL = 'https://api.realworld.io/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Articles
  async getArticles(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/articles?${searchParams}`);
  }

  async getArticle(slug) {
    return this.request(`/articles/${slug}`);
  }

  async getFeedArticles(token, params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/articles/feed?${searchParams}`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  // Authentication
  async login(credentials) {
    return this.request('/users/login', {
      method: 'POST',
      body: { user: credentials },
    });
  }

  async register(userData) {
    return this.request('/users', {
      method: 'POST',
      body: { user: userData },
    });
  }

  // User
  async getCurrentUser(token) {
    return this.request('/user', {
      headers: { Authorization: `Token ${token}` },
    });
  }

  // Tags
  async getTags() {
    return this.request('/tags');
  }
}

const api = new ApiService();

// Store
const store = createStore({
  state: {
    user: null,
    token: localStorage.getItem('token'),
    articles: [],
    currentArticle: null,
    tags: [],
    loading: false,
    error: null,
    filters: {
      tag: null,
      author: null,
      favorited: null,
      limit: 20,
      offset: 0,
    },
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    articlesCount: (state) => state.articles.length,
  },

  mutations: {
    setLoading(state, loading) {
      state.loading = loading;
    },

    setError(state, error) {
      state.error = error;
    },

    setUser(state, user) {
      state.user = user;
    },

    setToken(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    },

    setArticles(state, articles) {
      state.articles = articles;
    },

    setCurrentArticle(state, article) {
      state.currentArticle = article;
    },

    setTags(state, tags) {
      state.tags = tags;
    },

    setFilter(state, { key, value }) {
      state.filters[key] = value;
      state.filters.offset = 0; // Reset pagination
    },

    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },

  actions: {
    async loadArticles(context) {
      context.commit('setLoading', true);
      context.commit('setError', null);

      try {
        const params = {};
        Object.entries(context.state.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params[key] = value;
          }
        });

        const response = await api.getArticles(params);
        context.commit('setArticles', response.articles);
      } catch (error) {
        context.commit('setError', error.message);
      } finally {
        context.commit('setLoading', false);
      }
    },

    async loadArticle(context, slug) {
      context.commit('setLoading', true);
      try {
        const response = await api.getArticle(slug);
        context.commit('setCurrentArticle', response.article);
      } catch (error) {
        context.commit('setError', error.message);
      } finally {
        context.commit('setLoading', false);
      }
    },

    async loadTags(context) {
      try {
        const response = await api.getTags();
        context.commit('setTags', response.tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    },

    async login(context, credentials) {
      context.commit('setLoading', true);
      try {
        const response = await api.login(credentials);
        context.commit('setToken', response.user.token);
        context.commit('setUser', response.user);
        return response.user;
      } catch (error) {
        context.commit('setError', error.message);
        throw error;
      } finally {
        context.commit('setLoading', false);
      }
    },

    async register(context, userData) {
      context.commit('setLoading', true);
      try {
        const response = await api.register(userData);
        context.commit('setToken', response.user.token);
        context.commit('setUser', response.user);
        return response.user;
      } catch (error) {
        context.commit('setError', error.message);
        throw error;
      } finally {
        context.commit('setLoading', false);
      }
    },

    async loadCurrentUser(context) {
      if (!context.state.token) return;

      try {
        const response = await api.getCurrentUser(context.state.token);
        context.commit('setUser', response.user);
      } catch (error) {
        context.commit('logout');
      }
    },

    logout(context) {
      context.commit('logout');
    },
  },
});

// Components
function Header() {
  const isAuthenticated = computed(() => store.getters.isAuthenticated.value);
  const currentUser = computed(() => store.getters.currentUser.value);

  return html`
    <header class="header">
      <nav class="navbar">
        <div class="container">
          <a href="/" class="navbar-brand">conduit</a>
          <ul class="nav navbar-nav pull-xs-right">
            <li class="nav-item">
              <a class="nav-link" href="/">Home</a>
            </li>
            ${isAuthenticated.value
              ? html`
                  <li class="nav-item">
                    <a class="nav-link" href="/editor">
                      <i class="ion-compose"></i>&nbsp;New Article
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/settings">
                      <i class="ion-gear-a"></i>&nbsp;Settings
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/profile/${currentUser.value?.username}">
                      <img src="${currentUser.value?.image}" class="user-pic" />
                      ${currentUser.value?.username}
                    </a>
                  </li>
                `
              : html`
                  <li class="nav-item">
                    <a class="nav-link" href="/login">Sign in</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/register">Sign up</a>
                  </li>
                `}
          </ul>
        </div>
      </nav>
    </header>
  `;
}

function ArticlePreview({ article }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return html`
    <div class="article-preview">
      <div class="article-meta">
        <a href="/profile/${article.author.username}">
          <img src="${article.author.image}" alt="${article.author.username}" />
        </a>
        <div class="info">
          <a href="/profile/${article.author.username}" class="author">
            ${article.author.username}
          </a>
          <span class="date">${formatDate(article.createdAt)}</span>
        </div>
        <button class="btn btn-outline-primary btn-sm pull-xs-right">
          <i class="ion-heart"></i> ${article.favoritesCount}
        </button>
      </div>
      <a href="/article/${article.slug}" class="preview-link">
        <h1>${article.title}</h1>
        <p>${article.description}</p>
        <span>Read more...</span>
        <ul class="tag-list">
          ${article.tagList.map(
            (tag) => html` <li class="tag-default tag-pill tag-outline">${tag}</li> `
          )}
        </ul>
      </a>
    </div>
  `;
}

function ArticleList() {
  const articles = computed(() => store.state.articles);
  const loading = computed(() => store.state.loading);

  if (loading.value) {
    return html`<div class="article-preview">Loading articles...</div>`;
  }

  if (articles.value.length === 0) {
    return html`<div class="article-preview">No articles are here... yet.</div>`;
  }

  return html` <div>${articles.value.map((article) => ArticlePreview({ article }))}</div> `;
}

function TagList() {
  const tags = computed(() => store.state.tags);

  useEffect(() => {
    store.dispatch('loadTags');
  }, []);

  const handleTagClick = (tag) => {
    store.commit('setFilter', { key: 'tag', value: tag });
    store.dispatch('loadArticles');
  };

  return html`
    <div class="sidebar">
      <p>Popular Tags</p>
      <div class="tag-list">
        ${tags.value.map(
          (tag) => html`
            <a
              href="#"
              class="tag-pill tag-default"
              @click=${(e) => {
                e.preventDefault();
                handleTagClick(tag);
              }}
            >
              ${tag}
            </a>
          `
        )}
      </div>
    </div>
  `;
}

function Home() {
  const isAuthenticated = computed(() => store.getters.isAuthenticated.value);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    store.dispatch('loadArticles');
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'feed') {
      // Load feed articles
    } else {
      store.commit('setFilter', { key: 'tag', value: null });
      store.dispatch('loadArticles');
    }
  };

  return html`
    <div class="home-page">
      <div class="banner">
        <div class="container">
          <h1 class="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div class="container page">
        <div class="row">
          <div class="col-md-9">
            <div class="feed-toggle">
              <ul class="nav nav-pills outline-active">
                ${isAuthenticated.value
                  ? html`
                      <li class="nav-item">
                        <a
                          class="nav-link ${activeTab === 'feed' ? 'active' : ''}"
                          href="#"
                          @click=${(e) => {
                            e.preventDefault();
                            switchTab('feed');
                          }}
                        >
                          Your Feed
                        </a>
                      </li>
                    `
                  : ''}
                <li class="nav-item">
                  <a
                    class="nav-link ${activeTab === 'global' ? 'active' : ''}"
                    href="#"
                    @click=${(e) => {
                      e.preventDefault();
                      switchTab('global');
                    }}
                  >
                    Global Feed
                  </a>
                </li>
              </ul>
            </div>

            <${ArticleList} />
          </div>

          <div class="col-md-3">
            <${TagList} />
          </div>
        </div>
      </div>
    </div>
  `;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const loading = computed(() => store.state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await store.dispatch('login', { email, password });
      router.push('/');
    } catch (error) {
      setErrors({ general: 'Invalid email or password' });
    }
  };

  return html`
    <div class="auth-page">
      <div class="container page">
        <div class="row">
          <div class="col-md-6 offset-md-3 col-xs-12">
            <h1 class="text-xs-center">Sign in</h1>
            <p class="text-xs-center">
              <a href="/register">Need an account?</a>
            </p>

            ${errors.general
              ? html`
                  <ul class="error-messages">
                    <li>${errors.general}</li>
                  </ul>
                `
              : ''}

            <form @submit=${handleSubmit}>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  value=${email}
                  @input=${(e) => setEmail(e.target.value)}
                  required
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  value=${password}
                  @input=${(e) => setPassword(e.target.value)}
                  required
                />
              </fieldset>
              <button
                class="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled=${loading.value}
              >
                ${loading.value ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const loading = computed(() => store.state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await store.dispatch('register', { username, email, password });
      router.push('/');
    } catch (error) {
      setErrors({ general: 'Registration failed' });
    }
  };

  return html`
    <div class="auth-page">
      <div class="container page">
        <div class="row">
          <div class="col-md-6 offset-md-3 col-xs-12">
            <h1 class="text-xs-center">Sign up</h1>
            <p class="text-xs-center">
              <a href="/login">Have an account?</a>
            </p>

            ${errors.general
              ? html`
                  <ul class="error-messages">
                    <li>${errors.general}</li>
                  </ul>
                `
              : ''}

            <form @submit=${handleSubmit}>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                  value=${username}
                  @input=${(e) => setUsername(e.target.value)}
                  required
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  value=${email}
                  @input=${(e) => setEmail(e.target.value)}
                  required
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  value=${password}
                  @input=${(e) => setPassword(e.target.value)}
                  required
                />
              </fieldset>
              <button
                class="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled=${loading.value}
              >
                ${loading.value ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function Article() {
  const article = computed(() => store.state.currentArticle);
  const loading = computed(() => store.state.loading);

  useEffect(() => {
    const slug = router.params.value.slug;
    if (slug) {
      store.dispatch('loadArticle', slug);
    }
  }, []);

  if (loading.value) {
    return html`<div class="article-page">Loading article...</div>`;
  }

  if (!article.value) {
    return html`<div class="article-page">Article not found.</div>`;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return html`
    <div class="article-page">
      <div class="banner">
        <div class="container">
          <h1>${article.value.title}</h1>

          <div class="article-meta">
            <a href="/profile/${article.value.author.username}">
              <img src="${article.value.author.image}" alt="${article.value.author.username}" />
            </a>
            <div class="info">
              <a href="/profile/${article.value.author.username}" class="author">
                ${article.value.author.username}
              </a>
              <span class="date">${formatDate(article.value.createdAt)}</span>
            </div>
            <button class="btn btn-sm btn-outline-secondary">
              <i class="ion-plus-round"></i>
              &nbsp; Follow ${article.value.author.username}
            </button>
            &nbsp;&nbsp;
            <button class="btn btn-sm btn-outline-primary">
              <i class="ion-heart"></i>
              &nbsp; Favorite Post <span class="counter">(${article.value.favoritesCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div class="container page">
        <div class="row article-content">
          <div class="col-md-12">
            <div class="article-body">
              ${article.value.body
                .split('\n')
                .map((paragraph) => (paragraph.trim() ? html`<p>${paragraph}</p>` : ''))}
            </div>
            <ul class="tag-list">
              ${article.value.tagList.map(
                (tag) => html` <li class="tag-default tag-pill tag-outline">${tag}</li> `
              )}
            </ul>
          </div>
        </div>

        <hr />

        <div class="article-actions">
          <div class="article-meta">
            <a href="/profile/${article.value.author.username}">
              <img src="${article.value.author.image}" alt="${article.value.author.username}" />
            </a>
            <div class="info">
              <a href="/profile/${article.value.author.username}" class="author">
                ${article.value.author.username}
              </a>
              <span class="date">${formatDate(article.value.createdAt)}</span>
            </div>
            <button class="btn btn-sm btn-outline-secondary">
              <i class="ion-plus-round"></i>
              &nbsp; Follow ${article.value.author.username}
            </button>
            &nbsp;
            <button class="btn btn-sm btn-outline-primary">
              <i class="ion-heart"></i>
              &nbsp; Favorite Post <span class="counter">(${article.value.favoritesCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function App() {
  const error = computed(() => store.state.error);

  useEffect(() => {
    // Load current user if token exists
    store.dispatch('loadCurrentUser');
  }, []);

  return html`
    <div class="app">
      <${Header} />

      ${error.value
        ? html`
            <div class="error-banner">
              <div class="container">
                <p class="error-message">${error.value}</p>
                <button @click=${() => store.commit('setError', null)}>×</button>
              </div>
            </div>
          `
        : ''}

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <div class="container">
          <a href="/" class="logo-font">conduit</a>
          <span class="attribution">
            An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code
            &amp; design licensed under MIT. Built with
            <a href="https://berryact.dev">Berryact Framework</a>.
          </span>
        </div>
      </footer>
    </div>
  `;
}

// Router
const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/article/:slug', component: Article },
  ],
});

// Initialize app
const app = createApp(App);
app.useRouter(router);
app.useStore(store);
app.mount('#app');
