// Server-Side Rendering support for Berryact framework

import { JSDOM } from 'jsdom';

// SSR Context for server-side execution
export class SSRContext {
  constructor(options = {}) {
    this.url = options.url || '/';
    this.userAgent = options.userAgent || 'BerryactSSR/1.0';
    this.state = options.state || {};
    this.meta = options.meta || {};
    this.preload = new Set();
    this.prefetch = new Set();
    this.isSSR = true;
    
    this.setupDOM();
  }

  setupDOM() {
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: this.url,
      userAgent: this.userAgent,
      pretendToBeVisual: true,
      resources: 'usable'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.location = dom.window.location;
    global.history = dom.window.history;
    
    // Mock browser APIs for SSR
    this.mockBrowserAPIs();
  }

  mockBrowserAPIs() {
    global.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 16);
    };
    
    global.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
    
    global.requestIdleCallback = (callback) => {
      return setTimeout(() => callback({ timeRemaining: () => 50 }), 0);
    };
    
    global.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  addPreload(href, as, type) {
    this.preload.add({ href, as, type });
  }
  
  hasPreload(href, as, type) {
    return Array.from(this.preload).some(item => 
      item.href === href && item.as === as && item.type === type
    );
  }

  addPrefetch(href) {
    this.prefetch.add(href);
  }

  setMeta(name, content) {
    this.meta[name] = content;
  }

  getHTML() {
    return global.document.documentElement.outerHTML;
  }

  cleanup() {
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.location;
    delete global.history;
    delete global.requestAnimationFrame;
    delete global.cancelAnimationFrame;
    delete global.requestIdleCallback;
    delete global.IntersectionObserver;
    delete global.ResizeObserver;
  }
}

// SSR Renderer
export class SSRRenderer {
  constructor() {
    this.componentCache = new Map();
    this.renderCache = new Map();
  }

  async renderToString(component, context = new SSRContext()) {
    try {
      // Set up global SSR context
      global.__NANO_SSR__ = context;
      
      // Create component instance
      const app = typeof component === 'function' ? component() : component;
      
      // Render component tree to string
      const html = await this.renderComponent(app, context);
      
      // Generate full HTML document
      const fullHTML = this.generateHTML(html, context);
      
      return {
        html: fullHTML,
        state: context.state,
        preload: Array.from(context.preload),
        prefetch: Array.from(context.prefetch)
      };
      
    } finally {
      context.cleanup();
      delete global.__NANO_SSR__;
    }
  }

  async renderComponent(component, context) {
    if (!component) return '';
    
    if (typeof component === 'string' || typeof component === 'number') {
      return this.escapeHTML(String(component));
    }
    
    if (Array.isArray(component)) {
      const results = await Promise.all(
        component.map(child => this.renderComponent(child, context))
      );
      return results.join('');
    }
    
    // Handle VNode structure
    if (component.$$typeof && component.type) {
      return this.renderVNode(component, context);
    }
    
    // Legacy support for old structure
    if (component.type === 'element') {
      return this.renderElement(component, context);
    }
    
    if (component.type === 'text') {
      return this.renderText(component, context);
    }
    
    if (component.type === 'fragment') {
      const results = await Promise.all(
        component.children.map(child => this.renderComponent(child, context))
      );
      return results.join('');
    }
    
    if (typeof component.render === 'function') {
      const rendered = await component.render();
      return this.renderComponent(rendered, context);
    }
    
    return '';
  }

  async renderVNode(vnode, context) {
    const { type, props, children } = vnode;
    
    // Handle text nodes
    if (type === '#text') {
      return this.escapeHTML(String(props.nodeValue || ''));
    }
    
    // Handle fragments
    if (type === Symbol.for('berryact.fragment')) {
      const results = await Promise.all(
        children.map(child => this.renderComponent(child, context))
      );
      return results.join('');
    }
    
    // Handle component functions
    if (typeof type === 'function') {
      const componentResult = type(props);
      return this.renderComponent(componentResult, context);
    }
    
    // Handle HTML elements
    if (typeof type === 'string') {
      const propsStr = this.renderProps(props);
      const childrenStr = await Promise.all(
        children.map(child => this.renderComponent(child, context))
      );
      const childrenHTML = childrenStr.join('');
      
      // Self-closing tags
      if (this.isSelfClosing(type)) {
        return `<${type}${propsStr ? ' ' + propsStr : ''} />`;
      }
      
      return `<${type}${propsStr ? ' ' + propsStr : ''}>${childrenHTML}</${type}>`;
    }
    
    return '';
  }

  async renderElement(element, context) {
    const { tag, props, children } = element;
    
    if (this.isSelfClosing(tag)) {
      return `<${tag}${this.renderProps(props)} />`;
    }
    
    const childrenHTML = await Promise.all(
      children.map(child => this.renderComponent(child, context))
    );
    
    return `<${tag}${this.renderProps(props)}>${childrenHTML.join('')}</${tag}>`;
  }

