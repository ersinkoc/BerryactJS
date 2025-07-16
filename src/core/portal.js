/**
 * Portal implementation for rendering components outside the normal DOM hierarchy
 */

import { effect, signal } from './signal-enhanced.js';
// TODO: Fix render/unmount imports
// import { render, unmount } from '../render/dom.js';

// Global portal registry
const portals = new Map();
let portalId = 0;

/**
 * Creates a portal that renders content to a different DOM location
 * @param {Function} content - Component or content to render
 * @param {Element|string} target - Target DOM element or selector
 * @param {Object} options - Portal options
 */
export function createPortal(content, target, options = {}) {
  const id = ++portalId;
  const {
    key = `portal_${id}`,
    prepend = false,
    className = null,
    onMount = null,
    onUnmount = null
  } = options;

  // Resolve target element
  const targetElement = typeof target === 'string' 
    ? document.querySelector(target) 
    : target;

  if (!targetElement) {
    throw new Error(`Portal target not found: ${target}`);
  }

  // Create portal container
  const container = document.createElement('div');
  container.setAttribute('data-berryact-portal', key);
  
  if (className) {
    container.className = className;
  }

  // Portal state
  const portal = {
    id,
    key,
    content,
    target: targetElement,
    container,
    instance: null,
    active: signal(true),
    mounted: false
  };

  // Mount portal
  function mount() {
    if (portal.mounted) return;

    if (prepend && targetElement.firstChild) {
      targetElement.insertBefore(container, targetElement.firstChild);
    } else {
      targetElement.appendChild(container);
    }

    // Render content
    portal.instance = render(content, container);
    portal.mounted = true;

    if (onMount) {
      onMount(portal);
    }

    // Register portal
    portals.set(key, portal);
  }

  // Unmount portal
  function unmountPortal() {
    if (!portal.mounted) return;

    if (portal.instance) {
      unmount(portal.instance);
    }

    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }

    portal.mounted = false;

    if (onUnmount) {
      onUnmount(portal);
    }

    // Unregister portal
    portals.delete(key);
  }

  // Update portal content
  function update(newContent) {
    if (!portal.mounted) return;

    portal.content = newContent;
    
    // Re-render content
    if (portal.instance) {
      unmount(portal.instance);
    }
    portal.instance = render(newContent, container);
  }

  // Watch active state
  effect(() => {
    if (portal.active.value && !portal.mounted) {
      mount();
    } else if (!portal.active.value && portal.mounted) {
      unmountPortal();
    }
  });

  // Auto-mount if active
  if (portal.active.value) {
    mount();
  }

  return {
    mount,
    unmount: unmountPortal,
    update,
    activate: () => portal.active.value = true,
    deactivate: () => portal.active.value = false,
    isActive: () => portal.active.value,
    isMounted: () => portal.mounted,
    getContainer: () => container,
    getTarget: () => targetElement,
    dispose: () => {
      unmountPortal();
      portal.active.dispose();
    }
  };
}

/**
 * Portal component wrapper
 */
export function Portal({ to, children, ...options }) {
  const portal = createPortal(() => children, to, options);
  
  // Return a cleanup function that will be called on unmount
  return {
    _portal: portal,
    dispose: () => portal.dispose()
  };
}

/**
 * Get a portal by key
 */
export function getPortal(key) {
  return portals.get(key);
}

/**
 * Get all active portals
 */
export function getAllPortals() {
  return Array.from(portals.values());
}

/**
 * Close a portal by key
 */
export function closePortal(key) {
  const portal = portals.get(key);
  if (portal) {
    portal.unmount();
  }
}

/**
 * Close all portals
 */
export function closeAllPortals() {
  portals.forEach(portal => portal.unmount());
}

// Common portal targets
export const PortalTargets = {
  BODY: document.body,
  HEAD: document.head,
  ROOT: '#root',
  MODAL: '#modal-root',
  TOOLTIP: '#tooltip-root',
  DROPDOWN: '#dropdown-root'
};

/**
 * Create modal portal helper
 */
