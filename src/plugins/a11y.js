/**
 * Accessibility (a11y) Plugin for Berryact
 * Provides accessibility testing, ARIA management, and keyboard navigation
 */

import { signal, computed, effect } from '../core/signal-enhanced.js';
import { createPlugin } from '../core/plugin.js';

// WCAG conformance levels
const ConformanceLevel = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA'
};

// Common accessibility issues
const A11yRules = {
  // Images
  IMG_ALT: {
    id: 'img-alt',
    description: 'Images must have alt text',
    level: ConformanceLevel.A,
    test: (element) => {
      if (element.tagName !== 'IMG') return { pass: true };
      return {
        pass: element.hasAttribute('alt'),
        message: 'Image missing alt attribute'
      };
    }
  },

  // Form labels
  LABEL_FOR: {
    id: 'label-for',
    description: 'Form inputs must have associated labels',
    level: ConformanceLevel.A,
    test: (element) => {
      const needsLabel = ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
      if (!needsLabel || element.type === 'hidden') return { pass: true };
      
      const id = element.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = element.hasAttribute('aria-label') || 
                          element.hasAttribute('aria-labelledby');
      
      return {
        pass: hasLabel || hasAriaLabel,
        message: 'Form input missing associated label'
      };
    }
  },

  // Headings
  HEADING_ORDER: {
    id: 'heading-order',
    description: 'Headings must be in sequential order',
    level: ConformanceLevel.AA,
    test: (element, context) => {
      if (!/^H[1-6]$/.test(element.tagName)) return { pass: true };
      
      const level = parseInt(element.tagName[1]);
      const lastLevel = context.lastHeadingLevel || 0;
      
      if (lastLevel > 0 && level > lastLevel + 1) {
        return {
          pass: false,
          message: `Heading jumped from H${lastLevel} to H${level}`
        };
      }
      
      context.lastHeadingLevel = level;
      return { pass: true };
    }
  },

  // Color contrast
  COLOR_CONTRAST: {
    id: 'color-contrast',
    description: 'Text must have sufficient color contrast',
    level: ConformanceLevel.AA,
    test: (element) => {
      const text = element.textContent?.trim();
      if (!text) return { pass: true };
      
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const fgColor = style.color;
      
      // Skip if colors are not set
      if (!bgColor || !fgColor || bgColor === 'transparent') {
        return { pass: true };
      }
      
      const contrast = calculateContrast(fgColor, bgColor);
      const fontSize = parseFloat(style.fontSize);
      const isBold = parseInt(style.fontWeight) >= 700;
      
      // WCAG AA requirements
      const requiredContrast = (fontSize >= 18 || (fontSize >= 14 && isBold)) ? 3 : 4.5;
      
      return {
        pass: contrast >= requiredContrast,
        message: `Contrast ratio ${contrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`
      };
    }
  },

  // Keyboard navigation
  FOCUSABLE: {
    id: 'focusable',
    description: 'Interactive elements must be keyboard accessible',
    level: ConformanceLevel.A,
    test: (element) => {
      const interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
      if (!interactive) return { pass: true };
      
      const tabindex = element.getAttribute('tabindex');
      const disabled = element.hasAttribute('disabled');
      
      if (disabled) return { pass: true };
      
      // Check if element is focusable
      const isFocusable = tabindex !== '-1';
      
      return {
        pass: isFocusable,
        message: 'Interactive element is not keyboard accessible'
      };
    }
  },

  // ARIA roles
  ARIA_VALID: {
    id: 'aria-valid',
    description: 'ARIA attributes must be valid',
    level: ConformanceLevel.A,
    test: (element) => {
      const ariaAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));
        
      if (ariaAttrs.length === 0) return { pass: true };
      
      // Check for valid ARIA attributes
      const validAriaAttrs = [
        'aria-label', 'aria-labelledby', 'aria-describedby',
        'aria-hidden', 'aria-live', 'aria-atomic', 'aria-busy',
        'aria-checked', 'aria-disabled', 'aria-expanded',
        'aria-haspopup', 'aria-invalid', 'aria-pressed',
        'aria-selected', 'aria-required', 'aria-readonly'
      ];
      
      const invalidAttrs = ariaAttrs.filter(
        attr => !validAriaAttrs.includes(attr.name)
      );
      
      return {
        pass: invalidAttrs.length === 0,
        message: `Invalid ARIA attributes: ${invalidAttrs.map(a => a.name).join(', ')}`
      };
    }
  }
};

