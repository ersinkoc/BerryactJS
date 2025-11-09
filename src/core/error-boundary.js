/**
 * Error Boundary implementation for catching and handling errors in component trees
 */

import { signal, effect } from './signal-enhanced.js';
import { getCurrentComponent } from './component.js';
import { useState, useEffect } from './hooks.js';
import { html } from '../template/parser.js';

// Global error handlers
const errorHandlers = new Set();
const errorBoundaries = new WeakMap();

/**
 * Error info structure
 */
class ErrorInfo {
  constructor(error, errorInfo = {}) {
    this.error = error;
    this.componentStack = errorInfo.componentStack || '';
    this.errorBoundary = errorInfo.errorBoundary || null;
    this.errorBoundaryFound = errorInfo.errorBoundaryFound || false;
    this.timestamp = new Date();
    this.phase = errorInfo.phase || 'render';
    this.props = errorInfo.props || {};
    this.state = errorInfo.state || {};
  }

  toString() {
    return `${this.error.toString()}\n\nComponent Stack:${this.componentStack}`;
  }
}

/**
 * Global error handler registration
 * @param handler
 */
export function onError(handler) {
  errorHandlers.add(handler);
  return () => errorHandlers.delete(handler);
}

/**
 * Emit error to all handlers
 * @param errorInfo
 */
function emitError(errorInfo) {
  errorHandlers.forEach((handler) => {
    try {
      handler(errorInfo);
    } catch (e) {
      console.error('Error in error handler:', e);
    }
  });
}

/**
 * Error Boundary class
 */
export class ErrorBoundary {
  constructor(options = {}) {
    this.state = signal({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });

    this.options = {
      fallback: null,
      onError: null,
      resetKeys: [],
      resetOnPropsChange: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    };

    this.retryCount = 0;
    this.resetKeys = new Set(this.options.resetKeys);
    this.previousResetKeys = new Set();

    // Set up reset key watching
    if (this.resetKeys.size > 0) {
      this.watchResetKeys();
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorCount: (this.state?.errorCount || 0) + 1,
    };
  }

  componentDidCatch(error, errorInfo) {
    const info = new ErrorInfo(error, {
      ...errorInfo,
      errorBoundary: this,
      errorBoundaryFound: true,
    });

    // Update state
    this.state.value = {
      ...this.state.value,
      hasError: true,
      error,
      errorInfo: info,
      errorCount: this.state.value.errorCount + 1,
    };

    // Call custom error handler
    if (this.options.onError) {
      this.options.onError(error, info);
    }

    // Emit to global handlers
    emitError(info);

    // Log to console in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', info);
    }
  }

  reset() {
    this.retryCount = 0;
    this.state.value = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  retry() {
    if (this.retryCount >= this.options.maxRetries) {
      console.error('Max retries reached');
      return;
    }

    this.retryCount++;

    setTimeout(() => {
      this.reset();
    }, this.options.retryDelay * this.retryCount);
  }

  watchResetKeys() {
    effect(() => {
      const currentKeys = new Set();

      this.resetKeys.forEach((key) => {
        if (typeof key === 'function') {
          currentKeys.add(key());
        } else {
          currentKeys.add(key);
        }
      });

      // Check if keys changed
      if (this.previousResetKeys.size > 0) {
        const keysChanged =
          currentKeys.size !== this.previousResetKeys.size ||
          [...currentKeys].some((key) => !this.previousResetKeys.has(key));

        if (keysChanged && this.state.value.hasError) {
          this.reset();
        }
      }

      this.previousResetKeys = currentKeys;
    });
  }

  render(children) {
    if (this.state.value.hasError) {
      const { error, errorInfo } = this.state.value;

      // Use custom fallback if provided
      if (typeof this.options.fallback === 'function') {
        return this.options.fallback({
          error,
          errorInfo,
          retry: () => this.retry(),
          reset: () => this.reset(),
        });
      }

      // Default fallback
      return html`
        <div class="berryact-error-boundary-fallback">
          <h2>Something went wrong</h2>
          <details style="white-space: pre-wrap">
            <summary>Error details</summary>
            ${error && error.toString()}
            <br />
            ${errorInfo && errorInfo.componentStack}
          </details>
          <button @click=${() => this.retry()}>
            Try again (${this.options.maxRetries - this.retryCount} retries left)
          </button>
        </div>
      `;
    }

    return children;
  }
}

/**
 * Error Boundary component wrapper
 * @param Component
 * @param errorBoundaryOptions
 */
export function withErrorBoundary(Component, errorBoundaryOptions = {}) {
  return function ErrorBoundaryWrapper(props) {
    const boundary = new ErrorBoundary(errorBoundaryOptions);

    try {
      return boundary.render(Component(props));
    } catch (error) {
      boundary.componentDidCatch(error, {
        componentStack: getComponentStack(),
        props,
        phase: 'render',
      });
      return boundary.render(null);
    }
  };
}

/**
 * Hook to catch errors in effects
 */
