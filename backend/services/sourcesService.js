import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { isMongoDBEnabled, getDB } from './mongoService.js';

const __filename = fileURLToPath(import.meta.url);

const DATA_DIR = join(process.cwd(), './scripts-ui/data');
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(process.cwd(), '.scripts-ui/scripts');
const SOURCES_FILE = join(DATA_DIR, 'sources.json');
const DEFAULT_SOURCE = {
  id: 'default',
  name: 'Project Scripts',
  path: SCRIPTS_DIR,
  isDefault: true
};

// Initialize sources file and directory if they don't exist
async function initSourcesFile() {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    if (!existsSync(SCRIPTS_DIR)) {
      console.log(`[Sources] Created scripts directory: ${SCRIPTS_DIR}`);
      await mkdir(SCRIPTS_DIR, { recursive: true });
    }

    try {
      let sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'))

      
      let defaultItem = sources.find(sourceItem => sourceItem.id==='default')
      if(defaultItem.path!=DEFAULT_SOURCE.path){
        await writeFile(SOURCES_FILE, JSON.stringify([
          ...[DEFAULT_SOURCE],
          ...sources.filter(sourceItem=>sourceItem.id!=='default'),
        ]), 'utf8');
      }

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

// Get sources from MongoDB
async function getSourcesFromMongo() {
  try {
    const db = getDB();
    const sourcesCollection = db.collection('sources');

    // Get all sources
    const sources = await sourcesCollection.find({}).toArray();

    // If no sources exist, create default source
    if (sources.length === 0) {
      await sourcesCollection.insertOne(DEFAULT_SOURCE);
      return [DEFAULT_SOURCE];
    }

    return sources;
  } catch (error) {
    console.error('[MongoDB] Error getting sources:', error);
    throw error;
  }
}

// Save sources to MongoDB
async function saveSourcesToMongo(sources) {
  try {
    const db = getDB();
    const sourcesCollection = db.collection('sources');

    // Clear existing sources and insert new ones
    await sourcesCollection.deleteMany({});
    if (sources.length > 0) {
      await sourcesCollection.insertMany(sources);
    }

    return sources;
  } catch (error) {
    console.error('[MongoDB] Error saving sources:', error);
    throw error;
  }
}

// Migrate sources from file to MongoDB if needed
async function migrateSourcesIfNeeded() {
  if (!isMongoDBEnabled()) return;

  try {
    // Check if MongoDB already has sources
    const db = getDB();
    const sourcesCollection = db.collection('sources');
    const count = await sourcesCollection.countDocuments();

    // If MongoDB already has sources, no need to migrate
    if (count > 0) return;

    console.log('[MongoDB] Migrating sources from file to MongoDB...');

    // Read sources from file
    await initSourcesFile();
    const sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));

    // Save to MongoDB
    await saveSourcesToMongo(sources);

    console.log('[MongoDB] Sources migration completed successfully.');
  } catch (error) {
    console.error('[MongoDB] Error migrating sources:', error);
    // Continue with file-based sources if migration fails
  }
}

// Initialize the sources system
export const initSources = async () => {
  // Migrate sources from file to MongoDB if needed
  if (isMongoDBEnabled()) {
    await migrateSourcesIfNeeded();
  }
};

export const listSources = async () => {
  // Use MongoDB if enabled, otherwise use file system
  if (isMongoDBEnabled()) {
    return await getSourcesFromMongo();
  } else {
    await initSourcesFile();
    const sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
    return sources;
  }
};

export const addSource = async (source) => {
  const sources = await listSources();
  const newSource = {
    ...source,
    id: Date.now().toString(),
    isDefault: false
  };
  sources.push(newSource);

  // Save to appropriate storage
  if (isMongoDBEnabled()) {
    await saveSourcesToMongo(sources);
  } else {
    await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
  }

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

  // Save to appropriate storage
  if (isMongoDBEnabled()) {
    await saveSourcesToMongo(sources);
  } else {
    await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
  }

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

  // Save to appropriate storage
  if (isMongoDBEnabled()) {
    await saveSourcesToMongo(sources);
  } else {
    await writeFile(SOURCES_FILE, JSON.stringify(sources), 'utf8');
  }
};