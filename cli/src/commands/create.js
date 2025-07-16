import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import validateProjectName from 'validate-npm-package-name';
import { getTemplateFiles } from '../templates/index.js';
import { installDependencies, createPackageJson } from '../utils/package.js';
import { applyTemplate } from '../utils/template.js';

export async function createApp(projectName, options = {}) {
  const {
    template = 'default',
    packageManager = 'npm',
    typescript = false,
    router = false,
    store = false,
    ssr = false,
    pwa = false,
    features = []
  } = options;

  // Validate project name
  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    throw new Error(`Invalid project name: ${validation.errors?.join(', ') || 'Unknown error'}`);
  }

  const projectPath = path.resolve(projectName);
  
  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Directory ${projectName} already exists`);
  }

  console.log(chalk.blue(`Creating Berryact project: ${projectName}`));
  console.log(chalk.gray(`Template: ${template}`));
  console.log();

  const spinner = ora('Setting up project structure...').start();

  try {
    // Create project directory
    await fs.ensureDir(projectPath);

    // Get template configuration
    const templateConfig = await getTemplateFiles(template, {
      typescript,
      router,
      store,
      ssr,
      pwa,
      features
    });

    // Create directory structure
    for (const dir of templateConfig.directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    spinner.text = 'Generating files...';

    // Create package.json
    const packageJson = createPackageJson(projectName, templateConfig);
    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    // Copy and process template files
    for (const file of templateConfig.files) {
      const targetPath = path.join(projectPath, file.path);
      await fs.ensureDir(path.dirname(targetPath));
      
      if (file.template) {
        // Process template file
        const content = applyTemplate(file.content, {
          projectName,
          typescript,
          router,
          store,
          ssr,
          pwa,
          features
        });
        await fs.writeFile(targetPath, content);
      } else {
        // Copy binary file
        await fs.writeFile(targetPath, file.content);
      }
    }

    // Create git repository
    if (features.includes('git')) {
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
        execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'ignore' });
      } catch (error) {
        console.warn(chalk.yellow('Warning: Failed to initialize git repository'));
      }
    }

    spinner.text = 'Installing dependencies...';

    // Install dependencies
    await installDependencies(projectPath, packageManager);

    spinner.succeed(chalk.green('Project created successfully!'));

    // Post-creation instructions
    console.log();
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  ${packageManager} run dev`));
    
    if (features.includes('testing')) {
      console.log(chalk.cyan(`  ${packageManager} test`));
    }
    
    console.log();
    console.log(chalk.gray('For more information, visit: https://berryact.oxog.dev'));

  } catch (error) {
    spinner.fail('Failed to create project');
    
    // Cleanup on failure
    try {
      await fs.remove(projectPath);
    } catch (cleanupError) {
      console.warn(chalk.yellow('Warning: Failed to cleanup project directory'));
    }
    
    throw error;
  }
}

export async function validateTemplate(template) {
  const availableTemplates = [
    'default',
    'spa',
    'ssr',
    'pwa',
    'library',
    'minimal'
  ];
  
  if (!availableTemplates.includes(template)) {
    throw new Error(`Template "${template}" not found. Available templates: ${availableTemplates.join(', ')}`);
  }
}

export function getAvailableTemplates() {
  return [
    {
      name: 'default',
      description: 'Basic Berryact application with essential features'
    },
    {
      name: 'spa',
      description: 'Single Page Application with routing and state management'
    },
    {
      name: 'ssr',
      description: 'Server-Side Rendered application'
    },
    {
      name: 'pwa',
      description: 'Progressive Web App with service worker and offline support'
    },
    {
      name: 'library',
      description: 'Component library template for creating reusable components'
    },
    {
      name: 'minimal',
      description: 'Minimal setup with just the core framework'
    }
  ];
}