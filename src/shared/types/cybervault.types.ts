import { Nullable, ResourceType, UUID, Visibility } from './common.types';

export interface ResourceCategory {
  id: UUID;
  name: string;
  description: string;
  icon: string;
  order: number;
  createdAt: string;
}

export interface ResourceTag {
  id: UUID;
  name: string;
}

export interface ResourceAsset {
  id: UUID;
  resourceId: UUID;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Resource {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  type: ResourceType;
  categoryId: UUID;
  tags: ResourceTag[];
  thumbnailUrl: Nullable<string>;
  visibility: Visibility;
  featured: boolean;
  downloadCount: number;
  viewCount: number;
  createdBy: UUID;
  createdAt: string;
  updatedAt: string;
  assets: ResourceAsset[];
}

export interface ResourceDownloadLog {
  id: UUID;
  resourceId: UUID;
  userId: UUID;
  downloadedAt: string;
  ipAddress: string;
}

export interface ResourceDownloadReceipt {
  ok: true;
  totalDownloads: number;
  lastDownloadedAt: string;
}

export interface ResourceFilterParams {
  query?: string;
  categoryIds?: UUID[];
  tagIds?: UUID[];
  types?: ResourceType[];
  visibility?: Visibility;
}
