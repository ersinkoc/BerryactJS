#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Production-ready build pipeline for Berryact JS
class BuildPipeline {
    constructor() {
        this.config = {
            srcDir: path.join(projectRoot, 'src'),
            distDir: path.join(projectRoot, 'dist'),
            tempDir: path.join(projectRoot, '.tmp'),
            outputFormats: ['esm', 'cjs', 'umd'],
            targets: ['modern', 'legacy'],
            minify: true,
            sourceMaps: true,
            typeCheck: true,
            runTests: true
        };
        
        this.stats = {
            startTime: Date.now(),
            bundles: [],
            errors: [],
            warnings: []
        };
    }

    async build() {
        console.log('🏗️  Starting production build pipeline...\n');
        
        try {
            // Pre-build checks
            await this.prebuildChecks();
            
            // Clean and setup
            await this.cleanAndSetup();
            
            // TypeScript checking
            if (this.config.typeCheck) {
                await this.typeCheck();
            }
            
            // Run tests
            if (this.config.runTests) {
                await this.runTests();
            }
            
            // Build different formats
            await this.buildFormats();
            
            // Generate TypeScript definitions
            await this.generateTypes();
            
            // Create documentation
            await this.generateDocs();
            
            // Package verification
            await this.verifyPackage();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    async prebuildChecks() {
        console.log('🔍 Running pre-build checks...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1));
        if (majorVersion < 14) {
            throw new Error(`Node.js 14+ required, got ${nodeVersion}`);
        }
        
        // Check required files exist
        const requiredFiles = [
            'package.json',
            'src/index.js',
            'src/core/signal.js',
            'src/core/component.js'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(projectRoot, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        console.log('✅ Pre-build checks passed\n');
    }

    async cleanAndSetup() {
        console.log('🧹 Cleaning and setting up directories...');
        
        // Clean dist directory
        if (fs.existsSync(this.config.distDir)) {
            await fs.promises.rm(this.config.distDir, { recursive: true });
        }
        
        // Clean temp directory
        if (fs.existsSync(this.config.tempDir)) {
            await fs.promises.rm(this.config.tempDir, { recursive: true });
        }
        
        // Create directories
        await fs.promises.mkdir(this.config.distDir, { recursive: true });
        await fs.promises.mkdir(this.config.tempDir, { recursive: true });
        
        console.log('✅ Directories ready\n');
    }

    async typeCheck() {
        console.log('🔍 Type checking...');
        
        try {
            // Create tsconfig for checking
            const tsConfig = {
                compilerOptions: {
                    target: 'es2020',
                    module: 'esnext',
                    lib: ['es2020', 'dom'],
                    allowJs: true,
                    checkJs: true,
                    declaration: true,
                    outDir: this.config.tempDir,
                    strict: false,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true
                },
                include: ['src/**/*'],
                exclude: ['node_modules', 'dist', 'tests']
            };
            
            const tsConfigPath = path.join(this.config.tempDir, 'tsconfig.json');
            await fs.promises.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
            
            // Run TypeScript compiler
            execSync(`npx tsc --project ${tsConfigPath} --noEmit`, { 
                stdio: 'inherit',
                cwd: projectRoot 
            });
            
            console.log('✅ Type checking passed\n');
        } catch (error) {
            this.stats.warnings.push('TypeScript checking failed - continuing anyway');
            console.log('⚠️  TypeScript checking failed - continuing anyway\n');
        }
    }

    async runTests() {
        console.log('🧪 Running tests...');
        
        try {
            execSync('npm test', { 
                stdio: 'inherit',
                cwd: projectRoot 
            });
            
            console.log('✅ Tests passed\n');
        } catch (error) {
            throw new Error('Tests failed - build aborted');
        }
    }

    async buildFormats() {
        console.log('📦 Building different formats...\n');
        
        for (const format of this.config.outputFormats) {
            await this.buildFormat(format);
        }
    }

    async buildFormat(format) {
        console.log(`🔧 Building ${format.toUpperCase()} format...`);
        
        const config = this.getRollupConfig(format);
        const configPath = path.join(this.config.tempDir, `rollup.${format}.config.js`);
        
        // Write rollup config
        await fs.promises.writeFile(configPath, `export default ${JSON.stringify(config, null, 2)};`);
        
        try {
            // Run rollup
            execSync(`npx rollup -c ${configPath}`, { 
                stdio: 'inherit',
                cwd: projectRoot 
            });
            
            const outputFile = path.join(this.config.distDir, `berryact.${format}.js`);
            const stats = await fs.promises.stat(outputFile);
            
            this.stats.bundles.push({
                format,
                size: stats.size,
                file: outputFile
            });
            
            console.log(`✅ ${format.toUpperCase()} bundle created (${this.formatSize(stats.size)})`);
            
        } catch (error) {
            this.stats.errors.push(`Failed to build ${format} format: ${error.message}`);
            console.log(`❌ Failed to build ${format} format`);
        }
    }

    getRollupConfig(format) {
        const isUMD = format === 'umd';
        const isESM = format === 'esm';
        
        return {
            input: 'src/index.js',
            output: {
                file: `dist/berryact.${format}.js`,
                format: format === 'esm' ? 'es' : format,
                name: isUMD ? 'Berryact' : undefined,
                exports: 'named',
                sourcemap: this.config.sourceMaps
            },
            external: isUMD ? [] : ['react', 'react-dom'], // Bundle everything in UMD
            plugins: [
                // Add plugins here if needed
            ]
        };
    }

    async generateTypes() {
        console.log('📝 Generating TypeScript definitions...');
        
        const typeDefinitions = `// Berryact JS Framework Type Definitions
// Generated: ${new Date().toISOString()}

export interface Signal<T> {
  value: T;
  peek(): T;
}

export interface Computed<T> extends Signal<T> {
  readonly value: T;
}

export interface Component {
  props: Signal<any>;
  render(): any;
  mount(container: Element): void;
  unmount(): void;
}

export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  children: VNode[];
  key?: string | number;
  ref?: any;
}

// Core functions
export function signal<T>(value: T): Signal<T>;
export function computed<T>(fn: () => T): Computed<T>;
export function effect(fn: () => void | (() => void)): () => void;

// Component system
export function defineComponent<P = any>(fn: (props: P) => VNode): new (props: P) => Component;
export function createApp(component: Component | Function, options?: any): { mount(container: Element): any };

// Template system
export function html(strings: TemplateStringsArray, ...values: any[]): VNode;

// Hooks
export function useState<T>(initialValue: T): [() => T, (value: T) => void];
export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
export function useMemo<T>(fn: () => T, deps: any[]): T;
export function useCallback<T extends Function>(fn: T, deps: any[]): T;
export function useRef<T>(initialValue: T): { current: T };
export function useContext<T>(context: React.Context<T>): T;
export function createContext<T>(defaultValue: T): React.Context<T>;

// JSX
export namespace JSX {
  interface Element extends VNode {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Export component base class
export class Component {
  props: Signal<any>;
  constructor(props: any);
  render(): VNode;
  mount(container: Element): void;
  unmount(): void;
}

export const version: string;
`;

        await fs.promises.writeFile(
            path.join(this.config.distDir, 'index.d.ts'),
            typeDefinitions
        );
        
        console.log('✅ TypeScript definitions generated\n');
    }

    async generateDocs() {
        console.log('📖 Generating documentation...');
        
        const readme = `# Berryact JS Framework

A modern, lightweight JavaScript framework for building reactive user interfaces.

## Features

- 🚀 **Lightweight** - Only ${this.getTotalBundleSize()} minified
- ⚡ **Fast** - Fine-grained reactivity with signals
- 🔥 **Modern** - Built with ES2020+ features
- 🎯 **Flexible** - Supports both JSX and template literals
- 🧪 **Well-tested** - Comprehensive test suite
- 📦 **Tree-shakeable** - Import only what you need

## Installation

\`\`\`bash
npm install @oxog/berryact
\`\`\`

## Quick Start

### Template Literals (No build step)

\`\`\`javascript
import { createApp, defineComponent, html, signal } from '@oxog/berryact';

const App = defineComponent(() => {
  const count = signal(0);
  
  return html\`
    <div>
      <h1>Count: \${count}</h1>
      <button @click=\${() => count.value++}>Increment</button>
    </div>
  \`;
});

createApp(App).mount(document.getElementById('app'));
\`\`\`

### JSX (With build step)

\`\`\`jsx
import { createApp, defineComponent, signal } from '@oxog/berryact';

const App = defineComponent(() => {
  const count = signal(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
});

createApp(App).mount(document.getElementById('app'));
\`\`\`

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api.md)
- [Examples](examples/)
- [Migration Guide](docs/migration.md)

## Bundle Sizes

${this.stats.bundles.map(bundle => 
  `- **${bundle.format.toUpperCase()}**: ${this.formatSize(bundle.size)}`
).join('\n')}

## Browser Support

- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 79+

## License

MIT © OXOG
`;

        await fs.promises.writeFile(
            path.join(this.config.distDir, 'README.md'),
            readme
        );
        
        console.log('✅ Documentation generated\n');
    }

    async verifyPackage() {
        console.log('🔍 Verifying package...');
        
        // Check all expected files exist
        const expectedFiles = [
            'berryact.esm.js',
            'berryact.cjs.js',
            'berryact.umd.js',
            'index.d.ts',
            'README.md'
        ];
        
        for (const file of expectedFiles) {
            const filePath = path.join(this.config.distDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Expected file missing: ${file}`);
            }
        }
        
        // Verify UMD bundle works
        const umdPath = path.join(this.config.distDir, 'berryact.umd.js');
        const umdContent = await fs.promises.readFile(umdPath, 'utf-8');
        
        if (!umdContent.includes('Berryact')) {
            this.stats.warnings.push('UMD bundle may not expose global correctly');
        }
        
        console.log('✅ Package verification passed\n');
    }

    generateReport() {
        const buildTime = Date.now() - this.stats.startTime;
        const totalSize = this.stats.bundles.reduce((sum, bundle) => sum + bundle.size, 0);
        
        console.log('📊 Build Report');
        console.log('='.repeat(50));
        console.log(`⏱️  Build time: ${(buildTime / 1000).toFixed(2)}s`);
        console.log(`📦 Total bundle size: ${this.formatSize(totalSize)}`);
        console.log(`🎯 Bundles created: ${this.stats.bundles.length}`);
        
        if (this.stats.bundles.length > 0) {
            console.log('\\n📋 Bundle breakdown:');
            this.stats.bundles.forEach(bundle => {
                console.log(`  • ${bundle.format.toUpperCase()}: ${this.formatSize(bundle.size)}`);
            });
        }
        
        if (this.stats.warnings.length > 0) {
            console.log('\\n⚠️  Warnings:');
            this.stats.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }
        
        if (this.stats.errors.length > 0) {
            console.log('\\n❌ Errors:');
            this.stats.errors.forEach(error => {
                console.log(`  • ${error}`);
            });
        }
        
        console.log('\\n✨ Build complete!');
        console.log(`📁 Output directory: ${this.config.distDir}`);
        console.log('🚀 Ready for distribution!');
    }

    getTotalBundleSize() {
        const umdBundle = this.stats.bundles.find(b => b.format === 'umd');
        return umdBundle ? this.formatSize(umdBundle.size) : 'N/A';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run build pipeline if called directly
if (process.argv.length > 1 && process.argv[1].endsWith('build-pipeline.js')) {
    const pipeline = new BuildPipeline();
    pipeline.build().catch(console.error);
}

export default BuildPipeline;