import { Job, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../logger';
import { getRedisConfigFromEnv } from '../connection';

const logger = createLogger('jobs:MetricsSyncWorker');

export function startMetricsSyncWorker(): Worker | null {
  const cfg = getRedisConfigFromEnv();
  if (!cfg) {
    logger.warn('Skipping MetricsSyncWorker (no REDIS_URL)');
    return null;
  }

  const prisma = new PrismaClient();

  type Payload = { scope: 'academy' | 'hidra' | 'cybervault' | 'admin' | 'all'; triggeredAt: string };

  const worker = new Worker<Payload>(
    'metrics-sync',
    async (job: Job<Payload>) => {
      logger.info('Processing metrics sync job', { jobId: job.id, scope: job.data.scope });

      try {
        const scope = job.data.scope;
        const metrics: Record<string, any> = {};

        // Academy metrics aggregation
        if (scope === 'academy' || scope === 'all') {
          const [
            totalCourses,
            totalLessons,
            totalUsers,
            totalEnrollments,
            completedCourses,
            avgProgress,
            totalComments,
            totalRatings,
          ] = await Promise.all([
            prisma.course.count(),
            prisma.lesson.count(),
            prisma.user.count(),
            prisma.courseProgress.count(),
            prisma.courseProgress.count({ where: { completionPercentage: 100 } }),
            prisma.courseProgress.aggregate({ _avg: { completionPercentage: true } }),
            prisma.lessonComment.count(),
            prisma.lessonRating.count(),
          ]);

          metrics.academy = {
            totalCourses,
            totalLessons,
            totalUsers,
            totalEnrollments,
            completedCourses,
            averageProgress: avgProgress._avg.completionPercentage ?? 0,
            totalComments,
            totalRatings,
            syncedAt: new Date().toISOString(),
          };

          logger.debug('Academy metrics aggregated', metrics.academy);
        }

        // Hidra (Campaign) metrics aggregation
        if (scope === 'hidra' || scope === 'all') {
          const [
            totalCampaigns,
            activeCampaigns,
            completedCampaigns,
            totalRuns,
            campaignsByStatus,
            metricsAgg,
          ] = await Promise.all([
            prisma.campaign.count(),
            prisma.campaign.count({ where: { status: { in: ['running', 'scheduled'] } } }),
            prisma.campaign.count({ where: { status: 'completed' } }),
            prisma.campaignRun.count(),
            prisma.campaign.groupBy({
              by: ['status'],
              _count: { status: true },
            }),
            prisma.campaignMetrics.aggregate({
              _sum: {
                totalMessages: true,
                delivered: true,
                failed: true,
                pending: true,
              },
              _avg: {
                averageDeliveryMs: true,
              },
            }),
          ]);

          metrics.hidra = {
            totalCampaigns,
            activeCampaigns,
            completedCampaigns,
            totalRuns,
            statusBreakdown: campaignsByStatus.reduce((acc, item) => {
              acc[item.status] = item._count.status;
              return acc;
            }, {} as Record<string, number>),
            totalMessages: metricsAgg._sum.totalMessages ?? 0,
            totalDelivered: metricsAgg._sum.delivered ?? 0,
            totalFailed: metricsAgg._sum.failed ?? 0,
            totalPending: metricsAgg._sum.pending ?? 0,
            avgDeliveryMs: metricsAgg._avg.averageDeliveryMs ?? 0,
            syncedAt: new Date().toISOString(),
          };

          logger.debug('Hidra metrics aggregated', metrics.hidra);
        }

        // Cybervault metrics aggregation
        if (scope === 'cybervault' || scope === 'all') {
          const [
            totalResources,
            publishedResources,
            totalDownloads,
            downloadsByType,
            resourcesByCategory,
          ] = await Promise.all([
            prisma.resource.count(),
            prisma.resource.count({ where: { visibility: 'public' } }),
            prisma.resourceDownloadLog.count(),
            prisma.resource.groupBy({
              by: ['fileType'],
              _count: { fileType: true },
            }),
            prisma.resource.groupBy({
              by: ['category'],
              _count: { category: true },
            }),
          ]);

          metrics.cybervault = {
            totalResources,
            publishedResources,
            totalDownloads,
            typeBreakdown: downloadsByType.reduce((acc, item) => {
              acc[item.fileType] = item._count.fileType;
              return acc;
            }, {} as Record<string, number>),
            categoryBreakdown: resourcesByCategory.reduce((acc, item) => {
              acc[item.category] = item._count.category;
              return acc;
            }, {} as Record<string, number>),
            syncedAt: new Date().toISOString(),
          };

          logger.debug('Cybervault metrics aggregated', metrics.cybervault);
        }

        // Admin metrics aggregation
        if (scope === 'admin' || scope === 'all') {
          const [
            totalUsers,
            activeUsers,
            totalSessions,
            activeSessions,
            totalInvitations,
            pendingInvitations,
            totalFeatureToggles,
            enabledToggles,
            totalBanners,
            activeBanners,
          ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
            prisma.session.count(),
            prisma.session.count({ where: { expiresAt: { gte: new Date() } } }),
            prisma.invitation.count(),
            prisma.invitation.count({ where: { status: 'pending' } }),
            prisma.featureToggle.count(),
            prisma.featureToggle.count({ where: { status: 'enabled' } }),
            prisma.heroBanner.count(),
            prisma.heroBanner.count({ where: { status: 'active' } }),
          ]);

          metrics.admin = {
            totalUsers,
            activeUsers,
            totalSessions,
            activeSessions,
            totalInvitations,
            pendingInvitations,
            totalFeatureToggles,
            enabledToggles,
            totalBanners,
            activeBanners,
            syncedAt: new Date().toISOString(),
          };

          logger.debug('Admin metrics aggregated', metrics.admin);
        }

        logger.info('Metrics sync completed', {
          scope: job.data.scope,
          modulesProcessed: Object.keys(metrics).length,
        });

        return {
          ok: true,
          processedAt: new Date().toISOString(),
          scope: job.data.scope,
          metrics,
        };
      } catch (error) {
        logger.error('Metrics sync failed', {
          scope: job.data.scope,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
    {
      connection: { url: cfg.url } as any,
      prefix: cfg.prefix,
      concurrency: 2,
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 }, // Keep 200 completed jobs, max 7 days
      removeOnFail: { count: 200, age: 14 * 24 * 3600 }, // Keep 200 failed jobs, max 14 days
    },
  );

  worker.on('error', (err) => logger.error('Worker error', { err }));
  worker.on('failed', (job, err) => {
    logger.warn('Job failed', {
      jobId: job?.id,
      scope: job?.data?.scope,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });
  worker.on('completed', (job) => {
    logger.debug('Job completed', {
      jobId: job.id,
      scope: job.data.scope,
    });
  });

  logger.info('MetricsSyncWorker started with concurrency=2');
  return worker;
}

