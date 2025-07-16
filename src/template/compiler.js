import { isSignal } from '../core/signal.js';
import { TemplateNode } from './parser.js';

export function compileTemplate(node) {
  if (!node) return null;
  
  if (typeof node === 'string' || typeof node === 'number') {
    return compileTextNode(node);
  }
  
  if (isSignal(node)) {
    return compileSignalNode(node);
  }
  
  if (Array.isArray(node)) {
    return compileArrayNode(node);
  }
  
  if (node instanceof TemplateNode) {
    switch (node.type) {
      case 'element':
        return compileElementNode(node);
      case 'text':
        return compileTextNode(node.children);
      case 'fragment':
        return compileFragmentNode(node);
      default:
        return null;
    }
  }
  
  return null;
}

function compileTextNode(content) {
  if (Array.isArray(content)) {
    const textContent = content.map(item => {
      if (isSignal(item)) {
        return () => String(item.value);
      }
      return () => String(item);
    });
    
    return {
      type: 'text',
      render: () => {
        const element = document.createTextNode('');
        
        const update = () => {
          element.textContent = textContent.map(fn => fn()).join('');
        };
        
        update();
        
        return {
          element,
          update,
          unmount: () => {}
        };
      }
    };
  }
  
  return {
    type: 'text',
    render: () => ({
      element: document.createTextNode(String(content)),
      update: () => {},
      unmount: () => {}
    })
  };
}

function compileSignalNode(signal) {
  return {
    type: 'signal',
    render: () => {
      const element = document.createTextNode('');
      
      const update = () => {
        const value = signal.value;
        element.textContent = String(value);
      };
      
      update();
      
      return {
        element,
        update,
        unmount: () => {}
      };
    }
  };
}

function compileArrayNode(array) {
  return {
    type: 'array',
    render: () => {
      const fragment = document.createDocumentFragment();
      const children = [];
      
      const renderChildren = () => {
        children.forEach(child => {
          if (child.unmount) child.unmount();
        });
        children.length = 0;
        
        while (fragment.firstChild) {
          fragment.removeChild(fragment.firstChild);
        }
        
        array.forEach(item => {
          const compiled = compileTemplate(item);
          if (compiled) {
            const rendered = compiled.render();
            children.push(rendered);
            fragment.appendChild(rendered.element);
          }
        });
      };
      
      renderChildren();
      
      return {
        element: fragment,
        update: renderChildren,
        unmount: () => {
          children.forEach(child => {
            if (child.unmount) child.unmount();
          });
        }
      };
    }
  };
}

function compileElementNode(node) {
  return {
    type: 'element',
    render: () => {
      const element = document.createElement(node.tag);
      const children = [];
      
      const updateProps = () => {
        Object.entries(node.props).forEach(([key, value]) => {
          if (key === 'key') return;
          
          if (key.startsWith('@')) {
            const eventName = key.slice(1);
            element.addEventListener(eventName, value);
          } else if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
          } else if (isSignal(value)) {
            const update = () => {
              if (key === 'class') {
                element.className = value.value;
              } else {
                element.setAttribute(key, value.value);
              }
            };
            update();
          } else {
            if (key === 'class') {
              element.className = value;
            } else {
              element.setAttribute(key, value);
            }
          }
        });
      };
      
      const updateChildren = () => {
        children.forEach(child => {
          if (child.unmount) child.unmount();
        });
        children.length = 0;
        
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        
        node.children.forEach(child => {
          const compiled = compileTemplate(child);
          if (compiled) {
            const rendered = compiled.render();
            children.push(rendered);
            element.appendChild(rendered.element);
          }
        });
      };
      
      updateProps();
      updateChildren();
      
      return {
        element,
        update: () => {
          updateProps();
          updateChildren();
        },
        unmount: () => {
          children.forEach(child => {
            if (child.unmount) child.unmount();
          });
        }
      };
    }
  };
}

function compileFragmentNode(node) {
  return {
    type: 'fragment',
    render: () => {
      const fragment = document.createDocumentFragment();
      const children = [];
      
      const updateChildren = () => {
        children.forEach(child => {
          if (child.unmount) child.unmount();
        });
        children.length = 0;
        
        while (fragment.firstChild) {
          fragment.removeChild(fragment.firstChild);
        }
        
        node.children.forEach(child => {
          const compiled = compileTemplate(child);
          if (compiled) {
            const rendered = compiled.render();
            children.push(rendered);
            fragment.appendChild(rendered.element);
          }
        });
      };
      
      updateChildren();
      
      return {
        element: fragment,
        update: updateChildren,
        unmount: () => {
          children.forEach(child => {
            if (child.unmount) child.unmount();
          });
        }
      };
    }
  };
}