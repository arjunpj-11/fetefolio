import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (error: Error) => {
  if (env.NODE_ENV !== 'test') console.error('Redis client error', error.message);
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) await redisClient.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) await redisClient.quit();
};
