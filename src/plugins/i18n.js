/**
 * Internationalization (i18n) Plugin for Berryact
 * Provides multi-language support with reactive language switching
 */

import { signal, computed, effect } from '../core/signal-enhanced.js';
import { createPlugin } from '../core/plugin.js';

export const I18nPlugin = createPlugin({
  name: 'i18n',
  version: '1.0.0',
  
  setup(app, context) {
    const options = this.options || {};
    
    // Plugin state
    const state = {
      locale: signal(options.defaultLocale || 'en'),
      fallbackLocale: signal(options.fallbackLocale || 'en'),
      messages: signal(options.messages || {}),
      numberFormats: signal(options.numberFormats || {}),
      dateFormats: signal(options.dateFormats || {}),
      loading: signal(false),
      loadedLocales: new Set([options.defaultLocale || 'en'])
    };

    // Message loader
    const messageLoader = options.messageLoader || null;

    // Get nested value from object using dot notation
    function getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Interpolate message with parameters
    function interpolate(message, params = {}) {
      return message.replace(/{(\w+)}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    // Core translation function
    function translate(key, params = {}, locale = null) {
      const currentLocale = locale || state.locale.value;
      const messages = state.messages.value[currentLocale] || {};
      const fallbackMessages = state.messages.value[state.fallbackLocale.value] || {};
      
      let message = getNestedValue(messages, key);
      
      if (!message && currentLocale !== state.fallbackLocale.value) {
        message = getNestedValue(fallbackMessages, key);
      }
      
      if (!message) {
        console.warn(`[i18n] Translation missing for key: ${key}`);
        return key;
      }
      
      // Handle pluralization
      if (typeof message === 'object' && params.count !== undefined) {
        const count = params.count;
        if (count === 0 && message.zero) {
          message = message.zero;
        } else if (count === 1 && message.one) {
          message = message.one;
        } else if (count === 2 && message.two) {
          message = message.two;
        } else if (count <= 10 && message.few) {
          message = message.few;
        } else if (message.many) {
          message = message.many;
        } else {
          message = message.other || key;
        }
      }
      
      return interpolate(message, params);
    }

    // Computed translator for reactive updates
    const t = computed(() => {
      // This computed depends on locale changes
      const locale = state.locale.value;
      
      return (key, params) => translate(key, params, locale);
    });

    // Number formatting
    function formatNumber(value, format = 'default') {
      const locale = state.locale.value;
      const formats = state.numberFormats.value[locale] || {};
      const formatOptions = formats[format] || {};
      
      try {
        return new Intl.NumberFormat(locale, formatOptions).format(value);
      } catch (e) {
        console.error('[i18n] Number formatting error:', e);
        return String(value);
      }
    }

    // Date formatting
    function formatDate(value, format = 'default') {
      const locale = state.locale.value;
      const formats = state.dateFormats.value[locale] || {};
      const formatOptions = formats[format] || {};
      
      try {
        const date = value instanceof Date ? value : new Date(value);
        return new Intl.DateTimeFormat(locale, formatOptions).format(date);
      } catch (e) {
        console.error('[i18n] Date formatting error:', e);
        return String(value);
      }
    }

    // Relative time formatting
    function formatRelativeTime(value, unit = 'auto') {
      const locale = state.locale.value;
      
      try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        
        if (unit === 'auto') {
          // Auto-detect appropriate unit
          const date = value instanceof Date ? value : new Date(value);
          const diff = date.getTime() - Date.now();
          const absDiff = Math.abs(diff);
          
          if (absDiff < 60000) { // Less than 1 minute
            return rtf.format(Math.round(diff / 1000), 'second');
          } else if (absDiff < 3600000) { // Less than 1 hour
            return rtf.format(Math.round(diff / 60000), 'minute');
          } else if (absDiff < 86400000) { // Less than 1 day
            return rtf.format(Math.round(diff / 3600000), 'hour');
          } else if (absDiff < 2592000000) { // Less than 30 days
            return rtf.format(Math.round(diff / 86400000), 'day');
          } else if (absDiff < 31536000000) { // Less than 1 year
            return rtf.format(Math.round(diff / 2592000000), 'month');
          } else {
            return rtf.format(Math.round(diff / 31536000000), 'year');
          }
        }
        
        return rtf.format(value, unit);
      } catch (e) {
        console.error('[i18n] Relative time formatting error:', e);
        return String(value);
      }
    }

    // Load locale messages
    async function loadLocale(locale) {
      if (!messageLoader || state.loadedLocales.has(locale)) {
        return;
      }
      
      state.loading.value = true;
      
      try {
        const messages = await messageLoader(locale);
        
        state.messages.value = {
          ...state.messages.value,
          [locale]: messages
        };
        
        state.loadedLocales.add(locale);
      } catch (error) {
        console.error(`[i18n] Failed to load locale ${locale}:`, error);
      } finally {
        state.loading.value = false;
      }
    }

    // Change locale
    async function setLocale(locale) {
      if (locale === state.locale.value) return;
      
      // Load locale if needed
      await loadLocale(locale);
      
      // Update locale
      state.locale.value = locale;
      
      // Update document lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
      }
      
      // Emit locale change event
      context.callHook('i18n:localeChanged', locale);
    }

    // Add messages for a locale
    function addMessages(locale, messages) {
      state.messages.value = {
        ...state.messages.value,
        [locale]: {
          ...(state.messages.value[locale] || {}),
          ...messages
        }
      };
    }

    // Get available locales
    const availableLocales = computed(() => {
      return Object.keys(state.messages.value);
    });

    // Check if locale is RTL
    function isRTL(locale = null) {
      const checkLocale = locale || state.locale.value;
      const rtlLocales = ['ar', 'he', 'fa', 'ur'];
      return rtlLocales.some(rtl => checkLocale.startsWith(rtl));
    }

    // Create scoped translator
    function createScopedTranslator(scope) {
      return (key, params) => {
        const scopedKey = scope ? `${scope}.${key}` : key;
        return t.value(scopedKey, params);
      };
    }

    // i18n API
    const i18n = {
      // Properties
      locale: state.locale,
      fallbackLocale: state.fallbackLocale,
      messages: state.messages,
      loading: state.loading,
      availableLocales,
      
      // Methods
      t: (key, params) => t.value(key, params),
      translate,
      setLocale,
      loadLocale,
      addMessages,
      formatNumber,
      formatDate,
      formatRelativeTime,
      isRTL,
      createScopedTranslator,
      
      // Aliases
      n: formatNumber,
      d: formatDate,
      rt: formatRelativeTime
    };

    // Setup document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = state.locale.value;
      
      // Watch for locale changes
      effect(() => {
        document.documentElement.lang = state.locale.value;
        document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
      });
    }

    // Register with router for locale-based routing
    this.registerAppHook('router', (router) => {
      if (options.routeLocale) {
        router.beforeEach((to, from, next) => {
          const localeParam = to.params.locale;
          
          if (localeParam && localeParam !== state.locale.value) {
            setLocale(localeParam);
          }
          
          next();
        });
      }
    });

    // Provide i18n API
    this.provide('i18n', i18n);
    
    // Global access
    app.i18n = i18n;
    app.$t = i18n.t;
    
    // Component injection helper
    app.config = app.config || {};
    app.config.globalProperties = app.config.globalProperties || {};
    app.config.globalProperties.$t = i18n.t;
    app.config.globalProperties.$i18n = i18n;
  }
});

