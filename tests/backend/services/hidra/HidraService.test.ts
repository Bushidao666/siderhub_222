import type { CampaignDetail } from '@shared/types/hidra.types';
import type { UUID } from '@shared/types/common.types';
import { HidraService, type HidraServiceDeps } from 'src/backend/services/hidra/HidraService';
import { EvolutionClient } from 'src/backend/services/hidra/EvolutionClient';

const uuid = (value: string) => value as UUID;
const USER_ID = uuid('11111111-1111-4111-8111-111111111111');
const SEGMENT_ID = uuid('22222222-2222-4222-8222-222222222222');
const TEMPLATE_ID = uuid('33333333-3333-4333-8333-333333333333');
const CAMPAIGN_ID = uuid('44444444-4444-4444-8444-444444444444');
const EXISTING_CAMPAIGN_ID = uuid('55555555-5555-4555-8555-555555555555');
const ADMIN_ID = uuid('66666666-6666-4666-8666-666666666666');
const CONFIG_ID = uuid('77777777-7777-4777-8777-777777777777');

const baseConfig = {
  id: CONFIG_ID,
  userId: USER_ID,
  baseUrl: 'https://evolution.test',
  apiKeyEncrypted: 'encrypted',
  status: 'connected' as const,
  errorMessage: null,
  connectedAt: null,
  lastHealthCheckAt: null,
};

describe('HidraService', () => {
  const hidraConfigRepository = {
    findByUserId: jest.fn(),
    updateStatus: jest.fn(),
    touchHealthCheck: jest.fn(),
  };
  const campaignRepository = {
    findByExternalId: jest.fn(),
    findById: jest.fn(),
    findDetailWithExternalId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updateMetrics: jest.fn(),
  };
  const campaignRunRepository = {
    create: jest.fn(),
  };
  const encryptionService = {
    decrypt: jest.fn(),
  };

  let service: HidraService;
  let createCampaignSpy: jest.SpyInstance;
  let scheduleCampaignSpy: jest.SpyInstance;
  let getMetricsSpy: jest.SpyInstance;
  let testConnectionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    createCampaignSpy = jest.spyOn(EvolutionClient.prototype, 'createCampaign');
    scheduleCampaignSpy = jest.spyOn(EvolutionClient.prototype, 'scheduleCampaign');
    getMetricsSpy = jest.spyOn(EvolutionClient.prototype, 'getCampaignMetrics');
    testConnectionSpy = jest.spyOn(EvolutionClient.prototype, 'testConnection');
    hidraConfigRepository.findByUserId.mockResolvedValue(baseConfig);
    encryptionService.decrypt.mockResolvedValue('plain-key');
    createCampaignSpy.mockResolvedValue({ id: 'remote-1', status: 'scheduled' } as any);
    scheduleCampaignSpy.mockResolvedValue({ id: 'job-1', status: 'scheduled', scheduledAt: '2025-01-01T10:00:00Z' } as any);
    getMetricsSpy.mockResolvedValue({
      id: 'remote-1',
      status: 'running',
      total: 10,
      delivered: 8,
      failed: 1,
      pending: 1,
      averageDeliveryMs: 1200,
      lastUpdatedAt: '2025-01-01T12:00:00Z',
    });
    testConnectionSpy.mockResolvedValue(true);

    const deps: HidraServiceDeps = {
      hidraConfigRepository: hidraConfigRepository as any,
      campaignRepository: campaignRepository as any,
      campaignRunRepository: campaignRunRepository as any,
      encryptionService: encryptionService as any,
      now: () => new Date('2025-01-01T09:00:00Z'),
    };
    service = new HidraService(deps);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns existing campaign when externalId already registered', async () => {
    const existingDetail = {
      id: EXISTING_CAMPAIGN_ID,
      userId: USER_ID,
      name: 'Existing',
      description: 'Existing campaign',
      channel: 'whatsapp',
      status: 'draft',
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      segmentId: SEGMENT_ID,
      templateId: TEMPLATE_ID,
      maxMessagesPerMinute: 60,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      runHistory: [],
      metrics: {
        campaignId: EXISTING_CAMPAIGN_ID,
        totalMessages: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        averageDeliveryMs: 0,
        lastUpdatedAt: '2025-01-01T00:00:00Z',
      },
      timeline: [],
      externalId: 'external-1',
    } as CampaignDetail & { externalId: string };

    campaignRepository.findByExternalId.mockResolvedValue({ id: existingDetail.id } as any);
    campaignRepository.findById.mockResolvedValue(existingDetail);

    const result = await service.createCampaign({
      userId: USER_ID,
      name: 'Existing',
      segmentId: SEGMENT_ID,
      templateId: TEMPLATE_ID,
      externalId: 'external-1',
    });

    expect(campaignRepository.create).not.toHaveBeenCalled();
    expect(createCampaignSpy).not.toHaveBeenCalled();
    expect(result.id).toBe(existingDetail.id);
  });

  it('schedules new campaign and records run metadata', async () => {
    const detail = {
      id: CAMPAIGN_ID,
      userId: USER_ID,
      externalId: 'remote-1',
      name: 'Campaign',
      description: 'desc',
      channel: 'whatsapp',
      status: 'draft',
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      segmentId: SEGMENT_ID,
      templateId: TEMPLATE_ID,
      maxMessagesPerMinute: 60,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      runHistory: [],
      metrics: {
        campaignId: CAMPAIGN_ID,
        totalMessages: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        averageDeliveryMs: 0,
        lastUpdatedAt: '2025-01-01T00:00:00Z',
      },
      timeline: [],
    } as CampaignDetail & { externalId: string };

    campaignRepository.findDetailWithExternalId.mockResolvedValue(detail);
    campaignRepository.findById.mockResolvedValue(detail);

    const result = await service.scheduleCampaign({
      campaignId: detail.id,
      scheduledAt: '2025-01-02T12:00:00Z',
      initiatedBy: ADMIN_ID,
    });

    expect(scheduleCampaignSpy).toHaveBeenCalledWith('remote-1', { scheduledAt: '2025-01-02T12:00:00Z' });
    expect(campaignRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: detail.id,
        startedById: ADMIN_ID,
        scheduledFor: '2025-01-02T12:00:00Z',
      }),
    );
    expect(result.id).toBe(detail.id);
  });

  it('syncs metrics with Evolution API', async () => {
    const detail = {
      id: uuid('88888888-8888-4888-8888-888888888888'),
      userId: USER_ID,
      externalId: 'remote-1',
      name: 'Metrics',
      description: 'desc',
      channel: 'whatsapp',
      status: 'running',
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      segmentId: SEGMENT_ID,
      templateId: TEMPLATE_ID,
      maxMessagesPerMinute: 60,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      runHistory: [],
      metrics: {
        campaignId: uuid('88888888-8888-4888-8888-888888888888'),
        totalMessages: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        averageDeliveryMs: 0,
        lastUpdatedAt: '2025-01-01T00:00:00Z',
      },
      timeline: [],
    } as CampaignDetail & { externalId: string };

    campaignRepository.findDetailWithExternalId.mockResolvedValue(detail);
    campaignRepository.findById.mockResolvedValue(detail);

    const metrics = await service.getCampaignMetrics(detail.id);

    expect(getMetricsSpy).toHaveBeenCalledWith('remote-1');
    expect(campaignRepository.updateMetrics).toHaveBeenCalledWith(
      detail.id,
      expect.objectContaining({ delivered: 8, failed: 1, pending: 1 }),
    );
    expect(metrics.delivered).toBe(8);
  });
});
