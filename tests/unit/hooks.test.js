import { 
  useState, 
  useSignal, 
  useComputed, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef, 
  useContext, 
  createContext,
  setCurrentComponent,
  resetHookIndex
} from '../../src/core/hooks.js';
import { Component } from '../../src/core/component.js';

// Mock component for testing hooks
class MockComponent extends Component {
  constructor() {
    super();
    this.hooks = [];
  }
  
  render() {
    return null;
  }
}

describe('Hooks System', () => {
  let mockComponent;

  beforeEach(() => {
    mockComponent = new MockComponent();
    setCurrentComponent(mockComponent);
    resetHookIndex();
  });

  afterEach(() => {
    setCurrentComponent(null);
  });

  describe('useState', () => {
    test('returns initial value and setter function', () => {
      const [getValue, setValue] = useState('initial');
      
      expect(getValue()).toBe('initial');
      expect(typeof setValue).toBe('function');
    });

    test('updates value when setter is called', () => {
      const [getValue, setValue] = useState(0);
      
      setValue(5);
      expect(getValue()).toBe(5);
    });

    test('supports function updates', () => {
      const [getValue, setValue] = useState(0);
      
      setValue(prev => prev + 1);
      expect(getValue()).toBe(1);
    });

    test('maintains state between hook calls', () => {
      // First call
      const [getValue1, setValue1] = useState(10);
      setValue1(20);
      
      // Reset hook index to simulate re-render
      resetHookIndex();
      
      // Second call should return persisted state
      const [getValue2] = useState(10);
      expect(getValue2()).toBe(20);
    });
  });

  describe('useSignal', () => {
    test('creates reactive signal', () => {
      const signal = useSignal('test');
      
      expect(signal.value).toBe('test');
      
      signal.value = 'updated';
      expect(signal.value).toBe('updated');
    });

    test('persists signal between renders', () => {
      const signal1 = useSignal('initial');
      signal1.value = 'changed';
      
      resetHookIndex();
      
      const signal2 = useSignal('initial');
      expect(signal2.value).toBe('changed');
    });
  });

  describe('useComputed', () => {
    test('creates computed value', () => {
      const baseSignal = useSignal(5);
      const computed = useComputed(() => baseSignal.value * 2);
      
      expect(computed.value).toBe(10);
    });

    test('updates when dependencies change', () => {
      const baseSignal = useSignal(3);
      const computed = useComputed(() => baseSignal.value * 3);
      
      expect(computed.value).toBe(9);
      
      baseSignal.value = 4;
      expect(computed.value).toBe(12);
    });

    test('memoizes computation results', () => {
      let computeCount = 0;
      const baseSignal = useSignal(1);
      
      const computed = useComputed(() => {
        computeCount++;
        return baseSignal.value * 2;
      });
      
      // First access
      expect(computed.value).toBe(2);
      expect(computeCount).toBe(1);
      
      // Second access should not recompute
      expect(computed.value).toBe(2);
      expect(computeCount).toBe(1);
      
      // Change dependency
      baseSignal.value = 2;
      expect(computed.value).toBe(4);
      expect(computeCount).toBe(2);
    });
  });

  describe('useEffect', () => {
    test('runs effect function', () => {
      let effectRan = false;
      
      useEffect(() => {
        effectRan = true;
      });
      
      expect(effectRan).toBe(true);
    });

    test('runs cleanup function', () => {
      let cleanupRan = false;
      
      useEffect(() => {
        return () => {
          cleanupRan = true;
        };
      });
      
      // Simulate component unmount
      mockComponent.unmount();
      expect(cleanupRan).toBe(true);
    });

    test('only runs when dependencies change', () => {
      let runCount = 0;
      
      // Create a signal outside of the effect
      const dep = { value: 1 };
      
      // First render - should run
      resetHookIndex();
      useEffect(() => {
        runCount++;
      }, [dep.value]);
      
      expect(runCount).toBe(1);
      
      // Second render with same deps - should not run
      resetHookIndex();
      useEffect(() => {
        runCount++;
      }, [dep.value]);
      
      expect(runCount).toBe(1); // Should not run again
      
      // Third render with changed dependency - should run
      dep.value = 2;
      resetHookIndex();
      useEffect(() => {
        runCount++;
      }, [dep.value]);
      
      expect(runCount).toBe(2); // Should run again
    });
  });

  describe('useMemo', () => {
    test('memoizes expensive computations', () => {
      let computeCount = 0;
      const dep = { value: 1 };
      
      // First render
      resetHookIndex();
      const memoized = useMemo(() => {
        computeCount++;
        return dep.value * 2;
      }, [dep.value]);
      
      expect(memoized).toBe(2);
      expect(computeCount).toBe(1);
      
      // Second render with same deps
      resetHookIndex();
      const memoized2 = useMemo(() => {
        computeCount++;
        return dep.value * 2;
      }, [dep.value]);
      
      expect(memoized2).toBe(2);
      expect(computeCount).toBe(1); // Should not recompute
    });

    test('recomputes when dependencies change', () => {
      let computeCount = 0;
      const dep = useSignal(1);
      
      const memoized1 = useMemo(() => {
        computeCount++;
        return dep.value * 2;
      }, [dep.value]);
      
      expect(computeCount).toBe(1);
      
      // Change dependency
      dep.value = 3;
      resetHookIndex();
      
      const memoized2 = useMemo(() => {
        computeCount++;
        return dep.value * 2;
      }, [dep.value]);
      
      expect(memoized2).toBe(6);
      expect(computeCount).toBe(2); // Should recompute
    });
  });

  describe('useCallback', () => {
    test('memoizes callback functions', () => {
      const dep = { value: 1 };
      
      // First render
      resetHookIndex();
      const callback1 = useCallback(() => dep.value, [dep.value]);
      
      // Second render with same deps
      resetHookIndex();
      const callback2 = useCallback(() => dep.value, [dep.value]);
      
      expect(callback1).toBe(callback2); // Should be same reference
    });

    test('returns new callback when dependencies change', () => {
      const dep = useSignal(1);
      
      const callback1 = useCallback(() => dep.value, [dep.value]);
      
      dep.value = 2;
      resetHookIndex();
      
      const callback2 = useCallback(() => dep.value, [dep.value]);
      
      expect(callback1).not.toBe(callback2); // Should be different reference
    });
  });

  describe('useRef', () => {
    test('creates mutable ref object', () => {
      const ref = useRef('initial');
      
      expect(ref.current).toBe('initial');
      
      ref.current = 'updated';
      expect(ref.current).toBe('updated');
    });

    test('persists ref between renders', () => {
      const ref1 = useRef('test');
      ref1.current = 'changed';
      
      resetHookIndex();
      
      const ref2 = useRef('test');
      expect(ref2.current).toBe('changed');
      expect(ref1).toBe(ref2); // Should be same object
    });
  });

  describe('useContext', () => {
    test('returns context default value when no provider', () => {
      const TestContext = createContext('default');
      const value = useContext(TestContext);
      
      expect(value).toBe('default');
    });

    test('returns provider value when available', () => {
      const TestContext = createContext('default');
      
      // Mock context provider in component hierarchy
      mockComponent.providedContext = TestContext;
      mockComponent.contextValue = 'provided';
      
      const value = useContext(TestContext);
      expect(value).toBe('provided');
    });
  });

  describe('createContext', () => {
    test('creates context with default value', () => {
      const context = createContext('test');
      
      expect(context.defaultValue).toBe('test');
      expect(typeof context.Provider).toBe('function');
    });

    test('Provider component works correctly', () => {
      const TestContext = createContext('default');
      const Provider = TestContext.Provider;
      
      const children = 'test children';
      const result = Provider({ value: 'provided', children });
      
      expect(result).toBe(children);
    });
  });

  describe('error handling', () => {
    test('throws error when hooks called outside component', () => {
      setCurrentComponent(null);
      
      expect(() => {
        useState('test');
      }).toThrow('Hooks can only be called inside component render functions');
    });

    test('maintains hook order consistency', () => {
      // First render
      const [getValue1] = useState('first');
      const signal1 = useSignal('signal');
      
      resetHookIndex();
      
      // Second render with same hook order
      const [getValue2] = useState('first');
      const signal2 = useSignal('signal');
      
      expect(getValue1()).toBe(getValue2());
      expect(signal1).toBe(signal2);
    });
  });
});