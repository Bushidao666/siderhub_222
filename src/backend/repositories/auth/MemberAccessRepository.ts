import type { FeatureAccessKey, MemberAccessMap, UUID } from '@shared/types';

export interface MemberAccessRepository {
  getAccessMapByUser(userId: UUID): Promise<MemberAccessMap[]>;
  replaceAccessMap(userId: UUID, accessMap: MemberAccessMap[]): Promise<void>;
  enableFeature(userId: UUID, feature: FeatureAccessKey, permissions: string[]): Promise<void>;
}
