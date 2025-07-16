
                import { defineComponent, html, createApp } from './src/index.js';
                const App = defineComponent(() => html`<div>Hello World</div>`);
                const app = createApp(App);
                console.log('RESULT:', !!app.mount);
            