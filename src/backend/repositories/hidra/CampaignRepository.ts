import type { Nullable, UUID } from '@shared/types';
import type { CampaignDashboardSnapshot, CampaignDetail, Campaign, CampaignMetrics } from '@shared/types/hidra.types';

export interface CreateCampaignInput {
  name: string;
  description: string;
  channel: 'whatsapp';
  externalId?: string; // idempotency key with Evolution
  ownerId: UUID;
  segmentId: UUID;
  messageTemplateId: UUID;
  maxMessagesPerMinute: number;
  scheduledFor?: Nullable<string>;
}

export interface CampaignRepository {
  create(input: CreateCampaignInput): Promise<Campaign>;
  findByExternalId(externalId: string): Promise<Nullable<Campaign>>;
  findById(id: UUID): Promise<Nullable<CampaignDetail>>;
  findDetailWithExternalId(id: UUID): Promise<Nullable<CampaignDetail & { externalId: Nullable<string> }>>;
  updateStatus(id: UUID, status: Campaign['status']): Promise<void>;
  updateMetrics(id: UUID, metrics: CampaignMetrics): Promise<void>;
  getDashboardSnapshot(ownerId: UUID): Promise<CampaignDashboardSnapshot>;
}
