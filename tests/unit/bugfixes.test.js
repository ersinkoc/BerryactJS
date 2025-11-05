/**
 * Tests for all bug fixes
 * Each test verifies that a specific bug has been fixed
 */

import { signal, computed, effect } from '../../src/core/signal.js';
import { useState, useEffect, setCurrentComponent, resetHookIndex } from '../../src/core/hooks.js';
import { createPortal, closePortal, createTooltip } from '../../src/core/portal.js';
import { Reconciler } from '../../src/core/reconciler.js';
import { diffAndPatch } from '../../src/render/patch.js';
import { AsyncErrorBoundary } from '../../src/core/error-boundary.js';
import { Component } from '../../src/core/component.js';

describe('Bug Fixes Verification', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Bug #1: Missing imports in portal.js', () => {
    test('createPortal should render content without import errors', (done) => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      // This would throw "render is not defined" before the fix
      const portal = createPortal('Portal content', target);

      // Portal renders asynchronously, so wait a bit
      setTimeout(() => {
        expect(target.querySelector('[data-berryact-portal]')).toBeTruthy();

        portal.dispose();
        document.body.removeChild(target);
        done();
      }, 10);
    });

    test('portal unmount should work without import errors', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      const portal = createPortal('Test', target);

      // This would throw "unmount is not defined" before the fix
      expect(() => portal.dispose()).not.toThrow();

      document.body.removeChild(target);
    });
  });

  describe('Bug #2: Wrong method name in closePortal', () => {
    test('closePortal should properly close portal by key', () => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      const portal = createPortal('Test Portal', target, { key: 'test-portal' });

      expect(target.querySelector('[data-berryact-portal]')).toBeTruthy();

      // This would throw "portal.unmount is not a function" before the fix
      expect(() => closePortal('test-portal')).not.toThrow();

      // Portal should be removed
      expect(target.querySelector('[data-berryact-portal]')).toBeFalsy();

      document.body.removeChild(target);
    });
  });

  describe('Bug #3: Undefined tooltipWrapper variable', () => {
    test('tooltip update should work without reference errors', (done) => {
      const anchor = document.createElement('button');
      anchor.textContent = 'Hover me';
      document.body.appendChild(anchor);

      const tooltip = createTooltip('Initial tooltip', anchor, { delay: 0 });

      tooltip.show();

      setTimeout(() => {
        // This would throw "tooltipWrapper is not defined" before the fix
        expect(() => tooltip.update('Updated tooltip')).not.toThrow();

        tooltip.dispose();
        document.body.removeChild(anchor);
        done();
      }, 10);
    });
  });

  describe('Bug #4: useState returns function-wrapped state', () => {
    test('useState should return actual value, not a function', () => {
      let hookResult;

      class TestComponent extends Component {
        render() {
          const [count, setCount] = useState(42);
          hookResult = { count, setCount };
          return null;
        }
      }

      const component = new TestComponent({});
      setCurrentComponent(component);
      resetHookIndex();

      component.render();

      // Before fix: count would be a function
      // After fix: count should be the actual value
      expect(typeof hookResult.count).toBe('number');
      expect(hookResult.count).toBe(42);
      expect(hookResult.count).not.toBeInstanceOf(Function);
    });

    test('useState setter should update the value correctly', () => {
      let currentCount;
      let setter;

      class TestComponent extends Component {
        render() {
          const [count, setCount] = useState(0);
          currentCount = count;
          setter = setCount;
          return null;
        }
      }

      const component = new TestComponent({});
      component.isMounted = true;
      setCurrentComponent(component);
      resetHookIndex();

      component.render();

      expect(currentCount).toBe(0);

      // Update value
      resetHookIndex();
      setter(5);

      setCurrentComponent(component);
      resetHookIndex();
      component.render();

      expect(currentCount).toBe(5);
    });
  });

  describe('Bug #5: Missing hook imports in error-boundary.js', () => {
    test('AsyncErrorBoundary should use useState without import errors', () => {
      // This test verifies that useState is imported and works in AsyncErrorBoundary
      // Before fix: would throw "useState is not defined"
      // After fix: component should render without errors

      class TestComponent extends Component {
        render() {
          setCurrentComponent(this);
          resetHookIndex();

          const result = AsyncErrorBoundary({
            children: 'Test content',
            fallback: null,
            onError: null,
          });

          return result;
        }
      }

      const component = new TestComponent({});
      component.isMounted = true;

      // Should not throw "useState is not defined"
      expect(() => component.render()).not.toThrow();
    });
  });

  describe('Bug #6: Signal called as function in reconciler.js', () => {
    test('reconciler should access signal.value, not call signal as function', () => {
      const reconciler = new Reconciler();
      const textSignal = signal('Hello World');

      const vnode = {
        type: '#text',
        props: {
          nodeValue: textSignal,
        },
        children: [],
      };

      const fiber = {
        vnode,
        dom: null,
      };

      // Before fix: would throw "text is not a function"
      // After fix: should access text.value correctly
      expect(() => reconciler.updateTextNode(fiber)).not.toThrow();
      expect(fiber.dom.nodeValue).toBe('Hello World');
    });

    test('reconciler should update text node when signal changes', () => {
      const reconciler = new Reconciler();
      const textSignal = signal('Initial');

      const vnode = {
        type: '#text',
        props: {
          nodeValue: textSignal,
        },
        children: [],
      };

      const fiber = {
        vnode,
        dom: null,
      };

      reconciler.updateTextNode(fiber);
      expect(fiber.dom.nodeValue).toBe('Initial');

      // Update signal value
      textSignal.value = 'Updated';

      // The effect should update the text node
      expect(fiber.dom.nodeValue).toBe('Updated');
    });
  });

  describe('Bug #7: Incorrect DOM element selection in patch.js', () => {
    test('patchElement should patch the correct element when multiple elements exist', () => {
      const container = document.createElement('div');
      const div1 = document.createElement('div');
      div1.textContent = 'First';
      const div2 = document.createElement('div');
      div2.textContent = 'Second';

      container.appendChild(div1);
      container.appendChild(div2);

      const oldNode = {
        type: 'element',
        tag: 'div',
        props: { className: 'old' },
        children: [],
        element: div2, // Reference to the second div
      };

      const newNode = {
        type: 'element',
        tag: 'div',
        props: { className: 'new' },
        children: [],
      };

      // Before fix: would update div1 (first match) instead of div2
      // After fix: should update div2 (the stored reference)
      diffAndPatch(oldNode, newNode, container);

      // div2 should have the new class, div1 should remain unchanged
      expect(div2.className).toBe('new');
      expect(div1.className).toBe('');
    });
  });

  describe('Bug #8: Null parent access in reconciler.js', () => {
    test('commitRoot should handle fibers without parent gracefully', () => {
      const reconciler = new Reconciler();

      const rootFiber = {
        vnode: { type: 'div', props: {}, children: [] },
        dom: document.createElement('div'),
        parent: null, // No parent
        effectTag: 'PLACEMENT',
        child: null,
        sibling: null,
      };

      // Before fix: would throw "Cannot read property 'dom' of null"
      // After fix: should handle null parent gracefully
      expect(() => reconciler.commitRoot(rootFiber)).not.toThrow();
    });

    test('commitRoot should process children even when parent is null', () => {
      const reconciler = new Reconciler();

      const childFiber = {
        vnode: { type: 'span', props: {}, children: [] },
        dom: document.createElement('span'),
        parent: { dom: container },
        effectTag: 'PLACEMENT',
        child: null,
        sibling: null,
      };

      const rootFiber = {
        vnode: { type: 'div', props: {}, children: [] },
        dom: document.createElement('div'),
        parent: null,
        effectTag: null,
        child: childFiber,
        sibling: null,
      };

      // Should not throw and should process child
      expect(() => reconciler.commitRoot(rootFiber)).not.toThrow();
    });
  });

  describe('Integration test: All fixes working together', () => {
    test('Complex component with portals, hooks, and signals should work correctly', (done) => {
      const target = document.createElement('div');
      document.body.appendChild(target);

      class TestComponent extends Component {
        render() {
          setCurrentComponent(this);
          resetHookIndex();

          const [count, setCount] = useState(0);
          const textSignal = signal('Test');

          // Test portal
          const portal = createPortal(
            `Count: ${count}, Signal: ${textSignal.value}`,
            target,
            { key: 'integration-test-portal' }
          );

          setTimeout(() => {
            setCount(1);
            textSignal.value = 'Updated';
            portal.dispose();
            document.body.removeChild(target);
            done();
          }, 10);

          return null;
        }
      }

      const component = new TestComponent({});
      component.isMounted = true;

      expect(() => component.render()).not.toThrow();
    });
  });
});
