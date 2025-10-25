import { signal, computed, effect, batch, untrack, isSignal } from '../../src/core/signal.js';

describe('Signal System', () => {
  describe('signal', () => {
    test('creates signal with initial value', () => {
      const s = signal(42);
      expect(s.value).toBe(42);
    });

    test('updates signal value', () => {
      const s = signal(0);
      s.value = 10;
      expect(s.value).toBe(10);
    });

    test('peek returns value without tracking', () => {
      const s = signal(42);
      expect(s.peek()).toBe(42);
    });

    test('isSignal identifies signals', () => {
      const s = signal(42);
      expect(isSignal(s)).toBe(true);
      expect(isSignal({})).toBe(false);
      expect(isSignal(42)).toBe(false);
    });
  });

  describe('computed', () => {
    test('creates computed signal', () => {
      const count = signal(0);
      const doubled = computed(() => count.value * 2);
      expect(doubled.value).toBe(0);

      count.value = 5;
      expect(doubled.value).toBe(10);
    });

    test('only recomputes when dependencies change', () => {
      const count = signal(0);
      let computeCount = 0;

      const doubled = computed(() => {
        computeCount++;
        return count.value * 2;
      });

      // First access
      expect(doubled.value).toBe(0);
      expect(computeCount).toBe(1);

      // Second access should not recompute
      expect(doubled.value).toBe(0);
      expect(computeCount).toBe(1);

      // Change dependency
      count.value = 5;
      expect(doubled.value).toBe(10);
      expect(computeCount).toBe(2);
    });

    test('chains computed signals', () => {
      const a = signal(1);
      const b = computed(() => a.value * 2);
      const c = computed(() => b.value + 1);

      expect(c.value).toBe(3);

      a.value = 5;
      expect(c.value).toBe(11);
    });
  });

  describe('effect', () => {
    test('runs effect immediately by default', () => {
      const count = signal(0);
      let effectValue = null;

      effect(() => {
        effectValue = count.value;
      });

      expect(effectValue).toBe(0);
    });

    test('runs effect when dependencies change', () => {
      const count = signal(0);
      let effectValue = null;

      effect(() => {
        effectValue = count.value;
      });

      count.value = 10;
      expect(effectValue).toBe(10);
    });

    test('can be disposed', () => {
      const count = signal(0);
      let effectValue = null;

      const eff = effect(() => {
        effectValue = count.value;
      });

      eff.dispose();
      count.value = 10;
      expect(effectValue).toBe(0); // Should not update
    });

    test('supports cleanup functions', () => {
      const count = signal(0);
      let cleanupCalled = false;

      effect(() => {
        count.value; // Track dependency
        return () => {
          cleanupCalled = true;
        };
      });

      count.value = 1;
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('batch', () => {
    test('batches multiple updates', () => {
      const a = signal(0);
      const b = signal(0);
      let effectRunCount = 0;

      effect(() => {
        effectRunCount++;
        return a.value + b.value;
      });

      expect(effectRunCount).toBe(1);

      batch(() => {
        a.value = 1;
        b.value = 2;
      });

      expect(effectRunCount).toBe(2); // Should only run once more
    });
  });

  describe('untrack', () => {
    test('prevents dependency tracking', () => {
      const a = signal(0);
      const b = signal(0);
      let effectRunCount = 0;

      effect(() => {
        effectRunCount++;
        a.value; // Tracked
        untrack(() => {
          b.value; // Not tracked
        });
      });

      expect(effectRunCount).toBe(1);

      a.value = 1;
      expect(effectRunCount).toBe(2);

      b.value = 1;
      expect(effectRunCount).toBe(2); // Should not trigger
    });
  });
});