export function createModal(content, options = {}) {
  const {
    className = 'berryact-modal',
    backdrop = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    onClose = null,
    ...portalOptions
  } = options;

  let portal;
  let backdropElement;

  // Create backdrop if needed
  if (backdrop) {
    backdropElement = document.createElement('div');
    backdropElement.className = 'berryact-modal-backdrop';
    backdropElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
    `;

    if (closeOnBackdrop) {
      backdropElement.addEventListener('click', (e) => {
        if (e.target === backdropElement) {
          close();
        }
      });
    }

    document.body.appendChild(backdropElement);
  }

  // Create modal wrapper
  const modalWrapper = () => {
    return {
      render: () => {
        const modalElement = document.createElement('div');
        modalElement.className = 'berryact-modal-content';
        modalElement.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          z-index: 9999;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
        `;

        // Render content
        render(content, modalElement);

        return modalElement;
      }
    };
  };

  // Create portal
  portal = createPortal(modalWrapper, document.body, {
    className,
    ...portalOptions
  });

  // Handle escape key
  function handleEscape(e) {
    if (e.key === 'Escape' && closeOnEscape) {
      close();
    }
  }

  if (closeOnEscape) {
    document.addEventListener('keydown', handleEscape);
  }

  // Close function
  function close() {
    if (onClose) {
      onClose();
    }

    portal.dispose();

    if (backdropElement && backdropElement.parentNode) {
      backdropElement.parentNode.removeChild(backdropElement);
    }

    if (closeOnEscape) {
      document.removeEventListener('keydown', handleEscape);
    }
  }

  return {
    portal,
    close,
    update: (newContent) => portal.update(() => modalWrapper(newContent))
  };
}

/**
 * Create tooltip portal helper
 */
export function createTooltip(content, anchor, options = {}) {
  const {
    position = 'top',
    offset = 8,
    className = 'berryact-tooltip',
    delay = 0,
    ...portalOptions
  } = options;

  let portal;
  let timeoutId;

  function calculatePosition() {
    const rect = anchor.getBoundingClientRect();
    const positions = {
      top: {
        left: rect.left + rect.width / 2,
        top: rect.top - offset,
        transform: 'translate(-50%, -100%)'
      },
      bottom: {
        left: rect.left + rect.width / 2,
        top: rect.bottom + offset,
        transform: 'translate(-50%, 0)'
      },
      left: {
        left: rect.left - offset,
        top: rect.top + rect.height / 2,
        transform: 'translate(-100%, -50%)'
      },
      right: {
        left: rect.right + offset,
        top: rect.top + rect.height / 2,
        transform: 'translate(0, -50%)'
      }
    };

    return positions[position] || positions.top;
  }

  function show() {
    if (portal) return;

    timeoutId = setTimeout(() => {
      const tooltipWrapper = () => {
        const pos = calculatePosition();
        
        return {
          render: () => {
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'berryact-tooltip-content';
            tooltipElement.style.cssText = `
              position: fixed;
              left: ${pos.left}px;
              top: ${pos.top}px;
              transform: ${pos.transform};
              z-index: 10000;
              pointer-events: none;
            `;

            render(content, tooltipElement);
            return tooltipElement;
          }
        };
      };

      portal = createPortal(tooltipWrapper, document.body, {
        className,
        ...portalOptions
      });
    }, delay);
  }

  function hide() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (portal) {
      portal.dispose();
      portal = null;
    }
  }

  function update(newContent) {
    content = newContent;
    if (portal) {
      portal.update(() => tooltipWrapper(newContent));
    }
  }

  // Auto-bind events
  anchor.addEventListener('mouseenter', show);
  anchor.addEventListener('mouseleave', hide);
  anchor.addEventListener('focus', show);
  anchor.addEventListener('blur', hide);

  return {
    show,
    hide,
    update,
    dispose: () => {
      hide();
      anchor.removeEventListener('mouseenter', show);
      anchor.removeEventListener('mouseleave', hide);
      anchor.removeEventListener('focus', show);
      anchor.removeEventListener('blur', hide);
    }
  };
}