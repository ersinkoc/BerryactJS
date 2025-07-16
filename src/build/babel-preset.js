// Babel Preset for Berryact
module.exports = function babelPresetBerryact(api, options = {}) {
  api.cache(true);

  const {
    development = process.env.NODE_ENV === 'development',
    importSource = '@oxog/berryact',
    compat = false,
    typescript = false,
    optimize = true
  } = options;

  const presets = [];
  const plugins = [];

  // Add TypeScript support if requested
  if (typescript) {
    presets.push(['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true
    }]);
  }

  // Configure JSX transformation
  presets.push(['@babel/preset-react', {
    runtime: 'automatic',
    importSource,
    development,
    // Use classic runtime for compatibility mode
    ...(compat && {
      runtime: 'classic',
      pragma: 'jsx',
      pragmaFrag: 'Fragment'
    })
  }]);

  // Transform for modern JavaScript
  presets.push(['@babel/preset-env', {
    modules: false,
    targets: {
      browsers: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 Edge versions'
      ]
    }
  }]);

  // Add Berryact-specific optimizations
  if (optimize) {
    plugins.push([require.resolve('./babel-plugin-optimize-berryact'), {
      importSource
    }]);
  }

  // Add React compatibility transformations
  if (compat) {
    plugins.push([require.resolve('./babel-plugin-react-compat'), {
      importSource
    }]);
  }

  // Development-specific plugins
  if (development) {
    // Add source maps and better error messages
    plugins.push([require.resolve('./babel-plugin-dev-expression'), {
      importSource
    }]);
  }

  // Common plugins
  plugins.push(
    // Class properties
    '@babel/plugin-proposal-class-properties',
    // Optional chaining
    '@babel/plugin-proposal-optional-chaining',
    // Nullish coalescing
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // Dynamic imports
    '@babel/plugin-syntax-dynamic-import'
  );

  return {
    presets,
    plugins
  };
};

// Re-export as named export for ES modules
export default module.exports;