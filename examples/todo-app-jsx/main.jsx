// Entry point for JSX example
import { createApp } from '@oxog/berryact';
import TodoApp from './App.jsx';

// Create and mount the app
const app = createApp(TodoApp);
app.mount('#root');

// Enable hot module replacement (if using Vite)
if (import.meta.hot) {
  import.meta.hot.accept();
}