import { isIP } from 'node:net';
import { z } from 'zod';
import type { PaginatedResponse, UUID } from '@shared/types';
import { ResourceType, Visibility } from '@shared/types/common.types';
import type { Resource, ResourceDownloadReceipt } from '@shared/types/cybervault.types';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type {
  ResourceRepository,
  ResourceListQuery,
  ResourceDownloadRepository,
} from '../../repositories/cybervault';

const listResourcesSchema = z
  .object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(60).optional(),
    query: z.string().min(2).max(120).optional(),
    categoryIds: z.array(z.string().uuid()).max(10).optional(),
    tagIds: z.array(z.string().uuid()).max(10).optional(),
    types: z.array(z.nativeEnum(ResourceType)).max(10).optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    sortBy: z.string().min(1).max(64).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  })
  .default({});

const ipAddressSchema = z
  .string()
  .min(3)
  .max(45)
  .refine((value) => isIP(value) !== 0, 'Endereço IP inválido');

const recordDownloadSchema = z.object({
  resourceId: z.string().uuid(),
  userId: z.string().uuid(),
  ipAddress: ipAddressSchema,
});

const slugSchema = z.string().min(3).max(160);
const featuredLimitSchema = z.number().int().min(1).max(24).default(6);

export interface ListResourcesParams {
  page?: number;
  pageSize?: number;
  query?: string;
  categoryIds?: UUID[];
  tagIds?: UUID[];
  types?: ResourceType[];
  visibility?: Visibility;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface RecordDownloadParams {
  resourceId: UUID;
  userId: UUID;
  ipAddress: string;
}

export interface CybervaultServiceDeps {
  resourceRepository: ResourceRepository;
  resourceDownloadRepository: ResourceDownloadRepository;
  logger?: Logger;
  now?: () => Date;
}

export class CybervaultService {
  private readonly logger: Logger;

  constructor(private readonly deps: CybervaultServiceDeps) {
    this.logger = deps.logger ?? createLogger('CybervaultService');
  }

  async listResources(params: ListResourcesParams = {}): Promise<PaginatedResponse<Resource>> {
    const parsed = listResourcesSchema.parse(params);
    const query: ResourceListQuery = {
      page: parsed.page ?? 1,
      pageSize: parsed.pageSize ?? 12,
      query: parsed.query,
      categoryIds: parsed.categoryIds,
      tagIds: parsed.tagIds,
      types: parsed.types,
      visibility: parsed.visibility,
      sortBy: parsed.sortBy,
      sortDirection: parsed.sortDirection,
    } satisfies ResourceListQuery;

    const result = await this.deps.resourceRepository.list(query);
    const totalPages = query.pageSize === 0 ? 0 : Math.ceil(result.totalItems / query.pageSize);

    return {
      items: result.items,
      page: query.page,
      pageSize: query.pageSize,
      totalItems: result.totalItems,
      totalPages,
    } satisfies PaginatedResponse<Resource>;
  }

  async getBySlug(slug: string): Promise<Resource | null> {
    const parsedSlug = slugSchema.parse(slug);
    return this.deps.resourceRepository.findBySlug(parsedSlug);
  }

  async getFeaturedResources(limit = 6): Promise<Resource[]> {
    const parsedLimit = featuredLimitSchema.parse(limit);
    return this.deps.resourceRepository.findFeatured(parsedLimit);
  }

  async recordDownload(params: RecordDownloadParams): Promise<ResourceDownloadReceipt> {
    const payload = recordDownloadSchema.parse(params);
    const resource = await this.deps.resourceRepository.findById(payload.resourceId);
    if (!resource) {
      throw new AppError({ code: 'CYBERVAULT_RESOURCE_NOT_FOUND', message: 'Recurso não encontrado', statusCode: 404 });
    }

    const downloadedAt = this.nowIso();

    await this.deps.resourceDownloadRepository.record({
      resourceId: payload.resourceId,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
      downloadedAt,
    });

    await this.deps.resourceRepository.incrementDownloadCount(payload.resourceId);
    const updatedResource = await this.deps.resourceRepository.findById(payload.resourceId);

    this.logger.info('Cybervault download registrado', {
      resourceId: payload.resourceId,
      userId: payload.userId,
    });

    return {
      ok: true as const,
      totalDownloads: updatedResource?.downloadCount ?? resource.downloadCount + 1,
      lastDownloadedAt: downloadedAt,
    } satisfies ResourceDownloadReceipt;
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  private nowIso(): string {
    return this.now().toISOString();
  }
}
