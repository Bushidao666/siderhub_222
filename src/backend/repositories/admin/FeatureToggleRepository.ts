import type { FeatureToggle, UUID } from '@shared/types';

export interface FeatureToggleRepository {
  list(): Promise<FeatureToggle[]>;
  updateStatus(id: UUID, status: FeatureToggle['status'], rolloutPercentage?: number): Promise<FeatureToggle>;
}
