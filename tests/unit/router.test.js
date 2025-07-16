import { Router, createRouter } from '../../src/router/index.js';
import { MemoryHistory } from '../../src/router/history.js';

describe('Router System', () => {
  let router;
  
  beforeEach(() => {
    router = createRouter({
      mode: 'memory',
      routes: [
        { path: '/', component: () => 'Home' },
        { path: '/about', component: () => 'About' },
        { path: '/users/:id', component: () => 'User', name: 'profile' },
        { path: '/posts/:id/comments/:commentId', component: () => 'Comment' },
        { path: '/login', component: () => 'Login' },
        { path: '/admin', component: () => 'Admin' }
      ]
    });
  });

  describe('Route Matching', () => {
    test('matches simple routes', () => {
      const route = router.matchRoute('/');
      expect(route).toBeTruthy();
      expect(route.path).toBe('/');
    });

    test('matches parameterized routes', () => {
      const route = router.matchRoute('/users/123');
      expect(route).toBeTruthy();
      expect(route.path).toBe('/users/:id');
      expect(route.params.id).toBe('123');
    });

    test('matches complex parameterized routes', () => {
      const route = router.matchRoute('/posts/456/comments/789');
      expect(route).toBeTruthy();
      expect(route.params.id).toBe('456');
      expect(route.params.commentId).toBe('789');
    });

    test('returns null for non-matching routes', () => {
      const route = router.matchRoute('/nonexistent');
      expect(route).toBeNull();
    });
  });

  describe('Navigation', () => {
    test('navigates to simple route', async () => {
      router.push('/about');
      // Wait for the async route change to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(router.currentRoute.value.path).toBe('/about');
    });

    test('navigates with parameters', async () => {
      router.push('/users/456');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(router.currentRoute.value.path).toBe('/users/:id');
      expect(router.params.value.id).toBe('456');
    });

    test('handles query parameters', () => {
      router.push('/about?tab=info&page=2');
      expect(router.query.value.tab).toBe('info');
      expect(router.query.value.page).toBe('2');
    });

    test('handles hash fragments', async () => {
      router.push('/about#section1');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(router.hash.value).toBe('section1');
    });

    test('replace navigation', () => {
      router.push('/');
      router.push('/about');
      router.replace('/users/123');
      
      // Should be able to go back to initial route, skipping replaced route
      router.back();
      expect(router.currentRoute.value.path).toBe('/');
    });
  });

  describe('History Management', () => {
    test('go forward and backward', () => {
      router.push('/');
      router.push('/about');
      router.push('/users/123');
      
      router.back();
      expect(router.currentRoute.value.path).toBe('/about');
      
      router.back();
      expect(router.currentRoute.value.path).toBe('/');
      
      router.forward();
      expect(router.currentRoute.value.path).toBe('/about');
    });

    test('go with delta', () => {
      router.push('/');
      router.push('/about');
      router.push('/users/123');
      
      router.go(-2);
      expect(router.currentRoute.value.path).toBe('/');
      
      router.go(1);
      expect(router.currentRoute.value.path).toBe('/about');
    });
  });

  describe('Route Guards', () => {
    test('beforeEach guard can allow navigation', async () => {
      let guardCalled = false;
      
      router.beforeEach((to, from, next) => {
        guardCalled = true;
        next();
      });
      
      router.push('/about');
      
      // Wait for async guard
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(guardCalled).toBe(true);
      expect(router.currentRoute.value.path).toBe('/about');
    });

    test('beforeEach guard can prevent navigation', async () => {
      router.push('/'); // Start at home
      
      router.beforeEach((to, from, next) => {
        if (to.path === '/about') {
          next(false); // Prevent navigation
        } else {
          next();
        }
      });
      
      router.push('/about');
      
      // Wait for async guard
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(router.currentRoute.value.path).toBe('/'); // Should stay at home
    });

    test('beforeEach guard can redirect', async () => {
      router.beforeEach((to, from, next) => {
        if (to.path === '/admin') {
          next('/login'); // Redirect to login
        } else {
          next();
        }
      });
      
      router.push('/admin');
      
      // Wait for async guard
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(router.currentRoute.value.path).toBe('/login');
    });

    test('afterEach guard runs after navigation', async () => {
      let afterEachCalled = false;
      let capturedTo = null;
      
      router.afterEach((to, from) => {
        afterEachCalled = true;
        capturedTo = to;
      });
      
      router.push('/about');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(afterEachCalled).toBe(true);
      expect(capturedTo.path).toBe('/about');
    });
  });

  describe('Named Routes', () => {
    beforeEach(() => {
      router.addRoute('/profile/:id', () => 'Profile', {
        name: 'profile'
      });
    });

    test('navigates to named route', async () => {
      router.pushNamed('profile', { id: '123' });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(router.currentRoute.value.name).toBe('profile');
      expect(router.params.value.id).toBe('123');
    });

    test('navigates to named route with query', async () => {
      router.pushNamed('profile', { id: '456' }, { tab: 'settings' });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(router.params.value.id).toBe('456');
      expect(router.query.value.tab).toBe('settings');
    });

    test('throws error for unknown named route', () => {
      expect(() => {
        router.pushNamed('unknown', {});
      }).toThrow('Route with name "unknown" not found');
    });
  });

  describe('Dynamic Route Addition', () => {
    test('adds single route', () => {
      router.addRoute('/dynamic', () => 'Dynamic');
      
      const route = router.matchRoute('/dynamic');
      expect(route).toBeTruthy();
      expect(route.path).toBe('/dynamic');
    });

    test('adds multiple routes', () => {
      router.addRoutes([
        { path: '/route1', component: () => 'Route1' },
        { path: '/route2', component: () => 'Route2' }
      ]);
      
      expect(router.matchRoute('/route1')).toBeTruthy();
      expect(router.matchRoute('/route2')).toBeTruthy();
    });

    test('handles route with meta data', () => {
      router.addRoute('/protected', () => 'Protected', {
        meta: { requiresAuth: true }
      });
      
      const route = router.matchRoute('/protected');
      expect(route.meta.requiresAuth).toBe(true);
    });
  });

  describe('Current Route Helpers', () => {
    test('getCurrentRoute returns current route', () => {
      router.push('/users/789');
      
      const current = router.getCurrentRoute();
      expect(current.path).toBe('/users/:id');
      expect(current.params.id).toBe('789');
    });

    test('isCurrentRoute checks if route is current', () => {
      router.push('/about');
      
      expect(router.isCurrentRoute('/about')).toBe(true);
      expect(router.isCurrentRoute('/users/123')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('handles navigation errors gracefully', async () => {
      let errorCaught = false;
      
      router.onError((error) => {
        errorCaught = true;
      });
      
      router.beforeEach((to, from, next) => {
        throw new Error('Navigation error');
      });
      
      router.push('/about');
      
      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(errorCaught).toBe(true);
    });
  });

  describe('Memory History', () => {
    test('works with memory history', () => {
      const memoryRouter = createRouter({
        mode: 'memory',
        routes: [
          { path: '/', component: () => 'Home' },
          { path: '/test', component: () => 'Test' }
        ]
      });
      
      memoryRouter.push('/test');
      expect(memoryRouter.currentRoute.value.path).toBe('/test');
      
      memoryRouter.back();
      expect(memoryRouter.currentRoute.value.path).toBe('/');
    });
  });
});