const scheduleUpdate = (() => {
  if (typeof requestIdleCallback !== 'undefined') {
    return (callback) => requestIdleCallback(callback, { timeout: 5 });
  } else if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    const port1 = channel.port1;
    const port2 = channel.port2;
    const callbacks = [];

    port2.onmessage = () => {
      const cbs = callbacks.splice(0);
      cbs.forEach((cb) => cb());
    };

    return (callback) => {
      callbacks.push(callback);
      port1.postMessage(null);
    };
  } else {
    return (callback) => setTimeout(callback, 0);
  }
})();

let isScheduled = false;
const updateQueue = [];

export function scheduleComponentUpdate(component) {
  if (updateQueue.indexOf(component) === -1) {
    updateQueue.push(component);
  }

  if (!isScheduled) {
    isScheduled = true;
    scheduleUpdate(flushUpdates);
  }
}

function flushUpdates() {
  isScheduled = false;
  const queue = updateQueue.slice();
  updateQueue.length = 0;

  queue.forEach((component) => {
    if (component.isMounted && component.shouldUpdate()) {
      component.update();
    }
  });
}

export function nextTick(callback) {
  return new Promise((resolve) => {
    scheduleUpdate(() => {
      if (callback) callback();
      resolve();
    });
  });
}
