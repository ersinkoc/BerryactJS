// Berryact JSX Runtime - Production mode
import { createVNode, normalizeChildren, Fragment as BerryactFragment } from './core/vdom.js';
import { isSignal } from './core/signal.js';

// Symbol to identify Berryact elements
export const BERRYACT_ELEMENT_TYPE = Symbol.for('berryact.element');

// Transform React-style props to Berryact conventions
function transformProps(props) {
  if (!props) return null;
  
  const transformed = {};
  
  for (const key in props) {
    const value = props[key];
    
    // Skip internal props
    if (key === 'key' || key === 'ref' || key === '__self' || key === '__source') {
      continue;
    }
    
    // Transform className to class
    if (key === 'className') {
      transformed.class = value;
    }
    // Transform event handlers (onClick -> onclick)
    else if (key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase()) {
      const eventName = key[2].toLowerCase() + key.slice(3);
      transformed[`on${eventName}`] = value;
    }
    // Transform htmlFor to for
    else if (key === 'htmlFor') {
      transformed.for = value;
    }
    // Handle style objects
    else if (key === 'style' && typeof value === 'object' && !isSignal(value)) {
      // Convert React style object to CSS string
      const styleStr = Object.entries(value)
        .map(([prop, val]) => {
          // Convert camelCase to kebab-case
          const cssProp = prop.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
          return `${cssProp}: ${val}`;
        })
        .join('; ');
      transformed.style = styleStr;
    }
    // Handle dangerouslySetInnerHTML
    else if (key === 'dangerouslySetInnerHTML' && value && value.__html) {
      transformed.innerHTML = value.__html;
    }
    // Pass through other props
    else {
      transformed[key] = value;
    }
  }
  
  return transformed;
}

// Main JSX factory function
export function jsx(type, config, maybeKey) {
  const props = {};
  let key = null;
  let ref = null;
  
  // Extract key and ref from config
  if (config != null) {
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    
    // Copy remaining props
    for (const propName in config) {
      if (propName !== 'key' && propName !== 'ref' && propName !== '__self' && propName !== '__source') {
        props[propName] = config[propName];
      }
    }
  }
  
  // Use maybeKey if key wasn't in config
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  
  // Extract children
  const { children, ...restProps } = props;
  
  // Transform props to Berryact conventions
  const berryactProps = transformProps(restProps);
  
  // Create and return Berryact element
  return createVNode(
    type,
    berryactProps,
    normalizeChildren(children),
    key,
    ref
  );
}

// JSX factory for multiple children
export function jsxs(type, config, maybeKey) {
  return jsx(type, config, maybeKey);
}

// Fragment symbol - JSX uses this directly as the type
export const Fragment = BerryactFragment;

// Check if value is a valid element
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === BERRYACT_ELEMENT_TYPE
  );
}

// Clone element with new props
export function cloneElement(element, config, ...children) {
  if (!isValidElement(element)) {
    throw new Error('cloneElement requires a valid Berryact element');
  }
  
  const props = Object.assign({}, element.props);
  let key = element.key;
  let ref = element.ref;
  
  // Update with new config
  if (config != null) {
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    
    // Merge props
    for (const propName in config) {
      if (propName !== 'key' && propName !== 'ref' && propName !== '__self' && propName !== '__source') {
        props[propName] = config[propName];
      }
    }
  }
  
  // Use new children if provided
  if (children.length > 0) {
    props.children = children.length === 1 ? children[0] : children;
  }
  
  return jsx(element.type, { ...props, key, ref });
}

// Create element function for compatibility
export function createElement(type, config, ...children) {
  const props = { ...config };
  
  if (children.length === 1) {
    props.children = children[0];
  } else if (children.length > 1) {
    props.children = children;
  }
  
  return jsx(type, props);
}