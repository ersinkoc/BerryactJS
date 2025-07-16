import { defineConfig } from 'vite';
import berryactPlugin from './src/build/vite-plugin.js';

export default defineConfig({
  plugins: [
    berryactPlugin({
      jsxImportSource: '@oxog/berryact',
      compat: false, // Set to true for React compatibility mode
      optimize: true
    })
  ],
  
  server: {
    port: 3000,
    open: true
  },
  
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'Berryact',
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': './src'
    }
  },
  
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js']
  }
});