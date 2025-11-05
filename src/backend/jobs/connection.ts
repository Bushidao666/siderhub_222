import type { ConnectionOptions } from 'bullmq';
import { createLogger } from '../logger';

const logger = createLogger('jobs:connection');

export interface RedisConfig {
  url: string;
  prefix?: string;
}

export function getRedisConfigFromEnv(): RedisConfig | null {
  const url = process.env.REDIS_URL || process.env.BULLMQ_REDIS_URL;
  if (!url) {
    logger.warn('REDIS_URL is not configured. BullMQ disabled.');
    return null;
  }
  const prefix = process.env.REDIS_PREFIX || 'siderhub';
  return { url, prefix };
}

export function toBullmqConnection(config: RedisConfig): ConnectionOptions {
  // BullMQ accepts either an ioredis-compatible connection or a connection object
  // For simplicity, we pass the connection string via connection option
  return {
    connection: {
      url: config.url,
      maxRetriesPerRequest: null as unknown as number | null, // allow offline handling by BullMQ
    } as unknown as any,
    prefix: config.prefix,
  } as unknown as ConnectionOptions;
}

