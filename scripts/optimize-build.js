#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');

// Build optimization script for Berryact JS
class BuildOptimizer {
    constructor() {
        this.stats = {
            originalSize: 0,
            optimizedSize: 0,
            filesProcessed: 0,
            optimizations: []
        };
    }

    async optimize() {
        console.log('🚀 Starting Berryact JS build optimization...\n');

        // Clean dist directory
        await this.cleanDist();

        // Copy source files to dist
        await this.copySource();

        // Apply optimizations
        await this.applyOptimizations();

        // Generate bundle
        await this.generateBundle();

        // Report results
        this.generateReport();
    }

    async cleanDist() {
        console.log('🧹 Cleaning dist directory...');
        
        if (fs.existsSync(distDir)) {
            await fs.promises.rm(distDir, { recursive: true });
        }
        await fs.promises.mkdir(distDir, { recursive: true });
        
        console.log('✅ Dist directory cleaned\n');
    }

    async copySource() {
        console.log('📁 Copying source files...');
        
        await this.copyDirectory(srcDir, distDir);
        this.stats.originalSize = await this.calculateDirectorySize(distDir);
        
        console.log(`✅ Source files copied (${this.formatSize(this.stats.originalSize)})\n`);
    }

    async copyDirectory(src, dest) {
        await fs.promises.mkdir(dest, { recursive: true });
        const items = await fs.promises.readdir(src, { withFileTypes: true });

        for (const item of items) {
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);

            if (item.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }

    async applyOptimizations() {
        console.log('⚡ Applying optimizations...\n');

        await this.removeComments();
        await this.minifyCode();
        await this.removeUnusedImports();
        await this.optimizeExports();
        await this.bundleCore();
    }

    async removeComments() {
        console.log('💬 Removing comments...');
        
        const files = await this.findJSFiles(distDir);
        let removedBytes = 0;

        for (const file of files) {
            const originalContent = await fs.promises.readFile(file, 'utf-8');
            const optimizedContent = this.stripComments(originalContent);
            
            if (optimizedContent !== originalContent) {
                await fs.promises.writeFile(file, optimizedContent);
                removedBytes += originalContent.length - optimizedContent.length;
                this.stats.filesProcessed++;
            }
        }

        this.stats.optimizations.push({
            name: 'Comment removal',
            savedBytes: removedBytes,
            filesAffected: this.stats.filesProcessed
        });

        console.log(`✅ Comments removed (saved ${this.formatSize(removedBytes)})\n`);
    }

    stripComments(content) {
        // Remove single-line comments
        content = content.replace(/\/\/.*$/gm, '');
        
        // Remove multi-line comments (but preserve important ones)
        content = content.replace(/\/\*(?!\*\/|@|!)[\s\S]*?\*\//g, '');
        
        // Clean up extra whitespace
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return content.trim();
    }

    async minifyCode() {
        console.log('🗜️ Minifying code...');
        
        const files = await this.findJSFiles(distDir);
        let savedBytes = 0;

        for (const file of files) {
            const originalContent = await fs.promises.readFile(file, 'utf-8');
            const minifiedContent = this.minifyJS(originalContent);
            
            if (minifiedContent !== originalContent) {
                await fs.promises.writeFile(file, minifiedContent);
                savedBytes += originalContent.length - minifiedContent.length;
            }
        }

        this.stats.optimizations.push({
            name: 'Code minification',
            savedBytes: savedBytes,
            filesAffected: files.length
        });

        console.log(`✅ Code minified (saved ${this.formatSize(savedBytes)})\n`);
    }

    minifyJS(content) {
        // Simple minification (for a real project, use a proper minifier like Terser)
        return content
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around operators
            .replace(/\s*([{}();,=+\-*\/])\s*/g, '$1')
            // Remove whitespace around brackets
            .replace(/\s*\[\s*/g, '[')
            .replace(/\s*\]\s*/g, ']')
            // Clean up
            .trim();
    }

    async removeUnusedImports() {
        console.log('🔗 Removing unused imports...');
        
        const files = await this.findJSFiles(distDir);
        let removedImports = 0;

        for (const file of files) {
            const originalContent = await fs.promises.readFile(file, 'utf-8');
            const optimizedContent = this.removeUnusedImportsFromFile(originalContent);
            
            if (optimizedContent !== originalContent) {
                await fs.promises.writeFile(file, optimizedContent);
                removedImports++;
            }
        }

        console.log(`✅ Unused imports removed (${removedImports} files optimized)\n`);
    }

    removeUnusedImportsFromFile(content) {
        const lines = content.split('\n');
        const usedImports = new Set();
        const importLines = [];

        // Find all import statements
        lines.forEach((line, index) => {
            const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"](.*?)['"];?/);
            if (importMatch) {
                importLines.push({
                    index,
                    line,
                    imports: importMatch[1] ? importMatch[1].split(',').map(s => s.trim()) : 
                            importMatch[2] ? [importMatch[2]] :
                            importMatch[3] ? [importMatch[3]] : []
                });
            }
        });

        // Find used imports in code
        importLines.forEach(importLine => {
            importLine.imports.forEach(imp => {
                const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
                if (content.includes(cleanImport) && content.indexOf(cleanImport) !== content.indexOf(importLine.line)) {
                    usedImports.add(cleanImport);
                }
            });
        });

        // Remove unused import lines
        return lines.filter((line, index) => {
            const isImportLine = importLines.some(imp => imp.index === index);
            if (!isImportLine) return true;

            const importLine = importLines.find(imp => imp.index === index);
            return importLine.imports.some(imp => {
                const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
                return usedImports.has(cleanImport);
            });
        }).join('\n');
    }

