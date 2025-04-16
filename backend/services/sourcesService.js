import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const SOURCES_FILE = join(DATA_DIR, 'sources.json');
const DEFAULT_SOURCE = {
  id: 'default',
  name: 'Project Scripts',
  path: join(__dirname, '../../scripts'),
  isDefault: true
};

// Initialize sources file and directory if they don't exist
async function initSourcesFile() {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    try {
      await readFile(SOURCES_FILE, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        await writeFile(SOURCES_FILE, JSON.stringify([DEFAULT_SOURCE]), 'utf8');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error initializing sources:', error);
    throw error;
  }
}

export const listSources = async () => {
  await initSourcesFile();
  const sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
  return sources;
};

export const addSource = async (source) => {
  const sources = await listSources();
  const newSource = {
    ...source,
    id: Date.now().toString(),
    isDefault: false
  };
  sources.push(newSource);
  await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
  return newSource;
};

export const updateSource = async (id, updates) => {
  const sources = await listSources();
  const index = sources.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new Error('Source not found');
  }
  
  if (sources[index].isDefault) {
    throw new Error('Cannot modify default source');
  }
  
  sources[index] = { ...sources[index], ...updates };
  await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
  return sources[index];
};

export const deleteSource = async (id) => {
  const sources = await listSources();
  const index = sources.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new Error('Source not found');
  }
  
  if (sources[index].isDefault) {
    throw new Error('Cannot delete default source');
  }
  
  sources.splice(index, 1);
  await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
};