// Vite Plugin for Berryact
export default function berryactPlugin(options = {}) {
  const {
    jsxImportSource = '@oxog/berryact',
    include = /\.[jt]sx?$/,
    exclude = /node_modules/,
    compat = false,
    optimize = true
  } = options;

  return {
    name: 'vite-plugin-berryact',
    enforce: 'pre',

    config(config, { mode }) {
      // Configure esbuild for JSX transformation
      return {
        esbuild: {
          jsx: 'automatic',
          jsxImportSource,
          jsxFactory: 'jsx',
          jsxFragment: 'Fragment',
          jsxInject: compat 
            ? `import React from '${jsxImportSource}/compat'`
            : undefined
        },
        resolve: {
          alias: {
            ...config.resolve?.alias,
            // Add React compatibility aliases if enabled
            ...(compat ? {
              'react': `${jsxImportSource}/compat`,
              'react-dom': `${jsxImportSource}/compat`,
              'react/jsx-runtime': `${jsxImportSource}/jsx-runtime`,
              'react/jsx-dev-runtime': `${jsxImportSource}/jsx-dev-runtime`
            } : {})
          }
        },
        optimizeDeps: {
          include: [
            jsxImportSource,
            `${jsxImportSource}/jsx-runtime`,
            `${jsxImportSource}/jsx-dev-runtime`
          ],
          exclude: config.optimizeDeps?.exclude || []
        }
      };
    },

    transform(code, id) {
      // Skip if file doesn't match include pattern or matches exclude
      if (!include.test(id) || exclude.test(id)) {
        return null;
      }

      // Handle React imports in compatibility mode
      if (compat && code.includes('from "react"') || code.includes("from 'react'")) {
        code = code
          .replace(/from\s+["']react["']/g, `from '${jsxImportSource}/compat'`)
          .replace(/from\s+["']react-dom["']/g, `from '${jsxImportSource}/compat'`);
      }

      // Transform class components to use Berryact's Component
      if (code.includes('extends Component') || code.includes('extends React.Component')) {
        code = code.replace(
          /extends\s+(React\.)?Component/g,
          `extends Component`
        );
      }

      // Optimize template literals if requested
      if (optimize && code.includes('html`')) {
        code = optimizeTemplateLiterals(code);
      }

      return {
        code,
        map: null
      };
    },

    transformIndexHtml(html) {
      // Add Berryact detection meta tag
      return html.replace(
        '</head>',
        `  <meta name="generator" content="berryact-vite">\n</head>`
      );
    },

    handleHotUpdate({ file, server }) {
      // Optimize HMR for Berryact components
      if (include.test(file)) {
        server.ws.send({
          type: 'custom',
          event: 'berryact:update',
          data: { file }
        });
      }
    }
  };
}

// Helper function to optimize template literals
function optimizeTemplateLiterals(code) {
  // Simple optimization: hoist static template parts
  const staticTemplateRegex = /html`([^`]*)`/g;
  const staticTemplates = new Map();
  let templateIndex = 0;

  code = code.replace(staticTemplateRegex, (match, template) => {
    if (!template.includes('${')) {
      // This is a completely static template
      const varName = `__static_template_${templateIndex++}`;
      staticTemplates.set(varName, match);
      return varName;
    }
    return match;
  });

  // Add static template declarations at the top
  if (staticTemplates.size > 0) {
    const declarations = Array.from(staticTemplates.entries())
      .map(([varName, template]) => `const ${varName} = ${template};`)
      .join('\n');
    
    code = declarations + '\n\n' + code;
  }

  return code;
}

// Export additional utilities
export function createBerryactApp() {
  return {
    plugins: [berryactPlugin()],
    server: {
      port: 3000,
      open: true
    }
  };
}