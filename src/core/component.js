import { signal, effect, batch } from './signal.js';
import { scheduleComponentUpdate } from './scheduler.js';
import { cleanupComponentEffects } from './hooks.js';
import { isVNode, Fragment } from './vdom.js';

let currentComponent = null;
let hookIndex = 0;

// Simple VNode to DOM conversion
function vNodeToDOM(vnode) {
  if (!vnode) return null;

  // Handle text nodes
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }

  // Handle signals - read their value to establish reactive dependency
  if (
    vnode &&
    typeof vnode === 'object' &&
    vnode.value !== undefined &&
    typeof vnode.peek === 'function'
  ) {
    return document.createTextNode(String(vnode.value));
  }

  // Handle null, undefined, boolean
  if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
    return document.createTextNode('');
  }

  // Handle arrays
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    vnode.forEach((child) => {
      const childDOM = vNodeToDOM(child);
      if (childDOM) fragment.appendChild(childDOM);
    });
    return fragment;
  }

  // Handle VNodes
  if (isVNode(vnode)) {
    // Handle text VNodes
    if (vnode.type === '#text') {
      const nodeValue = vnode.props.nodeValue;
      // If nodeValue is a signal, read its value
      if (
        nodeValue &&
        typeof nodeValue === 'object' &&
        nodeValue.value !== undefined &&
        typeof nodeValue.peek === 'function'
      ) {
        return document.createTextNode(String(nodeValue.value));
      }
      return document.createTextNode(String(nodeValue || ''));
    }

    // Handle Fragment VNodes
    if (vnode.type === Fragment) {
      const fragment = document.createDocumentFragment();
      if (vnode.children) {
        vnode.children.forEach((child) => {
          const childDOM = vNodeToDOM(child);
          if (childDOM) fragment.appendChild(childDOM);
        });
      }
      return fragment;
    }

    // Handle component VNodes
    if (typeof vnode.type === 'function') {
      let childVNode;

      // Check if it's a class component (has render method or extends Component)
      const isClassComponent =
        (vnode.type.prototype && vnode.type.prototype.render) ||
        (vnode.type.prototype && vnode.type.prototype instanceof Component);

      if (isClassComponent) {
        // Class component - instantiate and call render
        const instance = new vnode.type(vnode.props);

        // Render the component synchronously to get the VNode
        const prevComponent = currentComponent;
        const prevHookIndex = hookIndex;

        currentComponent = instance;
        hookIndex = 0;

        try {
          childVNode = instance.render();
        } finally {
          currentComponent = prevComponent;
          hookIndex = prevHookIndex;
        }
      } else {
        // Function component - call directly with props
        const prevComponent = currentComponent;
        const prevHookIndex = hookIndex;

        // Create a minimal component context for hooks to work
        const context = {
          hooks: [],
          effects: [],
          props: vnode.props
        };

        currentComponent = context;
        hookIndex = 0;

        try {
          childVNode = vnode.type(vnode.props);
        } finally {
          currentComponent = prevComponent;
          hookIndex = prevHookIndex;
        }
      }

      // Convert child VNode to DOM
      if (childVNode) {
        const childDOM = vNodeToDOM(childVNode);
        return childDOM;
      }

      return null;
    }

    // Handle DOM element VNodes
    if (typeof vnode.type === 'string') {
      const element = document.createElement(vnode.type);

      // Set props
      if (vnode.props) {
        Object.entries(vnode.props).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);

            // Track event listener for cleanup
            if (!element._berryactEventListeners) {
              element._berryactEventListeners = [];
            }
            element._berryactEventListeners.push({ type: eventName, handler: value });
          } else if (key !== 'children') {
            element.setAttribute(key, value);
          }
        });
      }

      // Handle children
      if (vnode.children) {
        vnode.children.forEach((child) => {
          const childDOM = vNodeToDOM(child);
          if (childDOM) element.appendChild(childDOM);
        });
      }

      return element;
    }
  }

  // Fallback for other types
  return document.createTextNode(String(vnode));
}

export class Component {
  constructor(props = {}) {
    this.props = signal(props);
    this.hooks = [];
    this.effects = [];
    this.isMounted = false;
    this.element = null;
    this.children = [];
    this.parent = null;
    this.key = props.key;
  }

  render() {
    throw new Error('Component must implement render method');
  }

  unmount() {
    this.isMounted = false;

    // Clean up the render effect
    if (this.renderEffect) {
      this.renderEffect.dispose();
      this.renderEffect = null;
    }

    // Clean up effects first
    cleanupComponentEffects(this);

    this.effects.forEach((effect) => effect.dispose());
    this.effects.length = 0;
    this.hooks.length = 0;

    // Clean up event listeners from DOM elements
    if (this.element) {
      this._cleanupEventListeners(this.element);

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }

    this.children.forEach((child) => {
      if (child.unmount) child.unmount();
    });
  }

  _cleanupEventListeners(element) {
    if (!element) return;

    // Clean up tracked event listeners on this element
    if (element._berryactEventListeners) {
      element._berryactEventListeners.forEach(({ type, handler }) => {
        element.removeEventListener(type, handler);
      });
      element._berryactEventListeners = [];
    }

    // Recursively clean up child elements
    if (element.childNodes) {
      Array.from(element.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          this._cleanupEventListeners(child);
        }
      });
    }
  }

  update() {
    if (!this.isMounted) return;

    const prevComponent = currentComponent;
    const prevHookIndex = hookIndex;

    currentComponent = this;
    hookIndex = 0;

    try {
      const vnode = this.render();
      const newElement = vNodeToDOM(vnode);

      // If we had a fragment before, remove its nodes
      if (this.fragmentNodes) {
        this.fragmentNodes.forEach((node) => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        this.fragmentNodes = null;
      }

      // Replace the old element with the new one
      if (
        this.element &&
        this.element.parentNode &&
        this.element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
      ) {
        // Clean up event listeners from the old element before replacing
        this._cleanupEventListeners(this.element);

        this.element.parentNode.replaceChild(newElement, this.element);
      } else if (this.container && newElement) {
        // Handle fragment replacement by appending to container
        if (newElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          this.fragmentNodes = Array.from(newElement.childNodes);
          this.container.appendChild(newElement);
        } else {
          this.container.appendChild(newElement);
        }
      }

      this.element = newElement;
    } finally {
      currentComponent = prevComponent;
      hookIndex = prevHookIndex;
    }
  }

  mount(container) {
    this.isMounted = true;
    this.container = container;

    // Create a reactive effect that tracks signal dependencies
    this.renderEffect = effect(() => {
      this.update();
    });

    if (container && this.element) {
      if (this.element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        // For fragments, we need to track the actual DOM nodes before they're moved
        this.fragmentNodes = Array.from(this.element.childNodes);
        container.appendChild(this.element);
      } else {
        container.appendChild(this.element);
      }
    }
  }

  shouldUpdate() {
    return this.isMounted;
  }

  setProps(newProps) {
    batch(() => {
      this.props.value = { ...this.props.value, ...newProps };
    });
  }
}

export function defineComponent(renderFn) {
  return class extends Component {
    render() {
      return renderFn(this.props.value);
    }
  };
}

export function createComponent(renderFn, props = {}) {
  const ComponentClass = defineComponent(renderFn);
  return new ComponentClass(props);
}

export function getCurrentComponent() {
  return currentComponent;
}
