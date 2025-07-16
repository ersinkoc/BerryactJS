#!/usr/bin/env node

import { createApp } from '../src/commands/create.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

async function main() {
  console.log(chalk.blue('Welcome to Berryact JS Framework!'));
  console.log();

  // Get project name from command line or prompt
  let projectName = process.argv[2];
  
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Project name is required';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        }
      }
    ]);
    projectName = answers.projectName;
  }

  // Interactive project setup
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { name: 'Default - Basic Berryact app', value: 'default' },
        { name: 'SPA - Single Page Application', value: 'spa' },
        { name: 'SSR - Server-Side Rendered', value: 'ssr' },
        { name: 'PWA - Progressive Web App', value: 'pwa' },
        { name: 'Library - Component library', value: 'library' },
        { name: 'Minimal - Bare minimum setup', value: 'minimal' }
      ],
      default: 'default'
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: true
    },
    {
      type: 'confirm',
      name: 'router',
      message: 'Include router?',
      default: true,
      when: (answers) => answers.template !== 'library'
    },
    {
      type: 'confirm',
      name: 'store',
      message: 'Include state management?',
      default: true,
      when: (answers) => answers.template !== 'minimal'
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' }
      ],
      default: 'npm'
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Additional features:',
      choices: [
        { name: 'ESLint + Prettier', value: 'linting', checked: true },
        { name: 'Testing (Jest)', value: 'testing', checked: true },
        { name: 'GitHub Actions CI/CD', value: 'ci', checked: false },
        { name: 'Docker configuration', value: 'docker', checked: false },
        { name: 'Storybook', value: 'storybook', checked: false },
        { name: 'Bundle analyzer', value: 'analyzer', checked: false }
      ]
    }
  ]);

  try {
    await createApp(projectName, config);
    
    console.log();
    console.log(chalk.green('✓ Project created successfully!'));
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  ${config.packageManager} run dev`));
    console.log();
    console.log('Happy coding! 🚀');
    
  } catch (error) {
    console.error(chalk.red('Error creating project:'), error.message);
    process.exit(1);
  }
}

main().catch(console.error);