export class HistoryManager {
  constructor(mode = 'history') {
    this.mode = mode;
    this.listeners = [];

    // Only set current if not in memory mode (will be set by child)
    if (mode !== 'memory') {
      this.current = this.getCurrentLocation();
    }

    if (typeof window !== 'undefined') {
      this.setupListeners();
    }
  }

  setupListeners() {
    // Store bound handlers for later removal
    this.popstateHandler = this.handlePopState.bind(this);
    this.hashchangeHandler = this.handleHashChange.bind(this);

    if (this.mode === 'history') {
      window.addEventListener('popstate', this.popstateHandler);
    } else if (this.mode === 'hash') {
      window.addEventListener('hashchange', this.hashchangeHandler);
    }
  }

  handlePopState(event) {
    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  handleHashChange(event) {
    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  getCurrentLocation() {
    if (typeof window === 'undefined') {
      return {
        pathname: '/',
        search: '',
        hash: '',
      };
    }

    if (this.mode === 'hash') {
      const hash = window.location.hash.slice(1) || '/';
      const [pathname, search = ''] = hash.split('?');

      return {
        pathname: pathname || '/',
        search: search ? '?' + search : '',
        hash: '',
      };
    }

    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    };
  }

  push(path) {
    if (typeof window === 'undefined') return;

    if (this.mode === 'history') {
      window.history.pushState({}, '', path);
    } else if (this.mode === 'hash') {
      window.location.hash = path;
    }

    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  replace(path) {
    if (typeof window === 'undefined') return;

    if (this.mode === 'history') {
      window.history.replaceState({}, '', path);
    } else if (this.mode === 'hash') {
      const href = window.location.href;
      const index = href.indexOf('#');
      const newHref = index >= 0 ? href.slice(0, index) + '#' + path : href + '#' + path;
      window.location.replace(newHref);
    }

    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  go(delta) {
    if (typeof window !== 'undefined') {
      window.history.go(delta);
    }
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  listen(callback) {
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.current);
      } catch (error) {
        console.error('Router listener error:', error);
      }
    });
  }

  getState() {
    return this.current;
  }

  /**
   * Dispose the history manager and clean up event listeners
   * @description Call this when the history manager is no longer needed to prevent memory leaks
   */
  dispose() {
    if (typeof window !== 'undefined') {
      if (this.mode === 'history' && this.popstateHandler) {
        window.removeEventListener('popstate', this.popstateHandler);
      } else if (this.mode === 'hash' && this.hashchangeHandler) {
        window.removeEventListener('hashchange', this.hashchangeHandler);
      }
    }

    // Clear listeners
    this.listeners = [];
    this.popstateHandler = null;
    this.hashchangeHandler = null;
  }
}

export class MemoryHistory extends HistoryManager {
  constructor(initialEntries = ['/']) {
    super('memory');
    this.entries = [...initialEntries];
    this.index = 0;
    this.current = this.getCurrentLocation();
  }

  getCurrentLocation() {
    const path = this.entries[this.index] || '/';

    // Parse pathname, search, and hash
    let pathname = path;
    let search = '';
    let hash = '';

    // Extract hash first
    const hashIndex = path.indexOf('#');
    if (hashIndex !== -1) {
      hash = path.substring(hashIndex);
      pathname = path.substring(0, hashIndex);
    }

    // Extract search params
    const searchIndex = pathname.indexOf('?');
    if (searchIndex !== -1) {
      search = pathname.substring(searchIndex);
      pathname = pathname.substring(0, searchIndex);
    }

    return {
      pathname,
      search,
      hash,
    };
  }

  push(path) {
    this.index++;
    this.entries = this.entries.slice(0, this.index);
    this.entries.push(path);
    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  replace(path) {
    this.entries[this.index] = path;
    this.current = this.getCurrentLocation();
    this.notifyListeners();
  }

  go(delta) {
    const newIndex = this.index + delta;

    if (newIndex >= 0 && newIndex < this.entries.length) {
      this.index = newIndex;
      this.current = this.getCurrentLocation();
      this.notifyListeners();
    }
  }

  canGo(delta) {
    const newIndex = this.index + delta;
    return newIndex >= 0 && newIndex < this.entries.length;
  }
}
