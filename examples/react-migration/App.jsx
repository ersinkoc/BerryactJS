// React Migration Example - Step by step migration
import React, { useState, useEffect } from '@oxog/berryact/compat';

// Step 1: Original React Component (works as-is)
function ReactCounter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div className="counter">
      <h2>React-style Counter</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

// Step 2: Hybrid Component (React hooks + Berryact signals)
import { createSignal, createEffect } from '@oxog/berryact';

function HybridCounter() {
  // Using Berryact signals for better performance
  const [count, setCount] = createSignal(0);
  
  // But still using React-style syntax
  createEffect(() => {
    document.title = `Hybrid Count: ${count()}`;
  });
  
  return (
    <div className="counter">
      <h2>Hybrid Counter</h2>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}

// Step 3: Full Berryact Component (template literals)
import { html } from '@oxog/berryact';

function BerryactCounter() {
  const [count, setCount] = createSignal(0);
  
  createEffect(() => {
    document.title = `Berryact Count: ${count()}`;
  });
  
  return html`
    <div class="counter">
      <h2>Berryact Counter</h2>
      <p>Count: ${count()}</p>
      <button @click=${() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  `;
}

// Main App showing all three approaches
export default function MigrationDemo() {
  return (
    <div className="app">
      <h1>React to Berryact Migration Demo</h1>
      
      <section>
        <ReactCounter />
      </section>
      
      <section>
        <HybridCounter />
      </section>
      
      <section>
        <BerryactCounter />
      </section>
      
      <footer>
        <p>All three counters work identically, showing the migration path!</p>
      </footer>
    </div>
  );
}