import { exec } from 'child_process';
import { readdir, writeFile, unlink } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { listSources } from './sourcesService.js';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { sendUsageData } from './usageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED_EXTENSIONS = ['.sh', '.js', '.ts'];

// Helper function to clean up temporary files
async function cleanupTempFile(filePath) {
  try {
    await unlink(filePath);
    console.log(`[executeScript] Cleaned up temporary file: ${filePath}`);
  } catch (error) {
    console.error(`[executeScript] Error cleaning up file: ${error.message}`);
  }
}

export const listScripts = async () => {
  try {
    const sources = await listSources();
    const scriptsWithSources = [];

    for (const source of sources) {
      try {
        const files = await readdir(source.path);
        const scripts = files.filter(file => ALLOWED_EXTENSIONS.includes(extname(file)));

        // Add each script with its source information
        scripts.forEach(script => {
          scriptsWithSources.push({
            name: script,
            source: {
              id: source.id,
              name: source.name
            }
          });
        });
      } catch (error) {
        console.error(`Error reading source ${source.name}:`, error);
      }
    }

    // Return the scripts with their source information
    return scriptsWithSources;
  } catch (error) {
    console.error('Error listing scripts:', error);
    throw error;
  }
};

// For backward compatibility, get just the script names
export const listScriptNames = async () => {
  const scripts = await listScripts();
  return [...new Set(scripts.map(script => script.name))]; // Remove duplicates
};

export const executeScript = async (scriptName, ws, config = {}) => {
  let childProcess = null;

  try {
    console.log(`[executeScript] Starting execution of script: ${scriptName}`);
    console.log(`[executeScript] Config:`, JSON.stringify(config));

    const sources = await listSources();
    console.log(`[executeScript] Found ${sources.length} sources to search for script`);

    let scriptPath = null;

    // Find the script in available sources
    for (const source of sources) {
      const testPath = join(source.path, scriptName);
      console.log(`[executeScript] Checking source: ${source.name}, path: ${source.path}`);

      try {
        const files = await readdir(source.path);
        console.log(`[executeScript] Source ${source.name} contains ${files.length} files`);

        if (files.includes(scriptName)) {
          scriptPath = testPath;
          console.log(`[executeScript] Script found at: ${scriptPath}`);
          break;
        }
      } catch (error) {
        console.error(`[executeScript] Error checking source ${source.name}:`, error);
      }
    }

    if (!scriptPath) {
      console.error(`[executeScript] Script not found in any source: ${scriptName}`);
      throw new Error('Script not found in any source');
    }

    const ext = extname(scriptName).toLowerCase();
    console.log(`[executeScript] Script extension: ${ext}`);

    let command;
    let env = { ...process.env };

    switch (ext) {
      case '.js':
        command = `node ${scriptPath}${config.args ? ' ' + config.args : ''}`;
        env = { ...env, ...config.env };
        console.log(`[executeScript] Using Node.js to execute script${config.args ? ' with args: ' + config.args : ''}`);
        break;
      case '.ts': {
        let tempEnvFile = null;
        try {
          // Create a temporary .env file for Deno
          tempEnvFile = join(tmpdir(), `deno-env-${randomUUID()}.env`);
          console.log(`[executeScript] Creating temporary env file: ${tempEnvFile}`);

          // Format environment variables for the .env file
          const envContent = Object.entries(config.env || {})
            .map(([key, value]) => {
              // Escape special characters in the value
              const escapedValue = String(value)
                .replace(/\\/g, '\\\\')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/"/g, '\\"');
              return `${key}=${escapedValue}`;
            })
            .join('\n');

          // Write the .env file
          await writeFile(tempEnvFile, envContent, 'utf8');

          // Add --allow-env flag to ensure Deno can access environment variables
          let flags = config.denoFlags || '--allow-read --allow-write --allow-net';
          if (!flags.includes('--allow-env')) {
            flags += ' --allow-env';
          }

          command = `deno run ${flags} --env-file=${tempEnvFile} ${scriptPath}${config.args ? ' ' + config.args : ''}`;

          console.log(`[executeScript] Using Deno to execute script with flags: ${flags}`);
          if (config.args) {
            console.log(`[executeScript] Deno script arguments: ${config.args}`);
          }
          console.log(`[executeScript] Environment variables written to: ${tempEnvFile}`);
          console.log(`[executeScript] Environment content:\n${envContent}`);

          // Set up cleanup of the temporary file
          setTimeout(() => cleanupTempFile(tempEnvFile), 10000); // Clean up after 10 seconds
        } catch (error) {
          console.error(`[executeScript] Error setting up Deno environment: ${error.message}`);
          if (tempEnvFile) {
            await cleanupTempFile(tempEnvFile);
          }
          throw error; // Re-throw to be caught by the outer try-catch
        }
        break;
      }
      case '.sh':
        command = `bash ${scriptPath}${config.args ? ' ' + config.args : ''}`;
        env = { ...env, ...config.env };
        console.log(`[executeScript] Using Bash to execute script${config.args ? ' with args: ' + config.args : ''}`);
        break;
      default:
        console.error(`[executeScript] Unsupported file type: ${ext}`);
        throw new Error(`Unsupported file type: ${ext}`);
    }

    console.log(`[executeScript] Executing command: ${command}`);
    // Use a different variable name to avoid conflicts with the global process object
    childProcess = exec(command, { env });

    // Add error handler for the child process
    childProcess.on('error', (error) => {
      console.error(`[executeScript] Process error: ${error.message}`);
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({ type: 'error', data: `Process error: ${error.message}` }));
      }
    });

    childProcess.stdout.on('data', (data) => {
      console.log(`[executeScript] [stdout] ${data.toString().trim()}`);
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
      }
    });

    childProcess.stderr.on('data', (data) => {
      console.error(`[executeScript] [stderr] ${data.toString().trim()}`);
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
      }
    });

    childProcess.on('close', (code) => {
      console.log(`[executeScript] Process exited with code ${code}`);
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({ type: 'exit', data: `Process exited with code ${code}` }));
      }

      // Send anonymous usage data
      try {
        sendUsageData({
          exit_code: code,
          error: code !== 0
        });
      } catch (error) {
        // Silently ignore errors in usage data collection
      }
    });

    return childProcess;
  } catch (error) {
    console.error(`[executeScript] Error executing script: ${error.message}`);
    // Only try to send a message if the WebSocket is still open
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({ type: 'error', data: error.message }));
    } else {
      console.error(`[executeScript] WebSocket not open, could not send error: ${error.message}`);
    }

    // Send anonymous usage data for script setup errors
    try {
      sendUsageData({
        exit_code: 1,
        error: true
      });
    } catch (usageError) {
      // Silently ignore errors in usage data collection
    }

    return childProcess; // Return null if process wasn't created
  }
};