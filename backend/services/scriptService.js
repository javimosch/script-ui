import { exec } from 'child_process';
import { readdir } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { listSources } from './sourcesService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED_EXTENSIONS = ['.sh', '.js'];

export const listScripts = async () => {
  try {
    const sources = await listSources();
    const allScripts = [];

    for (const source of sources) {
      try {
        const files = await readdir(source.path);
        const scripts = files.filter(file => ALLOWED_EXTENSIONS.includes(extname(file)));
        allScripts.push(...scripts);
      } catch (error) {
        console.error(`Error reading source ${source.name}:`, error);
      }
    }

    return [...new Set(allScripts)]; // Remove duplicates
  } catch (error) {
    console.error('Error listing scripts:', error);
    throw error;
  }
};

export const executeScript = async (scriptName, ws) => {
  try {
    const sources = await listSources();
    let scriptPath = null;

    // Find the script in available sources
    for (const source of sources) {
      const testPath = join(source.path, scriptName);
      try {
        const files = await readdir(source.path);
        if (files.includes(scriptName)) {
          scriptPath = testPath;
          break;
        }
      } catch (error) {
        console.error(`Error checking source ${source.name}:`, error);
      }
    }

    if (!scriptPath) {
      throw new Error('Script not found in any source');
    }

    const isJavaScript = extname(scriptName) === '.js';
    const command = isJavaScript ? `node ${scriptPath}` : `bash ${scriptPath}`;
    
    const process = exec(command);
    
    process.stdout.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
    });
    
    process.stderr.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
    });
    
    process.on('close', (code) => {
      ws.send(JSON.stringify({ type: 'exit', data: `Process exited with code ${code}` }));
    });
    
    return process;
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', data: error.message }));
  }
};