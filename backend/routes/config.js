import { Router } from 'express';
import { getConfig, updateConfig, getScriptConfig, updateScriptConfig, getGlobalEnv, updateGlobalEnv, getAllScriptConfigsForName, getScriptConfigsForSource } from '../services/configService.js';

const router = Router();

// Get all config
router.get('/', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Update all config
router.put('/', async (req, res) => {
  try {
    const newConfig = req.body;
    const updatedConfig = await updateConfig(newConfig);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Get script config
router.get('/script/:name', async (req, res) => {
  try {
    const scriptName = req.params.name;
    const sourceId = req.query.sourceId || 'default';
    const config = await getScriptConfig(scriptName, sourceId);
    res.json(config);
  } catch (error) {
    console.error(`Error getting script config for ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to get script config' });
  }
});

// Update script config
router.put('/script/:name', async (req, res) => {
  try {
    const scriptName = req.params.name;
    const sourceId = req.query.sourceId || 'default';
    const newConfig = req.body;
    const updatedConfig = await updateScriptConfig(scriptName, newConfig, sourceId);
    res.json(updatedConfig);
  } catch (error) {
    console.error(`Error updating script config for ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to update script config' });
  }
});

// Get all script configs for a specific script name across all sources
router.get('/script/:name/all', async (req, res) => {
  try {
    const scriptName = req.params.name;
    const configs = await getAllScriptConfigsForName(scriptName);
    res.json(configs);
  } catch (error) {
    console.error(`Error getting all configs for script ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to get script configs' });
  }
});

// Get all script configs for a specific source
router.get('/source/:id', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const configs = await getScriptConfigsForSource(sourceId);
    res.json(configs);
  } catch (error) {
    console.error(`Error getting configs for source ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get source configs' });
  }
});

// Get global environment variables
router.get('/env', async (req, res) => {
  try {
    const env = await getGlobalEnv();
    res.json(env);
  } catch (error) {
    console.error('Error getting global env:', error);
    res.status(500).json({ error: 'Failed to get global environment variables' });
  }
});

// Update global environment variables
router.put('/env', async (req, res) => {
  try {
    const env = req.body;
    const updatedEnv = await updateGlobalEnv(env);
    res.json(updatedEnv);
  } catch (error) {
    console.error('Error updating global env:', error);
    res.status(500).json({ error: 'Failed to update global environment variables' });
  }
});

export default router;
