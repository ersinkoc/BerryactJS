import { isSignal, effect } from '../core/signal.js';
import { compileTemplate } from '../template/compiler.js';
import { processDirectives } from '../template/directives.js';

export class DOMRenderer {
  constructor() {
    this.renderedComponents = new WeakMap();
    this.eventDelegation = new Map();
    this.setupEventDelegation();
  }

  setupEventDelegation() {
    const commonEvents = ['click', 'input', 'change', 'submit', 'keydown', 'keyup'];
    
    commonEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.handleDelegatedEvent(event);
      }, true);
    });
  }

  handleDelegatedEvent(event) {
    let target = event.target;
    
    while (target && target !== document) {
      const handlers = this.eventDelegation.get(target);
      if (handlers && handlers[event.type]) {
        handlers[event.type](event);
        break;
      }
      target = target.parentNode;
    }
  }

  render(template, container) {
    if (!container) {
      throw new Error('Container element is required');
    }

    const compiled = compileTemplate(template);
    if (!compiled) {
      return null;
    }

    const rendered = compiled.render();
    
    if (rendered.element) {
      if (rendered.element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        const children = Array.from(rendered.element.childNodes);
        children.forEach(child => container.appendChild(child));
      } else {
        container.appendChild(rendered.element);
      }
    }

    return {
      update: rendered.update,
      unmount: () => {
        rendered.unmount();
        if (rendered.element && rendered.element.parentNode) {
          rendered.element.parentNode.removeChild(rendered.element);
        }
      }
    };
  }

  createElement(tag, props = {}, children = []) {
    const element = document.createElement(tag);
    
    this.updateProps(element, props);
    this.updateChildren(element, children);
    
    return element;
  }

  updateProps(element, props) {
    Object.entries(props).forEach(([key, value]) => {
      this.setProp(element, key, value);
    });
    
    processDirectives(element, props);
  }

  setProp(element, key, value) {
    if (key === 'key' || key === 'ref') {
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      this.addEventListener(element, eventType, value);
      return;
    }

    if (key.startsWith('@') && typeof value === 'function') {
      const eventType = key.slice(1);
      this.addEventListener(element, eventType, value);
      return;
    }

    if (key.startsWith('n-')) {
      return;
    }

    if (isSignal(value)) {
      effect(() => {
        this.setDOMProperty(element, key, value.value);
      });
    } else {
      this.setDOMProperty(element, key, value);
    }
  }

  setDOMProperty(element, key, value) {
    if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'style') {
      element.style.cssText = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key in element) {
      element[key] = value;
    } else {
      if (value === null || value === undefined || value === false) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value === true ? '' : value);
      }
    }
  }

  addEventListener(element, eventType, handler) {
    if (!this.eventDelegation.has(element)) {
      this.eventDelegation.set(element, {});
    }
    
    this.eventDelegation.get(element)[eventType] = handler;
  }

  updateChildren(element, children) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    children.forEach(child => {
      if (child === null || child === undefined) {
        return;
      }

      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else if (isSignal(child)) {
        const textNode = document.createTextNode('');
        effect(() => {
          textNode.textContent = String(child.value);
        });
        element.appendChild(textNode);
      } else if (Array.isArray(child)) {
        this.updateChildren(element, child);
      } else {
        const compiled = compileTemplate(child);
        if (compiled) {
          const rendered = compiled.render();
          if (rendered.element) {
            element.appendChild(rendered.element);
          }
        }
      }
    });
  }

  createTextNode(content) {
    if (isSignal(content)) {
      const textNode = document.createTextNode('');
      effect(() => {
        textNode.textContent = String(content.value);
      });
      return textNode;
    }
    
    return document.createTextNode(String(content));
  }

  createFragment(children) {
    const fragment = document.createDocumentFragment();
    
    children.forEach(child => {
      if (child instanceof Node) {
        fragment.appendChild(child);
      } else {
        const compiled = compileTemplate(child);
        if (compiled) {
          const rendered = compiled.render();
          if (rendered.element) {
            fragment.appendChild(rendered.element);
          }
        }
      }
    });
    
    return fragment;
  }

  unmount(element) {
    if (element && element.parentNode) {
      this.eventDelegation.delete(element);
      element.parentNode.removeChild(element);
    }
  }
}

export const renderer = new DOMRenderer();