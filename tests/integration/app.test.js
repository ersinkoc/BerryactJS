import { createApp, signal, html, defineComponent } from '../../src/index.js';

describe('Application Integration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates and mounts simple app', () => {
    const App = defineComponent(() => {
      return html`<div>Hello World</div>`;
    });

    const app = createApp(App);
    const instance = app.mount(container);

    expect(container.innerHTML).toContain('Hello World');
    expect(instance.unmount).toBeInstanceOf(Function);
  });

  test('reactive updates work end-to-end', async () => {
    const count = signal(0);

    const App = defineComponent(() => {
      return html`<div>Count: ${count}</div>`;
    });

    const app = createApp(App);
    app.mount(container);

    expect(container.innerHTML).toContain('Count: 0');

    count.value = 5;

    // Wait for next tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.innerHTML).toContain('Count: 5');
  });

  test('event handlers work', async () => {
    const count = signal(0);
    let clicked = false;

    const App = defineComponent(() => {
      const handleClick = () => {
        clicked = true;
        count.value++;
      };

      return html`
        <div>
          <span>Count: ${count}</span>
          <button @click=${handleClick}>Increment</button>
        </div>
      `;
    });

    const app = createApp(App);
    app.mount(container);

    const button = container.querySelector('button');
    button.click();

    expect(clicked).toBe(true);

    // Wait for update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.innerHTML).toContain('Count: 1');
  });

  test('component props work', () => {
    const ChildComponent = defineComponent((props) => {
      return html`<div>Message: ${props.message}</div>`;
    });

    const App = defineComponent(() => {
      return html`<${ChildComponent} message="Hello from parent" />`;
    });

    const app = createApp(App);
    app.mount(container);

    expect(container.innerHTML).toContain('Message: Hello from parent');
  });

  test('nested components work', () => {
    const GrandChild = defineComponent((props) => {
      return html`<span>${props.text}</span>`;
    });

    const Child = defineComponent((props) => {
      return html`<div>Child: <${GrandChild} text=${props.text} /></div>`;
    });

    const App = defineComponent(() => {
      return html`
        <div>
          <h1>App</h1>
          <${Child} text="Hello World" />
        </div>
      `;
    });

    const app = createApp(App);
    app.mount(container);

    expect(container.innerHTML).toContain('App');
    expect(container.innerHTML).toContain('Child:');
    expect(container.innerHTML).toContain('Hello World');
  });

  test('app with options', () => {
    const App = defineComponent((props) => {
      return html`<div>Title: ${props.title}</div>`;
    });

    const app = createApp(App, { title: 'My App' });
    app.mount(container);

    expect(container.innerHTML).toContain('Title: My App');
  });

  test('app unmounting', () => {
    const App = defineComponent(() => {
      return html`<div>Hello World</div>`;
    });

    const app = createApp(App);
    const instance = app.mount(container);

    expect(container.innerHTML).toContain('Hello World');

    instance.unmount();
    expect(container.innerHTML).toBe('');
  });

  test('multiple app instances', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const App1 = defineComponent(() => html`<div>App 1</div>`);
    const App2 = defineComponent(() => html`<div>App 2</div>`);

    const app1 = createApp(App1);
    const app2 = createApp(App2);

    app1.mount(container1);
    app2.mount(container2);

    expect(container1.innerHTML).toContain('App 1');
    expect(container2.innerHTML).toContain('App 2');

    document.body.removeChild(container1);
    document.body.removeChild(container2);
  });
});