// Helper component for translations
export function T({ i18n, children }) {
  const key = children;
  const params = {};
  
  // Extract parameters from attributes
  Object.keys(i18n).forEach(key => {
    if (key !== 'i18n' && key !== 'children') {
      params[key] = i18n[key];
    }
  });
  
  return i18n.t(key, params);
}

// Directive for translations
export function createI18nDirective(i18n) {
  return {
    name: 'i18n',
    
    mounted(el, binding) {
      const update = () => {
        const { value, arg, modifiers } = binding;
        
        if (typeof value === 'string') {
          el.textContent = i18n.t(value);
        } else if (typeof value === 'object') {
          const { key, params } = value;
          el.textContent = i18n.t(key, params);
        }
        
        // Handle modifiers
        if (modifiers.html) {
          el.innerHTML = el.textContent;
        }
        
        if (modifiers.placeholder && el.placeholder !== undefined) {
          el.placeholder = el.textContent;
        }
        
        if (modifiers.title) {
          el.title = el.textContent;
        }
      };
      
      // Initial update
      update();
      
      // Watch for locale changes
      el._i18nUnsubscribe = effect(update);
    },
    
    updated(el, binding) {
      // Re-run translation on update
      el._i18nUnsubscribe?.();
      this.mounted(el, binding);
    },
    
    unmounted(el) {
      el._i18nUnsubscribe?.();
    }
  };
}

// Create i18n instance
export function createI18n(options = {}) {
  return {
    install(app) {
      app.use(I18nPlugin, options);
    }
  };
}