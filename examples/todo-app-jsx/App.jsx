// Todo App using JSX syntax (requires build step)
import { createSignal, createEffect } from '@oxog/berryact';

export default function TodoApp() {
  const [todos, setTodos] = createSignal([]);
  const [input, setInput] = createSignal('');
  const [filter, setFilter] = createSignal('all');

  // Load todos from localStorage
  createEffect(() => {
    const saved = localStorage.getItem('berryact-todos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);

  // Save todos to localStorage
  createEffect(() => {
    localStorage.setItem('berryact-todos', JSON.stringify(todos()));
  }, [todos]);

  const addTodo = () => {
    const text = input().trim();
    if (text) {
      setTodos([...todos(), {
        id: Date.now(),
        text,
        done: false,
        createdAt: new Date().toISOString()
      }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos().map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos().filter(todo => todo.id !== id));
  };

  const filteredTodos = () => {
    switch (filter()) {
      case 'active':
        return todos().filter(todo => !todo.done);
      case 'completed':
        return todos().filter(todo => todo.done);
      default:
        return todos();
    }
  };

  const stats = () => {
    const total = todos().length;
    const completed = todos().filter(t => t.done).length;
    return { total, completed, active: total - completed };
  };

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Berryact Todo (JSX)</h1>
        <p className="subtitle">Using JSX syntax with build step</p>
      </header>

      <form className="todo-form" onSubmit={(e) => {
        e.preventDefault();
        addTodo();
      }}>
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={input()}
          onInput={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="add-button">
          Add
        </button>
      </form>

      <div className="filters">
        <button
          className={`filter-btn ${filter() === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats().total})
        </button>
        <button
          className={`filter-btn ${filter() === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({stats().active})
        </button>
        <button
          className={`filter-btn ${filter() === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({stats().completed})
        </button>
      </div>

      <ul className="todo-list">
        {filteredTodos().map(todo => (
          <li key={todo.id} className={`todo-item ${todo.done ? 'completed' : ''}`}>
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className="todo-text">{todo.text}</span>
            <button
              className="delete-btn"
              onClick={() => deleteTodo(todo.id)}
              aria-label="Delete todo"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {todos().length === 0 && (
        <p className="empty-state">No todos yet. Add one above!</p>
      )}

      {todos().length > 0 && (
        <footer className="todo-footer">
          <button
            className="clear-completed"
            onClick={() => setTodos(todos().filter(t => !t.done))}
            disabled={stats().completed === 0}
          >
            Clear completed
          </button>
        </footer>
      )}
    </div>
  );
}