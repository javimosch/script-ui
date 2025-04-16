import { Router } from 'express';
import multer from 'multer';
import { chmod, unlink } from 'fs/promises';
import { listScripts } from '../services/scriptService.js';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(__dirname, '../../scripts');
const ALLOWED_EXTENSIONS = ['.sh', '.js'];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SCRIPTS_DIR);
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
    cb(new Error('Invalid file type. Only .js and .sh files are allowed.'));
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

// Upload scripts
router.post('/upload', upload.array('scripts'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Make uploaded shell scripts executable
    req.files.forEach(file => {
      if (file.originalname.endsWith('.sh')) {
        chmod(join(SCRIPTS_DIR, file.originalname), '755');
      }
    });

    res.json({ 
      message: 'Files uploaded successfully',
      files: req.files.map(f => f.originalname)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Delete script
router.delete('/:script', async (req, res) => {
  try {
    const scriptName = req.params.script;
    const scriptPath = join(SCRIPTS_DIR, scriptName);
    
    // Validate file extension
    const ext = extname(scriptName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Check if file exists in scripts directory
    const scripts = await listScripts();
    if (!scripts.includes(scriptName)) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Delete the file
    await unlink(scriptPath);
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

export default router;