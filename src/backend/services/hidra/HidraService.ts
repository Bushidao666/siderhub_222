import { z } from 'zod';
import type { UUID } from '@shared/types';
import type {
  CampaignDashboardSnapshot,
  CampaignDetail,
  CampaignMetrics,
  EvolutionApiConfig,
  HidraDashboardSummary,
} from '@shared/types/hidra.types';
import { CampaignChannel, CampaignStatus } from '@shared/types/common.types';
import { hydraConfigSchema } from '@utils/validation';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type {
  CampaignRepository,
  CampaignRunRepository,
  HidraConfigRepository,
  EvolutionConfigRecord,
} from '../../repositories/hidra';
import type { EncryptionService } from './EncryptionService';
import {
  EvolutionClient,
  type EvolutionCreateCampaignRequest,
  type EvolutionScheduleCampaignRequest,
} from './EvolutionClient';

const DEFAULT_EVOLUTION_TIMEOUT_MS = 10_000;
const DEFAULT_EVOLUTION_MAX_ATTEMPTS = 3;
const EVOLUTION_TIMEOUT_MIN_MS = 1_000;
const EVOLUTION_TIMEOUT_MAX_MS = 30_000;
const EVOLUTION_MAX_ATTEMPTS_MIN = 1;
const EVOLUTION_MAX_ATTEMPTS_MAX = 5;
const evolutionTimeoutSchema = z.number().int().min(EVOLUTION_TIMEOUT_MIN_MS).max(EVOLUTION_TIMEOUT_MAX_MS);
const evolutionMaxAttemptsSchema = z.number().int().min(EVOLUTION_MAX_ATTEMPTS_MIN).max(EVOLUTION_MAX_ATTEMPTS_MAX);

const createCampaignSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  segmentId: z.string().uuid(),
  templateId: z.string().uuid(),
  maxMessagesPerMinute: z.number().int().min(1).max(1000).default(60),
  scheduledAt: z.string().datetime().nullable().optional(),
  externalId: z.string().min(1).max(120).optional(),
});

const scheduleCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  initiatedBy: z.string().uuid(),
});

const campaignIdSchema = z.string().uuid();

export interface CreateCampaignInput {
  userId: UUID;
  name: string;
  description?: string;
  segmentId: UUID;
  templateId: UUID;
  maxMessagesPerMinute?: number;
  scheduledAt?: string | null;
  externalId?: string;
}

export interface ScheduleCampaignInput {
  campaignId: UUID;
  scheduledAt: string;
  initiatedBy: UUID;
}

export interface UpdateConfigInput {
  userId: UUID;
  baseUrl: string;
  apiKey: string;
  verifyConnection?: boolean;
}

export interface DashboardSummaryOptions {
  recentLimit?: number;
}

export interface HidraServiceDeps {
  hidraConfigRepository: HidraConfigRepository;
  campaignRepository: CampaignRepository;
  campaignRunRepository: CampaignRunRepository;
  encryptionService: EncryptionService;
  logger?: Logger;
  now?: () => Date;
  evolutionClientOptions?: {
    timeoutMs?: number;
    maxAttempts?: number;
  };
}

export class HidraService {
  private readonly logger: Logger;
  private readonly evolutionClientOptions: { timeoutMs: number; maxAttempts: number };

  constructor(private readonly deps: HidraServiceDeps) {
    this.logger = deps.logger ?? createLogger('HidraService');
    this.evolutionClientOptions = this.normalizeEvolutionClientOptions(deps.evolutionClientOptions);
  }

