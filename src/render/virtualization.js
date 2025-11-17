// Virtual scrolling and list virtualization for large datasets

export class VirtualList {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 50;
    this.containerHeight = options.containerHeight || 400;
    this.buffer = options.buffer || 5;
    this.items = options.items || [];
    this.renderItem = options.renderItem;

    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.totalHeight = 0;

    this.container = null;
    this.viewport = null;
    this.content = null;

    // BUG-S5-005 FIX: Bind handleScroll once in constructor to prevent memory leak
    this.handleScroll = this.handleScroll.bind(this);

    this.updateVisibleRange();
  }

  setItems(items) {
    this.items = items;
    this.totalHeight = items.length * this.itemHeight;
    this.updateVisibleRange();
    this.render();
  }

  updateVisibleRange() {
    const itemsInView = Math.ceil(this.containerHeight / this.itemHeight);
    this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    this.visibleEnd = Math.min(
      this.items.length,
      this.visibleStart + itemsInView + this.buffer * 2
    );
  }

  handleScroll(event) {
    this.scrollTop = event.target.scrollTop;
    this.updateVisibleRange();
    this.render();
  }

  render() {
    if (!this.container) return;

    const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
    const offsetY = this.visibleStart * this.itemHeight;

    this.content.style.transform = `translateY(${offsetY}px)`;
    this.content.innerHTML = '';

    visibleItems.forEach((item, index) => {
      const actualIndex = this.visibleStart + index;
      const element = this.renderItem(item, actualIndex);
      element.style.height = `${this.itemHeight}px`;
      this.content.appendChild(element);
    });

    this.viewport.style.height = `${this.totalHeight}px`;
  }

  mount(container) {
    this.container = container;
    this.container.style.height = `${this.containerHeight}px`;
    this.container.style.overflow = 'auto';

    this.viewport = document.createElement('div');
    this.viewport.style.position = 'relative';
    this.viewport.style.height = `${this.totalHeight}px`;

    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.right = '0';

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);

    // BUG-S5-005 FIX: Use pre-bound handler (bound in constructor)
    this.container.addEventListener('scroll', this.handleScroll);
    this.render();
  }

  unmount() {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
      this.container.innerHTML = '';
    }
  }
}

// Virtual grid for 2D virtualization
export class VirtualGrid {
  constructor(options = {}) {
    this.itemWidth = options.itemWidth || 100;
    this.itemHeight = options.itemHeight || 100;
    this.containerWidth = options.containerWidth || 800;
    this.containerHeight = options.containerHeight || 600;
    this.gap = options.gap || 0;
    this.items = options.items || [];
    this.renderItem = options.renderItem;

    this.scrollTop = 0;
    this.scrollLeft = 0;

    // BUG-S5-019 FIX: Prevent division by zero
    this.cols = Math.floor(this.containerWidth / (this.itemWidth + this.gap));
    if (this.cols === 0) this.cols = 1;  // Ensure at least 1 column
    this.rows = Math.ceil(this.items.length / this.cols);

    this.visibleStartRow = 0;
    this.visibleEndRow = 0;
    this.visibleStartCol = 0;
    this.visibleEndCol = 0;

    this.container = null;
    this.viewport = null;
    this.content = null;

    // BUG-S5-005 FIX: Bind handleScroll once in constructor to prevent memory leak
    this.handleScroll = this.handleScroll.bind(this);

    this.updateVisibleRange();
  }

  setItems(items) {
    this.items = items;
    // BUG-S5-019 FIX: cols is already ensured to be >= 1 in constructor
    this.rows = Math.ceil(items.length / this.cols);
    this.updateVisibleRange();
    this.render();
  }

  updateVisibleRange() {
    const rowsInView = Math.ceil(this.containerHeight / (this.itemHeight + this.gap));
    const colsInView = Math.ceil(this.containerWidth / (this.itemWidth + this.gap));

    this.visibleStartRow = Math.max(0, Math.floor(this.scrollTop / (this.itemHeight + this.gap)));
    this.visibleEndRow = Math.min(this.rows, this.visibleStartRow + rowsInView + 1);

    this.visibleStartCol = Math.max(0, Math.floor(this.scrollLeft / (this.itemWidth + this.gap)));
    this.visibleEndCol = Math.min(this.cols, this.visibleStartCol + colsInView + 1);
  }

  handleScroll(event) {
    this.scrollTop = event.target.scrollTop;
    this.scrollLeft = event.target.scrollLeft;
    this.updateVisibleRange();
    this.render();
  }

