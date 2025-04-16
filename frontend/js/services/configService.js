const STORAGE_KEY = 'script-ui-config';

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

export const loadConfig = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultConfig;
  }
  return JSON.parse(stored);
};

export const saveConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const getScriptConfig = (scriptName) => {
  const config = loadConfig();
  return config.scriptConfigs[scriptName] || { ...defaultScriptConfig };
};

export const updateScriptConfig = (scriptName, newConfig) => {
  const config = loadConfig();
  config.scriptConfigs[scriptName] = {
    ...defaultScriptConfig,
    ...newConfig
  };
  saveConfig(config);
};

export const getGlobalEnv = () => {
  return loadConfig().globalEnv;
};

export const updateGlobalEnv = (env) => {
  const config = loadConfig();
  config.globalEnv = env;
  saveConfig(config);
};

export const getDenoFlags = (scriptName) => {
  const config = getScriptConfig(scriptName);
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

export const getMergedEnv = (scriptName) => {
  const globalEnv = getGlobalEnv();
  const scriptConfig = getScriptConfig(scriptName);
  return { ...globalEnv, ...scriptConfig.env };
};

export const getScriptArgs = (scriptName) => {
  const config = getScriptConfig(scriptName);
  return config.args || '';
};

export const getScriptType = (scriptName) => {
  const ext = scriptName.split('.').pop().toLowerCase();
  return ext === 'ts' ? 'deno' : ext === 'js' ? 'node' : 'bash';
};