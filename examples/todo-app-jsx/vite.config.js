import { defineConfig } from 'vite';
import berryactPlugin from '../../src/build/vite-plugin.js';

export default defineConfig({
  plugins: [
    berryactPlugin({
      jsxImportSource: '@oxog/berryact',
      compat: false,
      optimize: true,
    }),
  ],

  server: {
    port: 3001,
    open: true,
  },

  resolve: {
    alias: {
      '@oxog/berryact': '../../src/index.js',
    },
  },
});
