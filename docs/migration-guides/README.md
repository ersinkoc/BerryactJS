# Migration Guides

This directory contains comprehensive guides for migrating existing applications to the Berryact framework.

## Available Guides

### [From React](./from-react.md)
Complete guide for migrating React applications to Berryact, covering:
- Component syntax differences
- State management patterns
- Event handling changes
- Routing migration
- Performance optimizations
- Common gotchas and solutions

### [From Vue](./from-vue.md)
Detailed guide for migrating Vue applications to Berryact, including:
- Template syntax conversion
- Reactivity system differences
- Lifecycle hook mapping
- Store migration patterns
- Directive alternatives
- Best practices

## Why Migrate to Berryact?

### Performance Benefits
- **Smaller bundle size**: 5KB vs 42KB (React) / 34KB (Vue)
- **Faster startup**: No virtual DOM overhead
- **Fine-grained reactivity**: Only update what actually changed
- **Better memory usage**: Direct DOM manipulation

### Developer Experience
- **No build step required**: Works directly in the browser
- **Modern JavaScript**: ES2020+ features throughout
- **TypeScript support**: Full type safety out of the box
- **Familiar patterns**: React-like hooks, Vue-like reactivity

### Architecture Benefits
- **Zero dependencies**: No external runtime dependencies
- **Tree-shakable**: Import only what you need
- **SSR ready**: Built-in server-side rendering support
- **Progressive enhancement**: Can be adopted incrementally

## Migration Strategy

### 1. Assessment Phase
- Audit your current application architecture
- Identify components with minimal dependencies
- Plan migration order (leaf components first)
- Set up development environment

### 2. Preparation Phase
- Set up Berryact in your project
- Configure build tools (remove JSX/template compilation)
- Create component mapping strategy
- Plan state management migration

### 3. Implementation Phase
- Start with simple, isolated components
- Migrate templates and basic functionality
- Update state management patterns
- Convert routing and navigation

### 4. Optimization Phase
- Leverage Berryact's fine-grained reactivity
- Optimize bundle splitting
- Implement performance monitoring
- Add SSR if needed

### 5. Testing & Validation
- Update test suites for new syntax
- Validate performance improvements
- Check accessibility compliance
- Ensure feature parity

## Before You Start

### Prerequisites
- Node.js 16+ for development tools
- Modern browser supporting ES2020+
- Basic understanding of JavaScript modules
- Familiarity with your current framework

### Tools & Setup
```bash
# Install Berryact
npm install @oxog/berryact

# Install development tools (optional)
npm install --save-dev @oxog/berryact-cli vite typescript

# Create project structure
npx @oxog/berryact-cli create my-migrated-app
```

### Project Structure
```
src/
  components/     # Migrated components
  store/         # State management
  router/        # Routing configuration
  utils/         # Helper functions
  styles/        # CSS files
  types/         # TypeScript definitions
tests/
  unit/          # Component tests
  integration/   # Feature tests
  e2e/          # End-to-end tests
docs/
  migration/     # Migration documentation
```

## Common Patterns

### State Management Migration
```javascript
// Before (React/Redux or Vue/Pinia)
const useStore = () => {
  const state = useSelector(s => s);
  const dispatch = useDispatch();
  return { state, dispatch };
};

// After (Berryact Store)
const store = createStore({
  state: { /* ... */ },
  mutations: { /* ... */ },
  actions: { /* ... */ }
});
```

### Component Patterns
```javascript
// Before (React JSX)
function Component({ prop }) {
  return <div className="card">{prop}</div>;
}

// After (Berryact)
function Component({ prop }) {
  return html`<div class="card">${prop}</div>`;
}
```

### Routing Migration
```javascript
// Before (React Router / Vue Router)
<Routes>
  <Route path="/users/:id" component={UserDetail} />
</Routes>

// After (Berryact Router)
const router = createRouter({
  routes: [
    { path: '/users/:id', component: UserDetail }
  ]
});
```

## Support and Resources

### Documentation
- [API Reference](../api/)
- [Component Guide](../components/)
- [Performance Guide](../performance/)
- [Testing Guide](../testing/)

### Examples
- [Real-world application](../../examples/real-world/)
- [Component library](../../examples/component-library/)
- [Performance benchmarks](../../examples/benchmarks/)

### Community
- [GitHub Issues](https://github.com/oxog/berryact/issues)
- [Discord Community](https://discord.gg/berryact)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/berryact-framework)

## Migration Checklist

### Planning
- [ ] Application architecture audit
- [ ] Dependencies analysis
- [ ] Migration timeline planning
- [ ] Team training schedule

### Setup
- [ ] Development environment configured
- [ ] Build tools updated
- [ ] Testing framework adapted
- [ ] CI/CD pipeline updated

### Implementation
- [ ] Core components migrated
- [ ] State management converted
- [ ] Routing system updated
- [ ] Styling approach finalized

### Testing
- [ ] Unit tests updated
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility validated

### Deployment
- [ ] Production build optimized
- [ ] Bundle size verified
- [ ] Performance monitoring added
- [ ] Rollback plan prepared

## Getting Help

If you encounter issues during migration:

1. **Check the guides**: Review the framework-specific migration guide
2. **Search issues**: Look through existing GitHub issues
3. **Ask the community**: Post questions on Discord or Stack Overflow
4. **Create an issue**: Report bugs or request features on GitHub

The Berryact team is committed to making migrations as smooth as possible. Don't hesitate to reach out for help!