  async updateConfig(input: UpdateConfigInput): Promise<EvolutionApiConfig> {
    const payload = hydraConfigSchema.parse({ baseUrl: input.baseUrl, apiKey: input.apiKey });
    const encryptedKey = await this.deps.encryptionService.encrypt(payload.apiKey);

    const record = await this.deps.hidraConfigRepository.upsertForUser(input.userId, {
      baseUrl: payload.baseUrl,
      apiKeyEncrypted: encryptedKey,
    });

    const shouldVerify = input.verifyConnection ?? true;

    if (shouldVerify) {
      try {
        const client = this.createEvolutionClient({ baseUrl: payload.baseUrl, apiKey: payload.apiKey });
        const ok = await client.testConnection();
        const status = ok ? 'connected' : 'error';
        const errorMessage = ok ? null : 'health check failed';
        await this.deps.hidraConfigRepository.updateStatus(record.id, status, errorMessage);
        if (ok) {
          await this.deps.hidraConfigRepository.touchHealthCheck(record.id, this.nowIso());
        }
        this.logger.info('Hidra config updated', { userId: input.userId, status });
      } catch (error) {
        const message = (error as Error).message ?? 'connection verification failed';
        await this.deps.hidraConfigRepository.updateStatus(record.id, 'error', message);
        this.logger.error('Hidra config verification failed', { userId: input.userId, error: message });
      }
    } else {
      await this.deps.hidraConfigRepository.updateStatus(record.id, 'disconnected', null);
      this.logger.info('Hidra config stored without verification', { userId: input.userId });
    }

    const refreshed = await this.deps.hidraConfigRepository.findByUserId(input.userId);
    return this.toApiConfig(refreshed ?? record);
  }

  async testConnection(userId: UUID): Promise<boolean> {
    const { client, config } = await this.getClientForUser(userId);
    const ok = await client.testConnection();
    await this.deps.hidraConfigRepository.touchHealthCheck(config.id, this.nowIso());
    await this.deps.hidraConfigRepository.updateStatus(
      config.id,
      ok ? 'connected' : 'error',
      ok ? null : 'health check failed',
    );
    return ok;
  }

  async createCampaign(input: CreateCampaignInput): Promise<CampaignDetail> {
    const payload = createCampaignSchema.parse(input);

    if (payload.externalId) {
      const existing = await this.deps.campaignRepository.findByExternalId(payload.externalId);
      if (existing) {
        const detail = await this.deps.campaignRepository.findById(existing.id);
        if (detail) {
          return detail;
        }
      }
    }

    const { client } = await this.getClientForUser(payload.userId);

    const remotePayload: EvolutionCreateCampaignRequest = {
      name: payload.name,
      description: payload.description,
      segmentId: payload.segmentId,
      templateId: payload.templateId,
      rateLimit: payload.maxMessagesPerMinute,
      externalId: payload.externalId,
      scheduledAt: payload.scheduledAt ?? null,
    };

    const remote = await client.createCampaign(remotePayload);

    const campaign = await this.deps.campaignRepository.create({
      name: payload.name,
      description: payload.description ?? '',
      channel: CampaignChannel.WhatsApp,
      externalId: remote.id ?? payload.externalId,
      ownerId: payload.userId,
      segmentId: payload.segmentId,
      messageTemplateId: payload.templateId,
      maxMessagesPerMinute: payload.maxMessagesPerMinute ?? 60,
      scheduledFor: payload.scheduledAt ?? null,
    });

    if (remote.status) {
      await this.deps.campaignRepository.updateStatus(campaign.id, this.mapStatus(remote.status));
    }

    this.logger.info('Hidra campaign created', {
      campaignId: campaign.id,
      externalId: remote.id,
      userId: payload.userId,
    });

    const detail = await this.deps.campaignRepository.findById(campaign.id);
    if (!detail) {
      throw new AppError({ code: 'HIDRA_CAMPAIGN_NOT_FOUND', message: 'Campaign not found after creation', statusCode: 500 });
    }
    return detail;
  }

  async scheduleCampaign(input: ScheduleCampaignInput): Promise<CampaignDetail> {
    const payload = scheduleCampaignSchema.parse(input);
    const detail = await this.ensureCampaignWithExternalId(payload.campaignId);
    const { client } = await this.getClientForUser(detail.userId);

    const remotePayload: EvolutionScheduleCampaignRequest = {
      scheduledAt: payload.scheduledAt,
    };

    const remote = await client.scheduleCampaign(detail.externalId!, remotePayload);

    await this.deps.campaignRepository.updateStatus(detail.id, this.mapStatus(remote.status));
    await this.deps.campaignRunRepository.create({
      campaignId: detail.id,
      startedById: payload.initiatedBy,
      scheduledFor: payload.scheduledAt,
      externalJobId: remote.id,
    });

    this.logger.info('Hidra campaign scheduled', {
      campaignId: detail.id,
      externalId: detail.externalId,
      scheduledAt: payload.scheduledAt,
    });

    const updated = await this.deps.campaignRepository.findById(detail.id);
    if (!updated) {
      throw new AppError({ code: 'HIDRA_CAMPAIGN_NOT_FOUND', message: 'Campaign not found after scheduling', statusCode: 500 });
    }
    return updated;
  }

