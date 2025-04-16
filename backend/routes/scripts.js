import { Router } from 'express';
import multer from 'multer';
import { chmod, unlink } from 'fs/promises';
import { listScripts, listScriptNames } from '../services/scriptService.js';
import { listSources } from '../services/sourcesService.js';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(process.cwd(), '.scripts-ui/scripts');
const ALLOWED_EXTENSIONS = ['.sh', '.js', '.ts'];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Get the source ID from the request, default to 'default' if not provided
      const sourceId = req.query.sourceId || 'default';

      // Get the source path
      const sources = await listSources();
      const source = sources.find(s => s.id === sourceId);

      if (!source) {
        return cb(new Error('Source not found'));
      }

      cb(null, source.path);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep original filename
  }
});

const fileFilter = (req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .js, .ts, and .sh files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 // 1MB limit
  }
});

const router = Router();

// List scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await listScripts();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list scripts' });
  }
});

// List script names only (for backward compatibility)
router.get('/names', async (req, res) => {
  try {
    const scriptNames = await listScriptNames();
    res.json(scriptNames);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list script names' });
  }
});

// Upload scripts
router.post('/upload', upload.array('scripts'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Get the source ID from the request, default to 'default' if not provided
    const sourceId = req.query.sourceId || 'default';

    // Get the source information
    const sources = await listSources();
    const source = sources.find(s => s.id === sourceId);

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Make uploaded shell scripts executable
    req.files.forEach(file => {
      if (file.originalname.endsWith('.sh')) {
        chmod(join(source.path, file.originalname), '755');
      }
    });

    res.json({
      message: 'Files uploaded successfully',
      files: req.files.map(f => ({
        name: f.originalname,
        source: {
          id: source.id,
          name: source.name
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Delete script
router.delete('/:script', async (req, res) => {
  try {
    const scriptName = req.params.script;
    const sourceId = req.query.sourceId || 'default';

    // Validate file extension
    const ext = extname(scriptName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Check if file exists in the specified source
    const scripts = await listScripts();
    const scriptToDelete = scripts.find(script =>
      script.name === scriptName && script.source.id === sourceId
    );

    if (!scriptToDelete) {
      return res.status(404).json({ error: 'Script not found in the specified source' });
    }

    // Get the source path
    const sources = await listSources();
    const source = sources.find(s => s.id === sourceId);

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    const scriptPath = join(source.path, scriptName);

    // Delete the file
    await unlink(scriptPath);
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

export default router;