    async optimizeExports() {
        console.log('📤 Optimizing exports...');
        
        // Create optimized index.js with only essential exports
        const essentialExports = [
            'createApp',
            'defineComponent',
            'html',
            'signal',
            'computed',
            'effect',
            'useState',
            'useEffect',
            'useMemo',
            'useCallback',
            'useRef',
            'useContext',
            'createContext',
            'Component'
        ];

        const optimizedIndex = this.generateOptimizedIndex(essentialExports);
        await fs.promises.writeFile(path.join(distDir, 'index.js'), optimizedIndex);

        console.log('✅ Exports optimized\n');
    }

    generateOptimizedIndex(exports) {
        return `// Berryact JS Framework - Optimized Build
// Essential exports only

// Core functionality
export { createApp } from './core/app.js';
export { defineComponent, Component } from './core/component.js';
export { signal, computed, effect } from './core/signal.js';

// Template system
export { html } from './template/enhanced-parser.js';

// Hooks
export { 
    useState, 
    useEffect, 
    useMemo, 
    useCallback, 
    useRef, 
    useContext, 
    createContext 
} from './core/hooks.js';

// JSX runtime (for build tools)
export * from './jsx-runtime.js';

// Version info
export const version = '1.0.0';
`;
    }

    async bundleCore() {
        console.log('📦 Creating core bundle...');
        
        // Create a single-file core bundle for basic usage
        const coreModules = [
            'core/signal.js',
            'core/component.js',
            'core/hooks.js',
            'template/enhanced-parser.js'
        ];

        let bundleContent = `// Berryact JS Framework - Core Bundle
// Single file containing essential functionality
// Generated: ${new Date().toISOString()}

(function(global) {
'use strict';

`;

        for (const module of coreModules) {
            const modulePath = path.join(distDir, module);
            if (fs.existsSync(modulePath)) {
                const content = await fs.promises.readFile(modulePath, 'utf-8');
                bundleContent += `\n// === ${module} ===\n`;
                bundleContent += content.replace(/import.*?from.*?;/g, '').replace(/export\s+/g, '');
            }
        }

        bundleContent += `
})(typeof window !== 'undefined' ? window : global);
`;

        await fs.promises.writeFile(path.join(distDir, 'berryact.bundle.js'), bundleContent);
        
        console.log('✅ Core bundle created\n');
    }

    async generateBundle() {
        console.log('🎁 Generating production bundle...');
        
        // Calculate final size
        this.stats.optimizedSize = await this.calculateDirectorySize(distDir);
        
        // Create package.json for distribution
        const packageJson = {
            name: '@berryact/core',
            version: '1.0.0',
            description: 'A lightweight, reactive JavaScript framework',
            main: 'index.js',
            module: 'index.js',
            types: 'index.d.ts',
            exports: {
                '.': {
                    import: './index.js',
                    require: './index.js'
                },
                './core': './berryact.bundle.js'
            },
            files: ['**/*'],
            keywords: ['framework', 'reactive', 'component', 'signals', 'jsx'],
            license: 'MIT',
            repository: {
                type: 'git',
                url: 'https://github.com/berryact/berryact-js'
            }
        };

        await fs.promises.writeFile(
            path.join(distDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );

        console.log('✅ Production bundle generated\n');
    }

    generateReport() {
        const savedBytes = this.stats.originalSize - this.stats.optimizedSize;
        const compressionRatio = ((savedBytes / this.stats.originalSize) * 100).toFixed(1);

        console.log('📊 Optimization Report');
        console.log('='.repeat(50));
        console.log(`📦 Original size: ${this.formatSize(this.stats.originalSize)}`);
        console.log(`⚡ Optimized size: ${this.formatSize(this.stats.optimizedSize)}`);
        console.log(`💾 Saved: ${this.formatSize(savedBytes)} (${compressionRatio}%)`);
        console.log(`📄 Files processed: ${this.stats.filesProcessed}`);
        
        console.log('\n🎯 Optimizations applied:');
        this.stats.optimizations.forEach(opt => {
            console.log(`• ${opt.name}: ${this.formatSize(opt.savedBytes)} saved`);
        });

        console.log('\n✨ Optimization complete!');
        console.log(`🎁 Production build available in: ${distDir}`);
    }

    async findJSFiles(dir) {
        const files = [];
        const items = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                files.push(...await this.findJSFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    async calculateDirectorySize(dir) {
        let size = 0;
        const files = await this.findJSFiles(dir);

        for (const file of files) {
            const stats = await fs.promises.stat(file);
            size += stats.size;
        }

        return size;
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run optimization if called directly
if (process.argv.length > 1 && process.argv[1].endsWith('optimize-build.js')) {
    const optimizer = new BuildOptimizer();
    optimizer.optimize().catch(console.error);
}

export default BuildOptimizer;