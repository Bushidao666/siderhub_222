import { Job, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../logger';
import { getRedisConfigFromEnv } from '../connection';
import { HidraService } from '../../services/hidra/HidraService';
import { PrismaHidraConfigRepository, PrismaCampaignRepository, PrismaCampaignRunRepository } from '../../repositories/hidra';
import { CryptoEncryptionService, UnavailableEncryptionService } from '../../services/hidra/EncryptionService';

const logger = createLogger('jobs:CampaignDispatchWorker');

export function startCampaignDispatchWorker(): Worker | null {
  const cfg = getRedisConfigFromEnv();
  if (!cfg) {
    logger.warn('Skipping CampaignDispatchWorker (no REDIS_URL)');
    return null;
  }

  // Initialize dependencies for HidraService
  const prisma = new PrismaClient();
  const hidraConfigRepository = new PrismaHidraConfigRepository(prisma);
  const campaignRepository = new PrismaCampaignRepository(prisma);
  const campaignRunRepository = new PrismaCampaignRunRepository(prisma);

  // Initialize encryption service
  const HIDRA_ENCRYPTION_KEY = process.env.HIDRA_ENCRYPTION_KEY;
  let encryptionService = new UnavailableEncryptionService();
  if (HIDRA_ENCRYPTION_KEY) {
    try {
      encryptionService = new CryptoEncryptionService({ key: HIDRA_ENCRYPTION_KEY });
    } catch (error) {
      logger.error('Failed to initialize encryption service', { error });
    }
  }

  const hidraService = new HidraService({
    hidraConfigRepository,
    campaignRepository,
    campaignRunRepository,
    encryptionService,
    logger: createLogger('HidraService:Worker'),
  });

  type Payload = { campaignId: string; attemptedAt: string; userId?: string };

  const worker = new Worker<Payload>(
    'campaign-dispatch',
    async (job: Job<Payload>) => {
      logger.info('Processing campaign dispatch job', {
        jobId: job.id,
        campaignId: job.data.campaignId,
        attemptedAt: job.data.attemptedAt
      });

      try {
        // Get campaign details
        const campaign = await hidraService.getCampaignDetail(job.data.campaignId);

        if (!campaign) {
          logger.error('Campaign not found', { campaignId: job.data.campaignId });
          throw new Error(`Campaign ${job.data.campaignId} not found`);
        }

        // Check if campaign is in a valid state for dispatch
        if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
          logger.warn('Campaign not in valid state for dispatch', {
            campaignId: job.data.campaignId,
            status: campaign.status
          });
          return { ok: false, reason: 'invalid_state', status: campaign.status };
        }

        // Sync campaign status with Evolution API to get latest metrics
        await hidraService.syncEvolutionStatus(job.data.campaignId);

        // Create a campaign run record
        const userId = job.data.userId ?? campaign.userId;
        const runRecord = await campaignRunRepository.create({
          campaignId: campaign.id,
          startedById: userId,
          scheduledFor: campaign.scheduledAt ?? new Date().toISOString(),
          externalJobId: `job-${job.id}`,
        });

        logger.info('Campaign dispatch completed', {
          campaignId: job.data.campaignId,
          runId: runRecord.id,
          status: campaign.status,
        });

        return {
          ok: true,
          processedAt: new Date().toISOString(),
          campaignId: campaign.id,
          runId: runRecord.id,
          status: campaign.status,
        };
      } catch (error) {
        logger.error('Campaign dispatch failed', {
          campaignId: job.data.campaignId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
    {
      connection: { url: cfg.url } as any,
      prefix: cfg.prefix,
      concurrency: 4,
      removeOnComplete: { count: 200, age: 7 * 24 * 3600 }, // Keep 200 completed jobs, max 7 days
      removeOnFail: { count: 200, age: 14 * 24 * 3600 }, // Keep 200 failed jobs, max 14 days
    },
  );

  worker.on('error', (err) => logger.error('Worker error', { err }));
  worker.on('failed', (job, err) => {
    logger.warn('Job failed', {
      jobId: job?.id,
      campaignId: job?.data?.campaignId,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });
  worker.on('completed', (job) => {
    logger.debug('Job completed', {
      jobId: job.id,
      campaignId: job.data.campaignId,
    });
  });

  logger.info('CampaignDispatchWorker started with concurrency=4');
  return worker;
}

