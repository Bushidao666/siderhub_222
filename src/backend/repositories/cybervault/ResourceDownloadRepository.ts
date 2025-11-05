import type { UUID } from '@shared/types';

export interface RecordDownloadInput {
  resourceId: UUID;
  userId: UUID;
  ipAddress: string;
  downloadedAt: string;
}

export interface ResourceDownloadRepository {
  record(input: RecordDownloadInput): Promise<void>;
}
