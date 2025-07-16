// Nested layouts and layout management for Berryact router

export class LayoutManager {
  constructor() {
    this.layouts = new Map();
    this.activeLayouts = new Map();
    this.layoutComponents = new Map();
  }

  registerLayout(name, component, options = {}) {
    this.layouts.set(name, {
      name,
      component,
      keepAlive: options.keepAlive || false,
      persistent: options.persistent || false,
      transition: options.transition || null,
      props: options.props || {},
    });
  }

  getLayout(name) {
    return this.layouts.get(name);
  }

  async activateLayout(name, container, props = {}) {
    const layout = this.getLayout(name);
    if (!layout) {
      throw new Error(`Layout "${name}" not found`);
    }

    // Check if layout is already active and should be kept alive
    if (layout.keepAlive && this.activeLayouts.has(name)) {
      const existingInstance = this.activeLayouts.get(name);
      existingInstance.setProps({ ...layout.props, ...props });
      return existingInstance;
    }

    // Create new layout instance
    const layoutInstance = this.createLayoutInstance(layout, props);
    layoutInstance.mount(container);

    this.activeLayouts.set(name, layoutInstance);
    this.layoutComponents.set(container, layoutInstance);

    return layoutInstance;
  }

  deactivateLayout(name) {
    const layoutInstance = this.activeLayouts.get(name);
    if (layoutInstance) {
      const layout = this.getLayout(name);

      if (!layout?.persistent) {
        layoutInstance.unmount();
        this.activeLayouts.delete(name);

        // Remove from components map
        for (const [container, instance] of this.layoutComponents.entries()) {
          if (instance === layoutInstance) {
            this.layoutComponents.delete(container);
            break;
          }
        }
      }
    }
  }

  createLayoutInstance(layout, props) {
    // This would integrate with the component system
    return {
      mount: (container) => {
        // Mount layout component
      },
      unmount: () => {
        // Unmount layout component
      },
      setProps: (newProps) => {
        // Update layout props
      },
    };
  }

  getActiveLayout(container) {
    return this.layoutComponents.get(container);
  }

  clearLayouts() {
    this.activeLayouts.forEach((instance, name) => {
      this.deactivateLayout(name);
    });
  }
}

export const layoutManager = new LayoutManager();

// Layout component for route definitions
export class RouteLayout {
  constructor(layoutName, options = {}) {
    this.layoutName = layoutName;
    this.props = options.props || {};
    this.outlets = options.outlets || ['default'];
    this.transition = options.transition || null;
  }

  render(children, routeProps = {}) {
    const layout = layoutManager.getLayout(this.layoutName);
    if (!layout) {
      console.warn(`Layout "${this.layoutName}" not found`);
      return children;
    }

    return layout.component({
      ...this.props,
      ...routeProps,
      children: this.organizeChildrenByOutlets(children),
    });
  }

  organizeChildrenByOutlets(children) {
    if (this.outlets.length === 1) {
      return { [this.outlets[0]]: children };
    }

    // For multiple outlets, children should specify their outlet
    const organizedChildren = {};
    this.outlets.forEach((outlet) => {
      organizedChildren[outlet] = [];
    });

    if (Array.isArray(children)) {
      children.forEach((child) => {
        const outlet = child.outlet || 'default';
        if (organizedChildren[outlet]) {
          organizedChildren[outlet].push(child);
        }
      });
    } else {
      const outlet = children.outlet || 'default';
      if (organizedChildren[outlet]) {
        organizedChildren[outlet] = children;
      }
    }

    return organizedChildren;
  }
}

// Layout-aware routing enhancements
export class LayoutRouter {
  constructor(router) {
    this.router = router;
    this.layoutStack = [];
    this.setupLayoutRouting();
  }

  setupLayoutRouting() {
    this.router.beforeEach((to, from, next) => {
      this.handleLayoutTransition(to, from);
      next();
    });
  }

  handleLayoutTransition(to, from) {
    const toLayouts = this.extractLayoutsFromRoute(to);
    const fromLayouts = this.extractLayoutsFromRoute(from);

    // Find common layouts to keep
    const commonLayouts = this.findCommonLayouts(toLayouts, fromLayouts);

    // Deactivate layouts that are no longer needed
    fromLayouts.forEach((layout) => {
      if (!commonLayouts.includes(layout)) {
        layoutManager.deactivateLayout(layout);
      }
    });

    // Activate new layouts
    toLayouts.forEach((layout) => {
      if (!commonLayouts.includes(layout)) {
        // Activate layout (this would need container reference)
        // layoutManager.activateLayout(layout, container);
      }
    });

    this.layoutStack = toLayouts;
  }