  async getCampaignMetrics(campaignId: UUID): Promise<CampaignMetrics> {
    const detail = await this.ensureCampaignWithExternalId(campaignId);
    const { client } = await this.getClientForUser(detail.userId);

    const remote = await client.getCampaignMetrics(detail.externalId!);
    const metrics: CampaignMetrics = {
      campaignId: detail.id,
      totalMessages: remote.total,
      delivered: remote.delivered,
      failed: remote.failed,
      pending: remote.pending,
      averageDeliveryMs: remote.averageDeliveryMs,
      lastUpdatedAt: remote.lastUpdatedAt ?? this.nowIso(),
    };

    await this.deps.campaignRepository.updateMetrics(detail.id, metrics);
    if (remote.status) {
      await this.deps.campaignRepository.updateStatus(detail.id, this.mapStatus(remote.status));
    }

    this.logger.debug('Hidra campaign metrics synced', {
      campaignId: detail.id,
      status: remote.status,
      delivered: remote.delivered,
    });

    return metrics;
  }

  async syncEvolutionStatus(campaignId: UUID): Promise<CampaignDetail> {
    campaignIdSchema.parse(campaignId);
    await this.getCampaignMetrics(campaignId);
    const detail = await this.deps.campaignRepository.findById(campaignId);
    if (!detail) {
      throw new AppError({ code: 'HIDRA_CAMPAIGN_NOT_FOUND', message: 'Campaign not found after sync', statusCode: 404 });
    }
    return detail;
  }

  async getCampaignDetail(id: UUID): Promise<CampaignDetail | null> {
    campaignIdSchema.parse(id);
    return this.deps.campaignRepository.findById(id);
  }

  async getDashboardSummary(userId: UUID, options: DashboardSummaryOptions = {}): Promise<HidraDashboardSummary> {
    const [configRecord, snapshot] = await Promise.all([
      this.deps.hidraConfigRepository.findByUserId(userId),
      this.deps.campaignRepository.getDashboardSnapshot(userId),
    ]);

    const normalized = this.normalizeDashboardSnapshot(snapshot, options.recentLimit);

    return {
      config: configRecord ? this.toApiConfig(configRecord) : null,
      totals: normalized.totals,
      messageSummary: normalized.messageSummary,
      recentCampaigns: normalized.recentCampaigns,
    } satisfies HidraDashboardSummary;
  }

  private normalizeDashboardSnapshot(snapshot: CampaignDashboardSnapshot | null | undefined, limit?: number): CampaignDashboardSnapshot {
    const safeSnapshot: CampaignDashboardSnapshot = snapshot ?? {
      totals: {
        totalCampaigns: 0,
        running: 0,
        scheduled: 0,
        paused: 0,
        completed: 0,
        failed: 0,
      },
      messageSummary: {
        totalMessages: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        averageDeliveryMs: 0,
        lastUpdatedAt: null,
      },
      recentCampaigns: [],
    };

    const rawLimit = limit ?? safeSnapshot.recentCampaigns.length;
    const effectiveLimit = Number.isFinite(rawLimit) && rawLimit >= 0
      ? Math.min(safeSnapshot.recentCampaigns.length, Math.floor(rawLimit))
      : safeSnapshot.recentCampaigns.length;

    const messageSummary = safeSnapshot.messageSummary.lastUpdatedAt
      ? { ...safeSnapshot.messageSummary }
      : { ...safeSnapshot.messageSummary, lastUpdatedAt: this.nowIso() };

    return {
      totals: { ...safeSnapshot.totals },
      messageSummary,
      recentCampaigns: safeSnapshot.recentCampaigns.slice(0, effectiveLimit),
    };
  }

