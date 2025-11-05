import type { Nullable, PaginatedResponse, UUID } from '@shared/types';
import type { Resource, ResourceFilterParams } from '@shared/types/cybervault.types';

export interface ResourceListQuery extends ResourceFilterParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ResourceListResult {
  items: Resource[];
  totalItems: number;
}

export interface ResourceRepository {
  list(query: ResourceListQuery): Promise<ResourceListResult>;
  findBySlug(slug: string): Promise<Nullable<Resource>>;
  findById(resourceId: UUID): Promise<Nullable<Resource>>;
  findFeatured(limit: number): Promise<Resource[]>;
  incrementDownloadCount(resourceId: UUID): Promise<void>;
}
