import { createStore, Store } from '../../src/store/index.js';

describe('Store System', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      state: {
        count: 0,
        user: null,
        items: [],
      },
      getters: {
        doubleCount: (state) => state.count * 2,
        isLoggedIn: (state) => !!state.user,
        itemCount: (state) => state.items.length,
      },
      mutations: {
        increment(state) {
          state.count++;
        },
        setCount(state, count) {
          state.count = count;
        },
        setUser(state, user) {
          state.user = user;
        },
        addItem(state, item) {
          state.items.push(item);
        },
        clearItems(state) {
          state.items = [];
        },
      },
      actions: {
        async incrementAsync(context) {
          return new Promise((resolve) => {
            setTimeout(() => {
              context.commit('increment');
              resolve();
            }, 10);
          });
        },
        async loginUser(context, userData) {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 10));
          context.commit('setUser', userData);
          return userData;
        },
      },
    });
  });

  describe('State Management', () => {
    test('initializes with correct state', () => {
      expect(store.state.value.count).toBe(0);
      expect(store.state.value.user).toBeNull();
      expect(store.state.value.items).toEqual([]);
    });

    test('state is reactive', () => {
      let stateChangeCount = 0;

      store.subscribe(() => {
        stateChangeCount++;
      });

      store.commit('increment');
      expect(stateChangeCount).toBe(1);
      expect(store.state.value.count).toBe(1);
    });
  });

  describe('Getters', () => {
    test('computed getters work correctly', () => {
      expect(store.getters.doubleCount.value).toBe(0);

      store.commit('setCount', 5);
      expect(store.getters.doubleCount.value).toBe(10);
    });

    test('getters are reactive', () => {
      expect(store.getters.isLoggedIn.value).toBe(false);

      store.commit('setUser', { name: 'John' });
      expect(store.getters.isLoggedIn.value).toBe(true);
    });

    test('getters update when state changes', () => {
      store.commit('addItem', 'item1');
      expect(store.getters.itemCount.value).toBe(1);

      store.commit('addItem', 'item2');
      expect(store.getters.itemCount.value).toBe(2);

      store.commit('clearItems');
      expect(store.getters.itemCount.value).toBe(0);
    });
  });

  describe('Mutations', () => {
    test('mutations modify state', () => {
      store.commit('increment');
      expect(store.state.value.count).toBe(1);

      store.commit('setCount', 10);
      expect(store.state.value.count).toBe(10);
    });

    test('mutations with payload', () => {
      const user = { name: 'Alice', id: 1 };
      store.commit('setUser', user);
      expect(store.state.value.user).toEqual(user);
    });

    test('unknown mutation in strict mode throws error', () => {
      const strictStore = createStore({
        state: { count: 0 },
        strict: true,
      });

      expect(() => {
        strictStore.commit('unknownMutation');
      }).toThrow('Unknown mutation type: unknownMutation');
    });

    test('unknown mutation in non-strict mode is ignored', () => {
      const nonStrictStore = createStore({
        state: { count: 0 },
        strict: false,
      });

      expect(() => {
        nonStrictStore.commit('unknownMutation');
      }).not.toThrow();
    });
  });

  describe('Actions', () => {
    test('actions can commit mutations', async () => {
      await store.dispatch('incrementAsync');
      expect(store.state.value.count).toBe(1);
    });

    test('actions can return values', async () => {
      const userData = { name: 'Bob', id: 2 };
      const result = await store.dispatch('loginUser', userData);

      expect(result).toEqual(userData);
      expect(store.state.value.user).toEqual(userData);
    });

    test('actions receive correct context', async () => {
      let capturedContext = null;

      const testStore = createStore({
        state: { test: true },
        getters: { testGetter: (state) => state.test },
        actions: {
          testAction(context) {
            capturedContext = context;
          },
        },
      });

      await testStore.dispatch('testAction');

      expect(capturedContext.state).toBe(testStore.state.value);
      expect(capturedContext.getters).toBe(testStore.getters);
      expect(typeof capturedContext.commit).toBe('function');
      expect(typeof capturedContext.dispatch).toBe('function');
    });

    test('unknown action in strict mode throws error', async () => {
      const strictStore = createStore({
        state: { count: 0 },
        strict: true,
      });

      await expect(strictStore.dispatch('unknownAction')).rejects.toThrow(
        'Unknown action type: unknownAction'
      );
    });
  });

  describe('Subscriptions', () => {
    test('subscribe to state changes', () => {
      const changes = [];

      store.subscribe((state) => {
        changes.push({ ...state });
      });

      store.commit('increment');
      store.commit('setCount', 5);

      expect(changes).toHaveLength(2);
      expect(changes[0].count).toBe(1);
      expect(changes[1].count).toBe(5);
    });

    test('subscribeAction to action dispatches', () => {
      const actions = [];

      store.subscribeAction((action) => {
        actions.push(action);
      });

      store.dispatch('incrementAsync');

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('incrementAsync');
    });

    test('unsubscribe from changes', () => {
      let changeCount = 0;

      const unsubscribe = store.subscribe(() => {
        changeCount++;
      });

      store.commit('increment');
      expect(changeCount).toBe(1);

      unsubscribe();

      store.commit('increment');
      expect(changeCount).toBe(1); // Should not increment
    });
  });

  describe('Watch', () => {
    test('watch specific state property', () => {
      const changes = [];

      store.watch(
        (state) => state.count,
        (newValue, oldValue) => {
          changes.push({ newValue, oldValue });
        }
      );

      store.commit('setCount', 5);
      store.commit('setCount', 10);

      expect(changes).toHaveLength(2);
      expect(changes[0]).toEqual({ newValue: 5, oldValue: 0 });
      expect(changes[1]).toEqual({ newValue: 10, oldValue: 5 });
    });

    test('watch getter', () => {
      const changes = [];

      store.watch('doubleCount', (newValue, oldValue) => {
        changes.push({ newValue, oldValue });
      });

      store.commit('setCount', 3);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ newValue: 6, oldValue: 0 });
    });
  });

  describe('State Replacement', () => {
    test('replaceState updates entire state', () => {
      const newState = {
        count: 100,
        user: { name: 'New User' },
        items: ['new item'],
      };

      store.replaceState(newState);

      expect(store.state.value).toEqual(newState);
    });
  });

  describe('Time Travel', () => {
    test('saves state snapshots', () => {
      store.commit('increment');
      store.commit('increment');
      store.commit('setCount', 10);

      const history = store.getHistory();
      expect(history.length).toBe(4); // Initial + 3 mutations
    });

    test('can undo changes', () => {
      store.commit('setCount', 5);
      store.commit('setCount', 10);

      expect(store.state.value.count).toBe(10);

      const canUndo = store.undo();
      expect(canUndo).toBe(true);
      expect(store.state.value.count).toBe(5);
    });

    test('can redo changes', () => {
      store.commit('setCount', 5);
      store.commit('setCount', 10);

      store.undo();
      expect(store.state.value.count).toBe(5);

      const canRedo = store.redo();
      expect(canRedo).toBe(true);
      expect(store.state.value.count).toBe(10);
    });

    test('time travel to specific index', () => {
      store.commit('setCount', 1);
      store.commit('setCount', 2);
      store.commit('setCount', 3);

      const success = store.timeTravel(1); // Go to second state
      expect(success).toBe(true);
      expect(store.state.value.count).toBe(1);
    });

    test('canUndo and canRedo work correctly', () => {
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);

      store.commit('increment');
      expect(store.canUndo()).toBe(true);
      expect(store.canRedo()).toBe(false);

      store.undo();
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(true);
    });

    test('clear history', () => {
      store.commit('increment');
      store.commit('increment');

      expect(store.getHistory().length).toBeGreaterThan(1);

      store.clearHistory();
      expect(store.getHistory().length).toBe(1); // Only current state
    });
  });

  describe('Modules', () => {
    test('register module', () => {
      const userModule = {
        state: { profile: null },
        mutations: {
          setProfile(state, profile) {
            state.profile = profile;
          },
        },
      };

      store.registerModule('user', userModule);

      expect(store.hasModule('user')).toBe(true);
      expect(store.state.value.user).toBeDefined();
    });

    test('unregister module', () => {
      const testModule = {
        state: { data: [] },
      };

      store.registerModule('test', testModule);
      expect(store.hasModule('test')).toBe(true);

      store.unregisterModule('test');
      expect(store.hasModule('test')).toBe(false);
      expect(store.state.value.test).toBeUndefined();
    });
  });

  describe('Plugins', () => {
    test('plugins receive store instance', () => {
      let pluginStore = null;

      const testPlugin = (store) => {
        pluginStore = store;
      };

      createStore({
        state: { test: true },
        plugins: [testPlugin],
      });

      expect(pluginStore).toBeInstanceOf(Store);
    });

    test('use method adds plugin', () => {
      let pluginCalled = false;

      const testPlugin = () => {
        pluginCalled = true;
      };

      store.use(testPlugin);
      expect(pluginCalled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('mutation errors are caught', () => {
      const errorStore = createStore({
        state: { count: 0 },
        mutations: {
          errorMutation() {
            throw new Error('Mutation error');
          },
        },
      });

      expect(() => {
        errorStore.commit('errorMutation');
      }).toThrow('Mutation error');
    });

    test('action errors are propagated', async () => {
      const errorStore = createStore({
        state: { count: 0 },
        actions: {
          async errorAction() {
            throw new Error('Action error');
          },
        },
      });

      await expect(errorStore.dispatch('errorAction')).rejects.toThrow('Action error');
    });
  });
});
