/**
 * Build Optimization Plugin for Berryact
 * Provides build-time optimizations and analysis
 */

import { createPlugin } from '../core/plugin.js';
import { signal, computed } from '../core/signal-enhanced.js';

export const BuildOptimizerPlugin = createPlugin({
  name: 'build-optimizer',
  version: '1.0.0',
  
  setup(app, context) {
    const options = this.options || {};
    const {
      enableTreeShaking = true,
      enableMinification = true,
      enableCompression = true,
      enableBundleAnalysis = true,
      enableCodeSplitting = true,
      enablePreloading = true,
      enablePrefetching = true,
      chunkSizeWarning = 244 * 1024, // 244kb
      assetSizeWarning = 100 * 1024,  // 100kb
      reportPath = './build-report.html'
    } = options;

    // Build stats
    const buildStats = signal({
      totalSize: 0,
      gzipSize: 0,
      chunkCount: 0,
      assetCount: 0,
      moduleCount: 0,
      warnings: [],
      errors: [],
      buildTime: 0
    });

    // Optimization suggestions
    const suggestions = computed(() => {
      const stats = buildStats.value;
      const results = [];

      // Check bundle size
      if (stats.totalSize > 500 * 1024) {
        results.push({
          severity: 'warning',
          message: 'Bundle size exceeds 500KB. Consider code splitting.',
          suggestion: 'Use dynamic imports for large dependencies'
        });
      }

      // Check chunk count
      if (stats.chunkCount > 20) {
        results.push({
          severity: 'info',
          message: 'High number of chunks detected.',
          suggestion: 'Consider combining smaller chunks'
        });
      }

      // Check for large assets
      const largeAssets = stats.warnings.filter(w => w.type === 'asset-size');
      if (largeAssets.length > 0) {
        results.push({
          severity: 'warning',
          message: `${largeAssets.length} large assets detected.`,
          suggestion: 'Optimize images and use appropriate formats (WebP, AVIF)'
        });
      }

      return results;
    });

    // Rollup plugin for build optimization
    const rollupPlugin = {
      name: 'berryact-build-optimizer',

      // Analyze options
      options(options) {
        if (enableTreeShaking) {
          options.treeshake = {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false
          };
        }

        return options;
      },

      // Transform code
      transform(code, id) {
        // Remove development-only code
        if (process.env.NODE_ENV === 'production') {
          code = code.replace(/if\s*\(\s*process\.env\.NODE_ENV\s*!==?\s*['"]production['"]\s*\)\s*{[\s\S]*?}/g, '');
          code = code.replace(/console\.(log|debug|trace)\(.*?\);?/g, '');
        }

        // Remove unused imports
        if (enableTreeShaking) {
          // Simple unused import detection
          const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"]/g;
          const imports = new Set();
          
          let match;
          while ((match = importRegex.exec(code)) !== null) {
            const imported = match[1].split(',').map(s => s.trim());
            imported.forEach(imp => imports.add(imp.split(' as ')[0]));
          }

          // Check usage
          imports.forEach(imp => {
            const usageRegex = new RegExp(`\\b${imp}\\b`, 'g');
            const matches = code.match(usageRegex);
            if (!matches || matches.length <= 1) {
              console.warn(`Potentially unused import: ${imp} in ${id}`);
            }
          });
        }

        return { code, map: null };
      },

      // Generate bundle
      generateBundle(options, bundle) {
        const stats = {
          totalSize: 0,
          gzipSize: 0,
          chunkCount: 0,
          assetCount: 0,
          moduleCount: 0,
          warnings: [],
          errors: []
        };

        // Analyze bundle
        Object.entries(bundle).forEach(([fileName, chunk]) => {
          if (chunk.type === 'chunk') {
            stats.chunkCount++;
            stats.moduleCount += Object.keys(chunk.modules || {}).length;
            
            const size = chunk.code.length;
            stats.totalSize += size;

            // Check chunk size
            if (size > chunkSizeWarning) {
              stats.warnings.push({
                type: 'chunk-size',
                fileName,
                size,
                message: `Chunk "${fileName}" exceeds size limit (${(size / 1024).toFixed(2)}KB)`
              });
            }

            // Estimate gzip size
            stats.gzipSize += estimateGzipSize(chunk.code);
          } else if (chunk.type === 'asset') {
            stats.assetCount++;
            
            const size = chunk.source.length;
            if (size > assetSizeWarning) {
              stats.warnings.push({
                type: 'asset-size',
                fileName,
                size,
                message: `Asset "${fileName}" exceeds size limit (${(size / 1024).toFixed(2)}KB)`
              });
            }
          }
        });

        buildStats.value = stats;

        // Generate report
        if (enableBundleAnalysis) {
          this.emitFile({
            type: 'asset',
            fileName: reportPath,
            source: generateBuildReport(stats, bundle)
          });
        }
      }
    };

    // Webpack plugin for build optimization
    const webpackPlugin = {
      apply(compiler) {
        // Optimization configuration
        compiler.options.optimization = {
          ...compiler.options.optimization,
          usedExports: enableTreeShaking,
          sideEffects: false,
          minimize: enableMinification,
          splitChunks: enableCodeSplitting ? {
            chunks: 'all',
            minSize: 20000,
            minRemainingSize: 0,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            enforceSizeThreshold: 50000,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: true
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
              }
            }
          } : false
        };

        // Add compression plugin
        if (enableCompression) {
          const CompressionPlugin = require('compression-webpack-plugin');
          compiler.options.plugins.push(
            new CompressionPlugin({
              filename: '[path][base].gz',
              algorithm: 'gzip',
              test: /\.(js|css|html|svg)$/,
              threshold: 8192,
              minRatio: 0.8
            })
          );
        }

        // Bundle analyzer
        if (enableBundleAnalysis) {
          const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
          compiler.options.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: reportPath,
              openAnalyzer: false
            })
          );
        }

        // Performance hints
        compiler.options.performance = {
          hints: 'warning',
          maxEntrypointSize: chunkSizeWarning,
          maxAssetSize: assetSizeWarning
        };
      }
    };

    // Vite plugin for build optimization
    const vitePlugin = {
      name: 'berryact-build-optimizer',
      
      config(config, { mode }) {
        if (mode === 'production') {
          return {
            build: {
              target: 'es2020',
              minify: enableMinification ? 'terser' : false,
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.debug']
                }
              },
              rollupOptions: {
                output: {
                  manualChunks: enableCodeSplitting ? (id) => {
                    if (id.includes('node_modules')) {
                      return 'vendor';
                    }
                    if (id.includes('src/core')) {
                      return 'core';
                    }
                    if (id.includes('src/plugins')) {
                      return 'plugins';
                    }
                  } : undefined
                }
              },
              chunkSizeWarningLimit: chunkSizeWarning / 1024
            }
          };
        }
      },

      transformIndexHtml(html) {
        if (!enablePreloading && !enablePrefetching) {
          return html;
        }

        // Add resource hints
        const hints = [];
        
        if (enablePreloading) {
          hints.push(
            '<link rel="preload" href="/js/core.js" as="script">',
            '<link rel="preload" href="/css/app.css" as="style">'
          );
        }

        if (enablePrefetching) {
          hints.push(
            '<link rel="prefetch" href="/js/vendor.js">',
            '<link rel="dns-prefetch" href="https://api.example.com">'
          );
        }

        return html.replace('</head>', `${hints.join('\n')}\n</head>`);
      }
    };

    // Helper functions
    function estimateGzipSize(content) {
      // Rough estimation: gzip typically achieves 60-70% compression
      return Math.round(content.length * 0.3);
    }

    function generateBuildReport(stats, bundle) {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Berryact Build Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #007bff;
    }
    .metric-label {
      color: #666;
      font-size: 0.9em;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .suggestion {
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Berryact Build Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <div class="card">
      <h2>Build Statistics</h2>
      <div class="metric">
        <div class="metric-value">${(stats.totalSize / 1024).toFixed(2)}KB</div>
        <div class="metric-label">Total Size</div>
      </div>
      <div class="metric">
        <div class="metric-value">${(stats.gzipSize / 1024).toFixed(2)}KB</div>
        <div class="metric-label">Gzipped Size</div>
      </div>
      <div class="metric">
        <div class="metric-value">${stats.chunkCount}</div>
        <div class="metric-label">Chunks</div>
      </div>
      <div class="metric">
        <div class="metric-value">${stats.moduleCount}</div>
        <div class="metric-label">Modules</div>
      </div>
    </div>
    
    ${stats.warnings.length > 0 ? `
      <div class="card">
        <h2>Warnings</h2>
        ${stats.warnings.map(w => `
          <div class="warning">
            <strong>${w.type}:</strong> ${w.message}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="card">
      <h2>Bundle Contents</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Size</th>
            <th>Gzipped</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(bundle).map(([fileName, chunk]) => `
            <tr>
              <td>${fileName}</td>
              <td>${((chunk.code || chunk.source || '').length / 1024).toFixed(2)}KB</td>
              <td>${(estimateGzipSize(chunk.code || chunk.source || '') / 1024).toFixed(2)}KB</td>
              <td>${chunk.type}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="card">
      <h2>Optimization Suggestions</h2>
      ${suggestions.value.map(s => `
        <div class="suggestion">
          <strong>${s.severity}:</strong> ${s.message}<br>
          <em>${s.suggestion}</em>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
      
      return html;
    }

    // Public API
    const optimizer = {
      buildStats,
      suggestions,
      rollupPlugin,
      webpackPlugin,
      vitePlugin,
      
      // Manual optimization helpers
      analyzeBundle(bundle) {
        // Analyze bundle for optimization opportunities
        const analysis = {
          duplicates: findDuplicateModules(bundle),
          largeModules: findLargeModules(bundle),
          unusedExports: findUnusedExports(bundle)
        };
        
        return analysis;
      },
      
      optimizeChunks(chunks) {
        // Optimize chunk distribution
        return optimizeChunkGraph(chunks);
      }
    };

    // Helper functions for analysis
    function findDuplicateModules(bundle) {
      const modules = new Map();
      const duplicates = [];
      
      Object.values(bundle).forEach(chunk => {
        if (chunk.modules) {
          Object.entries(chunk.modules).forEach(([id, module]) => {
            if (modules.has(id)) {
              duplicates.push({
                id,
                chunks: [modules.get(id), chunk.fileName]
              });
            } else {
              modules.set(id, chunk.fileName);
            }
          });
        }
      });
      
      return duplicates;
    }

    function findLargeModules(bundle, threshold = 50 * 1024) {
      const largeModules = [];
      
      Object.values(bundle).forEach(chunk => {
        if (chunk.modules) {
          Object.entries(chunk.modules).forEach(([id, module]) => {
            if (module.code && module.code.length > threshold) {
              largeModules.push({
                id,
                size: module.code.length,
                chunk: chunk.fileName
              });
            }
          });
        }
      });
      
      return largeModules.sort((a, b) => b.size - a.size);
    }

    function findUnusedExports(bundle) {
      // Simplified unused export detection
      const exports = new Map();
      const imports = new Set();
      
      // Collect exports and imports
      Object.values(bundle).forEach(chunk => {
        if (chunk.code) {
          // Find exports
          const exportMatches = chunk.code.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
          for (const match of exportMatches) {
            exports.set(match[1], chunk.fileName);
          }
          
          // Find imports
          const importMatches = chunk.code.matchAll(/import\s+{([^}]+)}/g);
          for (const match of importMatches) {
            const imported = match[1].split(',').map(s => s.trim().split(' as ')[0]);
            imported.forEach(imp => imports.add(imp));
          }
        }
      });
      
      // Find unused exports
      const unused = [];
      exports.forEach((file, name) => {
        if (!imports.has(name)) {
          unused.push({ name, file });
        }
      });
      
      return unused;
    }

    function optimizeChunkGraph(chunks) {
      // Simple chunk optimization algorithm
      // This would be much more complex in a real implementation
      return chunks;
    }

    // Provide API
    this.provide('buildOptimizer', optimizer);
    
    // Global access
    app.buildOptimizer = optimizer;
  }
});