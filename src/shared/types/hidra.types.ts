import { CampaignChannel, CampaignStatus, Nullable, UUID } from './common.types';

export interface EvolutionApiConfig {
  id: UUID;
  userId: UUID;
  baseUrl: string;
  apiKeyEncrypted: string;
  connectedAt: Nullable<string>;
  lastHealthCheckAt: Nullable<string>;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage: Nullable<string>;
}

export interface ContactSegment {
  id: UUID;
  name: string;
  description: string;
  importSource: 'csv_upload' | 'manual' | 'api';
  totalContacts: number;
  createdAt: string;
}

export interface MessageTemplate {
  id: UUID;
  title: string;
  body: string;
  variables: string[];
  mediaUrl: Nullable<string>;
}

export interface Campaign {
  id: UUID;
  userId: UUID;
  name: string;
  description: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  scheduledAt: Nullable<string>;
  startedAt: Nullable<string>;
  completedAt: Nullable<string>;
  segmentId: UUID;
  templateId: UUID;
  externalId: Nullable<string>;
  maxMessagesPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRun {
  id: UUID;
  campaignId: UUID;
  initiatedBy: UUID;
  startedAt: string;
  endedAt: Nullable<string>;
  status: CampaignStatus;
  summary: Nullable<string>;
}

export interface CampaignMetrics {
  campaignId: UUID;
  totalMessages: number;
  delivered: number;
  failed: number;
  pending: number;
  averageDeliveryMs: number;
  lastUpdatedAt: Nullable<string>;
}

export interface CampaignTimelinePoint {
  timestamp: string;
  delivered: number;
  failed: number;
}

export interface CampaignDetail extends Campaign {
  runHistory: CampaignRun[];
  metrics: CampaignMetrics;
  timeline: CampaignTimelinePoint[];
}

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  segmentId: UUID;
  templateId: UUID;
  maxMessagesPerMinute?: number;
  scheduledAt?: string | null;
  externalId?: string;
}

export interface UpdateEvolutionConfigRequest {
  baseUrl: string;
  apiKey: string;
  verifyConnection?: boolean;
}

export interface HidraDashboardTotals {
  totalCampaigns: number;
  running: number;
  scheduled: number;
  paused: number;
  completed: number;
  failed: number;
}

export interface HidraMessageSummary {
  totalMessages: number;
  delivered: number;
  failed: number;
  pending: number;
  averageDeliveryMs: number;
  lastUpdatedAt: Nullable<string>;
}

export interface CampaignDashboardSnapshot {
  totals: HidraDashboardTotals;
  messageSummary: HidraMessageSummary;
  recentCampaigns: CampaignDetail[];
}

export interface HidraDashboardSummary extends CampaignDashboardSnapshot {
  config: Nullable<EvolutionApiConfig>;
}
