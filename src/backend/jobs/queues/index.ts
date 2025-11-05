import { Queue, QueueEvents, QueueScheduler } from 'bullmq';
import { createLogger } from '../../logger';
import { getRedisConfigFromEnv } from '../connection';

const logger = createLogger('jobs:queues');

export type QueueBundle = {
  campaign: Queue;
  metrics: Queue;
  cleanup: Queue;
  events: {
    campaign: QueueEvents;
    metrics: QueueEvents;
    cleanup: QueueEvents;
  };
  schedulers: {
    campaign: QueueScheduler;
    metrics: QueueScheduler;
    cleanup: QueueScheduler;
  };
};

export function createQueues(): QueueBundle | null {
  const cfg = getRedisConfigFromEnv();
  if (!cfg) {
    return null;
  }

  const common = {
    connection: { url: cfg.url } as any,
    prefix: cfg.prefix,
  } as const;

  // Create queues
  const campaign = new Queue('campaign-dispatch', {
    ...common,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5s
      },
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 }, // 7 days
      removeOnFail: { count: 200, age: 14 * 24 * 3600 }, // 14 days
    },
  });

  const metrics = new Queue('metrics-sync', {
    ...common,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 },
      removeOnFail: { count: 200, age: 14 * 24 * 3600 },
    },
  });

  const cleanup = new Queue('cleanup', {
    ...common,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 },
      removeOnFail: { count: 200, age: 14 * 24 * 3600 },
    },
  });

  // Create queue events
  const events = {
    campaign: new QueueEvents(campaign.name, common),
    metrics: new QueueEvents(metrics.name, common),
    cleanup: new QueueEvents(cleanup.name, common),
  } as const;

  // Create queue schedulers for delayed/repeated jobs
  const schedulers = {
    campaign: new QueueScheduler(campaign.name, common),
    metrics: new QueueScheduler(metrics.name, common),
    cleanup: new QueueScheduler(cleanup.name, common),
  } as const;

  // Minimal listeners to surface errors
  for (const [name, qe] of Object.entries(events)) {
    qe.on('failed', (evt) => logger.warn('Job failed', { queue: name, ...evt }));
    qe.on('error', (err) => logger.error('QueueEvents error', { queue: name, err }));
  }

  // Scheduler error listeners
  for (const [name, scheduler] of Object.entries(schedulers)) {
    scheduler.on('error', (err) => logger.error('QueueScheduler error', { queue: name, err }));
  }

  logger.info('BullMQ queues initialized with schedulers', { prefix: cfg.prefix });
  return { campaign, metrics, cleanup, events, schedulers };
}