  renderText(textNode, context) {
    if (Array.isArray(textNode.children)) {
      return textNode.children.map(child => {
        if (typeof child === 'string' || typeof child === 'number') {
          return this.escapeHTML(String(child));
        }
        return '';
      }).join('');
    }
    
    return this.escapeHTML(String(textNode.children));
  }

  renderProps(props) {
    const attributes = [];
    
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'key' || key.startsWith('@') || key.startsWith('on')) {
        return; // Skip event handlers and keys in SSR
      }
      
      if (key.startsWith('n-')) {
        return; // Skip directives in SSR
      }
      
      if (value === null || value === undefined || value === false) {
        return;
      }
      
      if (value === true) {
        attributes.push(key);
      } else {
        attributes.push(`${key}="${this.escapeHTML(String(value))}"`);
      }
    });
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
  }

  isSelfClosing(tag) {
    const selfClosingTags = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tag.toLowerCase());
  }

  escapeHTML(text) {
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }

  generateHTML(bodyHTML, context) {
    const metaTags = Object.entries(context.meta)
      .map(([name, content]) => `<meta name="${name}" content="${content}">`)
      .join('\n    ');
    
    const preloadTags = Array.from(context.preload)
      .map(({ href, as, type }) => 
        `<link rel="preload" href="${href}" as="${as}"${type ? ` type="${type}"` : ''}>`
      )
      .join('\n    ');
    
    const prefetchTags = Array.from(context.prefetch)
      .map(href => `<link rel="prefetch" href="${href}">`)
      .join('\n    ');
    
    const stateScript = Object.keys(context.state).length > 0 
      ? `<script>window.__NANO_STATE__ = ${JSON.stringify(context.state)};</script>`
      : '';
    
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags}
    ${preloadTags}
    ${prefetchTags}
  </head>
  <body>
    <div id="app">${bodyHTML}</div>
    ${stateScript}
  </body>
</html>`;
  }
}

// Hydration utilities for client-side
export class Hydrator {
  constructor() {
    this.hydrated = new WeakSet();
  }

  hydrate(component, container) {
    if (typeof window === 'undefined') {
      throw new Error('Hydration can only run on the client');
    }
    
    // Get SSR state if available
    const ssrState = window.__NANO_STATE__ || {};
    
    // Mark existing DOM nodes for hydration
    this.markForHydration(container);
    
    // Create component and hydrate
    const app = this.createHydratingApp(component, ssrState);
    app.mount(container);
    
    // Clean up SSR artifacts
    delete window.__NANO_STATE__;
    
    return app;
  }

  markForHydration(element) {
    if (element.nodeType === Node.ELEMENT_NODE) {
      element._hydrating = true;
      Array.from(element.children).forEach(child => {
        this.markForHydration(child);
      });
    }
  }

  createHydratingApp(component, state) {
    // This would integrate with the main app creation logic
    // but with hydration-specific behavior
    return {
      mount: (container) => {
        // Hydration-specific mounting logic
        this.hydrateComponent(component, container, state);
      }
    };
  }

  hydrateComponent(component, element, state) {
    // Hydration logic that reuses existing DOM where possible
    // and only creates new elements when necessary
    
    if (element._hydrating) {
      this.hydrated.add(element);
      element._hydrating = false;
      
      // Attach event listeners and reactive bindings
      this.attachBehaviors(component, element);
    }
  }

  attachBehaviors(component, element) {
    // Attach event listeners, reactive updates, etc.
    // that couldn't be serialized in SSR
  }
}

// SSR-specific component utilities
export function createSSRApp(component, options = {}) {
  return {
    async renderToString(context) {
      const renderer = new SSRRenderer();
      return renderer.renderToString(component, context);
    },
    
    hydrate(container, state) {
      const hydrator = new Hydrator();
      return hydrator.hydrate(component, container);
    }
  };
}

// Express.js middleware for easy integration
export function createSSRMiddleware(app, options = {}) {
  return async (req, res, next) => {
    try {
      const context = new SSRContext({
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      
      const result = await app.renderToString(context);
      
      res.set('Content-Type', 'text/html');
      res.send(result.html);
      
    } catch (error) {
      console.error('SSR Error:', error);
      next(error);
    }
  };
}

// Stream rendering for better performance
export class StreamRenderer extends SSRRenderer {
  renderToStream(component, context = new SSRContext()) {
    const { Readable } = require('stream');
    
    return new Readable({
      async read() {
        try {
          const result = await this.renderToString(component, context);
          this.push(result.html);
          this.push(null); // End stream
        } catch (error) {
          this.destroy(error);
        }
      }
    });
  }
}

// Exports are already defined with class declarations above