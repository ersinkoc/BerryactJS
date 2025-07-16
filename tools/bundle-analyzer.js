#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '../src');

// Bundle analyzer for Berryact JS
class BundleAnalyzer {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.totalSize = 0;
    }

    async analyze() {
        console.log('🔍 Analyzing Berryact JS bundle...\n');
        
        await this.scanDirectory(srcDir);
        this.calculateDependencies();
        this.generateReport();
    }

    async scanDirectory(dir) {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                await this.scanDirectory(fullPath);
            } else if (item.isFile() && item.name.endsWith('.js')) {
                await this.analyzeFile(fullPath);
            }
        }
    }

    async analyzeFile(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const relativePath = path.relative(srcDir, filePath);
        
        const stats = {
            path: relativePath,
            size: content.length,
            lines: content.split('\n').length,
            imports: this.extractImports(content),
            exports: this.extractExports(content),
            functions: this.extractFunctions(content),
            classes: this.extractClasses(content),
            comments: this.extractComments(content)
        };

        this.modules.set(relativePath, stats);
        this.totalSize += stats.size;
    }

    extractImports(content) {
        const imports = [];
        const importRegex = /import\s+(?:(.+?)\s+from\s+)?['"](.*?)['"];?/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push({
                what: match[1] || 'default',
                from: match[2]
            });
        }
        
        return imports;
    }

    extractExports(content) {
        const exports = [];
        const exportRegex = /export\s+(?:(?:default|const|function|class|let|var)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return exports;
    }

    extractFunctions(content) {
        const functions = [];
        const functionRegex = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|function))/g;
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }
        
        return functions;
    }

    extractClasses(content) {
        const classes = [];
        const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            classes.push(match[1]);
        }
        
        return classes;
    }

    extractComments(content) {
        const comments = content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || [];
        return comments.length;
    }

    calculateDependencies() {
        for (const [modulePath, stats] of this.modules) {
            const deps = new Set();
            
            for (const imp of stats.imports) {
                if (imp.from.startsWith('./') || imp.from.startsWith('../')) {
                    // Local import
                    let depPath = path.resolve(path.dirname(modulePath), imp.from);
                    if (!depPath.endsWith('.js')) {
                        depPath += '.js';
                    }
                    depPath = path.relative(srcDir, depPath);
                    deps.add(depPath);
                }
            }
            
            this.dependencies.set(modulePath, Array.from(deps));
        }
    }

    generateReport() {
        console.log('📊 Bundle Analysis Report');
        console.log('=' .repeat(50));
        
        // Overall stats
        console.log(`\\n📦 Total Bundle Size: ${this.formatSize(this.totalSize)}`);
        console.log(`📄 Total Modules: ${this.modules.size}`);
        console.log(`📊 Average Module Size: ${this.formatSize(this.totalSize / this.modules.size)}`);
        
        // Largest modules
        console.log('\\n🏆 Largest Modules:');
        const sortedBySize = Array.from(this.modules.entries())
            .sort((a, b) => b[1].size - a[1].size)
            .slice(0, 10);
        
        sortedBySize.forEach(([path, stats], index) => {
            const percent = ((stats.size / this.totalSize) * 100).toFixed(1);
            console.log(`${index + 1}. ${path} - ${this.formatSize(stats.size)} (${percent}%)`);
        });
        
        // Module categories
        console.log('\\n📁 Module Categories:');
        const categories = this.categorizeModules();
        Object.entries(categories)
            .sort((a, b) => b[1].size - a[1].size)
            .forEach(([category, stats]) => {
                const percent = ((stats.size / this.totalSize) * 100).toFixed(1);
                console.log(`${category}: ${this.formatSize(stats.size)} (${percent}%) - ${stats.count} modules`);
            });
        
        // Optimization opportunities
        console.log('\\n🎯 Optimization Opportunities:');
        this.findOptimizationOpportunities();
        
        // Dependency analysis
        console.log('\\n🔗 Dependency Analysis:');
        this.analyzeDependencies();
    }

    categorizeModules() {
        const categories = {};
        
        for (const [path, stats] of this.modules) {
            const category = path.split('/')[0];
            
            if (!categories[category]) {
                categories[category] = { size: 0, count: 0, modules: [] };
            }
            
            categories[category].size += stats.size;
            categories[category].count++;
            categories[category].modules.push(path);
        }
        
        return categories;
    }

    findOptimizationOpportunities() {
        const opportunities = [];
        
        // Find modules with many comments
        for (const [path, stats] of this.modules) {
            if (stats.comments > 20) {
                opportunities.push(`${path} has ${stats.comments} comments (consider minification)`);
            }
        }
        
        // Find modules with many exports
        for (const [path, stats] of this.modules) {
            if (stats.exports.length > 10) {
                opportunities.push(`${path} exports ${stats.exports.length} items (consider tree-shaking)`);
            }
        }
        
        // Find potential duplicates
        const functionNames = new Map();
        for (const [path, stats] of this.modules) {
            for (const func of stats.functions) {
                if (!functionNames.has(func)) {
                    functionNames.set(func, []);
                }
                functionNames.get(func).push(path);
            }
        }
        
        for (const [func, paths] of functionNames) {
            if (paths.length > 1) {
                opportunities.push(`Function "${func}" appears in ${paths.length} modules: ${paths.join(', ')}`);
            }
        }
        
        opportunities.slice(0, 5).forEach(opp => console.log(`• ${opp}`));
        
        if (opportunities.length === 0) {
            console.log('• No major optimization opportunities found');
        }
    }

    analyzeDependencies() {
        // Most imported modules
        const importCounts = new Map();
        
        for (const [path, deps] of this.dependencies) {
            for (const dep of deps) {
                importCounts.set(dep, (importCounts.get(dep) || 0) + 1);
            }
        }
        
        const mostImported = Array.from(importCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        console.log('Most imported modules:');
        mostImported.forEach(([path, count]) => {
            console.log(`• ${path} (imported ${count} times)`);
        });
        
        // Modules with most dependencies
        const mostDeps = Array.from(this.dependencies.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5);
        
        console.log('\\nModules with most dependencies:');
        mostDeps.forEach(([path, deps]) => {
            console.log(`• ${path} (depends on ${deps.length} modules)`);
        });
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run the analyzer
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(console.error);