// Calculate color contrast ratio
function calculateContrast(color1, color2) {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) return 21; // Assume good contrast if can't parse
  
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color) {
  // Simple RGB parser (extend for full color support)
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export const A11yPlugin = createPlugin({
  name: 'a11y',
  version: '1.0.0',
  
  setup(app, context) {
    const options = this.options || {};
    const {
      level = ConformanceLevel.AA,
      autoScan = true,
      announceRouteChanges = true,
      enableKeyboardShortcuts = true,
      focusTrap = true,
      skipLinks = true
    } = options;

    // State
    const issues = signal([]);
    const scanning = signal(false);
    const focusableElements = signal([]);
    const currentFocusIndex = signal(-1);
    const announcements = signal([]);
    
    // Live region for announcements
    let liveRegion = null;
    
    // Initialize live region
    function initializeLiveRegion() {
      if (typeof document === 'undefined') return;
      
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
    }

    // Announce message to screen readers
    function announce(message, priority = 'polite') {
      if (!liveRegion) return;
      
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after delay
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
      
      // Track announcements
      announcements.value = [...announcements.value, {
        message,
        priority,
        timestamp: Date.now()
      }].slice(-10); // Keep last 10
    }

    // Scan for accessibility issues
    async function scan(rootElement = document.body) {
      scanning.value = true;
      const foundIssues = [];
      const context = {};
      
      try {
        const elements = rootElement.querySelectorAll('*');
        
        elements.forEach(element => {
          Object.values(A11yRules).forEach(rule => {
            // Check if rule applies to current level
            if (shouldCheckRule(rule, level)) {
              const result = rule.test(element, context);
              
              if (!result.pass) {
                foundIssues.push({
                  rule: rule.id,
                  element,
                  message: result.message,
                  description: rule.description,
                  level: rule.level,
                  path: getElementPath(element)
                });
              }
            }
          });
        });
        
        issues.value = foundIssues;
        
        if (foundIssues.length > 0) {
          console.warn(`[a11y] Found ${foundIssues.length} accessibility issues`);
        }
        
      } finally {
        scanning.value = false;
      }
      
      return foundIssues;
    }

    // Check if rule should be tested based on conformance level
    function shouldCheckRule(rule, targetLevel) {
      const levels = [ConformanceLevel.A, ConformanceLevel.AA, ConformanceLevel.AAA];
      const ruleIndex = levels.indexOf(rule.level);
      const targetIndex = levels.indexOf(targetLevel);
      return ruleIndex <= targetIndex;
    }

    // Get element path for debugging
    function getElementPath(element) {
      const path = [];
      let current = element;
      
      while (current && current !== document.body) {
        const selector = current.tagName.toLowerCase();
        if (current.id) {
          path.unshift(`${selector}#${current.id}`);
          break;
        } else if (current.className) {
          path.unshift(`${selector}.${current.className.split(' ')[0]}`);
        } else {
          path.unshift(selector);
        }
        current = current.parentElement;
      }
      
      return path.join(' > ');
    }

    // Focus management
    function getFocusableElements(container = document) {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');
      
      return Array.from(container.querySelectorAll(selector))
        .filter(el => el.offsetParent !== null); // Visible elements only
    }

    // Trap focus within container
    function trapFocus(container) {
      const elements = getFocusableElements(container);
      if (elements.length === 0) return;
      
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      
      function handleTab(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      container.addEventListener('keydown', handleTab);
      
      // Focus first element
      firstElement.focus();
      
      // Return cleanup function
      return () => {
        container.removeEventListener('keydown', handleTab);
      };
    }

    // Skip links implementation
    function createSkipLinks() {
      if (typeof document === 'undefined' || !skipLinks) return;
      
      const skipLink = document.createElement('a');
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'berryact-skip-link';
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        z-index: 10000;
      `;
      
      // Show on focus
      skipLink.addEventListener('focus', () => {
        skipLink.style.cssText = `
          position: absolute;
          left: 10px;
          top: 10px;
          width: auto;
          height: auto;
          padding: 8px 16px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          z-index: 10000;
        `;
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.left = '-10000px';
        skipLink.style.width = '1px';
        skipLink.style.height = '1px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Keyboard shortcuts
    const shortcuts = new Map();
    
    function registerShortcut(key, handler, description) {
      shortcuts.set(key, { handler, description });
    }
    
    function handleKeyboard(e) {
      if (!enableKeyboardShortcuts) return;
      
      const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
      const shortcut = shortcuts.get(key);
      
      if (shortcut) {
        e.preventDefault();
        shortcut.handler(e);
      }
    }

    // ARIA helpers
    const aria = {
      label(element, label) {
        element.setAttribute('aria-label', label);
      },
      
      describedBy(element, id) {
        element.setAttribute('aria-describedby', id);
      },
      
      live(element, politeness = 'polite') {
        element.setAttribute('aria-live', politeness);
      },
      
      hidden(element, hidden = true) {
        element.setAttribute('aria-hidden', String(hidden));
      },
      
      expanded(element, expanded) {
        element.setAttribute('aria-expanded', String(expanded));
      },
      
      selected(element, selected) {
        element.setAttribute('aria-selected', String(selected));
      },
      
      checked(element, checked) {
        element.setAttribute('aria-checked', String(checked));
      },
      
      current(element, current = 'page') {
        element.setAttribute('aria-current', current);
      }
    };

    // Component-level a11y
    this.registerComponentHook('mounted', (component) => {
      if (autoScan && component._element) {
        // Scan component for issues
        setTimeout(() => scan(component._element), 100);
      }
    });

    // Route change announcements
    if (announceRouteChanges) {
      this.registerAppHook('route:after', (to) => {
        const title = to.meta?.title || to.name || 'New page';
        announce(`Navigated to ${title}`);
      });
    }

    // Initialize
    if (typeof document !== 'undefined') {
      initializeLiveRegion();
      createSkipLinks();
      document.addEventListener('keydown', handleKeyboard);
    }

    // Default shortcuts
    registerShortcut('Alt+/', () => {
      console.log('Keyboard shortcuts:', Array.from(shortcuts.entries()));
    }, 'Show keyboard shortcuts');
    
    registerShortcut('Alt+a', () => {
      scan().then(issues => {
        console.log(`Found ${issues.length} accessibility issues:`, issues);
      });
    }, 'Run accessibility scan');

    // A11y API
    const a11y = {
      // State
      issues,
      scanning,
      announcements,
      
      // Methods
      scan,
      announce,
      aria,
      trapFocus,
      getFocusableElements,
      
      // Shortcuts
      registerShortcut,
      shortcuts,
      
      // Configuration
      level,
      
      // Utilities
      calculateContrast,
      
      // Rules
      rules: A11yRules,
      
      // Check specific element
      check(element, rules = Object.values(A11yRules)) {
        const issues = [];
        const context = {};
        
        rules.forEach(rule => {
          if (shouldCheckRule(rule, level)) {
            const result = rule.test(element, context);
            if (!result.pass) {
              issues.push({
                rule: rule.id,
                message: result.message,
                element
              });
            }
          }
        });
        
        return issues;
      }
    };

    // Provide API
    this.provide('a11y', a11y);
    
    // Global access
    app.a11y = a11y;
  }
});

// A11y directive
export function createA11yDirective(a11y) {
  return {
    name: 'a11y',
    
    mounted(el, binding) {
      const { value, modifiers } = binding;
      
      // Apply ARIA attributes
      if (typeof value === 'object') {
        Object.entries(value).forEach(([attr, val]) => {
          if (attr.startsWith('aria-')) {
            el.setAttribute(attr, String(val));
          }
        });
      }
      
      // Handle modifiers
      if (modifiers.hidden) {
        a11y.aria.hidden(el, true);
      }
      
      if (modifiers.live) {
        a11y.aria.live(el, value || 'polite');
      }
      
      if (modifiers.trap) {
        el._cleanupTrap = a11y.trapFocus(el);
      }
      
      if (modifiers.announce) {
        a11y.announce(el.textContent);
      }
    },
    
    updated(el, binding) {
      if (binding.modifiers.announce && el.textContent !== el._lastAnnounced) {
        a11y.announce(el.textContent);
        el._lastAnnounced = el.textContent;
      }
    },
    
    unmounted(el) {
      if (el._cleanupTrap) {
        el._cleanupTrap();
      }
    }
  };
}

// Export the ConformanceLevel constant
export { ConformanceLevel };