// Virtual DOM implementation for Berryact
import { isSignal } from './signal.js';
import { isArray, isFunction, isPrimitive } from '../utils/is.js';

export const BERRYACT_ELEMENT_TYPE = Symbol.for('berryact.element');
export const Fragment = Symbol.for('berryact.fragment');
export const Portal = Symbol.for('berryact.portal');

// VNode structure for both JSX and template literals
export function createVNode(type, props, children, key, ref) {
  const normalizedChildren = normalizeChildren(children);
  
  return {
    $$typeof: BERRYACT_ELEMENT_TYPE,
    type,
    props: props || {},
    children: normalizedChildren,
    key: key != null ? String(key) : null,
    ref: ref || null,
    _owner: null
  };
}

// Normalize children to handle various input types
export function normalizeChildren(children) {
  if (children == null || children === false || children === true) {
    return [];
  }
  
  if (isPrimitive(children)) {
    return [createTextVNode(String(children))];
  }
  
  if (isSignal(children)) {
    return [createTextVNode(children)];
  }
  
  if (isArray(children)) {
    const normalized = [];
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      if (child == null || child === false || child === true) {
        continue;
      }
      
      if (isPrimitive(child)) {
        normalized.push(createTextVNode(String(child)));
      } else if (isSignal(child)) {
        normalized.push(createTextVNode(child));
      } else if (isArray(child)) {
        normalized.push(...normalizeChildren(child));
      } else if (isVNode(child)) {
        normalized.push(child);
      } else {
        normalized.push(child);
      }
    }
    
    return normalized;
  }
  
  if (isVNode(children)) {
    return [children];
  }
  
  return [children];
}

// Create text VNode
export function createTextVNode(text) {
  return {
    $$typeof: BERRYACT_ELEMENT_TYPE,
    type: '#text',
    props: { nodeValue: text },
    children: [],
    key: null,
    ref: null
  };
}

// Check if object is a VNode
export function isVNode(obj) {
  return obj && typeof obj === 'object' && obj.$$typeof === BERRYACT_ELEMENT_TYPE;
}

// Create component VNode
export function createComponentVNode(component, props, children) {
  return createVNode(component, { ...props, children }, null);
}

// Clone VNode with new props
export function cloneVNode(vnode, newProps, newChildren) {
  if (!isVNode(vnode)) {
    throw new Error('cloneVNode expects a valid VNode');
  }
  
  const props = { ...vnode.props, ...newProps };
  const children = newChildren !== undefined ? newChildren : vnode.children;
  
  return createVNode(
    vnode.type,
    props,
    children,
    vnode.key,
    vnode.ref
  );
}

// Get display name for debugging
export function getComponentName(vnode) {
  if (!vnode) return 'Unknown';
  
  const { type } = vnode;
  
  if (typeof type === 'string') {
    return type;
  }
  
  if (typeof type === 'function') {
    return type.displayName || type.name || 'Component';
  }
  
  if (type === Fragment) {
    return 'Fragment';
  }
  
  if (type === Portal) {
    return 'Portal';
  }
  
  return 'Unknown';
}

// Compare two VNodes for equality (used in reconciliation)
export function isSameVNode(a, b) {
  return a.type === b.type && a.key === b.key;
}

// Get VNode children as array
export function getVNodeChildren(vnode) {
  if (!vnode || !vnode.children) return [];
  return isArray(vnode.children) ? vnode.children : [vnode.children];
}

// Check if VNode represents a component
export function isComponentVNode(vnode) {
  return vnode && isFunction(vnode.type);
}

// Check if VNode represents a DOM element
export function isDOMVNode(vnode) {
  return vnode && typeof vnode.type === 'string' && vnode.type !== '#text';
}

// Check if VNode represents text
export function isTextVNode(vnode) {
  return vnode && vnode.type === '#text';
}

// Portal VNode creation
export function createPortal(children, container) {
  return createVNode(Portal, { container }, children);
}