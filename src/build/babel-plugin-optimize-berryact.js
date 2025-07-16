// Babel Plugin to optimize Berryact code
module.exports = function babelPluginOptimizeBerryact({ types: t }) {
  return {
    name: 'babel-plugin-optimize-berryact',
    visitor: {
      // Optimize static template literals
      TaggedTemplateExpression(path, state) {
        if (path.node.tag.name === 'html') {
          const quasi = path.node.quasi;

          // Check if template is completely static
          if (quasi.expressions.length === 0) {
            // Hoist static template to module level
            const id = path.scope.generateUidIdentifier('staticTemplate');
            const declaration = t.variableDeclaration('const', [
              t.variableDeclarator(id, path.node),
            ]);

            // Find program node and add declaration
            const program = path.findParent((p) => p.isProgram());
            program.node.body.unshift(declaration);

            // Replace with identifier
            path.replaceWith(id);
          }
        }
      },

      // Optimize signal access patterns
      MemberExpression(path) {
        // Transform signal.value to signal() where beneficial
        if (path.node.property.name === 'value' && path.parent.type !== 'AssignmentExpression') {
          const binding = path.scope.getBinding(path.node.object.name);

          if (binding && binding.path.isVariableDeclarator()) {
            const init = binding.path.node.init;

            // Check if it's a signal
            if (
              init &&
              init.type === 'CallExpression' &&
              (init.callee.name === 'signal' || init.callee.name === 'useSignal')
            ) {
              // Replace with function call for better performance
              path.replaceWith(t.callExpression(path.node.object, []));
            }
          }
        }
      },

      // Optimize component definitions
      FunctionDeclaration(path) {
        const node = path.node;

        // Check if it's a component (starts with capital letter)
        if (node.id && /^[A-Z]/.test(node.id.name)) {
          // Add display name if not present
          const displayNameAssignment = t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.memberExpression(node.id, t.identifier('displayName')),
              t.stringLiteral(node.id.name)
            )
          );

          // Insert after function declaration
          path.insertAfter(displayNameAssignment);
        }
      },

      // Optimize JSX spreads
      JSXSpreadAttribute(path) {
        const argument = path.node.argument;

        // If spreading a simple object literal, convert to individual props
        if (argument.type === 'ObjectExpression' && argument.properties.length < 5) {
          const attributes = argument.properties
            .map((prop) => {
              if (prop.type === 'ObjectProperty' && !prop.computed) {
                return t.jsxAttribute(
                  t.jsxIdentifier(prop.key.name),
                  prop.value.type === 'Identifier'
                    ? t.jsxExpressionContainer(prop.value)
                    : prop.value
                );
              }
              return null;
            })
            .filter(Boolean);

          path.replaceWithMultiple(attributes);
        }
      },

      // Optimize conditional rendering
      ConditionalExpression(path) {
        // Optimize ternary operators that return JSX
        if (path.parent.type === 'JSXExpressionContainer') {
          const { test, consequent, alternate } = path.node;

          // If alternate is null/undefined, convert to && operator
          if (
            t.isNullLiteral(alternate) ||
            (t.isIdentifier(alternate) && alternate.name === 'undefined')
          ) {
            path.replaceWith(t.logicalExpression('&&', test, consequent));
          }
        }
      },
    },
  };
};
