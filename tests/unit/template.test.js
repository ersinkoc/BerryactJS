import { html, fragment, TemplateNode } from '../../src/template/parser.js';
import { signal } from '../../src/core/signal.js';

describe('Template System', () => {
  describe('html template literals', () => {
    test('creates simple template', () => {
      const template = html`<div>Hello World</div>`;
      expect(template).toBeInstanceOf(TemplateNode);
      expect(template.type).toBe('element');
      expect(template.tag).toBe('div');
    });

    test('handles interpolation', () => {
      const message = 'Hello';
      const template = html`<div>${message}</div>`;

      expect(template.children).toContain(message);
    });

    test('handles signal interpolation', () => {
      const count = signal(5);
      const template = html`<div>${count}</div>`;

      expect(template.children).toContain(count);
    });

    test('handles attributes', () => {
      const className = 'test-class';
      const template = html`<div class=${className}>Content</div>`;

      expect(template.props.class).toBe(className);
    });

    test('handles event handlers', () => {
      const handler = () => {};
      const template = html`<button @click=${handler}>Click</button>`;

      expect(template.props['@click']).toBe(handler);
    });

    test('handles nested elements', () => {
      const template = html`
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
        </div>
      `;

      expect(template.children).toHaveLength(2);
      expect(template.children[0].tag).toBe('h1');
      expect(template.children[1].tag).toBe('p');
    });

    test('handles mixed content', () => {
      const title = 'My Title';
      const template = html`
        <div>
          <h1>${title}</h1>
          Some text
        </div>
      `;

      // Check that h1 element contains the title
      const h1Element = template.children.find((child) => child.tag === 'h1');
      expect(h1Element).toBeDefined();
      expect(h1Element.children).toContain(title);

      // Check that text content contains "Some text"
      const textNode = template.children.find((child) => child.type === 'text');
      expect(textNode).toBeDefined();
      expect(textNode.children.join('')).toContain('Some text');
    });
  });

  describe('fragment', () => {
    test('creates fragment from children', () => {
      const frag = fragment(html`<div>First</div>`, html`<div>Second</div>`);

      expect(frag.type).toBe('fragment');
      expect(frag.children).toHaveLength(2);
    });

    test('flattens nested arrays', () => {
      const items = [html`<li>Item 1</li>`, html`<li>Item 2</li>`];

      const frag = fragment(...items);
      expect(frag.children).toHaveLength(2);
    });
  });

  describe('template compilation edge cases', () => {
    test('handles empty templates', () => {
      const template = html``;
      expect(template).toBeDefined();
    });

    test('handles self-closing tags', () => {
      const template = html`<input type="text" />`;
      expect(template.tag).toBe('input');
      expect(template.props.type).toBe('text');
    });

    test('handles boolean attributes', () => {
      const isDisabled = true;
      const template = html`<input disabled=${isDisabled} />`;
      expect(template.props.disabled).toBe(true);
    });

    test('handles complex expressions', () => {
      const user = { name: 'John', age: 30 };
      const template = html`<div>${user.name} is ${user.age} years old</div>`;

      // Check that the text content contains the interpolated values
      const textNode = template.children[0];
      expect(textNode.children).toContain(user.name);
      expect(textNode.children).toContain(user.age);
    });

    test('handles arrays in interpolation', () => {
      const items = ['A', 'B', 'C'];
      const template = html`<div>${items.map((item) => html`<span>${item}</span>`)}</div>`;

      expect(template.children[0]).toBeInstanceOf(Array);
      expect(template.children[0]).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    test('handles malformed HTML gracefully', () => {
      // Should not throw
      expect(() => {
        html`<div><span>Unclosed span</div>`;
      }).not.toThrow();
    });

    test('handles invalid expressions', () => {
      const template = html`<div>${undefined}</div>`;
      // undefined values should be filtered out or handled gracefully
      expect(template.children).toHaveLength(0);
    });
  });
});
