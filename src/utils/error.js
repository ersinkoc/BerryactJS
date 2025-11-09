export class BerryactError extends Error {
  constructor(message, code, component) {
    super(message);
    this.name = 'BerryactError';
    this.code = code;
    this.component = component;
  }
}

export function createErrorHandler(options = {}) {
  const { logErrors = true, captureStackTrace = true, onError = null } = options;

  return {
    handleError(error, component, info) {
      if (captureStackTrace && Error.captureStackTrace) {
        Error.captureStackTrace(error, this.handleError);
      }

      const errorInfo = {
        error,
        component,
        info,
        timestamp: new Date().toISOString(),
      };

      if (logErrors) {
        console.error('Berryact Error:', errorInfo);
      }

      if (onError) {
        try {
          onError(errorInfo);
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
        }
      }
    },

    wrapFunction(fn, context = 'Unknown') {
      return (...args) => {
        try {
          return fn(...args);
        } catch (error) {
          this.handleError(error, null, { context, args });
          throw error;
        }
      };
    },

    createErrorBoundary(fallback) {
      return {
        hasError: false,
        error: null,

        componentDidCatch(error, errorInfo) {
          this.hasError = true;
          this.error = error;
          this.handleError(error, null, errorInfo);
        },

        render() {
          if (this.hasError) {
            return fallback(this.error);
          }
          return null;
        },
      };
    },
  };
}

export const errorHandler = createErrorHandler();

export function warn(message, component) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.warn(`[Berryact Warning]: ${message}`, component || '');
  }
}

export function deprecate(message, version) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.warn(`[Berryact Deprecation]: ${message} (deprecated in v${version})`);
  }
}
