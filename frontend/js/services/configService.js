const API_URL = window.location.origin+'/api';

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
    return { globalEnv: {}, scriptConfigs: [] };
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

// Get the current source ID from the UI or use default
export const getCurrentSourceId = () => {
  // This could be enhanced to get the currently selected source from the UI
  return 'default';
};

export const getScriptConfig = async (scriptName, sourceId) => {
  try {
    // If sourceId is not provided, use the current source
    if (!sourceId) {
      sourceId = getCurrentSourceId();
    }

    const response = await fetch(`${API_URL}/config/script/${encodeURIComponent(scriptName)}?sourceId=${encodeURIComponent(sourceId)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch script config: ${response.statusText}`);
    }

    const config = await response.json();
    return config || {
      ...defaultScriptConfig,
      scriptName,
      sourceId
    };
  } catch (error) {
    console.error(`Error getting script config for ${scriptName}:`, error);
    return {
      ...defaultScriptConfig,
      scriptName,
      sourceId: sourceId || getCurrentSourceId()
    };
  }
};

export const updateScriptConfig = async (scriptName, newConfig, sourceId) => {
  try {
    // If sourceId is not provided, use the current source
    if (!sourceId) {
      sourceId = getCurrentSourceId();
    }

    // Make sure scriptName and sourceId are included in the config
    const configToUpdate = {
      ...newConfig,
      scriptName,
      sourceId
    };

    const response = await fetch(`${API_URL}/config/script/${encodeURIComponent(scriptName)}?sourceId=${encodeURIComponent(sourceId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configToUpdate)
    });

    if (!response.ok) {
      throw new Error(`Failed to update script config: ${response.statusText}`);
    }

    const updatedConfig = await response.json();
    // Invalidate cache
    configCache = null;
    return updatedConfig;
  } catch (error) {
    console.error(`Error updating script config for ${scriptName}:`, error);
    throw error;
  }
};

// Get all script configs for a specific script name across all sources
export const getAllScriptConfigsForName = async (scriptName) => {
  try {
    const response = await fetch(`${API_URL}/config/script/${encodeURIComponent(scriptName)}/all`);

    if (!response.ok) {
      throw new Error(`Failed to fetch script configs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting all configs for script ${scriptName}:`, error);
    return [];
  }
};

// Get all script configs for a specific source
export const getScriptConfigsForSource = async (sourceId) => {
  try {
    const response = await fetch(`${API_URL}/config/source/${encodeURIComponent(sourceId)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch source configs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting configs for source ${sourceId}:`, error);
    return [];
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

export const getDenoFlags = async (scriptName, sourceId) => {
  const config = await getScriptConfig(scriptName, sourceId);
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

export const getMergedEnv = async (scriptName, sourceId) => {
  const globalEnv = await getGlobalEnv();
  const scriptConfig = await getScriptConfig(scriptName, sourceId);
  return { ...globalEnv, ...scriptConfig.env };
};

export const getScriptArgs = async (scriptName, sourceId) => {
  const config = await getScriptConfig(scriptName, sourceId);
  return config.args || '';
};

export const getScriptType = (scriptName) => {
  const ext = scriptName.split('.').pop().toLowerCase();
  return ext === 'ts' ? 'deno' : ext === 'js' ? 'node' : 'bash';
};