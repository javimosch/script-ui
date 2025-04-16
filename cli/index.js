#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Create a new command instance
const program = new Command();

// Set up program information
program
  .name('scripts-ui')
  .description('Command line interface for Scripts UI')
  .version('1.0.0');

// Serve command
program
  .command('serve')
  .description('Start the Scripts UI server')
  .option('--dotenv <path>', 'Path to custom .env file')
  .action((options) => {
    // Load custom .env file if provided
    if (options.dotenv) {
      const envPath = options.dotenv.startsWith('/')
        ? options.dotenv
        : join(process.cwd(), options.dotenv);
      
      if (!fs.existsSync(envPath)) {
        console.error(`Error: .env file not found at ${envPath}`);
        process.exit(1);
      }
      
      console.log(`Loading environment from: ${envPath}`);
      dotenv.config({ path: envPath });
    } else {
      // Load default .env file
      dotenv.config({ path: join(rootDir, '.env') });
    }

    console.log('Starting Scripts UI server...');
    
    // Start the server process
    const serverProcess = spawn('node', [join(rootDir, 'backend/server.js')], {
      stdio: 'inherit',
      env: process.env
    });

    // Handle server process events
    serverProcess.on('error', (error) => {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });

    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Server process exited with code ${code}`);
        process.exit(code);
      }
    });
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
