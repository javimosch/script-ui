import { exec } from 'child_process';
import { readdir } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(__dirname, '../../scripts');
const ALLOWED_EXTENSIONS = ['.sh', '.js'];

export const listScripts = async () => {
  try {
    const files = await readdir(SCRIPTS_DIR);
    return files.filter(file => ALLOWED_EXTENSIONS.includes(extname(file)));
  } catch (error) {
    console.error('Error listing scripts:', error);
    throw error;
  }
};

export const executeScript = (scriptName, ws) => {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
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
    ws.send(JSON.stringify({ type: 'exit', code }));
  });
  
  return process;
};