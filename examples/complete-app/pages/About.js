import { html } from '../../../src/index.js';

export default function About() {
  return html`
    <div class="card">
      <h1>About Berryact Framework</h1>
      <p>
        This is a complete example of the Berryact framework showcasing all its advanced features
        in a real-world application.
      </p>
      
      <h2>Framework Features</h2>
      <ul>
        <li><strong>Plugin System</strong> - Modular architecture with multiple built-in plugins</li>
        <li><strong>Reactive Forms</strong> - Comprehensive form handling with validation</li>
        <li><strong>Advanced Routing</strong> - Page transitions, guards, and lazy loading</li>
        <li><strong>State Management</strong> - Centralized store with time-travel debugging</li>
        <li><strong>Internationalization</strong> - Multi-language support with reactive updates</li>
        <li><strong>Accessibility</strong> - Built-in a11y features and testing</li>
        <li><strong>Service Workers</strong> - Offline support and PWA capabilities</li>
        <li><strong>Suspense & Error Boundaries</strong> - Graceful async handling</li>
        <li><strong>Testing Utilities</strong> - Comprehensive testing helpers</li>
      </ul>
      
      <h2>Performance</h2>
      <p>
        The entire framework is optimized for performance:
      </p>
      <ul>
        <li>Core framework: ~5KB gzipped</li>
        <li>All features included: ~15KB gzipped</li>
        <li>Fine-grained reactivity for optimal updates</li>
        <li>Tree-shakable - only include what you use</li>
        <li>No virtual DOM overhead</li>
      </ul>
      
      <h2>Developer Experience</h2>
      <p>
        Berryact provides an excellent developer experience:
      </p>
      <ul>
        <li>No build step required (works with ES modules)</li>
        <li>Full TypeScript support</li>
        <li>Comprehensive DevTools</li>
        <li>Time-travel debugging</li>
        <li>Hot module replacement support</li>
        <li>Extensive documentation</li>
      </ul>
      
      <h2>Getting Started</h2>
      <pre class="code-block">
npm create @oxog/berryact my-app
cd my-app
npm install
npm run dev
      </pre>
      
      <p>
        Visit <a href="https://berryact.dev" target="_blank" rel="noopener">berryact.dev</a> 
        for full documentation and more examples.
      </p>
    </div>
  `;
}