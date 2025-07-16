export class RouteGuard {
  constructor() {
    this.globalGuards = {
      beforeEach: [],
      afterEach: []
    };
    this.errorHandlers = [];
  }

  addGlobalGuard(type, guard) {
    if (this.globalGuards[type]) {
      this.globalGuards[type].push(guard);
    }
  }

  removeGlobalGuard(type, guard) {
    if (this.globalGuards[type]) {
      const index = this.globalGuards[type].indexOf(guard);
      if (index >= 0) {
        this.globalGuards[type].splice(index, 1);
      }
    }
  }

  async canActivate(to, from) {
    try {
      const guards = [
        ...this.globalGuards.beforeEach,
        ...(to.beforeEnter ? [to.beforeEnter] : [])
      ];

      for (const guard of guards) {
        const result = await this.executeGuard(guard, to, from);
        
        if (result === false) {
          return false;
        }
        
        if (typeof result === 'string') {
          throw new NavigationRedirect(result);
        }
        
        if (result && result.path) {
          throw new NavigationRedirect(result.path);
        }
      }

      this.executeAfterEachGuards(to, from);
      return true;
    } catch (error) {
      this.handleError(error, to, from);
      return false;
    }
  }

  async executeGuard(guard, to, from) {
    return new Promise((resolve) => {
      const next = (result) => {
        resolve(result);
      };

      const guardResult = guard(to, from, next);
      
      if (guardResult instanceof Promise) {
        guardResult.then(resolve).catch(error => {
          this.handleError(error, to, from);
          resolve(false);
        });
      } else if (guardResult !== undefined) {
        resolve(guardResult);
      }
    });
  }

  executeAfterEachGuards(to, from) {
    this.globalGuards.afterEach.forEach(guard => {
      try {
        guard(to, from);
      } catch (error) {
        this.handleError(error, to, from);
      }
    });
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  handleError(error, to, from) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, to, from);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });

    if (this.errorHandlers.length === 0) {
      console.error('Navigation error:', error);
    }
  }
}

export class NavigationRedirect extends Error {
  constructor(location) {
    super('Navigation redirected');
    this.name = 'NavigationRedirect';
    this.location = location;
  }
}

export function createNavigationGuard(guardFn) {
  return guardFn;
}

export function requireAuth(to, from, next) {
  if (typeof window !== 'undefined' && !window.localStorage.getItem('authToken')) {
    next('/login');
  } else {
    next();
  }
}

export function requireRole(role) {
  return (to, from, next) => {
    const userRole = typeof window !== 'undefined' 
      ? window.localStorage.getItem('userRole') 
      : null;
    
    if (userRole !== role) {
      next('/unauthorized');
    } else {
      next();
    }
  };
}

export function confirmLeave(message = 'Are you sure you want to leave?') {
  return (to, from, next) => {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      next();
    } else {
      next(false);
    }
  };
}

export function logNavigation(to, from, next) {
  console.log(`Navigating from ${from?.path || 'unknown'} to ${to.path}`);
  next();
}

export function trackPageView(to, from) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_TRACKING_ID', {
      page_path: to.path,
      page_title: to.meta?.title || document.title
    });
  }
}

export function setDocumentTitle(to, from) {
  if (typeof document !== 'undefined' && to.meta?.title) {
    document.title = to.meta.title;
  }
}

export function scrollToTop(to, from) {
  if (typeof window !== 'undefined' && to.path !== from?.path) {
    window.scrollTo(0, 0);
  }
}

export function preserveScroll(savedPositions = new Map()) {
  return {
    beforeEach(to, from, next) {
      if (from && typeof window !== 'undefined') {
        savedPositions.set(from.path, {
          x: window.pageXOffset,
          y: window.pageYOffset
        });
      }
      next();
    },
    
    afterEach(to, from) {
      if (typeof window !== 'undefined') {
        const savedPosition = savedPositions.get(to.path);
        if (savedPosition) {
          setTimeout(() => {
            window.scrollTo(savedPosition.x, savedPosition.y);
          }, 0);
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  };
}