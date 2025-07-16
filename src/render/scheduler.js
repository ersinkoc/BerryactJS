const RAF = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout;
const CAF = typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout;

let isScheduled = false;
const renderQueue = [];
const postRenderQueue = [];
let currentFrameTime = 0;
let frameDeadline = 0;

const FRAME_BUDGET = 5; // 5ms per frame

export function scheduleRender(component, priority = 'normal') {
  if (renderQueue.indexOf(component) === -1) {
    if (priority === 'high') {
      renderQueue.unshift(component);
    } else {
      renderQueue.push(component);
    }
  }

  if (!isScheduled) {
    isScheduled = true;
    RAF(flushWork);
  }
}

export function schedulePostRender(callback) {
  postRenderQueue.push(callback);
}

function flushWork(frameStart) {
  isScheduled = false;
  currentFrameTime = frameStart;
  frameDeadline = frameStart + FRAME_BUDGET;

  flushRenderQueue();
  flushPostRenderQueue();
}

function flushRenderQueue() {
  while (renderQueue.length > 0 && shouldYieldToMain()) {
    const component = renderQueue.shift();

    if (component && component.isMounted && component.shouldUpdate()) {
      try {
        component.update();
      } catch (error) {
        console.error('Error updating component:', error);
      }
    }
  }

  if (renderQueue.length > 0) {
    scheduleRender(renderQueue[0]);
  }
}

function flushPostRenderQueue() {
  const callbacks = postRenderQueue.slice();
  postRenderQueue.length = 0;

  callbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('Error in post-render callback:', error);
    }
  });
}

function shouldYieldToMain() {
  return performance.now() < frameDeadline;
}

export function flushSync(fn) {
  const wasScheduled = isScheduled;
  const originalQueue = renderQueue.slice();

  renderQueue.length = 0;
  isScheduled = false;

  try {
    const result = fn();

    while (renderQueue.length > 0) {
      const component = renderQueue.shift();
      if (component && component.isMounted) {
        component.update();
      }
    }

    return result;
  } finally {
    renderQueue.unshift(...originalQueue);
    isScheduled = wasScheduled;
  }
}

export function deferredUpdates(fn) {
  const updates = [];
  const originalSchedule = scheduleRender;

  window.scheduleRender = (component) => {
    updates.push(component);
  };

  try {
    fn();

    updates.forEach((component) => {
      if (component.isMounted) {
        component.update();
      }
    });
  } finally {
    window.scheduleRender = originalSchedule;
  }
}

export function unstable_batchedUpdates(fn) {
  return flushSync(fn);
}

export class Scheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.timeSlice = 5; // 5ms time slice
  }

  schedule(task, priority = 'normal') {
    const taskObject = {
      task,
      priority,
      id: Math.random().toString(36).substr(2, 9),
      startTime: performance.now(),
    };

    if (priority === 'immediate') {
      this.tasks.unshift(taskObject);
    } else if (priority === 'high') {
      const firstNormalIndex = this.tasks.findIndex((t) => t.priority === 'normal');
      if (firstNormalIndex === -1) {
        this.tasks.push(taskObject);
      } else {
        this.tasks.splice(firstNormalIndex, 0, taskObject);
      }
    } else {
      this.tasks.push(taskObject);
    }

    if (!this.isRunning) {
      this.flush();
    }

    return taskObject.id;
  }

  cancel(taskId) {
    const index = this.tasks.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      this.tasks.splice(index, 1);
    }
  }

  flush() {
    if (this.isRunning) return;

    this.isRunning = true;

    RAF(() => {
      const startTime = performance.now();

      while (this.tasks.length > 0 && performance.now() - startTime < this.timeSlice) {
        const taskObject = this.tasks.shift();

        try {
          taskObject.task();
        } catch (error) {
          console.error('Scheduler task error:', error);
        }
      }

      this.isRunning = false;

      if (this.tasks.length > 0) {
        this.flush();
      }
    });
  }
}

export const scheduler = new Scheduler();

// nextTick implementation
export function nextTick(callback) {
  return new Promise((resolve) => {
    schedulePostRender(() => {
      if (callback) callback();
      resolve();
    });
  });
}
