// src/lib/redis.ts
import { createClient, RedisClientType } from 'redis';

declare global {
  var redisClient: RedisClientType | undefined;
}

// This creates a single, shared Redis client instance.
// In development, it reuses the cached `global.redisClient`.
// In production, `global.redisClient` is always undefined, so a new client is created.
const redisClient = global.redisClient ?? createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// This function ensures the client is connected before use.
async function getConnectedRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// In development, we attach the client to the global object to prevent
// multiple instances from being created due to Next.js's hot-reloading.
if (process.env.NODE_ENV !== 'production') {
  global.redisClient = redisClient;
}

export const redis = getConnectedRedisClient();