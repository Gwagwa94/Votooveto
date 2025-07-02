// src/lib/redis.ts
import {createClient} from 'redis';

// This creates a single, shared Redis client instance.
// The `?.` syntax ensures this code only runs on the server, preventing errors.
const redisClient = global.redisClient ?? createClient({url: process.env.REDIS_URL});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// This function ensures the client is connected before use.
async function getConnectedRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// In development, we attach the client to the global object to prevent
// multiple instances being created due to Next.js's hot-reloading.
if (process.env.NODE_ENV !== 'production') {
  global.redisClient = redisClient;
}

export const redis = getConnectedRedisClient();