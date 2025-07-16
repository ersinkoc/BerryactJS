// Example showing mixed JSX and template literal syntax
import { html, createSignal } from '@oxog/berryact';
import TemplateComponent from './TemplateComponent.js';

// JSX Component
function JSXHeader({ title, count }) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <p>Total items: {count}</p>
    </header>
  );
}

// Main App using JSX
export default function MixedApp() {
  const [items, setItems] = createSignal([
    { id: 1, name: 'JSX Component', type: 'jsx' },
    { id: 2, name: 'Template Component', type: 'template' }
  ]);

  const addItem = (type) => {
    setItems([...items(), {
      id: Date.now(),
      name: `New ${type} item`,
      type
    }]);
  };

  return (
    <div className="mixed-app">
      <JSXHeader title="Mixed Syntax Demo" count={items().length} />
      
      <div className="content">
        <section className="jsx-section">
          <h2>JSX Section</h2>
          <button onClick={() => addItem('jsx')}>
            Add JSX Item
          </button>
          <ul>
            {items()
              .filter(item => item.type === 'jsx')
              .map(item => (
                <li key={item.id}>{item.name}</li>
              ))}
          </ul>
        </section>

        {/* Embedding template literal component in JSX */}
        <TemplateComponent 
          items={items().filter(item => item.type === 'template')}
          onAdd={() => addItem('template')}
        />
      </div>

      <footer className="footer">
        <p>This demo shows how JSX and template literals can work together!</p>
      </footer>
    </div>
  );
}