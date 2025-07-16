import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/berryact.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      isProd && terser()
    ].filter(Boolean)
  },
  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/berryact.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      isProd && terser()
    ].filter(Boolean)
  },
  // UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/berryact.umd.js',
      format: 'umd',
      name: 'Berryact',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      isProd && terser()
    ].filter(Boolean)
  }
];