// Animation and transition system for Berryact framework

import { signal, computed, effect } from '../core/signal.js';

export class Animation {
  constructor(element, keyframes, options = {}) {
    this.element = element;
    this.keyframes = keyframes;
    this.options = {
      duration: 300,
      easing: 'ease',
      delay: 0,
      iterations: 1,
      direction: 'normal',
      fill: 'both',
      ...options,
    };

    this.animation = null;
    this.state = signal('idle'); // idle, running, paused, finished
    this.progress = signal(0);
    this.currentTime = signal(0);

    this.onStart = options.onStart || (() => {});
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onCancel = options.onCancel || (() => {});
  }

  play() {
    if (this.state.value === 'running') return this;

    this.animation = this.element.animate(this.keyframes, this.options);
    this.state.value = 'running';

    this.setupEventListeners();
    this.onStart(this);

    return this;
  }

  pause() {
    if (this.animation && this.state.value === 'running') {
      this.animation.pause();
      this.state.value = 'paused';
    }
    return this;
  }

  resume() {
    if (this.animation && this.state.value === 'paused') {
      this.animation.play();
      this.state.value = 'running';
    }
    return this;
  }

  cancel() {
    if (this.animation) {
      this.animation.cancel();
      this.state.value = 'idle';
      this.progress.value = 0;
      this.currentTime.value = 0;
      this.onCancel(this);
    }
    return this;
  }

  finish() {
    if (this.animation) {
      this.animation.finish();
    }
    return this;
  }

  reverse() {
    if (this.animation) {
      this.animation.reverse();
    }
    return this;
  }

  setPlaybackRate(rate) {
    if (this.animation) {
      this.animation.playbackRate = rate;
    }
    return this;
  }

  setupEventListeners() {
    if (!this.animation) return;

    const updateProgress = () => {
      if (this.animation) {
        const duration = this.animation.effect.getComputedTiming().duration;
        this.currentTime.value = this.animation.currentTime || 0;
        this.progress.value = duration > 0 ? this.currentTime.value / duration : 0;
        this.onUpdate(this);
      }
    };

    // Update progress during animation
    const progressInterval = setInterval(updateProgress, 16); // ~60fps

    this.animation.addEventListener('finish', () => {
      clearInterval(progressInterval);
      this.state.value = 'finished';
      this.progress.value = 1;
      this.onComplete(this);
    });

    this.animation.addEventListener('cancel', () => {
      clearInterval(progressInterval);
      this.state.value = 'idle';
      this.progress.value = 0;
      this.currentTime.value = 0;
    });
  }
}

// Transition system for component state changes
export class Transition {
  constructor(name, options = {}) {
    this.name = name;
    this.duration = options.duration || 300;
    this.easing = options.easing || 'ease';
    this.mode = options.mode || 'in-out'; // in-out, out-in, simultaneous

    // CSS classes for transitions
    this.enterClass = options.enterClass || `${name}-enter`;
    this.enterActiveClass = options.enterActiveClass || `${name}-enter-active`;
    this.enterToClass = options.enterToClass || `${name}-enter-to`;
    this.leaveClass = options.leaveClass || `${name}-leave`;
    this.leaveActiveClass = options.leaveActiveClass || `${name}-leave-active`;
    this.leaveToClass = options.leaveToClass || `${name}-leave-to`;

    // Hooks
    this.beforeEnter = options.beforeEnter || (() => {});
    this.enter = options.enter || this.defaultEnter.bind(this);
    this.afterEnter = options.afterEnter || (() => {});
    this.beforeLeave = options.beforeLeave || (() => {});
    this.leave = options.leave || this.defaultLeave.bind(this);
    this.afterLeave = options.afterLeave || (() => {});
  }

  async performEnter(element) {
    this.beforeEnter(element);

    element.classList.add(this.enterClass);
    element.classList.add(this.enterActiveClass);

    await this.nextFrame();

    element.classList.remove(this.enterClass);
    element.classList.add(this.enterToClass);

    await this.enter(element);

    element.classList.remove(this.enterActiveClass);
    element.classList.remove(this.enterToClass);

    this.afterEnter(element);
  }

  async performLeave(element) {
    this.beforeLeave(element);

    element.classList.add(this.leaveClass);
    element.classList.add(this.leaveActiveClass);

    await this.nextFrame();

    element.classList.remove(this.leaveClass);
    element.classList.add(this.leaveToClass);

    await this.leave(element);

    element.classList.remove(this.leaveActiveClass);
    element.classList.remove(this.leaveToClass);

    this.afterLeave(element);
  }

  defaultEnter(element) {
    return new Promise((resolve) => {
      setTimeout(resolve, this.duration);
    });
  }

  defaultLeave(element) {
    return new Promise((resolve) => {
      setTimeout(resolve, this.duration);
    });
  }

  nextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }
}

// Animation sequence builder
export class AnimationSequence {
  constructor() {
    this.animations = [];
    this.currentIndex = 0;
    this.state = signal('idle');
    this.progress = signal(0);
  }

  add(animation, delay = 0) {
    this.animations.push({ animation, delay });
    return this;
  }

  addParallel(...animations) {
    const parallelGroup = animations.map((anim) => ({ animation: anim, delay: 0 }));
    this.animations.push({ type: 'parallel', animations: parallelGroup });
    return this;
  }

