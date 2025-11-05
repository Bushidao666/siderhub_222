import { CybervaultService, type CybervaultServiceDeps } from 'src/backend/services/cybervault/CybervaultService';
import { AppError } from 'src/backend/errors/AppError';
import { ResourceType, Visibility } from '@shared/types/common.types';
import type { Resource } from '@shared/types/cybervault.types';
import type { UUID } from '@shared/types';

const uuid = (value: string) => value as UUID;
const NOW = new Date('2025-01-01T15:30:00Z');

const buildResource = (overrides: Partial<Resource> = {}): Resource => ({
  id: uuid('11111111-1111-4111-8111-111111111111'),
  slug: 'playbook-whatsapp',
  title: 'WhatsApp Playbook',
  description: 'Campanhas para Evolution',
  type: ResourceType.Playbook,
  categoryId: uuid('22222222-2222-4222-8222-222222222222'),
  tags: [],
  thumbnailUrl: null,
  visibility: Visibility.Members,
  featured: false,
  downloadCount: 12,
  viewCount: 120,
  createdBy: uuid('33333333-3333-4333-8333-333333333333'),
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  assets: [],
  ...overrides,
});

const createService = () => {
  const resourceRepository = {
    list: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    findFeatured: jest.fn(),
    incrementDownloadCount: jest.fn(),
  };
  const resourceDownloadRepository = {
    record: jest.fn(),
  };

  const deps: CybervaultServiceDeps = {
    resourceRepository: resourceRepository as any,
    resourceDownloadRepository: resourceDownloadRepository as any,
    now: () => NOW,
  };

  return {
    service: new CybervaultService(deps),
    resourceRepository,
    resourceDownloadRepository,
  };
};

describe('CybervaultService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists resources applying defaults and calculates total pages', async () => {
    const { service, resourceRepository } = createService();
    const resource = buildResource();
    resourceRepository.list.mockResolvedValue({ items: [resource], totalItems: 15 });

    const result = await service.listResources({ pageSize: 5 });

    expect(resourceRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 5,
        visibility: undefined,
      }),
    );
    expect(result).toEqual({
      items: [resource],
      page: 1,
      pageSize: 5,
      totalItems: 15,
      totalPages: 3,
    });
  });

  it('validates slug when fetching by slug', async () => {
    const { service, resourceRepository } = createService();
    const resource = buildResource();
    resourceRepository.findBySlug.mockResolvedValue(resource);

    await expect(service.getBySlug('playbook')).resolves.toBe(resource);
    await expect(service.getBySlug('no')).rejects.toThrow(); // slug < 3 chars
  });

  it('enforces featured limit defaults', async () => {
    const { service, resourceRepository } = createService();
    const featured = [
      buildResource({ id: uuid('44444444-4444-4444-8444-444444444444'), featured: true }),
    ];
    resourceRepository.findFeatured.mockResolvedValue(featured);

    const result = await service.getFeaturedResources();

    expect(resourceRepository.findFeatured).toHaveBeenCalledWith(6);
    expect(result).toEqual(featured);
  });

  it('records download and increments counters when resource exists', async () => {
    const { service, resourceRepository, resourceDownloadRepository } = createService();
    const resource = buildResource();
    resourceRepository.findById.mockResolvedValueOnce(resource);
    resourceRepository.findById.mockResolvedValueOnce({ ...resource, downloadCount: resource.downloadCount + 1 });

    const payload = {
      resourceId: resource.id,
      userId: uuid('55555555-5555-4555-8555-555555555555'),
      ipAddress: '203.0.113.5',
    };

    const result = await service.recordDownload(payload);

    expect(resourceDownloadRepository.record).toHaveBeenCalledWith({
      ...payload,
      downloadedAt: NOW.toISOString(),
    });
    expect(resourceRepository.incrementDownloadCount).toHaveBeenCalledWith(resource.id);
    expect(result).toEqual({
      ok: true,
      totalDownloads: resource.downloadCount + 1,
      lastDownloadedAt: NOW.toISOString(),
    });
  });

  it('throws when attempting to record download for unknown resource', async () => {
    const { service, resourceRepository } = createService();
    resourceRepository.findById.mockResolvedValue(null);

    const rejection = service.recordDownload({
      resourceId: uuid('66666666-6666-4666-8666-666666666666'),
      userId: uuid('55555555-5555-4555-8555-555555555555'),
      ipAddress: '198.51.100.24',
    });

    await expect(rejection).rejects.toBeInstanceOf(AppError);
    await expect(rejection).rejects.toMatchObject({
      code: 'CYBERVAULT_RESOURCE_NOT_FOUND',
      statusCode: 404,
    });
  });
});
