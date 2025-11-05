import type { PrismaClient } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { EvolutionConfigRecord, HidraConfigRepository } from './HidraConfigRepository';

function mapConfig(record: {
  id: string;
  userId: string;
  baseUrl: string;
  apiKeyEncrypted: Buffer;
  status: string;
  errorMessage: string | null;
  connectedAt: Date | null;
  lastHealthCheckAt: Date | null;
}): EvolutionConfigRecord {
  return {
    id: record.id as UUID,
    userId: record.userId as UUID,
    baseUrl: record.baseUrl,
    apiKeyEncrypted: record.apiKeyEncrypted.toString('utf8'),
    status: record.status as EvolutionConfigRecord['status'],
    errorMessage: record.errorMessage,
    connectedAt: record.connectedAt ? record.connectedAt.toISOString() : null,
    lastHealthCheckAt: record.lastHealthCheckAt ? record.lastHealthCheckAt.toISOString() : null,
  } satisfies EvolutionConfigRecord;
}

export class PrismaHidraConfigRepository implements HidraConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: UUID): Promise<Nullable<EvolutionConfigRecord>> {
    const record = await this.prisma.evolutionApiConfig.findUnique({ where: { userId } });
    return record ? mapConfig(record) : null;
  }

  async updateStatus(id: UUID, status: EvolutionConfigRecord['status'], errorMessage?: Nullable<string>): Promise<void> {
    await this.prisma.evolutionApiConfig.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        connectedAt: status === 'connected' ? new Date() : undefined,
      },
    });
  }

  async upsertForUser(userId: UUID, config: { baseUrl: string; apiKeyEncrypted: string }): Promise<EvolutionConfigRecord> {
    const bufferKey = Buffer.from(config.apiKeyEncrypted, 'utf8');
    const record = await this.prisma.evolutionApiConfig.upsert({
      where: { userId },
      create: {
        userId,
        baseUrl: config.baseUrl,
        apiKeyEncrypted: bufferKey,
        status: 'disconnected',
      },
      update: {
        baseUrl: config.baseUrl,
        apiKeyEncrypted: bufferKey,
      },
    });
    return mapConfig(record);
  }

  async touchHealthCheck(id: UUID, timestampIso: string): Promise<void> {
    await this.prisma.evolutionApiConfig.update({
      where: { id },
      data: {
        lastHealthCheckAt: new Date(timestampIso),
      },
    });
  }
}
