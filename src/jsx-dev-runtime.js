// Berryact JSX Runtime - Development mode with enhanced debugging
import { jsx as jsxProd, jsxs as jsxsProd, Fragment } from './jsx-runtime.js';
import { warn } from './utils/error.js';

const ReactDebugCurrentFrame = {};
const ReactSharedInternals = {
  ReactDebugCurrentFrame,
  ReactCurrentDispatcher: {}
};

// Validation helpers
function isValidElementType(type) {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    // Note: typeof might be "object" for typeof import.meta
    type === Fragment ||
    (typeof type === 'object' &&
      type !== null &&
      (type.$$typeof === Symbol.for('react.forward_ref') ||
        type.$$typeof === Symbol.for('react.memo') ||
        type.$$typeof === Symbol.for('react.provider') ||
        type.$$typeof === Symbol.for('react.context')))
  );
}

function getComponentNameFromType(type) {
  if (type == null) {
    return null;
  }
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'string') {
    return type;
  }
  
  switch (type) {
    case Fragment:
      return 'Fragment';
    default:
      return null;
  }
}

function validatePropTypes(element) {
  const type = element.type;
  
  if (type == null || typeof type === 'string') {
    return;
  }
  
  const name = getComponentNameFromType(type);
  
  // Check for invalid prop names
  const props = element.props;
  if (props) {
    // Warn about className vs class
    if ('className' in props && 'class' in props) {
      warn(
        `Both "className" and "class" props were specified on <${name}>. ` +
        'Use only "className" for JSX or "class" for template literals.'
      );
    }
    
    // Warn about common typos
    const eventHandlerNames = Object.keys(props).filter(key => 
      key.startsWith('on') && key[2] && key[2] === key[2].toUpperCase()
    );
    
    eventHandlerNames.forEach(handlerName => {
      if (typeof props[handlerName] !== 'function') {
        warn(
          `Expected "${handlerName}" listener to be a function on <${name}>, ` +
          `instead got type "${typeof props[handlerName]}".`
        );
      }
    });
  }
  
  // Validate fragment usage
  if (type === Fragment && props && props.key != null) {
    warn(
      'Berryact.Fragment can only have `children` as props. ' +
      'Found: ' + Object.keys(props).filter(key => key !== 'children').join(', ')
    );
  }
}

function validateChildKeys(children, parentType) {
  if (!Array.isArray(children)) {
    return;
  }
  
  const parentName = getComponentNameFromType(parentType);
  const keyedChildren = new Set();
  
  children.forEach((child, index) => {
    if (!child || typeof child !== 'object') {
      return;
    }
    
    if (child.key != null) {
      const key = String(child.key);
      
      if (keyedChildren.has(key)) {
        warn(
          `Encountered two children with the same key, "${key}". ` +
          `Keys should be unique so that components maintain their identity across updates. ` +
          `Parent: <${parentName}>`
        );
      }
      
      keyedChildren.add(key);
    } else if (index > 0 && children[0] && children[0].key != null) {
      // If first child has key, all should have keys
      warn(
        `Each child in a list should have a unique "key" prop. ` +
        `Check the element at index ${index}. Parent: <${parentName}>`
      );
    }
  });
}

// Development JSX function with validation
export function jsxDEV(type, config, maybeKey, source, self) {
  // Validate element type
  if (!isValidElementType(type)) {
    let info = '';
    if (type === undefined || (typeof type === 'object' && type !== null && Object.keys(type).length === 0)) {
      info = ' You likely forgot to export your component from the file it\'s defined in, ' +
        'or you might have mixed up default and named imports.';
    }
    
    const typeString = type == null ? type : typeof type;
    
    warn(
      `Element type is invalid: expected a string (for built-in components) ` +
      `or a class/function (for composite components) but got: ${typeString}.${info}`
    );
  }
  
  // Create element with production JSX
  const element = jsxProd(type, config, maybeKey);
  
  // Add development-only properties
  if (element && typeof element === 'object') {
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });
    
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    });
  }
  
  // Validate in development
  if (element) {
    validatePropTypes(element);
    
    // Validate children keys
    if (element.props && element.props.children) {
      validateChildKeys(
        Array.isArray(element.props.children) ? element.props.children : [element.props.children],
        type
      );
    }
  }
  
  return element;
}

// Development JSX for static children
export function jsxsDEV(type, config, maybeKey, source, self) {
  return jsxDEV(type, config, maybeKey, source, self);
}

// Re-export other functions from production runtime
export { Fragment, isValidElement, cloneElement, createElement } from './jsx-runtime.js';

// Export React DevTools integration
export { ReactDebugCurrentFrame, ReactSharedInternals };