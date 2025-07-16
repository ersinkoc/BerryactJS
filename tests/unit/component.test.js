import { defineComponent, createComponent, Component } from '../../src/core/component.js';
import { signal, html } from '../../src/index.js';

describe('Component System', () => {
  describe('Component class', () => {
    test('creates component with props', () => {
      class TestComponent extends Component {
        render() {
          return html`<div>${this.props.value.message}</div>`;
        }
      }

      const component = new TestComponent({ message: 'Hello' });
      expect(component.props.value.message).toBe('Hello');
    });

    test('can update props', () => {
      class TestComponent extends Component {
        render() {
          return html`<div>${this.props.value.message}</div>`;
        }
      }

      const component = new TestComponent({ message: 'Hello' });
      component.setProps({ message: 'Updated' });
      expect(component.props.value.message).toBe('Updated');
    });

    test('tracks mount state', () => {
      class TestComponent extends Component {
        render() {
          return html`<div>Test</div>`;
        }
      }

      const component = new TestComponent();
      expect(component.isMounted).toBe(false);

      const container = document.createElement('div');
      component.mount(container);
      expect(component.isMounted).toBe(true);

      component.unmount();
      expect(component.isMounted).toBe(false);
    });
  });

  describe('defineComponent', () => {
    test('creates component from render function', () => {
      const TestComponent = defineComponent((props) => {
        return html`<div>${props.message}</div>`;
      });

      const component = new TestComponent({ message: 'Hello' });
      expect(component).toBeInstanceOf(Component);
    });

    test('render function receives props', () => {
      let receivedProps = null;

      const TestComponent = defineComponent((props) => {
        receivedProps = props;
        return html`<div>Test</div>`;
      });

      const component = new TestComponent({ message: 'Hello' });
      component.render();

      expect(receivedProps.message).toBe('Hello');
    });
  });

  describe('createComponent', () => {
    test('creates component instance', () => {
      const renderFn = (props) => html`<div>${props.message}</div>`;
      const component = createComponent(renderFn, { message: 'Hello' });

      expect(component).toBeInstanceOf(Component);
      expect(component.props.value.message).toBe('Hello');
    });

    test('works without props', () => {
      const renderFn = () => html`<div>Hello</div>`;
      const component = createComponent(renderFn);

      expect(component).toBeInstanceOf(Component);
    });
  });

  describe('component lifecycle', () => {
    test('calls render on mount', () => {
      let renderCalled = false;

      const TestComponent = defineComponent(() => {
        renderCalled = true;
        return html`<div>Test</div>`;
      });

      const component = new TestComponent();
      const container = document.createElement('div');

      component.mount(container);
      expect(renderCalled).toBe(true);
    });

    test('cleans up on unmount', () => {
      const TestComponent = defineComponent(() => {
        return html`<div>Test</div>`;
      });

      const component = new TestComponent();
      const container = document.createElement('div');

      component.mount(container);
      expect(component.element).toBeTruthy();

      component.unmount();
      expect(component.isMounted).toBe(false);
    });
  });

  describe('component reactivity', () => {
    test('updates when signal changes', async () => {
      const count = signal(0);
      let renderCount = 0;

      const TestComponent = defineComponent(() => {
        renderCount++;
        return html`<div>${count}</div>`;
      });

      const component = new TestComponent();
      const container = document.createElement('div');
      component.mount(container);

      expect(renderCount).toBe(1);

      count.value = 5;
      // Wait for next tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(renderCount).toBe(2);
    });
  });
});