  async play() {
    this.state.value = 'running';
    this.currentIndex = 0;

    for (let i = 0; i < this.animations.length; i++) {
      this.currentIndex = i;
      this.progress.value = i / this.animations.length;

      const item = this.animations[i];

      if (item.type === 'parallel') {
        await this.playParallel(item.animations);
      } else {
        if (item.delay > 0) {
          await this.delay(item.delay);
        }
        await this.playAnimation(item.animation);
      }
    }

    this.state.value = 'finished';
    this.progress.value = 1;
  }

  async playParallel(animations) {
    const promises = animations.map(async ({ animation, delay }) => {
      if (delay > 0) {
        await this.delay(delay);
      }
      return this.playAnimation(animation);
    });

    await Promise.all(promises);
  }

  async playAnimation(animation) {
    return new Promise((resolve, reject) => {
      animation.onComplete = resolve;
      animation.onCancel = reject;
      animation.play();
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cancel() {
    this.animations.forEach((item) => {
      if (item.type === 'parallel') {
        item.animations.forEach(({ animation }) => animation.cancel());
      } else {
        item.animation.cancel();
      }
    });
    this.state.value = 'idle';
    this.progress.value = 0;
  }
}

// Spring animation system
export class SpringAnimation {
  constructor(element, targetValues, options = {}) {
    this.element = element;
    this.targetValues = targetValues;
    this.options = {
      stiffness: 100,
      damping: 10,
      mass: 1,
      precision: 0.01,
      ...options,
    };

    this.currentValues = {};
    this.velocities = {};
    this.isRunning = false;
    this.startTime = 0;
    this.animationFrame = null;

    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});

    this.initializeValues();
  }

  initializeValues() {
    Object.keys(this.targetValues).forEach((prop) => {
      const currentValue = this.getCurrentValue(prop);
      this.currentValues[prop] = currentValue;
      this.velocities[prop] = 0;
    });
  }

  getCurrentValue(prop) {
    const style = getComputedStyle(this.element);
    const value = style[prop];

    // Extract numeric value
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? 0 : numericValue;
  }

  play() {
    if (this.isRunning) return this;

    this.isRunning = true;
    this.startTime = performance.now();
    this.tick();

    return this;
  }

  tick() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.startTime) / 1000, 0.016); // Max 16ms
    this.startTime = currentTime;

    let allSettled = true;

    Object.keys(this.targetValues).forEach((prop) => {
      const target = this.targetValues[prop];
      const current = this.currentValues[prop];
      const velocity = this.velocities[prop];

      // Spring physics calculation
      const displacement = current - target;
      const springForce = -this.options.stiffness * displacement;
      const dampingForce = -this.options.damping * velocity;
      const acceleration = (springForce + dampingForce) / this.options.mass;

      // Update velocity and position
      this.velocities[prop] = velocity + acceleration * deltaTime;
      this.currentValues[prop] = current + this.velocities[prop] * deltaTime;

      // Check if settled
      if (
        Math.abs(displacement) > this.options.precision ||
        Math.abs(velocity) > this.options.precision
      ) {
        allSettled = false;
      }

      // Apply to element
      this.applyValue(prop, this.currentValues[prop]);
    });

    this.onUpdate(this.currentValues, this.velocities);

    if (allSettled) {
      this.complete();
    } else {
      this.animationFrame = requestAnimationFrame(() => this.tick());
    }
  }

  applyValue(prop, value) {
    // Apply the value to the element based on property type
    if (prop === 'opacity') {
      this.element.style.opacity = value;
    } else if (prop.includes('translate')) {
      // Handle transform properties
      this.element.style.transform = `${prop}(${value}px)`;
    } else {
      this.element.style[prop] = `${value}px`;
    }
  }

  complete() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Snap to target values
    Object.keys(this.targetValues).forEach((prop) => {
      this.currentValues[prop] = this.targetValues[prop];
      this.velocities[prop] = 0;
      this.applyValue(prop, this.targetValues[prop]);
    });

    this.onComplete(this.currentValues);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateTarget(newTargets) {
    Object.assign(this.targetValues, newTargets);

    if (!this.isRunning) {
      this.play();
    }
  }
}

// Predefined animations library
export const Animations = {
  fadeIn: (element, options = {}) =>
    new Animation(element, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, ...options }),

  fadeOut: (element, options = {}) =>
    new Animation(element, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, ...options }),

  slideInLeft: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', ...options }
    ),

  slideInRight: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', ...options }
    ),

  slideInUp: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateY(100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', ...options }
    ),

  slideInDown: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateY(-100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', ...options }
    ),

  scaleIn: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out', ...options }
    ),

  scaleOut: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0)', opacity: 0 },
      ],
      { duration: 300, easing: 'ease-in', ...options }
    ),

  bounce: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-20px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
      ],
      { duration: 600, easing: 'ease-in-out', ...options }
    ),

  shake: (element, options = {}) =>
    new Animation(
      element,
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 500, ...options }
    ),

  pulse: (element, options = {}) =>
    new Animation(
      element,
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 500, iterations: Infinity, ...options }
    ),

  rotate: (element, options = {}) =>
    new Animation(element, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: 1000,
      iterations: Infinity,
      easing: 'linear',
      ...options,
    }),
};

// Animation utilities
export function animate(element, keyframes, options) {
  return new Animation(element, keyframes, options);
}

export function spring(element, targetValues, options) {
  return new SpringAnimation(element, targetValues, options);
}

export function sequence() {
  return new AnimationSequence();
}

export function transition(name, options) {
  return new Transition(name, options);
}

// Easing functions
export const Easing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic-bezier functions
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',

  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export { Animation, Transition, AnimationSequence, SpringAnimation };
