// Webpack Plugin for Berryact
export class BerryactWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      jsxImportSource: '@oxog/berryact',
      compat: false,
      optimize: true,
      ...options
    };
  }

  apply(compiler) {
    const { jsxImportSource, compat } = this.options;

    // Configure module resolution
    compiler.options.resolve = compiler.options.resolve || {};
    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      // Add React compatibility aliases if enabled
      ...(compat ? {
        'react': `${jsxImportSource}/compat`,
        'react-dom': `${jsxImportSource}/compat`,
        'react/jsx-runtime': `${jsxImportSource}/jsx-runtime`,
        'react/jsx-dev-runtime': `${jsxImportSource}/jsx-dev-runtime`
      } : {})
    };

    // Add Berryact loader
    compiler.options.module = compiler.options.module || {};
    compiler.options.module.rules = compiler.options.module.rules || [];
    
    // Insert Berryact loader before babel-loader
    const jsRule = {
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('./webpack-loader.js'),
          options: this.options
        }
      ]
    };

    compiler.options.module.rules.unshift(jsRule);

    // Add optimization plugin
    if (this.options.optimize) {
      const { DefinePlugin } = compiler.webpack || require('webpack');
      
      new DefinePlugin({
        'process.env.BERRYACT_VERSION': JSON.stringify(require('../../package.json').version)
      }).apply(compiler);
    }

    // Hook into compilation for additional optimizations
    compiler.hooks.compilation.tap('BerryactWebpackPlugin', (compilation) => {
      // Optimize Berryact runtime chunks
      compilation.hooks.optimizeChunks.tap('BerryactWebpackPlugin', (chunks) => {
        // Group Berryact modules together
        const berryactChunk = Array.from(chunks).find(chunk => 
          Array.from(chunk.modulesIterable).some(module => 
            module.resource && module.resource.includes(jsxImportSource)
          )
        );

        if (berryactChunk) {
          berryactChunk.name = 'berryact-runtime';
        }
      });
    });

    // Add HTML plugin integration if present
    compiler.hooks.compilation.tap('BerryactWebpackPlugin', (compilation) => {
      const HtmlWebpackPlugin = compiler.options.plugins?.find(
        p => p.constructor.name === 'HtmlWebpackPlugin'
      );

      if (HtmlWebpackPlugin) {
        HtmlWebpackPlugin.constructor.getHooks(compilation).alterAssetTags.tapAsync(
          'BerryactWebpackPlugin',
          (data, cb) => {
            // Add Berryact meta tag
            data.assetTags.meta.push({
              tagName: 'meta',
              voidTag: true,
              attributes: {
                name: 'generator',
                content: 'berryact-webpack'
              }
            });
            cb(null, data);
          }
        );
      }
    });
  }
}

// Webpack loader for Berryact
export function berryactLoader(source) {
  const options = this.getOptions() || {};
  const { jsxImportSource = '@oxog/berryact', compat = false } = options;

  // Transform React imports if in compatibility mode
  if (compat) {
    source = source
      .replace(/from\s+["']react["']/g, `from '${jsxImportSource}/compat'`)
      .replace(/from\s+["']react-dom["']/g, `from '${jsxImportSource}/compat'`)
      .replace(/require\(["']react["']\)/g, `require('${jsxImportSource}/compat')`)
      .replace(/require\(["']react-dom["']\)/g, `require('${jsxImportSource}/compat')`);
  }

  // Transform class components
  if (source.includes('extends Component') || source.includes('extends React.Component')) {
    source = source.replace(
      /extends\s+(React\.)?Component/g,
      `extends Component`
    );
  }

  return source;
}

// Webpack configuration helper
export function createBerryactWebpackConfig(options = {}) {
  const { mode = 'development', compat = false } = options;

  return {
    mode,
    entry: './src/index.js',
    output: {
      path: require('path').resolve(process.cwd(), 'dist'),
      filename: '[name].[contenthash].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-react', {
                  runtime: 'automatic',
                  importSource: '@oxog/berryact'
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new BerryactWebpackPlugin({ compat })
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.json']
    },
    devServer: {
      port: 3000,
      hot: true,
      open: true
    }
  };
}