const API_URL = 'http://localhost:3000/api';

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

// Cache for config data to reduce API calls
let configCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 5000; // 5 seconds

async function fetchConfig() {
  try {
    // Use cache if it's still valid
    const now = Date.now();
    if (configCache && (now - lastFetchTime < CACHE_TTL)) {
      return configCache;
    }

    const response = await fetch(`${API_URL}/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }

    const config = await response.json();
    configCache = config;
    lastFetchTime = now;
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    // Return empty config if API fails
    return { globalEnv: {}, scriptConfigs: {} };
  }
}

async function updateConfig(config) {
  try {
    const response = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Failed to update config: ${response.statusText}`);
    }

    const updatedConfig = await response.json();
    configCache = updatedConfig;
    lastFetchTime = Date.now();
    return updatedConfig;
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

export const getScriptConfig = async (scriptName) => {
  try {
    const config = await fetchConfig();
    return config.scriptConfigs[scriptName] || { ...defaultScriptConfig };
  } catch (error) {
    console.error(`Error getting script config for ${scriptName}:`, error);
    return { ...defaultScriptConfig };
  }
};

export const updateScriptConfig = async (scriptName, newConfig) => {
  try {
    const config = await fetchConfig();
    config.scriptConfigs[scriptName] = {
      ...defaultScriptConfig,
      ...newConfig
    };
    await updateConfig(config);
    return config.scriptConfigs[scriptName];
  } catch (error) {
    console.error(`Error updating script config for ${scriptName}:`, error);
    throw error;
  }
};

export const getGlobalEnv = async () => {
  try {
    const config = await fetchConfig();
    return config.globalEnv || {};
  } catch (error) {
    console.error('Error getting global env:', error);
    return {};
  }
};

export const updateGlobalEnv = async (env) => {
  try {
    const config = await fetchConfig();
    config.globalEnv = env;
    await updateConfig(config);
    return env;
  } catch (error) {
    console.error('Error updating global env:', error);
    throw error;
  }
};

export const getDenoFlags = async (scriptName) => {
  const config = await getScriptConfig(scriptName);
  const flags = [];

  if (config.permissions.allowRead) flags.push('--allow-read');
  if (config.permissions.allowWrite) flags.push('--allow-write');
  if (config.permissions.allowNet) flags.push('--allow-net');
  if (config.permissions.allowEnv) flags.push('--allow-env');
  if (config.permissions.allowRun) flags.push('--allow-run');
  if (config.permissions.allowFfi) flags.push('--allow-ffi');
  if (config.permissions.allowHrtime) flags.push('--allow-hrtime');

  return flags.join(' ');
};

export const getMergedEnv = async (scriptName) => {
  const globalEnv = await getGlobalEnv();
  const scriptConfig = await getScriptConfig(scriptName);
  return { ...globalEnv, ...scriptConfig.env };
};

export const getScriptArgs = async (scriptName) => {
  const config = await getScriptConfig(scriptName);
  return config.args || '';
};

export const getScriptType = (scriptName) => {
  const ext = scriptName.split('.').pop().toLowerCase();
  return ext === 'ts' ? 'deno' : ext === 'js' ? 'node' : 'bash';
};