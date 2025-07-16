// Tree shaking utility for Berryact JS
// Removes unused exports and optimizes bundle size

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

export class TreeShaker {
  constructor(options = {}) {
    this.options = {
      entryPoints: ['index.js'],
      excludePatterns: [/\.test\.js$/, /\.spec\.js$/],
      preserveComments: false,
      minify: false,
      ...options,
    };

    this.usedExports = new Set();
    this.moduleGraph = new Map();
    this.deadCode = new Set();
  }

  async shake(srcDir) {
    console.log('🌳 Tree shaking Berryact JS...');

    // Build module graph
    await this.buildModuleGraph(srcDir);

    // Find used exports starting from entry points
    for (const entry of this.options.entryPoints) {
      await this.markUsedExports(entry);
    }

    // Remove unused exports
    const removedBytes = await this.removeUnusedCode(srcDir);

    console.log(`✅ Tree shaking complete! Removed ${removedBytes} bytes of unused code`);

    return {
      usedExports: this.usedExports.size,
      deadCode: this.deadCode.size,
      savedBytes: removedBytes,
    };
  }

  async buildModuleGraph(srcDir) {
    const files = await this.findJSFiles(srcDir);

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      const ast = this.parseFile(content);

      const moduleInfo = {
        path: file,
        exports: this.extractExports(ast),
        imports: this.extractImports(ast),
        ast: ast,
      };

      this.moduleGraph.set(file, moduleInfo);
    }
  }

  async findJSFiles(dir) {
    const files = [];
    const items = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        files.push(...(await this.findJSFiles(fullPath)));
      } else if (item.isFile() && item.name.endsWith('.js')) {
        if (!this.options.excludePatterns.some((pattern) => pattern.test(fullPath))) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  parseFile(content) {
    try {
      return parse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining',
        ],
      });
    } catch (error) {
      console.warn(`Warning: Could not parse file: ${error.message}`);
      return null;
    }
  }

  extractExports(ast) {
    const exports = new Set();

    if (!ast) return exports;

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          // export const foo = ...
          if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach((decl) => {
              if (decl.id.type === 'Identifier') {
                exports.add(decl.id.name);
              }
            });
          }
          // export function foo() {}
          else if (path.node.declaration.type === 'FunctionDeclaration') {
            exports.add(path.node.declaration.id.name);
          }
          // export class Foo {}
          else if (path.node.declaration.type === 'ClassDeclaration') {
            exports.add(path.node.declaration.id.name);
          }
        }

        // export { foo, bar }
        if (path.node.specifiers) {
          path.node.specifiers.forEach((spec) => {
            if (spec.type === 'ExportSpecifier') {
              exports.add(spec.exported.name);
            }
          });
        }
      },

      ExportDefaultDeclaration(path) {
        exports.add('default');
      },
    });

    return exports;
  }

  extractImports(ast) {
    const imports = new Map();

    if (!ast) return imports;

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const imported = new Set();

        path.node.specifiers.forEach((spec) => {
          if (spec.type === 'ImportDefaultSpecifier') {
            imported.add('default');
          } else if (spec.type === 'ImportSpecifier') {
            imported.add(spec.imported.name);
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            imported.add('*');
          }
        });

        imports.set(source, imported);
      },
    });

    return imports;
  }

  async markUsedExports(entryPoint) {
    const module = this.moduleGraph.get(entryPoint);
    if (!module) return;

    // Mark all exports from entry point as used
    module.exports.forEach((exp) => {
      this.usedExports.add(`${entryPoint}:${exp}`);
    });

    // Follow imports
    for (const [importPath, importedNames] of module.imports) {
      const resolvedPath = this.resolveImport(importPath, entryPoint);
      if (resolvedPath) {
        importedNames.forEach((name) => {
          this.usedExports.add(`${resolvedPath}:${name}`);
        });

        // Recursively mark imports
        await this.markUsedExports(resolvedPath);
      }
    }
  }

  resolveImport(importPath, currentFile) {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolved = path.resolve(path.dirname(currentFile), importPath);

      // Try with .js extension
      if (this.moduleGraph.has(resolved + '.js')) {
        return resolved + '.js';
      }

      // Try as-is
      if (this.moduleGraph.has(resolved)) {
        return resolved;
      }
    }

    // Handle absolute imports within the project
    for (const modulePath of this.moduleGraph.keys()) {
      if (modulePath.includes(importPath)) {
        return modulePath;
      }
    }

    return null;
  }

  async removeUnusedCode(srcDir) {
    let removedBytes = 0;

    for (const [filePath, module] of this.moduleGraph) {
      const originalContent = await fs.promises.readFile(filePath, 'utf-8');
      const optimizedAst = this.removeUnusedExports(module.ast, filePath);

      if (optimizedAst) {
        const optimizedContent = generate(optimizedAst, {
          comments: this.options.preserveComments,
          compact: this.options.minify,
          minified: this.options.minify,
        }).code;

        if (optimizedContent !== originalContent) {
          await fs.promises.writeFile(filePath, optimizedContent);
          removedBytes += originalContent.length - optimizedContent.length;
        }
      }
    }

    return removedBytes;
  }

  removeUnusedExports(ast, filePath) {
    if (!ast) return null;

    const nodesToRemove = [];

    traverse(ast, {
      ExportNamedDeclaration(path) {
        const exportNames = new Set();

        // Collect export names from this declaration
        if (path.node.declaration) {
          if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach((decl) => {
              if (decl.id.type === 'Identifier') {
                exportNames.add(decl.id.name);
              }
            });
          } else if (path.node.declaration.type === 'FunctionDeclaration') {
            exportNames.add(path.node.declaration.id.name);
          } else if (path.node.declaration.type === 'ClassDeclaration') {
            exportNames.add(path.node.declaration.id.name);
          }
        }

        if (path.node.specifiers) {
          path.node.specifiers.forEach((spec) => {
            if (spec.type === 'ExportSpecifier') {
              exportNames.add(spec.exported.name);
            }
          });
        }

        // Check if any export is used
        const hasUsedExport = Array.from(exportNames).some((name) =>
          this.usedExports.has(`${filePath}:${name}`)
        );

        if (!hasUsedExport && exportNames.size > 0) {
          nodesToRemove.push(path);
          exportNames.forEach((name) => {
            this.deadCode.add(`${filePath}:${name}`);
          });
        }
      },

      ExportDefaultDeclaration(path) {
        if (!this.usedExports.has(`${filePath}:default`)) {
          nodesToRemove.push(path);
          this.deadCode.add(`${filePath}:default`);
        }
      },
    });

    // Remove unused nodes
    nodesToRemove.forEach((path) => {
      path.remove();
    });

    return ast;
  }

  // Static method for easy integration
  static async optimize(srcDir, options = {}) {
    const shaker = new TreeShaker(options);
    return await shaker.shake(srcDir);
  }
}

// Export for use in build tools
export default TreeShaker;
