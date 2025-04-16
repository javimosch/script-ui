import { Router } from 'express';
import { listSources, addSource, updateSource, deleteSource } from '../services/sourcesService.js';

const router = Router();

// List all sources
router.get('/', async (req, res) => {
  try {
    const sources = await listSources();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sources' });
  }
});

// Add new source
router.post('/', async (req, res) => {
  try {
    const { name, path } = req.body;
    if (!name || !path) {
      return res.status(400).json({ error: 'Name and path are required' });
    }
    const source = await addSource({ name, path });
    res.status(201).json(source);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add source' });
  }
});

// Update source
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, path } = req.body;
    const source = await updateSource(id, { name, path });
    res.json(source);
  } catch (error) {
    if (error.message === 'Source not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Cannot modify default source') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update source' });
    }
  }
});

// Delete source
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSource(id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Source not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Cannot delete default source') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete source' });
    }
  }
});

export default router;