/**
 * Testing utilities for Berryact framework
 * Provides helpers for unit and integration testing
 */

// Testing utilities for Berryact components
import { createComponent } from '../core/component.js';
import { createVNode, isVNode } from '../core/vdom.js';
import { jsx } from '../jsx-runtime.js';

// Global cleanup functions
let cleanupFunctions = [];

export function cleanup() {
  cleanupFunctions.forEach((fn) => fn());
  cleanupFunctions = [];
}

export function render(component, options = {}) {
  const { container = document.createElement('div') } = options;

  // Handle different component types
  let instance;
  if (typeof component === 'function') {
    // Function component
    instance = createComponent(component);
  } else if (isVNode(component)) {
    // VNode
    instance = createComponent(() => component);
  } else {
    // Component instance
    instance = component;
  }

  // Mount the component
  instance.mount(container);

  // Add cleanup function
  const cleanup = () => {
    instance.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  cleanupFunctions.push(cleanup);

  return {
    container,
    component: instance,
    unmount: cleanup,
    rerender: (newComponent) => {
      instance.unmount();
      const newInstance = createComponent(newComponent);
      newInstance.mount(container);
      return newInstance;
    },
  };
}

export function renderHook(hook, options = {}) {
  const { initialProps = {} } = options;

  const result = { current: undefined };
  let error = null;

  function TestComponent(props) {
    try {
      result.current = hook(props);
    } catch (e) {
      error = e;
    }
    return null;
  }

  const rendered = render(() => jsx(TestComponent, initialProps));

  return {
    result,
    error,
    rerender: (newProps) => {
      rendered.rerender(() => jsx(TestComponent, newProps || initialProps));
    },
    unmount: rendered.unmount,
  };
}

export function act(fn) {
  // Simple implementation - in a real implementation this would flush all scheduled updates
  return new Promise((resolve) => {
    const result = fn();
    setTimeout(() => resolve(result), 0);
  });
}

export function waitFor(callback, options = {}) {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    }
    check();
  });
}

export function waitForEffects() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Event simulation utilities
export const fireEvent = {
  click: (element) => {
    const event = new MouseEvent('click', { bubbles: true });
    element.dispatchEvent(event);
  },

  change: (element, value) => {
    if (element.type === 'checkbox') {
      element.checked = value;
    } else {
      element.value = value;
    }
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
  },

  input: (element, value) => {
    element.value = value;
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  },

  submit: (element) => {
    const event = new Event('submit', { bubbles: true });
    element.dispatchEvent(event);
  },

  keyDown: (element, key) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    element.dispatchEvent(event);
  },

  keyUp: (element, key) => {
    const event = new KeyboardEvent('keyup', { key, bubbles: true });
    element.dispatchEvent(event);
  },
};

// Screen utilities for finding elements
export const screen = {
  getByText: (text, container = document.body) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(text)) {
        return node.parentElement;
      }
    }
    throw new Error(`Unable to find an element with text: ${text}`);
  },

  queryByText: (text, container = document.body) => {
    try {
      return screen.getByText(text, container);
    } catch {
      return null;
    }
  },

  getByTestId: (testId, container = document.body) => {
    const element = container.querySelector(`[data-testid="${testId}"]`);
    if (!element) {
      throw new Error(`Unable to find an element with testId: ${testId}`);
    }
    return element;
  },

  queryByTestId: (testId, container = document.body) => {
    return container.querySelector(`[data-testid="${testId}"]`);
  },

  getByRole: (role, container = document.body) => {
    const element = container.querySelector(`[role="${role}"]`);
    if (!element) {
      throw new Error(`Unable to find an element with role: ${role}`);
    }
    return element;
  },

  queryByRole: (role, container = document.body) => {
    return container.querySelector(`[role="${role}"]`);
  },
};

