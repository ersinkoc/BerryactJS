// Berryact JS Framework - Optimized Build
// Essential exports only

// Core functionality
export { createApp } from './core/app.js';
export { defineComponent, Component } from './core/component.js';
export { signal, computed, effect } from './core/signal.js';

// Template system
export { html } from './template/enhanced-parser.js';

// Hooks
export { 
    useState, 
    useEffect, 
    useMemo, 
    useCallback, 
    useRef, 
    useContext, 
    createContext 
} from './core/hooks.js';

// JSX runtime (for build tools)
export * from './jsx-runtime.js';

// Version info
export const version = '1.0.0';
