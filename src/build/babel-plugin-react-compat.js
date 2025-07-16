// Babel Plugin for React compatibility transformations
module.exports = function babelPluginReactCompat({ types: t }) {
  return {
    name: 'babel-plugin-react-compat',
    visitor: {
      // Transform React imports
      ImportDeclaration(path, state) {
        const importSource = state.opts.importSource || '@oxog/berryact';
        
        if (path.node.source.value === 'react') {
          path.node.source.value = `${importSource}/compat`;
        } else if (path.node.source.value === 'react-dom') {
          path.node.source.value = `${importSource}/compat`;
        } else if (path.node.source.value === 'react/jsx-runtime') {
          path.node.source.value = `${importSource}/jsx-runtime`;
        } else if (path.node.source.value === 'react/jsx-dev-runtime') {
          path.node.source.value = `${importSource}/jsx-dev-runtime`;
        }
      },

      // Transform React.createElement calls
      CallExpression(path) {
        if (path.node.callee.type === 'MemberExpression' &&
            path.node.callee.object.name === 'React' &&
            path.node.callee.property.name === 'createElement') {
          // Replace with jsx function
          path.node.callee = t.identifier('jsx');
        }
      },

      // Transform class components
      ClassDeclaration(path) {
        const superClass = path.node.superClass;
        
        if (superClass) {
          // Transform React.Component
          if (superClass.type === 'MemberExpression' &&
              superClass.object.name === 'React' &&
              superClass.property.name === 'Component') {
            path.node.superClass = t.identifier('Component');
          }
          // Transform React.PureComponent
          else if (superClass.type === 'MemberExpression' &&
                   superClass.object.name === 'React' &&
                   superClass.property.name === 'PureComponent') {
            path.node.superClass = t.identifier('PureComponent');
          }
        }
      },

      // Transform prop types
      AssignmentExpression(path) {
        if (path.node.left.type === 'MemberExpression' &&
            path.node.left.property.name === 'propTypes') {
          // Remove propTypes in production
          if (process.env.NODE_ENV === 'production') {
            path.remove();
          }
        }
      },

      // Transform default props
      MemberExpression(path) {
        if (path.node.property.name === 'defaultProps' &&
            path.parent.type === 'AssignmentExpression') {
          const componentName = path.node.object.name;
          const defaultProps = path.parent.right;
          
          // Convert to default parameters in function component
          const binding = path.scope.getBinding(componentName);
          if (binding && binding.path.isFunctionDeclaration()) {
            const func = binding.path.node;
            if (func.params.length > 0 && func.params[0].type === 'Identifier') {
              // Add default values to destructured props
              const propsParam = func.params[0];
              const defaultPropsObj = t.objectPattern(
                defaultProps.properties.map(prop => 
                  t.objectProperty(
                    prop.key,
                    propsParam,
                    false,
                    true
                  )
                )
              );
              
              func.params[0] = t.assignmentPattern(propsParam, defaultPropsObj);
              path.parent.remove();
            }
          }
        }
      }
    }
  };
};