  private toApiConfig(record: EvolutionConfigRecord): EvolutionApiConfig {
    return {
      id: record.id,
      userId: record.userId,
      baseUrl: record.baseUrl,
      apiKeyEncrypted: record.apiKeyEncrypted,
      status: record.status,
      errorMessage: record.errorMessage,
      connectedAt: record.connectedAt,
      lastHealthCheckAt: record.lastHealthCheckAt,
    } satisfies EvolutionApiConfig;
  }

  private async ensureCampaignWithExternalId(campaignId: UUID): Promise<CampaignDetail & { externalId: string }> {
    const detail = await this.deps.campaignRepository.findDetailWithExternalId(campaignId);
    if (!detail) {
      throw new AppError({ code: 'HIDRA_CAMPAIGN_NOT_FOUND', message: 'Campaign not found', statusCode: 404 });
    }
    if (!detail.externalId) {
      throw new AppError({ code: 'HIDRA_CAMPAIGN_MISSING_EXTERNAL_ID', message: 'Campaign missing Evolution reference', statusCode: 409 });
    }
    return detail as CampaignDetail & { externalId: string };
  }

  private mapStatus(remoteStatus: string): CampaignStatus {
    switch (remoteStatus.toLowerCase()) {
      case 'draft':
        return CampaignStatus.Draft;
      case 'scheduled':
        return CampaignStatus.Scheduled;
      case 'running':
        return CampaignStatus.Running;
      case 'paused':
        return CampaignStatus.Paused;
      case 'completed':
        return CampaignStatus.Completed;
      case 'failed':
        return CampaignStatus.Failed;
      default:
        return CampaignStatus.Draft;
    }
  }

  private async getClientForUser(userId: UUID): Promise<{ client: EvolutionClient; config: EvolutionConfigRecord }> {
    const config = await this.deps.hidraConfigRepository.findByUserId(userId);
    if (!config) {
      throw new AppError({ code: 'HIDRA_CONFIG_NOT_FOUND', message: 'Evolution configuration not found', statusCode: 404 });
    }

    const apiKey = await this.deps.encryptionService.decrypt(config.apiKeyEncrypted);
    const client = this.createEvolutionClient({ baseUrl: config.baseUrl, apiKey });
    return { client, config };
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  private nowIso(): string {
    return this.now().toISOString();
  }

  private createEvolutionClient({ baseUrl, apiKey }: { baseUrl: string; apiKey: string }): EvolutionClient {
    return new EvolutionClient({
      baseUrl,
      apiKey,
      timeoutMs: this.evolutionClientOptions.timeoutMs,
      maxAttempts: this.evolutionClientOptions.maxAttempts,
    });
  }

  private normalizeEvolutionClientOptions(options?: HidraServiceDeps['evolutionClientOptions']): { timeoutMs: number; maxAttempts: number } {
    let timeoutMs = DEFAULT_EVOLUTION_TIMEOUT_MS;
    let maxAttempts = DEFAULT_EVOLUTION_MAX_ATTEMPTS;

    if (options?.timeoutMs !== undefined) {
      const parsedTimeout = evolutionTimeoutSchema.safeParse(options.timeoutMs);
      if (parsedTimeout.success) {
        timeoutMs = parsedTimeout.data;
      } else {
        this.logger.warn('Invalid EvolutionClient timeout override provided; using defaults', {
          value: options.timeoutMs,
          min: EVOLUTION_TIMEOUT_MIN_MS,
          max: EVOLUTION_TIMEOUT_MAX_MS,
        });
      }
    }

    if (options?.maxAttempts !== undefined) {
      const parsedAttempts = evolutionMaxAttemptsSchema.safeParse(options.maxAttempts);
      if (parsedAttempts.success) {
        maxAttempts = parsedAttempts.data;
      } else {
        this.logger.warn('Invalid EvolutionClient maxAttempts override provided; using defaults', {
          value: options.maxAttempts,
          min: EVOLUTION_MAX_ATTEMPTS_MIN,
          max: EVOLUTION_MAX_ATTEMPTS_MAX,
        });
      }
    }

    return { timeoutMs, maxAttempts };
  }
}
