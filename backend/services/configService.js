import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

const defaultConfig = {
  globalEnv: {},
  scriptConfigs: {},
};

const defaultScriptConfig = {
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

export const getConfig = async () => {
  await initConfigFile();
  const config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  return config;
};

export const updateConfig = async (newConfig) => {
  await initConfigFile();
  await writeFile(CONFIG_FILE, JSON.stringify(newConfig), 'utf8');
  return newConfig;
};

export const getScriptConfig = async (scriptName) => {
  const config = await getConfig();
  return config.scriptConfigs[scriptName] || { ...defaultScriptConfig };
};

export const updateScriptConfig = async (scriptName, newConfig) => {
  const config = await getConfig();
  config.scriptConfigs[scriptName] = {
    ...defaultScriptConfig,
    ...newConfig
  };
  await updateConfig(config);
  return config.scriptConfigs[scriptName];
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
