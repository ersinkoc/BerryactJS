// Test setup file
// Note: jest-environment-jsdom is configured in jest.config.js

// Mock global objects
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);
global.requestIdleCallback = callback => setTimeout(() => callback({ timeRemaining: () => 5 }), 0);

// Mock performance API
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {}
};

// Mock MessageChannel
global.MessageChannel = class {
  constructor() {
    this.port1 = { postMessage: () => {} };
    this.port2 = { onmessage: null };
  }
};

// Console helpers for tests
global.suppressConsoleWarnings = () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  return () => { console.warn = originalWarn; };
};

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = '';
  // Clear any pending timers
  jest.clearAllTimers();
});