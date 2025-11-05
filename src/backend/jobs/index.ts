import type { Queue, Worker } from 'bullmq';
import { createQueues } from './queues';
import { startCampaignDispatchWorker } from './workers/CampaignDispatchWorker';
import { startMetricsSyncWorker } from './workers/MetricsSyncWorker';
import { startCleanupWorker } from './workers/CleanupWorker';
import { createLogger } from '../logger';

const logger = createLogger('jobs');

export type JobsRuntime = {
  queues: NonNullable<ReturnType<typeof createQueues>>;
  workers: (Worker | null)[];
};

export function initJobs(): JobsRuntime | null {
  const enabled = (process.env.BULLMQ_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    logger.info('BullMQ disabled by env (BULLMQ_ENABLED=false)');
    return null;
  }

  const queues = createQueues();
  if (!queues) {
    logger.warn('Queues not initialized (missing REDIS_URL). Skipping workers.');
    return null;
  }

  const workers = [startCampaignDispatchWorker(), startMetricsSyncWorker(), startCleanupWorker()];
  logger.info('Jobs runtime initialized');
  // Schedule basic recurring jobs (best-effort)
  try {
    const now = new Date().toISOString();
    // Metrics sync every 60s for all modules
    runtimeSafeAdd(queues.metrics, 'metrics:sync:all', { scope: 'all', triggeredAt: now }, { repeat: { every: 60_000 } });
    // Cleanup daily at 2 AM (using cron pattern)
    runtimeSafeAdd(queues.cleanup, 'cleanup:daily', { target: 'all', triggeredAt: now }, { repeat: { pattern: '0 2 * * *' } });
    logger.info('Recurring jobs scheduled', {
      metricsSyncInterval: '60s',
      cleanupSchedule: 'daily at 2 AM',
    });
  } catch (err) {
    logger.warn('Failed to schedule recurring jobs', { err });
  }
  return { queues, workers };
}

export async function shutdownJobs(runtime: JobsRuntime | null): Promise<void> {
  if (!runtime) return;
  try {
    for (const w of runtime.workers) {
      if (w) await w.close();
    }
    const q = runtime.queues;
    // Close queues, events, and schedulers
    const closers: Array<Promise<unknown>> = [];
    closers.push(q.campaign.close());
    closers.push(q.metrics.close());
    closers.push(q.cleanup.close());
    closers.push(q.events.campaign.close());
    closers.push(q.events.metrics.close());
    closers.push(q.events.cleanup.close());
    closers.push(q.schedulers.campaign.close());
    closers.push(q.schedulers.metrics.close());
    closers.push(q.schedulers.cleanup.close());
    await Promise.allSettled(closers);
    logger.info('Jobs runtime shut down');
  } catch (err) {
    logger.warn('Error shutting down jobs runtime', { err });
  }
}

// Helper to avoid unhandled rejections on fire-and-forget scheduling
function runtimeSafeAdd(
  queue: import('bullmq').Queue,
  name: string,
  data: any,
  opts: import('bullmq').JobsOptions,
): void {
  queue.add(name, data, opts).catch((err) => logger.warn('Queue.add failed', { queue: queue.name, err }));
}
