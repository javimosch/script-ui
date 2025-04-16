import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection variables
const USE_MONGODB = process.env.USE_MONGODB === 'true';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'scriptsui';

// MongoDB client instance
let client = null;
let db = null;

/**
 * Initialize MongoDB connection
 */
export const initMongoDB = async () => {
  if (!USE_MONGODB || !MONGODB_URI) {
    console.log('[MongoDB] MongoDB is not enabled or URI not provided');
    return false;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('[MongoDB] Connected successfully to MongoDB');
    return true;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    return false;
  }
};

/**
 * Get MongoDB database instance
 */
export const getDB = () => {
  if (!db) {
    throw new Error('MongoDB not initialized. Call initMongoDB first.');
  }
  return db;
};

/**
 * Check if MongoDB is enabled and connected
 */
export const isMongoDBEnabled = () => {
  return USE_MONGODB && db !== null;
};

/**
 * Close MongoDB connection
 */
export const closeMongoDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Connection closed');
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMongoDB();
  process.exit(0);
});
