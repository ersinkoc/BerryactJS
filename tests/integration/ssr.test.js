import { SSRRenderer, SSRContext, Hydrator } from '../../src/ssr/index.js';
import { html, signal } from '../../src/index.js';

// Mock JSDOM for SSR testing
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {
        documentElement: { outerHTML: '<html></html>' },
        createElement: jest.fn().mockReturnValue({
          style: {},
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }),
        querySelector: jest.fn(),
        addEventListener: jest.fn()
      },
      navigator: {},
      location: { href: 'http://localhost' },
      history: {},
      requestAnimationFrame: jest.fn(),
      cancelAnimationFrame: jest.fn(),
      requestIdleCallback: jest.fn(),
      IntersectionObserver: jest.fn(),
      ResizeObserver: jest.fn()
    }
  }))
}));

describe('Server-Side Rendering', () => {
  describe('SSRContext', () => {
    test('creates context with default options', () => {
      const context = new SSRContext();
      
      expect(context.url).toBe('/');
      expect(context.isSSR).toBe(true);
      expect(context.state).toEqual({});
      expect(context.meta).toEqual({});
    });

    test('creates context with custom options', () => {
      const context = new SSRContext({
        url: '/about',
        userAgent: 'TestAgent',
        state: { user: 'John' },
        meta: { title: 'About' }
      });
      
      expect(context.url).toBe('/about');
      expect(context.userAgent).toBe('TestAgent');
      expect(context.state).toEqual({ user: 'John' });
      expect(context.meta).toEqual({ title: 'About' });
    });

    test('addPreload adds preload link', () => {
      const context = new SSRContext();
      context.addPreload('/app.js', 'script', 'text/javascript');
      
      expect(context.hasPreload('/app.js', 'script', 'text/javascript')).toBe(true);
    });

    test('addPrefetch adds prefetch link', () => {
      const context = new SSRContext();
      context.addPrefetch('/data.json');
      
      expect(context.prefetch.has('/data.json')).toBe(true);
    });

    test('setMeta adds meta information', () => {
      const context = new SSRContext();
      context.setMeta('description', 'Test page');
      
      expect(context.meta.description).toBe('Test page');
    });
  });

  describe('SSRRenderer', () => {
    let renderer;

    beforeEach(() => {
      renderer = new SSRRenderer();
    });

    test('renders simple component to string', async () => {
      const SimpleComponent = () => html`<div>Hello SSR</div>`;
      
      const result = await renderer.renderToString(SimpleComponent);
      
      expect(result.html).toContain('Hello SSR');
      expect(result.state).toEqual({});
      expect(result.preload).toEqual([]);
      expect(result.prefetch).toEqual([]);
    });

    test('renders component with props', async () => {
      const ComponentWithProps = (props) => html`<h1>${props.title}</h1>`;
      const context = new SSRContext();
      
      // Mock component with props
      const wrappedComponent = () => ComponentWithProps({ title: 'SSR Test' });
      
      const result = await renderer.renderToString(wrappedComponent, context);
      
      expect(result.html).toContain('SSR Test');
    });

    test('escapes HTML in content', async () => {
      const ComponentWithHTML = () => html`<div>${'<script>alert("xss")</script>'}</div>`;
      
      const result = await renderer.renderToString(ComponentWithHTML);
      
      expect(result.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(result.html).not.toContain('<script>alert("xss")</script>');
    });

    test('handles nested components', async () => {
      const ChildComponent = (props) => html`<span>${props.text}</span>`;
      const ParentComponent = () => html`
        <div>
          <h1>Parent</h1>
          ${ChildComponent({ text: 'Child' })}
        </div>
      `;
      
      const result = await renderer.renderToString(ParentComponent);
      
      expect(result.html).toContain('Parent');
      expect(result.html).toContain('Child');
    });

    test('skips event handlers in SSR', async () => {
      const ComponentWithEvents = () => html`
        <button @click=${() => console.log('clicked')}>
          Click me
        </button>
      `;
      
      const result = await renderer.renderToString(ComponentWithEvents);
      
      expect(result.html).toContain('<button>');
      expect(result.html).toContain('Click me');
      expect(result.html).not.toContain('@click');
      expect(result.html).not.toContain('onclick');
    });

    test('handles self-closing tags', async () => {
      const ComponentWithInput = () => html`
        <div>
          <input type="text" value="test" />
          <br />
          <img src="/image.jpg" alt="test" />
        </div>
      `;
      
      const result = await renderer.renderToString(ComponentWithInput);
      
      expect(result.html).toContain('<input type="text" value="test" />');
      expect(result.html).toContain('<br />');
      expect(result.html).toContain('<img src="/image.jpg" alt="test" />');
    });

    test('handles boolean attributes', async () => {
      const ComponentWithBooleans = () => html`
        <input type="checkbox" checked=${true} disabled=${false} />
      `;
      
      const result = await renderer.renderToString(ComponentWithBooleans);
      
      expect(result.html).toContain('checked');
      expect(result.html).not.toContain('disabled');
    });

    test('renders arrays of components', async () => {
      const ListComponent = () => {
        const items = ['A', 'B', 'C'];
        return html`
          <ul>
            ${items.map(item => html`<li>${item}</li>`)}
          </ul>
        `;
      };
      
      const result = await renderer.renderToString(ListComponent);
      
      expect(result.html).toContain('<li>A</li>');
      expect(result.html).toContain('<li>B</li>');
      expect(result.html).toContain('<li>C</li>');
    });

    test('generates full HTML document', async () => {
      const App = () => html`<div>App Content</div>`;
      const context = new SSRContext();
      
      context.setMeta('description', 'Test app');
      context.addPreload('/app.js', 'script');
      context.addPrefetch('/data.json');
      context.state.user = 'John';
      
      const result = await renderer.renderToString(App, context);
      
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<meta name="description" content="Test app">');
      expect(result.html).toContain('<link rel="preload" href="/app.js" as="script">');
      expect(result.html).toContain('<link rel="prefetch" href="/data.json">');
      expect(result.html).toContain('window.__NANO_STATE__ = {"user":"John"}');
      expect(result.html).toContain('App Content');
    });
  });

  describe('Hydrator', () => {
    let hydrator;

    beforeEach(() => {
      hydrator = new Hydrator();
      
      // Mock window object for hydration
      global.window = {
        __NANO_STATE__: { user: 'John' }
      };
    });

    afterEach(() => {
      delete global.window;
    });

    test('throws error when called on server', () => {
      delete global.window;
      
      expect(() => {
        hydrator.hydrate(() => {}, document.createElement('div'));
      }).toThrow('Hydration can only run on the client');
    });

    test('marks elements for hydration', () => {
      const container = {
        nodeType: 1, // ELEMENT_NODE
        children: [
          { nodeType: 1, children: [] },
          { nodeType: 1, children: [] }
        ]
      };
      
      hydrator.markForHydration(container);
      
      expect(container._hydrating).toBe(true);
      expect(container.children[0]._hydrating).toBe(true);
      expect(container.children[1]._hydrating).toBe(true);
    });

    test('cleans up SSR state after hydration', () => {
      const component = () => html`<div>Test</div>`;
      const container = document.createElement('div');
      
      expect(global.window.__NANO_STATE__).toBeDefined();
      
      hydrator.hydrate(component, container);
      
      expect(global.window.__NANO_STATE__).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('handles component render errors gracefully', async () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };
      
      const renderer = new SSRRenderer();
      
      await expect(renderer.renderToString(ErrorComponent)).rejects.toThrow('Component error');
    });

    test('handles malformed templates', async () => {
      const MalformedComponent = () => html`<div><span>Unclosed div`;
      
      const renderer = new SSRRenderer();
      const result = await renderer.renderToString(MalformedComponent);
      
      // Should not crash, may produce imperfect HTML
      expect(result.html).toBeDefined();
    });

    test('handles null/undefined components', async () => {
      const NullComponent = () => null;
      const UndefinedComponent = () => undefined;
      
      const renderer = new SSRRenderer();
      
      const nullResult = await renderer.renderToString(NullComponent);
      const undefinedResult = await renderer.renderToString(UndefinedComponent);
      
      expect(nullResult.html).toBeDefined();
      expect(undefinedResult.html).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('caches rendered components', async () => {
      const ExpensiveComponent = () => {
        // Simulate expensive computation
        const start = Date.now();
        while (Date.now() - start < 10) {} // 10ms delay
        
        return html`<div>Expensive</div>`;
      };
      
      const renderer = new SSRRenderer();
      
      const start1 = Date.now();
      await renderer.renderToString(ExpensiveComponent);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await renderer.renderToString(ExpensiveComponent);
      const time2 = Date.now() - start2;
      
      // Second render should be faster due to caching
      expect(time2).toBeLessThan(time1);
    });
  });
});