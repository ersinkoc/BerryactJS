/**
 * Router transitions and animations
 * Provides smooth page transitions and animation support
 */

import { signal, effect } from '../core/signal-enhanced.js';
import { nextTick } from '../render/scheduler.js';

// Transition states
export const TransitionState = {
  IDLE: 'idle',
  LEAVING: 'leaving',
  ENTERING: 'entering'
};

// Built-in transition types
export const TransitionType = {
  FADE: 'fade',
  SLIDE: 'slide',
  SCALE: 'scale',
  NONE: 'none'
};

// Transition manager
export class TransitionManager {
  constructor(options = {}) {
    this.options = {
      duration: 300,
      type: TransitionType.FADE,
      css: true,
      js: false,
      mode: 'out-in', // out-in, in-out, simultaneous
      ...options
    };

    this.state = signal(TransitionState.IDLE);
    this.transitioning = signal(false);
    this.currentTransition = null;
  }

  async transition(fromRoute, toRoute, fromElement, toElement) {
    if (this.transitioning.value) {
      return;
    }

    this.transitioning.value = true;

    try {
      const transition = this.getTransition(fromRoute, toRoute);
      
      if (transition.type === TransitionType.NONE) {
        // No transition
        if (fromElement) fromElement.style.display = 'none';
        if (toElement) toElement.style.display = '';
        return;
      }

      // Execute transition based on mode
      switch (transition.mode) {
        case 'out-in':
          await this.transitionOut(fromElement, transition);
          await this.transitionIn(toElement, transition);
          break;
          
        case 'in-out':
          await this.transitionIn(toElement, transition);
          await this.transitionOut(fromElement, transition);
          break;
          
        case 'simultaneous':
          await Promise.all([
            this.transitionOut(fromElement, transition),
            this.transitionIn(toElement, transition)
          ]);
          break;
      }
    } finally {
      this.transitioning.value = false;
      this.state.value = TransitionState.IDLE;
    }
  }

  async transitionOut(element, transition) {
    if (!element) return;

    this.state.value = TransitionState.LEAVING;

    if (transition.css) {
      await this.cssTransition(element, transition, 'leave');
    }

    if (transition.js && transition.leave) {
      await transition.leave(element);
    }

    element.style.display = 'none';
  }

  async transitionIn(element, transition) {
    if (!element) return;

    this.state.value = TransitionState.ENTERING;
    element.style.display = '';

    await nextTick();

    if (transition.css) {
      await this.cssTransition(element, transition, 'enter');
    }

    if (transition.js && transition.enter) {
      await transition.enter(element);
    }
  }

  async cssTransition(element, transition, direction) {
    const { type, duration } = transition;
    const baseClass = `berryact-transition-${type}`;
    const activeClass = `${baseClass}-${direction}-active`;
    const toClass = `${baseClass}-${direction}-to`;

    // Add base classes
    element.classList.add(baseClass, activeClass);

    // Force reflow
    element.offsetHeight;

    // Add transition class
    element.classList.add(toClass);

    // Wait for transition
    await new Promise(resolve => {
      setTimeout(() => {
        element.classList.remove(baseClass, activeClass, toClass);
        resolve();
      }, duration);
    });
  }

  getTransition(fromRoute, toRoute) {
    // Check route-specific transitions
    const routeTransition = toRoute?.meta?.transition || fromRoute?.meta?.transition;
    
    if (routeTransition) {
      return {
        ...this.options,
        ...routeTransition
      };
    }

    return this.options;
  }

  setDefaultTransition(transition) {
    Object.assign(this.options, transition);
  }
}

// Transition component wrapper
export function Transition({ name = 'fade', mode = 'out-in', duration = 300, children }) {
  const [visible, setVisible] = useState(true);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.value) return;

    const element = elementRef.value;
    const transition = {
      type: name,
      mode,
      duration,
      css: true
    };

    if (visible) {
      // Enter transition
      const manager = new TransitionManager(transition);
      manager.transitionIn(element, transition);
    } else {
      // Leave transition
      const manager = new TransitionManager(transition);
      manager.transitionOut(element, transition);
    }
  }, [visible]);

  return html`
    <div ref=${elementRef}>
      ${children}
    </div>
  `;
}

