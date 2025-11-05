import type {
  Prisma,
  PrismaClient,
  Resource as PrismaResource,
  ResourceAsset as PrismaResourceAsset,
  ResourceTagAssignment as PrismaResourceTagAssignment,
  ResourceTag as PrismaResourceTag,
} from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { Resource } from '@shared/types/cybervault.types';
import type { ResourceListQuery, ResourceListResult, ResourceRepository } from './ResourceRepository';

interface PrismaResourceWithRelations extends PrismaResource {
  assets: PrismaResourceAsset[];
  tags: (PrismaResourceTagAssignment & { tag: PrismaResourceTag })[];
}

function mapResource(record: PrismaResourceWithRelations): Resource {
  return {
    id: record.id as UUID,
    slug: record.slug,
    title: record.title,
    description: record.description,
    type: record.type,
    categoryId: record.categoryId as UUID,
    tags: record.tags.map(({ tag }) => ({ id: tag.id as UUID, name: tag.name })),
    thumbnailUrl: record.thumbnailUrl ?? null,
    visibility: record.visibility,
    featured: record.featured,
    downloadCount: record.downloadCount,
    viewCount: record.viewCount,
    createdBy: record.createdById as UUID,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    assets: record.assets.map((asset) => ({
      id: asset.id as UUID,
      resourceId: asset.resourceId as UUID,
      fileUrl: asset.fileUrl,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    })),
  } satisfies Resource;
}

function buildSortClause(sortBy?: string, sortDirection?: 'asc' | 'desc') {
  if (!sortBy) {
    return [{ createdAt: 'desc' as const }];
  }

  const direction = sortDirection ?? 'desc';
  switch (sortBy) {
    case 'title':
      return [{ title: direction }];
    case 'downloadCount':
      return [{ downloadCount: direction }];
    case 'viewCount':
      return [{ viewCount: direction }];
    case 'updatedAt':
      return [{ updatedAt: direction }];
    default:
      return [{ createdAt: 'desc' as const }];
  }
}

export class PrismaResourceRepository implements ResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ResourceListQuery): Promise<ResourceListResult> {
    const where: Prisma.ResourceWhereInput = {};

    if (query.query) {
      where.OR = [
        { title: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.categoryIds?.length) {
      where.categoryId = { in: query.categoryIds };
    }

    if (query.tagIds?.length) {
      where.tags = {
        some: {
          tagId: { in: query.tagIds },
        },
      };
    }

    if (query.types?.length) {
      where.type = { in: query.types };
    }

    if (query.visibility) {
      where.visibility = query.visibility;
    }

    const skip = (query.page - 1) * query.pageSize;

    const [items, totalItems] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          assets: true,
          tags: { include: { tag: true } },
        },
        orderBy: buildSortClause(query.sortBy, query.sortDirection),
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      items: items.map((item) => mapResource(item as PrismaResourceWithRelations)),
      totalItems,
    } satisfies ResourceListResult;
  }

  async findBySlug(slug: string): Promise<Nullable<Resource>> {
    const resource = await this.prisma.resource.findUnique({
      where: { slug },
      include: {
        assets: true,
        tags: { include: { tag: true } },
      },
    });
    return resource ? mapResource(resource as PrismaResourceWithRelations) : null;
  }

  async findById(resourceId: UUID): Promise<Nullable<Resource>> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        assets: true,
        tags: { include: { tag: true } },
      },
    });
    return resource ? mapResource(resource as PrismaResourceWithRelations) : null;
  }

  async findFeatured(limit: number): Promise<Resource[]> {
    const resources = await this.prisma.resource.findMany({
      where: { featured: true },
      take: limit,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        assets: true,
        tags: { include: { tag: true } },
      },
    });
    return resources.map((item) => mapResource(item as PrismaResourceWithRelations));
  }

  async incrementDownloadCount(resourceId: UUID): Promise<void> {
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } },
    });
  }
}
