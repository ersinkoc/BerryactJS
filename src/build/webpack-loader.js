// Webpack Loader for Berryact
module.exports = function berryactLoader(source) {
  const options = this.getOptions() || {};
  const { jsxImportSource = '@oxog/berryact', compat = false, optimize = true } = options;

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

  // Optimize template literals
  if (optimize && source.includes('html`')) {
    source = optimizeTemplateLiterals(source);
  }

  return source;
};

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