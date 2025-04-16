import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import scriptsRouter from './routes/scripts.js';
import { executeScript } from './services/scriptService.js';

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../frontend')));

// Routes
app.use('/api/scripts', scriptsRouter);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.type === 'run') {
      executeScript(message.script, ws);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

export { app, wss };