import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

// Define the preferences directory in the user's home directory
const PREFS_DIR = join(homedir(), '.scriptsui');
const STATE_FILE = join(PREFS_DIR, 'state.json');

// Default preferences
const defaultPreferences = {
  usageCollection: null, // null means not asked yet, true/false for user choice
  firstRun: true
};

/**
 * Initialize preferences file if it doesn't exist
 */
async function initPreferencesFile() {
  try {
    // Create preferences directory if it doesn't exist
    if (!existsSync(PREFS_DIR)) {
      await mkdir(PREFS_DIR, { recursive: true });
      console.log(`[Preferences] Created preferences directory: ${PREFS_DIR}`);
    }

    // Check if state file exists
    try {
      await readFile(STATE_FILE, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default preferences file
        await writeFile(STATE_FILE, JSON.stringify(defaultPreferences, null, 2), 'utf8');
        console.log(`[Preferences] Created default preferences file: ${STATE_FILE}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('[Preferences] Error initializing preferences:', error);
    throw error;
  }
}

/**
 * Get user preferences
 * @returns {Promise<Object>} User preferences
 */
export const getPreferences = async () => {
  try {
    await initPreferencesFile();
    const prefsContent = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(prefsContent);
  } catch (error) {
    console.error('[Preferences] Error reading preferences:', error);
    return { ...defaultPreferences };
  }
};

/**
 * Update user preferences
 * @param {Object} newPrefs - New preferences to merge with existing ones
 * @returns {Promise<Object>} Updated preferences
 */
export const updatePreferences = async (newPrefs) => {
  try {
    await initPreferencesFile();
    const currentPrefs = await getPreferences();
    const updatedPrefs = { ...currentPrefs, ...newPrefs };
    
    await writeFile(STATE_FILE, JSON.stringify(updatedPrefs, null, 2), 'utf8');
    return updatedPrefs;
  } catch (error) {
    console.error('[Preferences] Error updating preferences:', error);
    throw error;
  }
};

/**
 * Check if this is the first run
 * @returns {Promise<boolean>} True if this is the first run
 */
export const isFirstRun = async () => {
  const prefs = await getPreferences();
  return prefs.firstRun === true;
};

/**
 * Mark as not first run anymore
 * @returns {Promise<void>}
 */
export const markNotFirstRun = async () => {
  await updatePreferences({ firstRun: false });
};

/**
 * Get usage collection preference
 * @returns {Promise<boolean|null>} Usage collection preference (null if not set)
 */
export const getUsageCollectionPreference = async () => {
  const prefs = await getPreferences();
  return prefs.usageCollection;
};

/**
 * Set usage collection preference
 * @param {boolean} value - Whether to collect usage data
 * @returns {Promise<void>}
 */
export const setUsageCollectionPreference = async (value) => {
  await updatePreferences({ usageCollection: !!value });
};
