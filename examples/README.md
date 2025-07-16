# Berryact JS Framework Examples

This directory contains practical examples demonstrating the capabilities of the Berryact JS Framework.

## 🛍️ E-commerce Example

**Location**: `/examples/e-commerce/index.html`

A fully functional e-commerce demo featuring:

- **Product Catalog** with search and filtering
- **Shopping Cart** with quantity management
- **Reactive State Management** for cart items and product filtering
- **Component-based Architecture** with reusable components
- **Template Literals** (no build step required)
- **Event Handling** with the `@click` syntax
- **Computed Properties** for derived state
- **Responsive Design** with mobile-friendly layout

### Key Features Demonstrated:
- Fine-grained reactivity with signals
- Component composition and props passing
- Event handling and user interactions
- State management across multiple components
- Template literals with embedded expressions
- Conditional rendering and list rendering

### How to Run:
1. Open the HTML file in a web browser
2. No build step required - works directly in the browser
3. Try searching for products, adding items to cart, and managing quantities

## 📊 Dashboard Example

**Location**: `/examples/dashboard/index.html`

A comprehensive admin dashboard showcasing:

- **Multi-page Navigation** with client-side routing
- **Data Visualization** with interactive charts
- **User Management** with search and filtering
- **Real-time Updates** with refresh functionality
- **Responsive Layout** with sidebar navigation
- **Loading States** and user feedback
- **Complex State Management** with multiple data sources

### Key Features Demonstrated:
- Advanced component composition
- Computed properties for data transformation
- Complex state management patterns
- Dynamic component rendering
- Interactive data visualization
- Responsive design patterns
- Mock data generation and manipulation

### How to Run:
1. Open the HTML file in a web browser
2. Navigate between different sections using the sidebar
3. Try searching users, changing chart periods, and refreshing data

## 🚀 Framework Features Showcased

Both examples demonstrate key Berryact JS features:

### ✨ **Dual Syntax Support**
- Both examples use **template literals** (no build step)
- Easy migration path from other frameworks
- JSX-like syntax with `html` tagged templates

### ⚡ **Fine-grained Reactivity**
- Signal-based reactivity system
- Automatic dependency tracking
- Efficient DOM updates

### 🧩 **Component System**
- Reusable components with props
- Component composition patterns
- Lifecycle management

### 🎯 **Event Handling**
- `@click`, `@input`, `@change` syntax
- Event delegation
- Synthetic event system

### 📊 **State Management**
- Reactive signals
- Computed properties
- Global state patterns

### 🔄 **Template Features**
- Conditional rendering with `${condition ? html\`...\` : ''}`
- List rendering with `array.map()`
- Component interpolation with `<${Component} />`
- Event binding with `@event=${handler}`

## 🛠️ Development Tips

### Component Definition
```javascript
const MyComponent = defineComponent((props) => {
    return html`<div>${props.message}</div>`;
});
```

### State Management
```javascript
const count = signal(0);
const doubled = computed(() => count.value * 2);
```

### Event Handling
```javascript
html`<button @click=${() => count.value++}>Click me</button>`
```

### Conditional Rendering
```javascript
html`${showMessage ? html`<div>Hello!</div>` : ''}`
```

### List Rendering
```javascript
html`${items.map(item => html`<li key=${item.id}>${item.name}</li>`)}`
```

### Component Usage
```javascript
html`<${MyComponent} message="Hello World" />`
```

## 📱 Browser Support

These examples work in all modern browsers that support:
- ES6 modules
- Template literals
- Proxy objects
- Modern JavaScript features

## 🎨 Styling

Both examples use vanilla CSS for simplicity, but you can easily integrate:
- CSS frameworks (Bootstrap, Tailwind)
- CSS-in-JS libraries
- Styled components
- CSS modules

## 🔧 Extending Examples

You can extend these examples by:
1. Adding new components
2. Implementing additional features
3. Integrating with APIs
4. Adding routing
5. Implementing forms
6. Adding animations

## 📚 Learning Resources

- Check the main `/src` directory for framework source code
- Review `/tests` for comprehensive test examples
- Explore component patterns in these examples
- Study the reactivity system implementation

## 🤝 Contributing

Feel free to:
- Add new examples
- Improve existing examples
- Fix bugs or issues
- Enhance documentation
- Suggest new features

These examples demonstrate that Berryact JS is a powerful, modern framework suitable for building complex, interactive web applications with minimal setup and excellent developer experience.