export function useErrorHandler() {
  const component = getCurrentComponent();

  return (error) => {
    const errorInfo = new ErrorInfo(error, {
      componentStack: getComponentStack(),
      phase: 'effect',
      component,
    });

    // Find nearest error boundary
    const boundary = findNearestErrorBoundary(component);

    if (boundary) {
      boundary.componentDidCatch(error, errorInfo);
    } else {
      // No error boundary found, emit to global handlers
      emitError(errorInfo);
      throw error;
    }
  };
}

/**
 * Async error boundary for handling promise rejections
 * @param root0
 * @param root0.children
 * @param root0.fallback
 * @param root0.onError
 */
export function AsyncErrorBoundary({ children, fallback, onError }) {
  const [asyncError, setAsyncError] = useState(null);

  // Catch unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      setAsyncError(event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (asyncError) {
    if (onError) {
      onError(asyncError);
    }

    if (fallback) {
      return fallback({
        error: asyncError,
        reset: () => setAsyncError(null),
      });
    }

    return html`
      <div class="berryact-async-error">
        <h3>Async Error</h3>
        <p>${asyncError.message || asyncError.toString()}</p>
        <button @click=${() => setAsyncError(null)}>Dismiss</button>
      </div>
    `;
  }

  try {
    return children;
  } catch (error) {
    if (error instanceof Promise) {
      throw error; // Let Suspense handle it
    }

    setAsyncError(error);
    return null;
  }
}

/**
 * Development error overlay
 * @param root0
 * @param root0.error
 * @param root0.errorInfo
 * @param root0.onClose
 */
export function ErrorOverlay({ error, errorInfo, onClose }) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return null;
  }

  const [isMinimized, setIsMinimized] = useState(false);

  return html`
    <div class="berryact-error-overlay ${isMinimized ? 'minimized' : ''}">
      <div class="berryact-error-overlay-header">
        <h3>Runtime Error</h3>
        <div class="berryact-error-overlay-actions">
          <button @click=${() => setIsMinimized(!isMinimized)}>${isMinimized ? '▲' : '▼'}</button>
          <button @click=${onClose}>✕</button>
        </div>
      </div>

      ${!isMinimized &&
      html`
        <div class="berryact-error-overlay-content">
          <div class="berryact-error-message"><strong>${error.name}:</strong> ${error.message}</div>

          <div class="berryact-error-stack">
            <h4>Stack Trace:</h4>
            <pre>${error.stack}</pre>
          </div>

          ${errorInfo &&
          html`
            <div class="berryact-error-component-stack">
              <h4>Component Stack:</h4>
              <pre>${errorInfo.componentStack}</pre>
            </div>
          `}

          <div class="berryact-error-tips">
            <h4>Debugging Tips:</h4>
            <ul>
              <li>Check the console for more details</li>
              <li>Add error boundaries to isolate the error</li>
              <li>Use the React DevTools to inspect component state</li>
            </ul>
          </div>
        </div>
      `}
    </div>
  `;
}

// Utility functions

/**
 * Get component stack trace
 */
function getComponentStack() {
  // This would need to be implemented based on your component system
  // For now, return a placeholder
  return '\n    in Component\n    in App';
}

/**
 * Find nearest error boundary
 * @param component
 */
function findNearestErrorBoundary(component) {
  // Walk up component tree to find error boundary
  // This would need actual implementation based on component hierarchy
  return null;
}

/**
 * Create error logger plugin
 * @param options
 */
export function createErrorLogger(options = {}) {
  const {
    logToConsole = true,
    logToService = null,
    filter = null,
    transformError = null,
  } = options;

  return {
    install(app) {
      onError((errorInfo) => {
        // Apply filter if provided
        if (filter && !filter(errorInfo)) {
          return;
        }

        // Transform error if needed
        const transformed = transformError ? transformError(errorInfo) : errorInfo;

        // Log to console
        if (logToConsole) {
          console.error('[Berryact Error]', transformed);
        }

        // Log to external service
        if (logToService) {
          logToService(transformed);
        }
      });
    },
  };
}

// CSS for error overlay (inject into page)
if (
  typeof document !== 'undefined' &&
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'production'
) {
  const style = document.createElement('style');
  style.textContent = `
    .berryact-error-overlay {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      z-index: 999999;
      overflow: auto;
      padding: 20px;
    }
    
    .berryact-error-overlay.minimized {
      bottom: auto;
      height: 50px;
      overflow: hidden;
    }
    
    .berryact-error-overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .berryact-error-overlay-actions button {
      background: none;
      border: 1px solid white;
      color: white;
      cursor: pointer;
      margin-left: 10px;
      padding: 5px 10px;
    }
    
    .berryact-error-message {
      background: #ff6b6b;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .berryact-error-stack pre,
    .berryact-error-component-stack pre {
      background: #2d2d2d;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .berryact-error-boundary-fallback {
      padding: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }
  `;
  document.head.appendChild(style);
}