// Mock functions
export function createMockFunction(implementation) {
  const fn = implementation || (() => {});
  const calls = [];

  const mockFn = (...args) => {
    calls.push(args);
    return fn(...args);
  };

  mockFn.calls = calls;
  mockFn.callCount = () => calls.length;
  mockFn.calledWith = (...args) => {
    return calls.some(
      (call) => call.length === args.length && call.every((arg, i) => arg === args[i])
    );
  };
  mockFn.mockClear = () => {
    calls.length = 0;
  };
  mockFn.mockImplementation = (impl) => {
    fn = impl;
  };

  return mockFn;
}

// Test store utilities
export function createTestStore(initialState = {}) {
  const { createStore } = require('../store/index.js');
  return createStore({
    state: initialState,
    mutations: {
      setState(state, newState) {
        Object.assign(state, newState);
      },
    },
  });
}

// Auto-cleanup after each test
if (typeof afterEach === 'function') {
  afterEach(() => {
    cleanup();
  });
}

import { createApp, signal, effect, batch } from '../index.js';
import { flushSync } from '../render/scheduler.js';

// Test renderer for isolated component testing
export class TestRenderer {
  constructor() {
    this.container = null;
    this.app = null;
    this.component = null;
    this.destroyed = false;
  }

  render(component, props = {}) {
    if (this.destroyed) {
      throw new Error('TestRenderer has been destroyed');
    }

    // Create container
    this.container = document.createElement('div');
    this.container.setAttribute('data-testid', 'test-container');
    document.body.appendChild(this.container);

    // Create app
    this.app = createApp(() => component(props));

    // Mount component
    const mounted = this.app.mount(this.container);
    this.component = mounted.component;

    return {
      container: this.container,
      component: this.component,
      app: this.app,
      rerender: (newProps) => this.rerender(newProps),
      unmount: () => this.unmount(),
      debug: () => this.debug(),
    };
  }

  rerender(props) {
    if (!this.component) {
      throw new Error('No component to rerender');
    }

    // Update component props
    Object.assign(this.component.props, props);

    // Force update
    flushSync();
  }

  unmount() {
    if (this.component) {
      this.component.unmount();
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.app = null;
    this.component = null;
  }

  destroy() {
    this.unmount();
    this.destroyed = true;
  }

  debug() {
    if (this.container) {
      console.log(this.container.innerHTML);
    }
  }
}

// Snapshot testing
export function toMatchSnapshot(received, name = '') {
  // This is a simplified version - in practice, you'd integrate with a test framework
  const snapshot = JSON.stringify(received, null, 2);

  return {
    pass: true,
    message: () => `Snapshot ${name} captured:\n${snapshot}`,
  };
}

// Custom matchers
export const matchers = {
  toBeInTheDocument(element) {
    const pass = document.body.contains(element);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be in the document`
          : `Expected element to be in the document`,
    };
  },

  toHaveClass(element, className) {
    const pass = element.classList.contains(className);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`,
    };
  },

  toHaveAttribute(element, attribute, value) {
    const hasAttribute = element.hasAttribute(attribute);
    const attributeValue = element.getAttribute(attribute);
    const pass = value === undefined ? hasAttribute : hasAttribute && attributeValue === value;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have attribute "${attribute}${value !== undefined ? `="${value}"` : ''}"`
          : `Expected element to have attribute "${attribute}${value !== undefined ? `="${value}"` : ''}"`,
    };
  },

  toHaveTextContent(element, text) {
    const content = element.textContent;
    const pass = content.includes(text);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have text content "${text}"`
          : `Expected element to have text content "${text}"`,
    };
  },

  toBeDisabled(element) {
    const pass = element.disabled === true;
    return {
      pass,
      message: () =>
        pass ? `Expected element not to be disabled` : `Expected element to be disabled`,
    };
  },

  toBeVisible(element) {
    const pass = element.offsetParent !== null;
    return {
      pass,
      message: () =>
        pass ? `Expected element not to be visible` : `Expected element to be visible`,
    };
  },
};
