import type { FeatureAccessKey, MemberAccessOverride, UUID } from '@shared/types';

export interface SetAccessOverrideInput {
  userId: UUID;
  feature: FeatureAccessKey;
  enabled: boolean;
  permissions: string[];
  grantedBy: UUID;
  reason?: string;
}

export interface MemberAccessOverrideRepository {
  setOverride(input: SetAccessOverrideInput): Promise<MemberAccessOverride>;
  removeOverride(userId: UUID, feature: FeatureAccessKey): Promise<void>;
}
