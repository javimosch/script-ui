import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { isMongoDBEnabled, getDB } from './mongoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(process.cwd(), '.scripts-ui/data');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

const defaultConfig = {
  globalEnv: {},
  scriptConfigs: [], // Changed from object to array
};

const defaultScriptConfig = {
  scriptName: '', // Script filename
  sourceId: '', // Source ID where the script is located
  permissions: {
    allowRead: false,
    allowWrite: false,
    allowNet: false,
    allowEnv: false,
    allowRun: false,
    allowFfi: false,
    allowHrtime: false,
  },
  env: {},
  args: '' // Default empty string for script arguments
};

// Initialize config file if it doesn't exist
async function initConfigFile() {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    try {
      await readFile(CONFIG_FILE, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        await writeFile(CONFIG_FILE, JSON.stringify(defaultConfig), 'utf8');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error initializing config:', error);
    throw error;
  }
}

// Get config from MongoDB
async function getConfigFromMongo() {
  try {
    const db = getDB();
    const configCollection = db.collection('config');

    // Get the config document
    let config = await configCollection.findOne({ _id: 'config' });

    // If no config exists, create default config
    if (!config) {
      config = { ...defaultConfig, _id: 'config' };
      await configCollection.insertOne(config);
    }

    return config;
  } catch (error) {
    console.error('[MongoDB] Error getting config:', error);
    throw error;
  }
}

// Update config in MongoDB
async function updateConfigInMongo(newConfig) {
  try {
    const db = getDB();
    const configCollection = db.collection('config');

    // Ensure _id is set
    const configToUpdate = { ...newConfig, _id: 'config' };

    // Update the config document
    await configCollection.replaceOne(
      { _id: 'config' },
      configToUpdate,
      { upsert: true }
    );

    return configToUpdate;
  } catch (error) {
    console.error('[MongoDB] Error updating config:', error);
    throw error;
  }
}

export const getConfig = async () => {
  // Use MongoDB if enabled, otherwise use file system
  if (isMongoDBEnabled()) {
    return await getConfigFromMongo();
  } else {
    await initConfigFile();
    const config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
    return config;
  }
};

export const updateConfig = async (newConfig) => {
  // Use MongoDB if enabled, otherwise use file system
  if (isMongoDBEnabled()) {
    return await updateConfigInMongo(newConfig);
  } else {
    await initConfigFile();
    await writeFile(CONFIG_FILE, JSON.stringify(newConfig), 'utf8');
    return newConfig;
  }
};

// Helper function to migrate from old object format to new array format
async function migrateConfigIfNeeded() {
  const config = await getConfig();

  // Check if scriptConfigs is an object (old format) and convert to array (new format)
  if (config.scriptConfigs && !Array.isArray(config.scriptConfigs)) {
    console.log('Migrating config from object to array format...');
    const newScriptConfigs = [];

    // Convert each entry in the object to an array item
    for (const [scriptName, scriptConfig] of Object.entries(config.scriptConfigs)) {
      newScriptConfigs.push({
        ...defaultScriptConfig,
        ...scriptConfig,
        scriptName,
        sourceId: 'default' // Default source for migrated configs
      });
    }

    config.scriptConfigs = newScriptConfigs;
    await updateConfig(config);
    console.log('Config migration completed.');
  }
}

export const getScriptConfig = async (scriptName, sourceId = 'default') => {
  await migrateConfigIfNeeded();
  const config = await getConfig();

  // Find the script config in the array
  const scriptConfig = config.scriptConfigs.find(sc =>
    sc.scriptName === scriptName && sc.sourceId === sourceId
  );

  return scriptConfig || {
    ...defaultScriptConfig,
    scriptName,
    sourceId
  };
};

export const updateScriptConfig = async (scriptName, newConfig, sourceId = 'default') => {
  await migrateConfigIfNeeded();
  const config = await getConfig();

  // Find the index of the script config in the array
  const index = config.scriptConfigs.findIndex(sc =>
    sc.scriptName === scriptName && sc.sourceId === sourceId
  );

  const updatedConfig = {
    ...defaultScriptConfig,
    ...newConfig,
    scriptName,
    sourceId
  };

  if (index >= 0) {
    // Update existing config
    config.scriptConfigs[index] = updatedConfig;
  } else {
    // Add new config
    config.scriptConfigs.push(updatedConfig);
  }

  await updateConfig(config);
  return updatedConfig;
};

// Get all script configs for a specific script name across all sources
export const getAllScriptConfigsForName = async (scriptName) => {
  await migrateConfigIfNeeded();
  const config = await getConfig();

  return config.scriptConfigs.filter(sc => sc.scriptName === scriptName);
};

// Get all script configs for a specific source
export const getScriptConfigsForSource = async (sourceId) => {
  await migrateConfigIfNeeded();
  const config = await getConfig();

  return config.scriptConfigs.filter(sc => sc.sourceId === sourceId);
};

export const getGlobalEnv = async () => {
  const config = await getConfig();
  return config.globalEnv;
};

export const updateGlobalEnv = async (env) => {
  const config = await getConfig();
  config.globalEnv = env;
  await updateConfig(config);
  return env;
};
