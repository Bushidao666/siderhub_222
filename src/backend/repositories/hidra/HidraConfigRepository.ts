import type { Nullable, UUID } from '@shared/types';

export interface EvolutionConfigRecord {
  id: UUID;
  userId: UUID;
  baseUrl: string;
  apiKeyEncrypted: string;
  status: 'connected' | 'disconnected' | 'error';
  errorMessage: Nullable<string>;
  connectedAt: Nullable<string>;
  lastHealthCheckAt: Nullable<string>;
}

export interface HidraConfigRepository {
  findByUserId(userId: UUID): Promise<Nullable<EvolutionConfigRecord>>;
  updateStatus(id: UUID, status: EvolutionConfigRecord['status'], errorMessage?: Nullable<string>): Promise<void>;
  upsertForUser(userId: UUID, config: { baseUrl: string; apiKeyEncrypted: string }): Promise<EvolutionConfigRecord>;
  touchHealthCheck(id: UUID, timestampIso: string): Promise<void>;
}
