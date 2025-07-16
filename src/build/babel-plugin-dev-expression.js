// Babel Plugin for development mode enhancements
module.exports = function babelPluginDevExpression({ types: t }) {
  return {
    name: 'babel-plugin-dev-expression',
    visitor: {
      // Add component names for better debugging
      FunctionDeclaration(path) {
        if (/^[A-Z]/.test(path.node.id.name)) {
          addComponentDebugInfo(path, path.node.id.name, t);
        }
      },

      FunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator' && 
            path.parent.id.type === 'Identifier' &&
            /^[A-Z]/.test(path.parent.id.name)) {
          addComponentDebugInfo(path, path.parent.id.name, t);
        }
      },

      ArrowFunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator' && 
            path.parent.id.type === 'Identifier' &&
            /^[A-Z]/.test(path.parent.id.name)) {
          addComponentDebugInfo(path, path.parent.id.name, t);
        }
      },

      // Add source information to JSX elements
      JSXElement(path, state) {
        if (!state.file.opts.filename) return;

        const openingElement = path.node.openingElement;
        const location = path.node.loc;
        
        if (location && !hasSourceAttribute(openingElement)) {
          const sourceAttr = t.jsxAttribute(
            t.jsxIdentifier('data-source'),
            t.stringLiteral(`${state.file.opts.filename}:${location.start.line}:${location.start.column}`)
          );
          
          openingElement.attributes.push(sourceAttr);
        }
      },

      // Enhance error boundaries
      CallExpression(path) {
        if (path.node.callee.name === 'ErrorBoundary') {
          const props = path.node.arguments[0];
          
          if (props && props.type === 'ObjectExpression') {
            // Add development info
            props.properties.push(
              t.objectProperty(
                t.identifier('__DEV__'),
                t.booleanLiteral(true)
              )
            );
          }
        }
      },

      // Add debug assertions
      Identifier(path) {
        if (path.node.name === '__DEV__' && path.isReferencedIdentifier()) {
          path.replaceWith(
            t.booleanLiteral(process.env.NODE_ENV !== 'production')
          );
        }
      }
    }
  };
};

function addComponentDebugInfo(path, componentName, t) {
  const body = path.node.body;
  
  if (body.type === 'BlockStatement') {
    // Add debug name at the beginning of the function
    body.body.unshift(
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('console'),
            t.identifier('debug')
          ),
          [t.stringLiteral(`[Berryact] Rendering ${componentName}`)]
        )
      )
    );
  }
}

function hasSourceAttribute(openingElement) {
  return openingElement.attributes.some(attr => 
    attr.type === 'JSXAttribute' && 
    attr.name.name === 'data-source'
  );
}