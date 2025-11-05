import type { PrismaClient } from '@prisma/client';
import type { ResourceDownloadRepository, RecordDownloadInput } from './ResourceDownloadRepository';

export class PrismaResourceDownloadRepository implements ResourceDownloadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: RecordDownloadInput): Promise<void> {
    await this.prisma.resourceDownloadLog.create({
      data: {
        resourceId: input.resourceId,
        userId: input.userId,
        ipAddress: input.ipAddress,
        downloadedAt: new Date(input.downloadedAt),
      },
    });
  }
}
