import type { UUID } from '@shared/types';
import type { CampaignRun } from '@shared/types/hidra.types';

export interface CreateCampaignRunInput {
  campaignId: UUID;
  startedById: UUID;
  scheduledFor?: string | null;
  externalJobId?: string | null;
}

export interface CampaignRunRepository {
  create(input: CreateCampaignRunInput): Promise<CampaignRun>;
  recordCompletion(runId: UUID, result: { delivered: number; failed: number; completedAt: string }): Promise<void>;
}

