import { Router } from 'express';
import { getConfig, updateConfig, getScriptConfig, updateScriptConfig, getGlobalEnv, updateGlobalEnv } from '../services/configService.js';

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
    const config = await getScriptConfig(scriptName);
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
    const newConfig = req.body;
    const updatedConfig = await updateScriptConfig(scriptName, newConfig);
    res.json(updatedConfig);
  } catch (error) {
    console.error(`Error updating script config for ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to update script config' });
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
