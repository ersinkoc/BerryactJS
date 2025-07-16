// Enhanced template parser with JSX-like features
import { isSignal } from '../core/signal.js';
import { isFunction, isArray, isPrimitive } from '../utils/is.js';
import { createVNode, normalizeChildren, Fragment, Portal } from '../core/vdom.js';

export class TemplateParser {
  constructor() {
    this.componentRegex = /\<(__BERRYACT_PLACEHOLDER_\d+__)([^>]*)\>/g;
    this.spreadRegex = /\.\.\.\$\{([^}]+)\}/g;
    this.placeholderRegex = /__BERRYACT_PLACEHOLDER_(\d+)__/g;
  }

  parse(strings, values) {
    // Combine strings and values with placeholders
    const template = this.combineTemplate(strings, values);

    // Parse the template
    const ast = this.parseTemplate(template, values);

    // Transform to VNodes
    return this.transformToVNode(ast, values);
  }

  combineTemplate(strings, values) {
    return strings.reduce((acc, str, i) => {
      const placeholder = i < values.length ? `__BERRYACT_PLACEHOLDER_${i}__` : '';
      return acc + str + placeholder;
    }, '');
  }

  parseTemplate(template, values) {
    // Handle component syntax <${Component} />
    template = this.parseComponents(template, values);

    // Handle fragments <>...</>
    template = this.parseFragments(template);

    // Handle spread attributes
    template = this.parseSpread(template, values);

    // Replace @ event handlers with data- attributes to preserve them during parsing
    template = template.replace(/@(\w+)=/g, 'data-event-$1=');
    // DEBUG: console.log('Template after @ replacement:', template);

    // Parse HTML - handle SSR environment
    let doc, templateEl;
    if (typeof DOMParser !== 'undefined') {
      // Browser environment
      const parser = new DOMParser();
      doc = parser.parseFromString(`<template>${template}</template>`, 'text/html');
      templateEl = doc.querySelector('template');
    } else if (typeof global !== 'undefined' && global.document) {
      // SSR environment with jsdom
      doc = global.document.implementation.createHTMLDocument();
      doc.body.innerHTML = `<template>${template}</template>`;
      templateEl = doc.querySelector('template');
    } else {
      // Fallback for pure Node.js environment
      const { parseHTML } = require('node-html-parser');
      const root = parseHTML(`<template>${template}</template>`);
      templateEl = root.querySelector('template');
    }

    if (!templateEl) {
      throw new Error('Invalid template structure');
    }

    return this.parseNode(templateEl.content, values);
  }

  parseComponents(template, values) {
    return template.replace(this.componentRegex, (match, placeholder, attrs) => {
      const placeholderMatch = placeholder.match(/__BERRYACT_PLACEHOLDER_(\d+)__/);
      if (placeholderMatch) {
        const index = parseInt(placeholderMatch[1]);
        const component = values[index];

        if (isFunction(component)) {
          // Store component reference for later processing
          return `<berryact-component data-component-index="${index}"${attrs}>`;
        }
      }
      return match;
    });
  }

  parseFragments(template) {
    // Convert <>...</> to <berryact-fragment>...</berryact-fragment>
    return template.replace(/<>/g, '<berryact-fragment>').replace(/<\/>/g, '</berryact-fragment>');
  }

  parseSpread(template, values) {
    // Handle spread attributes like <div ...${props}>
    return template.replace(
      /<(\w+)([^>]*)\.\.\.\$\{([^}]+)\}([^>]*)>/g,
      (match, tag, beforeSpread, placeholder, afterSpread) => {
        const placeholderMatch = placeholder.match(/__BERRYACT_PLACEHOLDER_(\d+)__/);
        if (placeholderMatch) {
          const index = parseInt(placeholderMatch[1]);
          // Mark for spread processing
          return `<${tag}${beforeSpread} data-spread-index="${index}"${afterSpread}>`;
        }
        return match;
      }
    );
  }

  parseNode(node, values) {
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        return this.parseTextNode(node, values);
      case Node.ELEMENT_NODE:
        return this.parseElementNode(node, values);
      case Node.DOCUMENT_FRAGMENT_NODE:
        return this.parseFragmentNode(node, values);
      default:
        return null;
    }
  }

  parseTextNode(node, values) {
    const text = node.textContent || '';
    const parts = text.split(this.placeholderRegex);

    if (parts.length === 1) {
      // No placeholders, return plain text
      return text.trim() ? text : null;
    }

    // Process placeholders
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text part
        if (parts[i]) {
          result.push(parts[i]);
        }
      } else {
        // Placeholder
        const index = parseInt(parts[i]);
        const value = values[index];

        if (value != null) {
          result.push(value);
        }
      }
    }

    return result.length === 1 ? result[0] : result;
  }

  parseElementNode(node, values) {
    const tagName = node.tagName.toLowerCase();

    // Handle special elements
    if (tagName === 'berryact-fragment') {
      const children = this.parseChildren(node, values);
      return createVNode(Fragment, null, children);
    }

    if (tagName === 'berryact-component') {
      const componentIndex = node.getAttribute('data-component-index');
      if (componentIndex != null) {
        const component = values[parseInt(componentIndex)];
        const props = this.parseAttributes(node, values);
        const children = this.parseChildren(node, values);

        // Remove internal attributes
        delete props['data-component-index'];

        return createVNode(component, props, children);
      }
    }

    // Handle portal
    if (tagName === 'portal' || node.hasAttribute('portal-to')) {
      const to = node.getAttribute('to') || node.getAttribute('portal-to') || 'body';
      const children = this.parseChildren(node, values);
      return createVNode(Portal, { container: to }, children);
    }

    // Parse regular elements
    const props = this.parseAttributes(node, values);
    const children = this.parseChildren(node, values);

    return createVNode(tagName, props, children);
  }

  parseFragmentNode(node, values) {
    const children = this.parseChildren(node, values);
    return children.length === 1 ? children[0] : createVNode(Fragment, null, children);
  }

  parseAttributes(node, values) {
    const props = {};
    const spreadIndex = node.getAttribute('data-spread-index');

    // Handle spread props
    if (spreadIndex != null) {
      const spreadProps = values[parseInt(spreadIndex)];
      if (spreadProps && typeof spreadProps === 'object') {
        Object.assign(props, spreadProps);
      }
    }

    // Parse individual attributes
    // DEBUG: console.log('Parsing attributes for', node.tagName, 'Attributes:', Array.from(node.attributes).map(a => `${a.name}="${a.value}"`));
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name;
      const value = attr.value;

      // Skip internal attributes
      if (name.startsWith('data-spread-') || name === 'data-component-index') {
        return;
      }

      // Handle event listeners (including data-event- attributes from @ syntax)
      if (name.startsWith('data-event-') || name.startsWith('@') || name.startsWith('on')) {
        let eventName;
        if (name.startsWith('data-event-')) {
          eventName = name.slice(11).toLowerCase(); // 'data-event-'.length = 11
        } else if (name.startsWith('@')) {
          eventName = name.slice(1).toLowerCase();
        } else {
          eventName = name.slice(2).toLowerCase();
        }

        const placeholderMatch = value.match(this.placeholderRegex);

        if (placeholderMatch) {
          const fullMatch = placeholderMatch[0];
          const indexMatch = fullMatch.match(/\d+/);
          const index = indexMatch ? parseInt(indexMatch[0]) : -1;
          const handler = values[index];

          if (isFunction(handler)) {
            // Ensure event name is lowercase for consistency
            props[`on${eventName}`] = handler;
          }
        }
        return;
      }

      // Handle refs
      if (name === 'ref') {
        const placeholderMatch = value.match(this.placeholderRegex);
        if (placeholderMatch) {
          const index = parseInt(placeholderMatch[1]);
          props.ref = values[index];
        }
        return;
      }

      // Handle dynamic attributes
      if (value.includes('__BERRYACT_PLACEHOLDER_')) {
        // Use exec instead of match to get capture groups properly
        const placeholderRegex = /__BERRYACT_PLACEHOLDER_(\d+)__/;
        const placeholderMatch = placeholderRegex.exec(value);
        if (placeholderMatch) {
          const index = parseInt(placeholderMatch[1]);
          const propValue = values[index];
          const propName = this.normalizeAttributeName(name);
          props[propName] = propValue;
        }
      } else {
        // Static attributes
        props[this.normalizeAttributeName(name)] = this.parseAttributeValue(value);
      }
    });

    return props;
  }

  parseChildren(node, values) {
    const children = [];

    node.childNodes.forEach((child) => {
      const parsed = this.parseNode(child, values);

      if (parsed != null) {
        if (isArray(parsed)) {
          children.push(...parsed);
        } else {
          children.push(parsed);
        }
      }
    });

    return normalizeChildren(children);
  }

  normalizeAttributeName(name) {
    // Handle special cases
    if (name === 'class') return 'class';
    if (name === 'for') return 'for';

    // Convert data-* and aria-* attributes
    if (name.startsWith('data-') || name.startsWith('aria-')) {
      return name;
    }

    // Convert kebab-case to camelCase for other attributes
    return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  parseAttributeValue(value) {
    // Handle boolean attributes
    if (value === '' || value === 'true') return true;
    if (value === 'false') return false;

    // Handle numbers
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

    return value;
  }

  transformToVNode(parsed, values) {
    if (isArray(parsed)) {
      return parsed.map((p) => this.transformSingleNode(p, values));
    }
    return this.transformSingleNode(parsed, values);
  }

  transformSingleNode(node, values) {
    if (isPrimitive(node) || isSignal(node)) {
      return node;
    }

    if (node && node.$$typeof) {
      // Already a VNode
      return node;
    }

    return node;
  }
}

// Enhanced html tagged template function
export function html(strings, ...values) {
  const parser = new TemplateParser();
  return parser.parse(strings, values);
}

// Component helper for template literals
export function component(Component, props, ...children) {
  return createVNode(Component, props, children);
}

// Fragment helper
export function fragment(...children) {
  return createVNode(Fragment, null, children);
}

// Portal helper
export function portal(children, to = 'body') {
  return createVNode(Portal, { container: to }, children);
}

// Re-export original for backward compatibility
export { html as htmlLegacy } from './parser.js';