  extractLayoutsFromRoute(route) {
    if (!route) return [];

    const layouts = [];

    // Extract layouts from route hierarchy
    let currentRoute = route;
    while (currentRoute) {
      if (currentRoute.meta?.layout) {
        layouts.unshift(currentRoute.meta.layout);
      }
      currentRoute = currentRoute.parent;
    }

    return layouts;
  }

  findCommonLayouts(layouts1, layouts2) {
    const common = [];
    const minLength = Math.min(layouts1.length, layouts2.length);

    for (let i = 0; i < minLength; i++) {
      if (layouts1[i] === layouts2[i]) {
        common.push(layouts1[i]);
      } else {
        break;
      }
    }

    return common;
  }
}

// Nested outlet component
export function createOutlet(name = 'default') {
  return {
    name: 'RouterOutlet',
    props: ['name'],

    render() {
      const route = this.$route;
      const depth = this.$depth || 0;

      // Find the component for this outlet at this depth
      const matchedRoute = route.matched[depth];
      if (!matchedRoute) {
        return null;
      }

      const component = matchedRoute.components?.[this.name || name] || matchedRoute.component;
      if (!component) {
        return null;
      }

      // Pass down route props
      const routeProps = {
        $route: route,
        $router: this.$router,
        $depth: depth + 1,
      };

      return component(routeProps);
    },
  };
}

// Layout transition effects
export class LayoutTransition {
  constructor(name, options = {}) {
    this.name = name;
    this.duration = options.duration || 300;
    this.easing = options.easing || 'ease-in-out';
    this.enterClass = options.enterClass || `${name}-enter`;
    this.enterActiveClass = options.enterActiveClass || `${name}-enter-active`;
    this.enterToClass = options.enterToClass || `${name}-enter-to`;
    this.leaveClass = options.leaveClass || `${name}-leave`;
    this.leaveActiveClass = options.leaveActiveClass || `${name}-leave-active`;
    this.leaveToClass = options.leaveToClass || `${name}-leave-to`;
  }

  async enter(element) {
    return new Promise((resolve) => {
      element.classList.add(this.enterClass);
      element.classList.add(this.enterActiveClass);

      requestAnimationFrame(() => {
        element.classList.remove(this.enterClass);
        element.classList.add(this.enterToClass);

        setTimeout(() => {
          element.classList.remove(this.enterActiveClass);
          element.classList.remove(this.enterToClass);
          resolve();
        }, this.duration);
      });
    });
  }

  async leave(element) {
    return new Promise((resolve) => {
      element.classList.add(this.leaveClass);
      element.classList.add(this.leaveActiveClass);

      requestAnimationFrame(() => {
        element.classList.remove(this.leaveClass);
        element.classList.add(this.leaveToClass);

        setTimeout(() => {
          element.classList.remove(this.leaveActiveClass);
          element.classList.remove(this.leaveToClass);
          resolve();
        }, this.duration);
      });
    });
  }
}

// Pre-defined common layouts
export const CommonLayouts = {
  // Basic app layout with header, sidebar, main content
  AppLayout: (props) => html`
    <div class="app-layout">
      <header class="app-header">${props.header || 'Header'}</header>
      <div class="app-body">
        <aside class="app-sidebar" n-if=${props.showSidebar}>${props.sidebar || 'Sidebar'}</aside>
        <main class="app-main">${props.children.default || props.children}</main>
      </div>
    </div>
  `,

  // Dashboard layout with multiple content areas
  DashboardLayout: (props) => html`
    <div class="dashboard-layout">
      <nav class="dashboard-nav">${props.children.nav || 'Navigation'}</nav>
      <div class="dashboard-content">
        <section class="dashboard-main">${props.children.default || props.children}</section>
        <aside class="dashboard-aside" n-if=${props.children.aside}>${props.children.aside}</aside>
      </div>
    </div>
  `,

  // Auth layout for login/register pages
  AuthLayout: (props) => html`
    <div class="auth-layout">
      <div class="auth-container">
        <header class="auth-header">${props.header || 'Welcome'}</header>
        <main class="auth-main">${props.children.default || props.children}</main>
        <footer class="auth-footer">${props.footer || ''}</footer>
      </div>
    </div>
  `,

  // Modal layout for overlay content
  ModalLayout: (props) => html`
    <div class="modal-overlay" @click=${props.onClose}>
      <div class="modal-container" @click=${(e) => e.stopPropagation()}>
        <header class="modal-header" n-if=${props.title}>
          <h2>${props.title}</h2>
          <button class="modal-close" @click=${props.onClose}>×</button>
        </header>
        <main class="modal-body">${props.children.default || props.children}</main>
        <footer class="modal-footer" n-if=${props.children.footer}>${props.children.footer}</footer>
      </div>
    </div>
  `,
};

// Register common layouts
Object.entries(CommonLayouts).forEach(([name, component]) => {
  layoutManager.registerLayout(name, component);
});

export { layoutManager, RouteLayout, LayoutRouter };
