/**
 * Virtual Scroller Plugin for Berryact
 * Efficiently renders large lists by only rendering visible items
 */

import { signal, computed, effect } from '../core/signal-enhanced.js';
import { createPlugin } from '../core/plugin.js';
import { html } from '../template/parser.js';

export const VirtualScrollerPlugin = createPlugin({
  name: 'virtual-scroller',
  version: '1.0.0',

  setup(app, context) {
    // Virtual scroller factory
    function createVirtualScroller(options = {}) {
      const {
        items = [],
        itemHeight = 50,
        containerHeight = 400,
        buffer = 5,
        horizontal = false,
        onScroll = null,
        getItemHeight = null, // Function for dynamic heights
        estimatedItemHeight = itemHeight,
      } = options;

      // State
      const state = {
        items: signal(items),
        scrollTop: signal(0),
        scrollLeft: signal(0),
        containerHeight: signal(containerHeight),
        containerWidth: signal(400),
        isScrolling: signal(false),
        itemHeights: new Map(),
        measuredHeight: signal(0),
      };

      // Calculate visible range
      const visibleRange = computed(() => {
        const scrollPos = horizontal ? state.scrollLeft.value : state.scrollTop.value;
        const containerSize = horizontal ? state.containerWidth.value : state.containerHeight.value;

        if (getItemHeight) {
          // Dynamic heights - more complex calculation
          let accumulatedHeight = 0;
          let startIndex = 0;
          let endIndex = 0;

          // Find start index
          for (let i = 0; i < state.items.value.length; i++) {
            const height = state.itemHeights.get(i) || estimatedItemHeight;
            if (accumulatedHeight + height > scrollPos) {
              startIndex = Math.max(0, i - buffer);
              break;
            }
            accumulatedHeight += height;
          }

          // Find end index
          accumulatedHeight = 0;
          for (let i = startIndex; i < state.items.value.length; i++) {
            const height = state.itemHeights.get(i) || estimatedItemHeight;
            if (accumulatedHeight > containerSize + buffer * estimatedItemHeight) {
              endIndex = i;
              break;
            }
            accumulatedHeight += height;
          }

          if (endIndex === 0) {
            endIndex = state.items.value.length;
          }

          return {
            startIndex,
            endIndex: Math.min(endIndex + buffer, state.items.value.length),
            startOffset: calculateOffset(startIndex),
            endOffset: calculateOffset(endIndex),
          };
        } else {
          // Fixed heights - simple calculation
          const startIndex = Math.floor(scrollPos / itemHeight);
          const endIndex = Math.ceil((scrollPos + containerSize) / itemHeight);

          return {
            startIndex: Math.max(0, startIndex - buffer),
            endIndex: Math.min(endIndex + buffer, state.items.value.length),
            startOffset: startIndex * itemHeight,
            endOffset: 0,
          };
        }
      });

      // Calculate offset for dynamic heights
      function calculateOffset(index) {
        let offset = 0;
        for (let i = 0; i < index; i++) {
          offset += state.itemHeights.get(i) || estimatedItemHeight;
        }
        return offset;
      }

      // Get total size
      const totalSize = computed(() => {
        if (getItemHeight) {
          if (state.measuredHeight.value > 0) {
            return state.measuredHeight.value;
          }
          // Estimate based on measured items
          const measuredCount = state.itemHeights.size;
          if (measuredCount === 0) {
            return state.items.value.length * estimatedItemHeight;
          }

          let totalMeasured = 0;
          state.itemHeights.forEach((height) => (totalMeasured += height));
          const avgHeight = totalMeasured / measuredCount;

          return totalMeasured + (state.items.value.length - measuredCount) * avgHeight;
        } else {
          return state.items.value.length * itemHeight;
        }
      });

      // Visible items
      const visibleItems = computed(() => {
        const range = visibleRange.value;
        return state.items.value.slice(range.startIndex, range.endIndex);
      });

      // Handle scroll
      let scrollTimeout;
      function handleScroll(event) {
        const target = event.target;

        if (horizontal) {
          state.scrollLeft.value = target.scrollLeft;
        } else {
          state.scrollTop.value = target.scrollTop;
        }

        state.isScrolling.value = true;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          state.isScrolling.value = false;
        }, 150);

        if (onScroll) {
          onScroll(event, {
            scrollTop: target.scrollTop,
            scrollLeft: target.scrollLeft,
            visibleRange: visibleRange.value,
          });
        }
      }

      // Measure item height
      function measureItem(index, element) {
        if (!getItemHeight || !element) return;

        const height = horizontal ? element.offsetWidth : element.offsetHeight;
        const previousHeight = state.itemHeights.get(index);

        if (height !== previousHeight) {
          state.itemHeights.set(index, height);

          // Recalculate total height if all items measured
          if (state.itemHeights.size === state.items.value.length) {
            let total = 0;
            state.itemHeights.forEach((h) => (total += h));
            state.measuredHeight.value = total;
          }
        }
      }

      // Scroll to index
      function scrollToIndex(index, align = 'start') {
        const container = containerRef.value;
        if (!container) return;

        let offset = 0;

        if (getItemHeight) {
          offset = calculateOffset(index);
        } else {
          offset = index * itemHeight;
        }

        if (align === 'center') {
          const containerSize = horizontal
            ? state.containerWidth.value
            : state.containerHeight.value;
          const itemSize = state.itemHeights.get(index) || itemHeight;
          offset -= (containerSize - itemSize) / 2;
        } else if (align === 'end') {
          const containerSize = horizontal
            ? state.containerWidth.value
            : state.containerHeight.value;
          const itemSize = state.itemHeights.get(index) || itemHeight;
          offset -= containerSize - itemSize;
        }

        offset = Math.max(0, offset);

        if (horizontal) {
          container.scrollLeft = offset;
        } else {
          container.scrollTop = offset;
        }
      }

      // Update container size
      function updateContainerSize(width, height) {
        state.containerWidth.value = width;
        state.containerHeight.value = height;
      }

      // Container ref
      const containerRef = { value: null };

      // Component
      function VirtualScroller({ items, renderItem, className = '', style = {} }) {
        // Update items
        effect(() => {
          state.items.value = items || [];
        });

        const range = visibleRange.value;
        const visibles = visibleItems.value;

        const containerStyle = {
          height: `${state.containerHeight.value}px`,
          overflow: 'auto',
          position: 'relative',
          ...style,
        };

        const contentStyle = {
          [horizontal ? 'width' : 'height']: `${totalSize.value}px`,
          [horizontal ? 'height' : 'width']: '100%',
          position: 'relative',
        };

        const offsetStyle = {
          position: 'absolute',
          top: horizontal ? 0 : `${range.startOffset}px`,
          left: horizontal ? `${range.startOffset}px` : 0,
          right: 0,
          bottom: 0,
        };

        return html`
          <div
            class="virtual-scroller ${className}"
            style=${containerStyle}
            @scroll=${handleScroll}
            ref=${(el) => (containerRef.value = el)}
          >
            <div style=${contentStyle}>
              <div style=${offsetStyle}>
                ${visibles.map((item, idx) => {
                  const actualIndex = range.startIndex + idx;

                  return html`
                    <div
                      key=${item.id || actualIndex}
                      ref=${(el) => measureItem(actualIndex, el)}
                      data-index=${actualIndex}
                    >
                      ${renderItem(item, actualIndex)}
                    </div>
                  `;
                })}
              </div>
            </div>
          </div>
        `;
      }

      // API
      return {
        component: VirtualScroller,
        state,
        visibleRange,
        visibleItems,
        totalSize,
        scrollToIndex,
        updateContainerSize,
        refresh: () => {
          state.itemHeights.clear();
          state.measuredHeight.value = 0;
        },
      };
    }

    // Table virtual scroller
    function createVirtualTable(options = {}) {
      const {
        columns = [],
        rows = [],
        rowHeight = 40,
        headerHeight = 40,
        ...scrollerOptions
      } = options;

      const scroller = createVirtualScroller({
        items: rows,
        itemHeight: rowHeight,
        ...scrollerOptions,
      });

      function VirtualTable({ columns, rows, onRowClick, className = '' }) {
        return html`
          <div class="virtual-table ${className}">
            <div class="virtual-table-header" style="height: ${headerHeight}px">
              <table>
                <thead>
                  <tr>
                    ${columns.map(
                      (col) => html` <th style="width: ${col.width || 'auto'}">${col.label}</th> `
                    )}
                  </tr>
                </thead>
              </table>
            </div>

            <${scroller.component}
              items=${rows}
              renderItem=${(row, index) => html`
                <table>
                  <tbody>
                    <tr @click=${() => onRowClick?.(row, index)}>
                      ${columns.map(
                        (col) => html`
                          <td style="width: ${col.width || 'auto'}">
                            ${col.render ? col.render(row[col.key], row) : row[col.key]}
                          </td>
                        `
                      )}
                    </tr>
                  </tbody>
                </table>
              `}
              style=${{ height: `calc(100% - ${headerHeight}px)` }}
            />
          </div>
        `;
      }

      return {
        component: VirtualTable,
        scroller,
      };
    }

    // Grid virtual scroller
    function createVirtualGrid(options = {}) {
      const {
        items = [],
        columnCount = 3,
        itemWidth = 100,
        itemHeight = 100,
        gap = 10,
        ...scrollerOptions
      } = options;

      // Calculate row-based items
      const rows = computed(() => {
        const result = [];
        const itemsArray = Array.isArray(items) ? items : items.value || [];

        for (let i = 0; i < itemsArray.length; i += columnCount) {
          result.push(itemsArray.slice(i, i + columnCount));
        }

        return result;
      });

      const scroller = createVirtualScroller({
        items: rows.value,
        itemHeight: itemHeight + gap,
        ...scrollerOptions,
      });

      function VirtualGrid({ items, renderItem, className = '' }) {
        return html`
          <${scroller.component}
            items=${rows.value}
            renderItem=${(row, rowIndex) => html`
              <div style="display: flex; gap: ${gap}px">
                ${row.map((item, colIndex) => {
                  const index = rowIndex * columnCount + colIndex;

                  return html`
                    <div
                      key=${item.id || index}
                      style="width: ${itemWidth}px; height: ${itemHeight}px"
                    >
                      ${renderItem(item, index)}
                    </div>
                  `;
                })}
              </div>
            `}
            className=${className}
          />
        `;
      }

      return {
        component: VirtualGrid,
        scroller,
      };
    }

    // Register resize observer for auto-sizing
    if (typeof ResizeObserver !== 'undefined') {
      this.registerGlobalHook('virtualscroller:mount', (container, scroller) => {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          const { width, height } = entry.contentRect;
          scroller.updateContainerSize(width, height);
        });

        observer.observe(container);

        // Store observer for cleanup
        container._resizeObserver = observer;
      });

      this.registerGlobalHook('virtualscroller:unmount', (container) => {
        if (container._resizeObserver) {
          container._resizeObserver.disconnect();
          delete container._resizeObserver;
        }
      });
    }

    // Provide API
    this.provide('virtualScroller', {
      createVirtualScroller,
      createVirtualTable,
      createVirtualGrid,
    });

    // Global access
    app.virtualScroller = {
      create: createVirtualScroller,
      createTable: createVirtualTable,
      createGrid: createVirtualGrid,
    };
  },
});

// Standalone virtual scroller component
export function VirtualScroller(props) {
  const plugin = usePlugin('virtual-scroller');

  if (!plugin) {
    console.warn('VirtualScroller: Plugin not installed');
    return null;
  }

  const scroller = plugin.virtualScroller.createVirtualScroller(props);
  return scroller.component(props);
}
