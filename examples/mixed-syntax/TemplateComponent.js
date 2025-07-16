// Component using template literal syntax
import { html } from '@oxog/berryact';

export default function TemplateComponent({ items, onAdd }) {
  return html`
    <section class="template-section">
      <h2>Template Literal Section</h2>
      <button @click=${onAdd}>
        Add Template Item
      </button>
      <ul>
        ${items.map(item => html`
          <li key=${item.id}>${item.name}</li>
        `)}
      </ul>
    </section>
  `;
}