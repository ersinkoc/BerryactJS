// Tests for dual syntax support (JSX and template literals)
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, cleanup } from '../src/testing/test-utils.js';
import { jsx, jsxs, Fragment } from '../src/jsx-runtime.js';
import { html, createSignal, createEffect } from '../src/index.js';

describe('Dual Syntax Support', () => {
  afterEach(cleanup);

  describe('JSX Syntax', () => {
    test('renders basic JSX element', () => {
      const element = jsx('div', {
        className: 'test',
        children: 'Hello JSX'
      });

      const { container } = render(() => element);
      const div = container.querySelector('.test');
      
      expect(div).toBeTruthy();
      expect(div.textContent).toBe('Hello JSX');
    });

    test('handles JSX props transformation', () => {
      const element = jsx('button', {
        className: 'btn',
        onClick: jest.fn(),
        htmlFor: 'input-id',
        children: 'Click me'
      });

      const { container } = render(() => element);
      const button = container.querySelector('.btn');
      
      expect(button.className).toBe('btn');
      expect(button.getAttribute('for')).toBe('input-id');
    });

    test('renders JSX components with signals', () => {
      function Counter() {
        const [count, setCount] = createSignal(0);
        
        return jsx('div', {
          children: [
            jsx('span', { children: count() }),
            jsx('button', {
              onClick: () => setCount(count() + 1),
              children: 'Increment'
            })
          ]
        });
      }

      const { container } = render(Counter);
      const span = container.querySelector('span');
      const button = container.querySelector('button');
      
      expect(span.textContent).toBe('0');
      
      fireEvent.click(button);
      expect(span.textContent).toBe('1');
    });

    test('handles JSX fragments', () => {
      const element = jsx(Fragment, {
        children: [
          jsx('div', { children: 'First' }),
          jsx('div', { children: 'Second' })
        ]
      });

      const { container } = render(() => element);
      const divs = container.querySelectorAll('div');
      
      expect(divs.length).toBe(2);
      expect(divs[0].textContent).toBe('First');
      expect(divs[1].textContent).toBe('Second');
    });

    test('handles nested JSX elements', () => {
      const element = jsx('article', {
        children: [
          jsx('header', {
            children: jsx('h1', { children: 'Title' })
          }),
          jsx('section', {
            children: jsx('p', { children: 'Content' })
          })
        ]
      });

      const { container } = render(() => element);
      
      expect(container.querySelector('h1').textContent).toBe('Title');
      expect(container.querySelector('p').textContent).toBe('Content');
    });
  });

  describe('Template Literal Syntax', () => {
    test('renders basic template literal', () => {
      const element = html`<div class="test">Hello Template</div>`;
      
      const { container } = render(() => element);
      const div = container.querySelector('.test');
      
      expect(div).toBeTruthy();
      expect(div.textContent).toBe('Hello Template');
    });

    test('handles dynamic values in templates', () => {
      const [name] = createSignal('World');
      const element = () => html`<div>Hello ${name()}</div>`;
      
      const { container } = render(element);
      
      expect(container.textContent).toContain('Hello World');
    });

    test('handles event handlers in templates', () => {
      const clicked = jest.fn();
      const element = html`<button @click=${clicked}>Click me</button>`;
      
      const { container } = render(() => element);
      const button = container.querySelector('button');
      
      fireEvent.click(button);
      expect(clicked).toHaveBeenCalled();
    });

    test('renders template components with signals', () => {
      function Counter() {
        const [count, setCount] = createSignal(0);
        
        return html`
          <div>
            <span>${count()}</span>
            <button @click=${() => setCount(count() + 1)}>
              Increment
            </button>
          </div>
        `;
      }

      const { container } = render(Counter);
      const span = container.querySelector('span');
      const button = container.querySelector('button');
      
      expect(span.textContent).toBe('0');
      
      fireEvent.click(button);
      expect(span.textContent).toBe('1');
    });

    test('handles template literal fragments', () => {
      const element = html`
        <>
          <div>First</div>
          <div>Second</div>
        </>
      `;

      const { container } = render(() => element);
      const divs = container.querySelectorAll('div');
      
      expect(divs.length).toBe(2);
      expect(divs[0].textContent).toBe('First');
      expect(divs[1].textContent).toBe('Second');
    });

    test('handles component interpolation in templates', () => {
      function Child({ text }) {
        return html`<span>${text}</span>`;
      }

      const element = html`
        <div>
          <${Child} text="Hello" />
        </div>
      `;

      const { container } = render(() => element);
      
      expect(container.querySelector('span').textContent).toBe('Hello');
    });
  });

  describe('Mixed Syntax', () => {
    test('JSX component can render template literal component', () => {
      function TemplateChild({ message }) {
        return html`<div class="template">${message}</div>`;
      }

      function JSXParent() {
        return jsx('div', {
          className: 'jsx',
          children: jsx(TemplateChild, { message: 'From JSX' })
        });
      }

      const { container } = render(JSXParent);
      
      expect(container.querySelector('.jsx')).toBeTruthy();
      expect(container.querySelector('.template').textContent).toBe('From JSX');
    });

    test('template literal component can render JSX component', () => {
      function JSXChild({ message }) {
        return jsx('div', {
          className: 'jsx',
          children: message
        });
      }

      function TemplateParent() {
        return html`
          <div class="template">
            <${JSXChild} message="From Template" />
          </div>
        `;
      }

      const { container } = render(TemplateParent);
      
      expect(container.querySelector('.template')).toBeTruthy();
      expect(container.querySelector('.jsx').textContent).toBe('From Template');
    });

    test('signals work across syntax boundaries', () => {
      const [count, setCount] = createSignal(0);

      function JSXDisplay() {
        return jsx('span', {
          className: 'jsx-display',
          children: count()
        });
      }

      function TemplateControls() {
        return html`
          <button @click=${() => setCount(count() + 1)}>
            Increment
          </button>
        `;
      }

      function App() {
        return html`
          <div>
            <${JSXDisplay} />
            <${TemplateControls} />
          </div>
        `;
      }

      const { container } = render(App);
      const span = container.querySelector('.jsx-display');
      const button = container.querySelector('button');
      
      expect(span.textContent).toBe('0');
      
      fireEvent.click(button);
      expect(span.textContent).toBe('1');
    });

    test('effects work with both syntaxes', () => {
      const log = jest.fn();

      function MixedComponent() {
        const [jsxValue, setJsxValue] = createSignal('JSX');
        const [templateValue, setTemplateValue] = createSignal('Template');

        createEffect(() => {
          log(`JSX: ${jsxValue()}, Template: ${templateValue()}`);
        });

        return jsx('div', {
          children: [
            jsx('button', {
              onClick: () => setJsxValue('JSX Updated'),
              children: 'Update JSX'
            }),
            html`
              <button @click=${() => setTemplateValue('Template Updated')}>
                Update Template
              </button>
            `
          ]
        });
      }

      const { container } = render(MixedComponent);
      const buttons = container.querySelectorAll('button');
      
      expect(log).toHaveBeenCalledWith('JSX: JSX, Template: Template');
      
      fireEvent.click(buttons[0]);
      expect(log).toHaveBeenCalledWith('JSX: JSX Updated, Template: Template');
      
      fireEvent.click(buttons[1]);
      expect(log).toHaveBeenCalledWith('JSX: JSX Updated, Template: Template Updated');
    });
  });

  describe('React Compatibility', () => {
    test('React-style hooks work with JSX', async () => {
      const { useState, useEffect } = await import('../src/compat/index.js');

      function ReactStyleComponent() {
        const [count, setCount] = useState(0);
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
          setMounted(true);
        }, []);

        return jsx('div', {
          children: [
            jsx('span', { children: `Count: ${count}` }),
            jsx('span', { children: `Mounted: ${mounted}` }),
            jsx('button', {
              onClick: () => setCount(count + 1),
              children: 'Increment'
            })
          ]
        });
      }

      const { container } = render(ReactStyleComponent);
      const spans = container.querySelectorAll('span');
      const button = container.querySelector('button');
      
      expect(spans[0].textContent).toBe('Count: 0');
      expect(spans[1].textContent).toBe('Mounted: true');
      
      fireEvent.click(button);
      expect(spans[0].textContent).toBe('Count: 1');
    });

    test('className is transformed to class', () => {
      const element = jsx('div', {
        className: 'test-class another-class',
        children: 'Test'
      });

      const { container } = render(() => element);
      const div = container.querySelector('div');
      
      expect(div.className).toBe('test-class another-class');
    });

    test('style objects are handled correctly', () => {
      const element = jsx('div', {
        style: {
          backgroundColor: 'red',
          fontSize: '16px',
          marginTop: '10px'
        },
        children: 'Styled'
      });

      const { container } = render(() => element);
      const div = container.querySelector('div');
      
      expect(div.style.backgroundColor).toBe('red');
      expect(div.style.fontSize).toBe('16px');
      expect(div.style.marginTop).toBe('10px');
    });
  });

  describe('Performance', () => {
    test('static templates are optimized', () => {
      // Static template should be hoisted
      const staticTemplate = () => html`
        <div class="static">
          <h1>Static Title</h1>
          <p>Static content that never changes</p>
        </div>
      `;

      const { container: container1 } = render(staticTemplate);
      const { container: container2 } = render(staticTemplate);
      
      // Both renders should produce identical DOM
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    test('fine-grained updates with signals', () => {
      const renderCount = jest.fn();
      const [name, setName] = createSignal('John');
      const [age, setAge] = createSignal(30);

      function NameDisplay() {
        renderCount('name');
        return html`<div>Name: ${name()}</div>`;
      }

      function AgeDisplay() {
        renderCount('age');
        return html`<div>Age: ${age()}</div>`;
      }

      function App() {
        return html`
          <div>
            <${NameDisplay} />
            <${AgeDisplay} />
          </div>
        `;
      }

      render(App);
      
      expect(renderCount).toHaveBeenCalledTimes(2);
      expect(renderCount).toHaveBeenCalledWith('name');
      expect(renderCount).toHaveBeenCalledWith('age');
      
      renderCount.mockClear();
      
      // Only NameDisplay should re-render
      setName('Jane');
      expect(renderCount).toHaveBeenCalledTimes(1);
      expect(renderCount).toHaveBeenCalledWith('name');
    });
  });
});