// Todo App using template literals (no build step required)
import { html, createSignal, createEffect } from '../../src/index.js';

export default function TodoApp() {
  const [todos, setTodos] = createSignal([]);
  const [input, setInput] = createSignal('');
  const [filter, setFilter] = createSignal('all');

  // Load todos from localStorage
  createEffect(() => {
    const saved = localStorage.getItem('berryact-todos-template');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  // Save todos to localStorage
  createEffect(() => {
    localStorage.setItem('berryact-todos-template', JSON.stringify(todos()));
  }, [todos]);

  const addTodo = () => {
    const text = input().trim();
    if (text) {
      setTodos([
        ...todos(),
        {
          id: Date.now(),
          text,
          done: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos().map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const deleteTodo = (id) => {
    setTodos(todos().filter((todo) => todo.id !== id));
  };

  const filteredTodos = () => {
    switch (filter()) {
      case 'active':
        return todos().filter((todo) => !todo.done);
      case 'completed':
        return todos().filter((todo) => todo.done);
      default:
        return todos();
    }
  };

  const stats = () => {
    const total = todos().length;
    const completed = todos().filter((t) => t.done).length;
    return { total, completed, active: total - completed };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTodo();
  };

  return html`
    <div class="todo-app">
      <header class="todo-header">
        <h1>Berryact Todo (Template)</h1>
        <p class="subtitle">Using template literals - no build step!</p>
      </header>

      <form class="todo-form" @submit=${handleSubmit}>
        <input
          type="text"
          class="todo-input"
          placeholder="What needs to be done?"
          value=${input()}
          @input=${(e) => setInput(e.target.value)}
          autofocus
        />
        <button type="submit" class="add-button">Add</button>
      </form>

      <div class="filters">
        <button
          class="filter-btn ${filter() === 'all' ? 'active' : ''}"
          @click=${() => setFilter('all')}
        >
          All (${stats().total})
        </button>
        <button
          class="filter-btn ${filter() === 'active' ? 'active' : ''}"
          @click=${() => setFilter('active')}
        >
          Active (${stats().active})
        </button>
        <button
          class="filter-btn ${filter() === 'completed' ? 'active' : ''}"
          @click=${() => setFilter('completed')}
        >
          Completed (${stats().completed})
        </button>
      </div>

      <ul class="todo-list">
        ${filteredTodos().map(
          (todo) => html`
            <li key=${todo.id} class="todo-item ${todo.done ? 'completed' : ''}">
              <input
                type="checkbox"
                class="todo-checkbox"
                checked=${todo.done}
                @change=${() => toggleTodo(todo.id)}
              />
              <span class="todo-text">${todo.text}</span>
              <button
                class="delete-btn"
                @click=${() => deleteTodo(todo.id)}
                aria-label="Delete todo"
              >
                ×
              </button>
            </li>
          `
        )}
      </ul>

      ${todos().length === 0 ? html` <p class="empty-state">No todos yet. Add one above!</p> ` : ''}
      ${todos().length > 0
        ? html`
            <footer class="todo-footer">
              <button
                class="clear-completed"
                @click=${() => setTodos(todos().filter((t) => !t.done))}
                disabled=${stats().completed === 0}
              >
                Clear completed
              </button>
            </footer>
          `
        : ''}
    </div>
  `;
}
