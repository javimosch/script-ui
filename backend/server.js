import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import scriptsRouter from './routes/scripts.js';
import sourcesRouter from './routes/sources.js';
import configRouter from './routes/config.js';
import { executeScript } from './services/scriptService.js';
import { initMongoDB, isMongoDBEnabled } from './services/mongoService.js';
import { initSources } from './services/sourcesService.js';

// Initialize environment variables
dotenv.config();

// Set up process error handlers
process.on('uncaughtException', (error) => {
  console.error(`[Process] Uncaught exception: ${error.message}`);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[Process] Unhandled rejection at:`, promise);
  console.error(`[Process] Reason:`, reason);
});

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
app.use('/api/sources', sourcesRouter);
app.use('/api/config', configRouter);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, request) => {
  console.log(`[WebSocket] Client connected from ${request.socket.remoteAddress}`);

  // Add error handler for WebSocket
  ws.on('error', (error) => {
    console.error(`[WebSocket] Error: ${error.message}`);
  });

  ws.on('message', async (data) => {
    try {
      console.log(`[WebSocket] Received message: ${data}`);
      const message = JSON.parse(data);

      if (message.type === 'run') {
        console.log(`[WebSocket] Run request for script: ${message.script}`);

        // Sanitize and prepare environment variables and arguments
        const config = {
          ...message.config,
          env: Object.entries(message.config.env || {}).reduce((acc, [key, value]) => {
            // Convert all values to strings for Deno
            acc[key] = String(value);
            return acc;
          }, {}),
          // Include script arguments if provided
          args: message.config.args || ''
        };

        console.log(`[WebSocket] Executing script with config:`, JSON.stringify(config));
        executeScript(message.script, ws, config);
      } else {
        console.warn(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WebSocket] Error processing message: ${error.message}`);
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({ type: 'error', data: `Server error: ${error.message}` }));
      }
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[WebSocket] Client disconnected with code ${code}${reason ? `, reason: ${reason}` : ''}`);
  });
});

// Initialize services
const initializeServices = async () => {
  // Try to initialize MongoDB
  const mongoInitialized = await initMongoDB();
  if (mongoInitialized) {
    console.log('[Server] MongoDB persistence enabled');
  } else {
    console.log('[Server] Using file-based persistence');
  }

  // Initialize sources (and migrate if needed)
  await initSources();
  console.log('[Server] Sources initialized');
};

// Start server
const server = app.listen(port, async () => {
  console.log(`[Server] Server running on port ${port}`);
  console.log(`[Server] Node.js version: ${process.version}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize services after server starts
  await initializeServices();
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  console.log(`[Server] WebSocket upgrade request from ${request.socket.remoteAddress}`);

  // Handle potential errors during upgrade
  socket.on('error', (error) => {
    console.error(`[Server] Socket error during upgrade: ${error.message}`);
  });

  try {
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log(`[Server] WebSocket connection established`);
      wss.emit('connection', ws, request);
    });
  } catch (error) {
    console.error(`[Server] Error during WebSocket upgrade: ${error.message}`);
    socket.destroy();
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error(`[Server] Server error: ${error.message}`);
});

export { app, wss };
