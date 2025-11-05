import type {
  LessonProgressAggregate as PrismaLessonProgressAggregate,
  PrismaClient,
} from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { LessonProgressAggregate } from '@shared/types/academy.types';
import type { LessonProgressRepository, RecordLessonProgressInput } from './LessonProgressRepository';

function mapAggregate(record: PrismaLessonProgressAggregate): LessonProgressAggregate {
  return {
    lessonId: record.lessonId as UUID,
    userId: record.userId as UUID,
    lastPositionSeconds: record.lastPositionSec,
    percentage: Number(record.percentage ?? 0),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies LessonProgressAggregate;
}

export class PrismaLessonProgressRepository implements LessonProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async recordTick(input: RecordLessonProgressInput): Promise<LessonProgressAggregate> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lessonProgressEvent.create({
        data: {
          lessonId: input.lessonId,
          userId: input.userId,
          positionSec: input.positionSeconds,
          occurredAt: new Date(input.occurredAt),
        },
      });

      const existing = await tx.lessonProgressAggregate.findUnique({
        where: {
          lessonId_userId: {
            lessonId: input.lessonId,
            userId: input.userId,
          },
        },
      });

      if (!existing) {
        const created = await tx.lessonProgressAggregate.create({
          data: {
            lessonId: input.lessonId,
            userId: input.userId,
            lastPositionSec: input.positionSeconds,
            percentage: input.percentage,
          },
        });
        return mapAggregate(created);
      }

      const updated = await tx.lessonProgressAggregate.update({
        where: {
          lessonId_userId: {
            lessonId: input.lessonId,
            userId: input.userId,
          },
        },
        data: {
          lastPositionSec: Math.max(existing.lastPositionSec, input.positionSeconds),
          percentage: Math.max(existing.percentage ?? 0, input.percentage),
        },
      });

      return mapAggregate(updated);
    });
  }

  async getAggregate(lessonId: UUID, userId: UUID): Promise<Nullable<LessonProgressAggregate>> {
    const record = await this.prisma.lessonProgressAggregate.findUnique({
      where: {
        lessonId_userId: {
          lessonId,
          userId,
        },
      },
    });
    return record ? mapAggregate(record) : null;
  }
}
