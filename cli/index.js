#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

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

// Function to check if this is the first run and ask for usage collection consent
async function checkFirstRunAndConsent() {
  try {
    // Import the preferences service dynamically to avoid circular dependencies
    const { isFirstRun, markNotFirstRun, setUsageCollectionPreference } =
      await import('../backend/services/preferencesService.js');

    // Check if this is the first run
    if (await isFirstRun()) {
      console.log('\n🔍 Usage Collection Consent');
      console.log('---------------------------');
      console.log('Scripts UI would like to collect anonymous usage data to improve the application.');
      console.log('This includes only script execution exit codes and error flags - no personal data or script content.');

      // Create readline interface for user input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      // Ask for consent
      const answer = await new Promise(resolve => {
        rl.question('Would you like to enable anonymous usage collection? (y/n): ', resolve);
      });

      // Process the answer
      const consent = answer.toLowerCase().startsWith('y');
      await setUsageCollectionPreference(consent);

      console.log(`\nUsage collection ${consent ? 'enabled' : 'disabled'}. You can change this setting later by editing ~/.scriptsui/state.json`);
      console.log('---------------------------\n');

      // Mark as not first run anymore
      await markNotFirstRun();

      // Close the readline interface
      rl.close();
    }
  } catch (error) {
    // If there's an error, just log it and continue
    console.error('Error checking first run status:', error.message);
  }
}

// Serve command
program
  .command('serve')
  .description('Start the Scripts UI server')
  .option('--dotenv <path>', 'Path to custom .env file')
  .action(async (options) => {
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

    // Check if this is the first run and ask for usage collection consent
    await checkFirstRunAndConsent();

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
