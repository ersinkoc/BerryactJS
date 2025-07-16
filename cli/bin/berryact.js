#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { createApp } from '../src/commands/create.js';
import { addComponent } from '../src/commands/add.js';
import { buildProject } from '../src/commands/build.js';
import { serveProject } from '../src/commands/serve.js';
import { generateCode } from '../src/commands/generate.js';

const program = new Command();

program
  .name('berryact')
  .description('CLI tool for Berryact JS Framework')
  .version('1.0.0');

// Create new project
program
  .command('create <project-name>')
  .description('Create a new Berryact project')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('-p, --package-manager <pm>', 'Package manager (npm, yarn, pnpm)', 'npm')
  .option('--typescript', 'Use TypeScript')
  .option('--router', 'Include router')
  .option('--store', 'Include state management')
  .option('--ssr', 'Enable server-side rendering')
  .option('--pwa', 'Progressive Web App features')
  .action(async (projectName, options) => {
    try {
      await createApp(projectName, options);
    } catch (error) {
      console.error(chalk.red('Error creating project:'), error.message);
      process.exit(1);
    }
  });

// Add component/feature
program
  .command('add <type>')
  .description('Add component, page, or feature to existing project')
  .argument('<name>', 'Name of the component/feature')
  .option('-d, --directory <dir>', 'Target directory', 'src/components')
  .option('--typescript', 'Generate TypeScript files')
  .option('--test', 'Include test files')
  .option('--story', 'Include Storybook story')
  .action(async (type, name, options) => {
    try {
      await addComponent(type, name, options);
    } catch (error) {
      console.error(chalk.red('Error adding component:'), error.message);
      process.exit(1);
    }
  });

// Generate code
program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate code files (component, service, store, etc.)')
  .option('-d, --directory <dir>', 'Target directory')
  .option('--dry-run', 'Show what would be generated without creating files')
  .action(async (type, name, options) => {
    try {
      await generateCode(type, name, options);
    } catch (error) {
      console.error(chalk.red('Error generating code:'), error.message);
      process.exit(1);
    }
  });

// Build project
program
  .command('build')
  .description('Build the project for production')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--analyze', 'Analyze bundle size')
  .option('--ssr', 'Build for server-side rendering')
  .action(async (options) => {
    try {
      await buildProject(options);
    } catch (error) {
      console.error(chalk.red('Build failed:'), error.message);
      process.exit(1);
    }
  });

// Development server
program
  .command('serve')
  .alias('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('--https', 'Use HTTPS')
  .option('--open', 'Open browser automatically')
  .action(async (options) => {
    try {
      await serveProject(options);
    } catch (error) {
      console.error(chalk.red('Server failed to start:'), error.message);
      process.exit(1);
    }
  });

// Project info
program
  .command('info')
  .description('Display project and environment information')
  .action(async () => {
    const { displayInfo } = await import('../src/commands/info.js');
    await displayInfo();
  });

// Update dependencies
program
  .command('update')
  .description('Update Berryact framework and dependencies')
  .option('--check', 'Check for updates without installing')
  .action(async (options) => {
    const { updateDependencies } = await import('../src/commands/update.js');
    await updateDependencies(options);
  });

// Lint project
program
  .command('lint')
  .description('Lint project files')
  .option('--fix', 'Automatically fix problems')
  .option('--staged', 'Only lint staged files')
  .action(async (options) => {
    const { lintProject } = await import('../src/commands/lint.js');
    await lintProject(options);
  });

// Test project
program
  .command('test')
  .description('Run tests')
  .option('--watch', 'Watch for changes')
  .option('--coverage', 'Generate coverage report')
  .option('--ci', 'Run in CI mode')
  .action(async (options) => {
    const { runTests } = await import('../src/commands/test.js');
    await runTests(options);
  });

// Migration commands
program
  .command('migrate')
  .description('Migration utilities')
  .addCommand(
    new Command('from-react')
      .description('Migrate from React project')
      .argument('<source>', 'Source React project directory')
      .option('--dry-run', 'Show what would be migrated')
      .action(async (source, options) => {
        const { migrateFromReact } = await import('../src/commands/migrate.js');
        await migrateFromReact(source, options);
      })
  )
  .addCommand(
    new Command('from-vue')
      .description('Migrate from Vue project')
      .argument('<source>', 'Source Vue project directory')
      .option('--dry-run', 'Show what would be migrated')
      .action(async (source, options) => {
        const { migrateFromVue } = await import('../src/commands/migrate.js');
        await migrateFromVue(source, options);
      })
  );

// Plugin management
program
  .command('plugin')
  .description('Plugin management')
  .addCommand(
    new Command('add')
      .description('Add a plugin')
      .argument('<plugin>', 'Plugin name')
      .action(async (plugin, options) => {
        const { addPlugin } = await import('../src/commands/plugin.js');
        await addPlugin(plugin, options);
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove a plugin')
      .argument('<plugin>', 'Plugin name')
      .action(async (plugin, options) => {
        const { removePlugin } = await import('../src/commands/plugin.js');
        await removePlugin(plugin, options);
      })
  )
  .addCommand(
    new Command('list')
      .description('List installed plugins')
      .action(async () => {
        const { listPlugins } = await import('../src/commands/plugin.js');
        await listPlugins();
      })
  );

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse CLI arguments
program.parse();