// Reconciler for both JSX and template literal VNodes
import { isVNode, isSameVNode, isComponentVNode, isDOMVNode, isTextVNode } from './vdom.js';
import { isSignal, effect } from './signal.js';
import { isFunction, isArray } from '../utils/is.js';

export class Reconciler {
  constructor(renderer) {
    this.renderer = renderer;
    this.currentRoot = null;
    this.workInProgress = null;
    this.deletions = [];
  }

  render(vnode, container) {
    this.workInProgress = {
      vnode,
      dom: container,
      props: {},
      alternate: this.currentRoot,
      effectTag: null,
    };

    this.performWork();
    this.commitWork();
  }

  performWork() {
    let nextUnitOfWork = this.workInProgress;

    while (nextUnitOfWork) {
      nextUnitOfWork = this.performUnitOfWork(nextUnitOfWork);
    }
  }

  performUnitOfWork(fiber) {
    // Handle different VNode types
    if (isComponentVNode(fiber.vnode)) {
      this.updateComponent(fiber);
    } else if (isDOMVNode(fiber.vnode)) {
      this.updateDOMElement(fiber);
    } else if (isTextVNode(fiber.vnode)) {
      this.updateTextNode(fiber);
    }

    // Return next unit of work
    if (fiber.child) {
      return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }

    return null;
  }

  updateComponent(fiber) {
    const { type: Component, props } = fiber.vnode;

    // Create component instance
    let instance;
    if (isFunction(Component)) {
      // Function component
      instance = Component(props);
    } else {
      // Class component
      instance = new Component(props);
      instance = instance.render();
    }

    // Handle signals in render result
    if (isSignal(instance)) {
      // Create effect to re-render on signal change
      effect(() => {
        const newVNode = instance();
        this.reconcileChildren(fiber, isArray(newVNode) ? newVNode : [newVNode]);
      });
    } else {
      this.reconcileChildren(fiber, isArray(instance) ? instance : [instance]);
    }
  }

  updateDOMElement(fiber) {
    if (!fiber.dom) {
      // Create DOM element
      fiber.dom = this.createDOMElement(fiber.vnode);
    }

    // Update props
    this.updateDOMProps(fiber.dom, fiber.alternate?.props || {}, fiber.vnode.props);

    // Reconcile children
    this.reconcileChildren(fiber, fiber.vnode.children);
  }

  updateTextNode(fiber) {
    if (!fiber.dom) {
      const text = fiber.vnode.props.nodeValue;

      if (isSignal(text)) {
        // Create text node with signal
        fiber.dom = document.createTextNode(text.value);

        // Update text on signal change
        effect(() => {
          fiber.dom.nodeValue = text.value;
        });
      } else {
        fiber.dom = document.createTextNode(text);
      }
    }
  }

  createDOMElement(vnode) {
    const { type, props } = vnode;
    const dom = document.createElement(type);

    // Set properties
    Object.keys(props).forEach((name) => {
      this.setProp(dom, name, props[name]);
    });

    return dom;
  }

  updateDOMProps(dom, oldProps, newProps) {
    // Remove old props
    Object.keys(oldProps).forEach((name) => {
      if (!(name in newProps)) {
        this.removeProp(dom, name, oldProps[name]);
      }
    });

    // Add/update new props
    Object.keys(newProps).forEach((name) => {
      if (oldProps[name] !== newProps[name]) {
        this.setProp(dom, name, newProps[name]);
      }
    });
  }

  setProp(dom, name, value) {
    if (name === 'children') return;

    // Handle event listeners
    if (name.startsWith('on')) {
      const eventName = name.toLowerCase().substring(2);
      dom.addEventListener(eventName, value);
    }
    // Handle style
    else if (name === 'style') {
      if (typeof value === 'string') {
        dom.style.cssText = value;
      } else {
        Object.assign(dom.style, value);
      }
    }
    // Handle className/class
    else if (name === 'className' || name === 'class') {
      dom.className = value;
    }
    // Handle ref
    else if (name === 'ref') {
      if (typeof value === 'function') {
        value(dom);
      } else if (value && typeof value === 'object') {
        value.current = dom;
      }
    }
    // Handle other attributes
    else if (name === 'checked' || name === 'value' || name === 'selected') {
      dom[name] = value;
    } else if (value === true) {
      dom.setAttribute(name, '');
    } else if (value === false || value == null) {
      dom.removeAttribute(name);
    } else {
      dom.setAttribute(name, value);
    }
  }

  removeProp(dom, name, value) {
    if (name.startsWith('on')) {
      const eventName = name.toLowerCase().substring(2);
      dom.removeEventListener(eventName, value);
    } else if (name === 'className' || name === 'class') {
      dom.className = '';
    } else {
      dom.removeAttribute(name);
    }
  }

  reconcileChildren(fiber, children) {
    let index = 0;
    let oldFiber = fiber.alternate && fiber.alternate.child;
    let prevSibling = null;

    while (index < children.length || oldFiber != null) {
      const child = children[index];
      let newFiber = null;

      const sameType = oldFiber && child && isSameVNode(oldFiber.vnode, child);

      if (sameType) {
        // Update existing fiber
        newFiber = {
          vnode: child,
          dom: oldFiber.dom,
          parent: fiber,
          alternate: oldFiber,
          effectTag: 'UPDATE',
        };
      } else {
        if (child) {
          // Create new fiber
          newFiber = {
            vnode: child,
            dom: null,
            parent: fiber,
            alternate: null,
            effectTag: 'PLACEMENT',
          };
        }

        if (oldFiber) {
          // Delete old fiber
          oldFiber.effectTag = 'DELETION';
          this.deletions.push(oldFiber);
        }
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index === 0) {
        fiber.child = newFiber;
      } else if (newFiber) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }
  }

  commitWork() {
    // Delete removed nodes
    this.deletions.forEach(this.commitDeletion.bind(this));
    this.deletions = [];

    // Commit remaining work
    this.commitRoot(this.workInProgress.child);
    this.currentRoot = this.workInProgress;
    this.workInProgress = null;
  }

  commitRoot(fiber) {
    if (!fiber) return;

    // Check if parent exists before accessing its dom property
    if (!fiber.parent || !fiber.parent.dom) {
      // If there's no parent or parent.dom, skip this fiber
      this.commitRoot(fiber.child);
      this.commitRoot(fiber.sibling);
      return;
    }

    const domParent = fiber.parent.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
      this.updateDOMProps(fiber.dom, fiber.alternate.props, fiber.vnode.props);
    } else if (fiber.effectTag === 'DELETION') {
      this.commitDeletion(fiber, domParent);
    }

    this.commitRoot(fiber.child);
    this.commitRoot(fiber.sibling);
  }

  commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      this.commitDeletion(fiber.child, domParent);
    }
  }
}

// Create default reconciler instance
export const reconciler = new Reconciler();