// Transition group for lists
export function TransitionGroup({ 
  tag = 'div', 
  name = 'list', 
  duration = 300, 
  children 
}) {
  const containerRef = useRef(null);
  const positions = useRef(new Map());

  useEffect(() => {
    if (!containerRef.value) return;

    const container = containerRef.value;
    const items = Array.from(container.children);

    // Record initial positions
    items.forEach(item => {
      const key = item.getAttribute('key');
      if (key) {
        positions.value.set(key, item.getBoundingClientRect());
      }
    });

    // Apply FLIP animation on next tick
    nextTick(() => {
      items.forEach(item => {
        const key = item.getAttribute('key');
        if (!key) return;

        const oldPos = positions.value.get(key);
        const newPos = item.getBoundingClientRect();

        if (oldPos) {
          const deltaX = oldPos.left - newPos.left;
          const deltaY = oldPos.top - newPos.top;

          if (deltaX || deltaY) {
            // Apply inverse transform
            item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            item.style.transition = 'none';

            // Force reflow
            item.offsetHeight;

            // Animate to new position
            item.style.transform = '';
            item.style.transition = `transform ${duration}ms`;
          }
        }
      });
    });
  });

  const Tag = tag;
  
  return html`
    <${Tag} ref=${containerRef} class="berryact-transition-group">
      ${children}
    </${Tag}>
  `;
}

// CSS for built-in transitions
export const transitionStyles = `
  /* Fade transition */
  .berryact-transition-fade-enter-active,
  .berryact-transition-fade-leave-active {
    transition: opacity var(--duration, 300ms);
  }
  
  .berryact-transition-fade-enter {
    opacity: 0;
  }
  
  .berryact-transition-fade-enter-to {
    opacity: 1;
  }
  
  .berryact-transition-fade-leave {
    opacity: 1;
  }
  
  .berryact-transition-fade-leave-to {
    opacity: 0;
  }

  /* Slide transition */
  .berryact-transition-slide-enter-active,
  .berryact-transition-slide-leave-active {
    transition: transform var(--duration, 300ms), opacity var(--duration, 300ms);
  }
  
  .berryact-transition-slide-enter {
    transform: translateX(100%);
    opacity: 0;
  }
  
  .berryact-transition-slide-enter-to {
    transform: translateX(0);
    opacity: 1;
  }
  
  .berryact-transition-slide-leave {
    transform: translateX(0);
    opacity: 1;
  }
  
  .berryact-transition-slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  /* Scale transition */
  .berryact-transition-scale-enter-active,
  .berryact-transition-scale-leave-active {
    transition: transform var(--duration, 300ms), opacity var(--duration, 300ms);
  }
  
  .berryact-transition-scale-enter {
    transform: scale(0.8);
    opacity: 0;
  }
  
  .berryact-transition-scale-enter-to {
    transform: scale(1);
    opacity: 1;
  }
  
  .berryact-transition-scale-leave {
    transform: scale(1);
    opacity: 1;
  }
  
  .berryact-transition-scale-leave-to {
    transform: scale(0.8);
    opacity: 0;
  }

  /* List transitions */
  .berryact-transition-list-move {
    transition: transform 300ms;
  }
  
  .berryact-transition-list-enter-active,
  .berryact-transition-list-leave-active {
    transition: all 300ms;
  }
  
  .berryact-transition-list-enter {
    opacity: 0;
    transform: translateY(30px);
  }
  
  .berryact-transition-list-leave-to {
    opacity: 0;
    transform: translateY(-30px);
  }
`;

// Inject transition styles
export function injectTransitionStyles() {
  if (typeof document === 'undefined') return;
  
  const styleId = 'berryact-transition-styles';
  
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = transitionStyles;
    document.head.appendChild(style);
  }
}

// Custom transition creator
export function createTransition(name, definition) {
  const transitions = new Map();
  
  transitions.set(name, {
    css: definition.css !== false,
    js: !!definition.js,
    duration: definition.duration || 300,
    enter: definition.enter,
    leave: definition.leave,
    styles: definition.styles
  });

  // Inject custom styles if provided
  if (definition.styles && typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = definition.styles;
    document.head.appendChild(style);
  }

  return {
    name,
    use: () => transitions.get(name)
  };
}

// Route transition directive
export function createTransitionDirective() {
  return {
    name: 'transition',
    
    mounted(el, binding) {
      const { value, modifiers } = binding;
      const transition = {
        type: value || TransitionType.FADE,
        duration: modifiers.fast ? 150 : modifiers.slow ? 600 : 300,
        mode: modifiers.inOut ? 'in-out' : modifiers.simultaneous ? 'simultaneous' : 'out-in'
      };

      el._transitionManager = new TransitionManager(transition);
    },

    updated(el, binding) {
      if (el._transitionManager && binding.value !== binding.oldValue) {
        el._transitionManager.setDefaultTransition({
          type: binding.value || TransitionType.FADE
        });
      }
    },

    unmounted(el) {
      delete el._transitionManager;
    }
  };
}