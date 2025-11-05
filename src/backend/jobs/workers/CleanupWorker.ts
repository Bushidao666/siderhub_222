import { Job, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../logger';
import { getRedisConfigFromEnv } from '../connection';

const logger = createLogger('jobs:CleanupWorker');

// Cleanup thresholds
const EXPIRED_SESSIONS_DAYS = 30; // Remove sessions expired more than 30 days ago
const OLD_DOWNLOAD_LOGS_DAYS = 90; // Remove download logs older than 90 days
const COMPLETED_CAMPAIGNS_DAYS = 180; // Archive completed campaigns older than 180 days
const OLD_LESSON_PROGRESS_EVENTS_DAYS = 365; // Remove old progress events after 1 year

export function startCleanupWorker(): Worker | null {
  const cfg = getRedisConfigFromEnv();
  if (!cfg) {
    logger.warn('Skipping CleanupWorker (no REDIS_URL)');
    return null;
  }

  const prisma = new PrismaClient();

  type Payload = { target: 'sessions' | 'logs' | 'campaigns' | 'progress' | 'all'; triggeredAt: string };

  const worker = new Worker<Payload>(
    'cleanup',
    async (job: Job<Payload>) => {
      logger.info('Processing cleanup job', { jobId: job.id, target: job.data.target });

      try {
        const target = job.data.target;
        const results: Record<string, any> = {};

        // Clean up expired sessions
        if (target === 'sessions' || target === 'all') {
          const expiredSessionsDate = new Date();
          expiredSessionsDate.setDate(expiredSessionsDate.getDate() - EXPIRED_SESSIONS_DAYS);

          const deletedSessions = await prisma.session.deleteMany({
            where: {
              expiresAt: {
                lt: expiredSessionsDate,
              },
            },
          });

          results.sessions = {
            deleted: deletedSessions.count,
            olderThan: expiredSessionsDate.toISOString(),
          };

          logger.debug('Expired sessions cleaned', results.sessions);
        }

        // Clean up old download logs
        if (target === 'logs' || target === 'all') {
          const oldLogsDate = new Date();
          oldLogsDate.setDate(oldLogsDate.getDate() - OLD_DOWNLOAD_LOGS_DAYS);

          const deletedLogs = await prisma.resourceDownloadLog.deleteMany({
            where: {
              downloadedAt: {
                lt: oldLogsDate,
              },
            },
          });

          results.logs = {
            deleted: deletedLogs.count,
            olderThan: oldLogsDate.toISOString(),
          };

          logger.debug('Old download logs cleaned', results.logs);
        }

        // Clean up old completed campaigns (archive or delete based on requirements)
        if (target === 'campaigns' || target === 'all') {
          const oldCampaignsDate = new Date();
          oldCampaignsDate.setDate(oldCampaignsDate.getDate() - COMPLETED_CAMPAIGNS_DAYS);

          // Count old completed campaigns (for now just counting, not deleting)
          // In production, you might want to archive these to cold storage
          const oldCampaigns = await prisma.campaign.count({
            where: {
              status: 'completed',
              completedAt: {
                lt: oldCampaignsDate,
              },
            },
          });

          results.campaigns = {
            eligibleForArchive: oldCampaigns,
            olderThan: oldCampaignsDate.toISOString(),
            note: 'Campaigns not deleted, only counted for archival consideration',
          };

          logger.debug('Old campaigns identified for archival', results.campaigns);
        }

        // Clean up old lesson progress events (keep aggregates)
        if (target === 'progress' || target === 'all') {
          const oldProgressDate = new Date();
          oldProgressDate.setDate(oldProgressDate.getDate() - OLD_LESSON_PROGRESS_EVENTS_DAYS);

          const deletedEvents = await prisma.lessonProgressEvent.deleteMany({
            where: {
              occurredAt: {
                lt: oldProgressDate,
              },
            },
          });

          results.progress = {
            deleted: deletedEvents.count,
            olderThan: oldProgressDate.toISOString(),
            note: 'Progress aggregates preserved',
          };

          logger.debug('Old lesson progress events cleaned', results.progress);
        }

        // Clean up old invitations that have expired
        if (target === 'all') {
          const now = new Date();
          const deletedInvitations = await prisma.invitation.deleteMany({
            where: {
              status: 'pending',
              expiresAt: {
                lt: now,
              },
            },
          });

          results.invitations = {
            deleted: deletedInvitations.count,
            expiredBefore: now.toISOString(),
          };

          logger.debug('Expired invitations cleaned', results.invitations);
        }

        logger.info('Cleanup completed', {
          target: job.data.target,
          categoriesProcessed: Object.keys(results).length,
          totalItemsAffected: Object.values(results).reduce((sum, r: any) => sum + (r.deleted || 0), 0),
        });

        return {
          ok: true,
          processedAt: new Date().toISOString(),
          target: job.data.target,
          results,
        };
      } catch (error) {
        logger.error('Cleanup failed', {
          target: job.data.target,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
    {
      connection: { url: cfg.url } as any,
      prefix: cfg.prefix,
      concurrency: 1, // Run cleanup tasks sequentially
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 }, // Keep 200 completed jobs, max 7 days
      removeOnFail: { count: 200, age: 14 * 24 * 3600 }, // Keep 200 failed jobs, max 14 days
    },
  );

  worker.on('error', (err) => logger.error('Worker error', { err }));
  worker.on('failed', (job, err) => {
    logger.warn('Job failed', {
      jobId: job?.id,
      target: job?.data?.target,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });
  worker.on('completed', (job) => {
    logger.debug('Job completed', {
      jobId: job.id,
      target: job.data.target,
    });
  });

  logger.info('CleanupWorker started with concurrency=1');
  return worker;
}