  render() {
    if (!this.container) return;

    this.content.innerHTML = '';

    for (let row = this.visibleStartRow; row < this.visibleEndRow; row++) {
      for (let col = this.visibleStartCol; col < this.visibleEndCol; col++) {
        const index = row * this.cols + col;
        if (index >= this.items.length) break;

        const item = this.items[index];
        const element = this.renderItem(item, index);

        element.style.position = 'absolute';
        element.style.width = `${this.itemWidth}px`;
        element.style.height = `${this.itemHeight}px`;
        element.style.left = `${col * (this.itemWidth + this.gap)}px`;
        element.style.top = `${row * (this.itemHeight + this.gap)}px`;

        this.content.appendChild(element);
      }
    }
  }

  mount(container) {
    this.container = container;
    this.container.style.width = `${this.containerWidth}px`;
    this.container.style.height = `${this.containerHeight}px`;
    this.container.style.overflow = 'auto';

    this.viewport = document.createElement('div');
    this.viewport.style.position = 'relative';
    this.viewport.style.width = `${this.cols * (this.itemWidth + this.gap)}px`;
    this.viewport.style.height = `${this.rows * (this.itemHeight + this.gap)}px`;

    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.content.style.width = '100%';
    this.content.style.height = '100%';

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);

    // BUG-S5-005 FIX: Use pre-bound handler (bound in constructor)
    this.container.addEventListener('scroll', this.handleScroll);
    this.render();
  }

  unmount() {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
      this.container.innerHTML = '';
    }
  }
}

// Windowing directive for template integration
export function createWindowingDirective() {
  return {
    name: 'window',

    mounted(element, binding) {
      const options = binding.value || {};
      const virtualList = new VirtualList({
        containerHeight: element.clientHeight,
        itemHeight: options.itemHeight || 50,
        items: options.items || [],
        renderItem:
          options.renderItem ||
          ((item) => {
            const div = document.createElement('div');
            div.textContent = String(item);
            return div;
          }),
      });

      virtualList.mount(element);
      element._virtualList = virtualList;
    },

    updated(element, binding) {
      const virtualList = element._virtualList;
      if (virtualList && binding.value.items) {
        virtualList.setItems(binding.value.items);
      }
    },

    unmounted(element) {
      if (element._virtualList) {
        element._virtualList.unmount();
        delete element._virtualList;
      }
    },
  };
}

// Intersection observer for lazy loading
export class LazyLoader {
  constructor(options = {}) {
    this.rootMargin = options.rootMargin || '50px';
    this.threshold = options.threshold || 0.1;
    this.onEnter = options.onEnter || (() => {});
    this.onExit = options.onExit || (() => {});

    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      rootMargin: this.rootMargin,
      threshold: this.threshold,
    });

    this.observedElements = new Map();
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const data = this.observedElements.get(element);

      if (entry.isIntersecting) {
        this.onEnter(element, data);
      } else {
        this.onExit(element, data);
      }
    });
  }

  observe(element, data = {}) {
    this.observedElements.set(element, data);
    this.observer.observe(element);
  }

  unobserve(element) {
    this.observedElements.delete(element);
    this.observer.unobserve(element);
  }

  disconnect() {
    this.observer.disconnect();
    this.observedElements.clear();
  }
}

// Recycling pool for DOM elements
export class ElementPool {
  constructor(tagName, resetFn) {
    this.tagName = tagName;
    this.resetFn = resetFn;
    this.pool = [];
    this.maxSize = 50;
  }

  acquire() {
    if (this.pool.length > 0) {
      const element = this.pool.pop();
      if (this.resetFn) {
        this.resetFn(element);
      }
      return element;
    }

    return document.createElement(this.tagName);
  }

  release(element) {
    if (this.pool.length < this.maxSize && element.tagName.toLowerCase() === this.tagName) {
      // Clear element
      element.innerHTML = '';
      element.className = '';
      element.style.cssText = '';

      // Remove all attributes except standard ones
      const attributes = Array.from(element.attributes);
      attributes.forEach((attr) => {
        if (!['id', 'class', 'style'].includes(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });

      this.pool.push(element);
    }
  }

  clear() {
    this.pool.length = 0;
  }
}

// Common element pools
export const elementPools = {
  div: new ElementPool('div'),
  span: new ElementPool('span'),
  p: new ElementPool('p'),
  button: new ElementPool('button'),
  input: new ElementPool('input'),
  li: new ElementPool('li'),
  tr: new ElementPool('tr'),
  td: new ElementPool('td'),
};

export function getPooledElement(tagName) {
  const pool = elementPools[tagName];
  return pool ? pool.acquire() : document.createElement(tagName);
}

export function releasePooledElement(element) {
  const tagName = element.tagName.toLowerCase();
  const pool = elementPools[tagName];
  if (pool) {
    pool.release(element);
  }
}
